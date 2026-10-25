import { beforeAll, afterAll, describe, expect, test } from 'bun:test';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq, inArray } from 'drizzle-orm';
import { users, sales } from '../apps/api/src/schema';

// Cada ejecución crea una base exclusiva. Nunca borra la base configurada por el usuario.
const databaseName = `snack_uab_test_${crypto.randomUUID().replaceAll('-', '')}`;
const originalUrl = process.env.DATABASE_URL!;
const admin = postgres(originalUrl, { max: 1 });
let app: typeof import('../apps/api/src/app').app;
let db: typeof import('../apps/api/src/db').db;
let client: typeof import('../apps/api/src/db').client;
let cookie = '',
  cashierCookie = '',
  sellerCookie = '',
  categoryId = '',
  productId = '',
  cashId = '',
  qrId = '';
const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173';
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  session = cookie,
  requestOrigin = origin,
) {
  return app.request(`http://127.0.0.1:3001/api${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin: requestOrigin, cookie: session },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const item = (quantity: number, expectedPrice = '5.00') => [{ productId, quantity, expectedPrice }];
async function createSale(
  method: 'cash' | 'qr',
  quantity: number,
  requestId = crypto.randomUUID(),
) {
  return request('/sales', 'POST', {
    requestId,
    method,
    items: item(quantity),
    ...(method === 'cash'
      ? { received: '100.00' }
      : { qrConfirmed: true, reference: 'PRUEBA-LOCAL' }),
  });
}
beforeAll(async () => {
  await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
  const url = new URL(originalUrl);
  url.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = url.toString();
  ({ db, client } = await import('../apps/api/src/db'));
  await migrate(db, { migrationsFolder: './drizzle' });
  ({ app } = await import('../apps/api/src/app'));
  for (const role of ['admin', 'cashier', 'seller']) {
    await db
      .insert(users)
      .values({
        name: `Prueba ${role}`,
        email: `${role}@tests.local`,
        passwordHash: await Bun.password.hash('SoloPruebas2026!'),
        role,
      });
    const response = await request(
      '/auth/login',
      'POST',
      { email: `${role}@tests.local`, password: 'SoloPruebas2026!' },
      '',
    );
    expect(response.status).toBe(200);
    const token = response.headers.get('set-cookie')!.split(';')[0];
    if (role === 'admin') cookie = token;
    if (role === 'cashier') cashierCookie = token;
    if (role === 'seller') sellerCookie = token;
  }
}, 30000);
afterAll(async () => {
  if (client) await client.end();
  if (!/^snack_uab_test_[a-f0-9]{32}$/.test(databaseName))
    throw new Error('Nombre de base de prueba inválido.');
  await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  await admin.end();
  process.env.DATABASE_URL = originalUrl;
});

describe('API con PostgreSQL real', () => {
  test('rechaza acceso anónimo y solicitudes de otro origen', async () => {
    expect((await request('/products', 'GET', undefined, '')).status).toBe(401);
    expect(
      (await request('/categories', 'POST', { name: 'Intruso' }, cookie, 'http://otro-sitio.local'))
        .status,
    ).toBe(403);
  });
  test('crea categoría y producto y bloquea códigos duplicados', async () => {
    const category = await request('/categories', 'POST', { name: 'Pruebas' });
    expect(category.status).toBe(201);
    categoryId = (await category.json()).id;
    const body = { code: 'test-1', name: 'Producto de prueba', categoryId, price: '5.00' };
    const product = await request('/products', 'POST', body);
    expect(product.status).toBe(201);
    productId = (await product.json()).id;
    expect((await request('/products', 'POST', body)).status).toBe(409);
  });
  test('aplica permisos del cajero y vendedor en la API', async () => {
    expect(
      (
        await request(
          '/products',
          'POST',
          { code: 'X', name: 'Producto', categoryId, price: '5' },
          cashierCookie,
        )
      ).status,
    ).toBe(403);
    expect((await request('/reports', 'GET', undefined, sellerCookie)).status).toBe(403);
    expect((await request('/products', 'GET', undefined, sellerCookie)).status).toBe(200);
  });
  test('rechaza cantidades inválidas, efectivo insuficiente y QR sin verificar', async () => {
    expect(
      (
        await request('/sales', 'POST', {
          requestId: crypto.randomUUID(),
          method: 'cash',
          received: '1',
          items: item(2),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request('/sales', 'POST', {
          requestId: crypto.randomUUID(),
          method: 'qr',
          items: item(1),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request('/sales', 'POST', {
          requestId: crypto.randomUUID(),
          method: 'cash',
          received: '100',
          items: item(-1),
        })
      ).status,
    ).toBe(400);
  });
  test('registra efectivo y QR conservando precios y el total correcto', async () => {
    const cash = await createSale('cash', 2);
    expect(cash.status).toBe(201);
    const c = await cash.json();
    cashId = c.id;
    expect(c.total).toBe('10.00');
    const qr = await createSale('qr', 3);
    expect(qr.status).toBe(201);
    const q = await qr.json();
    qrId = q.id;
    expect(q.total).toBe('15.00');
    await db
      .update(sales)
      .set({ confirmedAt: new Date('2026-01-15T12:00:00Z') })
      .where(inArray(sales.id, [cashId, qrId]));
    const detail = await (await request(`/sales/${cashId}`)).json();
    expect(detail.items[0].unitPrice).toBe('5.00');
    expect(detail.payment.received).toBe('100.00');
  });
  test('consolida Bs 25,00, separa efectivo y QR, y cuenta unidades', async () => {
    const response = await request('/reports?from=2026-01-15&to=2026-01-15');
    expect(response.status).toBe(200);
    const r = await response.json();
    expect(Number(r.total)).toBe(25);
    expect(Number(r.cash)).toBe(10);
    expect(Number(r.qr)).toBe(15);
    expect(r.count).toBe(2);
    expect(r.units).toBe(5);
  });
  test('el cambio de precio no altera el historial y bloquea carritos desactualizados', async () => {
    await request(`/products/${productId}`, 'PUT', {
      code: 'TEST-1',
      name: 'Nombre actualizado',
      categoryId,
      price: '7.00',
      active: true,
    });
    expect((await createSale('cash', 1)).status).toBe(409);
    const detail = await (await request(`/sales/${cashId}`)).json();
    expect(detail.items[0].unitPrice).toBe('5.00');
    expect(detail.items[0].productName).toBe('Producto de prueba');
    await request(`/products/${productId}`, 'PUT', {
      code: 'TEST-1',
      name: 'Producto de prueba',
      categoryId,
      price: '5.00',
      active: true,
    });
  });
  test('envíos simultáneos del mismo cobro crean solo una venta', async () => {
    const id = crypto.randomUUID();
    const responses = await Promise.all([createSale('cash', 1, id), createSale('cash', 1, id)]);
    const [a, b] = await Promise.all(responses.map((r) => r.json()));
    expect(a.id).toBe(b.id);
    expect(a.id).toBeDefined();
    expect((await db.select().from(sales).where(eq(sales.requestId, id))).length).toBe(1);
    expect((await createSale('cash', 2, id)).status).toBe(409);
  });
  test('desactivar impide vender pero mantiene el detalle histórico', async () => {
    await request(`/products/${productId}`, 'PUT', {
      code: 'TEST-1',
      name: 'Producto de prueba',
      categoryId,
      price: '5',
      active: false,
    });
    expect((await createSale('cash', 1)).status).toBe(400);
    expect((await request(`/sales/${cashId}`)).status).toBe(200);
    await request(`/products/${productId}`, 'PUT', {
      code: 'TEST-1',
      name: 'Producto de prueba',
      categoryId,
      price: '5',
      active: true,
    });
  });
  test('anula una venta y la excluye del reporte sin eliminarla', async () => {
    expect(
      (
        await request(
          `/sales/${qrId}/void`,
          'POST',
          { reason: 'Operación resuelta con el cliente' },
          cashierCookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (await request(`/sales/${qrId}/void`, 'POST', { reason: 'Prueba de anulación' })).status,
    ).toBe(200);
    const r = await (await request('/reports?from=2026-01-15&to=2026-01-15')).json();
    expect(Number(r.total)).toBe(10);
    expect(Number(r.qr)).toBe(0);
    expect(r.count).toBe(1);
    expect(r.rows.length).toBe(2);
    const detail = await (await request(`/sales/${qrId}`)).json();
    expect(detail.status).toBe('void');
    expect(detail.payment.status).toBe('void');
    expect(detail.voidReason).toBe('Prueba de anulación');
    expect(
      (await request(`/sales/${qrId}/void`, 'POST', { reason: 'Prueba repetida' })).status,
    ).toBe(409);
  });
  test('respeta las fronteras de fecha local y un día sin ventas', async () => {
    const a = await (await createSale('cash', 1)).json();
    const b = await (await createSale('cash', 1)).json();
    await db
      .update(sales)
      .set({ confirmedAt: new Date('2026-02-04T03:59:59Z') })
      .where(eq(sales.id, a.id));
    await db
      .update(sales)
      .set({ confirmedAt: new Date('2026-02-04T04:00:00Z') })
      .where(eq(sales.id, b.id));
    const r = await (await request('/reports?from=2026-02-03&to=2026-02-03')).json();
    expect(r.count).toBe(1);
    expect(r.rows[0].id).toBe(a.id);
    const empty = await (await request('/reports?from=2020-01-01&to=2020-01-01')).json();
    expect(empty.count).toBe(0);
    expect(Number(empty.total)).toBe(0);
    expect((await request('/reports?from=2026-02-30&to=2026-03-01')).status).toBe(400);
  });
  test('exporta CSV con estados y fecha local', async () => {
    const response = await request('/reports/export?from=2026-01-15&to=2026-01-15');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    const csv = await response.text();
    expect(csv).toContain('Anulada');
    expect(csv).toContain('10.00');
    expect(csv).toContain('2026-01-15 08:00:00');
  });
  test('cerrar sesión invalida el acceso', async () => {
    expect((await request('/auth/logout', 'POST', {})).status).toBe(200);
    expect((await request('/auth/me')).status).toBe(401);
  });
});
