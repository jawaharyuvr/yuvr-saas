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
  const [success, setSuccess] = useState(false);
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

    // 1. Check if username is unique
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error('Username check error:', checkError);
      setError('Error checking username availability. Please try again.');
      setLoading(false);
      return;
    }

    if (existingUser) {
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
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      // Create profile with username
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          username: username.toLowerCase(),
          full_name: fullName, // Use fullName from state
          company_name: '',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError('Failed to create user profile. Please try again.'); // Inform user about profile error
        setLoading(false);
        return;
      }
      setSuccess(true); // Set success after profile creation
      setLoading(false);
      // router.replace('/dashboard'); // Removed, as success state handles the next step (email check)
    } else {
      // This case might happen if signup is successful but data.user is null (e.g., email confirmation needed)
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent relative p-4">
        <DynamicBackground />
        <Card className="w-full max-w-md text-center p-8">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="text-slate-500 mt-2">
            We've sent a confirmation link to <strong>{email}</strong>. 
            Please check your inbox to activate your account.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
