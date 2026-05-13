'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaidIcon from '@mui/icons-material/Paid';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    notation: amount >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f1f5f9', text: '#64748b' },
  SENT: { bg: '#dbeafe', text: '#1d4ed8' },
  ACCEPTED: { bg: '#dcfce7', text: '#166534' },
  CONVERTED: { bg: '#ede9fe', text: '#5b21b6' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  EXPIRED: { bg: '#fef3c7', text: '#92400e' },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  PARTIAL: { bg: '#dbeafe', text: '#1d4ed8' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  OVERDUE: { bg: '#fee2e2', text: '#991b1b' },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PLANNING: 'Planning',
  IN_PRODUCTION: 'In Production',
  QC_TESTING: 'QC Testing',
  PACKAGING: 'Packaging',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
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

const SectionCard = styled(Paper)(() => ({
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.1)',
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}));

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <SectionCard sx={{ p: 2.5, height: '100%', boxSizing: 'border-box' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: 11,
            }}
          >
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', mt: 0.5, lineHeight: 1.2 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, width: 44, height: 44, color }}>
          {icon}
        </Avatar>
      </Box>
    </SectionCard>
  );
}

interface OverviewData {
  customer: { id: string; name: string; email: string | null };
  stats: {
    quoteCount: number;
    invoiceCount: number;
    orderCount: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  recentQuotes: any[];
  recentInvoices: any[];
  recentOrders: any[];
}

export default function CustomerOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customer/overview')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { customer, stats, recentQuotes, recentInvoices, recentOrders } = data!;

  return (
    <Box sx={{ pb: 6, pt: 1 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>
          Welcome back, {customer.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Here's a summary of your account activity
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Quotes"
            value={stats.quoteCount.toString()}
            icon={<DescriptionIcon />}
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Orders"
            value={stats.orderCount.toString()}
            icon={<ShoppingCartIcon />}
            color="#0ea5e9"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Invoices"
            value={stats.invoiceCount.toString()}
            icon={<ReceiptIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Invoiced"
            value={formatCurrency(stats.totalInvoiced)}
            icon={<AccountBalanceWalletIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            icon={<PaidIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Outstanding"
            value={formatCurrency(stats.outstandingBalance)}
            sub="Balance due"
            icon={<PendingActionsIcon />}
            color={stats.outstandingBalance > 0 ? '#ef4444' : '#10b981'}
          />
        </Grid>
      </Grid>

      {/* Recent activity rows */}
      <Grid container spacing={2}>
        {/* Recent Quotes */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: '1px solid rgba(15,23,42,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography fontWeight={700} fontSize={14} sx={{ color: '#0f172a' }}>
                Recent Quotes
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => router.push('/customer/quotes')}
              >
                View all
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }}>Quote #</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" fontSize={13}>No quotes yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentQuotes.map((q) => (
                      <TableRow
                        key={q.id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => router.push('/customer/quotes')}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} fontSize={13} sx={{ color: '#0f172a' }}>
                            {q.quoteNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(q.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={600} fontSize={13}>
                            {formatCurrency(q.finalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip
                            label={q.status}
                            size="small"
                            sx={{
                              bgcolor: QUOTE_STATUS_COLORS[q.status]?.bg || '#f1f5f9',
                              color: QUOTE_STATUS_COLORS[q.status]?.text || '#64748b',
                              fontWeight: 700,
                              fontSize: 10,
                              height: 20,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>

        {/* Recent Invoices */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: '1px solid rgba(15,23,42,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography fontWeight={700} fontSize={14} sx={{ color: '#0f172a' }}>
                Recent Invoices
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => router.push('/customer/invoices')}
              >
                View all
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }} align="right">Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" fontSize={13}>No invoices yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentInvoices.map((inv) => (
                      <TableRow
                        key={inv.id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => router.push('/customer/invoices')}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} fontSize={13} sx={{ color: '#0f172a' }}>
                            {inv.invoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due {formatDate(inv.dueDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={600} fontSize={13}>
                            {formatCurrency(inv.balanceAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip
                            label={inv.paymentStatus}
                            size="small"
                            sx={{
                              bgcolor: PAYMENT_STATUS_COLORS[inv.paymentStatus]?.bg || '#f1f5f9',
                              color: PAYMENT_STATUS_COLORS[inv.paymentStatus]?.text || '#64748b',
                              fontWeight: 700,
                              fontSize: 10,
                              height: 20,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>

        {/* Recent Orders */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: '1px solid rgba(15,23,42,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography fontWeight={700} fontSize={14} sx={{ color: '#0f172a' }}>
                Recent Orders
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => router.push('/customer/orders')}
              >
                View all
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.5 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" fontSize={13}>No orders yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((ord) => (
                      <TableRow
                        key={ord.id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => router.push('/customer/orders')}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} fontSize={13} sx={{ color: '#0f172a' }}>
                            {ord.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(ord.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontSize={12} sx={{ color: '#64748b' }}>
                            {ord.lineItems?.[0]?.storeItem?.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip
                            label={ORDER_STATUS_LABELS[ord.status] || ord.status}
                            size="small"
                            sx={{
                              bgcolor: ORDER_STATUS_COLORS[ord.status]?.bg || '#f1f5f9',
                              color: ORDER_STATUS_COLORS[ord.status]?.text || '#64748b',
                              fontWeight: 700,
                              fontSize: 10,
                              height: 20,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
