import React from 'react';
import { cn } from '@/utils/format';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        'bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl shadow-slate-200/20 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-200/50', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 bg-slate-50/50 border-t border-slate-200/50', className)} {...props}>
      {children}
    </div>
  );
}
