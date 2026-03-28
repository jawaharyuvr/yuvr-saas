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
  UserCheck
} from 'lucide-react';
import { cn } from '@/utils/format';
import { supabase } from '@/lib/supabase';
import { trackSession, clearLocalSession, removeSessionFromDb } from '@/lib/sessionManager';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Expenses', href: '/dashboard/expenses', icon: TrendingDown },
  { name: 'Staff', href: '/dashboard/settings/staff', icon: UserCheck },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LayoutDashboard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await removeSessionFromDb(user.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      clearLocalSession();
      router.replace('/login');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col w-64 border-r border-white/30 bg-white/60 backdrop-blur-xl h-screen relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
            Yuvr's
          </h1>
        </Link>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <PlusCircle size={18} />
          <span>New Invoice</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
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

      <div className="p-4 border-t border-slate-100 mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
