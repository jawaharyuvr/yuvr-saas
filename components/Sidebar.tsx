'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  CreditCard,
  Package,
  TrendingDown,
  UserCheck,
  Globe,
  BarChart3,
  Activity,
  FileSignature
} from 'lucide-react';
import { cn } from '@/utils/format';
import { supabase } from '@/lib/supabase';
import { trackSession, performSignOut } from '@/lib/sessionManager';

import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string>('admin');

  React.useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: staffData } = await supabase.from('staff').select('role').eq('user_id', user.id).single();
    if (staffData?.role) {
      setUserRole(staffData.role);
    }
  };

  const navItems = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.clients'), href: '/dashboard/clients', icon: Users },
    { name: t('sidebar.invoices'), href: '/dashboard/invoices', icon: FileText },
    { name: t('sidebar.estimates'), href: '/dashboard/estimates', icon: FileSignature },
    { name: t('sidebar.inventory'), href: '/dashboard/inventory', icon: Package },
    { name: t('sidebar.expenses'), href: '/dashboard/expenses', icon: TrendingDown },
    { name: t('sidebar.staff'), href: '/dashboard/settings/staff', icon: UserCheck },
    { name: t('sidebar.analytics'), href: '/dashboard/analytics', icon: BarChart3 },
    { name: t('sidebar.exchange_rates'), href: '/dashboard/exchange-rates', icon: Activity },
    { name: t('sidebar.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await performSignOut();
  };

  return (
    <div className="flex flex-col w-64 border-r border-white/30 bg-white/60 backdrop-blur-xl h-screen relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
            {t('common.brandName')}
          </h1>
        </Link>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <PlusCircle size={18} />
          <span>{t('sidebar.newInvoice')}</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => {
           if (userRole === 'staff') {
             return ['/dashboard', '/dashboard/clients', '/dashboard/invoices'].includes(item.href);
           }
           if (userRole === 'viewer') {
             return ['/dashboard'].includes(item.href);
           }
           return true; 
        }).map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : item.name === 'Settings' 
              ? pathname === '/dashboard/settings' // Settings only active on main settings page
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              )}
            >
              <item.icon size={20} className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto space-y-4">
        <LanguageSwitcher />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut size={20} />
          {t('sidebar.signOut')}
        </button>
      </div>
    </div>
  );
}
