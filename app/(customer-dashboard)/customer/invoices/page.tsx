'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  status: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  quote: { id: string; quoteNumber: string } | null;
  lineItems: { id: string; quantity: number; unitPrice: number; storeItem: { id: string; name: string; itemNumber: string } | null }[];
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    fetch(`/api/customer/invoices?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInvoices(d.invoices);
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
          My Invoices
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Track your invoices and payment status
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by invoice number..."
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
            label="Payment Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(PAYMENT_STATUS_COLORS).map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
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
                <StyledTableCell>Invoice #</StyledTableCell>
                <StyledTableCell>Items</StyledTableCell>
                <StyledTableCell align="right">Total</StyledTableCell>
                <StyledTableCell>Payment Progress</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
                <StyledTableCell>Due Date</StyledTableCell>
                <StyledTableCell>Quote Ref</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No invoices found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const paidPct = inv.finalAmount > 0
                    ? Math.min(100, (inv.paidAmount / inv.finalAmount) * 100)
                    : 0;

                  return (
                    <StyledTableRow key={inv.id}>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                          {inv.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Issued {formatDate(inv.issueDate)}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell>
                        {inv.lineItems.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        ) : (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {inv.lineItems[0].storeItem?.name || 'Item'}
                            </Typography>
                            {inv.lineItems.length > 1 && (
                              <Typography variant="caption" color="text.secondary">
                                +{inv.lineItems.length - 1} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </StyledTableCell>

                      <StyledTableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(inv.finalAmount)}
                        </Typography>
                        {inv.balanceAmount > 0 && (
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            {formatCurrency(inv.balanceAmount)} due
                          </Typography>
                        )}
                      </StyledTableCell>

                      <StyledTableCell sx={{ minWidth: 160 }}>
                        <Tooltip title={`${formatCurrency(inv.paidAmount)} of ${formatCurrency(inv.finalAmount)} paid`}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(paidPct)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={paidPct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: paidPct === 100 ? '#10b981' : '#3b82f6',
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </StyledTableCell>

                      <StyledTableCell align="center">
                        <Chip
                          label={inv.paymentStatus}
                          size="small"
                          sx={{
                            bgcolor: PAYMENT_STATUS_COLORS[inv.paymentStatus]?.bg || '#f1f5f9',
                            color: PAYMENT_STATUS_COLORS[inv.paymentStatus]?.text || '#64748b',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'PAID'
                              ? 'error.main'
                              : 'text.primary',
                            fontWeight: new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'PAID' ? 600 : 400,
                          }}
                        >
                          {formatDate(inv.dueDate)}
                        </Typography>
                        {inv.paidAt && (
                          <Typography variant="caption" color="text.secondary">
                            Paid {formatDate(inv.paidAt)}
                          </Typography>
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {inv.quote ? (
                          <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>
                            {inv.quote.quoteNumber}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
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
