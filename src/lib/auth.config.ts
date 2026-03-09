import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma). Used by middleware and merged with
 * adapter in auth.ts for API routes. Session strategy is JWT so middleware
 * never needs the database.
 */
export default {
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/yt-analytics.readonly",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub!;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
