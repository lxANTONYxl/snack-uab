import { useState } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import {
  api,
  dateLabel,
  money,
  ticket,
  toCents,
  useResource,
  type Receipt as ReceiptData,
} from '../lib';
import { Button, Dialog, ErrorBox, Loading } from './ui';
export function Receipt({
  id,
  onClose,
  onChange,
  canVoid = false,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
  canVoid?: boolean;
}) {
  const detail = useResource<ReceiptData>(`/sales/${id}`);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const data = detail.data;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title={data ? `Venta ${ticket(data.number)}` : 'Detalle de venta'}
      description="Comprobante interno de venta · No es factura fiscal."
    >
      <div className="receipt-print">
        {detail.loading ? (
          <Loading />
        ) : detail.error ? (
          <ErrorBox message={detail.error} retry={detail.reload} />
        ) : (
          data && (
            <>
              <div className="receipt-brand">
                <img src="/brand/uab.png" alt="UAB" />
                <h3>Snack universitario</h3>
                <p>
                  {dateLabel(data.confirmedAt)} · {ticket(data.number)}
                </p>
                <span
                  className={`badge ${data.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}
                >
                  <CheckCircle2 size={13} />
                  {data.status === 'confirmed' ? 'Venta confirmada' : 'Venta anulada'}
                </span>
              </div>
              <div className="receipt-lines">
                {data.items.map((line) => (
                  <div key={line.id}>
                    <span>
                      {line.quantity} × {line.productName}
                      <small>{money(line.unitPrice)} por unidad</small>
                    </span>
                    <strong>{money((toCents(line.unitPrice) * line.quantity) / 100)}</strong>
                  </div>
                ))}
              </div>
              <div className="receipt-total">
                <span>Total</span>
                <strong>{money(data.total)}</strong>
              </div>
              <dl className="receipt-meta">
                <div>
                  <dt>Método de pago</dt>
                  <dd>{data.payment.method === 'cash' ? 'Efectivo' : 'QR'}</dd>
                </div>
                {data.payment.received && (
                  <>
                    <div>
                      <dt>Efectivo recibido</dt>
                      <dd>{money(data.payment.received)}</dd>
                    </div>
                    <div>
                      <dt>Cambio</dt>
                      <dd>{money((toCents(data.payment.received) - toCents(data.total)) / 100)}</dd>
                    </div>
                  </>
                )}
                {data.payment.reference && (
                  <div>
                    <dt>Referencia QR</dt>
                    <dd>{data.payment.reference}</dd>
                  </div>
                )}
                <div>
                  <dt>Atendido por</dt>
                  <dd>{data.responsible}</dd>
                </div>
              </dl>
              {data.voidReason && (
                <div className="void-note">Motivo de anulación: {data.voidReason}</div>
              )}
            </>
          )
        )}
      </div>
      {error && <ErrorBox message={error} />}{' '}
      {data && (
        <div className="receipt-controls">
          {voiding ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError('');
                try {
                  await api(`/sales/${id}/void`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                  });
                  setVoiding(false);
                  detail.reload();
                  onChange();
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Motivo de anulación
                <textarea
                  required
                  minLength={5}
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica por qué se anula esta venta"
                />
              </label>
              <p className="form-help">
                Se excluirá del reporte. Esta acción no devuelve dinero por el banco; registra aquí
                solo anulaciones ya resueltas con el cliente.
              </p>
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVoiding(false)}
                  disabled={busy}
                >
                  Volver
                </Button>
                <Button variant="danger" disabled={busy}>
                  {busy ? 'Anulando…' : 'Confirmar anulación'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="dialog-actions">
              {canVoid && data.status === 'confirmed' && (
                <Button variant="ghost" onClick={() => setVoiding(true)} className="text-danger">
                  Anular venta
                </Button>
              )}
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={16} />
                Imprimir
              </Button>
              <Button onClick={onClose}>Listo</Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
