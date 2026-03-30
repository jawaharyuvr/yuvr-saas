'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/utils/format';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

export function LanguageSwitcher({ className, variant = 'full' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm shadow-sm transition-all hover:border-indigo-200",
      className
    )}>
      <Globe size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="bg-transparent text-[11px] font-black text-slate-700 outline-none uppercase tracking-widest cursor-pointer w-full"
      >
        <option value="en">English</option>
        <option value="ta">தமிழ்</option>
        <option value="hi">हिन्दी</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );
}
