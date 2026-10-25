import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, Link, Navigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, ChevronRight, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { api, type User } from './lib';
import { Button, ErrorBox, Loading } from './components/ui';
import { ProductsPage } from './pages/Products';
import { SalesPage } from './pages/Sales';
import { ReportsPage } from './pages/Reports';

const navigation = [{ to: '/', label: 'Resumen', icon: LayoutDashboard }, { to: '/productos', label: 'Productos', icon: Package }, { to: '/ventas', label: 'Nueva venta', icon: ShoppingCart }, { to: '/reportes', label: 'Reportes de ventas', icon: BarChart3 }];
export function App() {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [menu, setMenu] = useState(false); const [version, setVersion] = useState(0);
  const location = useLocation();
  useEffect(() => { api<User>('/auth/me').then(setUser).catch(() => {}).finally(() => setLoading(false)); const expire = () => setUser(null); window.addEventListener('session-expired', expire); return () => window.removeEventListener('session-expired', expire); }, []);
  useEffect(() => setMenu(false), [location.pathname]);
  if (loading) return <div className="startup"><Loading/></div>;
  if (!user) return <Login onLogin={setUser}/>;
  const current = navigation.find(n => n.to === location.pathname)?.label || 'Snack UAB';
  async function logout() { try { await api('/auth/logout', { method: 'POST', body: '{}' }); setUser(null); } catch (e) { setError((e as Error).message); } }
  return <div className="app-shell">
    {menu && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMenu(false)}/>}
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}><Link to="/" className="brand"><span className="brand-icon"><ShoppingBag size={24}/></span><span>snack<span className="brand-uab">UAB</span><small>GESTIÓN DE VENTAS</small></span></Link>
      <div className="workspace"><span className="workspace-dot"/><div>Tienda universitaria<small>Universidad Adventista de Bolivia</small></div></div>
      <div className="nav-caption">PRINCIPAL</div><nav aria-label="Navegación principal">{navigation.filter(n => user.role !== 'seller' || n.to === '/productos').map(n => <NavLink key={n.to} to={n.to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><n.icon size={20}/>{n.label}<ChevronRight className="nav-arrow" size={15}/></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="campus-card"><span className="mini-label">HECHO PARA EL CAMPUS</span><p>Menos cálculos.<br/>Más tiempo para atender.</p><div className="campus-line"/></div><div className="sidebar-university"><img src="/brand/uab.png" alt="UAB"/><span>Práctica Empresarial I<small>Ingeniería de Sistemas</small></span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menú" onClick={() => setMenu(true)}><Menu/></Button><span>Mi tienda</span><ChevronRight size={14}/><strong>{current}</strong></div><div className="topbar-right"><span className="campus-badge"><span/>Campus UAB</span><span className="topbar-divider"/><div className="user-avatar">{user.name.slice(0, 1)}</div><div className="user-label"><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrador' : user.role === 'cashier' ? 'Cajero' : 'Vendedor'}</small></div><Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión"><LogOut size={18}/></Button></div></header>
      <main id="main-content">{error && <ErrorBox message={error}/>}<Routes>
        <Route path="/" element={user.role === 'seller' ? <Navigate to="/productos" replace/> : <ReportsPage version={version} onChange={() => setVersion(v => v + 1)} dashboard user={user}/>}/>
        <Route path="/productos" element={<ProductsPage version={version} onChange={() => setVersion(v => v + 1)} canEdit={user.role === 'admin'}/>}/>
        <Route path="/ventas" element={user.role === 'seller' ? <Navigate to="/productos"/> : <SalesPage version={version} onChange={() => setVersion(v => v + 1)}/>}/>
        <Route path="/reportes" element={user.role === 'seller' ? <Navigate to="/productos"/> : <ReportsPage version={version} onChange={() => setVersion(v => v + 1)} user={user}/>}/>
        <Route path="*" element={<div className="not-found"><h1>Página no encontrada</h1><Button asChild><Link to="/">Volver al resumen</Link></Button></div>}/>
      </Routes></main><footer className="page-footer"><span>Snack UAB <span>·</span> Un mejor ritmo para tu tienda.</span><span>Bolivianos (BOB) · Hora de Bolivia</span></footer>
    </div>
  </div>;
}
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <div className="login-page"><section className="login-story"><Link to="/" className="brand"><span className="brand-icon"><ShoppingBag/></span><span>snack<span className="brand-uab">UAB</span></span></Link><div className="login-story-body"><span className="eyebrow light">TU TIENDA, MEJOR ORGANIZADA</span><h1>El recreo es corto.<br/><span>Hagámoslo rendir.</span></h1><p>Productos, ventas y cuentas claras.<br/>Todo en un mismo lugar.</p><div className="login-illustration" aria-hidden="true"><div className="illustration-orbit"/><div className="illustration-card"><span className="illustration-icon"><ShoppingBag size={36}/></span><span>Todo bajo control</span><strong>Una venta a la vez.</strong><div className="illustration-bars"><i/><i/><i/><i/><i/><i/><i/></div></div><div className="illustration-chip"><Check size={18}/> Cuentas claras al final del día</div></div></div><span className="login-credit">Universidad Adventista de Bolivia · Ingeniería de Sistemas</span></section><section className="login-form-side"><div className="login-form-wrap"><img className="login-uab" src="/brand/uab.png" alt="Universidad Adventista de Bolivia"/><span className="eyebrow">BIENVENIDO A SNACK UAB</span><h2>Tu jornada comienza aquí.</h2><p>Ingresa con tu cuenta para gestionar la tienda.</p><form onSubmit={async e => { e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setError(''); try { onLogin(await api<User>('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) })); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>
        <label>Correo electrónico<input name="email" type="email" autoComplete="username" required placeholder="tu.correo@snack.uab"/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required placeholder="Ingresa tu contraseña"/></label>{error && <ErrorBox message={error}/>}<Button disabled={busy} className="login-submit">{busy ? 'Ingresando…' : 'Ingresar al sistema'}<ArrowRight size={18}/></Button></form><p className="login-help">Acceso exclusivo para el personal de la tienda.<br/>Si necesitas una cuenta, contacta al administrador.</p></div><img className="systems-logo" src="/brand/sistemas.png" alt="Carrera de Ingeniería de Sistemas"/></section></div>;
}
