// src/app/api/customers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const hasPortalAccess = searchParams.get('hasPortalAccess');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (
      hasPortalAccess !== null &&
      hasPortalAccess !== undefined &&
      hasPortalAccess !== ''
    ) {
      if (hasPortalAccess === 'true') {
        where.userId = { not: null };
      } else {
        where.userId = null;
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SALES_TEAM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      contactPerson,
      createPortalAccess,
      portalEmail,
      portalPassword,
    } = body;

    // Validation
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'Name, phone, and address are required' },
        { status: 400 },
      );
    }

    // If creating portal access, validate portal email
    if (createPortalAccess && !portalEmail) {
      return NextResponse.json(
        { error: 'Portal email is required for portal access' },
        { status: 400 },
      );
    }

    // Check if portal email already exists (if creating portal)
    if (createPortalAccess) {
      const existingUser = await prisma.user.findUnique({
        where: { email: portalEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Portal email already in use' },
          { status: 409 },
        );
      }
    }

    // Check if customer name already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { name },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 409 },
      );
    }

    let result;

    if (createPortalAccess) {
      // Generate password if not provided
      const defaultPassword =
        portalPassword ||
        `${name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      // Create Customer with User in transaction
      result = await prisma.$transaction(async (tx) => {
        // Create User account for portal
        const user = await tx.user.create({
          data: {
            name,
            email: portalEmail,
            password: hashedPassword,
            role: 'SALES_TEAM', // Default role for customers
            isActive: true,
            isVerified: true, // No email verification for customers
          },
        });

        // Create Customer (linked to User)
        const customer = await tx.customer.create({
          data: {
            name,
            email: email || null, // Business email (optional)
            phone,
            address,
            contactPerson: contactPerson || null,
            userId: user.id, // Link to User
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

        return {
          customer,
          credentials: { email: portalEmail, password: defaultPassword },
        };
      });
    } else {
      // Create Customer without portal access
      const customer = await prisma.customer.create({
        data: {
          name,
          email: email || null,
          phone,
          address,
          contactPerson: contactPerson || null,
          userId: null, // No portal access
        },
      });

      result = { customer, credentials: null };
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Customer',
        module: 'Customer Management',
        details: {
          customerId: result.customer.id,
          customerName: name,
          portalAccess: createPortalAccess,
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 },
    );
  }
}
