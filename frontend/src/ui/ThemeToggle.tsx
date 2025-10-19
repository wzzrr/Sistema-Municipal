// frontend/src/ui/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      className="
        inline-flex items-center justify-center
        h-9 w-9 rounded-xl border border-[var(--border)]
        bg-[var(--panel-2)] text-[var(--text)]
        hover:brightness-105 transition
      "
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
