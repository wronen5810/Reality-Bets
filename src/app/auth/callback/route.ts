import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c: { name: string; value: string; options?: object }[]) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)),
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'email',
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
}
