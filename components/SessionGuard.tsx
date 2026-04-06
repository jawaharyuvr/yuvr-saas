'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackSession, performSignOut, clearAllUserSessions } from '@/lib/sessionManager';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('SessionGuard check - User:', user?.id);
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      const isAllowed = await trackSession(user.id);
      console.log('SessionGuard - isAllowed:', isAllowed);
      
      if (!isAllowed) {
        console.warn('SessionGuard - Concurrent limit reached.');
        setCurrentUserId(user.id);
        setShowConflictModal(true);
        return;
      }

      setAuthorized(true);
    };

    checkSession();

    // Optionally set up an interval to refresh the "last_seen" timestamp
    const interval = setInterval(checkSession, 5 * 60 * 1000); // every 5 mins

    return () => clearInterval(interval);
  }, [router]);

  const handleLogoutAll = async () => {
    if (!currentUserId) return;
    setIsProcessing(true);
    try {
      await clearAllUserSessions(currentUserId);
      await performSignOut();
    } catch (error) {
      console.error('Error in handleLogoutAll:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualLogout = async () => {
    setIsProcessing(true);
    await performSignOut();
  };

  if (showConflictModal) {
    return (
      <Modal 
        isOpen={showConflictModal} 
        onClose={() => {}} // Disable closing via X or Escape
        title="Session Limit Reached"
        maxWidth="sm"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={24} />
          </div>
          <p className="text-slate-600 mb-6">
            You've reached your concurrent login limit. Would you like to log out from all other sessions to continue here?
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleLogoutAll} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              isLoading={isProcessing}
            >
              Log out from all sessions
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualLogout} 
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
