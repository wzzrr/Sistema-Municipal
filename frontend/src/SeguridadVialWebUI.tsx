import React, { useEffect, useState } from 'react';
import { useAuth } from './auth';
import NewInfraccion from './NewInfraccion';

export default function SeguridadVialWebUI() {
  const { user, api, logout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const r = await api('/api/infracciones');
      if (r.ok) {
        const j = await r.json();
        setItems(j.items || []);
        setMsg('');
      } else if (r.status === 401) {
        setMsg('No autorizado');
      } else {
        setMsg('Error al cargar');
      }
    } catch {
      setMsg('Error de red');
    }
  };

  useEffect(() => { load(); }, []);

  const canCreate = user?.rol === 'admin' || user?.rol === 'operador';

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2>Panel – Seguridad Vial</h2>
        <div>
          {canCreate && (
            <button onClick={()=>setAdding(v=>!v)} style={{ marginRight:8 }}>
              {adding ? 'Cerrar' : 'Nueva Infracción'}
            </button>
          )}
          <span style={{ marginRight:12 }}>{user?.email} ({user?.rol})</span>
          <button onClick={logout}>Salir</button>
        </div>
      </div>

      {adding && <NewInfraccion onDone={() => { setAdding(false); load(); }} />}

      {msg && <div>{msg}</div>}

      <div style={{ display:'grid', gap:8 }}>
        {items.map((it) => (
          <div key={it.id} style={{ padding:12, border:'1px solid #e5e7eb', borderRadius:12 }}>
            <b>{it.nro_acta}</b> — {it.dominio} — {it.estado}
          </div>
        ))}
        {!items.length && !msg && <div>Sin datos aún…</div>}
      </div>
    </div>
  );
}
