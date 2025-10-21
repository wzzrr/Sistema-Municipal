// frontend/src/auth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'dev' | 'admin' | 'agente';
type User = { id: number; email: string; nombre?: string; rol: Role } | null;

type AuthCtx = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  api: (input: RequestInfo | string, init?: RequestInit) => Promise<Response>;
};

const Ctx = createContext<AuthCtx>(null as any);

// Permite override en desarrollo con Vite: VITE_API_BASE=http://localhost:3000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE
    ? String((import.meta as any).env.VITE_API_BASE).replace(/\/$/, '') // sin trailing slash
    : ''; // en prod el Nginx hace proxy en /api

function buildUrl(input: RequestInfo | string): string | RequestInfo {
  if (typeof input !== 'string') return input;
  // Si te pasan "/api/...": respeta tal cual
  if (input.startsWith('/api')) return input;
  // Si te pasan una ruta de API relativa ("me", "/infracciones", etc.)
  if (input.startsWith('/')) return `${API_BASE}${input}`;       // "/infracciones" -> "/api/infracciones" (si API_BASE === '')
  return `${API_BASE}/api/${input}`.replace('//api', '/api');     // "auth/login" -> "/api/auth/login"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(buildUrl('/api/auth/me'), { credentials: 'include' });
        if (r.ok) {
          const j = await r.json();
          setUser(j?.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(buildUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!r.ok) {
      // 401 u otro
      const msg = await (async () => {
        try { const j = await r.json(); return j?.message || 'Login inválido'; } catch { return 'Login inválido'; }
      })();
      throw new Error(msg);
    }

    // 201 con body { user }  
    try {
      const j = await r.json();
      if (j?.user) {
        setUser(j.user);
      } else {
        // fallback: vuelvo a consultar /me
        const rr = await fetch(buildUrl('/api/auth/me'), { credentials: 'include' });
        setUser(rr.ok ? (await rr.json())?.user ?? null : null);
      }
    } catch {
      // Si por alguna razón no hay JSON, pedir /me
      const rr = await fetch(buildUrl('/api/auth/me'), { credentials: 'include' });
      setUser(rr.ok ? (await rr.json())?.user ?? null : null);
    }
  };

  const logout = async () => {
    try {
      await fetch(buildUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
    }
  };

  const api = (input: RequestInfo | string, init?: RequestInit) => {
    const url = buildUrl(input);
    return fetch(url as RequestInfo, { credentials: 'include', ...(init || {}) });
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
