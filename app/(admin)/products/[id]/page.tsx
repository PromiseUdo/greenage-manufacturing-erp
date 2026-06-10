'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  AttachFile as AttachIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomIcon,
  Description as DescriptionIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types ---
interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface ProductMaterial {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
    category: string;
  };
}

interface ProductDetail {
  id: string;
  name: string;
  productNumber: string;
  description: string;
  category: string;
  productCode: string;
  model: string;
  costPrice: number;
  currency: string;
  isActive: boolean;
  warranty: string;
  leadTime: number;
  designFiles: FileAttachment[];
  materials: ProductMaterial[];
  specifications: { label: string; value: string }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string };
  _count: {
    quotes: number;
    orders: number;
    invoices: number;
  };
}

// --- Styles ---
const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 700,
  color: '#0F172A',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

const InfoRow = ({
  label,
  value,
  highlight,
  bold,
  chip,
  chipColor,
  chipBgColor,
  valueColor,
}: {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string;
  chipBgColor?: string;
  valueColor?: string;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
      borderBottom: '1px dashed',
      borderColor: 'divider',
      pb: 1,
      '&:last-child': {
        borderBottom: 'none',
        mb: 0,
        pb: 0,
      },
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
      {label}:
    </Typography>
    {chip ? (
      <Chip
        label={value as string}
        size="small"
        sx={{
          fontWeight: 500,
          color: chipColor || 'inherit',
          backgroundColor: chipBgColor || 'inherit',
          height: 24,
        }}
      />
    ) : (
      <Typography
        variant="body2"
        component="div"
        sx={{
          fontWeight: bold || highlight ? 600 : 400,
          color: valueColor || (highlight ? 'error.main' : 'text.primary'),
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    )}
  </Box>
);

const categoryColors: Record<string, { bg: string; text: string }> = {
  INVERTER: { bg: '#dbeafe', text: '#1e40af' },
  UPS: { bg: '#fce7f3', text: '#9f1239' },
  BATTERY: { bg: '#fef3c7', text: '#92400e' },
  SOLAR_PANEL: { bg: '#d1fae5', text: '#065f46' },
  CHARGE_CONTROLLER: { bg: '#e0e7ff', text: '#4338ca' },
  SOLAR_GENERATOR: { bg: '#e0e7ff', text: '#4338ca' },
  ACCESSORY: { bg: '#f3f4f6', text: '#374151' },
  PACKAGE: { bg: '#fae8ff', text: '#86198f' },
  OTHER: { bg: '#f3f4f6', text: '#6b7280' },
};

// Load an image URL as a base64 data URL
async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch product');
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update product status');
      setSuccess('Product status updated successfully');
      fetchProduct();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePrintTechSpec = async () => {
    if (!product) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;

      // Greenage brand palette — mirrors the finance/sales report PDF
      const C = {
        brandGreen: [0, 61, 52] as [number, number, number], // #003D34
        midGreen: [31, 164, 59] as [number, number, number], // #1FA43B
        lightGreen: [211, 242, 175] as [number, number, number], // #D3F2AF — header sub-text
        rowGreen: [238, 249, 229] as [number, number, number], // #EEF9E5 — alt rows
        black: [0, 0, 0] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        muted: [120, 120, 120] as [number, number, number],
        divider: [210, 235, 210] as [number, number, number],
      };

      // Load white logo for dark header
      const whiteLogo = await loadImageAsDataUrl('/greenage_logo_white.png');

      // ── HEADER BAND (matches finance/sales report) ────────────────
      const headerH = 32;
      doc.setFillColor(...C.brandGreen);
      doc.rect(0, 0, pageW, headerH, 'F');

      // Logo — natural aspect ratio 917:254, h=11 → w≈39.7
      if (whiteLogo) {
        const logoH = 11;
        const logoW = logoH * (917 / 254);
        doc.addImage(
          whiteLogo,
          'PNG',
          margin,
          7,
          logoW,
          logoH,
          undefined,
          'FAST',
        );
      } else {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white);
        doc.text('GREENAGE', margin, 16);
      }

      // Thin vertical separator in mid-green (same as report header)
      doc.setFillColor(...C.midGreen);
      doc.rect(57, 7, 0.6, 18, 'F');

      // Document title — white
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text('Technical Specification', 62, 15);

      // Subtitle — light green tint, matches report period line
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.lightGreen);
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        62,
        22,
      );

      // Accent stripe below header (matches report)
      doc.setFillColor(...C.midGreen);
      doc.rect(0, headerH, pageW, 1.5, 'F');

      doc.setTextColor(...C.black);

      // ── PRODUCT HERO ─────────────────────────────────────────────
      let y = headerH + 12;

      // Product name
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.brandGreen);
      const nameLines = doc.splitTextToSize(product.name, contentW - 30);
      doc.text(nameLines, margin, y);
      y += nameLines.length * 9;

      // Status badge
      const statusLabel = product.isActive ? 'ACTIVE' : 'INACTIVE';
      const statusFill: [number, number, number] = product.isActive
        ? C.midGreen
        : [220, 38, 38];
      doc.setFillColor(...statusFill);
      doc.setTextColor(...C.white);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.roundedRect(margin, y, 20, 5.5, 1, 1, 'F');
      doc.text(statusLabel, margin + 10, y + 3.8, { align: 'center' });
      y += 10;

      // Meta info row — 5 columns with light green tint background
      const metaItems = [
        { label: 'PRODUCT CODE', value: product.productCode },
        { label: 'MODEL', value: product.model || '—' },
        {
          label: 'CATEGORY',
          value: (product.category || '').replace(/_/g, ' ') || '—',
        },
        { label: 'WARRANTY', value: product.warranty || '—' },
        {
          label: 'LEAD TIME',
          value: product.leadTime ? `${product.leadTime} days` : '—',
        },
      ];

      doc.setFillColor(...C.rowGreen);
      doc.rect(margin, y, contentW, 18, 'F');
      doc.setDrawColor(...C.divider);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentW, 18, 'S');

      const colW = contentW / metaItems.length;
      metaItems.forEach((item, i) => {
        const x = margin + i * colW + 4;
        if (i > 0) {
          doc.setDrawColor(...C.divider);
          doc.setLineWidth(0.3);
          doc.line(margin + i * colW, y + 2, margin + i * colW, y + 16);
        }
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text(item.label, x, y + 6);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.brandGreen);
        const valLines = doc.splitTextToSize(item.value, colW - 6);
        doc.text(valLines[0] || item.value, x, y + 13);
      });

      y += 24;

      // ── DESCRIPTION ──────────────────────────────────────────────
      if (product.description && product.description.trim()) {
        // Left accent bar in mid-green
        // doc.setFillColor(...C.midGreen);
        // doc.rect(margin, y, 1.2, 14, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...C.muted);
        const descLines = doc.splitTextToSize(
          product.description,
          contentW - 8,
        );
        const visibleLines = descLines.slice(0, 3);
        doc.text(visibleLines, margin, y + 4.5);
        y += Math.max(16, visibleLines.length * 4.5 + 5);
      }

      y += 4;

      // ── SECTION HEADER — black bar / white text (matches finance report table heads) ──
      const drawSectionHeader = (title: string, currentY: number) => {
        doc.setFillColor(...C.black);
        doc.rect(margin, currentY, contentW, 7.5, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white);
        doc.text(title, margin + 4, currentY + 5.2);
        return currentY + 7.5;
      };

      // ── TECHNICAL SPECIFICATIONS ──────────────────────────────────
      if (product.specifications && product.specifications.length > 0) {
        if (y > pageH - 60) {
          doc.addPage();
          y = margin + 8;
        }

        y = drawSectionHeader('TECHNICAL SPECIFICATIONS', y);

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          head: [['Parameter', 'Value']],
          body: product.specifications.map((s) => [s.label, s.value]),
          styles: {
            fontSize: 9,
            cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
            lineColor: C.divider,
            lineWidth: 0.3,
            textColor: C.black,
          },
          headStyles: {
            fillColor: C.black,
            textColor: C.white,
            fontStyle: 'bold',
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: C.rowGreen },
          columnStyles: {
            0: {
              fontStyle: 'bold',
              textColor: C.brandGreen,
              cellWidth: contentW * 0.42,
            },
            1: { textColor: C.black },
          },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── BILL OF MATERIALS ─────────────────────────────────────────
      if (product.materials && product.materials.length > 0) {
        if (y > pageH - 60) {
          doc.addPage();
          y = margin + 8;
        }

        y = drawSectionHeader('BILL OF MATERIALS', y);

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          head: [['#', 'Material', 'Part Number', 'Category', 'Qty Required']],
          body: product.materials.map((pm, i) => [
            String(i + 1),
            pm.material.name,
            pm.material.partNumber,
            pm.material.category.replace(/_/g, ' '),
            `${pm.quantity} ${pm.material.unit}`,
          ]),
          styles: {
            fontSize: 9,
            cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
            lineColor: C.divider,
            lineWidth: 0.3,
            textColor: C.black,
          },
          headStyles: {
            fillColor: C.black,
            textColor: C.white,
            fontStyle: 'bold',
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: C.rowGreen },
          columnStyles: {
            0: {
              halign: 'center',
              cellWidth: 10,
              textColor: C.muted,
              fontSize: 7.5,
            },
            1: { fontStyle: 'bold', textColor: C.brandGreen },
            2: { textColor: C.muted, fontSize: 8, cellWidth: 35 },
            3: { textColor: C.muted, cellWidth: 38 },
            4: {
              halign: 'right',
              fontStyle: 'bold',
              textColor: C.brandGreen,
              cellWidth: 28,
            },
          },
        });

        y = (doc as any).lastAutoTable.finalY + 5;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...C.muted);
        doc.text(
          `Total: ${product.materials.length} component${product.materials.length !== 1 ? 's' : ''}`,
          margin,
          y,
        );
      }

      // ── FOOTER — mirrors finance report footer exactly ────────────
      const totalPages = doc.getNumberOfPages();
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        const footerY = pageH - 9;

        // Mid-green rule above footer text
        doc.setFillColor(...C.midGreen);
        doc.rect(margin, footerY - 4, contentW, 0.4, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.brandGreen);
        doc.text('Greenage Technologies Limited', margin, footerY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text(
          `Technical Specification — ${product.productCode}`,
          pageW / 2,
          footerY,
          { align: 'center' },
        );

        doc.setTextColor(...C.brandGreen);
        doc.text(`Page ${pg} of ${totalPages}`, pageW - margin, footerY, {
          align: 'right',
        });
      }

      doc.save(`${product.productCode}_TechSpec.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadBOM = () => {
    if (!product) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bill of Materials - ${product.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Product Code: ${product.productCode}`, 14, 22);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 27);

    const tableData = product.materials.map((pm) => [
      pm.material.name,
      pm.material.partNumber,
      pm.material.category.replace(/_/g, ' '),
      `${pm.quantity} ${pm.material.unit}`,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Material Name', 'Part Number', 'Category', 'Quantity']],
      body: tableData,
    });

    doc.save(`${product.productCode}_BOM.pdf`);
  };

  const handleDownload = (file: FileAttachment) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <PdfIcon sx={{ color: '#d32f2f', fontSize: 40 }} />;
    }
    if (type.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#1976d2', fontSize: 40 }} />;
    }
    return <AttachIcon sx={{ fontSize: 40 }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box>
        <Alert severity="error">{error || 'Product not found'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/products')}
          sx={{ mb: 2 }}
        >
          Back to Products
        </Button>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {product.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={product.productNumber} size="small" />
              <Chip
                label={product.category?.replace(/_/g, ' ') || ''}
                size="small"
                sx={{
                  bgcolor: categoryColors[product.category]?.bg || '#f3f4f6',
                  color: categoryColors[product.category]?.text || '#6b7280',
                  fontWeight: 500,
                }}
              />
              <Chip
                label={product.isActive ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  fontWeight: 500,
                  bgcolor: product.isActive ? '#e8f5e9' : '#ffebee',
                  color: product.isActive ? '#2e7d32' : '#d32f2f',
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={
                generatingPdf ? <CircularProgress size={16} /> : <PrintIcon />
              }
              onClick={handlePrintTechSpec}
              disabled={generatingPdf}
              sx={{ minWidth: 180 }}
            >
              {generatingPdf ? 'Generating PDF…' : 'Print Tech Spec Sheet'}
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/products/${product.id}/edit`)}
              sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1e293b' } }}
            >
              Edit Product
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Technical Specifications */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <SectionHeader>
              <DescriptionIcon fontSize="small" /> Technical Specifications
            </SectionHeader>

            {product.specifications && product.specifications.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {product.specifications.map((spec: any, index: number) => (
                  <InfoRow key={index} label={spec.label} value={spec.value} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No specifications listed.
              </Typography>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {product.description || 'No description provided.'}
              </Typography>
            </Box>
          </Paper>

          {/* Bill of Materials */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <SectionHeader sx={{ mb: 0 }}>
                <MemoryIcon fontSize="small" /> Bill of Materials (BOM)
              </SectionHeader>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={handleDownloadBOM}
              >
                Download BOM PDF
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Material Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Part Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Qty Required
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.materials && product.materials.length > 0 ? (
                    product.materials.map((pm) => (
                      <TableRow key={pm.id} hover>
                        <TableCell>{pm.material.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={pm.material.partNumber}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          {pm.material.category.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {pm.quantity} {pm.material.unit}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          py: 4,
                          color: 'text.secondary',
                          fontStyle: 'italic',
                        }}
                      >
                        No materials linked to this product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Design Files */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SectionHeader>
              <AttachIcon fontSize="small" /> Design & Technical Documents
            </SectionHeader>

            {product.designFiles && product.designFiles.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {product.designFiles.map((file, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                      }}
                    >
                      {getFileIcon(file.type)}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)} •{' '}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewFile(file)}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <ZoomIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <AttachIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  No design files attached.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Basic Info & Metadata */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <SectionHeader>Product Information</SectionHeader>
            <InfoRow label="Product Code" value={product.productCode} bold />
            <InfoRow label="Model" value={product.model || 'N/A'} />
            <InfoRow label="Warranty" value={product.warranty || 'None'} />
            <InfoRow
              label="Lead Time"
              value={product.leadTime ? `${product.leadTime} days` : 'N/A'}
            />
            <InfoRow
              label="Created By"
              value={product.createdBy?.name || 'Unknown'}
            />
            <InfoRow label="Created On" value={formatDate(product.createdAt)} />
          </Paper>

          {/* Financials */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : '#F8FAFC',
            }}
          >
            <SectionHeader>Financials</SectionHeader>
            <InfoRow
              label="Cost Price (Production)"
              value={formatCurrency(product.costPrice)}
              bold
              valueColor="#0F172A"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              * This is the internal production cost.
            </Typography>
          </Paper>

          {/* Settings */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <SectionHeader>Settings</SectionHeader>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={product.isActive}
                  onChange={handleToggleActive}
                />
              }
              label={
                <Typography variant="body2">
                  Product is{' '}
                  <strong>{product.isActive ? 'Active' : 'Inactive'}</strong>
                </Typography>
              }
            />
          </Paper>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SectionHeader>Tags</SectionHeader>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* File Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getFileIcon(previewFile.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={600} noWrap>
                    {previewFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(previewFile.size)}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {previewFile.type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewFile.url}
                  alt={previewFile.name}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              ) : previewFile.type === 'application/pdf' ? (
                <Box
                  component="iframe"
                  src={previewFile.url}
                  sx={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <Alert severity="info">
                  Preview not available for this file type. Please download to
                  view.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewFile(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewFile)}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
