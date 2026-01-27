// src/app/dashboard/inventory/grn/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  AttachFile as AttachIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface GRNDetail {
  id: string;
  grnNumber: string;
  receivedDate: string;
  invoiceNumber?: string;
  receivedBy: string;
  notes?: string;
  attachments?: FileAttachment[];
  supplier: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    address?: string;
  };
  batches: Array<{
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    supplierBatchNo?: string;
    material: {
      id: string;
      name: string;
      partNumber: string;
      category: string;
      unit: string;
    };
  }>;
}

export default function GRNDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [grn, setGrn] = useState<GRNDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  useEffect(() => {
    fetchGRN();
  }, [resolvedParams.id]);

  const fetchGRN = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/grn/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch GRN');
      }
      const data = await res.json();
      setGrn(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !grn) {
    return (
      <Box>
        <Alert severity="error">{error || 'GRN not found'}</Alert>
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

  const totalQuantity = grn.batches.reduce(
    (sum, batch) => sum + batch.quantity,
    0,
  );

  return (
    <Box
      sx={{
        pb: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to GRN List
        </Button>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
            </Box> */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                  {grn.grnNumber}
                </Typography>
                <Chip
                  label="Received"
                  size="small"
                  sx={{
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(grn.receivedDate), 'MMMM dd, yyyy - hh:mm a')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Details */}
        <Grid item xs={12} md={8}>
          {/* Supplier Information */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontWeight: 600, color: '#0F172A', fontSize: 18, mb: 2 }}
            >
              Supplier Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Supplier Name
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    fontSize: 15,
                  }}
                  fontWeight={400}
                >
                  {grn.supplier.name}
                </Typography>
              </Grid>
              {grn.supplier.contactPerson && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Person
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: 15,
                    }}
                    variant="body1"
                    fontWeight={400}
                  >
                    {grn.supplier.contactPerson}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: 15,
                  }}
                  variant="body1"
                  fontWeight={400}
                >
                  {grn.supplier.phone}
                </Typography>
              </Grid>
              {grn.supplier.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: 15,
                    }}
                    variant="body1"
                    fontWeight={400}
                  >
                    {grn.supplier.email}
                  </Typography>
                </Grid>
              )}
              {grn.supplier.address && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: 15,
                    }}
                    variant="body1"
                    fontWeight={400}
                  >
                    {grn.supplier.address}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Items Received */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box
              sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#0F172A', fontSize: 18, mb: 2 }}
              >
                Items Received
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {grn.batches.length} material(s) • Total quantity:{' '}
                {totalQuantity}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Material
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Part Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Category
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontSize: 13 }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Batch Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Supplier Batch
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Expiry Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grn.batches.map((batch) => (
                    <TableRow key={batch.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {batch.material.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={batch.material.partNumber}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={batch.material.category.replace(/_/g, ' ')}
                          size="small"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {batch.quantity} {batch.material.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={batch.batchNumber}
                          size="small"
                          sx={{
                            bgcolor: '#fef3c7',
                            color: '#f59e0b',
                            fontWeight: 500,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {batch.supplierBatchNo || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {batch.expiryDate
                            ? format(new Date(batch.expiryDate), 'MMM dd, yyyy')
                            : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Notes */}
          {grn.notes && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#0F172A', fontSize: 18, mb: 2 }}
              >
                Notes
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {grn.notes}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Summary & Attachments */}
        <Grid item xs={12} md={4}>
          {/* Summary Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontWeight: 600, color: '#0F172A', fontSize: 18, mb: 2 }}
            >
              Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Invoice Number
                </Typography>
                {grn.invoiceNumber ? (
                  <Chip
                    label={grn.invoiceNumber}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Received By
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{
                    fontSize: 15,
                  }}
                >
                  {grn.receivedBy}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{
                    fontSize: 15,
                  }}
                >
                  {grn.batches.length} material(s)
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: '#16a34a', fontSize: 15 }}
                >
                  +{totalQuantity}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Attachments Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttachIcon fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#0F172A', fontSize: 18 }}
                fontWeight={600}
              >
                Attachments
              </Typography>
              {grn.attachments && grn.attachments.length > 0 && (
                <Chip
                  label={grn.attachments.length}
                  size="small"
                  sx={{ ml: 'auto', bgcolor: '#e3f2fd', color: '#1976d2' }}
                />
              )}
            </Box>

            {grn.attachments && grn.attachments.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {grn.attachments.map((file, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                      },
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
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewFile(file)}
                            sx={{
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
                          >
                            <ZoomIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                            sx={{
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
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
              <Box
                sx={{
                  textAlign: 'center',
                  py: 3,
                  color: 'text.secondary',
                }}
              >
                <AttachIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">No attachments</Typography>
              </Box>
            )}
          </Paper>
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
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
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
                  sx={{
                    width: '100%',
                    height: '70vh',
                    border: 'none',
                  }}
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
