import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Passkey from "next-auth/providers/passkey";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators,
} from "@/db/auth-schema";
import { sendMagicLinkEmail } from "@/lib/resend";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    };
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers: [
    Resend({
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url);
      },
    }),
    Passkey({}),
  ],
  experimental: {
    enableWebAuthn: true,
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as AdapterUser).role ?? "user";
      }
      return session;
    },
  },
});

type AdapterUser = import("@auth/core/adapters").AdapterUser;
