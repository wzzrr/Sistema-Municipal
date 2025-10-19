import React from 'react';
import SeguridadVialWebUI from './SeguridadVialWebUI';
import LoginPage from './LoginPage';
import { AuthProvider, useAuth } from './auth';


function ProtectedApp() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding:24 }}>Cargando…</div>;
  if (!user) return <LoginPage />;
  return <SeguridadVialWebUI />;
}
export default function App() { return (<AuthProvider><ProtectedApp /></AuthProvider>); }
