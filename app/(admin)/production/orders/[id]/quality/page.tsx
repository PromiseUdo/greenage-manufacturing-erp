"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Skeleton,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LoopIcon from "@mui/icons-material/Loop";
import VerifiedIcon from "@mui/icons-material/Verified";
import GavelIcon from "@mui/icons-material/Gavel";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { REJECTION_CATEGORIES } from "@/lib/production-stages";

const CHECKPOINT_OPTIONS = [
  { value: "P-3", label: "P-3 — Incoming QC PASS?" },
  { value: "A-2.6", label: "A-2.6 — BMS Test PASS?" },
  { value: "QC-2", label: "QC-2 — Post-Assembly QC PASS?" },
  {
    value: "QC-6",
    label: "QC-6 — Final Ageing PASS? (determines packaged quantity)",
  },
];

const OUTCOME_OPTIONS = [
  { value: "PASS", label: "PASS — All units approved" },
  { value: "FAIL", label: "FAIL — Units scrapped/rejected" },
  { value: "REWORK", label: "REWORK — Sent back for correction" },
  { value: "PARTIAL", label: "PARTIAL — Some pass, some fail" },
];

const outcomeColors: Record<string, { bg: string; text: string }> = {
  PASS: { bg: "#DCFCE7", text: "#166534" },
  FAIL: { bg: "#FEE2E2", text: "#991B1B" },
  REWORK: { bg: "#FEF3C7", text: "#92400E" },
  PARTIAL: { bg: "#EDE9FE", text: "#4C1D95" },
};

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface QCEntry {
  id: string;
  checkpointStepId: string;
  checkpointName: string;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  quantityReworked: number;
  outcome: string;
  failureCategory: string | null;
  failureDetails: string | null;
  correctiveAction: string | null;
  recordedBy: { id: string; name: string };
  createdAt: string;
}

interface QCTotals {
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  totalReworked: number;
}

const defaultForm = {
  checkpointStepId: "QC-6",
  checkpointName: "FINAL PASS? (Decision Point)",
  quantityInspected: "",
  quantityPassed: "",
  quantityFailed: "",
  quantityReworked: "0",
  outcome: "PASS",
  failureCategory: "",
  failureDetails: "",
  correctiveAction: "",
};

export default function ProductionQualityPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order, refresh } = useOrderContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params passed from the tracking page when a decision-point step is clicked
  const initCheckpoint = searchParams.get("checkpoint") ?? "";
  const completeAction = searchParams.get("completeAction") ?? ""; // "stageId:actionId"
  const fromTracking = !!initCheckpoint;

  const [entries, setEntries] = useState<QCEntry[]>([]);
  const [totals, setTotals] = useState<QCTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}/qc-entries`);
      const data = await res.json();
      setEntries(data.qcEntries || []);
      setTotals(data.totals || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-open dialog when arriving from tracking page
  useEffect(() => {
    if (initCheckpoint && order) {
      const opt = CHECKPOINT_OPTIONS.find((o) => o.value === initCheckpoint);
      if (opt) {
        setForm({
          ...defaultForm,
          checkpointStepId: initCheckpoint,
          checkpointName: opt.label.split(" — ")[1] || "",
          quantityInspected: String(order.quantity ?? ""),
        });
        setDialogOpen(true);
      }
    }
    // Only run once when order is first loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handleCheckpointChange = (stepId: string) => {
    const opt = CHECKPOINT_OPTIONS.find((o) => o.value === stepId);
    setForm((f) => ({
      ...f,
      checkpointStepId: stepId,
      checkpointName: opt?.label.split(" — ")[1] || "",
      quantityInspected: String(order?.quantity ?? ""),
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.checkpointStepId || !form.quantityInspected) {
      setError("Please fill in checkpoint and quantity inspected.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}/qc-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointStepId: form.checkpointStepId,
          checkpointName: form.checkpointName,
          quantityInspected: parseInt(form.quantityInspected),
          quantityPassed: parseInt(form.quantityPassed || "0"),
          quantityFailed: parseInt(form.quantityFailed || "0"),
          quantityReworked: parseInt(form.quantityReworked || "0"),
          outcome: form.outcome,
          failureCategory: form.failureCategory || null,
          failureDetails: form.failureDetails || null,
          correctiveAction: form.correctiveAction || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      // If triggered from tracking, also mark the task as COMPLETED then redirect
      if (fromTracking && completeAction) {
        const [stageId, actionId] = completeAction.split(":");
        if (stageId && actionId) {
          await fetch(
            `/api/production/orders/${orderId}/stages/${stageId}/actions/${actionId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "COMPLETED",
                decisionOutcome: form.outcome,
              }),
            },
          );
        }
        refresh();
        router.push(`/production/orders/${orderId}/tracking`);
        return;
      }

      setDialogOpen(false);
      setForm({
        ...defaultForm,
        quantityInspected: String(order?.quantity ?? ""),
      });
      await fetchEntries();
    } finally {
      setSubmitting(false);
    }
  };

  const isFailing =
    form.outcome === "FAIL" ||
    form.outcome === "REWORK" ||
    form.outcome === "PARTIAL";

  const pieData = totals
    ? [
        { name: "Passed", value: totals.totalPassed, fill: "#16A34A" },
        { name: "Failed", value: totals.totalFailed, fill: "#DC2626" },
        { name: "Reworked", value: totals.totalReworked, fill: "#D97706" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Box>
      {/* Yield Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Units Passed QC",
            value: order?.quantityPassed ?? "—",
            icon: <CheckCircleIcon />,
            color: "#16A34A",
            bg: "#DCFCE7",
          },
          {
            label: "Units Rejected",
            value: order?.quantityRejected ?? "—",
            icon: <CancelIcon />,
            color: "#DC2626",
            bg: "#FEE2E2",
          },
          {
            label: "Sent for Rework",
            value: (order as any)?.quantityReworked ?? "—",
            icon: <LoopIcon />,
            color: "#D97706",
            bg: "#FEF3C7",
          },
          {
            label: "Yield Rate",
            value:
              order?.yieldRate !== null && order?.yieldRate !== undefined
                ? `${order.yieldRate}%`
                : "—",
            icon: <VerifiedIcon />,
            color: "#6366F1",
            bg: "#EEF2FF",
          },
        ].map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 2,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: kpi.bg,
                    color: kpi.color,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color={kpi.color}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {kpi.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pie chart + log side by side */}
      <Grid container spacing={2}>
        {/* Pie chart */}
        {pieData.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                height: "100%",
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Quality Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} units`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {order?.quantityPackaged !== null &&
                  order?.quantityPackaged !== undefined && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: "#F0FDF4",
                        borderRadius: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Ready for Store
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="#16A34A">
                        {order.quantityPackaged} units
                      </Typography>
                    </Box>
                  )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* QC Log table */}
        <Grid size={{ xs: 12, md: pieData.length > 0 ? 8 : 12 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  QC Checkpoint Log
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setForm({
                      ...defaultForm,
                      quantityInspected: String(order?.quantity ?? ""),
                    });
                    setDialogOpen(true);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Record QC Entry
                </Button>
              </Box>

              {loading ? (
                <Box>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
                  ))}
                </Box>
              ) : entries.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <GavelIcon
                    sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No QC entries recorded yet.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use the tracking tab's decision points or the button above
                    to record.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Checkpoint
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Inspected
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Passed
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Failed
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Reworked
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Outcome</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Failure Details
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Recorded By
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id} sx={{ verticalAlign: "top" }}>
                          <TableCell>
                            <Chip
                              label={entry.checkpointStepId}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {entry.checkpointName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600}>
                              {entry.quantityInspected}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="#16A34A">
                              {entry.quantityPassed}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="#DC2626">
                              {entry.quantityFailed}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="#D97706">
                              {entry.quantityReworked}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.outcome}
                              size="small"
                              sx={{
                                bgcolor: outcomeColors[entry.outcome]?.bg,
                                color: outcomeColors[entry.outcome]?.text,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            {entry.failureCategory && (
                              <Typography
                                variant="caption"
                                display="block"
                                fontWeight={600}
                                color="error"
                              >
                                {REJECTION_CATEGORIES.find(
                                  (r) => r.value === entry.failureCategory,
                                )?.label ?? entry.failureCategory}
                              </Typography>
                            )}
                            {entry.failureDetails && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {entry.failureDetails}
                              </Typography>
                            )}
                            {entry.correctiveAction && (
                              <Typography
                                variant="caption"
                                display="block"
                                color="primary.main"
                                sx={{ mt: 0.3 }}
                              >
                                ↳ {entry.correctiveAction}
                              </Typography>
                            )}
                            {!entry.failureCategory &&
                              !entry.failureDetails &&
                              "—"}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {entry.recordedBy.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDateTime(entry.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Record QC Entry Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          // From tracking: don't let user dismiss without submitting
          if (!fromTracking) setDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Record QC Checkpoint Entry
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {fromTracking && (
              <Alert
                severity="info"
                icon={false}
                sx={{ borderRadius: 2, fontWeight: 500 }}
              >
                Complete this checkpoint entry to mark the task as done and
                return to the process tab.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel>Checkpoint</InputLabel>
              <Select
                value={form.checkpointStepId}
                label="Checkpoint"
                onChange={(e) => handleCheckpointChange(e.target.value)}
                disabled={fromTracking}
              >
                {CHECKPOINT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {fromTracking && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, ml: 0.5 }}
                >
                  Checkpoint is pre-selected from the process step.
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Outcome</InputLabel>
              <Select
                value={form.outcome}
                label="Outcome"
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              >
                {OUTCOME_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Quantity Inspected"
                  type="number"
                  value={form.quantityInspected}
                  onChange={(e) =>
                    setForm({ ...form, quantityInspected: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Quantity Passed"
                  type="number"
                  value={form.quantityPassed}
                  onChange={(e) =>
                    setForm({ ...form, quantityPassed: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Quantity Failed"
                  type="number"
                  value={form.quantityFailed}
                  onChange={(e) =>
                    setForm({ ...form, quantityFailed: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Quantity Reworked"
                  type="number"
                  value={form.quantityReworked}
                  onChange={(e) =>
                    setForm({ ...form, quantityReworked: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            {isFailing && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Failure Category</InputLabel>
                  <Select
                    value={form.failureCategory}
                    label="Failure Category"
                    onChange={(e) =>
                      setForm({ ...form, failureCategory: e.target.value })
                    }
                  >
                    {REJECTION_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Failure Details / Root Cause"
                  multiline
                  rows={3}
                  value={form.failureDetails}
                  onChange={(e) =>
                    setForm({ ...form, failureDetails: e.target.value })
                  }
                  fullWidth
                />

                <TextField
                  label="Corrective Action Taken"
                  multiline
                  rows={2}
                  value={form.correctiveAction}
                  onChange={(e) =>
                    setForm({ ...form, correctiveAction: e.target.value })
                  }
                  placeholder="What was done to address this? (e.g. sent to rework, quarantined, scrapped)"
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {!fromTracking && (
            <Button
              onClick={() => setDialogOpen(false)}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
          )}
          {fromTracking && (
            <Button
              onClick={() =>
                router.push(`/production/orders/${orderId}/tracking`)
              }
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Back to Process
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
          >
            {submitting
              ? "Saving..."
              : fromTracking
                ? "Save & Mark Complete"
                : "Save Entry"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
