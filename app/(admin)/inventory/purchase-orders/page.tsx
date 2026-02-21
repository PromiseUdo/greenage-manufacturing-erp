"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
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
  TextField,
  InputAdornment,
  styled,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Description as POIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// === Types ===
interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  createdAt: string;
  supplierId: string;
  items: any[];
  supplier: { id: string; name: string };
  grn: any;
  payments: Payment[];
  group?: { id: string; groupNumber: string; name: string } | null;
  // Planned fields
  plannedInvoiceStartDate?: string;
  plannedInvoiceEndDate?: string;
  plannedPaymentStartDate?: string;
  plannedPaymentEndDate?: string;
  plannedShipmentStartDate?: string;
  plannedShipmentEndDate?: string;
  plannedEstimatedArrival?: string;
  plannedReceivingStartDate?: string;
  plannedReceivingEndDate?: string;
  // Actual fields
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  paymentStartDate?: string;
  paymentEndDate?: string;
  shipmentStartDate?: string;
  shipmentEndDate?: string;
  receivingStartDate?: string;
  receivingEndDate?: string;
}

// === Styled Components ===
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    padding: "14px 16px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: "12px 16px",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  cursor: "pointer",
  transition: "all 0.15s ease-in-out",
  "&:nth-of-type(odd)": { backgroundColor: "#FAFBFC" },
  "&:hover": {
    backgroundColor: "#EEF2FF",
    transform: "scale(1.001)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
}));

// === Helper Functions ===
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
  PLANNED: { label: "Planned", color: "#7c3aed", bg: "#ede9fe" },
  INVOICED: { label: "Invoiced", color: "#0369a1", bg: "#e0f2fe" },
  PAYMENT_TRACKING: { label: "Payment", color: "#c2410c", bg: "#fff7ed" },
  SHIPMENT_TRACKING: { label: "Shipment", color: "#0d9488", bg: "#ccfbf1" },
  RECEIVING: { label: "Receiving", color: "#4f46e5", bg: "#eef2ff" },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
};

function getHealthStatus(po: PurchaseOrder): {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
} {
  const now = new Date();

  // Check for overdue stages — actual end date exceeded planned end date
  const stages = [
    { actual: po.invoiceEndDate, planned: po.plannedInvoiceEndDate },
    { actual: po.paymentEndDate, planned: po.plannedPaymentEndDate },
    { actual: po.shipmentEndDate, planned: po.plannedShipmentEndDate },
    { actual: po.receivingEndDate, planned: po.plannedReceivingEndDate },
  ];
  const hasOverdue = stages.some(
    (s) => s.actual && s.planned && new Date(s.actual) > new Date(s.planned),
  );

  // Check for upcoming overdue — planned end in the past but no actual end yet
  const hasUpcomingOverdue = stages.some(
    (s) => !s.actual && s.planned && new Date(s.planned) < now,
  );

  // Check payment
  const paymentIncomplete =
    po.totalAmount > 0 &&
    (po.paidAmount || 0) < po.totalAmount &&
    ["SHIPMENT_TRACKING", "RECEIVING", "COMPLETED"].includes(po.status);

  if (hasOverdue) {
    return {
      label: "Overdue",
      color: "#b91c1c",
      bg: "#fef2f2",
      icon: <ErrorIcon sx={{ fontSize: 16, color: "#b91c1c" }} />,
    };
  }
  if (hasUpcomingOverdue) {
    return {
      label: "At Risk",
      color: "#d97706",
      bg: "#fffbeb",
      icon: <WarningIcon sx={{ fontSize: 16, color: "#d97706" }} />,
    };
  }
  if (paymentIncomplete) {
    return {
      label: "Payment Due",
      color: "#92400e",
      bg: "#fef3c7",
      icon: <MoneyIcon sx={{ fontSize: 16, color: "#92400e" }} />,
    };
  }
  if (po.status === "COMPLETED") {
    return {
      label: "On Track",
      color: "#16a34a",
      bg: "#dcfce7",
      icon: <CheckIcon sx={{ fontSize: 16, color: "#16a34a" }} />,
    };
  }
  if (po.status === "CANCELLED") {
    return { label: "Cancelled", color: "#64748b", bg: "#f1f5f9", icon: null };
  }
  return {
    label: "On Track",
    color: "#0369a1",
    bg: "#e0f2fe",
    icon: <TrendingIcon sx={{ fontSize: 16, color: "#0369a1" }} />,
  };
}

// === Stat Card Component ===
function StatCard({
  title,
  value,
  color,
  bg,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        flex: "1 1 180px",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: bg,
        transition: "transform 0.15s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: color,
          color: "#fff",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} color={color}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

// === Main Page ===
export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/inventory/purchase-orders?${params}`);
      const data = await res.json();
      setPurchaseOrders(data.purchaseOrders || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch POs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  // Compute stats
  const stats = {
    total: total,
    active: purchaseOrders.filter(
      (po) => !["COMPLETED", "CANCELLED", "DRAFT"].includes(po.status),
    ).length,
    overdue: purchaseOrders.filter(
      (po) =>
        getHealthStatus(po).label === "Overdue" ||
        getHealthStatus(po).label === "At Risk",
    ).length,
    completed: purchaseOrders.filter((po) => po.status === "COMPLETED").length,
    paymentDue: purchaseOrders.filter((po) => {
      const paymentInc =
        po.totalAmount > 0 && (po.paidAmount || 0) < po.totalAmount;
      return (
        paymentInc && !["DRAFT", "PLANNED", "CANCELLED"].includes(po.status)
      );
    }).length,
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        {/* <POIcon sx={{ fontSize: 32, color: "#0F172A" }} /> */}
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0F172A">
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor all purchase orders across suppliers
          </Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
        <StatCard
          title="Total POs"
          value={stats.total}
          color="#0F172A"
          bg="#f8fafc"
          icon={<POIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Active"
          value={stats.active}
          color="#0369a1"
          bg="#e0f2fe"
          icon={<ClockIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Overdue / At Risk"
          value={stats.overdue}
          color="#b91c1c"
          bg="#fef2f2"
          icon={<WarningIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          color="#16a34a"
          bg="#dcfce7"
          icon={<CheckIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Payment Due"
          value={stats.paymentDue}
          color="#92400e"
          bg="#fef3c7"
          icon={<MoneyIcon sx={{ fontSize: 22 }} />}
        />
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search PO number or supplier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: "1 1 300px", minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <MenuItem key={key} value={key}>
                {val.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {loading && <LinearProgress sx={{ height: 3 }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>PO Number</StyledTableCell>
                <StyledTableCell>Supplier</StyledTableCell>
                <StyledTableCell>Group</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="right">Total</StyledTableCell>
                <StyledTableCell align="right">Paid</StyledTableCell>
                <StyledTableCell align="center">Progress</StyledTableCell>
                <StyledTableCell align="center">Health</StyledTableCell>
                <StyledTableCell>Created</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Loading purchase orders...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <POIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No purchase orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => {
                  const statusConf =
                    STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
                  const health = getHealthStatus(po);
                  const paidPct =
                    po.totalAmount > 0
                      ? Math.min(
                          ((po.paidAmount || 0) / po.totalAmount) * 100,
                          100,
                        )
                      : 0;

                  return (
                    <StyledTableRow
                      key={po.id}
                      onClick={() =>
                        router.push(`/inventory/purchase-orders/${po.id}`)
                      }
                    >
                      <StyledTableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#0F172A"
                        >
                          {po.poNumber}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2">
                          {po.supplier?.name || "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {po.group ? (
                          <Chip
                            label={po.group.name}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/inventory/po-groups/${po.group!.id}`,
                              );
                            }}
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              bgcolor: "#ede9fe",
                              color: "#6d28d9",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#ddd6fe" },
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={statusConf.label}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor: statusConf.bg,
                            color: statusConf.color,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ₦
                          {(po.totalAmount || 0).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              paidPct >= 100
                                ? "#16a34a"
                                : paidPct > 0
                                  ? "#d97706"
                                  : "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          ₦
                          {(po.paidAmount || 0).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title={`${paidPct.toFixed(0)}% paid`}>
                          <Box sx={{ width: 80, mx: "auto" }}>
                            <LinearProgress
                              variant="determinate"
                              value={paidPct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor:
                                    paidPct >= 100
                                      ? "#16a34a"
                                      : paidPct > 0
                                        ? "#f59e0b"
                                        : "#cbd5e1",
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title={health.label}>
                          <Chip
                            icon={health.icon as any}
                            label={health.label}
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: health.bg,
                              color: health.color,
                              "& .MuiChip-icon": { color: health.color },
                            }}
                          />
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(po.createdAt), "dd MMM yyyy")}
                        </Typography>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>
    </Box>
  );
}
