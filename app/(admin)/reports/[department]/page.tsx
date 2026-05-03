'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  ArrowBack,
  FileDownload,
  Refresh,
  ShoppingCart,
  PrecisionManufacturing,
  Inventory2,
  AccountBalance,
  VerifiedUser,
  LocalShipping,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  AttachMoney,
  Receipt,
  Factory,
  RequestQuote,
  CheckCircleOutline,
  Cancel,
  Remove,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Rectangle,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period =
  | 'daily'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'yearly'
  | 'alltime';

interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'biannual', label: 'Bi-Annual' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'alltime', label: 'All Time' },
];

const CHART_COLORS = [
  '#2196F3',
  '#4CAF50',
  '#FF9800',
  '#F44336',
  '#9C27B0',
  '#00BCD4',
  '#8BC34A',
  '#FF5722',
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function pct(n: string | number): string {
  return `${n}%`;
}

function fmtDateTime(dt: string | null | undefined): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Recharts Pie label — props.name = nameKey value, works for all Pie charts
const pieLabel = (props: any) =>
  `${String(props.name || '').replace(/_/g, ' ')} ${((props.percent || 0) * 100).toFixed(0)}%`;

// ─── Department meta ──────────────────────────────────────────────────────────

const DEPT_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  sales: {
    label: 'Sales',
    color: '#2196F3',
    icon: <ShoppingCart />,
  },
  production: {
    label: 'Production',
    color: '#FF9800',
    icon: <PrecisionManufacturing />,
  },
  inventory: {
    label: 'Inventory',
    color: '#4CAF50',
    icon: <Inventory2 />,
  },
  finance: {
    label: 'Finance',
    color: '#9C27B0',
    icon: <AccountBalance />,
  },
  'quality-control': {
    label: 'Quality Control',
    color: '#00BCD4',
    icon: <VerifiedUser />,
  },
  dispatch: {
    label: 'Dispatch & Logistics',
    color: '#F44336',
    icon: <LocalShipping />,
  },
  procurement: {
    label: 'Procurement',
    color: '#5C6BC0',
    icon: <RequestQuote />,
  },
};

// ─── Styled components ────────────────────────────────────────────────────────

const KpiPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  elevation: 0,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& th': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    fontWeight: 700,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.text.secondary,
  },
}));

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ card }: { card: KpiCard }) {
  return (
    <KpiPaper elevation={0}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(card.color, 0.12),
            color: card.color,
            '& svg': { fontSize: 22 },
          }}
        >
          {card.icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {card.label}
        </Typography>
      </Stack>
      <Typography variant="h5" fontWeight={800} color="text.primary">
        {card.value}
      </Typography>
      {card.sub && (
        <Typography variant="caption" color="text.secondary">
          {card.sub}
        </Typography>
      )}
    </KpiPaper>
  );
}

// ─── Chart section wrapper ────────────────────────────────────────────────────

function ChartBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        height: '100%',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

// ─── Department-specific renderers ────────────────────────────────────────────

function SalesReport({ data }: { data: any }) {
  const kpis: KpiCard[] = [
    {
      label: 'Order Count',
      value: data.totalOrders,
      icon: <ShoppingCart />,
      color: '#2196F3',
    },
    {
      label: 'Sales Volume',
      value: (data.salesVolume ?? 0).toLocaleString(),
      icon: <Inventory2 />,
      color: '#00BCD4',
      sub: 'Total units sold',
    },
    {
      label: 'Net Sales',
      value: fmt(data.totalRevenue),
      icon: <AttachMoney />,
      color: '#4CAF50',
    },
    {
      label: 'Amount Collected',
      value: fmt(data.totalCollected),
      icon: <CheckCircle />,
      color: '#4CAF50',
      sub: `Outstanding: ${fmt(data.totalOutstanding)}`,
    },
    {
      label: 'Avg Order Value',
      value: fmt(data.avgOrderValue ?? 0),
      icon: <TrendingUp />,
      color: '#2196F3',
      sub: 'Net Sales ÷ Orders',
    },
    {
      label: 'Conversion Rate',
      value: pct(data.conversionRate),
      icon: <TrendingUp />,
      color: '#FF9800',
      sub: `${data.totalQuotes} quotes raised`,
    },
  ];

  // Revenue summary for comparison chart
  const revenueSummary = [
    { label: 'Revenue', value: data.totalRevenue },
    { label: 'Collected', value: data.totalCollected },
    { label: 'Outstanding', value: data.totalOutstanding },
  ];

  return (
    <>
      {/* KPI row */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row 1 */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Orders by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.ordersByStatus} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Orders']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar dataKey="count" fill="#2196F3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Quote Funnel by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.quotesByStatus ?? []} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Quotes']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={CHART_COLORS[props.index % CHART_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* Charts row 2 */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Revenue vs Collected vs Outstanding">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={revenueSummary}
                layout="vertical"
                margin={{ left: 16, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <ReTooltip formatter={(v: any) => [fmt(v), '']} />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={36}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        (['#4CAF50', '#2196F3', '#FF9800'] as const)[
                          props.index
                        ] ?? '#9E9E9E'
                      }
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Invoice Payment Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={(data.paymentStatuses ?? []).map(
                    (s: any, i: number) => ({
                      ...s,
                      fill: CHART_COLORS[i % CHART_COLORS.length],
                    }),
                  )}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'Invoices']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* Top customers table */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Top Customers by Revenue
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Total Revenue</TableCell>
                <TableCell align="right">Collected</TableCell>
                <TableCell align="right">Outstanding</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {data.topCustomers.map((c: any, i: number) => {
                const outstanding = (c.revenue ?? 0) - (c.collected ?? 0);
                return (
                  <TableRow key={i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={c.orders}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: '#4CAF50' }}
                    >
                      {fmt(c.revenue ?? 0)}
                    </TableCell>
                    <TableCell align="right">{fmt(c.collected ?? 0)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: outstanding > 0 ? '#FF9800' : 'inherit' }}
                    >
                      {fmt(outstanding)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.topCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No data for this period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Sales-order detail table ────────────────────────────────────────── */}
      <SalesOrderDetailTable orders={data.orderDetails ?? []} />
    </>
  );
}

// ─── Sales-order detail table ─────────────────────────────────────────────────

function SalesOrderDetailTable({ orders }: { orders: any[] }) {
  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Sales-Order Detail
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Individual orders for the selected period — discount and net sales from linked invoice
        </Typography>
      </Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <StyledTableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Discount</TableCell>
              <TableCell align="right">Net Sales</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {orders.map((o: any, i: number) => (
              <TableRow key={i} hover>
                {/* Date */}
                <TableCell
                  sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {fmtDateTime(o.date)}
                </TableCell>

                {/* Order ID */}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    color: '#2196F3',
                  }}
                >
                  {o.orderNumber}
                </TableCell>

                {/* Customer */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  {o.customer}
                </TableCell>

                {/* Product */}
                <TableCell sx={{ fontSize: '0.82rem' }}>
                  {o.itemCount > 1 ? (
                    <Chip
                      label={o.product}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.72rem', height: 20 }}
                    />
                  ) : (
                    o.product
                  )}
                </TableCell>

                {/* Qty */}
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {o.qty > 0 ? o.qty.toLocaleString() : '—'}
                </TableCell>

                {/* Unit Price */}
                <TableCell
                  align="right"
                  sx={{ color: 'text.secondary', fontSize: '0.82rem' }}
                >
                  {o.unitPrice != null ? fmt(o.unitPrice) : '—'}
                </TableCell>

                {/* Discount */}
                <TableCell
                  align="right"
                  sx={{
                    fontSize: '0.82rem',
                    color: o.discount > 0 ? '#FF9800' : 'text.disabled',
                    fontWeight: o.discount > 0 ? 600 : 400,
                  }}
                >
                  {o.discount > 0 ? `−${fmt(o.discount)}` : '—'}
                </TableCell>

                {/* Net Sales */}
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: '#4CAF50' }}
                >
                  {fmt(o.netSales ?? 0)}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders for this period
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// ─── Yield rate badge ─────────────────────────────────────────────────────────

function YieldBadge({ rate }: { rate: number | null }) {
  if (rate === null)
    return (
      <Typography variant="body2" color="text.disabled">
        N/A
      </Typography>
    );
  const color = rate >= 90 ? '#4CAF50' : rate >= 70 ? '#FF9800' : '#F44336';
  return (
    <Chip
      label={`${rate}%`}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.12),
        color,
        fontWeight: 700,
        fontSize: '0.78rem',
      }}
    />
  );
}

function ProductionReport({ data }: { data: any }) {
  const kpis: KpiCard[] = [
    {
      label: 'Production Orders',
      value: data.totalOrders,
      icon: <Factory />,
      color: '#FF9800',
    },
    {
      label: 'Units Started',
      value: data.totalStarted ?? data.totalUnits,
      icon: <PrecisionManufacturing />,
      color: '#2196F3',
      sub: `${data.totalUnits} total tracked units`,
    },
    {
      label: 'Units Packaged',
      value: data.totalPackaged ?? 0,
      icon: <CheckCircle />,
      color: '#4CAF50',
    },
    {
      label: 'Units Rejected',
      value: data.totalRejected ?? 0,
      icon: <TrendingDown />,
      color: '#F44336',
    },
    {
      label: 'Avg Yield Rate',
      value: data.avgYieldRate !== null ? pct(data.avgYieldRate) : 'N/A',
      icon: <TrendingUp />,
      color:
        data.avgYieldRate >= 90
          ? '#4CAF50'
          : data.avgYieldRate >= 70
            ? '#FF9800'
            : '#F44336',
      sub: 'Passed ÷ Started',
    },
    {
      label: 'Reworks',
      value: data.reworkCount,
      icon: <Warning />,
      color: '#FF9800',
      sub:
        data.reworkRate !== null
          ? `${data.reworkRate}% rework rate`
          : undefined,
    },
  ];

  // QC outcome colour map
  const QC_COLOR: Record<string, string> = {
    PASS: '#4CAF50',
    FAIL: '#F44336',
    PARTIAL: '#FF9800',
    REWORK: '#9C27B0',
  };

  // Stage status colour map
  const STAGE_COLOR: Record<string, string> = {
    NOT_STARTED: '#9E9E9E',
    IN_PROGRESS: '#2196F3',
    COMPLETED: '#4CAF50',
  };

  const hasFailCategories =
    Array.isArray(data.failCategories) && data.failCategories.length > 0;

  return (
    <>
      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 1: Throughput funnel + Orders by status ──────────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Production Throughput Funnel">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.throughput ?? []}
                margin={{ top: 4, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip formatter={(v: any) => [v, 'Units']} />
                <Bar
                  dataKey="count"
                  maxBarSize={60}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        (['#2196F3', '#4CAF50', '#FF9800', '#F44336'] as const)[
                          props.index
                        ] ?? '#2196F3'
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Orders by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.ordersByStatus}
                layout="vertical"
                margin={{ left: 80, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <ReTooltip
                  formatter={(v: any) => [v, 'Orders']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar dataKey="count" fill="#FF9800" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Row 2: QC outcomes + Stage activity + Unit status ────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="QC Checkpoint Outcomes">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(data.qcOutcomes ?? []).map((e: any, i: number) => ({
                    ...e,
                    fill:
                      QC_COLOR[e.outcome] ??
                      CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  dataKey="count"
                  nameKey="outcome"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'Checkpoints']} />
                <Legend formatter={(v) => v.replace(/_/g, ' ')} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="Stage Activity Breakdown">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.stageActivity ?? []} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Stages']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        STAGE_COLOR[props.status] ??
                        CHART_COLORS[props.index % CHART_COLORS.length]
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="Unit Status Breakdown">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(data.unitsByStatus ?? []).map((s: any, i: number) => ({
                    ...s,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'Units']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Failure categories (only shown when data exists) ─────────────────── */}
      {hasFailCategories && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            mb: 3,
          }}
        >
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              QC Failure Categories
            </Typography>
          </Box>
          <Box sx={{ px: 2.5, pb: 2 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={data.failCategories}
                layout="vertical"
                margin={{ left: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <ReTooltip
                  formatter={(v: any) => [v, 'Failures']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar dataKey="count" fill="#F44336" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* ── Top products table ──────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Top Products in Production
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Started</TableCell>
                <TableCell align="right">Packaged</TableCell>
                <TableCell align="right">Rejected</TableCell>
                <TableCell align="right">Yield Rate</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {data.productionByProduct.map((p: any, i: number) => (
                <TableRow key={i} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell align="right">{p.orders}</TableCell>
                  <TableCell align="right">{p.started}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#4CAF50', fontWeight: 600 }}
                  >
                    {p.packaged}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: p.rejected > 0 ? '#F44336' : 'inherit' }}
                  >
                    {p.rejected}
                  </TableCell>
                  <TableCell align="right">
                    <YieldBadge rate={p.yieldRate} />
                  </TableCell>
                </TableRow>
              ))}
              {data.productionByProduct.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No data for this period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Work-order detail table ─────────────────────────────────────────── */}
      <WorkOrderDetailTable orders={data.workOrderDetails ?? []} />
    </>
  );
}

// ─── Procurement Report ───────────────────────────────────────────────────────

function ProcurementReport({ data }: { data: any }) {
  const PROCUREMENT_COLOR = '#5C6BC0';

  const kpis: KpiCard[] = [
    {
      label: 'Total PO Value',
      value: fmt(data.totalSpend ?? 0),
      icon: <RequestQuote />,
      color: PROCUREMENT_COLOR,
      sub: `${fmt(data.totalPaid ?? 0)} paid · ${fmt(data.totalOutstanding ?? 0)} outstanding`,
    },
    {
      label: 'PO Count',
      value: data.totalPOs ?? 0,
      icon: <Receipt />,
      color: '#2196F3',
      sub: 'Orders in period',
    },
    {
      label: 'Avg Cost / Unit',
      value: data.avgCostPerUnit != null ? fmt(data.avgCostPerUnit) : 'N/A',
      icon: <AttachMoney />,
      color: '#4CAF50',
      sub: 'Weighted across all line items',
    },
    {
      label: 'Avg Lead Time',
      value: data.avgLeadTime != null ? `${data.avgLeadTime} days` : 'N/A',
      icon: <TrendingUp />,
      color: '#FF9800',
      sub: 'Order → receipt (completed POs)',
    },
    {
      label: 'On-Time Delivery',
      value: data.onTimeRate != null ? pct(data.onTimeRate) : 'N/A',
      icon: <CheckCircle />,
      color:
        data.onTimeRate == null
          ? '#9E9E9E'
          : data.onTimeRate >= 90
            ? '#4CAF50'
            : data.onTimeRate >= 70
              ? '#FF9800'
              : '#F44336',
      sub:
        data.deliveredCount > 0
          ? `${data.onTimeCount} of ${data.deliveredCount} deliveries`
          : 'No deliveries yet',
    },
  ];

  const hasMonthlyTrend =
    Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 1;

  return (
    <>
      {/* ── KPI row ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 1: PO Value by Status + Monthly Volume Trend ─────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="PO Value by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.poByStatus ?? []}
                layout="vertical"
                margin={{ left: 100, right: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <ReTooltip
                  formatter={(v: any) => [fmt(v), 'Value']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="amount"
                  radius={[0, 4, 4, 0]}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={CHART_COLORS[props.index % CHART_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="PO Count by Status">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(data.poByStatus ?? []).map((s: any, i: number) => ({
                    ...s,
                    name: s.status,
                    value: s.count,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip
                  formatter={(v: any) => [v, 'POs']}
                  labelFormatter={(l) => String(l).replace(/_/g, ' ')}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <ChartBox title="On-Time Delivery">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={
                    data.deliveredCount > 0
                      ? [
                          {
                            name: 'On Time',
                            value: data.onTimeCount ?? 0,
                            fill: '#4CAF50',
                          },
                          {
                            name: 'Late',
                            value:
                              (data.deliveredCount ?? 0) -
                              (data.onTimeCount ?? 0),
                            fill: '#F44336',
                          },
                        ]
                      : [{ name: 'No data', value: 1, fill: '#E0E0E0' }]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'Deliveries']} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Row 2: Top Suppliers + Monthly Trend ─────────────────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: hasMonthlyTrend ? 7 : 12 }}>
          <ChartBox title="Top Suppliers by Spend">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.topSuppliers ?? []}
                layout="vertical"
                margin={{ left: 120, right: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={110}
                />
                <ReTooltip formatter={(v: any) => [fmt(v), 'Spend']} />
                <Bar dataKey="spend" fill={PROCUREMENT_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        {hasMonthlyTrend && (
          <Grid size={{ xs: 12, md: 5 }}>
            <ChartBox title="Monthly PO Volume">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={data.monthlyTrend}
                  margin={{ top: 4, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ReTooltip formatter={(v: any) => [v, 'POs']} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={PROCUREMENT_COLOR}
                    fill={`${PROCUREMENT_COLOR}22`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
          </Grid>
        )}
      </Grid>

      {/* ── Supplier performance table ────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Supplier Performance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Spend, PO count and on-time rate per supplier for the selected period
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">POs</TableCell>
                <TableCell align="right">Total Spend</TableCell>
                <TableCell align="right">On-Time Rate</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {(data.topSuppliers ?? []).map((s: any, i: number) => {
                const rate: number | null = s.onTimeRate;
                const rateColor =
                  rate == null
                    ? '#9E9E9E'
                    : rate >= 90
                      ? '#2E7D32'
                      : rate >= 70
                        ? '#E65100'
                        : '#B71C1C';
                return (
                  <TableRow key={i} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={s.poCount}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: PROCUREMENT_COLOR }}>
                      {fmt(s.spend)}
                    </TableCell>
                    <TableCell align="right">
                      {rate != null ? (
                        <Chip
                          label={`${rate}%`}
                          size="small"
                          sx={{
                            bgcolor: `${rateColor}18`,
                            color: rateColor,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(data.topSuppliers ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No supplier data for this period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Purchase-order detail table ───────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Purchase-Order Detail
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Line-level breakdown of every PO in the selected period
          </Typography>
        </Box>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <StyledTableHead>
              <TableRow>
                <TableCell>PO ID</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Cost</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell align="right">Lead Time</TableCell>
                <TableCell align="center">On-Time</TableCell>
                <TableCell align="right">Cost Variance</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {(data.poDetails ?? []).map((po: any, i: number) => (
                <TableRow key={i} hover>
                  {/* PO ID */}
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      color: PROCUREMENT_COLOR,
                    }}
                  >
                    {po.poNumber}
                  </TableCell>

                  {/* Supplier */}
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    {po.supplier}
                  </TableCell>

                  {/* Item */}
                  <TableCell sx={{ fontSize: '0.82rem' }}>
                    {po.itemCount > 1 ? (
                      <Chip
                        label={po.item}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', height: 20 }}
                      />
                    ) : (
                      po.item
                    )}
                  </TableCell>

                  {/* Qty */}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {po.qty > 0 ? po.qty.toLocaleString() : '—'}
                  </TableCell>

                  {/* Unit Cost */}
                  <TableCell
                    align="right"
                    sx={{ color: 'text.secondary', fontSize: '0.82rem' }}
                  >
                    {po.unitCost != null ? fmt(po.unitCost) : '—'}
                  </TableCell>

                  {/* Total Cost */}
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: PROCUREMENT_COLOR }}
                  >
                    {fmt(po.totalCost)}
                  </TableCell>

                  {/* Order Date */}
                  <TableCell
                    sx={{
                      fontSize: '0.78rem',
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtDateTime(po.orderDate)}
                  </TableCell>

                  {/* Delivery Date */}
                  <TableCell
                    sx={{
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      color: po.deliveryDate ? '#2E7D32' : 'text.disabled',
                    }}
                  >
                    {po.deliveryDate ? fmtDateTime(po.deliveryDate) : 'Pending'}
                  </TableCell>

                  {/* Lead Time */}
                  <TableCell
                    align="right"
                    sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  >
                    {po.leadTime != null ? (
                      <Chip
                        label={`${po.leadTime}d`}
                        size="small"
                        sx={{
                          bgcolor:
                            po.leadTime <= 7
                              ? '#E8F5E9'
                              : po.leadTime <= 21
                                ? '#FFF3E0'
                                : '#FFEBEE',
                          color:
                            po.leadTime <= 7
                              ? '#2E7D32'
                              : po.leadTime <= 21
                                ? '#E65100'
                                : '#B71C1C',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          height: 22,
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>

                  {/* On-Time */}
                  <TableCell align="center">
                    {po.onTime === true ? (
                      <CheckCircleOutline
                        sx={{ fontSize: 18, color: '#4CAF50' }}
                      />
                    ) : po.onTime === false ? (
                      <Cancel sx={{ fontSize: 18, color: '#F44336' }} />
                    ) : (
                      <Remove sx={{ fontSize: 18, color: '#BDBDBD' }} />
                    )}
                  </TableCell>

                  {/* Cost Variance */}
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color:
                        po.costVariance === 0
                          ? '#4CAF50'
                          : po.costVariance > 0
                            ? '#FF9800'
                            : '#F44336',
                    }}
                  >
                    {po.costVariance === 0
                      ? '✓ Settled'
                      : fmt(po.costVariance)}
                  </TableCell>
                </TableRow>
              ))}
              {(data.poDetails ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No purchase orders for this period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

// ─── Status chip colour map ───────────────────────────────────────────────────

const ORDER_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  DRAFT:               { bg: '#F5F5F5', text: '#757575' },
  IN_PROGRESS:         { bg: '#E3F2FD', text: '#1565C0' },
  ON_HOLD:             { bg: '#FFF3E0', text: '#E65100' },
  PARTIALLY_COMPLETED: { bg: '#F3E5F5', text: '#6A1B9A' },
  COMPLETED:           { bg: '#E8F5E9', text: '#2E7D32' },
  CANCELLED:           { bg: '#FFEBEE', text: '#B71C1C' },
};

function StatusChip({ status }: { status: string }) {
  const c = ORDER_STATUS_COLOR[status] ?? { bg: '#F5F5F5', text: '#616161' };
  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.text,
        fontWeight: 700,
        fontSize: '0.72rem',
        height: 22,
        borderRadius: 1,
      }}
    />
  );
}

function WorkOrderDetailTable({ orders }: { orders: any[] }) {
  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Work-Order Detail
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Individual production orders for the selected period
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <StyledTableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Volume</TableCell>
              <TableCell>Current Stage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Completion</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {orders.map((o: any, i: number) => (
              <TableRow key={i} hover>
                <TableCell
                  sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}
                >
                  {o.orderNumber}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{o.product}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={o.volume}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        o.currentStage === '—' ? 'text.disabled' : 'text.primary',
                      fontSize: '0.82rem',
                    }}
                  >
                    {o.currentStage}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={o.status} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {fmtDateTime(o.startedAt)}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                    color: o.completedAt ? '#2E7D32' : 'text.disabled',
                  }}
                >
                  {fmtDateTime(o.completedAt)}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No production orders for this period
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function InventoryReport({ data }: { data: any }) {
  const kpis: KpiCard[] = [
    {
      label: 'Total Materials',
      value: data.totalMaterials,
      icon: <Inventory2 />,
      color: '#4CAF50',
    },
    {
      label: 'Healthy Stock',
      value: data.healthyCount ?? 0,
      icon: <CheckCircle />,
      color: '#4CAF50',
      sub: 'Above reorder level',
    },
    {
      label: 'Low Stock',
      value: data.lowStockCount,
      icon: <Warning />,
      color: '#FF9800',
      sub: 'At or below reorder level',
    },
    {
      label: 'Out of Stock',
      value: data.outOfStockCount,
      icon: <TrendingDown />,
      color: '#F44336',
    },
    {
      label: 'Inventory Value',
      value: fmt(data.totalInventoryValue),
      icon: <AttachMoney />,
      color: '#4CAF50',
    },
    {
      label: 'GRN Receipts',
      value: data.grnCount ?? 0,
      icon: <Receipt />,
      color: '#2196F3',
      sub: `${data.issuanceCount} issuances`,
    },
  ];

  // ── Derived data ──────────────────────────────────────────────────────────

  // Stock health donut colour map
  const HEALTH_COLOR: Record<string, string> = {
    Healthy: '#4CAF50',
    'Low Stock': '#FF9800',
    'Out of Stock': '#F44336',
  };

  // PO spend comparison
  const poComparison = [
    { label: 'Total Spend', value: data.totalPOSpend ?? 0 },
    { label: 'Amount Paid', value: data.totalPOPaid ?? 0 },
    { label: 'Outstanding', value: data.totalPOOutstanding ?? 0 },
  ];

  const hasTopConsumed =
    Array.isArray(data.topConsumed) && data.topConsumed.length > 0;
  const hasTopSuppliers =
    Array.isArray(data.topSuppliers) && data.topSuppliers.length > 0;

  return (
    <>
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 1: Stock health donut + Value by category ───────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="Stock Health Overview">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(data.stockHealth ?? []).map((s: any, i: number) => ({
                    ...s,
                    fill:
                      HEALTH_COLOR[s.status] ??
                      CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={95}
                  labelLine={false}
                  label={(props: any) => {
                    if ((props.percent ?? 0) < 0.04) return null;
                    const RADIAN = Math.PI / 180;
                    const r =
                      props.innerRadius +
                      (props.outerRadius - props.innerRadius) * 0.55;
                    const x = props.cx + r * Math.cos(-props.midAngle * RADIAN);
                    const y = props.cy + r * Math.sin(-props.midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight={700}
                      >
                        {`${((props.percent ?? 0) * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                />
                <ReTooltip
                  formatter={
                    ((v: any, name: string) => [v, `${name} materials`]) as any
                  }
                />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ChartBox title="Inventory Value by Category">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.valueByCategory ?? []}
                layout="vertical"
                margin={{ left: 120, right: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <ReTooltip
                  formatter={(v: any) => [fmt(v as number), 'Value']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={CHART_COLORS[props.index % CHART_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Row 2: PO spend comparison + PO by status ───────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Purchase Order Spend Summary">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={poComparison}
                layout="vertical"
                margin={{ left: 16, right: 56 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <ReTooltip formatter={(v: any) => [fmt(v as number), '']} />
                <Bar
                  dataKey="value"
                  maxBarSize={36}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        (['#9C27B0', '#4CAF50', '#FF9800'] as const)[
                          props.index
                        ] ?? '#9C27B0'
                      }
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Purchase Orders by Status">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.poByStatus ?? []} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Orders']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar dataKey="count" fill="#9C27B0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Top suppliers + Top consumed (conditional) ───────────────────── */}
      {(hasTopSuppliers || hasTopConsumed) && (
        <Grid container spacing={3} mb={3}>
          {hasTopSuppliers && (
            <Grid size={{ xs: 12, md: hasTopConsumed ? 6 : 12 }}>
              <ChartBox title="Top Suppliers by PO Spend">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.topSuppliers}
                    layout="vertical"
                    margin={{ left: 100, right: 56 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}M`
                          : v >= 1_000
                            ? `${(v / 1_000).toFixed(0)}K`
                            : String(v)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      width={96}
                    />
                    <ReTooltip
                      formatter={(v: any) => [fmt(v as number), 'Spend']}
                    />
                    <Bar dataKey="spend" fill="#2196F3" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </Grid>
          )}

          {hasTopConsumed && (
            <Grid size={{ xs: 12, md: hasTopSuppliers ? 6 : 12 }}>
              <ChartBox title="Top Consumed Materials (by Qty Issued)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.topConsumed}
                    layout="vertical"
                    margin={{ left: 100, right: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      width={96}
                    />
                    <ReTooltip
                      formatter={
                        ((v: any, name: string) => [
                          v,
                          name === 'quantityIssued'
                            ? 'Qty Issued'
                            : 'Issuances',
                        ]) as any
                      }
                    />
                    <Bar
                      dataKey="quantityIssued"
                      fill="#FF9800"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Low stock / out of stock table ──────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Stock Alert — Critical Items
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sorted by severity (out-of-stock first, then lowest stock %)
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Unit</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Reorder At</TableCell>
                <TableCell align="center">Stock Level</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {data.lowStockItems.map((m: any, i: number) => {
                const isOut = m.currentStock === 0;
                const pct = m.stockPct ?? 0;
                const barColor = isOut
                  ? '#F44336'
                  : pct <= 25
                    ? '#F44336'
                    : pct <= 60
                      ? '#FF9800'
                      : '#4CAF50';
                return (
                  <TableRow key={i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{m.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.category?.replace(/_/g, ' ') ?? '—'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.68rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {m.unit || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: isOut ? '#F44336' : '#FF9800',
                      }}
                    >
                      {isOut ? (
                        <Chip label="OUT" size="small" color="error" />
                      ) : (
                        m.currentStock
                      )}
                    </TableCell>
                    <TableCell align="right">{m.reorderLevel}</TableCell>
                    <TableCell align="center" sx={{ minWidth: 110 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#f0f0f0',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${Math.min(pct, 100)}%`,
                              height: '100%',
                              bgcolor: barColor,
                              borderRadius: 3,
                              transition: 'width 0.3s',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            minWidth: 30,
                            color: barColor,
                            fontWeight: 700,
                          }}
                        >
                          {pct}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {m.unitCost > 0 ? (
                        <Typography variant="body2">
                          {fmt(m.unitCost)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.lowStockItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CheckCircle
                      sx={{ color: '#4CAF50', mb: 1, fontSize: 32 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      All materials are adequately stocked
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Top suppliers detail table ───────────────────────────────────── */}
      {hasTopSuppliers && (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Top Suppliers by PO Spend
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <StyledTableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">POs</TableCell>
                  <TableCell align="right">Total Spend</TableCell>
                  <TableCell align="right">Amount Paid</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {data.topSuppliers.map((s: any, i: number) => {
                  const outstanding = (s.spend ?? 0) - (s.paid ?? 0);
                  return (
                    <TableRow key={i} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={s.poCount}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: '#9C27B0' }}
                      >
                        {fmt(s.spend ?? 0)}
                      </TableCell>
                      <TableCell align="right">{fmt(s.paid ?? 0)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: outstanding > 0 ? '#FF9800' : 'inherit' }}
                      >
                        {fmt(outstanding)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}

function FinanceReport({ data }: { data: any }) {
  const collectionRate = Number(data.collectionRate ?? 0);

  const kpis: KpiCard[] = [
    {
      label: 'Total Invoiced',
      value: fmt(data.totalInvoiced),
      icon: <Receipt />,
      color: '#9C27B0',
      sub: `${data.totalInvoiceCount ?? 0} invoices`,
    },
    {
      label: 'Total Collected',
      value: fmt(data.totalCollected),
      icon: <CheckCircle />,
      color: '#4CAF50',
    },
    {
      label: 'Outstanding (AR)',
      value: fmt(data.totalOutstanding),
      icon: <Warning />,
      color: '#FF9800',
    },
    {
      label: 'Collection Rate',
      value: pct(data.collectionRate),
      icon: <TrendingUp />,
      color:
        collectionRate >= 80
          ? '#4CAF50'
          : collectionRate >= 50
            ? '#FF9800'
            : '#F44336',
      sub: `Avg invoice: ${fmt(data.avgInvoiceValue ?? 0)}`,
    },
    {
      label: 'PO Spend',
      value: fmt(data.totalPurchaseSpend),
      icon: <AttachMoney />,
      color: '#F44336',
      sub: `Outstanding: ${fmt(data.totalPurchaseOutstanding ?? 0)}`,
    },
    {
      label: 'Tax / Discounts',
      value: fmt(data.totalTax),
      icon: <AccountBalance />,
      color: '#00BCD4',
      sub: `Discounts given: ${fmt(data.totalDiscount)}`,
    },
  ];

  const hasMonthlyTrend =
    Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 1;
  const hasTopDebtors =
    Array.isArray(data.topDebtors) && data.topDebtors.length > 0;

  // Ageing severity colours
  const AGING_COLOR = ['#4CAF50', '#FF9800', '#F44336', '#B71C1C'];

  const margin = Number(data.profitMargin ?? 0);
  const plKpis: KpiCard[] = [
    {
      label: 'Sales Units',
      value: (data.salesUnits ?? 0).toLocaleString(),
      icon: <Inventory2 />,
      color: '#2196F3',
      sub: 'Total units invoiced in period',
    },
    {
      label: 'Net Revenue',
      value: fmt(data.totalInvoiced ?? 0),
      icon: <AttachMoney />,
      color: '#4CAF50',
      sub: 'Sum of all invoice final amounts',
    },
    {
      label: 'Total COGS',
      value: fmt(data.totalCogs ?? 0),
      icon: <TrendingDown />,
      color: '#FF9800',
      sub: 'Unit cost × units sold per product',
    },
    {
      label: 'Gross Profit',
      value: fmt(data.grossProfit ?? 0),
      icon: <TrendingUp />,
      color: (data.grossProfit ?? 0) >= 0 ? '#4CAF50' : '#F44336',
      sub: 'Net Revenue − Total COGS',
    },
    {
      label: 'Profit Margin',
      value: data.profitMargin != null ? pct(data.profitMargin) : 'N/A',
      icon: <TrendingUp />,
      color:
        margin >= 30
          ? '#4CAF50'
          : margin >= 10
            ? '#FF9800'
            : '#F44336',
      sub: 'Gross Profit ÷ Net Revenue',
    },
  ];

  return (
    <>
      {/* ── Cash-flow KPI row ────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* ── Profitability KPI row ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: 2.5,
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2} textTransform="uppercase" letterSpacing="0.05em" fontSize="0.72rem">
          Profitability Overview
        </Typography>
        <Grid container spacing={2}>
          {plKpis.map((k) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={k.label}>
              <KpiCard card={k} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ── Row 1: Monthly revenue trend (full width) ────────────────────── */}
      {hasMonthlyTrend && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Monthly Revenue Trend — Invoiced vs Collected
          </Typography>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthlyTrend} margin={{ top: 4, right: 16 }}>
              <defs>
                <linearGradient id="gradInvoiced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#9C27B0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                }
              />
              <ReTooltip
                formatter={
                  ((v: any, name: string) => [
                    fmt(v),
                    name === 'invoiced' ? 'Invoiced' : 'Collected',
                  ]) as any
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="invoiced"
                stroke="#9C27B0"
                strokeWidth={2}
                fill="url(#gradInvoiced)"
                name="invoiced"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#4CAF50"
                strokeWidth={2}
                fill="url(#gradCollected)"
                name="collected"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── Row 2: Invoiced vs Paid by status + Receivables aging ────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Invoiced vs Collected by Invoice Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.invoicesByStatus ?? []} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <ReTooltip
                  formatter={
                    ((v: any, name: string) => [
                      fmt(v),
                      name === 'amount' ? 'Invoiced' : 'Collected',
                    ]) as any
                  }
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  name="amount"
                  fill="#9C27B0"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="paid"
                  name="paid"
                  fill="#4CAF50"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Receivables Aging (All Outstanding)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.receivablesAging ?? []}
                margin={{ top: 4, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <ReTooltip
                  formatter={(v: any) => [fmt(v as number), 'Outstanding']}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={64}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={AGING_COLOR[props.index] ?? '#9E9E9E'}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Row 3: Payment methods donut ─────────────────────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Payment Methods (cash received in period)">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(data.paymentMethods ?? []).map(
                    (m: any, i: number) => ({
                      ...m,
                      fill: CHART_COLORS[i % CHART_COLORS.length],
                    }),
                  )}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={88}
                  labelLine={false}
                  label={(props: any) => {
                    if ((props.percent ?? 0) < 0.04) return null;
                    const R = Math.PI / 180;
                    const r =
                      props.innerRadius +
                      (props.outerRadius - props.innerRadius) * 0.55;
                    const x = props.cx + r * Math.cos(-props.midAngle * R);
                    const y = props.cy + r * Math.sin(-props.midAngle * R);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight={700}
                      >
                        {`${((props.percent ?? 0) * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                />
                <ReTooltip
                  formatter={(v: any) => [fmt(v as number), 'Amount collected']}
                />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        {/* Revenue collected summary bars */}
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Revenue Summary">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[
                  { label: 'Invoiced', value: data.totalInvoiced ?? 0 },
                  { label: 'Collected', value: data.totalCollected ?? 0 },
                  { label: 'Outstanding', value: data.totalOutstanding ?? 0 },
                  { label: 'PO Spend', value: data.totalPurchaseSpend ?? 0 },
                  { label: 'PO Paid', value: data.totalPurchasePaid ?? 0 },
                ]}
                layout="vertical"
                margin={{ left: 16, right: 56 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <ReTooltip formatter={(v: any) => [fmt(v as number), '']} />
                <Bar
                  dataKey="value"
                  maxBarSize={32}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        (
                          [
                            '#9C27B0',
                            '#4CAF50',
                            '#FF9800',
                            '#F44336',
                            '#2196F3',
                          ] as const
                        )[props.index] ?? '#9C27B0'
                      }
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Invoice status summary table ─────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Invoice Status Summary
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Total Invoiced</TableCell>
                <TableCell align="right">Collected</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Collection %</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {(data.invoicesByStatus ?? []).map((s: any, i: number) => {
                const rate =
                  s.amount > 0 ? Math.round((s.paid / s.amount) * 100) : null;
                return (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Chip
                        label={s.status.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{s.count}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: '#9C27B0' }}
                    >
                      {fmt(s.amount)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#4CAF50' }}>
                      {fmt(s.paid)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: s.outstanding > 0 ? '#FF9800' : 'inherit' }}
                    >
                      {fmt(s.outstanding ?? s.amount - s.paid)}
                    </TableCell>
                    <TableCell align="right">
                      {rate !== null ? (
                        <Chip
                          label={`${rate}%`}
                          size="small"
                          sx={{
                            bgcolor: alpha(
                              rate >= 80
                                ? '#4CAF50'
                                : rate >= 50
                                  ? '#FF9800'
                                  : '#F44336',
                              0.12,
                            ),
                            color:
                              rate >= 80
                                ? '#4CAF50'
                                : rate >= 50
                                  ? '#FF9800'
                                  : '#F44336',
                            fontWeight: 700,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(data.invoicesByStatus ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No invoices for this period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Top debtors table ────────────────────────────────────────────── */}
      {hasTopDebtors && (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}
        >
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Top Debtors — Highest Outstanding Balances
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current state across all time, not filtered by period
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <StyledTableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Invoices</TableCell>
                  <TableCell align="right">Total Invoiced</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {data.topDebtors.map((d: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={d.invoiceCount}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{fmt(d.totalInvoiced)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: '#FF9800' }}
                    >
                      {fmt(d.outstanding)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Finance detail table ──────────────────────────────────────────── */}
      <FinanceDetailTable rows={data.productDetails ?? []} />
    </>
  );
}

// ─── Finance detail table ─────────────────────────────────────────────────────

function FinanceDetailTable({ rows }: { rows: any[] }) {
  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Revenue &amp; Profitability Detail — by Product
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Aggregated per product for the selected period · unit cost sourced from current store/product cost price · discount prorated from invoice header
        </Typography>
      </Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1100 }}>
          <StyledTableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Units Sold</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Discount</TableCell>
              <TableCell align="right">Returns</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="right">Net Revenue</TableCell>
              <TableCell align="right">COGS</TableCell>
              <TableCell align="right">Profit / Unit</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {rows.map((row: any, i: number) => {
              const rowMargin =
                row.netRevenue > 0
                  ? Math.round(
                      ((row.netRevenue - row.cogs) / row.netRevenue) * 100,
                    )
                  : null;
              const profitColor =
                row.profitPerUnit > 0
                  ? '#2E7D32'
                  : row.profitPerUnit < 0
                    ? '#B71C1C'
                    : 'text.secondary';

              return (
                <TableRow key={i} hover>
                  {/* Date */}
                  <TableCell
                    sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    {fmtDateTime(row.date)}
                  </TableCell>

                  {/* Product */}
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    {row.product}
                  </TableCell>

                  {/* Units Sold */}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {(row.unitsSold ?? 0).toLocaleString()}
                  </TableCell>

                  {/* Unit Price */}
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                    {fmt(row.unitPrice ?? 0)}
                  </TableCell>

                  {/* Discount */}
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '0.82rem',
                      color: row.discount > 0 ? '#FF9800' : 'text.disabled',
                      fontWeight: row.discount > 0 ? 600 : 400,
                    }}
                  >
                    {row.discount > 0 ? `−${fmt(row.discount)}` : '—'}
                  </TableCell>

                  {/* Returns */}
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '0.82rem',
                      color: row.returns > 0 ? '#F44336' : 'text.disabled',
                      fontWeight: row.returns > 0 ? 600 : 400,
                    }}
                  >
                    {row.returns > 0 ? row.returns : '—'}
                  </TableCell>

                  {/* Unit Cost */}
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                    {row.unitCost > 0 ? fmt(row.unitCost) : '—'}
                  </TableCell>

                  {/* Net Revenue */}
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: '#9C27B0' }}
                  >
                    {fmt(row.netRevenue ?? 0)}
                  </TableCell>

                  {/* COGS */}
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: '#FF9800', fontSize: '0.82rem' }}
                  >
                    {row.cogs > 0 ? fmt(row.cogs) : '—'}
                  </TableCell>

                  {/* Profit per Unit */}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: profitColor, fontSize: '0.82rem' }}
                      >
                        {row.unitCost > 0 ? fmt(row.profitPerUnit ?? 0) : '—'}
                      </Typography>
                      {rowMargin !== null && row.unitCost > 0 && (
                        <Typography variant="caption" sx={{ color: profitColor, fontSize: '0.68rem' }}>
                          {rowMargin}% margin
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No invoice data for this period
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function QCReport({ data }: { data: any }) {
  const kpis: KpiCard[] = [
    {
      label: 'Total QC Tests',
      value: data.totalQCTests,
      icon: <VerifiedUser />,
      color: '#00BCD4',
    },
    {
      label: 'Pass Rate',
      value: pct(data.passRate),
      icon: <CheckCircle />,
      color: '#4CAF50',
      sub: `${data.passCount} passed / ${data.failCount} failed`,
    },
    {
      label: 'Total NCRs',
      value: data.totalNCRs,
      icon: <Warning />,
      color: '#F44336',
      sub: 'Non-conformance reports',
    },
  ];

  return (
    <>
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 4 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="QC Results">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(data.qcResults ?? []).map((r: any) => ({
                    ...r,
                    fill:
                      r.result === 'PASS'
                        ? '#4CAF50'
                        : r.result === 'FAIL'
                          ? '#F44336'
                          : '#FF9800',
                  }))}
                  dataKey="count"
                  nameKey="result"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'Tests']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="Tests by Type">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.testTypes}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <ReTooltip formatter={(v: any) => [v, 'Tests']} />
                <Bar dataKey="count" fill="#00BCD4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartBox title="NCR Status">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(data.ncrStatuses ?? []).map((s: any, i: number) => ({
                    ...s,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={pieLabel}
                  labelLine={false}
                />
                <ReTooltip formatter={(v: any) => [v, 'NCRs']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {data.failCategories.length > 0 && (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Defect Categories
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <StyledTableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {data.failCategories.map((f: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell>{f.category.replace(/_/g, ' ')}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={f.count}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}

// Status colour map for dispatch statuses
const DISPATCH_STATUS_COLOR: Record<string, string> = {
  DELIVERED: '#4CAF50',
  IN_TRANSIT: '#2196F3',
  PENDING: '#FF9800',
  REQUESTED: '#9E9E9E',
  FAILED_DELIVERY: '#F44336',
  RETURNED: '#9C27B0',
};

function DispatchReport({ data }: { data: any }) {
  const deliveryRate = Number(data.deliveryRate ?? 0);
  const hasMonthlyTrend =
    Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 1;
  const hasTopCustomers =
    Array.isArray(data.topCustomers) && data.topCustomers.length > 0;
  const hasReturnsByProduct =
    Array.isArray(data.returnsByProduct) && data.returnsByProduct.length > 0;
  const hasDeliveryMethods =
    Array.isArray(data.deliveryMethods) && data.deliveryMethods.length > 0;

  const kpis: KpiCard[] = [
    {
      label: 'Total Dispatches',
      value: data.totalDispatches,
      icon: <LocalShipping />,
      color: '#F44336',
      sub: `${data.deliveredCount ?? 0} delivered · ${data.failedCount ?? 0} failed`,
    },
    {
      label: 'Store Dispatches',
      value: data.totalStoreDispatches,
      icon: <ShoppingCart />,
      color: '#FF9800',
    },
    {
      label: 'Delivery Rate',
      value: pct(data.deliveryRate),
      icon: <CheckCircle />,
      color:
        deliveryRate >= 80
          ? '#4CAF50'
          : deliveryRate >= 50
            ? '#FF9800'
            : '#F44336',
      sub: 'Customer dispatches successfully delivered',
    },
    // {
    //   label: 'Avg Delivery Time',
    //   value:
    //     data.avgDeliveryDays != null ? `${data.avgDeliveryDays} days` : 'N/A',
    //   icon: <TrendingUp />,
    //   color: '#2196F3',
    //   sub: 'From dispatch to delivery',
    // },
    {
      label: 'Product Returns',
      value: data.totalReturns,
      icon: <Warning />,
      color: '#9C27B0',
      sub: `${data.totalUnitsReturned ?? 0} units returned`,
    },
    {
      label: 'Repair Cost',
      value: fmt(data.totalRepairCost ?? 0),
      icon: <AttachMoney />,
      color: '#795548',
      sub: 'Total repair spend on returns',
    },
  ];

  return (
    <>
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {kpis.map((k) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={k.label}>
            <KpiCard card={k} />
          </Grid>
        ))}
      </Grid>

      {/* ── Monthly trend (full width, conditional) ──────────────────────── */}
      {hasMonthlyTrend && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Monthly Dispatch Volume
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthlyTrend} margin={{ top: 4, right: 16 }}>
              <defs>
                <linearGradient id="gradDispatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F44336" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <ReTooltip formatter={(v: any) => [v, 'Dispatches']} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#F44336"
                strokeWidth={2}
                fill="url(#gradDispatch)"
                name="count"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── Row 1: Dispatch Status + Store Dispatch Status ───────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Customer Dispatch Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dispatchStatuses ?? []} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Dispatches']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="count"
                  maxBarSize={56}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        DISPATCH_STATUS_COLOR[props.status] ??
                        CHART_COLORS[props.index % CHART_COLORS.length]
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartBox title="Store Dispatch Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.storeDispatchStatuses ?? []}
                margin={{ top: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip
                  formatter={(v: any) => [v, 'Dispatches']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="count"
                  maxBarSize={56}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={
                        DISPATCH_STATUS_COLOR[props.status] ??
                        CHART_COLORS[props.index % CHART_COLORS.length]
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>
      </Grid>

      {/* ── Row 2: Return statuses + Delivery methods ────────────────────── */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: hasDeliveryMethods ? 6 : 12 }}>
          <ChartBox title="Product Returns by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.returnStatuses ?? []}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                  width={120}
                />
                <ReTooltip
                  formatter={(v: any) => [v, 'Returns']}
                  labelFormatter={(l) => l.replace(/_/g, ' ')}
                />
                <Bar
                  dataKey="count"
                  maxBarSize={32}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={CHART_COLORS[props.index % CHART_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Grid>

        {hasDeliveryMethods && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartBox title="Delivery Methods (Store Dispatches)">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={(data.deliveryMethods ?? []).map(
                      (m: any, i: number) => ({
                        ...m,
                        fill: CHART_COLORS[i % CHART_COLORS.length],
                      }),
                    )}
                    dataKey="count"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={90}
                    labelLine={false}
                    label={(props: any) => {
                      if ((props.percent ?? 0) < 0.05) return null;
                      const R = Math.PI / 180;
                      const r =
                        props.innerRadius +
                        (props.outerRadius - props.innerRadius) * 0.55;
                      const x = props.cx + r * Math.cos(-props.midAngle * R);
                      const y = props.cy + r * Math.sin(-props.midAngle * R);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight={700}
                        >
                          {`${((props.percent ?? 0) * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  />
                  <ReTooltip formatter={(v: any) => [v, 'Dispatches']} />
                  <Legend iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </ChartBox>
          </Grid>
        )}
      </Grid>

      {/* ── Row 3: Returns by product + Top customers ────────────────────── */}
      <Grid container spacing={3} mb={3}>
        {hasReturnsByProduct && (
          <Grid size={{ xs: 12, md: hasTopCustomers ? 6 : 12 }}>
            <ChartBox title="Top Returned Products">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.returnsByProduct}
                  layout="vertical"
                  margin={{ left: 8, right: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={130}
                  />
                  <ReTooltip
                    formatter={
                      ((v: any, name: string) => [
                        v,
                        name === 'returns' ? 'Return events' : 'Units returned',
                      ]) as any
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="returns"
                    fill="#9C27B0"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#E91E63"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Grid>
        )}

        {hasTopCustomers && (
          <Grid size={{ xs: 12, md: hasReturnsByProduct ? 6 : 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Top Customers by Store Dispatches
              </Typography>
              <TableContainer>
                <Table size="small">
                  <StyledTableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Dispatches</TableCell>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {data.topCustomers.map((c: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={c.dispatches}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </>
  );
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

/** Fetch a TTF font file and return its base64 string. */
async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return btoa(
    new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''),
  );
}

/**
 * Register Roboto (Regular + Bold) into a jsPDF doc so that Unicode
 * characters like ₦ render correctly instead of showing as ¦.
 */
async function registerRoboto(doc: any) {
  const [regular, bold] = await Promise.all([
    fetchFontBase64('/fonts/Roboto-Regular.ttf'),
    fetchFontBase64('/fonts/Roboto-Bold.ttf'),
  ]);
  doc.addFileToVFS('Roboto-Regular.ttf', regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
}

/** Shared autoTable styles — keeps font consistent across all tables. */
function tableStyles(headColor: [number, number, number]) {
  return {
    theme: 'grid' as const,
    styles: { font: 'Roboto', fontStyle: 'normal' as const, fontSize: 9 },
    headStyles: {
      font: 'Roboto',
      fontStyle: 'bold' as const,
      fillColor: headColor,
      textColor: [255, 255, 255] as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as [number, number, number],
    },
  };
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportPDF(
  department: string,
  period: string,
  data: any,
  label: string,
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Embed Roboto so ₦ and other Unicode characters render correctly
  await registerRoboto(doc);
  doc.setFont('Roboto', 'normal');

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || period;
  const now = new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('Roboto', 'bold');
  doc.text(`${label} Department Report`, 14, 13);
  doc.setFontSize(9.5);
  doc.setFont('Roboto', 'normal');
  doc.text(`Period: ${periodLabel}   |   Generated: ${now}`, 14, 22);

  doc.setTextColor(0, 0, 0);
  let y = 38;

  const addSection = (title: string) => {
    // small top gap + bold label
    doc.setFontSize(11);
    doc.setFont('Roboto', 'bold');
    doc.text(title, 14, y);
    y += 5;
  };

  // ── Department-specific content ────────────────────────────────────────────
  if (department === 'sales') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', data.totalOrders],
        ['Total Invoices', data.totalInvoices],
        ['Total Quotes', data.totalQuotes],
        ['Avg Order Value', fmt(data.avgOrderValue ?? 0)],
        ['Conversion Rate', `${data.conversionRate}%`],
        ['Total Revenue', fmt(data.totalRevenue)],
        ['Amount Collected', fmt(data.totalCollected)],
        ['Outstanding', fmt(data.totalOutstanding)],
      ],
      ...tableStyles([33, 150, 243]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Orders by Status');
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count']],
      body: data.ordersByStatus.map((s: any) => [
        s.status.replace(/_/g, ' '),
        s.count,
      ]),
      ...tableStyles([33, 150, 243]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Quote Funnel');
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count']],
      body: (data.quotesByStatus ?? []).map((s: any) => [
        s.status.replace(/_/g, ' '),
        s.count,
      ]),
      ...tableStyles([33, 150, 243]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Top Customers by Revenue');
    autoTable(doc, {
      startY: y,
      head: [
        ['#', 'Customer', 'Orders', 'Revenue', 'Collected', 'Outstanding'],
      ],
      body: data.topCustomers.map((c: any, i: number) => [
        i + 1,
        c.name,
        c.orders,
        fmt(c.revenue ?? 0),
        fmt(c.collected ?? 0),
        fmt((c.revenue ?? 0) - (c.collected ?? 0)),
      ]),
      ...tableStyles([33, 150, 243]),
    });
  } else if (department === 'production') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Production Orders', data.totalOrders],
        ['Total Units', data.totalUnits],
        [
          'Avg Yield Rate',
          data.avgYieldRate !== null ? `${data.avgYieldRate}%` : 'N/A',
        ],
        ['Reworks', data.reworkCount],
      ],
      ...tableStyles([255, 152, 0]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Top Products');
    autoTable(doc, {
      startY: y,
      head: [['#', 'Product', 'Orders', 'Units Packaged']],
      body: data.productionByProduct.map((p: any, i: number) => [
        i + 1,
        p.name,
        p.orders,
        p.unitsPackaged,
      ]),
      ...tableStyles([255, 152, 0]),
    });
  } else if (department === 'inventory') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Materials', data.totalMaterials],
        ['Low Stock Items', data.lowStockCount],
        ['Out of Stock', data.outOfStockCount],
        ['Total Inventory Value', fmt(data.totalInventoryValue)],
        ['PO Spend', fmt(data.totalPOSpend)],
        ['Material Issuances', data.issuanceCount],
      ],
      ...tableStyles([76, 175, 80]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (data.lowStockItems.length > 0) {
      addSection('Low Stock Items');
      autoTable(doc, {
        startY: y,
        head: [['#', 'Material', 'Current Stock', 'Reorder Level', 'Deficit']],
        body: data.lowStockItems.map((m: any, i: number) => [
          i + 1,
          m.name,
          m.currentStock,
          m.reorderLevel,
          m.reorderLevel - m.currentStock,
        ]),
        ...tableStyles([76, 175, 80]),
      });
    }
  } else if (department === 'finance') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Invoiced', fmt(data.totalInvoiced)],
        ['Total Collected', fmt(data.totalCollected)],
        ['Outstanding (AR)', fmt(data.totalOutstanding)],
        ['Collection Rate', `${data.collectionRate}%`],
        ['Avg Invoice Value', fmt(data.avgInvoiceValue ?? 0)],
        ['Total PO Spend', fmt(data.totalPurchaseSpend)],
        ['PO Amount Paid', fmt(data.totalPurchasePaid)],
        ['PO Outstanding', fmt(data.totalPurchaseOutstanding ?? 0)],
        ['Tax Collected', fmt(data.totalTax)],
        ['Total Discounts', fmt(data.totalDiscount)],
      ],
      ...tableStyles([156, 39, 176]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Invoice Status Summary');
    autoTable(doc, {
      startY: y,
      head: [
        [
          'Status',
          'Count',
          'Total Invoiced',
          'Collected',
          'Outstanding',
          'Collection %',
        ],
      ],
      body: (data.invoicesByStatus ?? []).map((s: any) => {
        const rate = s.amount > 0 ? Math.round((s.paid / s.amount) * 100) : 0;
        return [
          s.status.replace(/_/g, ' '),
          s.count,
          fmt(s.amount),
          fmt(s.paid),
          fmt(s.outstanding ?? s.amount - s.paid),
          `${rate}%`,
        ];
      }),
      ...tableStyles([156, 39, 176]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (
      Array.isArray(data.receivablesAging) &&
      data.receivablesAging.length > 0
    ) {
      addSection('Receivables Aging');
      autoTable(doc, {
        startY: y,
        head: [['Bucket', 'Outstanding Amount']],
        body: data.receivablesAging.map((a: any) => [a.label, fmt(a.value)]),
        ...tableStyles([156, 39, 176]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 1) {
      addSection('Monthly Revenue Trend');
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Invoiced', 'Collected']],
        body: data.monthlyTrend.map((m: any) => [
          m.month,
          fmt(m.invoiced),
          fmt(m.collected),
        ]),
        ...tableStyles([156, 39, 176]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (Array.isArray(data.topDebtors) && data.topDebtors.length > 0) {
      addSection('Top Debtors (Current Outstanding)');
      autoTable(doc, {
        startY: y,
        head: [['#', 'Customer', 'Invoices', 'Total Invoiced', 'Outstanding']],
        body: data.topDebtors.map((d: any, i: number) => [
          i + 1,
          d.name,
          d.invoiceCount,
          fmt(d.totalInvoiced),
          fmt(d.outstanding),
        ]),
        ...tableStyles([156, 39, 176]),
      });
    }
  } else if (department === 'quality-control') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total QC Tests', data.totalQCTests],
        ['Pass Rate', `${data.passRate}%`],
        ['Tests Passed', data.passCount],
        ['Tests Failed', data.failCount],
        ['Total NCRs', data.totalNCRs],
      ],
      ...tableStyles([0, 188, 212]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (data.failCategories.length > 0) {
      addSection('Defect Categories');
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Count']],
        body: data.failCategories.map((f: any) => [
          f.category.replace(/_/g, ' '),
          f.count,
        ]),
        ...tableStyles([0, 188, 212]),
      });
    }
  } else if (department === 'dispatch') {
    addSection('Key Metrics');
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Dispatches (Combined)', data.totalDispatches],
        ['  — Customer Order Dispatches', data.customerDispatches ?? 0],
        ['  — Store Dispatches', data.totalStoreDispatches],
        ['Delivered (Combined)', data.deliveredCount ?? 0],
        ['Failed Delivery (Combined)', data.failedCount ?? 0],
        ['Delivery Rate', `${data.deliveryRate}%`],
        ['Avg Delivery Time', data.avgDeliveryDays != null ? `${data.avgDeliveryDays} days` : 'N/A'],
        ['Product Returns', data.totalReturns],
        ['Units Returned', data.totalUnitsReturned ?? 0],
        ['Total Repair Cost', fmt(data.totalRepairCost ?? 0)],
      ],
      ...tableStyles([244, 67, 54]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Customer Dispatch Status');
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count']],
      body: (data.dispatchStatuses ?? []).map((s: any) => [
        s.status.replace(/_/g, ' '),
        s.count,
      ]),
      ...tableStyles([244, 67, 54]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    addSection('Store Dispatch Status');
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count']],
      body: (data.storeDispatchStatuses ?? []).map((s: any) => [
        s.status.replace(/_/g, ' '),
        s.count,
      ]),
      ...tableStyles([244, 67, 54]),
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (Array.isArray(data.returnStatuses) && data.returnStatuses.length > 0) {
      addSection('Product Return Statuses');
      autoTable(doc, {
        startY: y,
        head: [['Status', 'Count']],
        body: data.returnStatuses.map((s: any) => [
          s.status.replace(/_/g, ' '),
          s.count,
        ]),
        ...tableStyles([244, 67, 54]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (
      Array.isArray(data.returnsByProduct) &&
      data.returnsByProduct.length > 0
    ) {
      addSection('Top Returned Products');
      autoTable(doc, {
        startY: y,
        head: [['Product', 'Return Events', 'Units Returned']],
        body: data.returnsByProduct.map((r: any) => [
          r.name,
          r.returns,
          r.quantity,
        ]),
        ...tableStyles([244, 67, 54]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (Array.isArray(data.topCustomers) && data.topCustomers.length > 0) {
      addSection('Top Customers by Store Dispatches');
      autoTable(doc, {
        startY: y,
        head: [['#', 'Customer', 'Dispatches']],
        body: data.topCustomers.map((c: any, i: number) => [
          i + 1,
          c.name,
          c.dispatches,
        ]),
        ...tableStyles([244, 67, 54]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (
      Array.isArray(data.deliveryMethods) &&
      data.deliveryMethods.length > 0
    ) {
      addSection('Delivery Methods');
      autoTable(doc, {
        startY: y,
        head: [['Method', 'Count']],
        body: data.deliveryMethods.map((m: any) => [m.method, m.count]),
        ...tableStyles([244, 67, 54]),
      });
    }
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Greenage Production Manager — ${label} Report | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8,
    );
  }

  doc.save(
    `greenage-${department}-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DepartmentReportPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [period, setPeriod] = useState<Period>('monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const meta = DEPT_META[department];

  const role = (session?.user as any)?.role;
  const permissions: string[] = (session?.user as any)?.permissions ?? [];
  const hasAccess =
    role === 'SUPERADMIN' || permissions.includes(`reports:${department}`);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/${department}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [department, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!data || !meta) return;
    setExporting(true);
    try {
      await exportPDF(department, period, data, meta.label);
    } finally {
      setExporting(false);
    }
  };

  if (!meta) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Unknown department: {department}</Alert>
      </Box>
    );
  }

  if (session && !hasAccess) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You do not have permission to view the {meta.label} report.
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/reports')}>
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/reports')}
            sx={{ minWidth: 0, px: 1 }}
          >
            Reports
          </Button>
          <Divider orientation="vertical" flexItem />
          {/* <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(meta.color, 0.12),
              color: meta.color,
              '& svg': { fontSize: 20 },
            }}
          >
            {meta.icon}
          </Box> */}
          <Typography variant="h5" fontWeight={700}>
            {meta.label} Report
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExport}
            disabled={loading || !data || exporting}
            size="small"
            sx={{ bgcolor: meta.color, '&:hover': { bgcolor: meta.color } }}
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </Stack>
      </Stack>

      {/* Period filter */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Period:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              variant={period === p.key ? 'contained' : 'outlined'}
              sx={
                period === p.key
                  ? {
                      bgcolor: meta.color,
                      borderColor: meta.color,
                      '&:hover': { bgcolor: meta.color },
                    }
                  : { borderColor: 'divider' }
              }
            >
              {p.label}
            </Button>
          ))}
        </ButtonGroup>
      </Paper>

      {/* Content */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: meta.color }} />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && data && (
        <>
          {department === 'sales' && <SalesReport data={data} />}
          {department === 'production' && <ProductionReport data={data} />}
          {department === 'inventory' && <InventoryReport data={data} />}
          {department === 'finance' && <FinanceReport data={data} />}
          {department === 'quality-control' && <QCReport data={data} />}
          {department === 'dispatch' && <DispatchReport data={data} />}
          {department === 'procurement' && <ProcurementReport data={data} />}
        </>
      )}
    </Box>
  );
}
