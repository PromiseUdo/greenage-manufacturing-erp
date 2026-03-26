'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderContext } from '../layout';
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
  Alert,
  CircularProgress,
  LinearProgress,
  Collapse,
  Tooltip,
  Drawer,
  Grid,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import GavelIcon from '@mui/icons-material/Gavel';
import InventoryIcon from '@mui/icons-material/Inventory';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ActivitiesPanel from './activities-panel';
import DecisionPointDialog, {
  type DecisionSubmitData,
} from './DecisionPointDialog';
import { DECISION_POINT_CONFIGS } from './decision-point-configs';
import { REWORK_GATES } from '@/lib/production-rules';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChecksheetDialog {
  trackingId: string;
}

interface AttachmentFile {
  name: string;
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

interface PhotoDialog {
  trackingId: string;
  stepId: string;
  actionName: string;
}

// ─── A-3 Checksheet items ────────────────────────────────────────────────────
const A3_CHECKS = [
  { key: 'circuit_breakers', label: 'Circuit Breakers mounted and secured' },
  { key: 'lcd_connected', label: 'LCD panel connected and operational' },
  {
    key: 'internal_wiring',
    label: 'All internal wires connected per wiring diagram',
  },
  {
    key: 'dwi_referenced',
    label: 'DWI (Detailed Work Instruction) referenced and followed',
  },
];

// ─── Status config ───────────────────────────────────────────────────────────
const stepStatusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  PENDING: {
    icon: <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />,
    color: '#9CA3AF',
    label: 'Pending',
  },
  IN_PROGRESS: {
    icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} />,
    color: '#2563EB',
    label: 'In Progress',
  },
  COMPLETED: {
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
    color: '#16A34A',
    label: 'Completed',
  },
  SKIPPED: {
    icon: <SkipNextIcon sx={{ fontSize: 18 }} />,
    color: '#7C3AED',
    label: 'Skipped',
  },
  FAILED: {
    icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
    color: '#DC2626',
    label: 'Failed',
  },
};

const stageStatusBg: Record<string, string> = {
  NOT_STARTED: '#F9FAFB',
  IN_PROGRESS: '#EFF6FF',
  COMPLETED: '#F0FDF4',
};

const stepSectionBorder: Record<string, string> = {
  PENDING: '#E5E7EB',
  IN_PROGRESS: '#BFDBFE',
  COMPLETED: '#BBF7D0',
  SKIPPED: '#DDD6FE',
  FAILED: '#FECACA',
};

const formatDateTime = (d: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Step Card ───────────────────────────────────────────────────────────────
interface StepCardProps {
  action: any;
  stage: any;
  orderId: string;
  order: any;
  updating: string | null;
  onComplete: () => void;
  onSkip: () => void;
  onMaterialRequest: () => void;
  onActivityAdded: () => void;
  unit: any;
  reworkBlocked?: boolean;
}

function StepCard({
  action,
  stage,
  orderId,
  order,
  updating,
  onComplete,
  onSkip,
  onMaterialRequest,
  onActivityAdded,
  unit,
  reworkBlocked = false,
}: StepCardProps) {
  const [showActivity, setShowActivity] = useState(false);
  const status = action.status as string;
  const statusCfg = stepStatusConfig[status] ?? stepStatusConfig.PENDING;
  const isDecision =
    !!action.isDecisionPoint || action.stepId in DECISION_POINT_CONFIGS;
  const isA3 = action.stepId === 'A-3';
  const isP1 = action.stepId === 'P-1';
  const isP4 = action.stepId === 'P-4';
  const isDone = status === 'COMPLETED' || status === 'SKIPPED';

  // P-1: derive MRQ state to gate "Mark Complete"
  const p1MrqStatus = (() => {
    if (!isP1) return 'n/a';
    const mrqs: any[] =
      order?.materialRequisitions?.filter(
        (r: any) => !r.productionUnitId || r.productionUnitId === unit.id,
      ) ?? [];
    if (mrqs.some((r) => r.status === 'FULFILLED')) return 'fulfilled';
    if (mrqs.some((r) => r.status !== 'CANCELLED')) return 'pending';
    return 'none';
  })();
  const p1CanComplete = !isP1 || p1MrqStatus === 'fulfilled';
  const isActive = order?.status !== 'DRAFT' || true;
  const isUpdating = updating === action.trackingId;

  const borderColor = stepSectionBorder[status] ?? '#E5E7EB';

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: borderColor,
        borderLeft: `4px solid ${isDecision ? '#F59E0B' : statusCfg.color}`,
        borderRadius: 2,
        mb: 1.5,
        overflow: 'hidden',
        bgcolor:
          isDecision && !isDone
            ? '#FFFBEB'
            : status === 'COMPLETED'
              ? '#F0FDF4'
              : 'background.paper',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
      }}
    >
      {/* Step Header */}
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          {/* Step ID badge */}
          <Box
            sx={{
              minWidth: 48,
              height: 32,
              borderRadius: 1.5,
              bgcolor: isDecision ? '#FEF3C7' : '#F3F4F6',
              border: `1px solid ${isDecision ? '#FCD34D' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: isDecision ? '#92400E' : '#374151',
                fontSize: '0.72rem',
              }}
            >
              {action.stepId}
            </Typography>
          </Box>

          {/* Title + goal */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 0.3,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{
                  color: isDone ? '#6B7280' : '#111827',
                  textDecoration: isDone ? 'line-through' : 'none',
                  lineHeight: 1.3,
                }}
              >
                {action.actionName}
                {isDecision && (
                  <GavelIcon
                    sx={{
                      fontSize: 14,
                      color: '#F59E0B',
                      ml: 0.5,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </Typography>
            </Box>

            {action.focusGoal && !action.isDecisionPoint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1.4, mb: 0.5 }}
              >
                {action.focusGoal}
              </Typography>
            )}

            {/* Meta row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
              }}
            >
              {/* Responsible */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#E0E7FF',
                    color: '#4338CA',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(action.responsible?.name ?? action.defaultResponsibility)
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
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
                  display: 'flex',
                  alignItems: 'center',
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
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor:
                      action.decisionOutcome === 'PASS'
                        ? '#DCFCE7'
                        : action.decisionOutcome === 'REWORK'
                          ? '#FEF3C7'
                          : '#FEE2E2',
                    color:
                      action.decisionOutcome === 'PASS'
                        ? '#166534'
                        : action.decisionOutcome === 'REWORK'
                          ? '#92400E'
                          : '#991B1B',
                  }}
                />
              )}
            </Box>

            {/* Rejection reason */}
            {action.rejectionReason && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
              >
                ⚠ {action.rejectionReason}
              </Typography>
            )}

            {/* Timestamps */}
            {action.startedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
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
              {status === 'COMPLETED' ? (
                <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
              ) : (
                <SkipNextIcon sx={{ color: '#7C3AED', fontSize: 22 }} />
              )}
            </Box>
          )}
        </Box>

        {/* Rework blocked banner */}
        {reworkBlocked && !isDone && (
          <Alert
            severity="warning"
            icon={<BuildCircleIcon fontSize="small" />}
            sx={{ mt: 1.5, borderRadius: 2, py: 0.5, fontSize: '0.78rem' }}
          >
            <strong>Rework in progress.</strong> This step is locked until the
            active rework is completed.
          </Alert>
        )}

        {/* Action Buttons */}
        {!isDone && isActive && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <>
              <Tooltip
                title={
                  reworkBlocked
                    ? 'Complete the active rework process first'
                    : isP1 && !p1CanComplete
                      ? p1MrqStatus === 'pending'
                        ? 'Waiting for the store to fulfill the Material Requisition'
                        : 'Raise a Material Request (BOM) first before completing this step'
                      : ''
                }
              >
                <span>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={onComplete}
                    disabled={!!updating || !p1CanComplete || reworkBlocked}
                    sx={{
                      bgcolor: isA3 ? '#6366F1' : '#16A34A',
                      '&:hover': {
                        bgcolor: isA3 ? '#4F46E5' : '#15803D',
                      },
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2,
                      py: 0.7,
                      fontSize: '0.8rem',
                    }}
                  >
                    {isA3 ? 'Complete with Checksheet' : 'Mark Complete'}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  reworkBlocked
                    ? 'Complete the active rework first'
                    : 'Skip this step'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={onSkip}
                    disabled={!!updating || reworkBlocked}
                    sx={{
                      color: '#7C3AED',
                      border: '1px solid #DDD6FE',
                      borderRadius: 2,
                    }}
                  >
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>

            {/* P-1: warning when MRQ not yet fulfilled */}
            {isP1 && !p1CanComplete && (
              <Alert
                severity={p1MrqStatus === 'pending' ? 'info' : 'warning'}
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  py: 0.5,
                  fontSize: '0.78rem',
                  width: '100%',
                }}
              >
                {p1MrqStatus === 'pending'
                  ? 'Material Requisition raised — waiting for the store to fulfill it before this step can be completed.'
                  : 'You must raise a Material Request (BOM) using the button below before this step can be completed.'}
              </Alert>
            )}

            {/* P-1: Initial BOM Material Request button */}
            {isP1 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={onMaterialRequest}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.7,
                  borderColor: '#16A34A',
                  color: '#16A34A',
                  bgcolor: '#F0FDF4',
                  '&:hover': { bgcolor: '#DCFCE7' },
                  fontSize: '0.78rem',
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
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.7,
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  bgcolor: '#FFF5F5',
                  '&:hover': { bgcolor: '#FEE2E2' },
                  fontSize: '0.78rem',
                }}
              >
                Initiate Replacement Request
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Activity Toggle */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: { xs: 1.5, sm: 2 },
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: showActivity ? '#F3F4F6' : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: '#F3F4F6' },
        }}
        onClick={() => setShowActivity((prev) => !prev)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 15, color: '#6B7280' }} />
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
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: action._count?.activities > 0 ? '#E0E7FF' : '#F3F4F6',
                color: action._count?.activities > 0 ? '#4338CA' : '#9CA3AF',
                ml: 0.5,
              }}
            />
          )}
        </Box>
        {showActivity ? (
          <KeyboardArrowUpIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
        ) : (
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
        )}
      </Box>

      {/* Activity Panel */}
      <Collapse in={showActivity}>
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 0.5, pb: 2 }}>
          <ActivitiesPanel
            orderId={orderId}
            unitId={unit.id}
            trackingId={action.trackingId}
            stepId={action.stepId}
            onActivityAdded={onActivityAdded}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

function StageLane({
  stage,
  orderId,
  order,
  unit,
  updating,
  setUpdating,
  refresh,
  mergeTrackingUpdate,
}: {
  stage: any;
  orderId: string;
  order: any;
  unit: any;
  updating: string | null;
  setUpdating: (v: string | null) => void;
  refresh: () => void;
  mergeTrackingUpdate: (unitId: string, trackingId: string, tracking: any, unitStatus: string, orderPatch: any) => void;
}) {
  const [open, setOpen] = useState(true);

  // Enriched actions based on unit tracking
  const activeRework =
    unit.reworks?.some((r: any) => r.status === 'IN_PROGRESS') ?? false; // boolean for guards below

  const enrichedActions =
    stage.actionItems?.map((action: any) => {
      const tracking = unit.stepTrackings?.find(
        (t: any) => t.actionItemId === action.id,
      );
      return {
        ...action,
        trackingId: tracking?.id,
        status: tracking?.status || 'PENDING',
        startedAt: tracking?.startedAt,
        completedAt: tracking?.completedAt,
        decisionOutcome: tracking?.decisionOutcome,
        rejectionReason: tracking?.rejectionReason,
        _count: tracking?._count,
      };
    }) || [];

  // Steps that are blocked while a rework is active — depends on what triggered it
  const activeReworkRecord =
    unit.reworks?.find((r: any) => r.status === 'IN_PROGRESS') ?? null;
  const activeReworkTrigger = activeReworkRecord?.triggeredByStepId ?? 'QC-1';
  const REWORK_GATED_STEPS = activeReworkRecord
    ? (REWORK_GATES[activeReworkTrigger] ?? ['QC-2', 'QC-3', 'QC-4'])
    : [];

  const totalSteps = enrichedActions.length;
  const doneSteps = enrichedActions.filter(
    (a: any) => a.status === 'COMPLETED' || a.status === 'SKIPPED',
  ).length;
  const progress =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const isStageCompleted = totalSteps > 0 && doneSteps === totalSteps;

  const stageBorderColor = isStageCompleted
    ? '#16A34A'
    : progress > 0
      ? '#2563EB'
      : '#D1D5DB';

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

  const [trackingError, setTrackingError] = useState<string | null>(null);

  const updateTracking = useCallback(
    async (trackingId: string, body: any) => {
      setUpdating(trackingId);
      setTrackingError(null);
      try {
        const res = await fetch(
          `/api/production/orders/${orderId}/units/${unit.id}/tracking/${trackingId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) {
          const data = await res.json();
          setTrackingError(data.error || 'Failed to update step');
          return false;
        }
        const { tracking, unitStatus, orderPatch } = await res.json();
        mergeTrackingUpdate(unit.id, trackingId, tracking, unitStatus, orderPatch);
        return true;
      } finally {
        setUpdating(null);
      }
    },
    [orderId, unit.id, mergeTrackingUpdate, setUpdating],
  );

  const updateStage = useCallback(
    async (stageId: string, body: any) => {
      setUpdating(stageId);
      try {
        await fetch(`/api/production/orders/${orderId}/stages/${stageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        await refresh();
      } finally {
        setUpdating(null);
      }
    },
    [orderId, refresh, setUpdating],
  );

  const [a3Dialog, setA3Dialog] = useState<ChecksheetDialog | null>(null);
  const [a3Checks, setA3Checks] = useState<Record<string, boolean>>({
    circuit_breakers: false,
    lcd_connected: false,
    internal_wiring: false,
    dwi_referenced: false,
  });
  const [a3Notes, setA3Notes] = useState('');
  const [a3Photos, setA3Photos] = useState<AttachmentFile[]>([]);
  const allA3Checked = Object.values(a3Checks).every(Boolean);

  const [photoDialog, setPhotoDialog] = useState<PhotoDialog | null>(null);
  const [photoDialogFiles, setPhotoDialogFiles] = useState<AttachmentFile[]>(
    [],
  );
  const [photoDialogComment, setPhotoDialogComment] = useState('');
  const [photoDialogSubmitting, setPhotoDialogSubmitting] = useState(false);

  // ── Generic decision-point dialog (P-3, A-2.6, QC-1, QC-3) ─────────────
  const [decisionDialog, setDecisionDialog] = useState<{
    trackingId: string;
    stepId: string;
    /** Tracking ID of the sibling step to auto-skip on certain outcomes (e.g. P-4, QC-4) */
    nextStepTrackingId: string | null;
  } | null>(null);

  // ── Rework creation dialog ────────────────────────────────────────────────
  const [reworkDialog, setReworkDialog] = useState(false);
  const [reworkTriggerStep, setReworkTriggerStep] = useState<string>('QC-1');
  const [reworkFault, setReworkFault] = useState('');
  const [reworkTasks, setReworkTasks] = useState<string[]>(['']);
  const [reworkSubmitting, setReworkSubmitting] = useState(false);

  const router = useRouter();

  // ── File → base64 helper ──────────────────────────────────────────────────
  const readFilesAsBase64 = async (
    files: File[],
  ): Promise<AttachmentFile[]> => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<AttachmentFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                mimeType: file.type || 'image/jpeg',
                base64: (reader.result as string).split(',')[1],
                sizeBytes: file.size,
              });
            reader.readAsDataURL(file);
          }),
      ),
    );
  };

  const handlePhotoDialogCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const converted = await readFilesAsBase64(files);
    setPhotoDialogFiles((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  const handleA3PhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const converted = await readFilesAsBase64(files);
    setA3Photos((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  // ── Submit: unified decision-point handler (P-3, A-2.6, QC-1, QC-3) ─────
  const onDecisionSubmit = async (data: DecisionSubmitData) => {
    if (!decisionDialog) return;
    const { trackingId, stepId, nextStepTrackingId } = decisionDialog;
    const cfg = DECISION_POINT_CONFIGS[stepId];

    // 1. Post evidence as an activity log entry
    await fetch(
      `/api/production/orders/${orderId}/units/${unit.id}/tracking/${trackingId}/activities`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment:
            data.notes.trim() || `${stepId} Assessment: ${data.decision}`,
          attachments: data.photos,
          type: 'COMMENT',
        }),
      },
    );

    // 2. Mark the step complete with outcome (uses updateTracking for error state)
    await updateTracking(trackingId, {
      status: 'COMPLETED',
      decisionOutcome: data.decision,
      notes: data.notes.trim() || null,
      ...(data.failureType && { rejectionCategory: data.failureType }),
    });

    // 3. Auto-skip a sibling step when the config demands it
    const shouldSkipOnPass =
      cfg?.nextStepToSkipOnPass && data.decision === 'PASS';
    const shouldSkipOnScrap =
      cfg?.nextStepToSkipOnScrap &&
      data.decision === 'FAIL' &&
      data.failureType === 'SCRAPPED';

    if ((shouldSkipOnPass || shouldSkipOnScrap) && nextStepTrackingId) {
      await updateTracking(nextStepTrackingId, { status: 'SKIPPED' });
    }

    setDecisionDialog(null);

    // 4. Open rework creation dialog when the outcome requires it
    const triggersRework =
      (cfg?.triggersRework && data.decision === 'FAIL') ||
      (cfg?.hasFailureType &&
        data.decision === 'FAIL' &&
        data.failureType === 'REPAIRABLE');

    if (triggersRework) {
      setReworkTriggerStep(stepId);
      setReworkFault('');
      setReworkTasks(['']);
      setReworkDialog(true);
    }
  };

  // ── Submit: create rework after QC-1 or QC-3 repairable FAIL ─────────────
  const submitReworkCreation = async () => {
    setReworkSubmitting(true);
    try {
      const validTasks = reworkTasks.map((t) => t.trim()).filter(Boolean);
      await fetch(`/api/production/orders/${orderId}/units/${unit.id}/rework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultDescription: reworkFault.trim() || null,
          tasks: validTasks.map((name) => ({ name })),
          triggeredByStepId: reworkTriggerStep,
        }),
      });
      setReworkDialog(false);
      setReworkFault('');
      setReworkTasks(['']);
      refresh();
    } finally {
      setReworkSubmitting(false);
    }
  };

  // ── Submit: photo-required completion (all non-A3 steps) ─────────────────
  const submitPhotoComplete = async () => {
    if (!photoDialog || photoDialogFiles.length === 0) return;
    setPhotoDialogSubmitting(true);
    try {
      await fetch(
        `/api/production/orders/${orderId}/units/${unit.id}/tracking/${photoDialog.trackingId}/activities`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: photoDialogComment.trim() || null,
            attachments: photoDialogFiles,
            type: photoDialogComment.trim() ? 'COMMENT' : 'ATTACHMENT',
          }),
        },
      );
      await updateTracking(photoDialog.trackingId, { status: 'COMPLETED' });
      setPhotoDialog(null);
      setPhotoDialogFiles([]);
      setPhotoDialogComment('');
    } finally {
      setPhotoDialogSubmitting(false);
    }
  };

  const submitA3 = async () => {
    if (!a3Dialog || a3Photos.length === 0 || !allA3Checked) return;
    const checkResults = A3_CHECKS.map((c) => ({
      label: c.label,
      checked: a3Checks[c.key],
    }));
    // Post completion photo as an activity first
    await fetch(
      `/api/production/orders/${orderId}/units/${unit.id}/tracking/${a3Dialog.trackingId}/activities`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: a3Notes.trim() || null,
          attachments: a3Photos,
          type: a3Notes.trim() ? 'COMMENT' : 'ATTACHMENT',
        }),
      },
    );
    await updateTracking(a3Dialog.trackingId, {
      status: 'COMPLETED',
      notes: JSON.stringify({
        type: 'A3_CHECKSHEET',
        checks: checkResults,
        additionalNotes: a3Notes,
      }),
    });
    setA3Dialog(null);
    setA3Photos([]);
    setA3Notes('');
  };

  return (
    <Box
      sx={{
        mb: 2.5,
        border: '1px solid',
        borderColor: stageBorderColor,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Stage Header */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          p: { xs: 1.5, sm: 2 },
          bgcolor: stageStatusBg[stage.status] ?? '#F9FAFB',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          '&:hover': { opacity: 0.92 },
        }}
      >
        {/* Stage status icon */}
        <Box sx={{ flexShrink: 0, color: stageBorderColor }}>
          {stage.status === 'COMPLETED' ? (
            <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 24 }} />
          ) : stage.status === 'IN_PROGRESS' ? (
            <HourglassEmptyIcon sx={{ color: '#2563EB', fontSize: 24 }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: '#9CA3AF', fontSize: 24 }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              fontWeight={800}
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Stage {stage.sortOrder}: {stage.stageLabel}
            </Typography>
            <Chip
              label={stage.status.replace(/_/g, ' ')}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                bgcolor:
                  stage.status === 'COMPLETED'
                    ? '#DCFCE7'
                    : stage.status === 'IN_PROGRESS'
                      ? '#DBEAFE'
                      : '#F3F4F6',
                color:
                  stage.status === 'COMPLETED'
                    ? '#166534'
                    : stage.status === 'IN_PROGRESS'
                      ? '#1E40AF'
                      : '#6B7280',
              }}
            />
            <Chip
              label={`${doneSteps}/${totalSteps} steps`}
              size="small"
              sx={{ bgcolor: '#F3F4F6', color: '#374151', fontSize: '0.65rem' }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 0.8,
              height: 5,
              borderRadius: 3,
              bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: progress === 100 ? '#16A34A' : '#2563EB',
              },
            }}
          />
        </Box>

        <Box sx={{ flexShrink: 0, color: '#9CA3AF' }}>
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Box>
      </Box>

      {/* Stage Contents */}
      <Collapse in={open}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {trackingError && (
            <Alert
              severity="error"
              onClose={() => setTrackingError(null)}
              sx={{ mb: 1.5, borderRadius: 2 }}
            >
              {trackingError}
            </Alert>
          )}
          {enrichedActions.map((action: any) => (
            <StepCard
              key={action.id}
              action={action}
              stage={stage}
              orderId={orderId}
              order={order}
              unit={unit}
              updating={updating}
              reworkBlocked={
                activeRework && REWORK_GATED_STEPS.includes(action.stepId)
              }
              onActivityAdded={refresh}
              onComplete={() => {
                if (action.stepId === 'A-3') {
                  setA3Checks({
                    circuit_breakers: false,
                    lcd_connected: false,
                    internal_wiring: false,
                    dwi_referenced: false,
                  });
                  setA3Notes('');
                  setA3Photos([]);
                  setA3Dialog({ trackingId: action.trackingId });
                } else if (action.stepId in DECISION_POINT_CONFIGS) {
                  const cfg = DECISION_POINT_CONFIGS[action.stepId];
                  const skipStepId =
                    cfg.nextStepToSkipOnPass || cfg.nextStepToSkipOnScrap;
                  const nextStepTrackingId = skipStepId
                    ? (enrichedActions.find((a: any) => a.stepId === skipStepId)
                        ?.trackingId ?? null)
                    : null;
                  setDecisionDialog({
                    trackingId: action.trackingId,
                    stepId: action.stepId,
                    nextStepTrackingId,
                  });
                } else if ((action._count?.activities ?? 0) > 0) {
                  // Photos already uploaded — mark complete directly
                  updateTracking(action.trackingId, { status: 'COMPLETED' });
                } else {
                  setPhotoDialogFiles([]);
                  setPhotoDialogComment('');
                  setPhotoDialog({
                    trackingId: action.trackingId,
                    stepId: action.stepId,
                    actionName: action.actionName,
                  });
                }
              }}
              onSkip={() =>
                withConfirm(
                  'Skip This Step',
                  `Skip "${action.actionName}" (${action.stepId})? This cannot be undone.`,
                  'Skip Step',
                  '#7C3AED',
                  () =>
                    updateTracking(action.trackingId, { status: 'SKIPPED' }),
                )
              }
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

      {/* ─── A-3 Checksheet Dialog ─── */}
      <Dialog
        open={!!a3Dialog}
        onClose={() => setA3Dialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <TaskAltIcon
            sx={{ verticalAlign: 'text-bottom', mr: 1, color: '#6366F1' }}
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
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: a3Checks[check.key] ? '#BBF7D0' : '#E5E7EB',
                bgcolor: a3Checks[check.key] ? '#F0FDF4' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {a3Checks[check.key] ? (
                <CheckCircleIcon sx={{ color: '#16A34A' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ color: '#9CA3AF' }} />
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

          {/* Completion photo — required */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            Completion Photo{' '}
            <Typography
              component="span"
              sx={{ color: '#DC2626', fontWeight: 700 }}
            >
              *
            </Typography>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1.5 }}
          >
            Take or upload at least one photo to confirm completion.
          </Typography>
          {a3Photos.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {a3Photos.map((f, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={`data:${f.mimeType};base64,${f.base64}`}
                    sx={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 2,
                      display: 'block',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setA3Photos((prev) => prev.filter((_, j) => j !== i))
                    }
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'white',
                      boxShadow: 1,
                      p: 0.3,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="label"
              variant={a3Photos.length === 0 ? 'contained' : 'outlined'}
              size="small"
              startIcon={<PhotoCameraIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleA3PhotoCapture}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AttachFileIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleA3PhotoCapture}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setA3Dialog(null)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitA3}
            disabled={!allA3Checked || a3Photos.length === 0 || !!updating}
            startIcon={
              updating ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              bgcolor: '#6366F1',
              '&:hover': { bgcolor: '#4F46E5' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            {!allA3Checked
              ? `${Object.values(a3Checks).filter(Boolean).length}/4 Checked`
              : a3Photos.length === 0
                ? 'Add a photo to complete'
                : 'Complete Step'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Photo Completion Dialog (all non-A3 steps) ─── */}
      <Dialog
        open={!!photoDialog}
        onClose={() => !photoDialogSubmitting && setPhotoDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PhotoCameraIcon sx={{ color: '#16A34A', fontSize: 22 }} />
          Complete Step: {photoDialog?.stepId}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{photoDialog?.actionName}</strong>
          </Typography>

          <Alert
            severity="info"
            sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}
          >
            At least one photo is required to confirm completion.
          </Alert>

          {/* Photo previews */}
          {photoDialogFiles.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {photoDialogFiles.map((f, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={`data:${f.mimeType};base64,${f.base64}`}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 2,
                      display: 'block',
                      border: '1px solid #E5E7EB',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setPhotoDialogFiles((prev) =>
                        prev.filter((_, j) => j !== i),
                      )
                    }
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'white',
                      boxShadow: 1,
                      p: 0.3,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Photo capture / upload buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              component="label"
              variant={photoDialogFiles.length === 0 ? 'contained' : 'outlined'}
              size="small"
              startIcon={<PhotoCameraIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoDialogCapture}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AttachFileIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoDialogCapture}
              />
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Optional comment */}
          <TextField
            label="Comment (optional)"
            multiline
            rows={2}
            value={photoDialogComment}
            onChange={(e) => setPhotoDialogComment(e.target.value)}
            fullWidth
            placeholder="Add any notes about this step completion…"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setPhotoDialog(null)}
            disabled={photoDialogSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitPhotoComplete}
            disabled={photoDialogFiles.length === 0 || photoDialogSubmitting}
            startIcon={
              photoDialogSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            {photoDialogFiles.length === 0
              ? 'Add a photo to complete'
              : 'Complete Step'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Generic Decision-Point Dialog (P-3, A-2.6, QC-1, QC-3) ─── */}
      <DecisionPointDialog
        open={!!decisionDialog}
        config={
          decisionDialog
            ? (DECISION_POINT_CONFIGS[decisionDialog.stepId] ?? null)
            : null
        }
        onClose={() => setDecisionDialog(null)}
        onSubmit={onDecisionSubmit}
      />

      {/* ─── Rework Creation Dialog (after QC-1 or QC-3 repairable FAIL) ─── */}
      <Dialog
        open={reworkDialog}
        onClose={() => !reworkSubmitting && setReworkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <BuildCircleIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
          Set Up Rework Process
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Describe the fault and add the repair tasks that need to be
            completed before re-assessment.
          </Alert>

          <TextField
            label="Fault Description"
            fullWidth
            multiline
            rows={2}
            value={reworkFault}
            onChange={(e) => setReworkFault(e.target.value)}
            placeholder="e.g. Output voltage out of tolerance, loose connector on PCB…"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Repair Tasks
          </Typography>
          {reworkTasks.map((task, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder={`Task ${i + 1}…`}
                value={task}
                onChange={(e) =>
                  setReworkTasks((p) =>
                    p.map((t, j) => (j === i ? e.target.value : t)),
                  )
                }
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {reworkTasks.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() =>
                    setReworkTasks((p) => p.filter((_, j) => j !== i))
                  }
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setReworkTasks((p) => [...p, ''])}
            sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}
          >
            Add Task
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setReworkDialog(false)}
            disabled={reworkSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Skip (Create rework later)
          </Button>
          <Button
            variant="contained"
            onClick={submitReworkCreation}
            disabled={reworkSubmitting}
            startIcon={
              reworkSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <BuildCircleIcon />
              )
            }
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              borderRadius: 2,
            }}
          >
            {reworkSubmitting ? 'Creating…' : 'Create Rework'}
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
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
          {confirmDialog?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ pt: 0.5, color: 'text.secondary' }}>
            {confirmDialog?.body}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            sx={{ textTransform: 'none' }}
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
              bgcolor: confirmDialog?.confirmColor ?? '#16A34A',
              '&:hover': { filter: 'brightness(0.88)' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            {confirmDialog?.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProductionUnitsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order, loading, refresh: refreshOrder, patchOrder } = useOrderContext();

  // Full unit data (tracking + reworks) — fetched independently of the layout context
  // so the layout only carries the lightweight summary shape.
  const [fullUnits, setFullUnits] = useState<any[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    if (!orderId) return;
    setUnitsLoading(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}?view=units`);
      if (!res.ok) return;
      const data = await res.json();
      setFullUnits(data.units ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setUnitsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Full refetch — used only for rework operations that change the reworks array
  const refresh = useCallback(async () => {
    await Promise.all([fetchUnits(), refreshOrder()]);
  }, [fetchUnits, refreshOrder]);

  // Targeted merge — used after tracking PATCH to avoid a full refetch
  const mergeTrackingUpdate = useCallback(
    (unitId: string, trackingId: string, updatedTracking: any, unitStatus: string, orderPatch: any) => {
      setFullUnits((prev) =>
        prev.map((u) => {
          if (u.id !== unitId) return u;
          return {
            ...u,
            status: unitStatus,
            stepTrackings: u.stepTrackings.map((t: any) =>
              t.id === trackingId ? { ...t, ...updatedTracking } : t,
            ),
          };
        }),
      );
      patchOrder(orderPatch);
    },
    [patchOrder],
  );
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [reworkTaskInput, setReworkTaskInput] = useState<
    Record<string, string>
  >({});
  const [reworkActionLoading, setReworkActionLoading] = useState<string | null>(
    null,
  );
  const [reworkTaskCompletionDialog, setReworkTaskCompletionDialog] = useState<{
    reworkId: string;
    taskId: string;
    taskName: string;
    unitId: string;
  } | null>(null);
  const [reworkPreviewImg, setReworkPreviewImg] = useState<string | null>(null);
  const [reworkTaskPhotos, setReworkTaskPhotos] = useState<
    { name: string; mimeType: string; base64: string; sizeBytes: number }[]
  >([]);
  const [reworkTaskComment, setReworkTaskComment] = useState('');
  const [reworkTaskDialogSubmitting, setReworkTaskDialogSubmitting] =
    useState(false);

  const readReworkTaskFiles = (files: File[]) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise<{
            name: string;
            mimeType: string;
            base64: string;
            sizeBytes: number;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                mimeType: file.type || 'image/jpeg',
                base64: (reader.result as string).split(',')[1],
                sizeBytes: file.size,
              });
            reader.readAsDataURL(file);
          }),
      ),
    );

  const handleReworkTaskPhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const converted = await readReworkTaskFiles(files);
    setReworkTaskPhotos((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  const submitReworkTaskCompletion = async () => {
    if (!reworkTaskCompletionDialog || reworkTaskPhotos.length === 0) return;
    setReworkTaskDialogSubmitting(true);
    try {
      const { unitId, reworkId, taskId } = reworkTaskCompletionDialog;
      const res = await fetch(
        `/api/production/orders/${orderId}/units/${unitId}/rework/${reworkId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            notes: reworkTaskComment.trim() || null,
            attachments: reworkTaskPhotos,
          }),
        },
      );
      if (!res.ok) return;
      setReworkTaskCompletionDialog(null);
      setReworkTaskPhotos([]);
      setReworkTaskComment('');
      refresh();
    } finally {
      setReworkTaskDialogSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) return null;

  return (
    <Box>
      {order.status === 'DRAFT' && (
        <Alert
          severity="info"
          sx={{ mb: 2.5, borderRadius: 2, fontWeight: 500 }}
        >
          This order is in <strong>DRAFT</strong> status. Click{' '}
          <strong>&ldquo;Start Production&rdquo;</strong> in the header to begin
          tracking steps.
        </Alert>
      )}

      {unitsLoading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : fullUnits.length > 0 ? (
        <Grid container spacing={2}>
          {fullUnits.map((unit: any) => {
            const totalTrackings = unit.stepTrackings?.length || 0;
            const completedTrackings =
              unit.stepTrackings?.filter(
                (t: any) => t.status === 'COMPLETED' || t.status === 'SKIPPED',
              ).length || 0;
            const progress =
              totalTrackings > 0
                ? Math.round((completedTrackings / totalTrackings) * 100)
                : 0;

            const unitStatusColor =
              unit.status === 'COMPLETED'
                ? '#16A34A'
                : unit.status === 'IN_PROGRESS'
                  ? '#2563EB'
                  : '#6B7280';

            const activeRework = unit.reworks?.find(
              (r: any) => r.status === 'IN_PROGRESS',
            );

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={unit.id}>
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: activeRework ? '#F59E0B' : 'divider',
                    borderRadius: 2,
                    bgcolor: activeRework ? '#FFFBEB' : 'background.paper',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {unit.unitId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Unit #{unit.unitNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={unit.status.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        bgcolor:
                          unit.status === 'COMPLETED'
                            ? '#DCFCE7'
                            : unit.status === 'IN_PROGRESS'
                              ? '#DBEAFE'
                              : '#F3F4F6',
                        color: unitStatusColor,
                      }}
                    />
                  </Box>

                  {/* Rework in-progress banner */}
                  {activeRework && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.8,
                        mb: 1.5,
                      }}
                    >
                      <BuildCircleIcon
                        sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            color: '#92400E',
                            display: 'block',
                            lineHeight: 1.2,
                          }}
                        >
                          Rework In Progress — Round {activeRework.round}
                        </Typography>
                        {activeRework.faultDescription && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#B45309', fontSize: '0.68rem' }}
                          >
                            {activeRework.faultDescription}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: unitStatusColor,
                        },
                      }}
                    />
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setSelectedUnit(unit)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Open Tracker
                  </Button>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography color="text.secondary">
          No units generated for this order.
        </Typography>
      )}

      {/* Slide-out Drawer for Unit Tracking */}
      <Drawer
        anchor="right"
        open={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600 },
            bgcolor: '#F9FAFB',
          },
        }}
      >
        {selectedUnit && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Tracker: {selectedUnit.unitId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage steps specifically for this unit
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setSelectedUnit(null)}
                sx={{
                  color: '#6B7280',
                  '&:hover': { bgcolor: '#E5E7EB' },
                  minWidth: 0,
                  px: 1,
                  borderRadius: 2,
                }}
              >
                Close
              </Button>
            </Box>

            <Box sx={{ pb: 6 }}>
              {order.stages.map((stage: any) => (
                <StageLane
                  key={stage.id}
                  stage={stage}
                  orderId={orderId}
                  order={order}
                  unit={
                    fullUnits.find((u: any) => u.id === selectedUnit.id) ??
                    selectedUnit
                  }
                  updating={updating}
                  setUpdating={setUpdating}
                  refresh={refresh}
                  mergeTrackingUpdate={mergeTrackingUpdate}
                />
              ))}

              {/* ── Rework Processes Panel ── */}
              {(() => {
                const liveUnit =
                  fullUnits.find((u: any) => u.id === selectedUnit.id) ??
                  selectedUnit;
                const reworks: any[] = liveUnit.reworks ?? [];
                if (reworks.length === 0) return null;

                const callRework = async (
                  path: string,
                  body: any,
                  key: string,
                ) => {
                  setReworkActionLoading(key);
                  try {
                    await fetch(
                      `/api/production/orders/${orderId}/units/${liveUnit.id}${path}`,
                      {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                      },
                    );
                    refresh();
                  } finally {
                    setReworkActionLoading(null);
                  }
                };

                const addTask = async (reworkId: string) => {
                  const name = (reworkTaskInput[reworkId] ?? '').trim();
                  if (!name) return;
                  setReworkActionLoading(`addTask-${reworkId}`);
                  try {
                    await fetch(
                      `/api/production/orders/${orderId}/units/${liveUnit.id}/rework/${reworkId}/tasks`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name }),
                      },
                    );
                    setReworkTaskInput((p) => ({ ...p, [reworkId]: '' }));
                    refresh();
                  } finally {
                    setReworkActionLoading(null);
                  }
                };

                return (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <BuildCircleIcon
                        sx={{ color: '#F59E0B', fontSize: 22 }}
                      />
                      <Typography fontWeight={800} fontSize="1rem">
                        Rework Processes
                      </Typography>
                    </Box>

                    {reworks.map((rework: any) => {
                      const isActive = rework.status === 'IN_PROGRESS';
                      const allTasksDone =
                        rework.tasks.length > 0 &&
                        rework.tasks.every(
                          (t: any) =>
                            t.status === 'COMPLETED' || t.status === 'SKIPPED',
                        );
                      return (
                        <Box
                          key={rework.id}
                          sx={{
                            mb: 2,
                            border: '1px solid',
                            borderRadius: 2,
                            borderColor: isActive
                              ? '#FCD34D'
                              : rework.status === 'COMPLETED'
                                ? '#BBF7D0'
                                : '#E5E7EB',
                            bgcolor: isActive
                              ? '#FFFBEB'
                              : rework.status === 'COMPLETED'
                                ? '#F0FDF4'
                                : '#F9FAFB',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Rework header */}
                          <Box
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Box>
                              <Typography fontWeight={700} fontSize="0.9rem">
                                Rework Round {rework.round}
                              </Typography>
                              {rework.faultDescription && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block' }}
                                >
                                  {rework.faultDescription}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Started by {rework.createdBy?.name} ·{' '}
                                {new Date(rework.createdAt).toLocaleDateString(
                                  'en-GB',
                                )}
                              </Typography>
                            </Box>
                            <Chip
                              label={rework.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                bgcolor: isActive
                                  ? '#FEF3C7'
                                  : rework.status === 'COMPLETED'
                                    ? '#DCFCE7'
                                    : '#F3F4F6',
                                color: isActive
                                  ? '#92400E'
                                  : rework.status === 'COMPLETED'
                                    ? '#166534'
                                    : '#6B7280',
                              }}
                            />
                          </Box>

                          {/* Tasks */}
                          <Box sx={{ px: 1.5, pb: 1 }}>
                            {rework.tasks.length === 0 && isActive && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 1 }}
                              >
                                No tasks yet. Add repair tasks below.
                              </Typography>
                            )}
                            {rework.tasks.map((task: any) => {
                              const taskAttachments: any[] = Array.isArray(
                                task.attachments,
                              )
                                ? task.attachments
                                : [];
                              return (
                                <Box
                                  key={task.id}
                                  sx={{
                                    mb: 1,
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor:
                                      task.status === 'COMPLETED'
                                        ? '#BBF7D0'
                                        : task.status === 'SKIPPED'
                                          ? '#DDD6FE'
                                          : '#E5E7EB',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {/* Task header row */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      px: 1.5,
                                      pt: 1.5,
                                      pb:
                                        isActive && task.status === 'PENDING'
                                          ? 0.5
                                          : 1.5,
                                    }}
                                  >
                                    {task.status === 'COMPLETED' ? (
                                      <CheckCircleIcon
                                        sx={{
                                          color: '#16A34A',
                                          fontSize: 18,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : task.status === 'SKIPPED' ? (
                                      <SkipNextIcon
                                        sx={{
                                          color: '#7C3AED',
                                          fontSize: 18,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <RadioButtonUncheckedIcon
                                        sx={{
                                          color: '#9CA3AF',
                                          fontSize: 18,
                                          flexShrink: 0,
                                        }}
                                      />
                                    )}
                                    <Typography
                                      variant="body2"
                                      fontWeight={
                                        task.status === 'PENDING' ? 600 : 400
                                      }
                                      sx={{
                                        flex: 1,
                                        textDecoration:
                                          task.status !== 'PENDING'
                                            ? 'line-through'
                                            : 'none',
                                        color:
                                          task.status !== 'PENDING'
                                            ? 'text.secondary'
                                            : 'text.primary',
                                      }}
                                    >
                                      {task.name}
                                    </Typography>
                                    {task.status !== 'PENDING' && (
                                      <Chip
                                        label={task.status}
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: '0.62rem',
                                          fontWeight: 700,
                                          bgcolor:
                                            task.status === 'COMPLETED'
                                              ? '#DCFCE7'
                                              : '#EDE9FE',
                                          color:
                                            task.status === 'COMPLETED'
                                              ? '#166534'
                                              : '#5B21B6',
                                        }}
                                      />
                                    )}
                                  </Box>

                                  {/* Completion evidence: notes + photos */}
                                  {task.status === 'COMPLETED' &&
                                    (task.notes ||
                                      taskAttachments.length > 0) && (
                                      <Box
                                        sx={{
                                          px: 1.5,
                                          pb: 1.5,
                                          pt: 0.5,
                                          borderTop: '1px solid #F3F4F6',
                                        }}
                                      >
                                        {task.notes && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              display: 'block',
                                              mb:
                                                taskAttachments.length > 0
                                                  ? 0.75
                                                  : 0,
                                              fontStyle: 'italic',
                                            }}
                                          >
                                            &ldquo;{task.notes}&rdquo;
                                          </Typography>
                                        )}
                                        {taskAttachments.length > 0 && (
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexWrap: 'wrap',
                                              gap: 0.75,
                                            }}
                                          >
                                            {taskAttachments.map(
                                              (f: any, i: number) =>
                                                f.mimeType?.startsWith(
                                                  'image/',
                                                ) ? (
                                                  <Box
                                                    key={i}
                                                    component="img"
                                                    src={`data:${f.mimeType};base64,${f.base64}`}
                                                    onClick={() =>
                                                      setReworkPreviewImg(
                                                        f.base64,
                                                      )
                                                    }
                                                    sx={{
                                                      width: 60,
                                                      height: 60,
                                                      objectFit: 'cover',
                                                      borderRadius: 1.5,
                                                      border:
                                                        '1px solid #E5E7EB',
                                                      display: 'block',
                                                      cursor: 'pointer',
                                                      '&:hover': {
                                                        opacity: 0.85,
                                                      },
                                                    }}
                                                  />
                                                ) : (
                                                  <Box
                                                    key={i}
                                                    sx={{
                                                      width: 60,
                                                      height: 60,
                                                      borderRadius: 1.5,
                                                      border:
                                                        '1px solid #E5E7EB',
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      bgcolor: '#F9FAFB',
                                                      gap: 0.5,
                                                    }}
                                                  >
                                                    <AttachFileIcon
                                                      sx={{
                                                        fontSize: 20,
                                                        color: '#6B7280',
                                                      }}
                                                    />
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        fontSize: '0.55rem',
                                                        color: '#6B7280',
                                                        textAlign: 'center',
                                                        px: 0.5,
                                                        lineHeight: 1.2,
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                          'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        width: '100%',
                                                      }}
                                                    >
                                                      {f.name}
                                                    </Typography>
                                                  </Box>
                                                ),
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    )}

                                  {/* Action buttons (PENDING tasks in active rework only) */}
                                  {isActive && task.status === 'PENDING' && (
                                    <Box
                                      sx={{
                                        px: 1.5,
                                        pb: 1.5,
                                        display: 'flex',
                                        gap: 1,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Button
                                        size="small"
                                        variant="contained"
                                        disabled={reworkActionLoading !== null}
                                        onClick={() =>
                                          setReworkTaskCompletionDialog({
                                            reworkId: rework.id,
                                            taskId: task.id,
                                            taskName: task.name,
                                            unitId: liveUnit.id,
                                          })
                                        }
                                        startIcon={<CheckCircleIcon />}
                                        sx={{
                                          bgcolor: '#16A34A',
                                          '&:hover': { bgcolor: '#15803D' },
                                          textTransform: 'none',
                                          fontWeight: 700,
                                          borderRadius: 2,
                                          px: 2,
                                          py: 0.7,
                                          fontSize: '0.8rem',
                                        }}
                                      >
                                        Mark Complete
                                      </Button>
                                      <Tooltip title="Skip this task">
                                        <span>
                                          <IconButton
                                            size="small"
                                            disabled={
                                              reworkActionLoading !== null
                                            }
                                            onClick={() =>
                                              callRework(
                                                `/rework/${rework.id}/tasks/${task.id}`,
                                                { status: 'SKIPPED' },
                                                `task-${task.id}`,
                                              )
                                            }
                                            sx={{
                                              color: '#7C3AED',
                                              border: '1px solid #DDD6FE',
                                              borderRadius: 2,
                                            }}
                                          >
                                            <SkipNextIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}

                            {/* Add task input (only for active rework) */}
                            {isActive && (
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                  size="small"
                                  placeholder="Add repair task…"
                                  fullWidth
                                  value={reworkTaskInput[rework.id] ?? ''}
                                  onChange={(e) =>
                                    setReworkTaskInput((p) => ({
                                      ...p,
                                      [rework.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') addTask(rework.id);
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: 2,
                                      fontSize: '0.8rem',
                                    },
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={
                                    !(
                                      reworkTaskInput[rework.id] ?? ''
                                    ).trim() || reworkActionLoading !== null
                                  }
                                  onClick={() => addTask(rework.id)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {reworkActionLoading ===
                                  `addTask-${rework.id}` ? (
                                    <CircularProgress size={14} />
                                  ) : (
                                    '+ Add'
                                  )}
                                </Button>
                              </Box>
                            )}

                            {/* Complete rework */}
                            {isActive && allTasksDone && (
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                disabled={reworkActionLoading !== null}
                                onClick={() =>
                                  callRework(
                                    `/rework/${rework.id}`,
                                    { action: 'COMPLETE' },
                                    `complete-${rework.id}`,
                                  )
                                }
                                startIcon={
                                  reworkActionLoading ===
                                  `complete-${rework.id}` ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CheckCircleIcon />
                                  )
                                }
                                sx={{
                                  mt: 1.5,
                                  bgcolor: '#16A34A',
                                  '&:hover': { bgcolor: '#15803D' },
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  borderRadius: 2,
                                }}
                              >
                                Complete Rework → Resume{' '}
                                {rework.triggeredByStepId ?? 'QC-1'}
                              </Button>
                            )}
                            {isActive &&
                              !allTasksDone &&
                              rework.tasks.length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 1 }}
                                >
                                  Complete or skip all tasks to finish the
                                  rework.
                                </Typography>
                              )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ─── Rework Image Preview Overlay ─── */}
      {reworkPreviewImg && (
        <div
          onClick={() => setReworkPreviewImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={`data:image/jpeg;base64,${reworkPreviewImg}`}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: 12,
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* ─── Rework Task Completion Dialog ─── */}
      <Dialog
        open={!!reworkTaskCompletionDialog}
        onClose={() =>
          !reworkTaskDialogSubmitting &&
          (setReworkTaskCompletionDialog(null),
          setReworkTaskPhotos([]),
          setReworkTaskComment(''))
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
          Complete Repair Task
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{reworkTaskCompletionDialog?.taskName}</strong>
          </Typography>

          <Alert
            severity="info"
            sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}
          >
            At least one photo is required to confirm completion.
          </Alert>

          {/* Photo previews */}
          {reworkTaskPhotos.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {reworkTaskPhotos.map((f, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={`data:${f.mimeType};base64,${f.base64}`}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 2,
                      display: 'block',
                      border: '1px solid #E5E7EB',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setReworkTaskPhotos((prev) =>
                        prev.filter((_, j) => j !== i),
                      )
                    }
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'white',
                      boxShadow: 1,
                      p: 0.3,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Photo capture / upload buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              component="label"
              variant={reworkTaskPhotos.length === 0 ? 'contained' : 'outlined'}
              size="small"
              startIcon={<PhotoCameraIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleReworkTaskPhotoCapture}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AttachFileIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleReworkTaskPhotoCapture}
              />
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Optional comment */}
          <TextField
            label="Comment (optional)"
            multiline
            rows={2}
            value={reworkTaskComment}
            onChange={(e) => setReworkTaskComment(e.target.value)}
            fullWidth
            placeholder="Add any notes about this repair task…"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setReworkTaskCompletionDialog(null);
              setReworkTaskPhotos([]);
              setReworkTaskComment('');
            }}
            disabled={reworkTaskDialogSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitReworkTaskCompletion}
            disabled={
              reworkTaskPhotos.length === 0 || reworkTaskDialogSubmitting
            }
            startIcon={
              reworkTaskDialogSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            {reworkTaskPhotos.length === 0
              ? 'Add a photo to complete'
              : 'Complete Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
