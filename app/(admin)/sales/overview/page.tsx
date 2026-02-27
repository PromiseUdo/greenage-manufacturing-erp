"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Avatar,
  Divider,
  Alert,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Receipt,
  Assignment,
  LocalShipping,
  AccountBalance,
  OpenInNew,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart,
  People,
} from "@mui/icons-material";
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
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  totalRevenue: number;
  totalPaidAmount: number;
  outstandingReceivables: number;
  totalQuotes: number;
  quoteConversionRate: number;
  totalOrders: number;
  activeOrders: number;
  totalInvoiceValue: number;
}

interface TrendPoint {
  label: string;
  revenue: number;
  invoiced: number;
}

interface FunnelItem {
  status: string;
  count: number;
  value: number;
}

interface InvoiceStatusItem {
  status: string;
  count: number;
  amount: number;
}

interface OrderPipelineItem {
  status: string;
  count: number;
}

interface TopCustomer {
  id: string;
  name: string;
  quoteCount: number;
  orderCount: number;
  totalRevenue: number;
  lastOrderDate: string | null;
}

interface RecentQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
}

interface OverviewData {
  period: string;
  kpis: KPIs;
  revenueTrend: TrendPoint[];
  quoteFunnel: FunnelItem[];
  invoicePaymentStatus: InvoiceStatusItem[];
  orderPipeline: OrderPipelineItem[];
  topCustomers: TopCustomer[];
  recentQuotes: RecentQuote[];
}

// ─── Styled Components ────────────────────────────────────────────────────────

const SectionPaper = styled(Paper)(() => ({
  borderRadius: 12,
  border: "1px solid",
  borderColor: "rgba(15, 23, 42, 0.1)",
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
}));

const SectionHeader = styled(Box)(() => ({
  padding: "16px 20px",
  borderBottom: "1px solid rgba(15,23,42,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 8,
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SENT: "#60a5fa",
  ACCEPTED: "#34d399",
  CONVERTED: "#818cf8",
  REJECTED: "#f87171",
  EXPIRED: "#fbbf24",
};

const INVOICE_COLORS: Record<string, string> = {
  PENDING: "#94a3b8",
  PARTIAL: "#fbbf24",
  PAID: "#34d399",
  OVERDUE: "#f87171",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING_PLANNING: "#94a3b8",
  IN_PRODUCTION: "#60a5fa",
  QC_TESTING: "#a78bfa",
  PACKAGING: "#fb923c",
  READY_FOR_DISPATCH: "#34d399",
  DISPATCHED: "#0ea5e9",
  DELIVERED: "#10b981",
  CANCELLED: "#f87171",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PLANNING: "Planning",
  IN_PRODUCTION: "Production",
  QC_TESTING: "QC Testing",
  PACKAGING: "Packaging",
  READY_FOR_DISPATCH: "Ready",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const QUOTE_STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", text: "#64748b" },
  SENT: { bg: "#dbeafe", text: "#1d4ed8" },
  ACCEPTED: { bg: "#dcfce7", text: "#166534" },
  CONVERTED: { bg: "#ede9fe", text: "#5b21b6" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  EXPIRED: { bg: "#fef3c7", text: "#92400e" },
};

// ─── Utility Functions ────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0,
  }).format(amount);

const formatCurrencyFull = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | null;
}

function KpiCard({ label, value, sub, icon, color, trend }: KpiCardProps) {
  return (
    <SectionPaper
      sx={{
        p: 2.5,
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        // "&::before": {
        //   content: '""',
        //   position: "absolute",
        //   left: 0,
        //   top: 0,
        //   bottom: 0,
        //   width: 4,
        //   bgcolor: color,
        //   borderRadius: "12px 0 0 12px",
        // },
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: 11,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#0f172a", mt: 0.5, lineHeight: 1.2 }}
          >
            {value}
          </Typography>
          {sub && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 0.25, display: "block" }}
            >
              {sub}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}18`,
            width: 44,
            height: 44,
            color: color,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {trend && (
        <Box display="flex" alignItems="center" gap={0.5} mt={1.5}>
          {trend === "up" ? (
            <TrendingUp sx={{ fontSize: 14, color: "#10b981" }} />
          ) : (
            <TrendingDown sx={{ fontSize: 14, color: "#ef4444" }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: trend === "up" ? "#10b981" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {trend === "up" ? "On track" : "Needs attention"}
          </Typography>
        </Box>
      )}
    </SectionPaper>
  );
}

// Custom recharts tooltip
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: "#0f172a",
          color: "#fff",
          p: 1.5,
          borderRadius: 2,
          boxShadow: 4,
          minWidth: 170,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}
        >
          {label}
        </Typography>
        {payload.map((entry: any) => (
          <Box
            key={entry.dataKey}
            display="flex"
            justifyContent="space-between"
            gap={2}
          >
            <Typography variant="caption" sx={{ color: entry.color }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {formatCurrency(entry.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

const CountTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: "#0f172a",
          color: "#fff",
          p: 1.5,
          borderRadius: 2,
          boxShadow: 4,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}
        >
          {label}
        </Typography>
        {payload.map((entry: any) => (
          <Box
            key={entry.dataKey}
            display="flex"
            justifyContent="space-between"
            gap={2}
          >
            <Typography variant="caption" sx={{ color: entry.color }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <Box
        sx={{
          bgcolor: "#0f172a",
          color: "#fff",
          p: 1.5,
          borderRadius: 2,
          boxShadow: 4,
          minWidth: 160,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: entry.payload.fill,
            display: "block",
            mb: 0.5,
            fontWeight: 700,
          }}
        >
          {entry.name}
        </Typography>
        <Typography variant="caption">
          {entry.value} invoice{entry.value !== 1 ? "s" : ""}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", color: "#94a3b8" }}
        >
          {formatCurrency(entry.payload.amount)}
        </Typography>
      </Box>
    );
  }
  return null;
};

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function SalesOverviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<string>("12m");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/overview?period=${p}`);
      if (!res.ok) throw new Error("Failed to load overview data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handlePeriodChange = (
    _: React.MouseEvent<HTMLElement>,
    val: string,
  ) => {
    if (val) setPeriod(val);
  };

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const kpis = data?.kpis;

  // Prepare pie data
  const pieData = (data?.invoicePaymentStatus || [])
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.status,
      value: item.count,
      amount: item.amount,
    }));

  // Order pipeline chart data (filter out zeros from chart, but keep all for display)
  const orderChartData = (data?.orderPipeline || [])
    .filter((o) => o.count > 0)
    .map((o) => ({
      name: ORDER_STATUS_LABELS[o.status] || o.status,
      count: o.count,
      fill: ORDER_STATUS_COLORS[o.status] || "#94a3b8",
    }));

  // Quote funnel chart (non-zero only)
  const quoteFunnelData = (data?.quoteFunnel || [])
    .filter((f) => f.count > 0)
    .map((f) => ({
      name: f.status,
      count: f.count,
      value: f.value,
      fill: QUOTE_STATUS_COLORS[f.status] || "#94a3b8",
    }));

  return (
    <Box sx={{ pb: 6, pt: 1 }}>
      {/* ── Page Header ── */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#0f172a" }}>
            Sales Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Real-time snapshot of your sales pipeline and revenue performance
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              fontWeight: 600,
              fontSize: 12,
              borderRadius: "8px !important",
              border: "1px solid rgba(15,23,42,0.15) !important",
              mx: 0.25,
              color: "#64748b",
              "&.Mui-selected": {
                bgcolor: "#0f172a",
                color: "#fff",
                "&:hover": { bgcolor: "#1e293b" },
              },
            },
          }}
        >
          <ToggleButton value="7d">7D</ToggleButton>
          <ToggleButton value="30d">30D</ToggleButton>
          <ToggleButton value="90d">90D</ToggleButton>
          <ToggleButton value="12m">12M</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── KPI Cards ── */}
      {loading || !kpis ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress sx={{ color: "#0f172a" }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} mb={3} alignItems="stretch">
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <KpiCard
                label="Total Revenue"
                value={formatCurrency(kpis.totalRevenue)}
                sub={`of ${formatCurrency(kpis.totalInvoiceValue)} invoiced`}
                icon={<AttachMoney />}
                color="#10b981"
                trend={kpis.totalRevenue > 0 ? "up" : "down"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <KpiCard
                label="Outstanding Receivables"
                value={formatCurrency(kpis.outstandingReceivables)}
                sub="Pending / overdue balances"
                icon={<AccountBalance />}
                color="#f59e0b"
                trend={kpis.outstandingReceivables > 0 ? "down" : null}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <KpiCard
                label="Total Quotes"
                value={kpis.totalQuotes.toString()}
                sub="In selected period"
                icon={<Receipt />}
                color="#6366f1"
                trend={null}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <KpiCard
                label="Conversion Rate"
                value={`${kpis.quoteConversionRate}%`}
                sub="Accepted + converted quotes"
                icon={<TrendingUp />}
                color={kpis.quoteConversionRate >= 50 ? "#10b981" : "#f59e0b"}
                trend={kpis.quoteConversionRate >= 50 ? "up" : "down"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <KpiCard
                label="Active Orders"
                value={kpis.activeOrders.toString()}
                sub={`${kpis.totalOrders} orders total`}
                icon={<LocalShipping />}
                color="#0ea5e9"
                trend={kpis.activeOrders > 0 ? "up" : null}
              />
            </Grid>
          </Grid>

          {/* ── Row 2: Revenue Trend + Quote Funnel ── */}
          <Grid container spacing={2} mb={2}>
            {/* Revenue Trend – Area Chart */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <SectionPaper sx={{ height: "100%" }}>
                <SectionHeader>
                  {/* <ShowChart sx={{ color: "#10b981", fontSize: 20 }} /> */}
                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Revenue Trend
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Collected vs invoiced amount over time
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2, pt: 1.5 }}>
                  {data.revenueTrend.every(
                    (r) => r.revenue === 0 && r.invoiced === 0,
                  ) ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height={280}
                      flexDirection="column"
                      gap={1}
                    >
                      <ShowChart sx={{ fontSize: 40, color: "#cbd5e1" }} />
                      <Typography color="text.secondary" fontSize={13}>
                        No revenue data for this period
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart
                        data={data.revenueTrend}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
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
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
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
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v)}
                          width={75}
                        />
                        <ReTooltip content={<CurrencyTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="invoiced"
                          name="Invoiced"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#colorInvoiced)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#6366f1" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Collected"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#colorRevenue)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#10b981" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </SectionPaper>
            </Grid>

            {/* Quote Funnel – Horizontal Bar */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <SectionPaper sx={{ height: "100%" }}>
                <SectionHeader>
                  {/* <BarChartIcon sx={{ color: "#6366f1", fontSize: 20 }} /> */}
                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Quote Funnel
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Breakdown by status
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2, pt: 1.5 }}>
                  {quoteFunnelData.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height={280}
                      flexDirection="column"
                      gap={1}
                    >
                      <BarChartIcon sx={{ fontSize: 40, color: "#cbd5e1" }} />
                      <Typography color="text.secondary" fontSize={13}>
                        No quotes in this period
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        layout="vertical"
                        data={quoteFunnelData}
                        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{
                            fontSize: 11,
                            fill: "#64748b",
                            fontWeight: 600,
                          }}
                          tickLine={false}
                          axisLine={false}
                          width={72}
                        />
                        <ReTooltip content={<CountTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Quotes"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={24}
                        >
                          {quoteFunnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </SectionPaper>
            </Grid>
          </Grid>

          {/* ── Row 3: Invoice Status Donut + Order Pipeline ── */}
          <Grid container spacing={2} mb={2}>
            {/* Invoice Payment Status – Donut Pie */}
            <Grid size={{ xs: 12, md: 5 }}>
              <SectionPaper>
                <SectionHeader>
                  {/* <PieChartIcon sx={{ color: "#f59e0b", fontSize: 20 }} /> */}
                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Invoice Payment Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Distribution by payment state
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2, pt: 1 }}>
                  {pieData.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height={240}
                      flexDirection="column"
                      gap={1}
                    >
                      <PieChartIcon sx={{ fontSize: 40, color: "#cbd5e1" }} />
                      <Typography color="text.secondary" fontSize={13}>
                        No invoices in this period
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={INVOICE_COLORS[entry.name] || "#94a3b8"}
                              />
                            ))}
                          </Pie>
                          <ReTooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      <Box
                        display="flex"
                        flexWrap="wrap"
                        gap={1.5}
                        justifyContent="center"
                        mt={1}
                      >
                        {pieData.map((item) => (
                          <Box
                            key={item.name}
                            display="flex"
                            alignItems="center"
                            gap={0.75}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: INVOICE_COLORS[item.name] || "#94a3b8",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b", fontWeight: 600 }}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94a3b8" }}
                            >
                              ({item.value})
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      {/* Summary rows */}
                      <Box width="100%" mt={2}>
                        <Divider sx={{ mb: 1.5 }} />
                        {(data.invoicePaymentStatus || []).map((item) => (
                          <Box
                            key={item.status}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            py={0.5}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor:
                                    INVOICE_COLORS[item.status] || "#94a3b8",
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748b", fontWeight: 600 }}
                              >
                                {item.status}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color="#0f172a"
                            >
                              {formatCurrency(item.amount)}
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ color: "#94a3b8", ml: 0.75 }}
                              >
                                ({item.count})
                              </Typography>
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </SectionPaper>
            </Grid>

            {/* Order Pipeline – Vertical Bar */}
            <Grid size={{ xs: 12, md: 7 }}>
              <SectionPaper>
                <SectionHeader>
                  {/* <Assignment sx={{ color: "#0ea5e9", fontSize: 20 }} /> */}
                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Order Pipeline
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orders by current stage
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2, pt: 1.5 }}>
                  {orderChartData.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height={260}
                      flexDirection="column"
                      gap={1}
                    >
                      <LocalShipping sx={{ fontSize: 40, color: "#cbd5e1" }} />
                      <Typography color="text.secondary" fontSize={13}>
                        No orders in this period
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={orderChartData}
                        margin={{ top: 4, right: 8, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                          axisLine={false}
                          angle={-20}
                          textAnchor="end"
                          height={48}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <ReTooltip content={<CountTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Orders"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        >
                          {orderChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </SectionPaper>
            </Grid>
          </Grid>

          {/* ── Row 4: Top Customers + Recent Quotes ── */}
          <Grid container spacing={2}>
            {/* Top Customers */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <SectionPaper>
                <SectionHeader>
                  {/* <People sx={{ color: "#8b5cf6", fontSize: 20 }} /> */}
                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Top Customers
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ranked by revenue in period
                    </Typography>
                  </Box>
                </SectionHeader>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                        >
                          Customer
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="center"
                        >
                          Quotes
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="center"
                        >
                          Orders
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="right"
                        >
                          Revenue
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data.topCustomers || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                            <Typography color="text.secondary" fontSize={13}>
                              No customer data for this period
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.topCustomers.map((customer, index) => (
                          <TableRow
                            key={customer.id}
                            hover
                            sx={{
                              "&:last-child td": { borderBottom: 0 },
                              cursor: "default",
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    bgcolor:
                                      index === 0
                                        ? "#fef3c7"
                                        : index === 1
                                          ? "#f1f5f9"
                                          : "#fdf2f8",
                                    color:
                                      index === 0
                                        ? "#92400e"
                                        : index === 1
                                          ? "#475569"
                                          : "#9d174d",
                                  }}
                                >
                                  {customer.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    fontSize={13}
                                    sx={{ color: "#0f172a" }}
                                  >
                                    {customer.name}
                                  </Typography>
                                  {customer.lastOrderDate && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Last order:{" "}
                                      {formatDate(customer.lastOrderDate)}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontSize={13}
                                fontWeight={500}
                              >
                                {customer.quoteCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontSize={13}
                                fontWeight={500}
                              >
                                {customer.orderCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Tooltip
                                title={formatCurrencyFull(
                                  customer.totalRevenue,
                                )}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  fontSize={13}
                                  sx={{ color: "#0f172a" }}
                                >
                                  {formatCurrency(customer.totalRevenue)}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionPaper>
            </Grid>

            {/* Recent Quotes */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <SectionPaper>
                <SectionHeader>
                  {/* <Receipt sx={{ color: "#6366f1", fontSize: 20 }} /> */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      fontWeight={700}
                      fontSize={14}
                      sx={{ color: "#0f172a" }}
                    >
                      Recent Quotes
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Latest 5 quotes across all periods
                    </Typography>
                  </Box>
                  <Tooltip title="View all quotes">
                    <IconButton
                      size="small"
                      onClick={() => router.push("/sales/quotes")}
                      sx={{ color: "#94a3b8" }}
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </SectionHeader>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                        >
                          Quote #
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                        >
                          Customer
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                        >
                          Item
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="right"
                        >
                          Amount
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="center"
                        >
                          Status
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#64748b",
                            py: 1.5,
                          }}
                          align="right"
                        >
                          Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data?.recentQuotes || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Typography color="text.secondary" fontSize={13}>
                              No recent quotes
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.recentQuotes || []).map((quote) => (
                          <TableRow
                            key={quote.id}
                            hover
                            sx={{
                              cursor: "pointer",
                              "&:last-child td": { borderBottom: 0 },
                            }}
                            onClick={() =>
                              router.push(`/sales/quotes/${quote.id}`)
                            }
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontSize={13}
                                sx={{ color: "#0f172a" }}
                              >
                                {quote.quoteNumber}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(quote.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                fontSize={13}
                              >
                                {quote.customerName}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontSize={12}
                                sx={{
                                  color: "#64748b",
                                  maxWidth: 140,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {quote.productName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Tooltip title={formatCurrencyFull(quote.amount)}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  fontSize={13}
                                >
                                  {formatCurrency(quote.amount)}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Chip
                                label={quote.status}
                                size="small"
                                sx={{
                                  bgcolor:
                                    QUOTE_STATUS_BADGE[quote.status]?.bg ||
                                    "#f1f5f9",
                                  color:
                                    QUOTE_STATUS_BADGE[quote.status]?.text ||
                                    "#64748b",
                                  fontWeight: 700,
                                  fontSize: 10,
                                  height: 22,
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ py: 1.5, whiteSpace: "nowrap" }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(quote.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionPaper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
