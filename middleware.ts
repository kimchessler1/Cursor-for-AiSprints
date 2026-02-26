import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

/**
 * Middleware for route protection
 * Protects authenticated routes and redirects unauthenticated users
 */

// Routes that require authentication
const protectedRoutes = ["/", "/mcqs"];

// Routes that should redirect authenticated users
const authRoutes = ["/login", "/signup"];

// Public routes that don't require authentication
const publicRoutes = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
];

// Static assets and Next.js internal routes
const staticRoutes = [
  "/_next/",
  "/favicon.ico",
  "/public/",
  "/static/",
  "/assets/",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("pathname", pathname);

  // Allow static assets and Next.js internal routes
  if (
    staticRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const isAuthenticated = await getCurrentSession();

  // Handle protected routes
  if (
    protectedRoutes.some((route) =>
      route === "/" ? pathname === "/" : pathname.startsWith(route)
    )
  ) {
    if (!isAuthenticated) {
      // Redirect to login page
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (login/signup)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Redirect authenticated users to MCQs page
      const mcqsUrl = new URL("/mcqs", request.url);
      return NextResponse.redirect(mcqsUrl);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
