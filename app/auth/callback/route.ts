import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

let SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cognify-chaosweasl.vercel.app';
if (process.env.NODE_ENV === 'development') {
  SITE_URL = 'http://localhost:3000';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Always redirect to the correct next path after successful OAuth
      return NextResponse.redirect(`${SITE_URL}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${SITE_URL}/auth/auth-code-error`)
}