// lib/auth-edge.ts
import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

export const { auth } = NextAuth({
  providers: [], // ✅ REQUIRED by type system

  session: { strategy: 'jwt' },

  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },

    async jwt({ token }) {
      return token;
    },
  },

  secret: process.env.AUTH_SECRET,
});
