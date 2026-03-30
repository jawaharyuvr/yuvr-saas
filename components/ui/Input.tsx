import React from 'react';
import { cn } from '@/utils/format';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    // Prevent React NaN warnings if parsed number binds fall strictly empty
    const safeProps = { ...props };
    if (typeof safeProps.value === 'number' && Number.isNaN(safeProps.value)) {
      safeProps.value = '';
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50',
              error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200',
              icon ? 'pl-10' : 'px-3',
              className
            )}
            {...safeProps}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
