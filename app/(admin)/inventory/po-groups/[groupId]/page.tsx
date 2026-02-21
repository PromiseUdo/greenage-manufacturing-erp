"use client";

import React, { useEffect, useState, use, useCallback } from "react";
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
  Chip,
  CircularProgress,
  Button,
  LinearProgress,
  styled,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  Autocomplete,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  OpenInNew as OpenIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Description as POIcon,
  Layers as LayersIcon,
  NoteAdd as CreatePOIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// === Types ===
interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
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
  payments: Payment[];
}

interface GroupStats {
  totalPOs: number;
  completedPOs: number;
  cancelledPOs: number;
  activePOs: number;
  draftPOs: number;
  totalAmount: number;
  totalPaid: number;
  completionPct: number;
  overallStatus: string;
}

interface POGroup {
  id: string;
  groupNumber: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  purchaseOrders: PurchaseOrder[];
  _stats: GroupStats;
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
        flex: "1 1 180px",
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
export default function POGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<POGroup | null>(null);
  const [loading, setLoading] = useState(true);

  // Add PO dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [addingPOs, setAddingPOs] = useState(false);

  // Create PO dialog state
  const [createPODialogOpen, setCreatePODialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory/po-groups/${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch group");
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const fetchAvailablePOs = async () => {
    setLoadingPOs(true);
    try {
      // Fetch ungrouped POs (no groupId)
      const res = await fetch(
        `/api/inventory/purchase-orders?limit=100&ungrouped=true`,
      );
      const data = await res.json();
      // Filter out those already in this group
      const existingIds = new Set(
        group?.purchaseOrders.map((po) => po.id) || [],
      );
      const filtered = (data.purchaseOrders || []).filter(
        (po: PurchaseOrder) => !existingIds.has(po.id),
      );
      setAvailablePOs(filtered);
    } catch (err) {
      console.error("Failed to fetch available POs:", err);
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleAddPOs = async () => {
    if (selectedPOIds.length === 0) return;
    setAddingPOs(true);
    try {
      const res = await fetch(`/api/inventory/po-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addPurchaseOrderIds: selectedPOIds }),
      });
      if (res.ok) {
        setAddDialogOpen(false);
        setSelectedPOIds([]);
        fetchGroup();
      }
    } catch (err) {
      console.error("Failed to add POs:", err);
    } finally {
      setAddingPOs(false);
    }
  };

  const handleRemovePO = async (poId: string) => {
    try {
      const res = await fetch(`/api/inventory/po-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removePurchaseOrderIds: [poId] }),
      });
      if (res.ok) {
        fetchGroup();
      }
    } catch (err) {
      console.error("Failed to remove PO:", err);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch("/api/inventory/suppliers?limit=200");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleCreatePO = () => {
    if (!selectedSupplier) return;
    router.push(
      `/inventory/suppliers/${selectedSupplier.id}/sourcing/new?groupId=${groupId}`,
    );
  };

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

  if (!group) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          PO Group not found.
        </Typography>
        <Button
          onClick={() => router.push("/inventory/po-groups")}
          sx={{ mt: 2 }}
        >
          Back to PO Groups
        </Button>
      </Box>
    );
  }

  const stats = group._stats;
  const paidPct =
    stats.totalAmount > 0
      ? Math.min((stats.totalPaid / stats.totalAmount) * 100, 100)
      : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/inventory/po-groups")}
          sx={{ color: "#64748b" }}
        >
          All Groups
        </Button>
      </Box>

      {/* Group Info */}
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
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0F172A">
              {group.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group.groupNumber} • Created{" "}
              {format(new Date(group.createdAt), "dd MMM yyyy")}
              {group.createdBy && ` by ${group.createdBy}`}
            </Typography>
            {group.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {group.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<CreatePOIcon />}
              onClick={() => {
                setCreatePODialogOpen(true);
                fetchSuppliers();
              }}
              sx={{
                fontWeight: 600,
                textTransform: "none",
                borderColor: "#0F172A",
                color: "#0F172A",
                "&:hover": { borderColor: "#1e293b", bgcolor: "#f8fafc" },
              }}
            >
              Create PO
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setAddDialogOpen(true);
                fetchAvailablePOs();
              }}
              sx={{
                bgcolor: "#0F172A",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              Add Existing POs
            </Button>
          </Box>
        </Box>

        {/* Completion Progress */}
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Group Completion
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
              {stats.completedPOs} / {stats.totalPOs} POs ({stats.completionPct}
              %)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.completionPct}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                bgcolor:
                  stats.completionPct >= 100
                    ? "#16a34a"
                    : stats.completionPct >= 50
                      ? "#f59e0b"
                      : stats.completionPct > 0
                        ? "#3b82f6"
                        : "#cbd5e1",
                borderRadius: 6,
              },
            }}
          />
          {/* Step breakdown */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 1.5,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "Completed",
                count: stats.completedPOs,
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                label: "Active",
                count: stats.activePOs,
                color: "#0369a1",
                bg: "#e0f2fe",
              },
              {
                label: "Draft",
                count: stats.draftPOs,
                color: "#64748b",
                bg: "#f1f5f9",
              },
              {
                label: "Cancelled",
                count: stats.cancelledPOs,
                color: "#dc2626",
                bg: "#fee2e2",
              },
            ]
              .filter((s) => s.count > 0)
              .map((s) => (
                <Chip
                  key={s.label}
                  label={`${s.count} ${s.label}`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: 11,
                    bgcolor: s.bg,
                    color: s.color,
                  }}
                />
              ))}
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <InfoCard
          label="Total Amount"
          value={`₦${stats.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          sub={`${stats.totalPOs} purchase order${stats.totalPOs !== 1 ? "s" : ""}`}
        />
        <InfoCard
          label="Total Paid"
          value={`₦${stats.totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          sub={`${paidPct.toFixed(0)}% of total`}
          color={
            paidPct >= 100 ? "#16a34a" : paidPct > 0 ? "#d97706" : "#64748b"
          }
        />
        <InfoCard
          label="Remaining"
          value={`₦${(stats.totalAmount - stats.totalPaid).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
          color={
            stats.totalAmount - stats.totalPaid > 0 ? "#b91c1c" : "#16a34a"
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
            {stats.totalAmount.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </Typography>
        </Box>
      </Paper>

      {/* Purchase Orders Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Purchase Orders ({stats.totalPOs})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>PO Number</StyledTableCell>
                <StyledTableCell>Supplier</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="right">Total</StyledTableCell>
                <StyledTableCell align="right">Paid</StyledTableCell>
                <StyledTableCell align="center">Progress</StyledTableCell>
                <StyledTableCell>Created</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <POIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No purchase orders in this group yet.
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setAddDialogOpen(true);
                        fetchAvailablePOs();
                      }}
                      sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
                    >
                      Add Purchase Orders
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                group.purchaseOrders.map((po) => {
                  const statusConf =
                    STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
                  const poPaidPct =
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
                              poPaidPct >= 100
                                ? "#16a34a"
                                : poPaidPct > 0
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
                        <Tooltip title={`${poPaidPct.toFixed(0)}% paid`}>
                          <Box sx={{ width: 70, mx: "auto" }}>
                            <LinearProgress
                              variant="determinate"
                              value={poPaidPct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor:
                                    poPaidPct >= 100
                                      ? "#16a34a"
                                      : poPaidPct > 0
                                        ? "#f59e0b"
                                        : "#cbd5e1",
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(po.createdAt), "dd MMM yyyy")}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title="Remove from group">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePO(po.id);
                            }}
                            sx={{
                              color: "#94a3b8",
                              "&:hover": { color: "#dc2626" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add POs Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Purchase Orders to Group
        </DialogTitle>
        <DialogContent>
          {loadingPOs ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : availablePOs.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              No ungrouped purchase orders available.
            </Typography>
          ) : (
            <Autocomplete
              multiple
              options={availablePOs}
              getOptionLabel={(po) =>
                `${po.poNumber} — ${po.supplier?.name || "Unknown"} (₦${(po.totalAmount || 0).toLocaleString("en-NG")})`
              }
              value={availablePOs.filter((po) => selectedPOIds.includes(po.id))}
              onChange={(_, selected) =>
                setSelectedPOIds(selected.map((po) => po.id))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Purchase Orders"
                  placeholder="Search PO number or supplier..."
                  sx={{ mt: 1 }}
                />
              )}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            sx={{ color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPOs}
            disabled={selectedPOIds.length === 0 || addingPOs}
            sx={{
              bgcolor: "#0F172A",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            {addingPOs
              ? "Adding..."
              : `Add ${selectedPOIds.length} PO${selectedPOIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create PO Dialog — Select Supplier */}
      <Dialog
        open={createPODialogOpen}
        onClose={() => {
          setCreatePODialogOpen(false);
          setSelectedSupplier(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Purchase Order in Group
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a supplier to create a new purchase order that will be
            automatically added to <strong>{group.name}</strong>.
          </Typography>
          {loadingSuppliers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Autocomplete
              options={suppliers}
              getOptionLabel={(s) => s.name}
              value={selectedSupplier}
              onChange={(_, value) => setSelectedSupplier(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Supplier"
                  placeholder="Search supplier name..."
                  sx={{ mt: 1 }}
                />
              )}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setCreatePODialogOpen(false);
              setSelectedSupplier(null);
            }}
            sx={{ color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePO}
            disabled={!selectedSupplier}
            sx={{
              bgcolor: "#0F172A",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Continue to PO Form
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
