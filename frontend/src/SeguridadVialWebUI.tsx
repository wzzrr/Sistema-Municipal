import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search as SearchIcon, Camera, LogOut, Sun, Moon, FileText, Bell } from 'lucide-react';
import { useAuth } from './auth';
import NewInfraccionShell from './NewInfraccionShell';
import { Card, CardBody, Button, StatusBadge } from './ui'; // ⬅️ reutilizamos el micro-kit

/* ========= Helpers ========= */
type SVRow = {
  id: number;
  nro_acta?: string;
  acta?: string;
  dominio?: string;
  estado?: string;
  fecha_carga?: string;  // preferido
  created_at?: string;   // fallback
  fecha_labrado?: string;
  arteria?: string | null;
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

/* ========= Topbar ========= */
function Topbar({ route, setRoute }: { route: string; setRoute: (r: string) => void }) {
  const { user, logout } = useAuth() as any;
  const { dark, setDark } = useTheme();

  const Tab: React.FC<{ k: string; label: string; icon: React.ReactNode }> = ({ k, label, icon }) => (
    <button
      onClick={() => setRoute(k)}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-900 ${
        route === k ? 'bg-slate-100 dark:bg-slate-900' : ''
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 backdrop-blur bg-white/70 dark:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white grid place-items-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold leading-4">Seguridad Vial</div>
            <div className="text-xs text-slate-500 -mt-0.5">Sistema de infracciones</div>
          </div>
        </div>

        <div className="ml-6 flex items-center gap-1">
          <Tab k="panel" label="Panel" icon={<ShieldCheck className="w-4 h-4" />} />
          <Tab k="ingresar" label="Ingresar" icon={<Camera className="w-4 h-4" />} />
          <Tab k="consultar" label="Consultar" icon={<SearchIcon className="w-4 h-4" />} />
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {/* Toggle tema */}
          <button
            onClick={() => setDark(!dark)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
            title={`Tema: ${dark ? 'Oscuro' : 'Claro'}`}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{dark ? 'Oscuro' : 'Claro'}</span>
          </button>

          <div className="text-slate-500 hidden md:block">{user?.email}</div>
          <Button variant="ghost" onClick={() => { try { logout?.(); } catch {} }}>
            <LogOut className="w-4 h-4" /> Salir
          </Button>
        </div>
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

/** PANEL: usa /api del backend principal (mismo origen) */
function PanelPage() {
  const { api } = useAuth();
  const [rows, setRows] = useState<SVRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [notiHoy, setNotiHoy] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const fetchInfraccionesSV = async (params: Record<string, any>) => {
    const url = `/api/infracciones${toQS(params)}`;
    const r = await api(url);
    const txt = await r.text();
    if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
    if (txt.trim().startsWith('<')) throw new Error(`El endpoint ${url} devolvió HTML (no JSON). Revisá el proxy de /api.`);
    const data = JSON.parse(txt);
    const items: SVRow[] = Array.isArray(data) ? data : (data.items || []);
    const total: number = (data.total ?? (Array.isArray(data) ? data.length : items.length)) || 0;
    return { items, total };
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr('');

        // Últimas (limit=5); el backend ya ordena DESC
        const { items: last5, total } = await fetchInfraccionesSV({ limit: 5 });
        setRows(sortDesc(last5));
        setTotal(total);

        // Notificadas HOY (si el backend lo soporta)
        try {
          const today = ymd(new Date());
          const { total: tHoy, items } = await fetchInfraccionesSV({ estado: 'notificadas', desde: today, hasta: today, limit: 1 });
          setNotiHoy(tHoy || items.length || 0);
        } catch {
          setNotiHoy(0);
        }
      } catch (e: any) {
        setErr(e.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const ultimas5 = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Actas totales" value={total || '—'} icon={<FileText className="w-5 h-5" />} />
        <KpiCard title="Actas notificadas hoy" value={notiHoy} icon={<Bell className="w-5 h-5" />} />
        <Card>
          <CardBody>
            <div className="text-sm text-slate-500">Acceso rápido</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <a href="#consultar"><Button variant="outline"><SearchIcon className="w-4 h-4" /> Consultar</Button></a>
              <a href="#ingresar"><Button variant="outline"><Camera className="w-4 h-4" /> Ingresar</Button></a>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Últimas 5 */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Actividad reciente</div>
              <div className="text-lg font-semibold">Últimas infracciones cargadas</div>
            </div>
            <a href="#consultar"><Button variant="outline">Ver todas</Button></a>
          </div>

          <div className="mt-4">
            {loading && <div className="text-slate-500">Cargando…</div>}
            {err && <div className="text-rose-500">{err}</div>}
            {!loading && !err && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2">Acta</th>
                      <th>Dominio</th>
                      <th>Arteria</th>
                      <th>Fecha de carga</th>
                      <th>Fecha labrado</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimas5.length === 0 ? (
                      <tr><td colSpan={6} className="py-4 text-center text-slate-500">No hay infracciones todavía.</td></tr>
                    ) : (
                      ultimas5.map((r) => {
                        const acta = r.nro_acta || r.acta || `A-${String(r.id).padStart(7, '0')}`;
                        return (
                          <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="py-2 font-mono">{acta}</td>
                            <td>{r.dominio || '—'}</td>
                            <td>{r.arteria || '—'}</td>
                            <td>{fmtFechaHora(r.fecha_carga || r.created_at)}</td>
                            <td>{fmtFechaHora(r.fecha_labrado)}</td>
                            <td><StatusBadge estado={r.estado || ''} /></td>
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
    if (h.includes('consultar')) return 'consultar';
    return 'panel';
  });

  // Sin router: usamos hash
  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || '').toLowerCase();
      if (h.includes('ingresar')) setRoute('ingresar');
      else if (h.includes('consultar')) setRoute('consultar');
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
      <Topbar route={route} setRoute={setRoute} />
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
          {route === 'consultar' && (
            <motion.div key="consultar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <ConsultarPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pb-6 text-xs text-slate-500 text-center">
        UI unificada con Tailwind • Navegación sin cambiar de página • Datos reales del backend principal
      </div>
    </div>
  );
}
