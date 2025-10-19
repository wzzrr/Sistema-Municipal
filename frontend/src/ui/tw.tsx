// frontend/src/ui/tw.tsx
import React from 'react';

export function TWCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        // Tailwind
        'rounded-xl border shadow-sm',
        'bg-[var(--panel)] border-[var(--border)] text-[var(--text)]',
        // A la vez mantenemos la clase legacy .card por compatibilidad
        'card',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function TWCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['border-b border-[var(--border)] p-4', 'card__header', className].join(' ')}>{children}</div>
  );
}

export function TWCardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={['p-4', 'card__content', className].join(' ')}>{children}</div>;
}

export function TWButton({
  children,
  variant = 'default',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger' }) {
  const base =
    'inline-flex items-center justify-center h-10 px-4 rounded-lg border font-semibold transition hover:brightness-105 active:translate-y-[1px]';
  const variants: Record<string, string> = {
    default: 'bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)]',
    primary: 'bg-[var(--primary)] border-[color-mix(in oklab,var(--primary) 55%,black)] text-white',
    ghost: 'bg-transparent border-[var(--border)] text-[var(--text)]',
    danger: 'bg-[var(--danger)] border-transparent text-white',
  };
  return (
    <button className={[base, variants[variant], className, 'btn'].join(' ')} {...rest}>
      {children}
    </button>
  );
}

export function TWInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full h-10 px-3 rounded-md border outline-none transition',
        'bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)]',
        'focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in oklab,var(--primary) 30%,transparent)]',
        'input', // mantiene clase legacy
        props.className || '',
      ].join(' ')}
    />
  );
}
