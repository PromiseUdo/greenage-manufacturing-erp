import { auth } from "./auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function requirePermission(permission: string) {
  const session = await auth();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      appRole: {
        select: {
          permissions: true,
        },
      },
    },
  });

  const permissions = user?.appRole?.permissions || [];

  if (!permissions.includes(permission)) {
    return {
      error: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { user, session };
}