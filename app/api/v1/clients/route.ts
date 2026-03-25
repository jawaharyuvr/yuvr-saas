import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // 1. Find profile by API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    // 2. Fetch clients for this user
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('user_id', profile.id)
      .order('name');

    if (clientsError) throw clientsError;

    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
