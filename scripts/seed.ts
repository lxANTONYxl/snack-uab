import { eq } from 'drizzle-orm';
import { db, client } from '../apps/api/src/db';
import { users, categories, products } from '../apps/api/src/schema';
const email = process.env.ADMIN_EMAIL?.toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) en .env.');
await db
  .insert(users)
  .values({
    name: 'Administrador UAB',
    email,
    passwordHash: await Bun.password.hash(password),
    role: 'admin',
  })
  .onConflictDoNothing({ target: users.email });
const groups = ['Bebidas', 'Snacks', 'Panadería', 'Golosinas'];
for (const name of groups) await db.insert(categories).values({ name }).onConflictDoNothing();
const cat = await db.select().from(categories);
const catalog = [
  ['BEB-001', 'Agua mineral 600 ml', 'Bebidas', '3.00'],
  ['BEB-002', 'Jugo de durazno', 'Bebidas', '5.00'],
  ['BEB-003', 'Yogur bebible', 'Bebidas', '6.00'],
  ['BEB-004', 'Refresco de naranja', 'Bebidas', '4.00'],
  ['SNK-001', 'Papas fritas clásicas', 'Snacks', '5.00'],
  ['SNK-002', 'Galletas de avena', 'Snacks', '3.50'],
  ['SNK-003', 'Barra de cereal', 'Snacks', '4.00'],
  ['PAN-001', 'Empanada de queso', 'Panadería', '5.00'],
  ['PAN-002', 'Sándwich de pollo', 'Panadería', '10.00'],
  ['PAN-003', 'Cuñapé', 'Panadería', '3.00'],
  ['GOL-001', 'Chocolate con maní', 'Golosinas', '4.50'],
  ['GOL-002', 'Caramelos de fruta', 'Golosinas', '1.00'],
];
for (const [code, name, category, price] of catalog)
  await db
    .insert(products)
    .values({ code, name, categoryId: cat.find((c) => c.name === category)!.id, price })
    .onConflictDoNothing({ target: products.code });
console.log('Cuenta inicial y 12 productos de ejemplo preparados. No se crearon ventas ficticias.');
await client.end();
