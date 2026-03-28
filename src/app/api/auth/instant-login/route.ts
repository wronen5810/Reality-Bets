import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const supabase = createServiceSupabase();

  // Check email is in the allowlist and active
  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('is_active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!allowedUser?.is_active) {
    return NextResponse.json({ error: 'This email is not authorised to access this app' }, { status: 403 });
  }

  // Generate a magic link server-side (does NOT send any email)
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email.toLowerCase().trim(),
  });

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  // Immediately verify the token to get a session — no email ever sent
  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'email',
  });

  if (verifyError || !sessionData.session) {
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }

  return NextResponse.json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });
}
