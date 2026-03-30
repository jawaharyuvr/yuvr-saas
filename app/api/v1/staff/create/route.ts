import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization headers.' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json(
         { error: 'Server initialization failure. Missing SUPABASE_SERVICE_ROLE_KEY or Base URLs.' }, 
         { status: 500 }
      );
    }

    // Authenticate the invoking Admin token
    const clientUser = createClient(supabaseUrl, anonKey);
    const { data: { user: adminUser }, error: verifyError } = await clientUser.auth.getUser(token);
    
    if (verifyError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized administrative request.' }, { status: 401 });
    }

    const { email, password, username, role } = await req.json();
    if (!email || !password || !username || !role) {
      return NextResponse.json({ error: 'Missing absolute required staff parameters.' }, { status: 400 });
    }

    // Boot a hardened backend Service Client resolving over the standard RLS locks.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Explicitly provision the user over Admin namespace (bypass typical signup flow and auto-logout)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: username }
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed provisioning auth identity.' }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Database triggers often duplicate profile construction on Auth append, but just in case, we patch the attributes globally.
    await supabaseAdmin.from('profiles').update({
       username: username,
       full_name: username
    }).eq('id', newUserId);

    // Hard-link the new user ID strictly to the active Admin's business ID node as a subordinate.
    const { error: staffError } = await supabaseAdmin.from('staff').insert({
       business_id: adminUser.id,
       user_id: newUserId,
       role: role
    });

    // Only throw explicit blocks on actual operational breakdown, not trigger overlap.
    if (staffError && staffError.code !== '23505') {
       return NextResponse.json({ error: staffError.message }, { status: 400 });
    }

    return NextResponse.json({ user: authData.user, success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
