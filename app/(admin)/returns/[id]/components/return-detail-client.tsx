"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import SendIcon from "@mui/icons-material/Send";
import { MaterialSearchPicker } from "@/app/components/shared/MaterialSearchPicker";

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

interface ReqItem {
  materialId: string;
  materialName: string;
  partNumber: string;
  unit: string;
  category: string;
  currentStock: number;
  quantityRequired: number;
}

const STATUS_FLOW = [
  "RECEIVED",
  "INSPECTING",
  "PENDING_APPROVAL",
  "IN_REPAIR",
  "REPAIR_COMPLETED",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
];

export default function ReturnDetailClient({
  initialData,
  currentUser,
  isProductionView = false,
}: {
  initialData: any;
  currentUser: any;
  isProductionView?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    nextStatus: string;
    title: string;
    field: string;
    label: string;
    value: string;
    isManagerRec?: boolean;
    isRepairLog?: boolean;
  }>({ open: false, nextStatus: "", title: "", field: "", label: "", value: "" });
  
  // Extra fields for repair
  const [repairData, setRepairData] = useState({
    partsReplaced: "",
    repairCost: 0
  });

  // Material Requisition logic
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqItems, setReqItems] = useState<ReqItem[]>([]);
  const [reqNotes, setReqNotes] = useState("");
  const [sendingReq, setSendingReq] = useState(false);

  // Determine if requisition is allowed (only if no open reqs and we are in repair)
  const hasOpenReq = data.materialRequisitions?.some((r: any) => r.status === "PENDING" || r.status === "PARTIALLY_FULFILLED");
  const canRequestMaterials = (data.status === "IN_REPAIR" || data.status === "PENDING_APPROVAL") && !hasOpenReq;

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
    if (reqItems.length === 0 || sendingReq) return;
    
    setSendingReq(true);
    try {
      const res = await fetch(`/api/returns/${data.id}/material-requisition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: reqNotes,
          items: reqItems.map((i) => ({
            materialId: i.materialId,
            quantityRequired: i.quantityRequired,
          })),
        }),
      });
      if (res.ok) {
        setReqDialogOpen(false);
        setReqItems([]);
        const updatedData = await fetch(`/api/returns/${data.id}/material-requisition`).then(r => r.json());
        setData((prev: any) => ({ ...prev, materialRequisitions: updatedData.requisitions }));
      } else {
          console.error(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReq(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "RECEIVED": return { bg: "#FEF3C7", text: "#92400E" };
      case "INSPECTING":
      case "PENDING_APPROVAL": return { bg: "#E0E7FF", text: "#4338CA" };
      case "IN_REPAIR": return { bg: "#DBEAFE", text: "#1E40AF" };
      case "REPAIR_COMPLETED":
      case "READY_FOR_DISPATCH": return { bg: "#ECFCCB", text: "#3F6212" };
      case "DISPATCHED": return { bg: "#DCFCE7", text: "#166534" };
      case "SCRAPPED": return { bg: "#FEE2E2", text: "#991B1B" };
      default: return { bg: "#F3F4F6", text: "#4B5563" };
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "INSPECTING") {
      updateReturn({ status: newStatus });
    } else if (newStatus === "PENDING_APPROVAL") {
      setActionDialog({
        open: true,
        nextStatus: newStatus,
        title: "Submit Inspection Report",
        field: "evaluationNotes",
        label: "Evaluation Notes & Findings",
        value: data.evaluationNotes || "",
      });
    } else if (newStatus === "IN_REPAIR" || newStatus === "SCRAPPED") {
      if (data.status === "PENDING_APPROVAL") {
        // Manager making recommendation
        setActionDialog({
          open: true,
          nextStatus: newStatus,
          title: newStatus === "IN_REPAIR" ? "Approve Repair" : "Recommend Scrap",
          field: "recommendedAction",
          label: "Manager Recommendation Notes",
          value: data.recommendedAction || "",
          isManagerRec: true
        });
      } else {
        updateReturn({ status: newStatus });
      }
    } else if (newStatus === "REPAIR_COMPLETED") {
      setActionDialog({
        open: true,
        nextStatus: newStatus,
        title: "Log Repair Details",
        field: "repairNotes",
        label: "Repair Notes & Actions Taken",
        value: data.repairNotes || "",
        isRepairLog: true
      });
    } else if (newStatus === "READY_FOR_DISPATCH") {
      updateReturn({ status: newStatus });
    } else if (newStatus === "DISPATCHED") {
      setActionDialog({
        open: true,
        nextStatus: newStatus,
        title: "Dispatch Notes",
        field: "dispatchNotes",
        label: "Dispatch Info (e.g. Courier, Tracking #)",
        value: data.dispatchNotes || "",
      });
    }
  };

  const updateReturn = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/returns/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setActionDialog((prev) => ({ ...prev, open: false }));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogSubmit = () => {
    const payload: any = { status: actionDialog.nextStatus };
    if (actionDialog.field) {
      payload[actionDialog.field] = actionDialog.value;
    }
    
    // For manager recommendation
    if (actionDialog.isManagerRec) {
      payload.recommendedAction = actionDialog.value;
    }
    
    // For repair log
    if (actionDialog.isRepairLog) {
      payload.repairNotes = actionDialog.value;
      if (repairData.partsReplaced) {
        try {
          payload.partsReplaced = JSON.parse(`["${repairData.partsReplaced.split(',').join('","')}"]`);
        } catch(e) {
          payload.partsReplaced = [repairData.partsReplaced];
        }
      }
      payload.repairCost = repairData.repairCost;
    }

    updateReturn(payload);
  };

  const statusIndex = STATUS_FLOW.indexOf(data.status);
  const sColor = getStatusColor(data.status);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/returns")}
          sx={{ color: "text.secondary" }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800} sx={{ flex: 1 }}>
          Return #{data.returnNumber}
        </Typography>
        <Chip
          label={data.status.replace(/_/g, " ")}
          sx={{ bgcolor: sColor.bg, color: sColor.text, fontWeight: 700 }}
        />
      </Box>

      {/* Main Info Card */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="text.secondary">
              Customer Information
            </Typography>
            <Typography variant="h6">{data.customer?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: {data.customer?.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {data.customer?.email || "N/A"}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" color="text.secondary">
              Product Details
            </Typography>
            <Typography variant="h6">{data.product?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Product Num: {data.product?.productNumber} | Code: {data.product?.productCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unit ID/Serial: {data.unitId || "N/A"} {data.serialNumber ? `(${data.serialNumber})` : ""}
            </Typography>
            {data.order && (
              <Typography variant="body2" color="text.secondary">
                Original Order: {data.order.orderNumber}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary">
              Issue Reported
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: "#F9FAFB", borderRadius: 2 }}>
              {data.issueReported}
            </Typography>
            {data.condition && (
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                <strong>Condition upon arrival:</strong> {data.condition}
              </Typography>
            )}
            <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.secondary" }}>
              Received by {data.receivedBy?.name} on {new Date(data.dateReceived).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Workflow / Action Panels */}
      <Grid container spacing={3}>
        
        {/* Inspection Panel */}
        {(data.evaluationNotes || data.status === "INSPECTING") && (
          <Grid size={{ xs: 12, md: data.recommendedAction || data.repairNotes ? 4 : 12 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Inspection Details
              </Typography>
              {data.evaluationNotes ? (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {data.evaluationNotes}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                    Handled by {data.handledBy?.name}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Inspection in progress. Submit findings to proceed.
                </Typography>
              )}
            </Paper>
          </Grid>
        )}

        {/* Recommendation Panel */}
        {(data.recommendedAction || data.status === "PENDING_APPROVAL") && (
          <Grid size={{ xs: 12, md: data.evaluationNotes && data.repairNotes ? 4 : (data.evaluationNotes ? 8 : 12) }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", height: '100%', bgcolor: "#F0F9FF" }}>
              <Typography variant="subtitle1" fontWeight={700} color="#0369A1" mb={2}>
                Manager Recommendation
              </Typography>
              {data.recommendedAction ? (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontWeight: 500 }}>
                    {data.recommendedAction}
                  </Typography>
                  <Typography variant="caption" color="#0284C7" sx={{ mt: 2, display: "block" }}>
                    Recommended by {data.recommendedBy?.name} on {new Date(data.recommendationDate).toLocaleString()}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="#0284C7">
                  Pending Production Manager's recommendation to either repair or scrap.
                </Typography>
              )}
            </Paper>
          </Grid>
        )}

        {/* Repair Logs */}
        {(data.repairNotes || data.status === "IN_REPAIR") && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", height: '100%', bgcolor: "#F0FDF4" }}>
              <Typography variant="subtitle1" fontWeight={700} color="#15803D" mb={2}>
                Repair Details
              </Typography>
              {data.repairNotes ? (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {data.repairNotes}
                  </Typography>
                  {data.partsReplaced && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Parts Replaced:</strong> {Array.isArray(data.partsReplaced) ? data.partsReplaced.join(", ") : JSON.stringify(data.partsReplaced)}
                    </Typography>
                  )}
                  {data.repairCost > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Cost:</strong> ₦{data.repairCost.toLocaleString()}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Repair in progress. Log details upon completion.
                  </Typography>

                  {/* Material Requisitions List */}
                  {data.materialRequisitions && data.materialRequisitions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 1.5 }} />
                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Requests to Store</Typography>
                          {data.materialRequisitions.map((req: any) => (
                              <Box key={req.id} sx={{ mb: 2, p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #E5E7EB' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" fontWeight={700}>{req.requisitionNumber}</Typography>
                                    <Chip 
                                        label={statusConfig[req.status]?.label || req.status} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: statusConfig[req.status]?.bg, 
                                            color: statusConfig[req.status]?.text, 
                                            fontSize: '0.65rem',
                                            height: 20
                                        }} 
                                    />
                                  </Box>
                                  {req.items?.map((item: any) => (
                                      <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                          <Typography variant="caption">{item.material.name}</Typography>
                                          <Typography variant="caption" color="text.secondary">
                                              {item.quantityIssued != null ? item.quantityIssued : 0} / {item.quantityRequired} {item.material.unit}
                                          </Typography>
                                      </Box>
                                  ))}
                              </Box>
                          ))}
                      </Box>
                  )}

                  {isProductionView && (
                    <Button 
                      variant="outlined" 
                      startIcon={<BuildIcon />}
                      size="small"
                      onClick={() => setReqDialogOpen(true)}
                      disabled={!canRequestMaterials}
                      fullWidth
                      sx={{ mt: 2, textTransform: 'none', borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2', borderColor: '#B91C1C' } }}
                    >
                      Request Repair Materials
                    </Button>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        )}

      </Grid>

      {/* Action Bar */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {data.status === "RECEIVED" && !isProductionView && (
          <Button variant="contained" onClick={() => handleStatusChange("INSPECTING")} disabled={loading}>
            Start Inspection
          </Button>
        )}
        
        {data.status === "INSPECTING" && isProductionView && (
          <Button variant="contained" color="primary" onClick={() => handleStatusChange("PENDING_APPROVAL")} disabled={loading}>
            Submit Findings for Approval
          </Button>
        )}
        
        {data.status === "PENDING_APPROVAL" && isProductionView && (
          <>
            <Button variant="outlined" color="error" onClick={() => handleStatusChange("SCRAPPED")} disabled={loading}>
              Scrap Unit
            </Button>
            <Button variant="contained" color="success" onClick={() => handleStatusChange("IN_REPAIR")} disabled={loading}>
              Approve Repair
            </Button>
          </>
        )}
        
        {data.status === "IN_REPAIR" && isProductionView && (
          <Button variant="contained" onClick={() => handleStatusChange("REPAIR_COMPLETED")} disabled={loading}>
            Mark Repair Complete
          </Button>
        )}

        {data.status === "REPAIR_COMPLETED" && isProductionView && (
          <Button variant="contained" color="success" onClick={() => handleStatusChange("READY_FOR_DISPATCH")} disabled={loading}>
            Move to Dispatch
          </Button>
        )}

        {data.status === "READY_FOR_DISPATCH" && !isProductionView && (
          <Button variant="contained" color="info" onClick={() => handleStatusChange("DISPATCHED")} disabled={loading}>
            Dispatch Unit
          </Button>
        )}

        {(data.status === "RECEIVED" || data.status === "READY_FOR_DISPATCH") && isProductionView && (
               <Box sx={{ p: 2, bgcolor: "#FEF2F2", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {data.status === "RECEIVED" ? "Awaiting Sales to send to Production." : "Awaiting Sales to dispatch."}
                  </Typography>
               </Box>
            )}
      </Box>

      {/* Reusable Dialog for Data Entry */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog(prev => ({ ...prev, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label={actionDialog.label}
            multiline
            rows={4}
            value={actionDialog.value}
            onChange={(e) => setActionDialog(prev => ({ ...prev, value: e.target.value }))}
            sx={{ mb: actionDialog.isRepairLog ? 2 : 0 }}
          />
          
          {actionDialog.isRepairLog && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Parts Replaced (comma separated)"
                  value={repairData.partsReplaced}
                  onChange={(e) => setRepairData(p => ({ ...p, partsReplaced: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Repair Cost"
                  value={repairData.repairCost}
                  onChange={(e) => setRepairData(p => ({ ...p, repairCost: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(prev => ({ ...prev, open: false }))} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDialogSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Materials Dialog */}
      <Dialog
        open={reqDialogOpen}
        onClose={() => !sendingReq && setReqDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "#FFF5F5",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <span>Request Repair Materials from Inventory</span>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 0, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              <AddIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }} />
              Add Material from Inventory
            </Typography>
            <MaterialSearchPicker onAdd={handleAddMaterial} alreadyAdded={reqItems.map((i) => i.materialId)} />
          </Box>

          <Box sx={{ px: 2, pb: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Materials to Request ({reqItems.length})
            </Typography>
          </Box>

          {reqItems.length === 0 ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Search and add materials from inventory.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ px: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600, pl: 2 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">In Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 150 }} align="center">Qty Needed</TableCell>
                    <TableCell align="center" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reqItems.map((item) => (
                    <TableRow key={item.materialId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ pl: 2 }}>
                        <Typography variant="body2" fontWeight={700}>{item.materialName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.category?.replace(/_/g, " ")} · {item.unit}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{item.partNumber}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} color={item.currentStock >= item.quantityRequired ? "#16A34A" : "#DC2626"}>
                          {item.currentStock} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={item.quantityRequired}
                          onChange={(e) => handleQtyChange(item.materialId, e.target.value)}
                          size="small"
                          inputProps={{ min: 0.001, step: 0.001 }}
                          sx={{ 
                              width: 100, 
                              "& input": { textAlign: "center", fontWeight: 700 } 
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => handleRemoveItem(item.materialId)} sx={{ color: "#DC2626" }}>
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

          <Box sx={{ p: 2 }}>
            <TextField
              label="Repair Notes for Inventory (optional)"
              multiline rows={2} fullWidth
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder="e.g., Replacement parts for faulty Unit"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "action.hover" }}>
          <Button onClick={() => setReqDialogOpen(false)} disabled={sendingReq}>Cancel</Button>
          <Button
            variant="contained"
            onClick={sendRequisition}
            disabled={sendingReq || reqItems.length === 0}
            startIcon={sendingReq ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            sx={{ bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" } }}
          >
            {sendingReq ? "Sending..." : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
