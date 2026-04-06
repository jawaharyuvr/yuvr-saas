'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { performSignOut } from '@/lib/sessionManager';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

export function InactivityTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleTimeout = useCallback(async () => {
    // Only timeout if we are on a dashboard route
    if (!pathname.startsWith('/dashboard')) return;

    console.log('User inactive for 10 minutes. Logging out.');
    const params = new URLSearchParams({
      message: 'Session expired due to inactivity. Please log in again.'
    });
    await performSignOut(`/login?${params.toString()}`);
  }, [pathname, router, supabase]);

  useEffect(() => {
    if (!pathname.startsWith('/dashboard')) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleTimeout, TIMEOUT_MS);
    };

    // Initialize timer
    resetTimer();

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [handleTimeout, pathname]);

  return null; // Logic-only component
}
