'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.5px',
    padding: '10px 16px',
    borderBottom: 'none',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:hover': { backgroundColor: theme.palette.action.selected, transition: 'background-color 0.2s ease' },
  '&:last-child td': { borderBottom: 0 },
}));

const ORDER_STATUS_STEPS = [
  'PENDING_PLANNING',
  'IN_PRODUCTION',
  'QC_TESTING',
  'PACKAGING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'DELIVERED',
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PLANNING: 'Planning',
  IN_PRODUCTION: 'In Production',
  QC_TESTING: 'QC Testing',
  PACKAGING: 'Packaging',
  READY_FOR_DISPATCH: 'Ready',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_PLANNING: { bg: '#f1f5f9', text: '#64748b' },
  IN_PRODUCTION: { bg: '#dbeafe', text: '#1d4ed8' },
  QC_TESTING: { bg: '#ede9fe', text: '#5b21b6' },
  PACKAGING: { bg: '#ffedd5', text: '#9a3412' },
  READY_FOR_DISPATCH: { bg: '#dcfce7', text: '#166534' },
  DISPATCHED: { bg: '#e0f2fe', text: '#0369a1' },
  DELIVERED: { bg: '#dcfce7', text: '#14532d' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f1f5f9', text: '#64748b' },
  NORMAL: { bg: '#f0fdf4', text: '#166534' },
  HIGH: { bg: '#fef3c7', text: '#92400e' },
  URGENT: { bg: '#fee2e2', text: '#991b1b' },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  PARTIAL: { bg: '#dbeafe', text: '#1d4ed8' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  OVERDUE: { bg: '#fee2e2', text: '#991b1b' },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  paymentStatus: string;
  deliveryDate: string;
  createdAt: string;
  lineItems: { id: string; quantity: number; unitPrice: number; storeItem: { id: string; name: string; itemNumber: string } | null }[];
  invoices: { id: string; invoiceNumber: string; paymentStatus: string }[];
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page + 1),
      limit: String(rowsPerPage),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/customer/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setOrders(d.orders);
        setTotal(d.pagination.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, search, statusFilter]);

  if (error) {
    return <Box py={4}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ pb: 6, pt: 1 }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>
          My Orders
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Track the status and progress of your orders
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            sx={{ maxWidth: 360, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
              <MenuItem key={val} value={val}>{label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 620 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>Order #</StyledTableCell>
                <StyledTableCell>Items</StyledTableCell>
                <StyledTableCell>Order Value</StyledTableCell>
                <StyledTableCell>Progress</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
                <StyledTableCell align="center">Priority</StyledTableCell>
                <StyledTableCell>Delivery Date</StyledTableCell>
                <StyledTableCell align="center">Payment</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No orders found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((ord) => {
                  const stepIndex = ORDER_STATUS_STEPS.indexOf(ord.status);
                  const totalValue = ord.lineItems.reduce(
                    (sum, li) => sum + li.quantity * li.unitPrice,
                    0,
                  );

                  return (
                    <StyledTableRow key={ord.id}>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                          {ord.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(ord.createdAt)}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell>
                        {ord.lineItems.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        ) : (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {ord.lineItems[0].storeItem?.name || 'Item'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {ord.lineItems.reduce((s, li) => s + li.quantity, 0)}
                              {ord.lineItems.length > 1 && ` · +${ord.lineItems.length - 1} more`}
                            </Typography>
                          </Box>
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(totalValue)}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell sx={{ minWidth: 220 }}>
                        {ord.status === 'CANCELLED' ? (
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            Order Cancelled
                          </Typography>
                        ) : (
                          <Stepper
                            activeStep={stepIndex}
                            alternativeLabel={false}
                            sx={{
                              '& .MuiStepLabel-label': { fontSize: '0.6rem', mt: 0.25 },
                              '& .MuiStepIcon-root': { fontSize: '0.9rem' },
                              '& .MuiStepConnector-line': { borderTopWidth: 1 },
                              p: 0,
                            }}
                          >
                            {ORDER_STATUS_STEPS.map((s) => (
                              <Step key={s} sx={{ px: 0 }}>
                                <Tooltip title={ORDER_STATUS_LABELS[s]}>
                                  <StepLabel
                                    StepIconProps={{
                                      sx: {
                                        color: s === ord.status ? '#10b981' : undefined,
                                        '&.Mui-completed': { color: '#10b981' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              </Step>
                            ))}
                          </Stepper>
                        )}
                      </StyledTableCell>

                      <StyledTableCell align="center">
                        <Chip
                          label={ORDER_STATUS_LABELS[ord.status] || ord.status}
                          size="small"
                          sx={{
                            bgcolor: ORDER_STATUS_COLORS[ord.status]?.bg || '#f1f5f9',
                            color: ORDER_STATUS_COLORS[ord.status]?.text || '#64748b',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </StyledTableCell>

                      <StyledTableCell align="center">
                        <Chip
                          label={ord.priority}
                          size="small"
                          sx={{
                            bgcolor: PRIORITY_COLORS[ord.priority]?.bg || '#f1f5f9',
                            color: PRIORITY_COLORS[ord.priority]?.text || '#64748b',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography variant="body2">{formatDate(ord.deliveryDate)}</Typography>
                      </StyledTableCell>

                      <StyledTableCell align="center">
                        <Chip
                          label={ord.paymentStatus}
                          size="small"
                          sx={{
                            bgcolor: PAYMENT_STATUS_COLORS[ord.paymentStatus]?.bg || '#f1f5f9',
                            color: PAYMENT_STATUS_COLORS[ord.paymentStatus]?.text || '#64748b',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ borderTop: '1px solid', borderColor: 'divider', backgroundColor: '#F8FAFC' }}
        />
      </Paper>
    </Box>
  );
}
