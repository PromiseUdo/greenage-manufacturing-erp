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

// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { prisma } from '@/lib/prisma';
// import bcrypt from 'bcryptjs';
// import { UserRole } from '@prisma/client';

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   session: { strategy: 'jwt' },

//   providers: [
//     Credentials({
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });

//         if (!user) return null;

//         const valid = await bcrypt.compare(
//           credentials.password as string,
//           user.password,
//         );

//         if (!valid) return null;
//         if (!user.isVerified) throw new Error('Email not verified');

//         return {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           role: user.role, // ✅ INCLUDE ROLE
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id as string;
//         token.role = user.role;
//       }
//       return token;
//     },

//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as UserRole;
//       }
//       return session;
//     },
//   },

//   secret: process.env.AUTH_SECRET,
// });

// // lib/auth.ts
// // UPDATED FOR NEXT-AUTH v5 (Auth.js)

// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { prisma } from '@/lib/prisma';
// import bcrypt from 'bcryptjs';
// import { UserRole } from '@prisma/client';

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   session: { strategy: 'jwt' },

//   providers: [
//     Credentials({
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//           include: {
//             employee: true, // ✅ Include employee data
//           },
//         });

//         if (!user) return null;

//         const valid = await bcrypt.compare(
//           credentials.password as string,
//           user.password,
//         );

//         if (!valid) return null;
//         if (!user.isVerified) throw new Error('Email not verified');

//         return {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           mustChangePassword: user.employee?.mustChangePassword || false, // ✅ Add this
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id as string;
//         token.role = user.role;
//         token.mustChangePassword = user.mustChangePassword; // ✅ Add this
//       } else if (token.id) {
//         // ✅ Refresh mustChangePassword flag on each request
//         const dbUser = await prisma.user.findUnique({
//           where: { id: token.id as string },
//           include: { employee: true },
//         });

//         if (dbUser?.employee) {
//           token.mustChangePassword = dbUser.employee.mustChangePassword;
//         }
//       }
//       return token;
//     },

//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as UserRole;
//         session.user.mustChangePassword = token.mustChangePassword as boolean; // ✅ Add this
//       }
//       return session;
//     },
//   },

//   pages: {
//     signIn: '/auth/signin',
//   },

//   secret: process.env.AUTH_SECRET,
// });

// lib/auth.ts
// OPTIMIZED - Prisma refresh only happens on API routes, not middleware

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            employee: true, // ✅ Include employee data
          },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!valid) return null;
        if (!user.isVerified) throw new Error('Email not verified');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.employee?.mustChangePassword || false, // ✅ Add this
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword; // ✅ Set on login
      }

      // ✅ On update trigger (when password is changed), refresh the flag
      // This avoids querying Prisma on every middleware call
      if (trigger === 'update' && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { employee: true },
          });

          if (dbUser?.employee) {
            token.mustChangePassword = dbUser.employee.mustChangePassword;
          }
        } catch (error) {
          console.error('Error refreshing mustChangePassword flag:', error);
          // Don't throw - just keep existing value
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.mustChangePassword = token.mustChangePassword as boolean; // ✅ Add to session
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  secret: process.env.AUTH_SECRET,
});
