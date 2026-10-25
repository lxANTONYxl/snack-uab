import { z } from 'zod';
export class DomainError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function cents(value: string): number {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) throw new DomainError('Importe inválido. Usa hasta dos decimales.');
  const [whole, decimal = ''] = value.split('.');
  return Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
}
export function decimal(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999999999999) throw new DomainError('El importe excede el límite permitido.');
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}
const money = z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, 'Usa un importe positivo con hasta dos decimales.');
export const productInput = z.object({
  code: z.string().trim().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/, 'El código solo admite letras, números, guiones y guiones bajos.').transform(s => s.toUpperCase()),
  name: z.string().trim().min(2).max(120), categoryId: z.string().uuid(),
  price: money.refine(v => cents(v) > 0, 'El precio debe ser mayor que cero.'), active: z.boolean().default(true),
});
export const saleInput = z.object({
  requestId: z.string().uuid(), items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(1000), expectedPrice: money })).min(1).max(100),
  method: z.enum(['cash', 'qr']), received: money.optional(), reference: z.string().trim().max(100).optional(), qrConfirmed: z.boolean().optional(),
}).superRefine((v, ctx) => {
  if (new Set(v.items.map(i => i.productId)).size !== v.items.length) ctx.addIssue({ code: 'custom', message: 'Hay productos repetidos.' });
  if (v.method === 'qr' && !v.qrConfirmed) ctx.addIssue({ code: 'custom', message: 'Confirma la recepción del pago QR.' });
  if (v.method === 'cash' && !v.received) ctx.addIssue({ code: 'custom', message: 'Indica el efectivo recibido.' });
});
export function dateRange(from: string, to: string) {
  for (const value of [from, to]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new DomainError('Fecha inválida.');
  }
  const start = new Date(`${from}T00:00:00-04:00`);
  const end = new Date(new Date(`${to}T00:00:00-04:00`).getTime() + 86400000);
  if (end <= start || end.getTime() - start.getTime() > 366 * 86400000) throw new DomainError('Selecciona un intervalo de hasta 366 días, en orden cronológico.');
  return { start, end };
}
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
