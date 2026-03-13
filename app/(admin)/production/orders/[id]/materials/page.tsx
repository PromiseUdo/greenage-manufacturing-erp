"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useOrderContext } from "../layout";
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
  Tooltip,
  Divider,
  IconButton,
  Collapse,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BuildIcon from "@mui/icons-material/Build";

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  NOT_REQUESTED: {
    bg: "#F3F4F6",
    text: "#6B7280",
    icon: <InfoOutlinedIcon fontSize="small" />,
    label: "Not Requested",
  },
  PENDING: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    icon: <HourglassEmptyIcon fontSize="small" />,
    label: "Awaiting Inventory",
  },
  PARTIALLY_FULFILLED: {
    bg: "#FEF3C7",
    text: "#92400E",
    icon: <WarningAmberIcon fontSize="small" />,
    label: "Partially Fulfilled",
  },
  FULFILLED: {
    bg: "#DCFCE7",
    text: "#166534",
    icon: <CheckCircleIcon fontSize="small" />,
    label: "Fulfilled",
  },
  CANCELLED: {
    bg: "#FEE2E2",
    text: "#991B1B",
    icon: <CancelIcon fontSize="small" />,
    label: "Cancelled",
  },
};

const itemStatusColor = (s: string) => {
  if (s === "ISSUED") return { bg: "#DCFCE7", text: "#166534" };
  if (s === "PARTIAL") return { bg: "#FEF3C7", text: "#92400E" };
  if (s === "UNAVAILABLE") return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#6B7280" };
};

// ─── Editable requisition item type ──────────────────────────────────────────
interface ReqItem {
  materialId: string;
  materialName: string;
  partNumber: string;
  unit: string;
  category: string;
  currentStock: number;
  quantityRequired: number;
  isFromBOM: boolean; // BOM-sourced vs manually added
}

import { MaterialSearchPicker } from "@/app/components/shared/MaterialSearchPicker";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductionMaterialsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order } = useOrderContext();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReq, setSendingReq] = useState(false);
  const [reqNotes, setReqNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"BOM_SIGNOUT" | "REPLACEMENT">(
    "BOM_SIGNOUT",
  );
  const [bomExpanded, setBomExpanded] = useState(true);
  const [expandedReqs, setExpandedReqs] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable item list in the dialog
  const [reqItems, setReqItems] = useState<ReqItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/material-requisition`,
      );
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build initial items from BOM when dialog opens
  const openDialog = (type: "BOM_SIGNOUT" | "REPLACEMENT") => {
    const bom: any[] = data?.bom ?? [];
    const initialItems: ReqItem[] = bom.map((b) => ({
      materialId: b.materialId,
      materialName: b.material.name,
      partNumber: b.material.partNumber,
      unit: b.material.unit,
      category: b.material.category ?? "",
      currentStock: b.currentStock,
      quantityRequired: b.totalRequired,
      isFromBOM: true,
    }));
    setReqItems(initialItems);
    setReqNotes("");
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleAddMaterial = (mat: any) => {
    setReqItems((prev) => [
      ...prev,
      {
        materialId: mat.id,
        materialName: mat.name,
        partNumber: mat.partNumber,
        unit: mat.unit,
        category: mat.category ?? "",
        currentStock: mat.currentStock ?? 0,
        quantityRequired: 1,
        isFromBOM: false,
      },
    ]);
  };

  const handleRemoveItem = (materialId: string) => {
    setReqItems((prev) => prev.filter((i) => i.materialId !== materialId));
  };

  const handleQtyChange = (materialId: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setReqItems((prev) =>
      prev.map((i) =>
        i.materialId === materialId ? { ...i, quantityRequired: num } : i,
      ),
    );
  };

  const sendRequisition = async () => {
    setError("");
    if (reqItems.length === 0) {
      setError("Add at least one material before sending.");
      return;
    }
    if (reqItems.some((i) => !i.quantityRequired || i.quantityRequired <= 0)) {
      setError("All materials must have a quantity greater than zero.");
      return;
    }
    setSendingReq(true);
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/material-requisition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: reqNotes,
            type: dialogType,
            items: reqItems.map((i) => ({
              materialId: i.materialId,
              quantityRequired: i.quantityRequired,
            })),
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create requisition");
        return;
      }
      const typeLabel =
        dialogType === "REPLACEMENT"
          ? "Replacement Requisition"
          : "Material Requisition";
      setSuccess(
        `${typeLabel} ${json.requisitionNumber} sent to inventory team!`,
      );
      setDialogOpen(false);
      await fetchData();
    } finally {
      setSendingReq(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading BOM and requisitions…
        </Typography>
      </Box>
    );
  }

  if (!data) return null;

  const latestReq = data.latestRequisition;
  const reqStatus = latestReq?.status ?? "NOT_REQUESTED";
  const statusInfo = statusConfig[reqStatus] ?? statusConfig.NOT_REQUESTED;
  const bom: any[] = data.bom ?? [];
  const hasOpenReq =
    latestReq &&
    (latestReq.status === "PENDING" ||
      latestReq.status === "PARTIALLY_FULFILLED");
  const canRequestBOM = !latestReq || latestReq.status === "CANCELLED";
  const canRequestReplacement = !hasOpenReq; // Allow if prev req is fulfilled
  const hasBOM = bom.length > 0;

  const totalRequired = bom.reduce(
    (acc: number, b: any) => acc + b.totalRequired,
    0,
  );
  const totalShortfall = bom.reduce(
    (acc: number, b: any) => acc + b.shortfall,
    0,
  );

  // Cost computations
  const totalBOMCost = bom.reduce((acc: number, b: any) => {
    const unitCost = b.material.unitCost ?? 0;
    return acc + unitCost * b.totalRequired;
  }, 0);

  const hasBOMCostData = bom.some((b: any) => b.material.unitCost != null);

  return (
    <Box>
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* ── P-1 BOM Sign-out Banner ── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: "1px solid",
          borderColor:
            latestReq?.status === "FULFILLED"
              ? "#BBF7D0"
              : latestReq
                ? "#BFDBFE"
                : "divider",
          borderRadius: 2,
          bgcolor:
            latestReq?.status === "FULFILLED"
              ? "#F0FDF4"
              : latestReq
                ? "#EFF6FF"
                : "background.paper",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ color: statusInfo.text, mt: 0.3 }}>
              {statusInfo.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                P-1: Sign Out Materials from Inventory
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={statusInfo.label}
                  size="small"
                  sx={{
                    bgcolor: statusInfo.bg,
                    color: statusInfo.text,
                    fontWeight: 700,
                  }}
                />
                {latestReq && (
                  <Typography variant="caption" color="text.secondary">
                    {latestReq.requisitionNumber} ·{" "}
                    {latestReq.requestedBy?.name} ·{" "}
                    {formatDate(latestReq.createdAt)}
                  </Typography>
                )}
              </Box>
              {latestReq?.status === "PARTIALLY_FULFILLED" && (
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  ⚠ Some items are unavailable or partially issued. P-1 remains
                  open until fully fulfilled.
                </Typography>
              )}
              {latestReq?.status === "FULFILLED" && (
                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  ✓ All materials signed out. P-1 auto-completed.
                  {latestReq.fulfilledBy &&
                    ` Fulfilled by ${latestReq.fulfilledBy.name}.`}
                </Typography>
              )}
              {latestReq?.notes && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Notes: {latestReq.notes}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {canRequestBOM && hasBOM && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => openDialog("BOM_SIGNOUT")}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#16A34A",
                  "&:hover": { bgcolor: "#15803D" },
                  borderRadius: 2,
                }}
              >
                Request BOM Materials
              </Button>
            )}
            {/* P-4 Replacement Request */}
            <Button
              variant="outlined"
              startIcon={<BuildIcon />}
              onClick={() => openDialog("REPLACEMENT")}
              disabled={!canRequestReplacement}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                borderColor: "#DC2626",
                color: "#DC2626",
                bgcolor: "#FFF5F5",
                "&:hover": { bgcolor: "#FEE2E2" },
              }}
            >
              Replacement Request (P-4)
            </Button>
            {!hasBOM && (
              <Alert severity="warning" sx={{ py: 0, fontSize: "0.8rem" }}>
                No BOM defined. Add materials to the product first.
              </Alert>
            )}
          </Box>
        </CardContent>
        {latestReq?.inventoryNotes && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Inventory Notes:{" "}
            </Typography>
            <Typography variant="caption">
              {latestReq.inventoryNotes}
            </Typography>
          </Box>
        )}
      </Card>

      {/* ── BOM Table ── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ pb: "16px !important" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: bomExpanded ? 2 : 0,
              cursor: "pointer",
            }}
            onClick={() => setBomExpanded(!bomExpanded)}
          >
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Inventory2Icon sx={{ color: "#6366F1" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Bill of Materials (BOM)
              </Typography>
              <Chip label={`${bom.length} materials`} size="small" />
              {totalShortfall > 0 && (
                <Chip
                  label={`${totalShortfall.toFixed(0)} units short`}
                  size="small"
                  sx={{ bgcolor: "#FEE2E2", color: "#991B1B", fontWeight: 600 }}
                />
              )}
            </Box>
            <IconButton size="small">
              {bomExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={bomExpanded}>
            {bom.length === 0 ? (
              <Alert severity="info">
                No BOM materials are defined for{" "}
                <strong>{data.product?.name}</strong>. Go to{" "}
                <strong>Products</strong> → edit this product → add materials to
                its BOM.
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Qty / Unit
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Total Required
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          ({order?.quantity} units)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Unit Cost
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Total Cost
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        In Stock
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Shortfall
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bom.map((item: any) => (
                      <TableRow
                        key={item.materialId}
                        sx={{
                          bgcolor:
                            item.shortfall > 0 ? "#FFF7F7" : "transparent",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.material.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {item.material.partNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {item.material.category?.replace(/_/g, " ")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.qtyPerUnit} {item.material.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700}>
                            {item.totalRequired} {item.material.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.material.unitCost)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="#1E40AF">
                            {item.material.unitCost != null
                              ? formatCurrency(item.material.unitCost * item.totalRequired)
                              : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              item.currentStock >= item.totalRequired
                                ? "#16A34A"
                                : item.currentStock > 0
                                  ? "#D97706"
                                  : "#DC2626"
                            }
                          >
                            {item.currentStock} {item.material.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {item.shortfall > 0 ? (
                            <Chip
                              label={`-${item.shortfall} ${item.material.unit}`}
                              size="small"
                              sx={{
                                bgcolor: "#FEE2E2",
                                color: "#991B1B",
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <CheckCircleIcon
                              sx={{ color: "#16A34A", fontSize: 18 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* BOM Cost Summary */}
            {bom.length > 0 && hasBOMCostData && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#EEF2FF",
                  border: "1px solid #C7D2FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL BOM COST
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Estimated cost based on {bom.length} materials × {order?.quantity} units
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} color="#3730A3">
                  {formatCurrency(totalBOMCost)}
                </Typography>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* ── Requisition History ── */}
      {data.requisitions && data.requisitions.length > 0 && (
        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Requisition History ({data.requisitions.length})
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.requisitions.map((req: any, index: number) => {
              const isExpanded = expandedReqs[req.id] ?? index === 0;

              return (
                <Card
                  key={req.id}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ pb: "16px !important" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: isExpanded ? 2 : 0,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedReqs({
                          ...expandedReqs,
                          [req.id]: !isExpanded,
                        })
                      }
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <SendIcon sx={{ color: "#2563EB" }} />
                        <Typography variant="subtitle1" fontWeight={700}>
                          Requisition: {req.requisitionNumber}
                        </Typography>
                        <Chip
                          label={statusConfig[req.status]?.label ?? req.status}
                          size="small"
                          sx={{
                            bgcolor: statusConfig[req.status]?.bg,
                            color: statusConfig[req.status]?.text,
                            fontWeight: 700,
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {formatDate(req.createdAt)}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={isExpanded}>
                      {req.items?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {(() => {
                            const issued = req.items.filter(
                              (i: any) => i.status === "ISSUED",
                            ).length;
                            const total = req.items.length;
                            const pct = Math.round((issued / total) * 100);
                            return (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
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
                                      bgcolor:
                                        pct === 100 ? "#16A34A" : "#2563EB",
                                    },
                                  }}
                                />
                                <Typography variant="caption" fontWeight={600}>
                                  {issued}/{total} items issued
                                </Typography>
                              </Box>
                            );
                          })()}
                        </Box>
                      )}

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Material
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Part #
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="center"
                              >
                                Required
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="center"
                              >
                                Issued
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="center"
                              >
                                Stock at Request
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="right"
                              >
                                Unit Cost
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="right"
                              >
                                Cost Requested
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600 }}
                                align="right"
                              >
                                Cost Issued
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Status
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Notes
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {req.items?.map((item: any) => {
                              const col = itemStatusColor(item.status);
                              const pct =
                                item.quantityIssued != null &&
                                item.quantityRequired > 0
                                  ? Math.round(
                                      (item.quantityIssued /
                                        item.quantityRequired) *
                                        100,
                                    )
                                  : null;
                              return (
                                <TableRow
                                  key={item.id}
                                  sx={{ verticalAlign: "middle" }}
                                >
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      {item.material.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {item.material.category?.replace(
                                        /_/g,
                                        " ",
                                      )}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {item.material.partNumber}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                    >
                                      {item.quantityRequired}{" "}
                                      {item.material.unit}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                      color={
                                        item.quantityIssued == null
                                          ? "text.disabled"
                                          : item.quantityIssued >=
                                              item.quantityRequired
                                            ? "#16A34A"
                                            : "#D97706"
                                      }
                                    >
                                      {item.quantityIssued != null
                                        ? `${item.quantityIssued} ${item.material.unit}`
                                        : "—"}
                                    </Typography>
                                    {pct !== null && pct < 100 && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {pct}%
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {item.stockAtRequest != null
                                        ? `${item.stockAtRequest} ${item.material.unit}`
                                        : "—"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" color="text.secondary">
                                      {formatCurrency(item.material.unitCost)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight={700} color="#1E40AF">
                                      {item.material.unitCost != null
                                        ? formatCurrency(item.material.unitCost * item.quantityRequired)
                                        : "—"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                      color={
                                        item.quantityIssued != null && item.material.unitCost != null
                                          ? "#16A34A"
                                          : "text.disabled"
                                      }
                                    >
                                      {item.quantityIssued != null && item.material.unitCost != null
                                        ? formatCurrency(item.material.unitCost * item.quantityIssued)
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

                      {/* Requisition Cost Summary */}
                      {(() => {
                        const hasCost = req.items?.some(
                          (i: any) => i.material.unitCost != null,
                        );
                        if (!hasCost) return null;

                        const totalCostRequested = (req.items ?? []).reduce(
                          (acc: number, i: any) =>
                            acc +
                            (i.material.unitCost ?? 0) * i.quantityRequired,
                          0,
                        );
                        const totalCostIssued = (req.items ?? []).reduce(
                          (acc: number, i: any) =>
                            i.quantityIssued != null && i.material.unitCost != null
                              ? acc + i.material.unitCost * i.quantityIssued
                              : acc,
                          0,
                        );
                        const hasAnyIssued = req.items?.some(
                          (i: any) => i.quantityIssued != null,
                        );

                        return (
                          <Box
                            sx={{
                              mt: 2,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                px: 2,
                                py: 1,
                                bgcolor: "#0F172A",
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ color: "#94A3B8", letterSpacing: "0.5px" }}
                              >
                                COST SUMMARY
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  flex: 1,
                                  minWidth: 180,
                                  p: 2,
                                  borderRight: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                  sx={{ display: "block", mb: 0.5 }}
                                >
                                  Total Requested Value
                                </Typography>
                                <Typography
                                  variant="h6"
                                  fontWeight={800}
                                  color="#1E40AF"
                                >
                                  {formatCurrency(totalCostRequested)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {req.items?.length} material(s) requested
                                </Typography>
                              </Box>

                              {hasAnyIssued && (
                                <Box
                                  sx={{
                                    flex: 1,
                                    minWidth: 180,
                                    p: 2,
                                    borderRight: "1px solid",
                                    borderColor: "divider",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    sx={{ display: "block", mb: 0.5 }}
                                  >
                                    Total Issued Value
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    fontWeight={800}
                                    color="#16A34A"
                                  >
                                    {formatCurrency(totalCostIssued)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      req.items?.filter(
                                        (i: any) => i.quantityIssued != null,
                                      ).length
                                    }{" "}
                                    of {req.items?.length} items issued
                                  </Typography>
                                </Box>
                              )}

                              {hasAnyIssued && totalCostRequested > 0 && (
                                <Box
                                  sx={{
                                    flex: 1,
                                    minWidth: 180,
                                    p: 2,
                                    bgcolor:
                                      totalCostIssued < totalCostRequested
                                        ? "#FFFBEB"
                                        : "#F0FDF4",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    sx={{ display: "block", mb: 0.5 }}
                                  >
                                    Variance
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    fontWeight={800}
                                    color={
                                      totalCostIssued < totalCostRequested
                                        ? "#D97706"
                                        : "#16A34A"
                                    }
                                  >
                                    {formatCurrency(
                                      totalCostRequested - totalCostIssued,
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {totalCostIssued >= totalCostRequested
                                      ? "Fully fulfilled"
                                      : "Value not yet issued"}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })()}

                      {req.notes && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: "#F9FAFB",
                            borderRadius: 2,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Requester Notes:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {req.notes}
                          </Typography>
                        </Box>
                      )}
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Send Requisition Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !sendingReq && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: dialogType === "REPLACEMENT" ? "#FFF5F5" : "#F0FDF4",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {dialogType === "REPLACEMENT" ? (
            <>
              <span>P-4: Initiate Replacement Material Request</span>
            </>
          ) : (
            <>
              <span>P-1: Request BOM Materials from Inventory</span>
            </>
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {/* Info alert */}
          <Box sx={{ p: 2, pb: 0 }}>
            <Alert
              severity={dialogType === "REPLACEMENT" ? "warning" : "info"}
              sx={{ borderRadius: 2, mb: 2 }}
            >
              {dialogType === "REPLACEMENT"
                ? "List all non-conforming materials that need to be replaced. The inventory team will receive this as a replacement request."
                : "The BOM materials for this production order are pre-loaded below. You can adjust quantities, remove items you don't need, or add extra materials from the inventory database before sending."}
            </Alert>

            {/* Material search to add items */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                <AddIcon
                  sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }}
                />
                Add Material from Inventory
              </Typography>
              <MaterialSearchPicker
                onAdd={handleAddMaterial}
                alreadyAdded={reqItems.map((i) => i.materialId)}
              />
            </Box>
          </Box>

          {/* Editable items list */}
          <Box sx={{ px: 2, pb: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Materials in this Requisition ({reqItems.length})
            </Typography>
          </Box>

          {reqItems.length === 0 ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No materials added yet. Search and add materials above.
              </Alert>
            </Box>
          ) : (
            <TableContainer sx={{ px: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600, pl: 2 }}>
                      Material
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      In Stock
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, minWidth: 130 }}
                      align="center"
                    >
                      Qty Requested
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Source
                    </TableCell>
                    <TableCell align="center" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reqItems.map((item) => (
                    <TableRow
                      key={item.materialId}
                      sx={{
                        bgcolor: item.isFromBOM ? "transparent" : "#F0FDF4",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <TableCell sx={{ pl: 2 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.materialName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.category?.replace(/_/g, " ")} · {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {item.partNumber}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={
                            item.currentStock >= item.quantityRequired
                              ? "#16A34A"
                              : item.currentStock > 0
                                ? "#D97706"
                                : "#DC2626"
                          }
                        >
                          {item.currentStock} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={item.quantityRequired}
                          onChange={(e) =>
                            handleQtyChange(item.materialId, e.target.value)
                          }
                          size="small"
                          inputProps={{ min: 0.001, step: 0.001 }}
                          sx={{
                            width: 100,
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                            "& input": { textAlign: "center", fontWeight: 700 },
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.65rem" }}
                                >
                                  {item.unit}
                                </Typography>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.isFromBOM ? "BOM" : "Added"}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            bgcolor: item.isFromBOM ? "#EEF2FF" : "#F0FDF4",
                            color: item.isFromBOM ? "#4338CA" : "#16A34A",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Remove from list">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item.materialId)}
                            sx={{ color: "#DC2626" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Notes */}
          <Box sx={{ p: 2 }}>
            <TextField
              label="Notes for Inventory Team (optional)"
              multiline
              rows={2}
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder={
                dialogType === "REPLACEMENT"
                  ? "e.g., Faulty battery cells from batch #B2026. Need urgent replacement."
                  : "e.g., Urgent — production starts tomorrow. Please prioritise."
              }
              fullWidth
              sx={{ mt: 0.5 }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {reqItems.length} material(s) ·{" "}
            {reqItems.filter((i) => i.currentStock < i.quantityRequired).length}{" "}
            with insufficient stock
          </Typography>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ textTransform: "none" }}
            disabled={sendingReq}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={sendRequisition}
            disabled={sendingReq || reqItems.length === 0}
            startIcon={
              sendingReq ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                // <SendIcon />
                <></>
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              bgcolor: dialogType === "REPLACEMENT" ? "#DC2626" : "#16A34A",
              "&:hover": {
                bgcolor: dialogType === "REPLACEMENT" ? "#B91C1C" : "#15803D",
              },
            }}
          >
            {sendingReq
              ? "Sending…"
              : `Send ${dialogType === "REPLACEMENT" ? "Replacement" : "Material"} Request`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
