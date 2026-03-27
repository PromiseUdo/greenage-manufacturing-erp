'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Avatar,
  Alert,
  IconButton,
  Divider,
  LinearProgress,
  Stack,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Receipt,
  LocalShipping,
  AccountBalance,
  OpenInNew,
  Inventory2,
  Refresh,
  Factory,
  AssignmentReturn,
  Warning,
  CheckCircle,
  People,
  Category,
  ShowChart,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardKPIs {
  totalRevenue: number;
  totalPaidAmount: number;
  outstandingReceivables: number;
  totalOrders: number;
  activeOrders: number;
  totalQuotes: number;
  quoteConversionRate: number;
  activeProductionOrders: number;
  avgYieldRate: number | null;
  openReturns: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalUsers: number;
  totalProducts: number;
}

interface TrendPoint {
  label: string;
  revenue: number;
  invoiced: number;
}

interface PipelineItem {
  status: string;
  count: number;
}

interface CategoryItem {
  category: string;
  count: number;
  value: number;
}

interface LowStockAlert {
  id: string;
  name: string;
  partNumber: string | null;
  category: string;
  currentStock: number;
  reorderLevel: number;
  severity: 'critical' | 'warning';
}

interface TopCustomer {
  id: string;
  name: string;
  orderCount: number;
  totalRevenue: number;
  totalPaid: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  status: string;
  createdAt: string;
}

interface RecentReturn {
  id: string;
  returnNumber: string;
  customerName: string;
  productName: string;
  issueReported: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  kpis: DashboardKPIs;
  revenueTrend: TrendPoint[];
  orderPipeline: PipelineItem[];
  productionStatusBreakdown: PipelineItem[];
  returnStatusBreakdown: PipelineItem[];
  inventoryByCategory: CategoryItem[];
  lowStockAlerts: LowStockAlert[];
  topCustomers: TopCustomer[];
  recentOrders: RecentOrder[];
  recentReturns: RecentReturn[];
}

// ─── Styled Components ────────────────────────────────────────────────────────

const SectionPaper = styled(Paper)(() => ({
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}));

const SectionHeader = styled(Box)(() => ({
  padding: '14px 20px',
  borderBottom: '1px solid rgba(15,23,42,0.07)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const KpiCard = styled(Paper)<{ accentcolor?: string }>(({ accentcolor }) => ({
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'box-shadow 0.2s',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    // background: accentcolor || '#6366f1',
  },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING_PLANNING: '#94a3b8',
  IN_PRODUCTION: '#60a5fa',
  QC_TESTING: '#a78bfa',
  PACKAGING: '#fb923c',
  READY_FOR_DISPATCH: '#34d399',
  DISPATCHED: '#0ea5e9',
  DELIVERED: '#10b981',
  CANCELLED: '#f87171',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PLANNING: 'Planning',
  IN_PRODUCTION: 'Production',
  QC_TESTING: 'QC',
  PACKAGING: 'Packaging',
  READY_FOR_DISPATCH: 'Ready',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const PRODUCTION_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PLANNED: '#60a5fa',
  IN_PRODUCTION: '#f59e0b',
  QC: '#a78bfa',
  COMPLETED: '#10b981',
  CANCELLED: '#f87171',
};

const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PLANNED: 'Planned',
  IN_PRODUCTION: 'In Production',
  QC: 'QC',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const RETURN_STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#94a3b8',
  EVALUATION: '#60a5fa',
  RECOMMENDATION: '#fbbf24',
  REPAIR: '#fb923c',
  IN_TRANSIT: '#0ea5e9',
  COMPLETED: '#10b981',
  CLOSED: '#64748b',
};

const CATEGORY_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#34d399',
  '#fb923c',
  '#60a5fa',
  '#fbbf24',
];

const ORDER_STATUS_CHIP_COLORS: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
> = {
  PENDING_PLANNING: 'default',
  IN_PRODUCTION: 'primary',
  QC_TESTING: 'secondary',
  PACKAGING: 'warning',
  READY_FOR_DISPATCH: 'success',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const RETURN_STATUS_CHIP_COLORS: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
> = {
  RECEIVED: 'default',
  EVALUATION: 'primary',
  RECOMMENDATION: 'warning',
  REPAIR: 'secondary',
  IN_TRANSIT: 'info',
  COMPLETED: 'success',
  CLOSED: 'default',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <LinearProgress sx={{ borderRadius: 2 }} />
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis;

  // ── Revenue trend formatted for recharts ──
  const trendData = data?.revenueTrend ?? [];

  // ── Order pipeline — filter zero-count ──
  const pipelineData = (data?.orderPipeline ?? [])
    .filter((p) => p.count > 0)
    .map((p) => ({
      ...p,
      label: ORDER_STATUS_LABELS[p.status] ?? p.status,
      color: ORDER_STATUS_COLORS[p.status] ?? '#94a3b8',
    }));

  // ── Production donut ──
  const productionDonut = (data?.productionStatusBreakdown ?? [])
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: PRODUCTION_STATUS_LABELS[p.status] ?? p.status,
      value: p.count,
      color: PRODUCTION_STATUS_COLORS[p.status] ?? '#94a3b8',
    }));

  // ── Returns donut ──
  const returnsDonut = (data?.returnStatusBreakdown ?? [])
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.status.charAt(0) + p.status.slice(1).toLowerCase(),
      value: p.count,
      color: RETURN_STATUS_COLORS[p.status] ?? '#94a3b8',
    }));

  // ── Inventory by category ──
  const inventoryChart = (data?.inventoryByCategory ?? []).map((c, i) => ({
    name: c.category.replace(/_/g, ' '),
    value: Math.round(c.value / 1000),
    count: c.count,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          py: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: 'text.primary', letterSpacing: '-0.3px' }}
          >
            Overview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Last refreshed{' '}
            {lastRefreshed.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton
            onClick={fetchData}
            disabled={loading}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid rgba(15,23,42,0.1)',
              borderRadius: 2,
            }}
          >
            {loading ? (
              <CircularProgress size={16} />
            ) : (
              <Refresh fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── KPI Grid ────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Revenue */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#6366f1">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Total Revenue
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {formatCurrency(kpis?.totalRevenue ?? 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Paid invoices · last 12 months
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#6366f1', 0.1),
                      color: '#6366f1',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <AttachMoney fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Collected:{' '}
                    <strong style={{ color: '#10b981' }}>
                      {formatCurrency(kpis?.totalPaidAmount ?? 0)}
                    </strong>
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Outstanding */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#f59e0b">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Outstanding A/R
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {formatCurrency(kpis?.outstandingReceivables ?? 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending + overdue invoices
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#f59e0b', 0.1),
                      color: '#f59e0b',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <AccountBalance fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Total invoiced:{' '}
                    <strong>
                      {formatCurrency(
                        (kpis?.totalRevenue ?? 0) +
                          (kpis?.outstandingReceivables ?? 0),
                      )}
                    </strong>
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Active Orders */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#0ea5e9">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Active Orders
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {kpis?.activeOrders ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {kpis?.totalOrders ?? 0} total orders
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#0ea5e9', 0.1),
                      color: '#0ea5e9',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <LocalShipping fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Quote conversion:{' '}
                    <strong
                      style={{
                        color:
                          (kpis?.quoteConversionRate ?? 0 >= 50)
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    >
                      {kpis?.quoteConversionRate ?? 0}%
                    </strong>{' '}
                    ({kpis?.totalQuotes ?? 0} quotes)
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Production */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#10b981">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Active Production
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {kpis?.activeProductionOrders ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      orders in progress
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#10b981', 0.1),
                      color: '#10b981',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Factory fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Avg yield rate:{' '}
                    {kpis?.avgYieldRate !== null &&
                    kpis?.avgYieldRate !== undefined ? (
                      <strong
                        style={{
                          color:
                            kpis.avgYieldRate >= 80 ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {kpis.avgYieldRate}%
                      </strong>
                    ) : (
                      <strong>—</strong>
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Inventory Value */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#8b5cf6">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Inventory Value
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {formatCurrency(kpis?.totalInventoryValue ?? 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      raw materials on hand
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#8b5cf6', 0.1),
                      color: '#8b5cf6',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Inventory2 fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                    display: 'flex',
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#f59e0b', fontWeight: 600 }}
                  >
                    {kpis?.lowStockCount ?? 0} low
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#f87171', fontWeight: 600 }}
                  >
                    {kpis?.outOfStockCount ?? 0} out of stock
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Open Returns */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#f87171">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Open Returns
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {kpis?.openReturns ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      pending resolution
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#f87171', 0.1),
                      color: '#f87171',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <AssignmentReturn fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography
                    variant="caption"
                    onClick={() => router.push('/production/returns')}
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    View all returns →
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Total Products */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#0ea5e9">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Products
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {kpis?.totalProducts ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      active product SKUs
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#0ea5e9', 0.1),
                      color: '#0ea5e9',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Category fontSize="small" />
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    System users: <strong>{kpis?.totalUsers ?? 0}</strong>
                  </Typography>
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>

        {/* Quote Conversion */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard accentcolor="#34d399">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Quotes Pipeline
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mt: 0.5, color: '#1e293b' }}
                    >
                      {kpis?.totalQuotes ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      quotes last 12 months
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#34d399', 0.1),
                      color: '#34d399',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Receipt fontSize="small" />
                  </Avatar>
                </Box>
                <Box sx={{ mt: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Conversion rate
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#34d399"
                    >
                      {kpis?.quoteConversionRate ?? 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={kpis?.quoteConversionRate ?? 0}
                    sx={{
                      borderRadius: 4,
                      height: 6,
                      bgcolor: alpha('#34d399', 0.15),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#34d399',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </KpiCard>
        </Grid>
      </Grid>

      {/* ── Revenue Trend + Order Pipeline ─────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Revenue Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChart fontSize="small" sx={{ color: '#6366f1' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Revenue Trend
                </Typography>
                <Chip
                  label="Last 12 months"
                  size="small"
                  sx={{ fontSize: 11, height: 20 }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/sales/overview')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box
                  sx={{
                    height: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={trendData}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorInvoiced"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(15,23,42,0.06)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <ReTooltip
                      formatter={(value: number | undefined) =>
                        formatCurrency(value ?? 0)
                      }
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid rgba(15,23,42,0.1)',
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="invoiced"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorInvoiced)"
                      name="invoiced"
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      name="revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SectionPaper>
        </Grid>

        {/* Production Status Donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionPaper sx={{ height: '100%' }}>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Factory fontSize="small" sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Production Orders
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/production/orders')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              ) : productionDonut.length === 0 ? (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No production orders yet
                  </Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={productionDonut}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {productionDonut.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                        formatter={(
                          value: number | undefined,
                          name: string | undefined,
                        ) => [value || 0, name || '']}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {productionDonut.map((entry, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: entry.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {entry.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700}>
                          {entry.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          </SectionPaper>
        </Grid>
      </Grid>

      {/* ── Order Pipeline + Inventory by Category ──────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Order Pipeline */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping fontSize="small" sx={{ color: '#0ea5e9' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Order Pipeline
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/sales/orders')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box
                  sx={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              ) : pipelineData.length === 0 ? (
                <Box
                  sx={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No orders found
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={pipelineData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(15,23,42,0.06)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <ReTooltip
                      formatter={(v: number | undefined) => [v, 'Orders']}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {pipelineData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SectionPaper>
        </Grid>

        {/* Inventory by Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory2 fontSize="small" sx={{ color: '#8b5cf6' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Inventory Value by Category
                </Typography>
                <Chip
                  label="₦K"
                  size="small"
                  sx={{ fontSize: 11, height: 20 }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/inventory')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <Box
                  sx={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              ) : inventoryChart.length === 0 ? (
                <Box
                  sx={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No inventory data
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={inventoryChart}
                    margin={{ top: 0, right: 8, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(15,23,42,0.06)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReTooltip
                      formatter={(v: number | undefined) => [`₦${v}K`, 'Value']}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {inventoryChart.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SectionPaper>
        </Grid>
      </Grid>

      {/* ── Recent Orders + Top Customers ───────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt fontSize="small" sx={{ color: '#0ea5e9' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Recent Orders
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/sales/orders')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          bgcolor: 'rgba(15,23,42,0.02)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '& td': { py: 1.25, fontSize: 13 },
                        }}
                        onClick={() => router.push(`/sales/orders/${order.id}`)}
                      >
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#6366f1',
                            }}
                          >
                            {order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {order.customerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 150 }}
                          >
                            {order.productName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              ORDER_STATUS_LABELS[order.status] ?? order.status
                            }
                            color={
                              ORDER_STATUS_CHIP_COLORS[order.status] ??
                              'default'
                            }
                            size="small"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={formatDate(order.createdAt)}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {timeAgo(order.createdAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.recentOrders.length && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{ py: 4, color: 'text.secondary' }}
                        >
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionPaper>
        </Grid>

        {/* Top Customers */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People fontSize="small" sx={{ color: '#34d399' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Top Customers
                </Typography>
                <Chip
                  label="by revenue · 12m"
                  size="small"
                  sx={{ fontSize: 11, height: 20 }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/customers')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                {data?.topCustomers.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', py: 3 }}
                  >
                    No customer data yet
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {data?.topCustomers.map((c, idx) => {
                      const collectionRate =
                        c.totalRevenue > 0
                          ? Math.round((c.totalPaid / c.totalRevenue) * 100)
                          : 0;
                      return (
                        <Box key={c.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor:
                                  CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                              }}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                >
                                  {c.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontWeight={700}
                                  color="#6366f1"
                                >
                                  {formatCurrency(c.totalRevenue)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 0.25,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {c.orderCount} orders
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {collectionRate}% collected
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={collectionRate}
                                sx={{
                                  mt: 0.5,
                                  borderRadius: 4,
                                  height: 4,
                                  bgcolor: alpha(
                                    CATEGORY_COLORS[
                                      idx % CATEGORY_COLORS.length
                                    ],
                                    0.15,
                                  ),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor:
                                      CATEGORY_COLORS[
                                        idx % CATEGORY_COLORS.length
                                      ],
                                    borderRadius: 4,
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                          {idx < (data?.topCustomers.length ?? 0) - 1 && (
                            <Divider sx={{ mt: 1.5, opacity: 0.5 }} />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </SectionPaper>
        </Grid>
      </Grid>

      {/* ── Low Stock Alerts + Recent Returns ───────────────────────────── */}
      <Grid container spacing={2}>
        {/* Low Stock Alerts */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning fontSize="small" sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Stock Alerts
                </Typography>
                {(data?.kpis.outOfStockCount ?? 0) > 0 && (
                  <Chip
                    label={`${data?.kpis.outOfStockCount} critical`}
                    color="error"
                    size="small"
                    sx={{ fontSize: 11, height: 20 }}
                  />
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/inventory/materials')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          bgcolor: 'rgba(15,23,42,0.02)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>Material</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Reorder</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.lowStockAlerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        sx={{
                          '& td': { py: 1.25, fontSize: 13 },
                          bgcolor:
                            alert.severity === 'critical'
                              ? alpha('#f87171', 0.04)
                              : 'transparent',
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            noWrap
                            sx={{ maxWidth: 160 }}
                          >
                            {alert.name}
                          </Typography>
                          {alert.partNumber && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {alert.partNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {alert.category.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color:
                                alert.severity === 'critical'
                                  ? '#f87171'
                                  : '#f59e0b',
                            }}
                          >
                            {alert.currentStock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {alert.reorderLevel}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {alert.severity === 'critical' ? (
                            <Chip
                              label="Out of Stock"
                              color="error"
                              size="small"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          ) : (
                            <Chip
                              label="Low Stock"
                              color="warning"
                              size="small"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.lowStockAlerts.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CheckCircle
                              sx={{ color: '#10b981', fontSize: 28 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              All materials are well stocked
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionPaper>
        </Grid>

        {/* Recent Returns */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionPaper>
            <SectionHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentReturn fontSize="small" sx={{ color: '#f87171' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Recent Returns
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => router.push('/production/returns')}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </SectionHeader>
            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          bgcolor: 'rgba(15,23,42,0.02)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>Return #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.recentReturns.map((ret) => (
                      <TableRow
                        key={ret.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '& td': { py: 1.25, fontSize: 13 },
                        }}
                        onClick={() =>
                          router.push(`/production/returns/${ret.id}`)
                        }
                      >
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#f87171',
                            }}
                          >
                            {ret.returnNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {ret.customerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={ret.issueReported}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 130 }}
                            >
                              {ret.productName}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              ret.status.charAt(0) +
                              ret.status.slice(1).toLowerCase()
                            }
                            color={
                              RETURN_STATUS_CHIP_COLORS[ret.status] ?? 'default'
                            }
                            size="small"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={formatDate(ret.createdAt)}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {timeAgo(ret.createdAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.recentReturns.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CheckCircle
                              sx={{ color: '#10b981', fontSize: 28 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              No returns on record
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionPaper>
        </Grid>
      </Grid>
    </Box>
  );
}
