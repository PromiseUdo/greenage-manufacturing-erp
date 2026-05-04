import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const fmt = (d: Date | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtTs = (d: Date | null | undefined) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// Read pixel dimensions from PNG/JPEG buffer without external libs
function getImgDimensions(
  buf: Buffer,
  mimeType: string,
): { w: number; h: number } | null {
  try {
    if (mimeType.includes('png') && buf[0] === 0x89 && buf[1] === 0x50) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        const segLen = buf.readUInt16BE(offset + 2);
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          return {
            w: buf.readUInt16BE(offset + 7),
            h: buf.readUInt16BE(offset + 5),
          };
        }
        offset += 2 + segLen;
      }
    }
  } catch {
    /* */
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const project = await prisma.researchProject.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        reopenedBy: { select: { name: true } },
        tasks: {
          include: {
            assignedTo: { select: { name: true } },
            completedBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        materialRequisitions: {
          include: {
            requestedBy: { select: { name: true } },
            fulfilledBy: { select: { name: true } },
            items: {
              include: {
                material: {
                  select: { name: true, partNumber: true, unit: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // ── Load logo ────────────────────────────────────────────────────
    let logoData: string | null = null;
    try {
      const logoBuf = fs.readFileSync(
        path.join(process.cwd(), 'public', 'greenage_logo_white.png'),
      );
      logoData = `data:image/png;base64,${logoBuf.toString('base64')}`;
    } catch {
      /* logo unavailable */
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // ── Palette ──────────────────────────────────────────────────────
    const brandDark: [number, number, number] = [0, 61, 52]; // #003D34
    const brandLight: [number, number, number] = [211, 242, 175]; // #D3F2AF — header only
    const ink: [number, number, number] = [18, 28, 24];
    const muted: [number, number, number] = [100, 116, 110];
    const white: [number, number, number] = [255, 255, 255];
    const slate: [number, number, number] = [248, 250, 252];
    const border: [number, number, number] = [218, 222, 220]; // neutral light border

    const pageW = doc.internal.pageSize.width; // 210 mm
    const pageH = doc.internal.pageSize.height; // 297 mm
    const margin = 14;
    const cW = pageW - margin * 2; // content width ≈ 182 mm

    // ── Footer ───────────────────────────────────────────────────────
    const drawFooter = (pageNum: number) => {
      doc.setFillColor(...slate);
      doc.rect(0, pageH - 11, pageW, 11, 'F');
      doc.setFillColor(...brandDark);
      doc.rect(0, pageH - 11, pageW, 0.6, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text(
        `${project.projectNumber}  ·  Greenage Technologies R&D`,
        margin,
        pageH - 3.5,
      );
      doc.text(
        `Page ${pageNum}  ·  Generated ${fmtTs(new Date())}`,
        pageW - margin,
        pageH - 3.5,
        { align: 'right' },
      );
    };

    // ── Cursor & page helpers ─────────────────────────────────────────
    let cursorY = 0;

    const newPage = () => {
      doc.addPage();
      cursorY = margin + 4;
      drawFooter(doc.getNumberOfPages());
    };

    const ensureSpace = (needed: number) => {
      if (cursorY + needed > pageH - 18) newPage();
    };

    const sectionHeading = (label: string) => {
      ensureSpace(14);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandDark);
      doc.text(label.toUpperCase(), margin, cursorY + 5.5);
      doc.setDrawColor(...brandDark);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY + 7.5, margin + cW, cursorY + 7.5);
      cursorY += 12;
    };

    // ─────────────────────────────────────────────────────────────────
    // COVER
    // ─────────────────────────────────────────────────────────────────
    const headerH = 40;
    doc.setFillColor(...brandDark);
    doc.rect(0, 0, pageW, headerH, 'F');

    // Thin brand-light strip at bottom of header
    doc.setFillColor(...brandLight);
    doc.rect(0, headerH - 1.2, pageW, 1.2, 'F');

    // Logo — top-left, 24 mm wide
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, 7, 24, 0);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandLight);
      doc.text('GREENAGE', margin, 15);
    }

    // "R&D" label — top-right, small
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...brandLight);
    doc.text('RESEARCH & DEVELOPMENT', pageW - margin, 11, { align: 'right' });

    // Project title
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(project.title, cW - 28) as string[];
    const titleFontSize = titleLines.length > 2 ? 14 : 16;
    doc.setFontSize(titleFontSize);
    doc.setTextColor(...white);
    const titleStartY = logoData ? 21 : 22;
    doc.text(titleLines, margin, titleStartY);

    // Project number — below title
    const pnY = Math.min(
      titleStartY + titleLines.length * (titleFontSize * 0.4),
      headerH - 6,
    );
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...brandLight);
    doc.text(project.projectNumber, margin, pnY);

    // Status — top-right, understated
    const statusLabel = project.status === 'OPEN' ? 'Active' : 'Closed';
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const closedStatusColor: [number, number, number] = [180, 200, 190];
    doc.setTextColor(
      ...(project.status === 'OPEN' ? brandLight : closedStatusColor),
    );
    doc.text(statusLabel, pageW - margin, 22, { align: 'right' });

    // ── Metadata block ────────────────────────────────────────────────
    cursorY = headerH + 7;

    const drawMeta = (label: string, value: string, x: number, y: number) => {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...muted);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...ink);
      doc.text(value || '—', x, y + 5);
    };

    const col1 = margin;
    const col2 = margin + cW / 2 + 3;

    // Top rule
    // doc.setDrawColor(...brandDark);
    // doc.setLineWidth(0.5);
    // doc.line(margin, cursorY - 1, margin + cW, cursorY - 1);

    drawMeta('Project Number', project.projectNumber, col1, cursorY);
    drawMeta(
      'Status',
      project.status.charAt(0) + project.status.slice(1).toLowerCase(),
      col2,
      cursorY,
    );
    cursorY += 13;

    drawMeta('Created By', project.createdBy.name, col1, cursorY);
    drawMeta('Created On', fmt(project.createdAt), col2, cursorY);
    cursorY += 13;

    if (project.closedAt) {
      drawMeta('Closed By', project.closedBy?.name ?? '—', col1, cursorY);
      drawMeta('Closed On', fmtTs(project.closedAt), col2, cursorY);
      cursorY += 13;
    }
    if (project.reopenedAt) {
      drawMeta('Reopened By', project.reopenedBy?.name ?? '—', col1, cursorY);
      drawMeta('Reopened On', fmtTs(project.reopenedAt), col2, cursorY);
      cursorY += 13;
    }

    // Bottom rule
    doc.setDrawColor(210, 228, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY - 2, margin + cW, cursorY - 2);

    // ── Description ───────────────────────────────────────────────────
    if (project.description) {
      cursorY += 4;
      const descLines = doc.splitTextToSize(
        project.description,
        cW - 10,
      ) as string[];
      const descH = descLines.length * 5 + 13;
      doc.setFillColor(...white);
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      // doc.roundedRect(margin, cursorY, cW, descH, 1.5, 1.5, 'FD');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...muted);
      doc.text('PROJECT DESCRIPTION', margin, cursorY + 5.5);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...ink);
      doc.text(descLines, margin, cursorY + 11);
      cursorY += descH + 7;
    } else {
      cursorY += 5;
    }

    // ── Stats strip ───────────────────────────────────────────────────
    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const stats = [
      { label: 'Total Tasks', value: String(totalTasks) },
      { label: 'Completed', value: String(doneTasks) },
      { label: 'Pending', value: String(totalTasks - doneTasks) },
      {
        label: 'Requisitions',
        value: String(project.materialRequisitions.length),
      },
      { label: 'Notes', value: String(project.notes.length) },
    ];

    const statSlotW = cW / stats.length;
    doc.setFillColor(...white);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, cursorY, cW, 21, 2, 2, 'FD');

    stats.forEach((s, i) => {
      const cx = margin + i * statSlotW + statSlotW / 2;
      if (i > 0) {
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.line(
          margin + i * statSlotW,
          cursorY + 3,
          margin + i * statSlotW,
          cursorY + 18,
        );
      }
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandDark);
      doc.text(s.value, cx, cursorY + 13, { align: 'center' });
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text(s.label.toUpperCase(), cx, cursorY + 19, { align: 'center' });
    });
    cursorY += 27;

    drawFooter(1);

    // ─────────────────────────────────────────────────────────────────
    // SECTION 1 — TASKS
    // ─────────────────────────────────────────────────────────────────
    sectionHeading('Tasks');

    if (project.tasks.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text('No tasks recorded for this project.', margin + 4, cursorY);
      cursorY += 12;
    } else {
      for (const task of project.tasks) {
        const isDone = task.status === 'DONE';

        // ── Pre-fetch images for this task ──────────────────────────
        type FetchedImage = {
          name: string;
          mimeType: string;
          imgData: string;
          imgFormat: string;
          pixW?: number;
          pixH?: number;
        };
        type DocAttachment = { name: string };

        const fetchedImages: FetchedImage[] = [];
        const docAttachments: DocAttachment[] = [];

        if (isDone && task.attachments && Array.isArray(task.attachments)) {
          const atts = task.attachments as Array<{
            name: string;
            mimeType: string;
            url: string;
            publicId: string;
          }>;
          for (const att of atts) {
            const isImage = att.mimeType?.startsWith('image/');
            if (isImage && att.url) {
              try {
                const res = await fetch(att.url);
                if (!res.ok) throw new Error('fetch failed');
                const buf = Buffer.from(await res.arrayBuffer());
                const dims = getImgDimensions(buf, att.mimeType);
                fetchedImages.push({
                  name: att.name,
                  mimeType: att.mimeType,
                  imgData: `data:${att.mimeType};base64,${buf.toString('base64')}`,
                  imgFormat: att.mimeType.includes('png') ? 'PNG' : 'JPEG',
                  pixW: dims?.w,
                  pixH: dims?.h,
                });
              } catch {
                docAttachments.push({ name: att.name });
              }
            } else {
              docAttachments.push({ name: att.name });
            }
          }
        }

        // ── Estimate task card height ────────────────────────────────
        let descLines: string[] = [];
        if (task.completionDescription) {
          descLines = doc.splitTextToSize(
            task.completionDescription,
            cW - 10,
          ) as string[];
        }
        const cardH =
          20 + (descLines.length > 0 ? descLines.length * 4.5 + 5 : 0);

        ensureSpace(cardH + 4);

        // Card background — white with neutral border
        doc.setFillColor(...white);
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, cursorY, cW, cardH, 1.5, 1.5, 'FD');

        // Task name
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ink);
        doc.text(task.name, margin + 4, cursorY + 7);

        // Status — plain colored text, no pill
        const statusText = isDone ? 'Completed' : 'Pending';
        const statusColor: [number, number, number] = isDone
          ? [16, 110, 55]
          : [110, 120, 115];
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...statusColor);
        doc.text(statusText, pageW - margin - 2, cursorY + 7, {
          align: 'right',
        });

        // Meta row
        const metaParts = [
          task.assignedTo
            ? `Assigned to ${task.assignedTo.name}`
            : 'Unassigned',
          `Created ${fmt(task.createdAt)}`,
          isDone && task.completedAt
            ? `Completed ${fmtTs(task.completedAt)} by ${task.completedBy?.name ?? '—'}`
            : '',
        ]
          .filter(Boolean)
          .join('   ·   ');

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        const metaFit = doc.splitTextToSize(metaParts, cW - 8) as string[];
        doc.text(metaFit[0], margin + 4, cursorY + 13);

        // Completion description
        if (descLines.length > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(45, 65, 55);
          doc.text(descLines, margin + 4, cursorY + 19);
        }

        cursorY += cardH + 3;

        // ── Document attachments ─────────────────────────────────────
        for (const da of docAttachments) {
          ensureSpace(9);
          doc.setFillColor(...slate);
          doc.setDrawColor(210, 218, 215);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin + 4, cursorY, cW - 8, 7.5, 1, 1, 'FD');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...muted);
          doc.text(`  ${da.name}`, margin + 8, cursorY + 5);
          cursorY += 9;
        }

        // ── Image attachments — 2-column grid ────────────────────────
        if (fetchedImages.length > 0) {
          const cols = fetchedImages.length === 1 ? 1 : 2;
          const gap = 4;
          const slotW = cols === 1 ? Math.min(120, cW) : (cW - gap) / 2; // mm per column
          const maxH = 65; // mm max image height

          for (let idx = 0; idx < fetchedImages.length; idx += cols) {
            const rowImgs = fetchedImages.slice(idx, idx + cols);

            // Compute display dimensions for each image in this row
            const displayDims = rowImgs.map((img) => {
              let dW = slotW;
              let dH: number;
              if (img.pixW && img.pixH) {
                const ratio = img.pixH / img.pixW;
                dH = dW * ratio;
                if (dH > maxH) {
                  dH = maxH;
                  dW = dH / ratio;
                }
              } else {
                dH = Math.min(slotW * 0.65, maxH);
              }
              return { dW, dH };
            });

            const rowH = Math.max(...displayDims.map((d) => d.dH));
            const labelH = 8; // label above image
            ensureSpace(rowH + labelH + 4);

            for (let col = 0; col < rowImgs.length; col++) {
              const img = rowImgs[col];
              const { dW, dH } = displayDims[col];
              const x = margin + col * (slotW + gap);

              // Filename label
              doc.setFontSize(6.5);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...muted);
              doc.text(img.name, x, cursorY + 5, { maxWidth: slotW });

              // Image
              doc.addImage(
                img.imgData,
                img.imgFormat,
                x,
                cursorY + labelH,
                dW,
                dH,
                undefined,
                'FAST',
              );
            }

            cursorY += rowH + labelH + 5;
          }
        }

        cursorY += 3; // gap between tasks
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // SECTION 2 — MATERIAL REQUISITIONS
    // ─────────────────────────────────────────────────────────────────
    ensureSpace(30);
    sectionHeading('Material Requisitions');

    const mrqStatusColors: Record<string, [number, number, number]> = {
      FULFILLED: [16, 110, 55],
      PARTIALLY_FULFILLED: [146, 64, 14],
      PENDING: [37, 99, 235],
      CANCELLED: [107, 114, 128],
    };

    if (project.materialRequisitions.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text(
        'No material requisitions raised for this project.',
        margin + 4,
        cursorY,
      );
      cursorY += 12;
    } else {
      for (const req of project.materialRequisitions) {
        ensureSpace(40);

        const mrqColor = mrqStatusColors[req.status] ?? muted;

        // MRQ header row — white with neutral border
        doc.setFillColor(...white);
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, cursorY, cW, 14, 1.5, 1.5, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ink);
        doc.text(req.requisitionNumber, margin + 4, cursorY + 6);

        // Status as plain colored text
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...mrqColor);
        doc.text(
          req.status.replace(/_/g, ' '),
          pageW - margin - 2,
          cursorY + 6,
          { align: 'right' },
        );

        // Meta line
        const reqMeta = [
          `Raised by ${req.requestedBy.name}  ·  ${fmtTs(req.createdAt)}`,
          req.fulfilledBy
            ? `Fulfilled by ${req.fulfilledBy.name} on ${fmtTs(req.fulfilledAt)}`
            : '',
        ]
          .filter(Boolean)
          .join('   ·   ');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        doc.text(reqMeta, margin + 4, cursorY + 11.5, { maxWidth: cW - 8 });

        cursorY += 17;

        if (req.notes) {
          ensureSpace(10);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(55, 80, 65);
          doc.text(`Notes: ${req.notes}`, margin + 4, cursorY);
          cursorY += 7;
        }

        // Items table
        const tableRows = req.items.map((item, i) => [
          String(i + 1),
          item.material.name,
          item.material.partNumber ?? '—',
          `${item.quantityRequired} ${item.material.unit}`,
          item.quantityIssued != null
            ? `${item.quantityIssued} ${item.material.unit}`
            : '—',
          item.status.replace(/_/g, ' '),
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [
            [
              '#',
              'Material',
              'Part No.',
              'Qty Required',
              'Qty Issued',
              'Status',
            ],
          ],
          body: tableRows,
          headStyles: {
            fillColor: brandDark,
            textColor: white,
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: { fontSize: 7.5, textColor: ink },
          alternateRowStyles: { fillColor: slate },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 55 },
            2: { cellWidth: 28 },
            3: { cellWidth: 28, halign: 'center' },
            4: { cellWidth: 28, halign: 'center' },
            5: { cellWidth: 28, halign: 'center' },
          },
          margin: { left: margin, right: margin },
          theme: 'grid',
          tableLineColor: border,
          tableLineWidth: 0.3,
          didDrawPage: () => drawFooter(doc.getNumberOfPages()),
        });

        cursorY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // SECTION 3 — RESEARCH NOTES
    // ─────────────────────────────────────────────────────────────────
    ensureSpace(30);
    sectionHeading('Research Notes');

    if (project.notes.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text(
        'No research notes recorded for this project.',
        margin + 4,
        cursorY,
      );
      cursorY += 12;
    } else {
      for (const note of project.notes) {
        const noteLines = doc.splitTextToSize(
          note.content,
          cW - 10,
        ) as string[];
        const noteH = noteLines.length * 4.8 + 14;

        ensureSpace(noteH + 4);

        doc.setFillColor(...white);
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        // doc.roundedRect(margin, cursorY, cW, noteH, 1.5, 1.5, 'FD');

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...muted);
        doc.text(
          `${note.author.name}  ·  ${fmtTs(note.createdAt)}`,
          margin,
          cursorY + 5.5,
        );

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...ink);
        doc.text(noteLines, margin, cursorY + 11);

        cursorY += noteH + 5;
      }
    }

    // ── Footer on last page ───────────────────────────────────────────
    drawFooter(doc.getNumberOfPages());

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.projectNumber}-rd-report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating R&D PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
