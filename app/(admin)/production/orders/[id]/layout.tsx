"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Skeleton,
  IconButton,
  Tooltip,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle,
  TextField,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FactoryIcon from "@mui/icons-material/Factory";
import RefreshIcon from "@mui/icons-material/Refresh";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VerifiedIcon from "@mui/icons-material/Verified";
import TimelineIcon from "@mui/icons-material/Timeline";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CircularProgress from "@mui/material/CircularProgress";

interface TopUpRun {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  quantityPackaged: number | null;
}

interface ParentOrderRef {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
}

interface ProductionOrderSummary {
  id: string;
  orderNumber: string;
  quantity: number;
  quantityStarted: number | null;
  quantityPassed: number | null;
  quantityRejected: number | null;
  quantityPackaged: number | null;
  yieldRate: number | null;
  shortfallQuantity: number;
  status: string;
  priority: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  notes: string | null;
  progressPercent: number;
  totalActions: number;
  completedActions: number;
  scheduleStatus: string;
  isTopUpRun: boolean;
  parentOrderId: string | null;
  parentOrder: ParentOrderRef | null;
  topUpRuns: TopUpRun[];
  product: {
    id: string;
    name: string;
    productNumber: string;
    category: string;
  };
  manager: { id: string; name: string; email: string };
  stages: any[];
}

interface OrderContextType {
  order: ProductionOrderSummary | null;
  loading: boolean;
  refresh: () => void;
}

const OrderContext = createContext<OrderContextType>({
  order: null,
  loading: true,
  refresh: () => {},
});
export const useOrderContext = () => useContext(OrderContext);

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  DRAFT: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  ON_HOLD: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  PARTIALLY_COMPLETED: { bg: "#FEF3C7", text: "#B45309", border: "#F59E0B" },
  COMPLETED: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};

const SCHEDULE_COLORS: Record<string, { bg: string; text: string }> = {
  ON_TRACK: { bg: "#DBEAFE", text: "#1E40AF" },
  AHEAD: { bg: "#DCFCE7", text: "#166534" },
  DELAYED: { bg: "#FEE2E2", text: "#991B1B" },
};

const TABS = [
  { label: "Overview", path: "overview", icon: <DashboardIcon /> },
  { label: "Process", path: "tracking", icon: <TrackChangesIcon /> },
  { label: "QC Log", path: "quality", icon: <VerifiedIcon /> },
  { label: "Materials", path: "materials", icon: <Inventory2Icon /> },
  { label: "Timeline", path: "timeline", icon: <TimelineIcon /> },
];

// ── Complete dialog: asks for final packaged qty before closing ───────────
function CompleteOrderDialog({
  open,
  order,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  order: ProductionOrderSummary;
  onClose: () => void;
  onConfirm: (qty: number) => void;
  loading: boolean;
}) {
  const [packaged, setPackaged] = useState<string>(
    order.quantityPackaged !== null
      ? String(order.quantityPackaged)
      : String(order.quantity)
  );

  const qty = parseInt(packaged) || 0;
  const shortfall = order.quantity - qty;
  const hasShortfall = qty < order.quantity;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Close Production Order</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the final number of units packaged for{" "}
          <strong>{order.orderNumber}</strong> (planned:{" "}
          <strong>{order.quantity}</strong> units).
        </Typography>
        <TextField
          label="Units Packaged"
          type="number"
          fullWidth
          value={packaged}
          onChange={(e) => setPackaged(e.target.value)}
          inputProps={{ min: 0, max: order.quantity }}
          sx={{ mb: 2 }}
          size="small"
        />
        {hasShortfall && qty > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />}>
            <AlertTitle sx={{ fontWeight: 700 }}>Shortfall Detected</AlertTitle>
            {shortfall} unit{shortfall !== 1 ? "s" : ""} short of the {order.quantity}{" "}
            planned. This order will be marked{" "}
            <strong>Partially Completed</strong>. You can create a{" "}
            <strong>Top-Up Run</strong> afterward to produce the remaining{" "}
            {shortfall} unit{shortfall !== 1 ? "s" : ""}.
          </Alert>
        )}
        {!hasShortfall && qty > 0 && (
          <Alert severity="success">
            All {order.quantity} planned units packaged — order will be marked{" "}
            <strong>Completed</strong>.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(qty)}
          variant="contained"
          disabled={loading || qty < 1}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: hasShortfall ? "#D97706" : "#16A34A",
            "&:hover": { bgcolor: hasShortfall ? "#B45309" : "#15803D" },
          }}
        >
          {loading ? (
            <CircularProgress size={14} color="inherit" sx={{ mr: 0.5 }} />
          ) : null}
          {hasShortfall
            ? "Close with Shortfall"
            : "Mark Complete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Top-Up Run dialog ─────────────────────────────────────────────────────
function TopUpRunDialog({
  open,
  order,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  order: ProductionOrderSummary;
  onClose: () => void;
  onConfirm: (qty: number, start: string, end: string, notes: string) => void;
  loading: boolean;
}) {
  const shortfall = order.shortfallQuantity;
  const [qty, setQty] = useState<string>(String(shortfall));
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <AddCircleOutlineIcon sx={{ color: "#2563EB" }} />
        Create Top-Up Run
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>
            Shortfall: {shortfall} unit{shortfall !== 1 ? "s" : ""}
          </AlertTitle>
          <strong>{order.orderNumber}</strong> produced {order.quantityPackaged ?? 0} of{" "}
          {order.quantity} planned units. A new DRAFT production order will be created
          to manufacture the remaining units.
        </Alert>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Quantity to Produce"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputProps={{ min: 1, max: shortfall }}
            size="small"
            fullWidth
            helperText={`Maximum: ${shortfall} unit${shortfall !== 1 ? "s" : ""}`}
          />
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              label="Scheduled Start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Scheduled End"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            label="Notes (optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
            fullWidth
            placeholder={`Top-up run for ${order.orderNumber}…`}
          />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() =>
            onConfirm(parseInt(qty) || shortfall, startDate, endDate, notes)
          }
          variant="contained"
          disabled={loading || !startDate || !endDate || parseInt(qty) < 1}
          sx={{
            bgcolor: "#2563EB",
            "&:hover": { bgcolor: "#1D4ED8" },
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          {loading ? (
            <CircularProgress size={14} color="inherit" sx={{ mr: 0.5 }} />
          ) : null}
          Create Top-Up Run
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProductionOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const orderId = params.id as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { data: session } = useSession();

  const [order, setOrder] = useState<ProductionOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/production/orders/${orderId}`);
      if (!res.ok) return;
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const activeTabPath =
    TABS.find((t) => pathname?.includes(`/${t.path}`))?.path ?? "overview";
  const activeTabIndex = TABS.findIndex((t) => t.path === activeTabPath);

  const handleTabChange = (_: any, newIndex: number) => {
    router.push(`/production/orders/${orderId}/${TABS[newIndex].path}`);
  };

  const updateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/production/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  // Complete with explicit packaged qty
  const handleCompleteConfirm = async (packagedQty: number) => {
    setActionLoading(true);
    try {
      await fetch(`/api/production/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          quantityPackaged: packagedQty,
        }),
      });
      setCompleteDialogOpen(false);
      await fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  // Create top-up run
  const handleTopUpConfirm = async (
    qty: number,
    scheduledStart: string,
    scheduledEnd: string,
    notes: string
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, scheduledStart, scheduledEnd, notes }),
      });
      if (res.ok) {
        const newOrder = await res.json();
        setTopUpDialogOpen(false);
        await fetchOrder();
        // Navigate to the newly created top-up order
        router.push(`/production/orders/${newOrder.id}/overview`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create top-up run");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/production/orders");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete order");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const userRole = session?.user?.role;
  const canDelete =
    order?.status === "DRAFT" &&
    (userRole === "ADMIN" ||
      userRole === "PRODUCTION_MANAGER" ||
      // @ts-ignore
      session?.user?.permissions?.includes("production_orders:delete"));

  const isManager =
    userRole === "ADMIN" ||
    userRole === "PRODUCTION_MANAGER" ||
    userRole === "OPERATION_MANAGER";

  const sc = STATUS_COLORS[order?.status ?? "DRAFT"] ?? STATUS_COLORS.DRAFT;
  const shc =
    SCHEDULE_COLORS[order?.scheduleStatus ?? "ON_TRACK"] ??
    SCHEDULE_COLORS.ON_TRACK;

  const hasShortfall =
    order?.status === "PARTIALLY_COMPLETED" && (order?.shortfallQuantity ?? 0) > 0;

  // Shared action buttons renderer
  const renderActionButtons = (mobile = false) => {
    if (!order) return null;
    const btnSize = mobile ? "small" : "small";
    return (
      <>
        {canDelete && (
          <Button
            size={btnSize}
            variant={mobile ? "text" : "outlined"}
            color="error"
            startIcon={mobile ? undefined : <DeleteIcon />}
            onClick={handleDelete}
            disabled={actionLoading}
            sx={{ textTransform: "none", borderRadius: 2, minWidth: 0 }}
          >
            {mobile ? <DeleteIcon fontSize="small" /> : "Delete"}
          </Button>
        )}
        {order.status === "DRAFT" && (
          <Button
            size={btnSize}
            variant="contained"
            startIcon={
              actionLoading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={() => updateStatus("IN_PROGRESS")}
            disabled={actionLoading}
            sx={{
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Start{!mobile ? " Production" : ""}
          </Button>
        )}
        {order.status === "IN_PROGRESS" && (
          <>
            <Button
              size={btnSize}
              variant="outlined"
              startIcon={<PauseIcon />}
              onClick={() => updateStatus("ON_HOLD")}
              disabled={actionLoading}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Hold
            </Button>
            <Button
              size={btnSize}
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => setCompleteDialogOpen(true)}
              disabled={actionLoading}
              sx={{
                bgcolor: "#16A34A",
                "&:hover": { bgcolor: "#15803D" },
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Complete
            </Button>
          </>
        )}
        {order.status === "ON_HOLD" && (
          <Button
            size={btnSize}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => updateStatus("IN_PROGRESS")}
            disabled={actionLoading}
            sx={{
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Resume
          </Button>
        )}
        {hasShortfall && isManager && (
          <Button
            size={btnSize}
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setTopUpDialogOpen(true)}
            disabled={actionLoading}
            sx={{
              bgcolor: "#D97706",
              "&:hover": { bgcolor: "#B45309" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Top-Up Run
          </Button>
        )}
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={fetchOrder}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    );
  };

  return (
    <OrderContext.Provider value={{ order, loading, refresh: fetchOrder }}>
      {/* ── Mobile: Sticky header ── */}
      {isMobile && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 1.5,
            py: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => router.push("/production/orders")}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <Skeleton width={160} height={20} />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {order?.orderNumber}
                  </Typography>
                  <Chip
                    label={order?.status?.replace(/_/g, " ")}
                    size="small"
                    sx={{
                      bgcolor: sc.bg,
                      color: sc.text,
                      fontWeight: 700,
                      fontSize: "0.6rem",
                      height: 18,
                    }}
                  />
                  {order?.isTopUpRun && (
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
                </Box>
              )}
              {!loading && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "block" }}
                >
                  {order?.product.name} · {order?.quantity} units
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
              {renderActionButtons(true)}
            </Box>
          </Box>

          {/* Mini progress bar */}
          {!loading && order && (
            <Box
              sx={{ mt: 0.8, display: "flex", alignItems: "center", gap: 1 }}
            >
              <LinearProgress
                variant="determinate"
                value={order.progressPercent}
                sx={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  bgcolor: "#E5E7EB",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor:
                      order.progressPercent === 100 ? "#16A34A" : "#2563EB",
                  },
                }}
              />
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ minWidth: 28, fontSize: "0.65rem" }}
              >
                {order.progressPercent}%
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                {order.completedActions}/{order.totalActions}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* ── Desktop: Traditional top header ── */}
      {!isMobile && (
        <Box sx={{ py: 3 }}>
          {/* Breadcrumb */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconButton
              size="small"
              onClick={() => router.push("/production/orders")}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              Production Orders /
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {loading ? <Skeleton width={120} /> : order?.orderNumber}
            </Typography>
            {!loading && order?.isTopUpRun && (
              <Chip
                label="Top-Up Run"
                size="small"
                sx={{
                  bgcolor: "#EEF2FF",
                  color: "#4338CA",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Box>

          {/* Parent order back-link for top-up runs */}
          {!loading && order?.parentOrder && (
            <Box
              sx={{
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.8,
                bgcolor: "#EEF2FF",
                borderRadius: 2,
                border: "1px solid #C7D2FE",
              }}
            >
              <Typography variant="caption" color="#4338CA" fontWeight={600}>
                🔗 Top-up run for parent order:
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() =>
                  router.push(
                    `/production/orders/${order.parentOrder!.id}/overview`
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#4338CA",
                  p: 0,
                  minWidth: 0,
                  "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                }}
              >
                {order.parentOrder.orderNumber}
              </Button>
              <Chip
                label={order.parentOrder.status.replace(/_/g, " ")}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  bgcolor: STATUS_COLORS[order.parentOrder.status]?.bg ?? "#E5E7EB",
                  color: STATUS_COLORS[order.parentOrder.status]?.text ?? "#374151",
                }}
              />
            </Box>
          )}

          {/* Order header card */}
          <Box
            sx={{
              p: 2.5,
              mb: 0,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: sc.border,
              borderRadius: "12px 12px 0 0",
              backgroundImage: `linear-gradient(135deg, ${sc.bg}80 0%, rgba(255,255,255,0) 60%)`,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: sc.bg,
                  border: `1px solid ${sc.border}`,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FactoryIcon sx={{ color: sc.text }} />
              </Box>
              <Box>
                {loading ? (
                  <Skeleton width={260} height={32} />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="h5" fontWeight={800}>
                      {order?.orderNumber}
                    </Typography>
                    <Chip
                      label={order?.status.replace(/_/g, " ")}
                      size="small"
                      sx={{
                        bgcolor: sc.bg,
                        color: sc.text,
                        fontWeight: 700,
                        border: `1px solid ${sc.border}`,
                      }}
                    />
                    <Chip
                      label={order?.scheduleStatus.replace(/_/g, " ")}
                      size="small"
                      sx={{ bgcolor: shc.bg, color: shc.text, fontWeight: 600 }}
                    />
                    <Chip
                      label={order?.priority}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {loading ? (
                    <Skeleton width={340} />
                  ) : (
                    `${order?.product.name} (${order?.product.productNumber}) · ${order?.quantity} units · Manager: ${order?.manager.name}`
                  )}
                </Typography>
                {!loading && order && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                      minWidth: 300,
                    }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={order.progressPercent}
                      sx={{
                        flex: 1,
                        height: 7,
                        borderRadius: 4,
                        bgcolor: "#E5E7EB",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background:
                            order.progressPercent === 100
                              ? "#16A34A"
                              : "linear-gradient(90deg, #2563EB, #6366F1)",
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ minWidth: 36 }}
                    >
                      {order.progressPercent}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({order.completedActions}/{order.totalActions} steps)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Action buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {renderActionButtons(false)}
            </Box>
          </Box>

          {/* ── Shortfall alert banner ── */}
          {!loading && hasShortfall && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{
                borderRadius: 0,
                borderLeft: "1px solid",
                borderRight: "1px solid",
                borderBottom: "none",
                borderColor: "#F59E0B",
                "& .MuiAlert-message": { width: "100%" },
              }}
              action={
                isManager ? (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setTopUpDialogOpen(true)}
                    sx={{
                      bgcolor: "#D97706",
                      "&:hover": { bgcolor: "#B45309" },
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Create Top-Up Run
                  </Button>
                ) : undefined
              }
            >
              <AlertTitle sx={{ fontWeight: 700 }}>
                Shortfall: {order?.shortfallQuantity} unit{order?.shortfallQuantity !== 1 ? "s" : ""} remaining
              </AlertTitle>
              This order was closed with{" "}
              <strong>{order?.quantityPackaged ?? 0}</strong> of{" "}
              <strong>{order?.quantity}</strong> planned units packaged. Create a
              top-up run to produce the remaining{" "}
              <strong>{order?.shortfallQuantity}</strong> unit
              {order?.shortfallQuantity !== 1 ? "s" : ""}.
            </Alert>
          )}

          {/* Desktop Tab Bar */}
          <Box
            sx={{
              bgcolor: "background.paper",
              borderLeft: "1px solid",
              borderRight: "1px solid",
              borderBottom: "1px solid",
              borderColor: "divider",
              borderRadius: hasShortfall ? "0 0 12px 12px" : "0 0 12px 12px",
              overflowX: "auto",
            }}
          >
            <Box sx={{ display: "flex", px: 2 }}>
              {TABS.map((tab, idx) => {
                const isActive =
                  idx === (activeTabIndex === -1 ? 0 : activeTabIndex);
                return (
                  <Box
                    key={tab.path}
                    onClick={() =>
                      router.push(`/production/orders/${orderId}/${tab.path}`)
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: isActive
                        ? "2px solid #2563EB"
                        : "2px solid transparent",
                      color: isActive ? "#2563EB" : "text.secondary",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s, border-color 0.15s",
                      "&:hover": { color: "#2563EB" },
                    }}
                  >
                    <Box sx={{ fontSize: 16, display: "flex" }}>{tab.icon}</Box>
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: 3 }}>{children}</Box>
        </Box>
      )}

      {/* Mobile content area */}
      {isMobile && (
        <Box sx={{ px: 1.5, pt: 2, pb: 10 }}>
          {/* Mobile shortfall banner */}
          {!loading && hasShortfall && (
            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>
                Shortfall: {order?.shortfallQuantity} units
              </AlertTitle>
              {order?.quantityPackaged ?? 0} of {order?.quantity} units packaged.
              {isManager && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => setTopUpDialogOpen(true)}
                  sx={{
                    mt: 1,
                    display: "flex",
                    bgcolor: "#D97706",
                    "&:hover": { bgcolor: "#B45309" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  Create Top-Up Run
                </Button>
              )}
            </Alert>
          )}
          {children}
        </Box>
      )}

      {/* ── Mobile: Bottom tab bar (fixed) ── */}
      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <BottomNavigation
            value={activeTabIndex === -1 ? 0 : activeTabIndex}
            onChange={handleTabChange}
            sx={{
              height: 60,
              "& .MuiBottomNavigationAction-root": {
                minWidth: 0,
                fontSize: "0.6rem",
                padding: "6px 0 8px",
                gap: 0.3,
                color: "text.secondary",
              },
              "& .Mui-selected": { color: "#2563EB" },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.6rem !important",
              },
            }}
          >
            {TABS.map((tab) => (
              <BottomNavigationAction
                key={tab.path}
                label={tab.label}
                icon={tab.icon}
                showLabel
              />
            ))}
          </BottomNavigation>
        </Box>
      )}

      {/* ── Dialogs ── */}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this DRAFT production order? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete with packaged qty dialog */}
      {order && (
        <CompleteOrderDialog
          open={completeDialogOpen}
          order={order}
          onClose={() => setCompleteDialogOpen(false)}
          onConfirm={handleCompleteConfirm}
          loading={actionLoading}
        />
      )}

      {/* Top-Up Run dialog */}
      {order && hasShortfall && (
        <TopUpRunDialog
          open={topUpDialogOpen}
          order={order}
          onClose={() => setTopUpDialogOpen(false)}
          onConfirm={handleTopUpConfirm}
          loading={actionLoading}
        />
      )}
    </OrderContext.Provider>
  );
}
