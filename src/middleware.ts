export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/goals/:path*",
    "/ideas/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/api/youtube/:path*",
    "/api/chat/:path*",
    "/api/goals/:path*",
    "/api/ideas/:path*",
  ],
};
