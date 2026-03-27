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

export default function SignupPage() {
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
      setError('Error validating user details. Please try again.');
      setLoading(false);
      return;
    }

    if (existsData?.emailExists) {
      setError('This email is already registered. Please sign in instead.');
      setLoading(false);
      return;
    }

    if (existsData?.usernameExists) {
      setError('This username is already taken. Please choose another one.');
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
      router.push('/login?message=Account created successfully. Please log in.');
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
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">Yuvr's</h1>
          <p className="text-slate-500 mt-2 text-sm">Start generating professional invoices</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Create Account</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Username"
                type="text"
                placeholder="yuvr_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="text-sm font-medium text-rose-500 bg-rose-50 p-3 rounded-lg">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" isLoading={loading}>
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
