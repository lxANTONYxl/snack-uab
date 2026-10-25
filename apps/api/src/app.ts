import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { z, ZodError } from 'zod';
import { and, eq, gt } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
import { users, sessions, categories, products } from './schema';
import { DomainError, productInput, saleInput, today } from './domain';
import { productRows, confirmSale, voidSale, saleDetail, report, exportSales } from './services';

type User = { id: string; name: string; email: string; role: string };
export const app = new Hono<{ Variables: { user: User } }>();
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const attempts = new Map<string, { count: number; until: number }>();
app.use('*', secureHeaders());
app.use('/api/*', bodyLimit({ maxSize: 64 * 1024, onError: c => c.json({ error: 'La solicitud es demasiado grande.' }, 413) }));
app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin');
    const expected = process.env.APP_ORIGIN || 'http://127.0.0.1:5173';
    if (origin !== expected) return c.json({ error: 'Origen de solicitud no permitido.' }, 403);
    if (!c.req.header('content-type')?.startsWith('application/json')) return c.json({ error: 'Se requiere contenido JSON.' }, 415);
  }
  await next();
});
app.onError((error, c) => {
  if (error instanceof ZodError) return c.json({ error: error.issues[0]?.message || 'Datos inválidos.' }, 400);
  if (error instanceof SyntaxError) return c.json({ error: 'JSON inválido.' }, 400);
  if (error instanceof DomainError) return c.json({ error: error.message }, error.status as 400);
  const code = (error as any).cause?.code || (error as any).code;
  if (code === '23505') return c.json({ error: 'El código o nombre ya está registrado.' }, 409);
  if (code === '23503') return c.json({ error: 'El registro relacionado no existe.' }, 400);
  console.error('Error de API:', error.message);
  return c.json({ error: 'No se pudo completar la operación. Revisa la conexión e inténtalo de nuevo.' }, 500);
});
app.get('/api/health', async c => { await db.select({ id: categories.id }).from(categories).limit(1); return c.json({ ok: true }); });
app.post('/api/auth/login', async c => {
  const data = z.object({ email: z.string().email().transform(s => s.toLowerCase()), password: z.string().min(1).max(200) }).parse(await c.req.json());
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const attempt = attempts.get(data.email);
  if ((attempt?.count || 0) >= 10) return c.json({ error: 'Demasiados intentos. Espera 15 minutos.' }, 429);
  const [user] = await db.select().from(users).where(and(eq(users.email, data.email), eq(users.active, true)));
  if (!user || !(await Bun.password.verify(data.password, user.passwordHash))) {
    if (attempts.size > 10000) attempts.clear();
    attempts.set(data.email, { count: (attempt?.count || 0) + 1, until: attempt?.until || now + 15 * 60_000 });
    return c.json({ error: 'Correo o contraseña incorrectos.' }, 401);
  }
  attempts.delete(data.email);
  const old = getCookie(c, 'snack_session');
  if (old) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(old)));
  const token = randomBytes(32).toString('hex');
  await db.insert(sessions).values({ tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(now + 8 * 3600_000) });
  setCookie(c, 'snack_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/', maxAge: 8 * 3600 });
  return c.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
app.use('/api/*', async (c, next) => {
  const token = getCookie(c, 'snack_session');
  if (!token) return c.json({ error: 'Inicia sesión para continuar.' }, 401);
  const [session] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)));
  if (!session) return c.json({ error: 'Tu sesión terminó. Vuelve a ingresar.' }, 401);
  c.set('user', session);
  await next();
});
app.get('/api/auth/me', c => c.json(c.get('user')));
app.post('/api/auth/logout', async c => {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(getCookie(c, 'snack_session')!)));
  deleteCookie(c, 'snack_session', { path: '/' });
  return c.json({ ok: true });
});
app.use('/api/*', async (c, next) => {
  const role = c.get('user').role;
  if (role === 'seller' && !['/api/products', '/api/categories'].includes(c.req.path)) return c.json({ error: 'No tienes permiso para esta operación.' }, 403);
  if (role !== 'admin' && c.req.method !== 'GET' && (c.req.path.startsWith('/api/products') || c.req.path.startsWith('/api/categories') || c.req.path.endsWith('/void'))) return c.json({ error: 'Esta operación requiere un administrador.' }, 403);
  await next();
});
app.get('/api/categories', async c => c.json(await db.select().from(categories).orderBy(categories.name)));
app.post('/api/categories', async c => {
  const data = z.object({ name: z.string().trim().min(2).max(60) }).parse(await c.req.json());
  const [row] = await db.insert(categories).values(data).returning(); return c.json(row, 201);
});
app.get('/api/products', async c => c.json(await productRows()));
app.post('/api/products', async c => {
  const data = productInput.parse(await c.req.json());
  const [row] = await db.insert(products).values(data).returning(); return c.json(row, 201);
});
app.put('/api/products/:id', async c => {
  const id = z.string().uuid().parse(c.req.param('id'));
  const data = productInput.parse(await c.req.json());
  const [row] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  if (!row) throw new DomainError('Producto no encontrado.', 404);
  return c.json(row);
});
app.post('/api/sales', async c => c.json(await confirmSale(saleInput.parse(await c.req.json()), c.get('user').id), 201));
app.get('/api/sales/:id', async c => c.json(await saleDetail(z.string().uuid().parse(c.req.param('id')))));
app.post('/api/sales/:id/void', async c => {
  const id = z.string().uuid().parse(c.req.param('id'));
  const { reason } = z.object({ reason: z.string().trim().min(5, 'Explica el motivo con al menos cinco caracteres.').max(300) }).parse(await c.req.json());
  return c.json(await voidSale(id, reason, c.get('user').id));
});
app.get('/api/reports', async c => c.json(await report(c.req.query('from') || today(), c.req.query('to') || today())));
app.get('/api/reports/export', async c => {
  const from = c.req.query('from') || today(); const to = c.req.query('to') || today();
  const csv = await exportSales(from, to);
  c.header('Content-Type', 'text/csv; charset=utf-8'); c.header('Content-Disposition', `attachment; filename="ventas-${from}-${to}.csv"`);
  return c.body(csv);
});
app.all('/api/*', c => c.json({ error: 'Recurso no encontrado.' }, 404));
