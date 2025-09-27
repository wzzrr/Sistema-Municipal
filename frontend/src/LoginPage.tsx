import React, { useState } from 'react';
import { useAuth } from './auth';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@seguridadvial');
  const [password, setPassword] = useState('password');
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { setErr(''); await login(email, password); } catch (e:any) { setErr(e.message||'Error'); } };
  return (
    <div style={{ minHeight: '100vh', display:'grid', placeItems:'center', background:'#0B1220', color:'#E5E7EB' }}>
      <form onSubmit={submit} style={{ width:'100%', maxWidth:420, border:'1px solid #1F2937', background:'#0B1220', borderRadius:16, padding:24 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:12, background:'#059669', display:'grid', placeItems:'center', color:'#fff' }}><ShieldCheck size={18}/></div>
          <div>
            <div style={{ fontWeight:600 }}>Seguridad Vial</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:-4 }}>Acceso</div>
          </div>
        </div>
        <label style={{ display:'block', fontSize:12, color:'#9CA3AF', marginBottom:4 }}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:12, background:'#111827', color:'#E5E7EB', border:'1px solid #374151', marginBottom:12 }} />
        <label style={{ display:'block', fontSize:12, color:'#9CA3AF', marginBottom:4 }}>Contraseña</label>
        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:12, background:'#111827', color:'#E5E7EB', border:'1px solid #374151' }} />
        {err && <div style={{ color:'#F87171', fontSize:14, marginTop:8 }}>{err}</div>}
        <button style={{ marginTop:16, width:'100%', background:'#059669', color:'#fff', padding:'10px 12px', borderRadius:12, border:'none' }}>Ingresar</button>
      </form>
    </div>
  );
}
