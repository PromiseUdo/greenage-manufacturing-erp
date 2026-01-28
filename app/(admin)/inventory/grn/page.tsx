// src/app/dashboard/inventory/grn/page.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  styled,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  AttachFile as AttachIcon,
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

interface GRNWithSupplier {
  id: string;
  grnNumber: string;
  receivedDate: string;
  invoiceNumber?: string;
  items: any;
  receivedBy: string;
  notes?: string;
  attachments?: FileAttachment[];
  supplier: {
    id: string;
    name: string;
  };
  batches?: Array<{
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    supplierBatchNo?: string;
    material?: {
      name: string;
      partNumber: string;
      unit: string;
    };
  }>;
}

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.5px',
    padding: '8px 16px',
    borderBottom: 'none',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

export default function GRNPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRNWithSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedGRN, setExpandedGRN] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchGRNs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/inventory/grn?${params}`);
      const data = await res.json();
      setGrns(data?.grns || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchGRNs();
  }, [fetchGRNs, refreshTrigger]);

  const handleToggleExpand = (grnId: string) => {
    setExpandedGRN(expandedGRN === grnId ? null : grnId);
  };

  const handleViewDetails = (grnId: string) => {
    router.push(`/inventory/grn/${grnId}`);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const getTotalItems = (items: any) => {
    if (Array.isArray(items)) {
      return items.length;
    }
    return 0;
  };

  const getTotalQuantity = (batches: any[]) => {
    return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Goods Received Notes (GRN)
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Track all materials received from suppliers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/inventory/grn/new')}
          sx={{
            textTransform: 'uppercase',
            bgcolor: '#0F172A',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          Create GRN
        </Button>
      </Box>

      {/* Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by GRN number, supplier, or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 500,
            fontSize: 14,
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#0F172A',
                borderWidth: 1,
              },
            },
          }}
        />
      </Paper>

      {/* GRNs Table */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading GRNs...
          </Typography>
        </Paper>
      ) : grns?.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            textAlign: 'center',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <ReceiptIcon sx={{ fontSize: 28, color: 'action.active' }} />
            </Box>

            <Typography variant="h6" fontWeight={600}>
              No GRNs yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Create your first Goods Received Note to track materials received
              from suppliers
            </Typography>

            <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: '#0F172A',
                '&:hover': { bgcolor: '#1e293b' },
              }}
              startIcon={<AddIcon />}
              onClick={() => router.push('/inventory/grn/new')}
            >
              Create GRN
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell width={50}></StyledTableCell>
                  <StyledTableCell>GRN Number</StyledTableCell>
                  <StyledTableCell>Date Received</StyledTableCell>
                  <StyledTableCell>Supplier</StyledTableCell>
                  <StyledTableCell>Invoice No.</StyledTableCell>
                  <StyledTableCell align="center">Items</StyledTableCell>
                  <StyledTableCell align="center">Total Qty</StyledTableCell>
                  <StyledTableCell align="center">Attachments</StyledTableCell>
                  <StyledTableCell>Received By</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grns?.map((grn) => (
                  <React.Fragment key={grn.id}>
                    <StyledTableRow>
                      <StyledTableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(grn.id)}
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          {expandedGRN === grn.id ? (
                            <CollapseIcon fontSize="small" />
                          ) : (
                            <ExpandIcon fontSize="small" />
                          )}
                        </IconButton>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={grn.grnNumber}
                          size="small"
                          sx={{
                            bgcolor: '#e8f5e9',
                            color: '#2e7d32',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => handleViewDetails(grn.id)}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(grn.receivedDate), 'hh:mm a')}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {grn.supplier.name}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {grn.invoiceNumber ? (
                          <Chip
                            label={grn.invoiceNumber}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 500,
                              fontSize: '11px',
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          label={getTotalItems(grn.items)}
                          size="small"
                          sx={{
                            minWidth: 40,
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 600,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: '#16a34a' }}
                        >
                          +{getTotalQuantity(grn.batches || [])}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {grn.attachments && grn.attachments.length > 0 ? (
                          <Chip
                            icon={<AttachIcon fontSize="small" />}
                            label={grn.attachments.length}
                            size="small"
                            sx={{
                              bgcolor: '#f3e5f5',
                              color: '#9c27b0',
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {grn.receivedBy}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(grn.id)}
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>

                    {/* Expanded Row - Items Details */}
                    {expandedGRN === grn.id && grn.batches && (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          sx={{
                            py: 0,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Collapse
                            in={expandedGRN === grn.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                p: 3,
                                backgroundColor: '#f8fafc',
                                marginTop: 1,
                                borderRadius: 2,
                                marginBottom: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                gutterBottom
                                sx={{ mb: 2 }}
                              >
                                Received Items
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Material
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Part Number
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      Quantity
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Batch Number
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Supplier Batch
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Expiry Date
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {grn.batches.map((batch) => (
                                    <TableRow
                                      key={batch.id}
                                      sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                      }}
                                    >
                                      <TableCell>
                                        <Typography variant="body2">
                                          {batch.material?.name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={batch.material?.partNumber}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: 11 }}
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                        >
                                          {batch.quantity}{' '}
                                          {batch.material?.unit}
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
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {batch.supplierBatchNo || '—'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {batch.expiryDate
                                            ? format(
                                                new Date(batch.expiryDate),
                                                'MMM dd, yyyy',
                                              )
                                            : '—'}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {grn.notes && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    <strong>Notes:</strong> {grn.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={limit}
            page={page - 1}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#F8FAFC',
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
