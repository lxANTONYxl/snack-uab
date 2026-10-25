import { describe, expect, test } from 'bun:test';
import { cents, decimal, dateRange, saleInput, productInput } from './domain';
describe('Importes monetarios', () => {
  test('suma centavos sin errores binarios', () =>
    expect(decimal(cents('0.10') + cents('0.20'))).toBe('0.30'));
  test('admite unidades y un decimal', () => {
    expect(cents('5')).toBe(500);
    expect(cents('3.5')).toBe(350);
  });
  test('rechaza negativos, exponentes y más de dos decimales', () => {
    for (const value of ['-1', '1e2', '0.001', 'NaN', '']) expect(() => cents(value)).toThrow();
  });
  test('rechaza totales fuera de NUMERIC(12,2)', () =>
    expect(() => decimal(1_000_000_000_000)).toThrow());
});
describe('Días de Bolivia', () => {
  test('incluye medianoche local y excluye el día siguiente', () => {
    const { start, end } = dateRange('2026-10-24', '2026-10-24');
    expect(start.toISOString()).toBe('2026-10-24T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-25T04:00:00.000Z');
  });
  test('valida días reales, orden e intervalos máximos', () => {
    for (const [from, to] of [
      ['2026-02-30', '2026-03-01'],
      ['2026-10-25', '2026-10-24'],
      ['2025-01-01', '2026-10-24'],
      ['no', '2026-01-01'],
    ])
      expect(() => dateRange(from, to)).toThrow();
  });
});
describe('Validaciones de negocio', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  test('QR requiere confirmación explícita', () =>
    expect(
      saleInput.safeParse({
        requestId: id,
        method: 'qr',
        items: [{ productId: id, quantity: 1, expectedPrice: '1.00' }],
      }).success,
    ).toBe(false));
  test('no acepta líneas repetidas', () =>
    expect(
      saleInput.safeParse({
        requestId: id,
        method: 'cash',
        received: '5',
        items: Array(2).fill({ productId: id, quantity: 1, expectedPrice: '1.00' }),
      }).success,
    ).toBe(false));
  test('normaliza código y rechaza precio cero', () => {
    expect(
      productInput.parse({ code: ' abc-1 ', name: 'Producto', price: '1', categoryId: id }).code,
    ).toBe('ABC-1');
    expect(
      productInput.safeParse({ code: 'abc', name: 'Producto', price: '0', categoryId: id }).success,
    ).toBe(false);
  });
});
