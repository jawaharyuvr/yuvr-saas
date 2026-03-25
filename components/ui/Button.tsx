import React from 'react';
import { cn } from '@/utils/format';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all duration-200',
      secondary: 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all duration-200',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 hover:border-slate-300 text-slate-900 transition-all duration-200',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 transition-all duration-200',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md hover:-translate-y-0.5 shadow-sm transition-all duration-200',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
