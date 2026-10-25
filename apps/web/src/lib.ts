import { useEffect, useState } from 'react';
export type User = { id: string; name: string; email: string; role: string };
export type Category = { id: string; name: string };
export type Product = { id: string; code: string; name: string; categoryId: string; category: string; price: string; active: boolean };
export type SaleRow = { id: string; number: number; total: string; status: string; date: string; method: string; responsible: string };
export type Report = { from: string; to: string; total: string; cash: string; qr: string; count: number; units: number; top: { productId: string; name: string; quantity: number; total: string }[]; series: { label: string; total: string }[]; rows: SaleRow[] };
export type Receipt = { id: string; number: number; total: string; status: string; confirmedAt: string; voidReason: string | null; responsible: string; payment: { method: string; received: string | null; reference: string | null }; items: { id: string; productName: string; quantity: number; unitPrice: string }[] };
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('session-expired'));
    throw new Error(body.error || 'No se pudo completar la solicitud.');
  }
  return body;
}
export function useResource<T>(path: string, version = 0) {
  const [data, setData] = useState<T>(); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api<T>(path).then(value => { if (active) setData(value); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, version, retry]);
  return { data, error, loading, reload: () => setRetry(v => v + 1) };
}
export const money = (value: string | number) => `Bs ${Number(value).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const toCents = (value: string) => { const [a, b = ''] = value.split('.'); return Number(a || 0) * 100 + Number(b.padEnd(2, '0')); };
export const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const dateLabel = (value: string) => new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
export const ticket = (value: number) => `V-${String(value).padStart(5, '0')}`;
