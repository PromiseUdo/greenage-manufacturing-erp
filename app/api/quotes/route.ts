// // src/app/api/quotes/route.ts

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
//     const customerId = searchParams.get('customerId') || '';

//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (search) {
//       where.OR = [
//         { quoteNumber: { contains: search, mode: 'insensitive' } },
//         { customer: { name: { contains: search, mode: 'insensitive' } } },
//         { product: { name: { contains: search, mode: 'insensitive' } } },
//       ];
//     }

//     if (status) {
//       where.status = status;
//     }

//     if (customerId) {
//       where.customerId = customerId;
//     }

//     const [quotes, total] = await Promise.all([
//       prisma.quote.findMany({
//         where,
//         include: {
//           customer: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//           product: {
//             select: {
//               id: true,
//               name: true,
//               productNumber: true,
//               productCode: true,
//               model: true,
//               category: true,
//             },
//           },
//           createdBy: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           order: {
//             select: {
//               id: true,
//               orderNumber: true,
//               status: true,
//             },
//           },
//           invoice: {
//             select: {
//               id: true,
//               invoiceNumber: true,
//               status: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         skip,
//         take: limit,
//       }),
//       prisma.quote.count({ where }),
//     ]);

//     return NextResponse.json({
//       quotes,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching quotes:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch quotes' },
//       { status: 500 },
//     );
//   }
// }

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
//       unitPrice, // Optional: override product basePrice
//       taxAmount,
//       discountAmount,
//       paymentTerms,
//       expiryDate,
//       notes,
//       termsConditions,
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

//     // Get product details
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//       select: {
//         id: true,
//         name: true,
//         productCode: true,
//         basePrice: true,
//         isActive: true,
//         isAvailable: true,
//       },
//     });

//     if (!product) {
//       return NextResponse.json({ error: 'Product not found' }, { status: 404 });
//     }

//     if (!product.isActive || !product.isAvailable) {
//       return NextResponse.json(
//         { error: 'Product is not available' },
//         { status: 400 },
//       );
//     }

//     // Calculate pricing
//     const finalUnitPrice = unitPrice || product.basePrice;
//     const totalAmount = finalUnitPrice * quantity;
//     const finalTax = taxAmount || 0;
//     const finalDiscount = discountAmount || 0;
//     const finalAmount = totalAmount + finalTax - finalDiscount;

//     // Generate quote number
//     const year = new Date().getFullYear();
//     const lastQuote = await prisma.quote.findFirst({
//       where: {
//         quoteNumber: { contains: `QTE-${year}` },
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     let quoteNumber;
//     if (lastQuote) {
//       const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]);
//       quoteNumber = `QTE-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
//     } else {
//       quoteNumber = `QTE-${year}-001`;
//     }

//     // ✅ CREATE QUOTE AND ORDER TOGETHER
//     const result = await prisma.$transaction(async (tx) => {
//       // Generate order number
//       const lastOrder = await tx.order.findFirst({
//         where: {
//           orderNumber: { contains: `ORD-${year}` },
//         },
//         orderBy: { createdAt: 'desc' },
//       });

//       let orderNumber;
//       if (lastOrder) {
//         const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
//         orderNumber = `ORD-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
//       } else {
//         orderNumber = `ORD-${year}-001`;
//       }

//       // ✅ Generate unit IDs for the order
//       const unitIds = await generateUnitIds(productId, quantity);

//       // Create order first
//       const order = await tx.order.create({
//         data: {
//           orderNumber,
//           customerId,
//           productId,
//           quantity,
//           deliveryDate,
//           paymentTerms,
//           status: 'PENDING_PLANNING',
//           generatedUnitIds: unitIds,
//           createdById: session.user.id,
//         },
//       });

//       // Create quote linked to order
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
//           expiryDate,
//           notes,
//           termsConditions,
//           orderId: order.id,
//           createdById: session.user.id,
//         },
//         include: {
//           customer: true,
//           product: true,
//           order: true,
//         },
//       });

//       return { quote, order, unitIds };
//     });

//     // Log activity
//     await prisma.activityLog.create({
//       data: {
//         userId: session.user.id,
//         action: 'Created Quote',
//         module: 'Sales',
//         details: {
//           quoteId: result.quote.id,
//           quoteNumber: result.quote.quoteNumber,
//           orderId: result.order.id,
//           orderNumber: result.order.orderNumber,
//           customerId,
//           productId,
//           quantity,
//           unitIdsGenerated: result.unitIds.length,
//         },
//       },
//     });

//     return NextResponse.json(result, { status: 201 });
//   } catch (error: any) {
//     console.error('Error creating quote:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to create quote' },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/quotes/route.ts - CORRECTED WITH DATE FIX

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
    const customerId = searchParams.get('customerId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              productNumber: true,
              productCode: true,
              category: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
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
      expiryDate,
      notes,
      termsConditions,
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

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        productCode: true,
        basePrice: true,
        isActive: true,
        isAvailable: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.isActive || !product.isAvailable) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 },
      );
    }

    // Calculate amounts
    const finalUnitPrice = unitPrice || product.basePrice;
    const totalAmount = finalUnitPrice * quantity;
    const finalTax = taxAmount || 0;
    const finalDiscount = discountAmount || 0;
    const finalAmount = totalAmount + finalTax - finalDiscount;

    // Generate quote number
    const year = new Date().getFullYear();
    const lastQuote = await prisma.quote.findFirst({
      where: {
        quoteNumber: { contains: `QTE-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let quoteNumber;
    if (lastQuote) {
      const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]);
      quoteNumber = `QTE-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      quoteNumber = `QTE-${year}-001`;
    }

    // Generate order number
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: { contains: `ORD-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let orderNumber;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      orderNumber = `ORD-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      orderNumber = `ORD-${year}-001`;
    }

    // ✅ Generate unit IDs for the order
    console.log(
      `Generating ${quantity} unit IDs for product ${product.productCode}...`,
    );
    const unitIds = await generateUnitIds(productId, quantity);
    console.log('Generated unit IDs:', unitIds);

    // ✅ FIX: Convert date strings to proper DateTime objects
    const deliveryDateTime = new Date(deliveryDate);
    const expiryDateTime = expiryDate ? new Date(expiryDate) : null;

    // Create quote and order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order first
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          productId,
          quantity,
          deliveryDate: deliveryDateTime, // ✅ Use DateTime object
          paymentTerms,
          status: 'PENDING_PLANNING',
          generatedUnitIds: unitIds,
          createdById: session.user.id,
        },
      });

      // Create quote linked to order
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
          expiryDate: expiryDateTime, // ✅ Use DateTime object or null
          notes,
          termsConditions,
          orderId: order.id,
          createdById: session.user.id,
        },
        include: {
          customer: true,
          product: true,
          order: true,
        },
      });

      return { quote, order, unitIds };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Quote',
        module: 'Sales',
        details: {
          quoteId: result.quote.id,
          quoteNumber: result.quote.quoteNumber,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          customerId,
          productId,
          quantity,
          unitIdsGenerated: unitIds.length,
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quote' },
      { status: 500 },
    );
  }
}
