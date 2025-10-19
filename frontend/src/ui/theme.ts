// frontend/src/ui/theme.ts
import { useEffect, useState } from 'react';

const KEY = 'sv.theme'; // 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = (localStorage.getItem(KEY) as 'dark' | 'light' | null);
    if (saved) return saved;
    // preferencia del SO
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggle, isDark: theme === 'dark' };
}
