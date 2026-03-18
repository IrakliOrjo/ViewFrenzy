import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    async signIn({ account }) {
      if (!account || account.provider !== "google") return;

      // PrismaAdapter.linkAccount only creates — it never updates existing rows.
      // On re-login Google issues fresh tokens, but the old (expired) ones stay
      // in the DB. This ensures we always persist the latest tokens.
      await prisma.account.updateMany({
        where: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
        },
      });
    },
  },
});
