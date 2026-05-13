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
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';

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

const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f1f5f9', text: '#64748b' },
  SENT: { bg: '#dbeafe', text: '#1d4ed8' },
  ACCEPTED: { bg: '#dcfce7', text: '#166534' },
  CONVERTED: { bg: '#ede9fe', text: '#5b21b6' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  EXPIRED: { bg: '#fef3c7', text: '#92400e' },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

interface Quote {
  id: string;
  quoteNumber: string;
  finalAmount: number;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: string;
  isAccepted: boolean;
  deliveryDate: string;
  expiryDate: string | null;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string } | null;
  lineItems: { id: string; quantity: number; unitPrice: number; storeItem: { id: string; name: string; itemNumber: string } | null }[];
}

export default function CustomerQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
    fetch(`/api/customer/quotes?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setQuotes(d.quotes);
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
          My Quotes
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          View all quotes issued to your account
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by quote number..."
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
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(QUOTE_STATUS_COLORS).map((s) => (
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
                <StyledTableCell>Quote #</StyledTableCell>
                <StyledTableCell>Items</StyledTableCell>
                <StyledTableCell align="right">Amount</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
                <StyledTableCell>Delivery Date</StyledTableCell>
                <StyledTableCell>Expires</StyledTableCell>
                <StyledTableCell>Invoice</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No quotes found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((q) => (
                  <StyledTableRow key={q.id}>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                        {q.quoteNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(q.createdAt)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      {q.lineItems.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {q.lineItems[0].storeItem?.name || 'Item'}
                          </Typography>
                          {q.lineItems.length > 1 && (
                            <Typography variant="caption" color="text.secondary">
                              +{q.lineItems.length - 1} more
                            </Typography>
                          )}
                        </Box>
                      )}
                    </StyledTableCell>

                    <StyledTableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(q.finalAmount)}
                      </Typography>
                      {q.discountAmount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          -{formatCurrency(q.discountAmount)} discount
                        </Typography>
                      )}
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <Chip
                        label={q.status}
                        size="small"
                        sx={{
                          bgcolor: QUOTE_STATUS_COLORS[q.status]?.bg || '#f1f5f9',
                          color: QUOTE_STATUS_COLORS[q.status]?.text || '#64748b',
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2">{formatDate(q.deliveryDate)}</Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      {q.expiryDate ? (
                        <Typography variant="body2">{formatDate(q.expiryDate)}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </StyledTableCell>

                    <StyledTableCell>
                      {q.invoice ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ReceiptIcon sx={{ fontSize: 14, color: '#10b981' }} />
                          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                            {q.invoice.invoiceNumber}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </StyledTableCell>
                  </StyledTableRow>
                ))
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
