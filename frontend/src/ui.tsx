// src/ui.tsx
import * as React from 'react';

/* ==========================================================================
   CARD
   ========================================================================== */
export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div
    className={`rounded-2xl border border-slate-200 dark:border-slate-800 
                bg-white dark:bg-slate-950 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export const CardBody: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = 'p-4',
  children,
}) => <div className={className}>{children}</div>;

/* ==========================================================================
   BUTTON
   ========================================================================== */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
};

export const Button: React.FC<BtnProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const base =
    'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition focus:outline-none';
  const map: Record<string, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline:
      'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900',
    ghost:
      'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900',
  };
  return (
    <button className={`${base} ${map[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

/* ==========================================================================
   LABEL
   ========================================================================== */
export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <label
    className={`text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}
    {...rest}
  >
    {children}
  </label>
);

/* ==========================================================================
   INPUT / SELECT / TEXTAREA
   ========================================================================== */
const baseField =
  'w-full px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none ' +
  'transition-[box-shadow,border-color,background-color] duration-150 ' +
  'focus:ring-2 focus:ring-emerald-600 focus:border-transparent';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => <input {...props} className={`${baseField} ${className}`} />;

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <select {...props} className={`${baseField} ${className}`}>
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...props
}) => (
  <textarea
    {...props}
    className={`${baseField} h-28 resize-y ${className}`}
  />
);

/* ==========================================================================
   FORM ROW (Label + Control + Help)
   ========================================================================== */
export const FormRow: React.FC<
  React.PropsWithChildren<{
    label?: string;
    htmlFor?: string;
    help?: string;
    className?: string;
  }>
> = ({ label, htmlFor, help, className = '', children }) => (
  <div className={`grid gap-1 ${className}`}>
    {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
    {children}
    {help ? <div className="text-xs text-slate-500">{help}</div> : null}
  </div>
);

/* ==========================================================================
   STATUS BADGE
   ========================================================================== */
export const StatusBadge: React.FC<{ estado?: string }> = ({ estado = '' }) => {
  const e = estado.toLowerCase();
  const tone =
    e.includes('valida')
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : e.includes('noti')
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      : e.includes('anul')
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  return <span className={`px-2 py-1 rounded-full text-xs ${tone}`}>{estado || '—'}</span>;
};
