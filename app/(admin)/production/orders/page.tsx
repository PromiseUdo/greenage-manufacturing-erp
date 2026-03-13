"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Skeleton,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FactoryIcon from "@mui/icons-material/Factory";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

interface TopUpRunSummary {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  quantityPackaged: number | null;
  scheduledStart: string;
  scheduledEnd: string;
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  quantity: number;
  quantityPackaged: number | null;
  shortfallQuantity: number;
  status: string;
  priority: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  progressPercent: number;
  totalActions: number;
  completedActions: number;
  scheduleStatus: string;
  stageCount: number;
  isTopUpRun: boolean;
  parentOrderId: string | null;
  topUpRuns: TopUpRunSummary[];
  product: {
    id: string;
    name: string;
    productNumber: string;
    category: string;
  };
  manager: { id: string; name: string; email: string };
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    DRAFT: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    IN_PROGRESS: { bg: "#DBEAFE", text: "#1E40AF", dot: "#2563EB" },
    ON_HOLD: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    PARTIALLY_COMPLETED: { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
    COMPLETED: { bg: "#DCFCE7", text: "#166534", dot: "#16A34A" },
    CANCELLED: { bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
  };

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#F3F4F6", text: "#6B7280" },
  NORMAL: { bg: "#DBEAFE", text: "#1E40AF" },
  HIGH: { bg: "#FEF3C7", text: "#92400E" },
  URGENT: { bg: "#FEE2E2", text: "#991B1B" },
};

const SCHEDULE_COLORS: Record<string, { bg: string; text: string }> = {
  ON_TRACK: { bg: "#DCFCE7", text: "#166534" },
  AHEAD: { bg: "#EEF2FF", text: "#4338CA" },
  DELAYED: { bg: "#FEE2E2", text: "#991B1B" },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function ProgressRing({ pct }: { pct: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={48} height={48} viewBox="0 0 48 48">
      <circle
        cx={24}
        cy={24}
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={4}
      />
      <circle
        cx={24}
        cy={24}
        r={r}
        fill="none"
        stroke={pct === 100 ? "#16A34A" : "#2563EB"}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <text
        x={24}
        y={28}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#111827"
      >
        {pct}%
      </text>
    </svg>
  );
}

function OrderCard({
  order,
  onClick,
  grouped = false,
  totalRuns = 1,
}: {
  order: ProductionOrder;
  onClick: () => void;
  grouped?: boolean;
  totalRuns?: number;
}) {
  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.DRAFT;
  const pc = PRIORITY_COLORS[order.priority] ?? PRIORITY_COLORS.NORMAL;
  const shc = SCHEDULE_COLORS[order.scheduleStatus] ?? SCHEDULE_COLORS.ON_TRACK;

  return (
    <Box
      onClick={onClick}
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 3,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: "hidden",
        cursor: "pointer",

        transition: "box-shadow 0.2s, transform 0.15s",
        bgcolor: "background.paper",
        "&:hover": {
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          transform: "translateY(-2px)",
        },
        "&:active": { transform: "scale(0.98)" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Coloured top stripe (status) */}
      {/* <Box sx={{ height: 4, bgcolor: sc.dot }} /> */}

      <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1 }}>
        {/* Row 1: Order number + progress ring */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ letterSpacing: 0.5 }}
              >
                {order.orderNumber}
              </Typography>
              {order.isTopUpRun && (
                <Chip
                  label="Top-Up"
                  size="small"
                  sx={{
                    bgcolor: "#EEF2FF",
                    color: "#4338CA",
                    fontWeight: 700,
                    fontSize: "0.6rem",
                    height: 18,
                  }}
                />
              )}
              {grouped && totalRuns > 1 && (
                <Chip
                  label={`Run 1 / ${totalRuns}`}
                  size="small"
                  sx={{
                    bgcolor: "#F5F3FF",
                    color: "#6D28D9",
                    fontWeight: 700,
                    fontSize: "0.6rem",
                    height: 18,
                  }}
                />
              )}
            </Box>
            <Typography
              fontWeight={800}
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                lineHeight: 1.2,
                mt: 0.3,
                maxWidth: 180,
              }}
              noWrap
            >
              {order.product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.product.productNumber}
            </Typography>
          </Box>
          <ProgressRing pct={order.progressPercent} />
        </Box>

        {/* Row 2: Status + Priority chips */}
        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 1.2 }}>
          <Chip
            label={order.status.replace(/_/g, " ")}
            size="small"
            sx={{
              bgcolor: sc.bg,
              color: sc.text,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 20,
            }}
          />
          <Chip
            label={order.priority}
            size="small"
            sx={{
              bgcolor: pc.bg,
              color: pc.text,
              fontWeight: 600,
              fontSize: "0.65rem",
              height: 20,
            }}
          />
          <Chip
            label={order.scheduleStatus.replace(/_/g, " ")}
            size="small"
            sx={{
              bgcolor: shc.bg,
              color: shc.text,
              fontWeight: 600,
              fontSize: "0.65rem",
              height: 20,
            }}
          />
        </Box>

        {/* Row 3: Meta info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", gap: 0.5 }}
          >
            <span style={{ color: "#374151", fontWeight: 600 }}>Qty:</span>
            {order.quantity} units
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", gap: 0.5 }}
          >
            <span style={{ color: "#374151", fontWeight: 600 }}>Manager:</span>
            {order.manager.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", gap: 0.5 }}
          >
            <span style={{ color: "#374151", fontWeight: 600 }}>Timeline:</span>
            {formatDate(order.scheduledStart)} →{" "}
            {formatDate(order.scheduledEnd)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {order.completedActions}/{order.totalActions} steps done
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Compact run row for child top-up runs ─────────────────────────────────
function TopUpRunRow({
  run,
  runIndex,
  onClick,
}: {
  run: TopUpRunSummary;
  runIndex: number;
  onClick: () => void;
}) {
  const sc = STATUS_COLORS[run.status] ?? STATUS_COLORS.DRAFT;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.2,
        cursor: "pointer",
        borderTop: "1px dashed #E5E7EB",
        bgcolor: "#FAFAFA",
        "&:hover": { bgcolor: "#F0F4FF" },
        transition: "background 0.15s",
      }}
    >
      {/* Run index indicator */}
      <Box
        sx={{
          minWidth: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: "#E0E7FF",
          color: "#4338CA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.7rem",
          flexShrink: 0,
        }}
      >
        R{runIndex}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" fontWeight={700} noWrap>
          {run.orderNumber}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {run.quantity} units · {formatDate(run.scheduledStart)} →{" "}
          {formatDate(run.scheduledEnd)}
          {run.quantityPackaged !== null
            ? ` · Packaged: ${run.quantityPackaged}`
            : ""}
        </Typography>
      </Box>
      <Chip
        label={run.status.replace(/_/g, " ")}
        size="small"
        sx={{
          bgcolor: sc.bg,
          color: sc.text,
          fontWeight: 700,
          fontSize: "0.6rem",
          height: 18,
          flexShrink: 0,
        }}
      />
    </Box>
  );
}

// ── Grouped wrapper card with parent + expandable run rows ────────────────
function GroupedOrderCard({
  order,
  onClick,
  onRunClick,
}: {
  order: ProductionOrder;
  onClick: () => void;
  onRunClick: (id: string) => void;
}) {
  const hasRuns = order.topUpRuns.length > 0;
  const [runsOpen, setRunsOpen] = useState(true);
  const totalRuns = 1 + order.topUpRuns.length;

  return (
    <Box
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Parent order card — clickable */}
      <Box
        onClick={onClick}
        sx={{
          cursor: "pointer",
          transition: "background 0.15s",
          "&:hover": { bgcolor: "#F9FAFB" },
          "&:active": { bgcolor: "#F3F4F6" },
        }}
      >
        <OrderCard
          order={order}
          onClick={onClick}
          grouped
          totalRuns={totalRuns}
        />
      </Box>

      {/* Expand/collapse toggle for runs */}
      {hasRuns && (
        <>
          <Box
            onClick={() => setRunsOpen((o) => !o)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: 2,
              py: 0.8,
              bgcolor: "#F3F4F6",
              cursor: "pointer",
              borderTop: "1px solid #E5E7EB",
              "&:hover": { bgcolor: "#EEF2FF" },
              transition: "background 0.15s",
            }}
          >
            <AccountTreeIcon sx={{ fontSize: 14, color: "#6366F1" }} />
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: "#4338CA", flex: 1 }}
            >
              {order.topUpRuns.length} Top-Up Run
              {order.topUpRuns.length !== 1 ? "s" : ""}
            </Typography>
            {runsOpen ? (
              <KeyboardArrowUpIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
            ) : (
              <KeyboardArrowDownIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
            )}
          </Box>
          <Collapse in={runsOpen}>
            {order.topUpRuns.map((run, idx) => (
              <TopUpRunRow
                key={run.id}
                run={run}
                runIndex={idx + 2}
                onClick={() => onRunClick(run.id)}
              />
            ))}
          </Collapse>
        </>
      )}
    </Box>
  );
}

export default function ProductionOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 24;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const res = await fetch(`/api/production/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const inProgress = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const completed = orders.filter((o) => o.status === "COMPLETED").length;
  const onSchedule = orders.filter(
    (o) => o.scheduleStatus === "ON_TRACK" || o.scheduleStatus === "AHEAD",
  ).length;

  const kpis = [
    {
      label: "Total Orders",
      value: total,
      icon: <FactoryIcon />,
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: <PlayArrowIcon />,
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      label: "Completed",
      value: completed,
      icon: <CheckCircleIcon />,
      color: "#16A34A",
      bg: "#DCFCE7",
    },
    {
      label: "On Schedule",
      value: onSchedule,
      icon: <TrendingUpIcon />,
      color: "#D97706",
      bg: "#FEF3C7",
    },
  ];

  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Production Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track production workflows
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/production/orders/new")}
          sx={{
            bgcolor: "#16A34A",
            "&:hover": { bgcolor: "#15803D" },
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1,
          }}
        >
          New Order
        </Button>
      </Box>

      {/* KPI strip */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
            <Box
              sx={{
                p: 1.5,
                border: "1px solid #E5E7EB",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: kpi.bg,
                  color: kpi.color,
                  flexShrink: 0,
                }}
              >
                {kpi.icon}
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  color={kpi.color}
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.4rem" } }}
                >
                  {loading ? <Skeleton width={32} /> : kpi.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2 }}
                >
                  {kpi.label}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Search + Filter bar */}
      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search orders, products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
          }}
        />
        <Tooltip title="Filters">
          <IconButton
            onClick={() => setShowFilters((f) => !f)}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              bgcolor: showFilters ? "#EEF2FF" : "transparent",
              color: showFilters ? "#4338CA" : "text.secondary",
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchOrders}
            sx={{ border: "1px solid #E5E7EB", borderRadius: 2 }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter chips (expandable) */}
      {showFilters && (
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[
            "",
            "DRAFT",
            "IN_PROGRESS",
            "ON_HOLD",
            "PARTIALLY_COMPLETED",
            "COMPLETED",
            "CANCELLED",
          ].map((s) => (
            <Chip
              key={s || "all-status"}
              label={s ? s.replace(/_/g, " ") : "All Status"}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                cursor: "pointer",
                bgcolor: statusFilter === s ? "#1E40AF" : "#F3F4F6",
                color: statusFilter === s ? "#fff" : "#374151",
                "& :hover": { opacity: 0.9 },
              }}
            />
          ))}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              mt: 0.5,
            }}
          >
            {["", "LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
              <Chip
                key={p || "all-priority"}
                label={p || "All Priority"}
                onClick={() => {
                  setPriorityFilter(p);
                  setPage(1);
                }}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  bgcolor: priorityFilter === p ? "#92400E" : "#F3F4F6",
                  color: priorityFilter === p ? "#fff" : "#374151",
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Cards grid */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton
                variant="rounded"
                height={220}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <FactoryIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No production orders found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/production/orders/new")}
            sx={{
              mt: 1,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
            }}
          >
            Create your first order
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {orders
            .filter((o) => o.parentOrderId === null)
            .map((order) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={order.id}>
                <GroupedOrderCard
                  order={order}
                  onClick={() =>
                    router.push(`/production/orders/${order.id}/overview`)
                  }
                  onRunClick={(id) =>
                    router.push(`/production/orders/${id}/overview`)
                  }
                />
              </Grid>
            ))}
        </Grid>
      )}

      {/* Load more */}
      {!loading && orders.length < total && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setPage((p) => p + 1)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2.5,
              px: 4,
            }}
          >
            Load more ({total - orders.length} remaining)
          </Button>
        </Box>
      )}
    </Box>
  );
}
