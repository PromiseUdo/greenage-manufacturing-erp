"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
  Button,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Description as POIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  OpenInNew as OpenIcon,
  Schedule as ClockIcon,
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
  createdBy: string;
  notes?: string;
  items: any[];
  supplier: { id: string; name: string };
  grn: any;
  payments: Payment[];
  // Planned
  plannedInvoiceStartDate?: string;
  plannedInvoiceEndDate?: string;
  plannedPaymentStartDate?: string;
  plannedPaymentEndDate?: string;
  plannedShipmentMethod?: string;
  plannedShipmentStartDate?: string;
  plannedShipmentEndDate?: string;
  plannedEstimatedArrival?: string;
  plannedReceivingStartDate?: string;
  plannedReceivingEndDate?: string;
  // Actual
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  paymentStartDate?: string;
  paymentEndDate?: string;
  paymentMethod?: string;
  shipmentMethod?: string;
  trackingNumber?: string;
  shipmentStartDate?: string;
  shipmentEndDate?: string;
  estimatedArrival?: string;
  receivingStartDate?: string;
  receivingEndDate?: string;
}

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

const STATUS_STEP_MAP: Record<string, number> = {
  DRAFT: 0,
  PLANNED: 1,
  INVOICED: 2,
  PAYMENT_TRACKING: 3,
  SHIPMENT_TRACKING: 4,
  RECEIVING: 5,
  COMPLETED: 6,
};

function dayDiff(
  actual: string | null | undefined,
  planned: string | null | undefined,
): number | null {
  if (!actual || !planned) return null;
  const diffMs = new Date(actual).getTime() - new Date(planned).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// === Info Card ===
function InfoCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        flex: "1 1 200px",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{ color: color || "#0F172A", mt: 0.5 }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

// === Main Component ===
export default function PurchaseOrderReportPage({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = use(params);
  const router = useRouter();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const res = await fetch(`/api/inventory/purchase-orders/${poId}`);
        if (!res.ok) throw new Error("Failed to fetch PO");
        const data = await res.json();
        setPO(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [poId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!po) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Purchase order not found.
        </Typography>
        <Button
          onClick={() => router.push("/inventory/purchase-orders")}
          sx={{ mt: 2 }}
        >
          Back to Purchase Orders
        </Button>
      </Box>
    );
  }

  const statusConf = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
  const paidAmount = po.paidAmount || 0;
  const remaining = po.totalAmount - paidAmount;
  const paidPct =
    po.totalAmount > 0 ? Math.min((paidAmount / po.totalAmount) * 100, 100) : 0;
  const paymentIncomplete =
    po.totalAmount > 0 &&
    paidAmount < po.totalAmount &&
    !["DRAFT", "PLANNED", "INVOICED"].includes(po.status);
  const currentStep = STATUS_STEP_MAP[po.status] ?? 0;

  // Planned vs Actual stages
  const stages = [
    {
      label: "Invoice",
      plannedStart: po.plannedInvoiceStartDate,
      plannedEnd: po.plannedInvoiceEndDate,
      actualStart: po.invoiceStartDate,
      actualEnd: po.invoiceEndDate,
    },
    {
      label: "Payment",
      plannedStart: po.plannedPaymentStartDate,
      plannedEnd: po.plannedPaymentEndDate,
      actualStart: po.paymentStartDate,
      actualEnd: po.paymentEndDate,
    },
    {
      label: "Shipment",
      plannedStart: po.plannedShipmentStartDate,
      plannedEnd: po.plannedShipmentEndDate,
      actualStart: po.shipmentStartDate,
      actualEnd: po.shipmentEndDate,
    },
    {
      label: "Receiving",
      plannedStart: po.plannedReceivingStartDate,
      plannedEnd: po.plannedReceivingEndDate,
      actualStart: po.receivingStartDate,
      actualEnd: po.receivingEndDate,
    },
  ];

  const hasAnyPlanned = stages.some((s) => s.plannedStart || s.plannedEnd);
  const overdueStages = stages.filter(
    (s) =>
      s.actualEnd &&
      s.plannedEnd &&
      new Date(s.actualEnd) > new Date(s.plannedEnd),
  );
  const atRiskStages = stages.filter(
    (s) => !s.actualEnd && s.plannedEnd && new Date(s.plannedEnd) < new Date(),
  );

  const stepLabels = [
    "Draft",
    "Planning",
    "Invoice",
    "Payment",
    "Shipment",
    "Receiving",
    "Completed",
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/inventory/purchase-orders")}
          sx={{ color: "#64748b" }}
        >
          All POs
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* <POIcon sx={{ fontSize: 28, color: "#0F172A" }} /> */}
            <Box>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {po.poNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {po.supplier?.name} • Created{" "}
                {format(new Date(po.createdAt), "dd MMM yyyy")}
                {po.createdBy && ` by ${po.createdBy}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Chip
              label={statusConf.label}
              sx={{
                fontWeight: 700,
                bgcolor: statusConf.bg,
                color: statusConf.color,
                fontSize: 13,
                px: 1,
              }}
            />
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenIcon />}
              onClick={() =>
                router.push(
                  `/inventory/suppliers/${po.supplierId}/sourcing/${po.id}`,
                )
              }
              sx={{ fontWeight: 600, borderColor: "#0F172A", color: "#0F172A" }}
            >
              Open Workflow
            </Button>
          </Box>
        </Box>

        {/* Step indicator */}
        <Box sx={{ display: "flex", gap: 0.5, mt: 3, flexWrap: "wrap" }}>
          {stepLabels.map((label, i) => {
            // Payment step (index 3) shows amber when incomplete
            const isPaymentIncomplete =
              i === 3 && paymentIncomplete && i < currentStep;
            return (
              <Box
                key={label}
                sx={{
                  flex: 1,
                  py: 0.75,
                  px: 1,
                  textAlign: "center",
                  bgcolor: isPaymentIncomplete
                    ? "#fef3c7"
                    : i < currentStep
                      ? "#dcfce7"
                      : i === currentStep
                        ? "#0F172A"
                        : "#f1f5f9",
                  color: isPaymentIncomplete
                    ? "#92400e"
                    : i < currentStep
                      ? "#16a34a"
                      : i === currentStep
                        ? "#fff"
                        : "#94a3b8",
                  fontWeight:
                    i === currentStep || isPaymentIncomplete ? 700 : 500,
                  fontSize: 11,
                  borderRadius:
                    i === 0
                      ? "6px 0 0 6px"
                      : i === stepLabels.length - 1
                        ? "0 6px 6px 0"
                        : 0,
                  letterSpacing: "0.3px",
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Alerts */}
      {overdueStages.length > 0 && (
        <Alert severity="error" sx={{ mb: 2, border: "1px solid #fecaca" }}>
          <Typography variant="body2" fontWeight={600}>
            {overdueStages.length} stage{overdueStages.length > 1 ? "s" : ""}{" "}
            overdue: {overdueStages.map((s) => s.label).join(", ")}
          </Typography>
        </Alert>
      )}
      {atRiskStages.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, border: "1px solid #fbbf24" }}>
          <Typography variant="body2" fontWeight={600}>
            {atRiskStages.length} stage{atRiskStages.length > 1 ? "s" : ""} at
            risk (planned date passed):{" "}
            {atRiskStages.map((s) => s.label).join(", ")}
          </Typography>
        </Alert>
      )}
      {paymentIncomplete && (
        <Alert severity="warning" sx={{ mb: 2, border: "1px solid #fbbf24" }}>
          <Typography variant="body2" fontWeight={600}>
            Payment Outstanding — ₦
            {paidAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}{" "}
            of ₦
            {po.totalAmount.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}{" "}
            paid ({paidPct.toFixed(0)}%)
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <InfoCard
          label="Total Amount"
          value={`₦${po.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          sub={`${(po.items || []).length} item${(po.items || []).length !== 1 ? "s" : ""}`}
        />
        <InfoCard
          label="Paid"
          value={`₦${paidAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          sub={`${paidPct.toFixed(0)}% of total`}
          color={
            paidPct >= 100 ? "#16a34a" : paidPct > 0 ? "#d97706" : "#64748b"
          }
        />
        <InfoCard
          label="Remaining"
          value={`₦${remaining.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          color={remaining > 0 ? "#b91c1c" : "#16a34a"}
        />
        <InfoCard
          label="Payments Made"
          value={String(po.payments?.length || 0)}
          sub={
            po.payments?.length > 0
              ? `Latest: ${format(new Date(po.payments[0].paymentDate), "dd MMM yyyy")}`
              : "No payments yet"
          }
        />
      </Box>

      {/* Payment Progress */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Payment Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={paidPct}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "#e2e8f0",
            "& .MuiLinearProgress-bar": {
              bgcolor:
                paidPct >= 100
                  ? "#16a34a"
                  : paidPct >= 50
                    ? "#f59e0b"
                    : paidPct > 0
                      ? "#ef4444"
                      : "#cbd5e1",
              borderRadius: 5,
            },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            ₦0
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {paidPct.toFixed(0)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ₦
            {po.totalAmount.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </Typography>
        </Box>
      </Paper>

      {/* Planned vs Actual */}
      {hasAnyPlanned && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Planned vs Actual
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Stage
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Planned Start
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Planned End
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Actual Start
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Actual End
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, fontSize: 12 }}
                  >
                    Variance
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, fontSize: 12 }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stages.map((s) => {
                  const variance = dayDiff(s.actualEnd, s.plannedEnd);
                  const isOverdue = variance !== null && variance > 0;
                  const isEarly = variance !== null && variance < 0;
                  const isAtRisk =
                    !s.actualEnd &&
                    s.plannedEnd &&
                    new Date(s.plannedEnd) < new Date();

                  return (
                    <TableRow
                      key={s.label}
                      sx={{
                        bgcolor: isOverdue
                          ? "#fef2f2"
                          : isAtRisk
                            ? "#fffbeb"
                            : "transparent",
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {s.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {s.plannedStart
                            ? format(new Date(s.plannedStart), "dd MMM yyyy")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {s.plannedEnd
                            ? format(new Date(s.plannedEnd), "dd MMM yyyy")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {s.actualStart
                            ? format(new Date(s.actualStart), "dd MMM yyyy")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isOverdue ? "#b91c1c" : "inherit",
                            fontWeight: isOverdue ? 700 : 400,
                          }}
                        >
                          {s.actualEnd
                            ? format(new Date(s.actualEnd), "dd MMM yyyy")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color: isOverdue
                              ? "#b91c1c"
                              : isEarly
                                ? "#16a34a"
                                : "#64748b",
                          }}
                        >
                          {variance !== null
                            ? isOverdue
                              ? `+${variance}d`
                              : isEarly
                                ? `${variance}d`
                                : "0d"
                            : isAtRisk
                              ? "⏰ Past Due"
                              : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {isOverdue ? (
                          <Chip
                            label="Overdue"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#fee2e2",
                              color: "#b91c1c",
                            }}
                          />
                        ) : isAtRisk ? (
                          <Chip
                            label="At Risk"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#fef3c7",
                              color: "#92400e",
                            }}
                          />
                        ) : isEarly ? (
                          <Chip
                            label="Early"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#dcfce7",
                              color: "#16a34a",
                            }}
                          />
                        ) : variance === 0 ? (
                          <Chip
                            label="On Time"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#e0f2fe",
                              color: "#0369a1",
                            }}
                          />
                        ) : s.actualStart && !s.actualEnd ? (
                          <Chip
                            label="In Progress"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#ede9fe",
                              color: "#7c3aed",
                            }}
                          />
                        ) : !s.actualStart ? (
                          <Chip
                            label="Pending"
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#f1f5f9",
                              color: "#64748b",
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Items */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Items ({(po.items || []).length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                  Material
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                  Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                  Unit
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                  Unit Cost
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(po.items || []).map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.materialName || item.name || "—"}
                    </Typography>
                    {item.partNumber && (
                      <Typography variant="caption" color="text.secondary">
                        {item.partNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.quantity}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.unit || "pcs"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ₦
                      {(item.unitCost || 0).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      ₦
                      {(
                        item.totalCost ||
                        item.quantity * item.unitCost ||
                        0
                      ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment History */}
      {po.payments && po.payments.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Payment History ({po.payments.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Date
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, fontSize: 12 }}
                  >
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Method
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                    Notes
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {po.payments.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Typography variant="body2">{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(p.paymentDate), "dd MMM yyyy")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ₦
                        {p.amount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {p.paymentMethod || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {p.notes || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Timeline */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Activity Timeline
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {po.invoiceStartDate && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip label="Invoice" size="small" sx={{ minWidth: 90 }} />
              <Typography variant="body2">
                {format(new Date(po.invoiceStartDate), "dd MMM yyyy")}
                {po.invoiceEndDate &&
                  ` → ${format(new Date(po.invoiceEndDate), "dd MMM yyyy")}`}
              </Typography>
              {po.plannedInvoiceEndDate &&
                po.invoiceEndDate &&
                new Date(po.invoiceEndDate) >
                  new Date(po.plannedInvoiceEndDate) && (
                  <Chip
                    label="OVERDUE"
                    size="small"
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                    }}
                  />
                )}
            </Box>
          )}
          {po.paymentStartDate && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip
                label="Payment"
                size="small"
                sx={{
                  minWidth: 90,
                  ...(paymentIncomplete
                    ? {
                        bgcolor: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fbbf24",
                      }
                    : {}),
                }}
              />
              <Typography variant="body2">
                {format(new Date(po.paymentStartDate), "dd MMM yyyy")}
                {po.paymentEndDate &&
                  ` → ${format(new Date(po.paymentEndDate), "dd MMM yyyy")}`}
                {po.paymentMethod && ` • ${po.paymentMethod}`}
              </Typography>
              {paymentIncomplete && (
                <Chip
                  label="INCOMPLETE"
                  size="small"
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: "#fffbeb",
                    color: "#92400e",
                    border: "1px solid #fbbf24",
                  }}
                />
              )}
            </Box>
          )}
          {po.shipmentStartDate && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip label="Shipment" size="small" sx={{ minWidth: 90 }} />
              <Typography variant="body2">
                {format(new Date(po.shipmentStartDate), "dd MMM yyyy")}
                {po.shipmentEndDate &&
                  ` → ${format(new Date(po.shipmentEndDate), "dd MMM yyyy")}`}
                {po.trackingNumber && ` • ${po.trackingNumber}`}
              </Typography>
              {po.plannedShipmentEndDate &&
                po.shipmentEndDate &&
                new Date(po.shipmentEndDate) >
                  new Date(po.plannedShipmentEndDate) && (
                  <Chip
                    label="OVERDUE"
                    size="small"
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                    }}
                  />
                )}
            </Box>
          )}
          {po.receivingStartDate && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip
                label="Received"
                size="small"
                color="success"
                sx={{ minWidth: 90 }}
              />
              <Typography variant="body2">
                {format(new Date(po.receivingStartDate), "dd MMM yyyy")}
                {po.receivingEndDate &&
                  ` → ${format(new Date(po.receivingEndDate), "dd MMM yyyy")}`}
                {po.grn && ` • GRN: ${po.grn.grnNumber}`}
              </Typography>
            </Box>
          )}
          {!po.invoiceStartDate &&
            !po.paymentStartDate &&
            !po.shipmentStartDate &&
            !po.receivingStartDate && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                No activity recorded yet.
              </Typography>
            )}
        </Box>
      </Paper>

      {/* GRN Info */}
      {po.grn && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid",
            borderColor: "#bbf7d0",
            borderRadius: 2,
            bgcolor: "#f0fdf4",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CheckIcon sx={{ color: "#16a34a" }} />
            <Typography variant="subtitle1" fontWeight={700} color="#16a34a">
              GRN: {po.grn.grnNumber}
            </Typography>
          </Box>
          {po.grn.batches && po.grn.batches.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {po.grn.batches.length} batch
              {po.grn.batches.length !== 1 ? "es" : ""} received
            </Typography>
          )}
        </Paper>
      )}

      {/* Notes */}
      {po.notes && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            📝 Notes
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {po.notes}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
