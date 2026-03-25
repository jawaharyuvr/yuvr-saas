'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { clearLocalSession } from '@/lib/sessionManager';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { ArrowLeft, Mail, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicBackground } from '@/components/ui/DynamicBackground';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    // This happens when a user clicks a reset link in their email
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event in ForgotPassword:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Recovery link detected, moving to step 3');
        setStep(3);
      }
    });

    // Countdown timer for Step 2
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsExpired(true);
      setError('Your recovery code has expired. Please request a new one.');
    }

    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [supabase, step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep(2);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isExpired) {
      setError('Token expired. Please request a new one.');
      setLoading(false);
      return;
    }

    // Supabase allows verifying OTP with type 'recovery'
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    if (error) {
      if (error.message.toLowerCase().includes('expired')) {
        setIsExpired(true);
        setError('Token expired. Please go back and request a new code.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      setStep(3);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        // Sign out to ensure they have to log in with the new password
        await supabase.auth.signOut({ scope: 'global' });
        clearLocalSession();
        setStep(4);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent relative p-6 overflow-hidden">
      <DynamicBackground />
      <div className="w-full max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Login</span>
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Yuvr's</h1>
          <p className="text-slate-500 mt-2 text-sm">Account Recovery</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">
              {step === 1 && "Reset Password"}
              {step === 2 && "Enter Recovery Code"}
              {step === 3 && "Set New Password"}
              {step === 4 && "Password Reset Successful"}
            </h2>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1" 
                  variants={variants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit"
                  onSubmit={handleRequestOtp} 
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 mb-4">
                    Enter the email associated with your account and we'll send you a recovery code.
                  </p>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail size={18} />}
                  />
                  {error && <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading}>
                    Send Recovery Code
                  </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form 
                  key="step2" 
                  variants={variants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit"
                  onSubmit={handleVerifyOtp} 
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 mb-4">
                    We've sent an email to <span className="font-bold">{email}</span>. 
                    <br /><br />
                    If you received an 8-digit code, enter it below. If you received a link, please click it to continue.
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Code expires in:</span>
                    <span className={`text-sm font-bold ${timer < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                      {formatTime(timer)}
                    </span>
                  </div>

                  <Input
                    label="Recovery Code (8-digits)"
                    type="text"
                    placeholder=""
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => e.target.placeholder = '12345678'}
                    required
                    disabled={isExpired}
                    className="text-center text-2xl tracking-[0.5em] font-bold"
                  />
                  {error && <p className={`text-sm p-3 rounded-lg ${isExpired ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-rose-500 bg-rose-50'}`}>{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading} disabled={isExpired}>
                    Verify Code
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep(1);
                      setTimer(300);
                      setIsExpired(false);
                      setError(null);
                    }} 
                    className="text-sm text-indigo-600 font-medium w-full text-center hover:underline"
                  >
                    Request a new code
                  </button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form 
                  key="step3" 
                  variants={variants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit"
                  onSubmit={handleResetPassword} 
                  className="space-y-4"
                >
                   <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    icon={<Lock size={18} />}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {error && <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading}>
                    Reset Password
                  </Button>
                </motion.form>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4" 
                  variants={variants} 
                  initial="initial" 
                  animate="animate" 
                  className="text-center py-6"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">You're all set!</h3>
                  <p className="text-slate-500 mb-8">
                    Your password has been successfully reset. You can now login with your new password.
                  </p>
                  <Link href="/login">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Continue to Login
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
