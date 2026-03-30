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
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
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
      setError(t('auth.recover.errorExpired'));
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
      setError(t('auth.recover.errorToken'));
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
        setError(t('auth.recover.errorToken'));
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
      setError(t('settings.errorPasswordMatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('settings.errorPasswordShort'));
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
        <div className="flex items-center justify-between mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{t('auth.login')}</span>
          </Link>
          <LanguageSwitcher />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">{t('common.brandName')}</h1>
          <p className="text-slate-500 mt-2 text-sm">{t('auth.recover.title')}</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">
              {step === 1 && t('auth.recover.step1_title')}
              {step === 2 && t('auth.recover.step2_title')}
              {step === 3 && t('auth.recover.step3_title')}
              {step === 4 && t('auth.recover.step4_title')}
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
                    {t('auth.recover.step1_desc')}
                  </p>
                  <Input
                    label={t('auth.email')}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail size={18} />}
                  />
                  {error && <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading}>
                    {t('auth.recover.send_code')}
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
                  <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">
                    {t('auth.recover.step2_desc')}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('auth.recover.expires_in')}</span>
                    <span className={`text-sm font-bold ${timer < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                      {formatTime(timer)}
                    </span>
                  </div>

                  <Input
                    label={t('auth.recover.code_label')}
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
                  {error && <p className={`text-sm p-3 rounded-lg border ${isExpired ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-rose-500 bg-rose-50 border-rose-100'}`}>{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading} disabled={isExpired}>
                    {t('auth.recover.verify_code')}
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
                    {t('auth.recover.request_new')}
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
                    label={t('auth.recover.new_password')}
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    icon={<Lock size={18} />}
                  />
                  <Input
                    label={t('auth.recover.confirm_password')}
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {error && <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
                  <Button type="submit" className="w-full" isLoading={loading}>
                    {t('auth.recover.reset_btn')}
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
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t('auth.recover.success_title')}</h3>
                  <p className="text-slate-500 mb-8">
                    {t('auth.recover.success_desc')}
                  </p>
                  <Link href="/login">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {t('auth.recover.login_btn')}
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
