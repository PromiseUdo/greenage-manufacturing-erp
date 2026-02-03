// // src/app/api/orders/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';
// import { generateUnitIds } from '@/lib/unitIdGenerator';

// export async function GET(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '20');
//     const search = searchParams.get('search') || '';
//     const status = searchParams.get('status') || '';

//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (search) {
//       where.OR = [
//         { orderNumber: { contains: search, mode: 'insensitive' } },
//         { customer: { name: { contains: search, mode: 'insensitive' } } },
//         { product: { name: { contains: search, mode: 'insensitive' } } },
//       ];
//     }

//     if (status) {
//       where.status = status;
//     }

//     const [orders, total] = await Promise.all([
//       prisma.order.findMany({
//         where,
//         include: {
//           customer: {
//             select: {
//               id: true,
//               name: true,
//               phone: true,
//             },
//           },
//           product: {
//             select: {
//               id: true,
//               name: true,
//               productNumber: true,
//               productCode: true,
//             },
//           },
//           quote: {
//             select: {
//               id: true,
//               quoteNumber: true,
//             },
//           },
//           invoice: {
//             select: {
//               id: true,
//               invoiceNumber: true,
//               status: true,
//             },
//           },
//           _count: {
//             select: {
//               units: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         skip,
//         take: limit,
//       }),
//       prisma.order.count({ where }),
//     ]);

//     return NextResponse.json({
//       orders,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch orders' },
//       { status: 500 },
//     );
//   }
// }

// // Create order (which also creates a quote)
// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const {
//       customerId,
//       productId,
//       quantity,
//       deliveryDate,
//       unitPrice,
//       taxAmount,
//       discountAmount,
//       paymentTerms,
//       priority,
//     } = body;

//     // Validation
//     if (!customerId || !productId || !quantity || !deliveryDate) {
//       return NextResponse.json(
//         {
//           error: 'Customer, product, quantity, and delivery date are required',
//         },
//         { status: 400 },
//       );
//     }

//     // Get product
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//       select: {
//         id: true,
//         productCode: true,
//         basePrice: true,
//         isActive: true,
//         isAvailable: true,
//       },
//     });

//     if (!product || !product.isActive || !product.isAvailable) {
//       return NextResponse.json(
//         { error: 'Product not available' },
//         { status: 400 },
//       );
//     }

//     // Generate unit IDs
//     const unitIds = await generateUnitIds(productId, quantity);

//     // Calculate amounts
//     const finalUnitPrice = unitPrice || product.basePrice;
//     const totalAmount = finalUnitPrice * quantity;
//     const finalTax = taxAmount || 0;
//     const finalDiscount = discountAmount || 0;
//     const finalAmount = totalAmount + finalTax - finalDiscount;

//     // Generate numbers
//     const year = new Date().getFullYear();

//     const lastOrder = await prisma.order.findFirst({
//       where: { orderNumber: { contains: `ORD-${year}` } },
//       orderBy: { createdAt: 'desc' },
//     });

//     const orderNumber = lastOrder
//       ? `ORD-${year}-${String(parseInt(lastOrder.orderNumber.split('-')[2]) + 1).padStart(3, '0')}`
//       : `ORD-${year}-001`;

//     const lastQuote = await prisma.quote.findFirst({
//       where: { quoteNumber: { contains: `QTE-${year}` } },
//       orderBy: { createdAt: 'desc' },
//     });

//     const quoteNumber = lastQuote
//       ? `QTE-${year}-${String(parseInt(lastQuote.quoteNumber.split('-')[2]) + 1).padStart(3, '0')}`
//       : `QTE-${year}-001`;

//     // Create order and quote in transaction
//     const result = await prisma.$transaction(async (tx) => {
//       const order = await tx.order.create({
//         data: {
//           orderNumber,
//           customerId,
//           productId,
//           quantity,
//           deliveryDate,
//           paymentTerms,
//           priority: priority || 'NORMAL',
//           status: 'PENDING_PLANNING',
//           generatedUnitIds: unitIds,
//           createdById: session.user.id,
//         },
//       });

//       const quote = await tx.quote.create({
//         data: {
//           quoteNumber,
//           customerId,
//           productId,
//           quantity,
//           deliveryDate,
//           unitPrice: finalUnitPrice,
//           totalAmount,
//           taxAmount: finalTax,
//           discountAmount: finalDiscount,
//           finalAmount,
//           paymentTerms,
//           status: 'DRAFT',
//           orderId: order.id,
//           createdById: session.user.id,
//         },
//       });

//       return { order, quote, unitIds };
//     });

//     // Log activity
//     await prisma.activityLog.create({
//       data: {
//         userId: session.user.id,
//         action: 'Created Order',
//         module: 'Sales',
//         details: {
//           orderId: result.order.id,
//           orderNumber: result.order.orderNumber,
//           quoteId: result.quote.id,
//           quoteNumber: result.quote.quoteNumber,
//           unitIdsGenerated: unitIds.length,
//         },
//       },
//     });

//     return NextResponse.json(result, { status: 201 });
//   } catch (error: any) {
//     console.error('Error creating order:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to create order' },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/orders/route.ts - CORRECTED WITH DATE FIX

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateUnitIds } from '@/lib/unitIdGenerator';

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
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              productNumber: true,
              productCode: true,
            },
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
          },
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    );
  }
}

// Create order (which also creates a quote)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      productId,
      quantity,
      deliveryDate,
      unitPrice,
      taxAmount,
      discountAmount,
      paymentTerms,
      priority,
    } = body;

    // Validation
    if (!customerId || !productId || !quantity || !deliveryDate) {
      return NextResponse.json(
        {
          error: 'Customer, product, quantity, and delivery date are required',
        },
        { status: 400 },
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        productCode: true,
        basePrice: true,
        isActive: true,
        isAvailable: true,
      },
    });

    if (!product || !product.isActive || !product.isAvailable) {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 400 },
      );
    }

    // Generate unit IDs
    const unitIds = await generateUnitIds(productId, quantity);

    // Calculate amounts
    const finalUnitPrice = unitPrice || product.basePrice;
    const totalAmount = finalUnitPrice * quantity;
    const finalTax = taxAmount || 0;
    const finalDiscount = discountAmount || 0;
    const finalAmount = totalAmount + finalTax - finalDiscount;

    // Generate numbers
    const year = new Date().getFullYear();

    const lastOrder = await prisma.order.findFirst({
      where: { orderNumber: { contains: `ORD-${year}` } },
      orderBy: { createdAt: 'desc' },
    });

    const orderNumber = lastOrder
      ? `ORD-${year}-${String(parseInt(lastOrder.orderNumber.split('-')[2]) + 1).padStart(3, '0')}`
      : `ORD-${year}-001`;

    const lastQuote = await prisma.quote.findFirst({
      where: { quoteNumber: { contains: `QTE-${year}` } },
      orderBy: { createdAt: 'desc' },
    });

    const quoteNumber = lastQuote
      ? `QTE-${year}-${String(parseInt(lastQuote.quoteNumber.split('-')[2]) + 1).padStart(3, '0')}`
      : `QTE-${year}-001`;

    // ✅ FIX: Convert deliveryDate string to proper DateTime object
    const deliveryDateTime = new Date(deliveryDate);

    // Create order and quote in transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          productId,
          quantity,
          deliveryDate: deliveryDateTime, // ✅ Use DateTime object
          paymentTerms,
          priority: priority || 'NORMAL',
          status: 'PENDING_PLANNING',
          generatedUnitIds: unitIds,
          createdById: session.user.id,
        },
      });

      const quote = await tx.quote.create({
        data: {
          quoteNumber,
          customerId,
          productId,
          quantity,
          deliveryDate: deliveryDateTime, // ✅ Use DateTime object
          unitPrice: finalUnitPrice,
          totalAmount,
          taxAmount: finalTax,
          discountAmount: finalDiscount,
          finalAmount,
          paymentTerms,
          status: 'DRAFT',
          orderId: order.id,
          createdById: session.user.id,
        },
      });

      return { order, quote, unitIds };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Order',
        module: 'Sales',
        details: {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          quoteId: result.quote.id,
          quoteNumber: result.quote.quoteNumber,
          unitIdsGenerated: unitIds.length,
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 },
    );
  }
}
