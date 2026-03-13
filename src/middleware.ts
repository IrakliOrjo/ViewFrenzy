import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Use Edge-safe config only (no Prisma). See auth.config.ts and auth.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/youtube/:path*",
    "/api/chat/:path*",
    "/api/goals/:path*",
    "/api/ideas/:path*",
  ],
};
