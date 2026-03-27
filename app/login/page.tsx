'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { clearLocalSession } from '@/lib/sessionManager';
import { DynamicBackground } from '@/components/ui/DynamicBackground';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const clearSession = async () => {
      console.log('LoginPage mount: Clearing session');
      await supabase.auth.signOut();
      clearLocalSession();
    };
    clearSession();

    // Check for messages in URL (e.g. from inactivity timeout)
    const searchParams = new URLSearchParams(window.location.search);
    const msg = searchParams.get('message');
    if (msg) {
      setMessage(msg);
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }

    // Prevent back navigation to dashboard/previous authenticated state
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let loginEmail = identifier;

    // Resolve username to email if it's not an email address
    if (!identifier.includes('@')) {
      const { data: resolvedEmail, error: resolveError } = await supabase
        .rpc('get_email_by_username', { p_username: identifier.toLowerCase() });
      
      if (resolveError || !resolvedEmail) {
        setError('Invalid username or email');
        setLoading(false);
        return;
      }
      loginEmail = resolvedEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email address to log in. Check your inbox for the confirmation link.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent relative p-6 overflow-hidden">
      <DynamicBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">Yuvr's</h1>
          <p className="text-slate-500 mt-2 text-sm">Sign in to manage your invoices</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Login</h2>
          </CardHeader>
          <CardContent>
            <Button 
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
              Sign in with Google
            </Button>
            
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email or Username"
                type="text"
                placeholder="you@example.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                icon={<Mail size={18} />}
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={<Lock size={18} />}
                />
              </div>
              {message && (
                <p className="text-sm font-medium text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  {message}
                </p>
              )}
              {error && (
                <p className="text-sm font-medium text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" isLoading={loading}>
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
