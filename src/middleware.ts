import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    const roleHome: Record<string, string> = {
      ALUMNO: "/alumno",
      PROFESOR: "/profesor",
      ADMIN: "/admin",
    };

    const isAllowed =
      (path.startsWith("/alumno") && role === "ALUMNO") ||
      (path.startsWith("/profesor") && (role === "PROFESOR" || role === "ADMIN")) ||
      (path.startsWith("/admin") && role === "ADMIN");

    if (!isAllowed && role) {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/alumno/:path*", "/profesor/:path*", "/admin/:path*"],
};
