"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrderContext } from "../layout";
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
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
  LinearProgress,
  Collapse,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import GavelIcon from "@mui/icons-material/Gavel";
import InventoryIcon from "@mui/icons-material/Inventory";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { REJECTION_CATEGORIES } from "@/lib/production-stages";
import ActivitiesPanel from "./activities-panel";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DecisionDialogData {
  actionId: string;
  stageId: string;
  stepId: string;
  actionName: string;
  quantityMax: number;
}

interface ChecksheetDialog {
  actionId: string;
  stageId: string;
}

// ─── A-3 Checksheet items ────────────────────────────────────────────────────
const A3_CHECKS = [
  { key: "circuit_breakers", label: "Circuit Breakers mounted and secured" },
  { key: "lcd_connected", label: "LCD panel connected and operational" },
  {
    key: "internal_wiring",
    label: "All internal wires connected per wiring diagram",
  },
  {
    key: "dwi_referenced",
    label: "DWI (Detailed Work Instruction) referenced and followed",
  },
];

// ─── Status config ───────────────────────────────────────────────────────────
const stepStatusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  PENDING: {
    icon: <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />,
    color: "#9CA3AF",
    label: "Pending",
  },
  IN_PROGRESS: {
    icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} />,
    color: "#2563EB",
    label: "In Progress",
  },
  COMPLETED: {
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
    color: "#16A34A",
    label: "Completed",
  },
  SKIPPED: {
    icon: <SkipNextIcon sx={{ fontSize: 18 }} />,
    color: "#7C3AED",
    label: "Skipped",
  },
  FAILED: {
    icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
    color: "#DC2626",
    label: "Failed",
  },
};

const stageStatusBg: Record<string, string> = {
  NOT_STARTED: "#F9FAFB",
  IN_PROGRESS: "#EFF6FF",
  COMPLETED: "#F0FDF4",
};

const stepSectionBorder: Record<string, string> = {
  PENDING: "#E5E7EB",
  IN_PROGRESS: "#BFDBFE",
  COMPLETED: "#BBF7D0",
  SKIPPED: "#DDD6FE",
  FAILED: "#FECACA",
};

const formatDateTime = (d: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Step Card ───────────────────────────────────────────────────────────────
interface StepCardProps {
  action: any;
  stage: any;
  orderId: string;
  order: any;
  updating: string | null;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onDecision: () => void;
  onQCLog: () => void;
  onMaterialRequest: () => void;
  onActivityAdded: () => void;
}

function StepCard({
  action,
  stage,
  orderId,
  order,
  updating,
  onStart,
  onComplete,
  onSkip,
  onDecision,
  onQCLog,
  onMaterialRequest,
  onActivityAdded,
}: StepCardProps) {
  const [showActivity, setShowActivity] = useState(false);
  const status = action.status as string;
  const statusCfg = stepStatusConfig[status] ?? stepStatusConfig.PENDING;
  const isDecision =
    !!action.isDecisionPoint ||
    ["P-3", "A-2.6", "QC-2", "QC-6"].includes(action.stepId);
  const isA3 = action.stepId === "A-3";
  const isP1 = action.stepId === "P-1";
  const isP4 = action.stepId === "P-4";
  const isQC3 = action.stepId === "QC-3";
  const isDone = status === "COMPLETED" || status === "SKIPPED";
  const isActive = order?.status !== "DRAFT";
  const isUpdating = updating === action.id;

  const borderColor = stepSectionBorder[status] ?? "#E5E7EB";

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: borderColor,
        borderLeft: `4px solid ${isDecision ? "#F59E0B" : statusCfg.color}`,
        borderRadius: 2,
        mb: 1.5,
        overflow: "hidden",
        bgcolor:
          isDecision && !isDone
            ? "#FFFBEB"
            : status === "COMPLETED"
              ? "#F0FDF4"
              : "background.paper",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
      }}
    >
      {/* Step Header */}
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {/* Step ID badge */}
          <Box
            sx={{
              minWidth: 48,
              height: 32,
              borderRadius: 1.5,
              bgcolor: isDecision ? "#FEF3C7" : "#F3F4F6",
              border: `1px solid ${isDecision ? "#FCD34D" : "#E5E7EB"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: isDecision ? "#92400E" : "#374151",
                fontSize: "0.72rem",
              }}
            >
              {action.stepId}
            </Typography>
          </Box>

          {/* Title + goal */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                mb: 0.3,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{
                  color: isDone ? "#6B7280" : "#111827",
                  textDecoration: isDone ? "line-through" : "none",
                  lineHeight: 1.3,
                }}
              >
                {action.actionName}
                {isDecision && (
                  <GavelIcon
                    sx={{
                      fontSize: 14,
                      color: "#F59E0B",
                      ml: 0.5,
                      verticalAlign: "middle",
                    }}
                  />
                )}
              </Typography>
            </Box>

            {action.focusGoal && !action.isDecisionPoint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.4, mb: 0.5 }}
              >
                {action.focusGoal}
              </Typography>
            )}

            {/* Meta row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              {/* Responsible */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#E0E7FF",
                    color: "#4338CA",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(action.responsible?.name ?? action.defaultResponsibility)
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {action.responsible?.name ?? action.defaultResponsibility}
                </Typography>
              </Box>

              {/* Status badge */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: statusCfg.color,
                }}
              >
                {statusCfg.icon}
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ color: statusCfg.color }}
                >
                  {statusCfg.label}
                </Typography>
              </Box>

              {/* Decision outcome */}
              {action.decisionOutcome && (
                <Chip
                  label={`Decision: ${action.decisionOutcome}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor:
                      action.decisionOutcome === "PASS"
                        ? "#DCFCE7"
                        : action.decisionOutcome === "REWORK"
                          ? "#FEF3C7"
                          : "#FEE2E2",
                    color:
                      action.decisionOutcome === "PASS"
                        ? "#166534"
                        : action.decisionOutcome === "REWORK"
                          ? "#92400E"
                          : "#991B1B",
                  }}
                />
              )}
            </Box>

            {/* Rejection reason */}
            {action.rejectionReason && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 0.5, fontWeight: 600 }}
              >
                ⚠ {action.rejectionReason}
              </Typography>
            )}

            {/* Timestamps */}
            {action.startedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Started: {formatDateTime(action.startedAt)}
                {action.completedAt &&
                  ` · Completed: ${formatDateTime(action.completedAt)}`}
              </Typography>
            )}
          </Box>

          {/* Right: status icon for completed */}
          {isDone && (
            <Box sx={{ flexShrink: 0 }}>
              {status === "COMPLETED" ? (
                <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 22 }} />
              ) : (
                <SkipNextIcon sx={{ color: "#7C3AED", fontSize: 22 }} />
              )}
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        {!isDone && isActive && (
          <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {isDecision ? (
              <Button
                size="small"
                variant="contained"
                startIcon={
                  isUpdating ? (
                    <CircularProgress size={12} color="inherit" />
                  ) : (
                    <CheckCircleOutlineIcon />
                  )
                }
                onClick={onQCLog}
                disabled={!!updating}
                sx={{
                  bgcolor: "#7C3AED",
                  "&:hover": { bgcolor: "#6D28D9" },
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2,
                  py: 0.8,
                  fontSize: "0.8rem",
                }}
              >
                Log &amp; Mark Complete
              </Button>
            ) : (
              <>
                {status === "PENDING" && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      isUpdating ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <PlayArrowIcon />
                      )
                    }
                    onClick={onStart}
                    disabled={!!updating}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2,
                      py: 0.7,
                      borderColor: "#2563EB",
                      color: "#2563EB",
                    }}
                  >
                    Start
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  onClick={onComplete}
                  disabled={!!updating}
                  sx={{
                    bgcolor: isA3 ? "#6366F1" : "#16A34A",
                    "&:hover": {
                      bgcolor: isA3 ? "#4F46E5" : "#15803D",
                    },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 0.7,
                    fontSize: "0.8rem",
                  }}
                >
                  {isA3
                    ? "Complete with Checksheet"
                    : "Mark Complete"}
                </Button>
                <Tooltip title="Skip this step">
                  <IconButton
                    size="small"
                    onClick={onSkip}
                    disabled={!!updating}
                    sx={{
                      color: "#7C3AED",
                      border: "1px solid #DDD6FE",
                      borderRadius: 2,
                    }}
                  >
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* P-1: Initial BOM Material Request button */}
            {isP1 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={onMaterialRequest}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.7,
                  borderColor: "#16A34A",
                  color: "#16A34A",
                  bgcolor: "#F0FDF4",
                  "&:hover": { bgcolor: "#DCFCE7" },
                  fontSize: "0.78rem",
                }}
              >
                Initiate Material Request (BOM)
              </Button>
            )}

            {/* P-4: Replacement Material request button */}
            {isP4 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={onMaterialRequest}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.7,
                  borderColor: "#DC2626",
                  color: "#DC2626",
                  bgcolor: "#FFF5F5",
                  "&:hover": { bgcolor: "#FEE2E2" },
                  fontSize: "0.78rem",
                }}
              >
                Initiate Replacement Request
              </Button>
            )}
          </Box>
        )}

        {/* QC-3 note */}
        {isQC3 && !isDone && isActive && (
          <Alert
            severity="warning"
            sx={{ mt: 1.5, borderRadius: 2, py: 0.5, fontSize: "0.78rem" }}
          >
            Log rework details in the comments below. Send corrected unit back
            to relevant Assembly step (A-3/A-4).
          </Alert>
        )}
      </Box>

      {/* Activity Toggle */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          px: { xs: 1.5, sm: 2 },
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          bgcolor: showActivity ? "#F3F4F6" : "transparent",
          transition: "background 0.15s",
          "&:hover": { bgcolor: "#F3F4F6" },
        }}
        onClick={() => setShowActivity((prev) => !prev)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 15, color: "#6B7280" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Comments & Attachments
          </Typography>
          {!showActivity && (
            <Chip
              label={action._count?.activities || 0}
              size="small"
              sx={{
                height: 18,
                minWidth: 18,
                borderRadius: 9,
                fontSize: "0.65rem",
                fontWeight: 800,
                bgcolor: action._count?.activities > 0 ? "#E0E7FF" : "#F3F4F6",
                color: action._count?.activities > 0 ? "#4338CA" : "#9CA3AF",
                ml: 0.5,
              }}
            />
          )}
        </Box>
        {showActivity ? (
          <KeyboardArrowUpIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
        ) : (
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
        )}
      </Box>

      {/* Activity Panel */}
      <Collapse in={showActivity}>
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 0.5, pb: 2 }}>
          <ActivitiesPanel
            orderId={orderId}
            stageId={stage.id}
            actionId={action.id}
            stepId={action.stepId}
            onActivityAdded={onActivityAdded}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Stage Lane ──────────────────────────────────────────────────────────────
function StageLane({
  stage,
  orderId,
  order,
  updating,
  setUpdating,
  refresh,
}: {
  stage: any;
  orderId: string;
  order: any;
  updating: string | null;
  setUpdating: (v: string | null) => void;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(stage.status !== "COMPLETED");

  const totalSteps = stage.actionItems?.length ?? 0;
  const doneSteps =
    stage.actionItems?.filter(
      (a: any) => a.status === "COMPLETED" || a.status === "SKIPPED",
    ).length ?? 0;
  const progress =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const stageBorderColor =
    stage.status === "COMPLETED"
      ? "#16A34A"
      : stage.status === "IN_PROGRESS"
        ? "#2563EB"
        : "#D1D5DB";

  // ── Confirm dialog (for Start / Mark Complete) ──────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
  } | null>(null);

  const withConfirm = (
    title: string,
    body: string,
    confirmLabel: string,
    confirmColor: string,
    action: () => void,
  ) => {
    setConfirmDialog({
      title,
      body,
      confirmLabel,
      confirmColor,
      onConfirm: action,
    });
  };



  const updateAction = useCallback(
    async (stageId: string, actionId: string, body: any) => {
      setUpdating(actionId);
      try {
        await fetch(
          `/api/production/orders/${orderId}/stages/${stageId}/actions/${actionId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        await refresh();
      } finally {
        setUpdating(null);
      }
    },
    [orderId, refresh, setUpdating],
  );

  const updateStage = useCallback(
    async (stageId: string, body: any) => {
      setUpdating(stageId);
      try {
        await fetch(`/api/production/orders/${orderId}/stages/${stageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await refresh();
      } finally {
        setUpdating(null);
      }
    },
    [orderId, refresh, setUpdating],
  );

  const [decisionDialog, setDecisionDialog] =
    useState<DecisionDialogData | null>(null);
  const [decisionForm, setDecisionForm] = useState({
    outcome: "PASS",
    quantityAffected: "",
    rejectionReason: "",
    rejectionCategory: "",
    notes: "",
  });

  const [a3Dialog, setA3Dialog] = useState<ChecksheetDialog | null>(null);
  const [a3Checks, setA3Checks] = useState<Record<string, boolean>>({
    circuit_breakers: false,
    lcd_connected: false,
    internal_wiring: false,
    dwi_referenced: false,
  });
  const [a3Notes, setA3Notes] = useState("");
  const allA3Checked = Object.values(a3Checks).every(Boolean);

  const router = useRouter();

  const handleDecisionSubmit = async () => {
    if (!decisionDialog) return;
    const { actionId, stageId, stepId, actionName } = decisionDialog;
    const outcome = decisionForm.outcome;
    const isFail = outcome === "FAIL" || outcome === "REWORK";

    await updateAction(stageId, actionId, {
      status: "COMPLETED",
      decisionOutcome: outcome,
      quantityAffected: decisionForm.quantityAffected
        ? parseInt(decisionForm.quantityAffected)
        : null,
      rejectionReason: isFail ? decisionForm.rejectionReason : null,
      rejectionCategory: isFail ? decisionForm.rejectionCategory : null,
      notes: decisionForm.notes || null,
    });

    if (["QC-2", "QC-6", "P-3", "A-2.6"].includes(stepId)) {
      const qty =
        parseInt(decisionForm.quantityAffected) || order?.quantity || 0;
      await fetch(`/api/production/orders/${orderId}/qc-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointStepId: stepId,
          checkpointName: actionName,
          quantityInspected: qty,
          quantityPassed: outcome === "PASS" ? qty : 0,
          quantityFailed: outcome === "FAIL" ? qty : 0,
          quantityReworked: outcome === "REWORK" ? qty : 0,
          outcome,
          failureCategory: decisionForm.rejectionCategory || null,
          failureDetails: decisionForm.rejectionReason || null,
          correctiveAction: null,
        }),
      });
    }

    setDecisionDialog(null);
    setDecisionForm({
      outcome: "PASS",
      quantityAffected: "",
      rejectionReason: "",
      rejectionCategory: "",
      notes: "",
    });
  };

  const submitA3 = async () => {
    if (!a3Dialog) return;
    const checkResults = A3_CHECKS.map((c) => ({
      label: c.label,
      checked: a3Checks[c.key],
    }));
    await updateAction(a3Dialog.stageId, a3Dialog.actionId, {
      status: "COMPLETED",
      notes: JSON.stringify({
        type: "A3_CHECKSHEET",
        checks: checkResults,
        additionalNotes: a3Notes,
      }),
    });
    setA3Dialog(null);
  };

  return (
    <Box
      sx={{
        mb: 2.5,
        border: "1px solid",
        borderColor: stageBorderColor,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Stage Header */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          p: { xs: 1.5, sm: 2 },
          bgcolor: stageStatusBg[stage.status] ?? "#F9FAFB",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 2,
          "&:hover": { opacity: 0.92 },
        }}
      >
        {/* Stage status icon */}
        <Box sx={{ flexShrink: 0, color: stageBorderColor }}>
          {stage.status === "COMPLETED" ? (
            <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 24 }} />
          ) : stage.status === "IN_PROGRESS" ? (
            <HourglassEmptyIcon sx={{ color: "#2563EB", fontSize: 24 }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: "#9CA3AF", fontSize: 24 }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              fontWeight={800}
              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
            >
              Stage {stage.sortOrder}: {stage.stageLabel}
            </Typography>
            <Chip
              label={stage.status.replace(/_/g, " ")}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.65rem",
                bgcolor:
                  stage.status === "COMPLETED"
                    ? "#DCFCE7"
                    : stage.status === "IN_PROGRESS"
                      ? "#DBEAFE"
                      : "#F3F4F6",
                color:
                  stage.status === "COMPLETED"
                    ? "#166534"
                    : stage.status === "IN_PROGRESS"
                      ? "#1E40AF"
                      : "#6B7280",
              }}
            />
            <Chip
              label={`${doneSteps}/${totalSteps} steps`}
              size="small"
              sx={{ bgcolor: "#F3F4F6", color: "#374151", fontSize: "0.65rem" }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 0.8,
              height: 5,
              borderRadius: 3,
              bgcolor: "#E5E7EB",
              "& .MuiLinearProgress-bar": {
                borderRadius: 3,
                bgcolor: progress === 100 ? "#16A34A" : "#2563EB",
              },
            }}
          />
        </Box>

        <Box sx={{ flexShrink: 0, color: "#9CA3AF" }}>
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Box>
      </Box>

      {/* Stage Contents */}
      <Collapse in={open}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {stage.actionItems?.map((action: any) => (
            <StepCard
              key={action.id}
              action={action}
              stage={stage}
              orderId={orderId}
              order={order}
              updating={updating}
              onActivityAdded={refresh}
              onStart={() =>
                withConfirm(
                  "Start Task",
                  `Start "${action.actionName}" (${action.stepId})? This cannot be undone.`,
                  "Start",
                  "#2563EB",
                  () =>
                    updateAction(stage.id, action.id, {
                      status: "IN_PROGRESS",
                    }),
                )
              }
              onComplete={() => {
                if (action.stepId === "A-3") {
                  // A-3 has its own checksheet dialog — no extra confirm needed
                  setA3Checks({
                    circuit_breakers: false,
                    lcd_connected: false,
                    internal_wiring: false,
                    dwi_referenced: false,
                  });
                  setA3Notes("");
                  setA3Dialog({ actionId: action.id, stageId: stage.id });
                } else {
                  withConfirm(
                    "Mark as Complete",
                    `Mark "${action.actionName}" (${action.stepId}) as complete? This action cannot be reversed.`,
                    "Mark Complete",
                    "#16A34A",
                    () =>
                      updateAction(stage.id, action.id, {
                        status: "COMPLETED",
                      }),
                  );
                }
              }}
              onSkip={() =>
                withConfirm(
                  "Skip This Step",
                  `Skip "${action.actionName}" (${action.stepId})? This cannot be undone.`,
                  "Skip Step",
                  "#7C3AED",
                  () =>
                    updateAction(stage.id, action.id, { status: "SKIPPED" }),
                )
              }
              onDecision={() => {
                setDecisionDialog({
                  actionId: action.id,
                  stageId: stage.id,
                  stepId: action.stepId,
                  actionName: action.actionName,
                  quantityMax: order?.quantity ?? 0,
                });
                setDecisionForm({
                  outcome: "PASS",
                  quantityAffected: String(order?.quantity ?? ""),
                  rejectionReason: "",
                  rejectionCategory: "",
                  notes: "",
                });
              }}
              onQCLog={() => {
                router.push(
                  `/production/orders/${orderId}/quality` +
                    `?checkpoint=${action.stepId}` +
                    `&completeAction=${stage.id}:${action.id}`,
                );
              }}
              onMaterialRequest={() => {
                // Navigate to Materials tab
                router.push(`/production/orders/${orderId}/materials`);
              }}
            />
          ))}

          {/* Stage footer actions */}
          {/* {stage.status !== "COMPLETED" && order?.status !== "DRAFT" && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 1,
                pt: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              {stage.status === "NOT_STARTED" && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={() =>
                    updateStage(stage.id, { status: "IN_PROGRESS" })
                  }
                  disabled={!!updating}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Start Stage
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                startIcon={
                  updating === stage.id ? (
                    <CircularProgress size={13} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
                onClick={() => updateStage(stage.id, { status: "COMPLETED" })}
                disabled={!!updating}
                sx={{
                  bgcolor: "#16A34A",
                  "&:hover": { bgcolor: "#15803D" },
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Mark Stage Complete
              </Button>
            </Box>
          )} */}
        </Box>
      </Collapse>

      {/* ─── Decision Point Dialog ─── */}
      <Dialog
        open={!!decisionDialog}
        onClose={() => setDecisionDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <GavelIcon
            sx={{ verticalAlign: "text-bottom", mr: 1, color: "#F59E0B" }}
          />
          Record Decision — {decisionDialog?.stepId}
        </DialogTitle>
        <DialogContent dividers>
          {decisionDialog && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
            >
              <FormControl fullWidth>
                <InputLabel>Outcome</InputLabel>
                <Select
                  value={decisionForm.outcome}
                  label="Outcome"
                  onChange={(e) =>
                    setDecisionForm({
                      ...decisionForm,
                      outcome: e.target.value,
                    })
                  }
                >
                  <MenuItem value="PASS">
                    ✅ PASS — Proceed to next step
                  </MenuItem>
                  <MenuItem value="FAIL">
                    ❌ FAIL — Units rejected / scrapped
                  </MenuItem>
                  <MenuItem value="REWORK">
                    🔄 REWORK — Send back for correction
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Quantity Affected"
                type="number"
                value={decisionForm.quantityAffected}
                onChange={(e) =>
                  setDecisionForm({
                    ...decisionForm,
                    quantityAffected: e.target.value,
                  })
                }
                inputProps={{ min: 1, max: decisionDialog.quantityMax }}
                helperText={`Production order quantity: ${decisionDialog.quantityMax}`}
                fullWidth
              />

              {(decisionForm.outcome === "FAIL" ||
                decisionForm.outcome === "REWORK") && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Failure Category</InputLabel>
                    <Select
                      value={decisionForm.rejectionCategory}
                      label="Failure Category"
                      onChange={(e) =>
                        setDecisionForm({
                          ...decisionForm,
                          rejectionCategory: e.target.value,
                        })
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
                    label="Reason / Root Cause"
                    multiline
                    rows={3}
                    value={decisionForm.rejectionReason}
                    onChange={(e) =>
                      setDecisionForm({
                        ...decisionForm,
                        rejectionReason: e.target.value,
                      })
                    }
                    fullWidth
                    placeholder="Describe what failed and why…"
                  />
                </>
              )}

              <TextField
                label="Additional Notes (optional)"
                multiline
                rows={2}
                value={decisionForm.notes}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, notes: e.target.value })
                }
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDecisionDialog(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDecisionSubmit}
            disabled={!!updating}
            startIcon={
              updating ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <GavelIcon />
              )
            }
            sx={{
              bgcolor: "#F59E0B",
              "&:hover": { bgcolor: "#D97706" },
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {updating ? "Saving…" : "Record Decision"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── A-3 Checksheet Dialog ─── */}
      <Dialog
        open={!!a3Dialog}
        onClose={() => setA3Dialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <TaskAltIcon
            sx={{ verticalAlign: "text-bottom", mr: 1, color: "#6366F1" }}
          />
          A-3 Digital Checksheet — Chassis Wiring & Mounting
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            All checklist items must be verified before this step can be
            completed.
          </Alert>
          {A3_CHECKS.map((check) => (
            <Box
              key={check.key}
              onClick={() =>
                setA3Checks((prev) => ({
                  ...prev,
                  [check.key]: !prev[check.key],
                }))
              }
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: a3Checks[check.key] ? "#BBF7D0" : "#E5E7EB",
                bgcolor: a3Checks[check.key] ? "#F0FDF4" : "background.paper",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {a3Checks[check.key] ? (
                <CheckCircleIcon sx={{ color: "#16A34A" }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ color: "#9CA3AF" }} />
              )}
              <Typography
                variant="body2"
                fontWeight={a3Checks[check.key] ? 600 : 400}
              >
                {check.label}
              </Typography>
            </Box>
          ))}
          <TextField
            label="Additional Notes (optional)"
            multiline
            rows={2}
            value={a3Notes}
            onChange={(e) => setA3Notes(e.target.value)}
            fullWidth
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setA3Dialog(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitA3}
            disabled={!allA3Checked || !!updating}
            startIcon={
              updating ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              bgcolor: "#6366F1",
              "&:hover": { bgcolor: "#4F46E5" },
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {!allA3Checked
              ? `${Object.values(a3Checks).filter(Boolean).length}/4 Checked`
              : "Complete Step"}
          </Button>
        </DialogActions>
      </Dialog>



      {/* ─── Generic Confirm Dialog (Start / Mark Complete) ─── */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberIcon sx={{ color: "#F59E0B", fontSize: 22 }} />
          {confirmDialog?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ pt: 0.5, color: "text.secondary" }}>
            {confirmDialog?.body}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              confirmDialog?.onConfirm();
              setConfirmDialog(null);
            }}
            disabled={!!updating}
            sx={{
              bgcolor: confirmDialog?.confirmColor ?? "#16A34A",
              "&:hover": { filter: "brightness(0.88)" },
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {confirmDialog?.confirmLabel ?? "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProductionTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order, loading, refresh } = useOrderContext();
  const [updating, setUpdating] = useState<string | null>(null);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) return null;

  return (
    <Box>
      {order.status === "DRAFT" && (
        <Alert
          severity="info"
          sx={{ mb: 2.5, borderRadius: 2, fontWeight: 500 }}
        >
          This order is in <strong>DRAFT</strong> status. Click{" "}
          <strong>&ldquo;Start Production&rdquo;</strong> in the header to begin
          tracking steps.
        </Alert>
      )}

      {order.stages.map((stage: any) => (
        <StageLane
          key={stage.id}
          stage={stage}
          orderId={orderId}
          order={order}
          updating={updating}
          setUpdating={setUpdating}
          refresh={refresh}
        />
      ))}
    </Box>
  );
}
