// // src/app/api/inventory/tools/lending/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';

// export async function GET(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '20');
//     const status = searchParams.get('status') || '';
//     const toolId = searchParams.get('toolId') || '';

//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (status) {
//       where.status = status;
//     }

//     if (toolId) {
//       where.toolId = toolId;
//     }

//     const [lendings, total] = await Promise.all([
//       prisma.toolLending.findMany({
//         where,
//         include: {
//           tool: true,
//         },
//         orderBy: { issuedAt: 'desc' },
//         skip,
//         take: limit,
//       }),
//       prisma.toolLending.count({ where }),
//     ]);

//     return NextResponse.json({
//       lendings,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching lendings:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch lendings' },
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

//     if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     const body = await request.json();
//     const {
//       toolId,
//       issuedTo,
//       department,
//       purpose,
//       orderId,
//       projectName,
//       expectedReturn,
//     } = body;

//     if (!toolId || !issuedTo) {
//       return NextResponse.json(
//         { error: 'Tool and recipient are required' },
//         { status: 400 },
//       );
//     }

//     // Check if tool is available
//     const tool = await prisma.tool.findUnique({
//       where: { id: toolId },
//     });

//     if (!tool) {
//       return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
//     }

//     if (tool.status !== 'AVAILABLE') {
//       return NextResponse.json(
//         { error: `Tool is not available. Current status: ${tool.status}` },
//         { status: 400 },
//       );
//     }

//     // Create lending record and update tool status in transaction
//     const [lending] = await prisma.$transaction([
//       prisma.toolLending.create({
//         data: {
//           toolId,
//           issuedTo,
//           department,
//           purpose,
//           orderId,
//           projectName,
//           expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
//           issuedBy: session.user.name!,
//           status: 'ISSUED',
//         },
//         include: {
//           tool: true,
//         },
//       }),
//       prisma.tool.update({
//         where: { id: toolId },
//         data: {
//           status: 'IN_USE',
//           currentHolder: issuedTo,
//         },
//       }),
//     ]);

//     await prisma.activityLog.create({
//       data: {
//         userId: session.user.id,
//         action: 'Tool Issued',
//         module: 'Inventory',
//         details: {
//           toolId,
//           toolName: tool.name,
//           toolNumber: tool.toolNumber,
//           issuedTo,
//           purpose,
//         },
//       },
//     });

//     return NextResponse.json(lending, { status: 201 });
//   } catch (error) {
//     console.error('Error creating lending:', error);
//     return NextResponse.json(
//       { error: 'Failed to create lending' },
//       { status: 500 },
//     );
//   }
// }

// // src/app/api/inventory/tools/lending/route.ts - UPDATED

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';

// export async function GET(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '20');
//     const status = searchParams.get('status') || '';
//     const toolId = searchParams.get('toolId') || '';

//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (status) {
//       where.status = status;
//     }

//     if (toolId) {
//       where.toolId = toolId;
//     }

//     const [lendings, total] = await Promise.all([
//       prisma.toolLending.findMany({
//         where,
//         include: {
//           tool: true,
//         },
//         orderBy: { issuedAt: 'desc' },
//         skip,
//         take: limit,
//       }),
//       prisma.toolLending.count({ where }),
//     ]);

//     return NextResponse.json({
//       lendings,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching lendings:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch lendings' },
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

//     if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     const body = await request.json();
//     const {
//       toolId,
//       quantity = 1,
//       issuedTo,
//       department,
//       purpose,
//       orderId,
//       projectName,
//       expectedReturn,
//     } = body;

//     if (!toolId || !issuedTo) {
//       return NextResponse.json(
//         { error: 'Tool and recipient are required' },
//         { status: 400 },
//       );
//     }

//     // Check if it's a group or individual tool
//     const toolGroup = await prisma.toolGroup.findUnique({
//       where: { id: toolId },
//       include: {
//         tools: {
//           where: {
//             isActive: true,
//             status: 'AVAILABLE',
//           },
//           take: quantity,
//         },
//       },
//     });

//     if (toolGroup) {
//       // Handle group tool lending
//       if (toolGroup.availableQuantity < quantity) {
//         return NextResponse.json(
//           {
//             error: `Only ${toolGroup.availableQuantity} tools available in this group`,
//           },
//           { status: 400 },
//         );
//       }

//       if (toolGroup.tools.length < quantity) {
//         return NextResponse.json(
//           { error: 'Not enough available tools in group' },
//           { status: 400 },
//         );
//       }

//       // Create lending records and update statuses
//       const lendings = await prisma.$transaction(async (tx) => {
//         const results = [];

//         for (const tool of toolGroup.tools.slice(0, quantity)) {
//           const lending = await tx.toolLending.create({
//             data: {
//               toolId: tool.id,
//               quantity: 1,
//               issuedTo,
//               department,
//               purpose,
//               orderId,
//               projectName,
//               expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
//               issuedBy: session.user.name!,
//               status: 'ISSUED',
//             },
//           });

//           await tx.tool.update({
//             where: { id: tool.id },
//             data: {
//               status: 'IN_USE',
//               currentHolder: issuedTo,
//             },
//           });

//           results.push(lending);
//         }

//         await tx.toolGroup.update({
//           where: { id: toolGroup.id },
//           data: {
//             availableQuantity: toolGroup.availableQuantity - quantity,
//           },
//         });

//         return results;
//       });

//       await prisma.activityLog.create({
//         data: {
//           userId: session.user.id,
//           action: 'Tools Issued (Group)',
//           module: 'Inventory',
//           details: {
//             groupId: toolGroup.id,
//             groupName: toolGroup.name,
//             quantity,
//             issuedTo,
//             purpose,
//           },
//         },
//       });

//       return NextResponse.json({ lendings, quantity }, { status: 201 });
//     } else {
//       // Handle individual tool lending
//       const tool = await prisma.tool.findUnique({
//         where: { id: toolId },
//       });

//       if (!tool) {
//         return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
//       }

//       if (tool.status !== 'AVAILABLE') {
//         return NextResponse.json(
//           {
//             error: `Tool is not available. Current status: ${tool.status}`,
//           },
//           { status: 400 },
//         );
//       }

//       const [lending] = await prisma.$transaction([
//         prisma.toolLending.create({
//           data: {
//             toolId,
//             quantity: 1,
//             issuedTo,
//             department,
//             purpose,
//             orderId,
//             projectName,
//             expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
//             issuedBy: session.user.name!,
//             status: 'ISSUED',
//           },
//           include: { tool: true },
//         }),
//         prisma.tool.update({
//           where: { id: toolId },
//           data: {
//             status: 'IN_USE',
//             currentHolder: issuedTo,
//           },
//         }),
//       ]);

//       await prisma.activityLog.create({
//         data: {
//           userId: session.user.id,
//           action: 'Tool Issued',
//           module: 'Inventory',
//           details: {
//             toolId,
//             toolName: tool.name,
//             toolIdentifier: tool.toolId, // Use toolId instead of toolNumber
//             issuedTo,
//             purpose,
//           },
//         },
//       });

//       return NextResponse.json(lending, { status: 201 });
//     }
//   } catch (error) {
//     console.error('Error creating lending:', error);
//     return NextResponse.json(
//       { error: 'Failed to create lending' },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/inventory/tools/lending/route.ts - UPDATED

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const toolId = searchParams.get('toolId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (toolId) {
      where.toolId = toolId;
    }

    const [lendings, total] = await Promise.all([
      prisma.toolLending.findMany({
        where,
        include: {
          tool: true,
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.toolLending.count({ where }),
    ]);

    return NextResponse.json({
      lendings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching lendings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lendings' },
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

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      toolId,
      quantity = 1,
      selectedToolIds, // NEW: Specific tool IDs for groups
      issuedTo,
      department,
      purpose,
      orderId,
      projectName,
      expectedReturn,
    } = body;

    if (!toolId || !issuedTo) {
      return NextResponse.json(
        { error: 'Tool and recipient are required' },
        { status: 400 },
      );
    }

    // Check if it's a group or individual tool
    const toolGroup = await prisma.toolGroup.findUnique({
      where: { id: toolId },
      include: {
        tools: {
          where: {
            isActive: true,
            status: 'AVAILABLE',
          },
          take: quantity,
        },
      },
    });

    if (toolGroup) {
      // Handle group tool lending with specific tool selection
      const toolsToIssue =
        selectedToolIds && selectedToolIds.length > 0
          ? await prisma.tool.findMany({
              where: {
                id: { in: selectedToolIds },
                toolGroupId: toolGroup.id,
                status: 'AVAILABLE',
                isActive: true,
              },
            })
          : toolGroup.tools.slice(0, quantity);

      const actualQuantity = toolsToIssue.length;

      if (actualQuantity === 0) {
        return NextResponse.json(
          { error: 'No available tools found to issue' },
          { status: 400 },
        );
      }

      if (
        selectedToolIds &&
        selectedToolIds.length > 0 &&
        actualQuantity < selectedToolIds.length
      ) {
        return NextResponse.json(
          { error: 'Some selected tools are no longer available' },
          { status: 400 },
        );
      }

      // Create lending records and update statuses
      const lendings = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const tool of toolsToIssue) {
          const lending = await tx.toolLending.create({
            data: {
              toolId: tool.id,
              quantity: 1,
              issuedTo,
              department,
              purpose,
              orderId,
              projectName,
              expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
              issuedBy: session.user.name!,
              status: 'ISSUED',
            },
          });

          await tx.tool.update({
            where: { id: tool.id },
            data: {
              status: 'IN_USE',
              currentHolder: issuedTo,
            },
          });

          results.push(lending);
        }

        await tx.toolGroup.update({
          where: { id: toolGroup.id },
          data: {
            availableQuantity: toolGroup.availableQuantity - actualQuantity,
          },
        });

        return results;
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Tools Issued (Group)',
          module: 'Inventory',
          details: {
            groupId: toolGroup.id,
            groupName: toolGroup.name,
            quantity: actualQuantity,
            selectedTools: toolsToIssue.map((t) => t.toolId),
            issuedTo,
            purpose,
          },
        },
      });

      return NextResponse.json(
        { lendings, quantity: actualQuantity },
        { status: 201 },
      );
    } else {
      // Handle individual tool lending
      const tool = await prisma.tool.findUnique({
        where: { id: toolId },
      });

      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }

      if (tool.status !== 'AVAILABLE') {
        return NextResponse.json(
          {
            error: `Tool is not available. Current status: ${tool.status}`,
          },
          { status: 400 },
        );
      }

      const [lending] = await prisma.$transaction([
        prisma.toolLending.create({
          data: {
            toolId,
            quantity: 1,
            issuedTo,
            department,
            purpose,
            orderId,
            projectName,
            expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
            issuedBy: session.user.name!,
            status: 'ISSUED',
          },
          include: { tool: true },
        }),
        prisma.tool.update({
          where: { id: toolId },
          data: {
            status: 'IN_USE',
            currentHolder: issuedTo,
          },
        }),
      ]);

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Tool Issued',
          module: 'Inventory',
          details: {
            toolId,
            toolName: tool.name,
            toolIdentifier: tool.toolId, // Use toolId instead of toolNumber
            issuedTo,
            purpose,
          },
        },
      });

      return NextResponse.json(lending, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating lending:', error);
    return NextResponse.json(
      { error: 'Failed to create lending' },
      { status: 500 },
    );
  }
}
