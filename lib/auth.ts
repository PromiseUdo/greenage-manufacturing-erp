// // lib/auth.ts
// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { prisma } from '@/lib/prisma';
// import bcrypt from 'bcryptjs';

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   session: {
//     strategy: 'jwt',
//   },

//   providers: [
//     Credentials({
//       name: 'Credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//       },

//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });

//         if (!user) return null;

//         const valid = await bcrypt.compare(
//           credentials.password as string,
//           user.password
//         );

//         if (!valid) return null;

//         if (!user.isVerified) {
//           throw new Error('Email not verified');
//         }

//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//         };
//       },
//     }),
//   ],

//   pages: {
//     signIn: '/auth/signin',
//     error: '/auth/error',
//   },

//   secret: process.env.AUTH_SECRET, // ⚠️ NOTE NAME
// });

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },

  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;
        if (!user.isVerified) throw new Error('Email not verified');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // ✅ INCLUDE ROLE
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
});
