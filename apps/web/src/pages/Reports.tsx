import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { dateLabel, localDate, money, ticket, useResource, type Report, type User } from '../lib';
import { Button, Empty, ErrorBox, Loading } from '../components/ui';
import { Receipt } from '../components/Receipt';

export function ReportsPage({
  version,
  onChange,
  dashboard = false,
  user,
}: {
  version: number;
  onChange: () => void;
  dashboard?: boolean;
  user: User;
}) {
  const [range, setRange] = useState({ from: localDate(), to: localDate() });
  const [draft, setDraft] = useState(range);
  const [dateError, setDateError] = useState('');
  const [receipt, setReceipt] = useState('');
  const query = `from=${range.from}&to=${range.to}`;
  const result = useResource<Report>(`/reports?${query}`, version);
  const data = result.data;
  const date = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {dashboard ? 'EL PULSO DE TU TIENDA' : 'REPORTES Y CONSOLIDACIÓN'}
          </span>
          <h1>{dashboard ? 'Cada venta, en orden.' : 'Tus ventas, en detalle.'}</h1>
          <p>
            {dashboard
              ? 'Una mirada clara a lo que pasa hoy en el Snack UAB.'
              : 'Consulta los resultados y revisa cada movimiento.'}
          </p>
        </div>
        {dashboard ? (
          <Button asChild>
            <Link to="/ventas">
              <Plus size={18} />
              Nueva venta
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <a href={`/api/reports/export?${query}`} download>
              <ArrowDownToLine size={17} />
              Exportar CSV
            </a>
          </Button>
        )}
      </div>
      {dashboard ? (
        <div className="welcome-banner">
          <div className="welcome-icon">
            <ShoppingBag size={25} />
          </div>
          <div>
            <strong>Todo listo para una buena jornada.</strong>
            <p>Registra cada cobro y deja que el sistema haga las cuentas.</p>
          </div>
          <span className="welcome-date">
            <CalendarDays size={17} />
            {date}
          </span>
          <div className="banner-decoration" />
        </div>
      ) : (
        <form
          className="report-filters panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.from > draft.to) {
              setDateError('La fecha inicial debe ser anterior o igual a la final.');
              return;
            }
            setDateError('');
            setRange(draft);
          }}
        >
          <div className="filter-title">
            <CalendarDays size={19} />
            <strong>Periodo de consulta</strong>
          </div>
          <label>
            Desde
            <input
              type="date"
              required
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              required
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </label>
          <Button>Consultar</Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              const now = { from: localDate(), to: localDate() };
              setRange(now);
              setDraft(now);
              setDateError('');
            }}
          >
            Hoy
          </Button>
        </form>
      )}
      {dateError && <ErrorBox message={dateError} />}{' '}
      {result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : result.loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="section-label">
              <h2>{dashboard ? 'Resumen de hoy' : 'Resultados del periodo'}</h2>
              <span className="live-note">
                <i />
                Ventas confirmadas
              </span>
            </div>
            <div className="metrics-grid">
              <Metric
                label="Total vendido"
                value={money(data.total)}
                note={`${data.count} ${data.count === 1 ? 'venta confirmada' : 'ventas confirmadas'}`}
                icon={<CircleDollarSign size={22} />}
                primary
              />
              <Metric
                label="Cobros en efectivo"
                value={money(data.cash)}
                note="Importe neto, sin el cambio"
                icon={<Banknote size={22} />}
                color="green"
              />
              <Metric
                label="Cobros por QR"
                value={money(data.qr)}
                note="Pagos verificados por el cajero"
                icon={<QrCode size={22} />}
                color="purple"
              />
              <Metric
                label="Productos vendidos"
                value={data.units.toLocaleString('es-BO')}
                note={
                  data.count
                    ? `Promedio por venta: ${money(Number(data.total) / data.count)}`
                    : 'Tu próxima venta comienza aquí'
                }
                icon={<ShoppingBag size={22} />}
                color="orange"
              />
            </div>
            <div className="analytics-grid">
              <section className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {range.from === range.to ? 'Ventas durante el día' : 'Evolución de ventas'}
                    </h2>
                    <p>
                      {range.from === range.to
                        ? 'Importe vendido por hora · Hora de Bolivia'
                        : `${range.from} al ${range.to}`}
                    </p>
                  </div>
                  <span className="chart-legend">
                    <i />
                    Ventas (Bs)
                  </span>
                </div>
                <SalesChart data={data} />
              </section>
              <section className="panel payment-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Métodos de pago</h2>
                    <p>Cómo pagan tus clientes</p>
                  </div>
                  <QrCode size={18} />
                </div>
                <PaymentChart data={data} />
              </section>
            </div>
            <div className="details-grid">
              <section className="panel transactions-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{dashboard ? 'Últimas ventas' : 'Registro de ventas'}</h2>
                    <p>
                      {dashboard
                        ? 'Los movimientos más recientes de tu jornada.'
                        : 'Hasta 100 movimientos recientes. El CSV incluye todo el periodo.'}
                    </p>
                  </div>
                  {dashboard && (
                    <Link className="text-link" to="/reportes">
                      Ver reporte
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
                {data.rows.length === 0 ? (
                  <Empty
                    icon={<ReceiptText size={27} />}
                    title="Aún no hay ventas en este periodo"
                    text="Cuando registres un cobro, aparecerá aquí junto a su detalle."
                  >
                    <Button variant="outline" asChild>
                      <Link to="/ventas">
                        <Plus size={16} />
                        Registrar una venta
                      </Link>
                    </Button>
                  </Empty>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>VENTA</th>
                          <th>FECHA Y HORA</th>
                          <th>PAGO</th>
                          <th>TOTAL</th>
                          <th>ESTADO</th>
                          <th>
                            <span className="sr-only">Detalle</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboard ? data.rows.slice(0, 5) : data.rows).map((row) => (
                          <tr key={row.id}>
                            <td>
                              <button className="sale-link" onClick={() => setReceipt(row.id)}>
                                {ticket(row.number)}
                              </button>
                            </td>
                            <td className="date-cell">{dateLabel(row.date)}</td>
                            <td>
                              <span className="payment-label">
                                {row.method === 'cash' ? (
                                  <Banknote size={15} />
                                ) : (
                                  <QrCode size={15} />
                                )}
                                {row.method === 'cash' ? 'Efectivo' : 'QR'}
                              </span>
                            </td>
                            <td className="price-label">{money(row.total)}</td>
                            <td>
                              <span
                                className={`badge ${row.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}
                              >
                                <i />
                                {row.status === 'confirmed' ? 'Confirmada' : 'Anulada'}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Ver venta ${ticket(row.number)}`}
                                onClick={() => setReceipt(row.id)}
                              >
                                <ChevronRight size={17} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <section className="panel top-products">
                <div className="panel-heading">
                  <div>
                    <h2>Los más vendidos</h2>
                    <p>Favoritos de tus clientes</p>
                  </div>
                  <TrendingUp size={19} />
                </div>
                {data.top.length === 0 ? (
                  <Empty
                    icon={<Package size={27} />}
                    title="Por descubrir"
                    text="Aquí verás los productos con más unidades vendidas."
                  />
                ) : (
                  <div className="top-list">
                    {data.top.slice(0, dashboard ? 5 : data.top.length).map((item, i) => (
                      <div className="top-item" key={`${item.productId}-${item.name}`}>
                        <span className={`rank ${i === 0 ? 'first' : ''}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.quantity} unidades</small>
                        </div>
                        <span>{money(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            <div className="context-note">
              <ClipboardList size={17} />
              <span>
                Los totales incluyen ventas confirmadas. Las anulaciones se conservan en el
                historial y se excluyen de los importes.
              </span>
            </div>
          </>
        )
      )}
      {receipt && (
        <Receipt
          id={receipt}
          onClose={() => setReceipt('')}
          onChange={onChange}
          canVoid={user.role === 'admin'}
        />
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
  primary,
  color,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  primary?: boolean;
  color?: string;
}) {
  return (
    <div className={`metric-card ${primary ? 'metric-primary' : ''}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className={`stat-icon ${color || 'blue'}`}>{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </div>
  );
}
function SalesChart({ data }: { data: Report }) {
  const id = useId().replaceAll(':', '');
  const single = data.from === data.to;
  const labels = single
    ? Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    : (() => {
        const values: string[] = [];
        for (
          let date = new Date(`${data.from}T12:00:00Z`);
          date <= new Date(`${data.to}T12:00:00Z`);
          date = new Date(date.getTime() + 86400000)
        )
          values.push(date.toISOString().slice(0, 10));
        return values;
      })();
  const values = labels.map((label) =>
    Number(data.series.find((s) => s.label === label)?.total || 0),
  );
  const max = Math.max(10, ...values);
  const top = Math.ceil(max / 10) * 10;
  const left = 52,
    width = 600,
    height = 155,
    bottom = 180;
  const coords = values.map(
    (v, i) =>
      `${left + (i / Math.max(values.length - 1, 1)) * width},${bottom - (v / top) * height}`,
  );
  const line = coords.join(' ');
  return (
    <div className="sales-chart">
      <svg
        viewBox="0 0 680 222"
        role="img"
        aria-label={`Ventas del periodo: ${money(data.total)}. ${data.count} ventas confirmadas.`}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3158f4" stopOpacity=".22" />
            <stop offset="100%" stopColor="#3158f4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((n) => {
          const y = bottom - (n / 3) * height;
          return (
            <g key={n}>
              <line x1={left} x2={652} y1={y} y2={y} stroke="#e8ecf3" strokeDasharray="4 5" />
              <text x={left - 12} y={y + 4} textAnchor="end">
                {Math.round((n / 3) * top)}
              </text>
            </g>
          );
        })}
        {data.count > 0 && (
          <>
            <polygon points={`${left},${bottom} ${line} 652,${bottom}`} fill={`url(#${id})`} />
            <polyline
              points={line}
              fill="none"
              stroke="#2b50ef"
              strokeWidth="2.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {values.map(
              (v, i) =>
                v > 0 && (
                  <circle
                    key={i}
                    cx={left + (i / Math.max(values.length - 1, 1)) * width}
                    cy={bottom - (v / top) * height}
                    r="4"
                    fill="#2b50ef"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <title>
                      {single ? `${labels[i]}:00` : labels[i]} · {money(v)}
                    </title>
                  </circle>
                ),
            )}
          </>
        )}
        {labels.map(
          (label, i) =>
            (i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) && (
              <text
                key={label}
                x={left + (i / Math.max(values.length - 1, 1)) * width}
                y={207}
                textAnchor="middle"
              >
                {single ? `${label}:00` : label.slice(5)}
              </text>
            ),
        )}
        {data.count === 0 && (
          <text x="350" y="105" textAnchor="middle" className="chart-empty-label">
            Las ventas de tu jornada aparecerán aquí
          </text>
        )}
      </svg>
    </div>
  );
}
function PaymentChart({ data }: { data: Report }) {
  const total = Number(data.total);
  const cashPercent = total ? Math.round((Number(data.cash) / total) * 100) : 0;
  const qrPercent = total ? 100 - cashPercent : 0;
  return (
    <div className="payment-chart">
      <div
        className="donut"
        style={{
          background: total
            ? `conic-gradient(#2b50ef 0% ${cashPercent}%, #96abff ${cashPercent}% 100%)`
            : '#edf0f7',
        }}
        role="img"
        aria-label={`Efectivo ${cashPercent}%, QR ${qrPercent}%`}
      >
        <div>
          <span>{data.count}</span>
          <small>ventas</small>
        </div>
      </div>
      <div className="payment-breakdown">
        <div>
          <span>
            <i className="dot-blue" />
            Efectivo
          </span>
          <strong>{money(data.cash)}</strong>
          <small>{cashPercent}%</small>
        </div>
        <div>
          <span>
            <i className="dot-light" />
            QR
          </span>
          <strong>{money(data.qr)}</strong>
          <small>{qrPercent}%</small>
        </div>
      </div>
    </div>
  );
}
