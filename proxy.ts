import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/groups",
  "/tasks",
  "/proof-work",
  "/uploads",
  "/assignments",
  "/profile",
];

// Routes only for unauthenticated users (redirect to dashboard if already logged in)
const AUTH_ROUTES = ["/login", "/signup"];

// better-auth stores the session token in this cookie
const SESSION_COOKIE = "better-auth.session_token";

function hasSession(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE)?.value;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = hasSession(request);

  // Logged-in user hitting landing page or auth routes → send to dashboard
  if (loggedIn && (pathname === "/" || AUTH_ROUTES.some((r) => pathname.startsWith(r)))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user hitting a protected route → send to login
  if (!loggedIn && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - api routes (auth handles its own session)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
