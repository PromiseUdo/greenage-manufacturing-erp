// // // middleware.ts (or update existing middleware)

// // import { NextResponse } from 'next/server';
// // import type { NextRequest } from 'next/server';
// // import { getToken } from 'next-auth/jwt';

// // export async function middleware(request: NextRequest) {
// //   const token = await getToken({
// //     req: request,
// //     secret: process.env.NEXTAUTH_SECRET,
// //   });

// //   const { pathname } = request.nextUrl;

// //   // Public routes that don't need authentication
// //   const publicRoutes = [
// //     '/auth/signin',
// //     '/auth/signup',
// //     '/auth/verify',
// //     '/auth/reset-password',
// //     '/auth/forgot-password',
// //   ];

// //   // Change password route (where users will be redirected)
// //   const changePasswordRoute = '/auth/change-password';

// //   // If not logged in and trying to access protected route
// //   if (!token && !publicRoutes.includes(pathname)) {
// //     return NextResponse.redirect(new URL('/auth/signin', request.url));
// //   }

// //   // If logged in
// //   if (token) {
// //     // Allow access to change password page
// //     if (pathname === changePasswordRoute) {
// //       return NextResponse.next();
// //     }

// //     // Check if user must change password (from employee record)
// //     if (token.mustChangePassword === true) {
// //       // If not already on change password page, redirect there
// //       if (pathname !== changePasswordRoute) {
// //         return NextResponse.redirect(
// //           new URL(changePasswordRoute + '?required=true', request.url),
// //         );
// //       }
// //     }

// //     // Prevent accessing auth pages when already logged in
// //     // (unless forced to change password)
// //     if (publicRoutes.includes(pathname) && !token.mustChangePassword) {
// //       return NextResponse.redirect(new URL('/dashboard', request.url));
// //     }
// //   }

// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: [
// //     /*
// //      * Match all request paths except:
// //      * - _next/static (static files)
// //      * - _next/image (image optimization files)
// //      * - favicon.ico (favicon file)
// //      * - public files (public folder)
// //      */
// //     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
// //   ],
// // };

// // middleware.ts
// // UPDATED FOR NEXT-AUTH v5 (Auth.js)

// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { auth } from '@/lib/auth';

// export default auth((req) => {
//   const { pathname } = req.nextUrl;
//   const session = req.auth;

//   // Public routes that don't need authentication
//   const publicRoutes = [
//     '/auth/signin',
//     '/auth/signup',
//     '/auth/verify',
//     '/auth/reset-password',
//     '/auth/forgot-password',
//   ];

//   // Change password route
//   const changePasswordRoute = '/auth/change-password';

//   const isPublicRoute = publicRoutes.some((route) =>
//     pathname.startsWith(route),
//   );

//   // If not logged in and trying to access protected route
//   if (!session && !isPublicRoute) {
//     return NextResponse.redirect(new URL('/auth/signin', req.url));
//   }

//   // If logged in
//   if (session?.user) {
//     // Allow access to change password page
//     if (pathname === changePasswordRoute) {
//       return NextResponse.next();
//     }

//     // Check if user must change password
//     if (session.user.mustChangePassword === true) {
//       // If not already on change password page, redirect there
//       if (pathname !== changePasswordRoute) {
//         return NextResponse.redirect(
//           new URL(changePasswordRoute + '?required=true', req.url),
//         );
//       }
//     }

//     // Prevent accessing auth pages when already logged in
//     // (unless forced to change password)
//     if (isPublicRoute && !session.user.mustChangePassword) {
//       return NextResponse.redirect(new URL('/dashboard', req.url));
//     }
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public files (images, etc.)
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };

// middleware.ts
// FIXED - No Prisma in Edge Runtime

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { auth } from '@/lib/auth';
import { auth } from '@/lib/auth-edge';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/verify',
    '/auth/reset-password',
    '/auth/forgot-password',
  ];

  // Change password route
  const changePasswordRoute = '/auth/change-password';

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If not logged in and trying to access protected route
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // If logged in
  if (session?.user) {
    // Allow access to change password page
    if (pathname === changePasswordRoute) {
      return NextResponse.next();
    }

    // ✅ Check mustChangePassword flag from session
    // (No Prisma call - flag is already in session token from auth.ts)
    if (session.user.mustChangePassword === true) {
      // If not already on change password page, redirect there
      if (pathname !== changePasswordRoute) {
        return NextResponse.redirect(
          new URL(changePasswordRoute + '?required=true', req.url),
        );
      }
    }

    // Prevent accessing auth pages when already logged in
    if (isPublicRoute && !session.user.mustChangePassword) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (let them handle their own auth)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
