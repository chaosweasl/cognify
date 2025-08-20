import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users: only allow /, /login, /auth/callback, /auth/confirm
  if (
    !user &&
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/login" &&
    request.nextUrl.pathname !== "/auth/callback" &&
    request.nextUrl.pathname !== "/auth/confirm" &&
    request.nextUrl.pathname !== "/auth/auth-code-error"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Onboarding: Redirect authenticated users who haven't completed onboarding

  if (user) {
    // Fetch onboarding_completed from the profiles table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // If no profile, force login
    if (error || !profile) {
      if (!request.nextUrl.pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    } else if (profile.onboarding_completed === false) {
      // If onboarding not complete, force onboarding
      if (!request.nextUrl.pathname.startsWith("/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    } else if (profile.onboarding_completed === true) {
      // If onboarding complete, block /onboarding and redirect to dashboard
      if (
        request.nextUrl.pathname.startsWith("/onboarding") ||
        request.nextUrl.pathname === "/"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect authenticated users away from /login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
