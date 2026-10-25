import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, integer, serial, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(), name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 150 }).notNull().unique(), passwordHash: text('password_hash').notNull(),
  role: varchar({ length: 20 }).notNull().default('admin'), active: boolean().notNull().default(true),
}, t => [check('user_role', sql`${t.role} IN ('admin','cashier','seller')`)]);
export const sessions = pgTable('sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(), userId: uuid('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const categories = pgTable('categories', {
  id: uuid().primaryKey().defaultRandom(), name: varchar({ length: 60 }).notNull().unique(),
});
export const products = pgTable('products', {
  id: uuid().primaryKey().defaultRandom(), code: varchar({ length: 30 }).notNull().unique(),
  name: varchar({ length: 120 }).notNull(), categoryId: uuid('category_id').notNull().references(() => categories.id),
  price: numeric({ precision: 12, scale: 2 }).notNull(), active: boolean().notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [check('positive_price', sql`${t.price} > 0`)]);
export const sales = pgTable('sales', {
  id: uuid().primaryKey().defaultRandom(), number: serial().notNull().unique(),
  requestId: uuid('request_id').notNull().unique(), requestHash: varchar('request_hash', { length: 64 }).notNull(), createdBy: uuid('created_by').notNull().references(() => users.id),
  status: varchar({ length: 20 }).notNull().default('confirmed'), total: numeric({ precision: 12, scale: 2 }).notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
  voidedAt: timestamp('voided_at', { withTimezone: true }), voidedBy: uuid('voided_by').references(() => users.id), voidReason: text('void_reason'),
}, t => [index('sales_confirmed_at_idx').on(t.confirmedAt), check('sale_status', sql`${t.status} IN ('confirmed','void')`), check('positive_total', sql`${t.total} > 0`)]);
export const saleItems = pgTable('sale_items', {
  id: uuid().primaryKey().defaultRandom(), saleId: uuid('sale_id').notNull().references(() => sales.id),
  productId: uuid('product_id').notNull().references(() => products.id), productName: varchar('product_name', { length: 120 }).notNull(),
  quantity: integer().notNull(), unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
}, t => [index('sale_items_sale_idx').on(t.saleId), check('positive_quantity', sql`${t.quantity} > 0`), check('positive_unit_price', sql`${t.unitPrice} > 0`)]);
export const payments = pgTable('payments', {
  id: uuid().primaryKey().defaultRandom(), saleId: uuid('sale_id').notNull().unique().references(() => sales.id),
  method: varchar({ length: 10 }).notNull(), amount: numeric({ precision: 12, scale: 2 }).notNull(),
  received: numeric({ precision: 12, scale: 2 }), reference: varchar({ length: 100 }),
  status: varchar({ length: 20 }).notNull().default('confirmed'),
}, t => [check('payment_method', sql`${t.method} IN ('cash','qr')`), check('payment_status', sql`${t.status} IN ('confirmed','void')`), check('positive_amount', sql`${t.amount} > 0`), check('cash_received', sql`${t.method} <> 'cash' OR (${t.received} IS NOT NULL AND ${t.received} >= ${t.amount})`)]);
