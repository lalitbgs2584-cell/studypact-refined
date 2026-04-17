import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "./lib/auth";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/leader",
  "/leaderboard",
  "/groups",
  "/tasks",
  "/proof-work",
  "/uploads",
  "/assignments",
  "/profile",
];

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/login", "/signup"];

async function hasSession(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    return !!session;
  } catch (err) {
    console.error("Session check failed:", err);
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const loggedIn = await hasSession(request);

  // 🔹 If logged in and visiting login/signup → redirect to dashboard
  if (
    loggedIn &&
    (pathname === "/" || AUTH_ROUTES.some((route) => pathname.startsWith(route)))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 🔹 If NOT logged in and trying to access protected route → redirect to login
  if (
    !loggedIn &&
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
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
     * - Next.js internals
     * - API routes (Better Auth handles them)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};