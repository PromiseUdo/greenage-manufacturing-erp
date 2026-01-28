// // types/next-auth.d.ts
// import { UserRole } from '@prisma/client';
// import { DefaultSession } from 'next-auth';

// declare module 'next-auth' {
//   interface Session {
//     user: {
//       id: string;
//       role: UserRole;
//     } & DefaultSession['user'];
//   }

//   interface User {
//     role: UserRole;
//   }
// }

// declare module 'next-auth/jwt' {
//   interface JWT {
//     id: string;
//     role: UserRole;
//   }
// }

// types/next-auth.d.ts
// TypeScript definitions for Next-Auth v5 (Auth.js)

import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mustChangePassword?: boolean; // ✅ Add this
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      mustChangePassword?: boolean; // ✅ Add this
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    mustChangePassword?: boolean; // ✅ Add this
  }
}
