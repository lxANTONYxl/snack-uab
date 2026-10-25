import { and, eq, gte, lt, inArray, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from './db';
import { categories, products, sales, saleItems, payments, users } from './schema';
import { cents, decimal, dateRange, DomainError, saleInput } from './domain';

export const productRows = () =>
  db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      categoryId: products.categoryId,
      category: categories.name,
      price: products.price,
      active: products.active,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.name);

export async function confirmSale(input: z.infer<typeof saleInput>, userId: string) {
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const replay = (prior: typeof sales.$inferSelect) => {
    if (prior.createdBy !== userId || prior.requestHash !== hash)
      throw new DomainError('Este identificador ya se utilizó para otra operación.', 409);
    return prior;
  };
  return db.transaction(async (tx) => {
    const [prior] = await tx.select().from(sales).where(eq(sales.requestId, input.requestId));
    if (prior) return replay(prior);
    const selected = await tx
      .select()
      .from(products)
      .where(
        inArray(
          products.id,
          input.items.map((i) => i.productId),
        ),
      )
      .for('share');
    const lines = input.items.map((item) => {
      const product = selected.find((p) => p.id === item.productId);
      if (!product?.active)
        throw new DomainError('Un producto ya no está disponible. Actualiza el catálogo.');
      if (cents(product.price) !== cents(item.expectedPrice))
        throw new DomainError(
          `El precio de ${product.name} cambió. Actualiza el catálogo y vuelve a agregarlo.`,
          409,
        );
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      };
    });
    const total = lines.reduce((sum, line) => sum + cents(line.unitPrice) * line.quantity, 0);
    const amount = decimal(total);
    if (input.method === 'cash' && cents(input.received!) < total)
      throw new DomainError('El efectivo recibido no cubre el total.');
    const [sale] = await tx
      .insert(sales)
      .values({ requestId: input.requestId, requestHash: hash, createdBy: userId, total: amount })
      .onConflictDoNothing({ target: sales.requestId })
      .returning();
    if (!sale) {
      const [existing] = await tx.select().from(sales).where(eq(sales.requestId, input.requestId));
      return replay(existing);
    }
    await tx.insert(saleItems).values(lines.map((line) => ({ ...line, saleId: sale.id })));
    await tx
      .insert(payments)
      .values({
        saleId: sale.id,
        method: input.method,
        amount,
        received: input.method === 'cash' ? decimal(cents(input.received!)) : null,
        reference: input.method === 'qr' ? input.reference || null : null,
      });
    return sale;
  });
}

export async function voidSale(id: string, reason: string, userId: string) {
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, id)).for('update');
    if (!sale) throw new DomainError('Venta no encontrada.', 404);
    if (sale.status === 'void') throw new DomainError('La venta ya está anulada.', 409);
    const [updated] = await tx
      .update(sales)
      .set({ status: 'void', voidReason: reason, voidedBy: userId, voidedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    await tx.update(payments).set({ status: 'void' }).where(eq(payments.saleId, id));
    return updated;
  });
}

export async function saleDetail(id: string) {
  const [sale] = await db
    .select({ sale: sales, payment: payments, responsible: users.name })
    .from(sales)
    .innerJoin(payments, eq(payments.saleId, sales.id))
    .innerJoin(users, eq(users.id, sales.createdBy))
    .where(eq(sales.id, id));
  if (!sale) throw new DomainError('Venta no encontrada.', 404);
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
  return { ...sale.sale, payment: sale.payment, responsible: sale.responsible, items };
}

export async function report(from: string, to: string) {
  const { start, end } = dateRange(from, to);
  const range = and(gte(sales.confirmedAt, start), lt(sales.confirmedAt, end));
  const valid = and(range, eq(sales.status, 'confirmed'), eq(payments.status, 'confirmed'));
  // La misma instantánea mantiene coherentes tarjetas, series y detalle si otra caja vende durante la consulta.
  return db.transaction(
    async (tx) => {
      const [summary] = await tx
        .select({
          total: sql<string>`coalesce(sum(${sales.total}),0)::text`,
          cash: sql<string>`coalesce(sum(case when ${payments.method}='cash' then ${sales.total} else 0 end),0)::text`,
          qr: sql<string>`coalesce(sum(case when ${payments.method}='qr' then ${sales.total} else 0 end),0)::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(sales)
        .innerJoin(payments, eq(payments.saleId, sales.id))
        .where(valid);
      const top = await tx
        .select({
          productId: saleItems.productId,
          name: saleItems.productName,
          quantity: sql<number>`sum(${saleItems.quantity})::int`,
          total: sql<string>`sum(${saleItems.quantity} * ${saleItems.unitPrice})::text`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(payments, eq(payments.saleId, sales.id))
        .where(valid)
        .groupBy(saleItems.productId, saleItems.productName)
        .orderBy(sql`sum(${saleItems.quantity}) desc`);
      const bucket =
        from === to
          ? sql`to_char(${sales.confirmedAt} at time zone 'America/La_Paz', 'HH24')`
          : sql`to_char(${sales.confirmedAt} at time zone 'America/La_Paz', 'YYYY-MM-DD')`;
      const series = await tx
        .select({ label: sql<string>`${bucket}`, total: sql<string>`sum(${sales.total})::text` })
        .from(sales)
        .innerJoin(payments, eq(payments.saleId, sales.id))
        .where(valid)
        .groupBy(bucket)
        .orderBy(bucket);
      const rows = await tx
        .select({
          id: sales.id,
          number: sales.number,
          total: sales.total,
          status: sales.status,
          date: sales.confirmedAt,
          method: payments.method,
          responsible: users.name,
        })
        .from(sales)
        .innerJoin(payments, eq(payments.saleId, sales.id))
        .innerJoin(users, eq(users.id, sales.createdBy))
        .where(range)
        .orderBy(desc(sales.confirmedAt))
        .limit(100);
      return {
        from,
        to,
        ...summary,
        units: top.reduce((sum, item) => sum + item.quantity, 0),
        top,
        series,
        rows,
      };
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' },
  );
}

export async function exportSales(from: string, to: string) {
  const { start, end } = dateRange(from, to);
  const rows = await db
    .select({
      number: sales.number,
      date: sales.confirmedAt,
      status: sales.status,
      total: sales.total,
      method: payments.method,
      responsible: users.name,
    })
    .from(sales)
    .innerJoin(payments, eq(payments.saleId, sales.id))
    .innerJoin(users, eq(users.id, sales.createdBy))
    .where(and(gte(sales.confirmedAt, start), lt(sales.confirmedAt, end)))
    .orderBy(sales.confirmedAt);
  const cell = (value: string | number) =>
    `"${String(value)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/La_Paz',
    dateStyle: 'short',
    timeStyle: 'medium',
  });
  return (
    '\uFEFF' +
    [
      ['Venta', 'Fecha (America/La_Paz)', 'Estado', 'Método', 'Importe BOB', 'Responsable'],
      ...rows.map((r) => [
        r.number,
        dateFormat.format(r.date),
        r.status === 'confirmed' ? 'Confirmada' : 'Anulada',
        r.method === 'cash' ? 'Efectivo' : 'QR',
        r.total,
        r.responsible,
      ]),
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n')
  );
}
