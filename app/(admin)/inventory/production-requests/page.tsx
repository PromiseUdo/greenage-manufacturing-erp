"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import GavelIcon from "@mui/icons-material/Gavel";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const reqStatusConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  PENDING: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    icon: <HourglassEmptyIcon fontSize="small" />,
  },
  PARTIALLY_FULFILLED: {
    bg: "#FEF3C7",
    text: "#92400E",
    icon: <WarningAmberIcon fontSize="small" />,
  },
  FULFILLED: {
    bg: "#DCFCE7",
    text: "#166534",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  CANCELLED: {
    bg: "#FEE2E2",
    text: "#991B1B",
    icon: <CancelIcon fontSize="small" />,
  },
};

const itemStatusColor = (s: string) => {
  if (s === "ISSUED") return { bg: "#DCFCE7", text: "#166534" };
  if (s === "PARTIAL") return { bg: "#FEF3C7", text: "#92400E" };
  if (s === "UNAVAILABLE") return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#6B7280" };
};

// ─── types for fulfillment form ───────────────────────────────────────────────
interface FulfillItem {
  itemId: string;
  materialName: string;
  partNumber: string;
  unit: string;
  requiredQty: number;
  issuedSoFar: number;
  stockAvailable: number;
  quantityIssued: string;
  notes: string;
}

// ─── component ───────────────────────────────────────────────────────────────
export default function InventoryProductionRequestsPage() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPending: 0, totalPartial: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(
    "PENDING,PARTIALLY_FULFILLED",
  );
  const [fulfillDialog, setFulfillDialog] = useState<{
    reqId: string;
    orderId: string;
    requisitionNumber: string;
    items: FulfillItem[];
  } | null>(null);
  const [inventoryNotes, setInventoryNotes] = useState("");
  const [fulfilling, setFulfilling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/inventory/material-requisitions?status=${statusFilter}`,
      );
      const data = await res.json();
      setRequisitions(data.requisitions || []);
      setStats(data.stats || { totalPending: 0, totalPartial: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const openFulfillDialog = (req: any) => {
    const items: FulfillItem[] = req.items.map((item: any) => {
      const issuedSoFar = item.quantityIssued || 0;
      const remainingRequired = Math.max(
        0,
        item.quantityRequired - issuedSoFar,
      );

      let initialIssueQty = "0";
      if (item.status === "PENDING" || item.status === "PARTIAL") {
        initialIssueQty = String(
          Math.max(0, Math.min(remainingRequired, item.material.currentStock)),
        );
      }

      return {
        itemId: item.id,
        materialName: item.material.name,
        partNumber: item.material.partNumber,
        unit: item.material.unit,
        requiredQty: item.quantityRequired,
        issuedSoFar,
        stockAvailable: item.material.currentStock,
        quantityIssued: initialIssueQty,
        notes: item.notes || "",
      };
    });
    setFulfillDialog({
      reqId: req.id,
      orderId: req.productionOrder?.id || req.productReturn?.id || "",
      requisitionNumber: req.requisitionNumber,
      items,
    });
    setInventoryNotes("");
    setError("");
  };

  const handleFulfill = async () => {
    if (!fulfillDialog) return;
    setFulfilling(true);
    setError("");
    try {
      const res = await fetch(
        `/api/inventory/material-requisitions/${fulfillDialog.reqId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: fulfillDialog.items.map((item) => ({
              itemId: item.itemId,
              quantityIssued: parseFloat(item.quantityIssued) || 0,
              notes: item.notes || undefined,
            })),
            inventoryNotes,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fulfill requisition");
        return;
      }
      setSuccess(
        data.status === "FULFILLED"
          ? `✓ Requisition ${fulfillDialog.requisitionNumber} fully fulfilled — P-1 auto-completed!`
          : `Requisition ${fulfillDialog.requisitionNumber} partially fulfilled.`,
      );
      setFulfillDialog(null);
      await fetchRequisitions();
    } finally {
      setFulfilling(false);
    }
  };

  const updateItemQty = (itemId: string, value: string) => {
    if (!fulfillDialog) return;
    setFulfillDialog({
      ...fulfillDialog,
      items: fulfillDialog.items.map((i) =>
        i.itemId === itemId ? { ...i, quantityIssued: value } : i,
      ),
    });
  };

  const updateItemNotes = (itemId: string, value: string) => {
    if (!fulfillDialog) return;
    setFulfillDialog({
      ...fulfillDialog,
      items: fulfillDialog.items.map((i) =>
        i.itemId === itemId ? { ...i, notes: value } : i,
      ),
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Production Material Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign out BOM materials to the production floor. Fulfilling a request
            deducts from inventory and auto-completes step P-1.
          </Typography>
        </Box>
        <IconButton onClick={fetchRequisitions}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Awaiting Fulfillment",
            value: stats.totalPending,
            color: "#1E40AF",
            bg: "#DBEAFE",
          },
          {
            label: "Partially Fulfilled",
            value: stats.totalPartial,
            color: "#92400E",
            bg: "#FEF3C7",
          },
        ].map((s) => (
          <Grid size={{ xs: 6, md: 3 }} key={s.label}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="h4" fontWeight={800} color={s.color}>
                  {s.value}
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter chips */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {[
          { value: "PENDING,PARTIALLY_FULFILLED", label: "Open Requests" },
          { value: "PENDING", label: "Pending Only" },
          { value: "PARTIALLY_FULFILLED", label: "Partial Only" },
          { value: "FULFILLED", label: "Fulfilled" },
          { value: "CANCELLED", label: "Cancelled" },
        ].map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => setStatusFilter(f.value)}
            variant={statusFilter === f.value ? "filled" : "outlined"}
            color={statusFilter === f.value ? "primary" : "default"}
            sx={{ fontWeight: 600, cursor: "pointer" }}
          />
        ))}
      </Box>

      {/* Requisitions list */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading requests…
          </Typography>
        </Box>
      ) : requisitions.length === 0 ? (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Inventory2Icon
              sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
            />
            <Typography color="text.secondary">
              No material requests found for this filter.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        requisitions.map((req) => {
          const sc = reqStatusConfig[req.status] ?? reqStatusConfig.PENDING;
          const issuedCount =
            req.items?.filter((i: any) => i.status === "ISSUED").length ?? 0;
          const totalItems = req.items?.length ?? 0;
          const pct =
            totalItems > 0 ? Math.round((issuedCount / totalItems) * 100) : 0;
          const isOpen =
            req.status === "PENDING" || req.status === "PARTIALLY_FULFILLED";

          return (
            <Accordion
              key={req.id}
              elevation={0}
              sx={{
                mb: 1.5,
                border: "1px solid",
                borderColor:
                  req.status === "FULFILLED"
                    ? "#BBF7D0"
                    : req.status === "PENDING"
                      ? "#BFDBFE"
                      : "divider",
                borderRadius: "10px !important",
                "&:before": { display: "none" },
                "&.Mui-expanded": { my: 1.5 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor:
                    req.status === "FULFILLED"
                      ? "#F0FDF4"
                      : req.status === "PENDING"
                        ? "#EFF6FF"
                        : "transparent",
                  borderRadius: "10px",
                  "&.Mui-expanded": { borderRadius: "10px 10px 0 0" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                    pr: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ color: sc.text }}>{sc.icon}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography fontWeight={700}>
                        {req.requisitionNumber}
                      </Typography>
                      <Chip
                        label={req.status.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          bgcolor: sc.bg,
                          color: sc.text,
                          fontWeight: 600,
                          fontSize: "0.68rem",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {req.productionOrder ? (
                          <>
                            Order {req.productionOrder.orderNumber} ·{" "}
                            {req.productionOrder.product.name}
                          </>
                        ) : req.productReturn ? (
                          <>
                            Return {req.productReturn.returnNumber} ·{" "}
                            {req.productReturn.product.name}
                          </>
                        ) : (
                          "No linked record"
                        )}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Requested by {req.requestedBy?.name} ·{" "}
                      {formatDate(req.createdAt)} · {totalItems} items
                      {req.productionOrder && ` · ${req.productionOrder.quantity} units to produce`}
                      {req.productReturn && ` · ${req.productReturn.quantity} units for repair`}
                    </Typography>
                    {req.notes && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="warning.main"
                        sx={{ mt: 0.3 }}
                      >
                        ⚠ {req.notes}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: 160,
                    }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "#E5E7EB",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          bgcolor: pct === 100 ? "#16A34A" : "#2563EB",
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ minWidth: 40 }}
                    >
                      {issuedCount}/{totalItems}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Requested
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Stock Available
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Issued
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {req.items?.map((item: any) => {
                        const col = itemStatusColor(item.status);
                        const hasShortfall =
                          item.material.currentStock < item.quantityRequired;
                        return (
                          <TableRow
                            key={item.id}
                            sx={{
                              bgcolor:
                                hasShortfall && item.status === "PENDING"
                                  ? "#FFFBEB"
                                  : "transparent",
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {item.material.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.material.category?.replace(/_/g, " ")}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {item.material.partNumber}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={700}>
                                {item.quantityRequired} {item.material.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                fontWeight={600}
                                color={
                                  item.material.currentStock >=
                                  item.quantityRequired
                                    ? "#16A34A"
                                    : item.material.currentStock > 0
                                      ? "#D97706"
                                      : "#DC2626"
                                }
                              >
                                {item.material.currentStock}{" "}
                                {item.material.unit}
                              </Typography>
                              {item.material.currentStock <
                                item.material.reorderLevel && (
                                <Chip
                                  label="Below Reorder"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: "0.58rem",
                                    bgcolor: "#FEE2E2",
                                    color: "#991B1B",
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography color="text.secondary">
                                {item.quantityIssued != null
                                  ? `${item.quantityIssued} ${item.material.unit}`
                                  : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                size="small"
                                sx={{
                                  bgcolor: col.bg,
                                  color: col.text,
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.notes || "—"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {isOpen && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<GavelIcon />}
                      onClick={() => openFulfillDialog(req)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor: "#2563EB",
                        "&:hover": { bgcolor: "#1D4ED8" },
                      }}
                    >
                      Fulfill / Sign Out Materials
                    </Button>
                  </Box>
                )}
                {req.inventoryNotes && (
                  <Box
                    sx={{
                      mt: 1,
                      pt: 1,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Inventory Notes: {req.inventoryNotes}
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* ── Fulfillment Dialog ── */}
      <Dialog
        open={!!fulfillDialog}
        onClose={() => setFulfillDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <GavelIcon
            sx={{ verticalAlign: "text-bottom", mr: 1, color: "#2563EB" }}
          />
          Sign Out Materials — {fulfillDialog?.requisitionNumber}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Enter the actual quantity you are issuing for each item. Issuing a
            partial quantity will flag that item as PARTIAL. Stock levels will
            be deducted automatically and MaterialIssuance records will be
            created.
            <strong>
              {" "}
              If all items are fully issued, P-1 will auto-complete.
            </strong>
          </Alert>

          {fulfillDialog && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Required
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      In Stock
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                      Qty to Issue
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 170 }}>
                      Notes (optional)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fulfillDialog.items.map((item) => {
                    const shortfall = item.stockAvailable < item.requiredQty;
                    return (
                      <TableRow
                        key={item.itemId}
                        sx={{ bgcolor: shortfall ? "#FFFBEB" : "transparent" }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.materialName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.partNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700}>
                            {item.requiredQty} {item.unit}
                          </Typography>
                          {item.issuedSoFar > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              (Issued: {item.issuedSoFar})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight={600}
                            color={
                              item.stockAvailable >= item.requiredQty
                                ? "#16A34A"
                                : item.stockAvailable > 0
                                  ? "#D97706"
                                  : "#DC2626"
                            }
                          >
                            {item.stockAvailable} {item.unit}
                          </Typography>
                          {shortfall && (
                            <Typography variant="caption" color="warning.main">
                              Short by {item.requiredQty - item.stockAvailable}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantityIssued}
                            onChange={(e) =>
                              updateItemQty(item.itemId, e.target.value)
                            }
                            inputProps={{
                              min: 0,
                              max: Math.max(
                                0,
                                item.requiredQty - item.issuedSoFar,
                              ),
                              step: "any",
                            }}
                            sx={{ width: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="e.g. only 8 available"
                            value={item.notes}
                            onChange={(e) =>
                              updateItemNotes(item.itemId, e.target.value)
                            }
                            fullWidth
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TextField
            label="Your Notes (store keeper remarks)"
            multiline
            rows={2}
            value={inventoryNotes}
            onChange={(e) => setInventoryNotes(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="e.g. 3 resistors issued from Batch B-2024. Remaining items on backorder."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setFulfillDialog(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFulfill}
            disabled={fulfilling}
            startIcon={
              fulfilling ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              bgcolor: "#16A34A",
              "&:hover": { bgcolor: "#15803D" },
            }}
          >
            {fulfilling ? "Saving…" : "Confirm Sign-Out"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
