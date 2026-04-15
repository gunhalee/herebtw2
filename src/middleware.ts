import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectLegacyCandidateHomeRequest(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return null;
  }

  const candidateId = request.nextUrl.searchParams.get("candidateId")?.trim();

  if (!candidateId) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/voices/candidate/${encodeURIComponent(candidateId)}`;
  redirectUrl.searchParams.delete("candidateId");

  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const legacyCandidateRedirect = redirectLegacyCandidateHomeRequest(request);

  if (legacyCandidateRedirect) {
    return legacyCandidateRedirect;
  }

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/candidate")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/candidate/:path*"],
};
