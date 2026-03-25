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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const clearSession = async () => {
      console.log('LoginPage mount: Clearing session');
      await supabase.auth.signOut();
      clearLocalSession();
    };
    clearSession();

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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier.toLowerCase())
        .single();
      
      if (profileError || !profileData) {
        setError('Invalid username or email');
        setLoading(false);
        return;
      }
      loginEmail = profileData.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setError(error.message);
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
              {error && (
                <p className="text-sm font-medium text-rose-500 bg-rose-50 p-3 rounded-lg">
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
