import { supabase } from './supabase';

const SESSION_TRACKING_KEY = 'yuvr_session_id';

export const trackSession = async (userId: string) => {
  // 1. Get or create a local session identifier
  let sessionId = localStorage.getItem(SESSION_TRACKING_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_TRACKING_KEY, sessionId);
  }

  // 2. Clean up old sessions (inactive for > 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .lt('last_seen', oneHourAgo);

  // 3. Update current session timestamp
  const { error: upsertError } = await supabase
    .from('user_sessions')
    .upsert(
      { 
        user_id: userId, 
        session_id: sessionId, 
        last_seen: new Date().toISOString() 
      },
      { onConflict: 'user_id, session_id' }
    );

  if (upsertError) {
    console.error('Session tracking error details:', {
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
      code: upsertError.code
    });
    return true; // Assume okay even if tracking fails temporarily
  }

  // 4. Fetch dynamic limit from DB (default to 2 if not found)
  const { data: configData } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'max_concurrent_sessions')
    .single();
  
  const maxSessions = configData?.value || 2;

  // 5. Check active session count (seen in last 1 hour)
  const { data: activeSessions, error: countError } = await supabase
    .from('user_sessions')
    .select('session_id')
    .eq('user_id', userId)
    .gt('last_seen', oneHourAgo);

  if (countError) return true;

  // 6. Enforce dynamic limit
  if (activeSessions && activeSessions.length > maxSessions) {
    return false;
  }

  return true;
};

export const clearAllUserSessions = async (userId: string) => {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error clearing all sessions:', error);
  }
};

export const removeSessionFromDb = async (userId: string) => {
  const sessionId = localStorage.getItem(SESSION_TRACKING_KEY);
  if (sessionId) {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('Error removing session from DB:', error);
    }
  }
};

export const clearLocalSession = () => {
  localStorage.removeItem(SESSION_TRACKING_KEY);
};
