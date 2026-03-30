'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { clearLocalSession } from '@/lib/sessionManager';
import { DynamicBackground } from '@/components/ui/DynamicBackground';

import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function SignupPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const clearSession = async () => {
      console.log('SignupPage mount: Clearing session');
      await supabase.auth.signOut();
      clearLocalSession();
    };
    clearSession();

    // Prevent back navigation
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [supabase]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Check if username or email already exists using an RPC bypass for RLS
    const { data: existsData, error: checkError } = await supabase
      .rpc('check_user_exists', { 
        p_username: username.toLowerCase(), 
        p_email: email.toLowerCase() 
      });

    if (checkError) {
      console.error('Validation check error:', checkError);
      setError(t('auth.errorValidating'));
      setLoading(false);
      return;
    }

    if (existsData?.emailExists) {
      setError(t('auth.emailExists'));
      setLoading(false);
      return;
    }

    if (existsData?.usernameExists) {
      setError(t('auth.usernameExists'));
      setLoading(false);
      return;
    }

    // 2. Proceed with signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          full_name: fullName,
          company_name: '',
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // The database trigger 'on_auth_user_created' automatically handles profile insertion.
      router.push(`/login?message=${encodeURIComponent(t('auth.signupSuccess'))}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent relative p-6 overflow-hidden">
      <DynamicBackground />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{t('auth.backToHome')}</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">{t('common.brandName')}</h1>
          <p className="text-slate-500 mt-2 text-sm">{t('auth.signupSubtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">{t('auth.signup')}</h2>
          </CardHeader>
          <CardContent>
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 mb-4" 
              onClick={async () => {
                setLoading(true);
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (error) {
                  setError(error.message);
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('auth.signupCta')}
            </Button>
            
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">{t('auth.orContinue')}</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label={t('auth.fullName')}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label={t('auth.username')}
                type="text"
                placeholder="yuvr_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="text-sm font-medium text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" isLoading={loading}>
                {t('auth.createAccount')}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-slate-500">
              {t('auth.alreadyAccount')}{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
