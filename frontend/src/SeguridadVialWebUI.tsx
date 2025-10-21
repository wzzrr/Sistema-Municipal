import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search as SearchIcon, Camera, LogOut, Sun, Moon, FileText, Bell, Menu, X, User, Printer, Users as UsersIcon, FlaskConical } from 'lucide-react';
import { useAuth } from './auth';
import NewInfraccionShell from './NewInfraccionShell';
import ActaPresencial from './presencial/ActaPresencial';
import UsuariosPage from './usuarios/UsuariosPage';
import TestExtraccion from './TestExtraccion';
import { Card, CardBody, Button, StatusBadge } from './ui'; // ⬅️ reutilizamos el micro-kit

/* ========= Types ========= */
type SVRow = {
  id: number;
  nro_acta?: string;
  acta?: string;
  serie?: string;
  nro_correlativo?: number;
  dominio?: string;
  tipo_infraccion?: string;
  estado?: string;
  notificado?: boolean;
  fecha_carga?: string;
  created_at?: string;
  fecha_labrado?: string;
  fecha_notificacion?: string;
  velocidad_medida?: number;
  velocidad_autorizada?: number;
  ubicacion_texto?: string;
  arteria?: string | null;
  lat?: number;
  lng?: number;
  foto_file_id?: string;
  cam_serie?: string;
  tipo_vehiculo?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  conductor_nombre?: string;
  conductor_dni?: string;
  conductor_licencia?: string;
  titular_nombre?: string;
  titular_dni_cuit?: string;
};

type DashboardStats = {
  total: number;
  validadas: number;
  notificadas: number;
  hoy: number;
  semana: number;
};

type EstadoStat = {
  estado: string;
  cantidad: number;
};

type VelocidadStats = {
  promedio: string;
  maxima: number;
  minima: number;
  excesos: number;
};

type ArteriaStat = {
  arteria: string;
  cantidad: number;
};

const ymd = (d: Date) => {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const fmtFechaHora = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const f = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const t = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${f} ${t}`;
};

const sortDesc = (rows: SVRow[]) => {
  const t = (r: SVRow) => new Date(r.fecha_carga || r.created_at || r.fecha_labrado || 0).getTime();
  return [...rows].sort((a, b) => t(b) - t(a));
};

const toQS = (q: Record<string, any> = {}) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v);
    if (!s.trim()) return;
    p.append(k, s);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

/* ========= Tema (dark / light) ========= */
function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sv.theme') === 'dark' || window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.add('bg-slate-950');
    } else {
      root.classList.remove('dark');
      root.classList.remove('bg-slate-950');
    }
    localStorage.setItem('sv.theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, setDark };
}

/* ========= Sidebar ========= */
function Sidebar({
  route,
  setRoute,
  isOpen,
  setIsOpen
}: {
  route: string;
  setRoute: (r: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { user, logout } = useAuth() as any;
  const { dark, setDark } = useTheme();

  const NavItem: React.FC<{ k: string; label: string; icon: React.ReactNode }> = ({ k, label, icon }) => (
    <button
      onClick={() => {
        setRoute(k);
        setIsOpen(false); // Cerrar sidebar en móvil al navegar
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
        route === k
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const sidebarContent = (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header - flex-shrink-0 evita que se comprima */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-base">Seguridad Vial</div>
            <div className="text-xs text-slate-500">Sistema de infracciones</div>
          </div>
          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Usuario - flex-shrink-0 evita que se comprima */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 grid place-items-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.email || 'Usuario'}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.rol || 'admin'}</div>
          </div>
        </div>
      </div>

      {/* Navegación - flex-1 ocupa espacio disponible, overflow-y-auto permite scroll */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2">
          Menú Principal
        </div>
        <NavItem k="panel" label="Panel" icon={<ShieldCheck className="w-5 h-5" />} />
        <NavItem k="ingresar" label="Ingresar Infracción" icon={<Camera className="w-5 h-5" />} />
        <NavItem k="acta-presencial" label="Acta Presencial" icon={<Printer className="w-5 h-5" />} />
        <NavItem k="consultar" label="Consultar" icon={<SearchIcon className="w-5 h-5" />} />

        {/* Usuarios y Tests - Solo para admin y dev */}
        {(user?.rol === 'admin' || user?.rol === 'dev') && (
          <>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2 mt-4">
              Administración
            </div>
            <NavItem k="usuarios" label="Usuarios" icon={<UsersIcon className="w-5 h-5" />} />
            <NavItem k="test-extraccion" label="Test Extracción" icon={<FlaskConical className="w-5 h-5" />} />
          </>
        )}
      </nav>

      {/* Footer - flex-shrink-0 evita que se comprima */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* Toggle tema */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          title={`Tema: ${dark ? 'Oscuro' : 'Claro'}`}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>Tema {dark ? 'Oscuro' : 'Claro'}</span>
        </button>

        {/* Cerrar sesión */}
        <button
          onClick={() => { try { logout?.(); } catch {} }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - fixed en desktop, slide-in en mobile */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 w-72 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

/* ========= Mobile Header (Hamburger Button) ========= */
function MobileHeader({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="ml-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white grid place-items-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="font-semibold">Seguridad Vial</div>
      </div>
    </div>
  );
}

/* ========= Pequeño componente KPI (reusa Card/CardBody) ========= */
const KpiCard = ({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) => (
  <Card>
    <CardBody>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center dark:bg-emerald-900/30 dark:text-emerald-300">
          {icon}
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </CardBody>
  </Card>
);

/* ========= Páginas ========= */

/** PANEL: usa /api del backend principal con datos reales */
function PanelPage() {
  const { api } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, validadas: 0, notificadas: 0, hoy: 0, semana: 0 });
  const [rows, setRows] = useState<SVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErr('');

      // Obtener estadísticas
      const statsRes = await api('/api/dashboard/stats');
      if (!statsRes.ok) throw new Error('Error al cargar estadísticas');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Obtener últimas infracciones (10 para mostrar más detalles)
      const recentRes = await api('/api/dashboard/recent?limit=10');
      if (!recentRes.ok) throw new Error('Error al cargar infracciones recientes');
      const recentData = await recentRes.json();
      setRows(recentData.infracciones || []);

      setLastUpdate(new Date());
    } catch (e: any) {
      setErr(e.message || 'Error al cargar datos');
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [api]);

  const ultimas10 = useMemo(() => rows.slice(0, 10), [rows]);

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Última actualización: {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={loading}
          variant="outline"
        >
          <Bell className="w-4 h-4" />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total actas" value={stats.total || '—'} icon={<FileText className="w-5 h-5" />} />
        <KpiCard title="Validadas" value={stats.validadas || '0'} icon={<ShieldCheck className="w-5 h-5" />} />
        <KpiCard title="Notificadas" value={stats.notificadas || '0'} icon={<Bell className="w-5 h-5" />} />
        <KpiCard title="Hoy" value={stats.hoy || '0'} icon={<Camera className="w-5 h-5" />} />
        <KpiCard title="Última semana" value={stats.semana || '0'} icon={<FileText className="w-5 h-5" />} />
      </div>

      {/* Últimas 10 infracciones */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-500">Actividad reciente</div>
              <div className="text-lg font-semibold">Últimas infracciones cargadas</div>
            </div>
            <a href="#consultar"><Button variant="outline">Ver todas</Button></a>
          </div>

          <div>
            {loading && <div className="text-slate-500">Cargando…</div>}
            {err && <div className="text-rose-500">{err}</div>}
            {!loading && !err && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2 px-2">Acta</th>
                      <th className="px-2">Dominio</th>
                      <th className="px-2">Tipo Vehículo</th>
                      <th className="px-2">Marca/Modelo</th>
                      <th className="px-2">Velocidad</th>
                      <th className="px-2">Arteria</th>
                      <th className="px-2">Ubicación</th>
                      <th className="px-2">Fecha labrado</th>
                      <th className="px-2">Estado</th>
                      <th className="px-2">Notificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimas10.length === 0 ? (
                      <tr><td colSpan={10} className="py-4 text-center text-slate-500">No hay infracciones todavía.</td></tr>
                    ) : (
                      ultimas10.map((r) => {
                        const acta = r.nro_acta || r.acta || `${r.serie || 'A'}-${String(r.nro_correlativo || r.id).padStart(7, '0')}`;
                        const marcaModelo = [r.vehiculo_marca, r.vehiculo_modelo].filter(Boolean).join(' ') || '—';
                        const velocidad = r.velocidad_medida ? `${r.velocidad_medida} km/h` : '—';
                        return (
                          <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-2 font-mono text-xs">{acta}</td>
                            <td className="px-2 font-semibold">{r.dominio || '—'}</td>
                            <td className="px-2">{r.tipo_vehiculo || '—'}</td>
                            <td className="px-2 text-xs">{marcaModelo}</td>
                            <td className="px-2">{velocidad}</td>
                            <td className="px-2">{r.arteria || '—'}</td>
                            <td className="px-2 text-xs max-w-xs truncate" title={r.ubicacion_texto || '—'}>
                              {r.ubicacion_texto || '—'}
                            </td>
                            <td className="px-2 text-xs">{fmtFechaHora(r.fecha_labrado)}</td>
                            <td className="px-2"><StatusBadge estado={r.estado || ''} /></td>
                            <td className="px-2 text-center">
                              {r.notificado ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/** INGRESAR: UI Tailwind envolviendo tu componente original sin tocar su lógica */
function IngresarPage() {
  return <NewInfraccionShell onDone={() => (window.location.hash = '#panel')} />;
}

/** ACTA PRESENCIAL: componente de actas presenciales */
function ActaPresencialPage() {
  return <ActaPresencial />;
}

/** CONSULTAR: embeber el submódulo ConsultasSV en un iframe */
function ConsultarPage() {
  const [h, setH] = useState<number>(window.innerHeight - 140);
  useEffect(() => {
    const onR = () => setH(window.innerHeight - 140);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  return (
    <Card>
      <CardBody className="p-0">
        <iframe
          title="Consultas"
          src="/consultas/?embed=1"
          className="w-full rounded-2xl"
          style={{ height: Math.max(480, h) }}
        />
      </CardBody>
    </Card>
  );
}

/* ========= App principal ========= */
export default function SeguridadVialWebUI() {
  const [route, setRoute] = useState<string>(() => {
    const h = (window.location.hash || '').toLowerCase();
    if (h.includes('ingresar')) return 'ingresar';
    if (h.includes('acta-presencial')) return 'acta-presencial';
    if (h.includes('consultar')) return 'consultar';
    if (h.includes('usuarios')) return 'usuarios';
    if (h.includes('test-extraccion')) return 'test-extraccion';
    return 'panel';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sin router: usamos hash
  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || '').toLowerCase();
      if (h.includes('ingresar')) setRoute('ingresar');
      else if (h.includes('acta-presencial')) setRoute('acta-presencial');
      else if (h.includes('consultar')) setRoute('consultar');
      else if (h.includes('usuarios')) setRoute('usuarios');
      else if (h.includes('test-extraccion')) setRoute('test-extraccion');
      else setRoute('panel');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const target = route === 'panel' ? '#panel' : `#${route}`;
    if (window.location.hash !== target) window.location.hash = target;
  }, [route]);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar route={route} setRoute={setRoute} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content - ml-72 en desktop para compensar sidebar fixed (w-72) */}
      <div className="lg:ml-72">
        <div className="flex flex-col min-h-screen">
          {/* Mobile Header */}
          <MobileHeader isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <AnimatePresence mode="wait">
              {route === 'panel' && (
                <motion.div key="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <PanelPage />
                </motion.div>
              )}
              {route === 'ingresar' && (
                <motion.div key="ingresar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <IngresarPage />
                </motion.div>
              )}
              {route === 'acta-presencial' && (
                <motion.div key="acta-presencial" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <ActaPresencialPage />
                </motion.div>
              )}
              {route === 'consultar' && (
                <motion.div key="consultar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <ConsultarPage />
                </motion.div>
              )}
              {route === 'usuarios' && (
                <motion.div key="usuarios" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <UsuariosPage />
                </motion.div>
              )}
              {route === 'test-extraccion' && (
                <motion.div key="test-extraccion" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <TestExtraccion />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

            <div className="mt-8 pb-6 text-xs text-slate-500 text-center">
              UI unificada con Tailwind • Navegación sin cambiar de página • Datos reales del backend principal
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
