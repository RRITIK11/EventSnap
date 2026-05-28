import NextAuth from "next-auth";

import { authConfig } from "@/auth";

// Run Auth.js as middleware so the `authorized` callback in authConfig
// can gate routes before they render.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Skip static assets and the Auth.js routes themselves.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
