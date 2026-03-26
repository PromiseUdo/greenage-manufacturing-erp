"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
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
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BuildIcon from "@mui/icons-material/Build";
import InventoryIcon from "@mui/icons-material/Inventory";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckIcon from "@mui/icons-material/Check";
import { MaterialSearchPicker } from "@/app/components/shared/MaterialSearchPicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile {
  name: string;
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

interface RepairTask {
  id: string;
  name: string;
  sortOrder: number;
  status: "PENDING" | "COMPLETED";
  returnUnitId: string | null;
  assignedTo: { id: string; name: string } | null;
  completedAt: string | null;
  completedBy: { id: string; name: string } | null;
  notes: string | null;
  attachments: AttachmentFile[] | null;
}

interface ReturnUnit {
  id: string;
  unitNumber: number;
  serialNumber: string | null;
  status: string;
  // Inspection
  evaluationNotes: string | null;
  evaluationAttachments: AttachmentFile[] | null;
  inspectedBy: { id: string; name: string } | null;
  inspectedAt: string | null;
  // Approval
  recommendedAction: string | null;
  approvalAttachments: AttachmentFile[] | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  // Tasks
  repairTasks: RepairTask[];
}

interface Worker {
  id: string;
  name: string;
  role: string;
}

interface MaterialReqItem {
  materialId: string;
  material: { id: string; name: string; partNumber: string; unit: string; currentStock: number };
  quantityRequired: number;
  quantityIssued: number | null;
  status: string;
}

interface MaterialRequisition {
  id: string;
  requisitionNumber: string;
  status: string;
  notes: string | null;
  requestedBy: { id: string; name: string };
  fulfilledBy: { id: string; name: string } | null;
  fulfilledAt: string | null;
  items: MaterialReqItem[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKFLOW_STAGES = [
  { key: "RECEIVED", label: "Received" },
  { key: "INSPECTING", label: "Inspecting" },
  { key: "PENDING_APPROVAL", label: "Pending Approval" },
  { key: "IN_REPAIR", label: "In Repair" },
  { key: "REPAIR_COMPLETED", label: "Repair Completed" },
  { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch" },
  { key: "DISPATCHED", label: "Dispatched" },
];

const STATUS_ORDER: Record<string, number> = {
  RECEIVED: 0,
  INSPECTING: 1,
  PENDING_APPROVAL: 2,
  IN_REPAIR: 3,
  REPAIR_COMPLETED: 4,
  READY_FOR_DISPATCH: 5,
  DISPATCHED: 6,
  SCRAPPED: 99,
};

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  RECEIVED: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  INSPECTING: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  PENDING_APPROVAL: { bg: "#E0E7FF", text: "#4338CA", border: "#A5B4FC" },
  IN_REPAIR: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  REPAIR_COMPLETED: { bg: "#ECFCCB", text: "#3F6212", border: "#A3E635" },
  READY_FOR_DISPATCH: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  DISPATCHED: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  SCRAPPED: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  OPERATION_MANAGER: "Operations Mgr",
  PRODUCTION_MANAGER: "Production Mgr",
  STORE_KEEPER: "Store Keeper",
  PRODUCTION_STAFF: "Production Staff",
  QC_TEAM: "QC Team",
  PACKAGING_TEAM: "Packaging",
  SALES_TEAM: "Sales",
  DISPATCH_OFFICER: "Dispatch",
  ACCOUNTANT: "Accountant",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" };
  const label = WORKFLOW_STAGES.find((s) => s.key === status)?.label ?? status;
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: c.bg, color: c.text,
        border: `1px solid ${c.border}`,
        fontWeight: 700, fontSize: "0.7rem",
      }}
    />
  );
}

function AttachmentGrid({
  attachments,
  onPreview,
}: {
  attachments: AttachmentFile[];
  onPreview: (src: string) => void;
}) {
  if (!attachments.length) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
      {attachments.map((f, i) =>
        f.mimeType.startsWith("image/") ? (
          <Box
            key={i}
            component="img"
            src={`data:${f.mimeType};base64,${f.base64}`}
            alt={f.name}
            onClick={() => onPreview(`data:${f.mimeType};base64,${f.base64}`)}
            sx={{
              width: 72, height: 72, objectFit: "cover",
              borderRadius: 1.5, border: "1px solid #E5E7EB",
              cursor: "zoom-in", transition: "transform .15s",
              "&:hover": { transform: "scale(1.05)" },
            }}
          />
        ) : (
          <Box
            key={i}
            sx={{
              width: 72, height: 72, borderRadius: 1.5,
              border: "1px solid #E5E7EB",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              bgcolor: "#F9FAFB",
            }}
          >
            <AttachFileIcon sx={{ fontSize: 20, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled"
              sx={{ fontSize: "0.6rem", px: 0.5, textAlign: "center" }}>
              {f.name.split(".").pop()?.toUpperCase()}
            </Typography>
          </Box>
        )
      )}
    </Box>
  );
}

function FileUploadArea({
  files,
  onAdd,
  onRemove,
  onPreview,
  label = "Add Photo / File",
}: {
  files: AttachmentFile[];
  onAdd: (f: AttachmentFile[]) => void;
  onRemove: (i: number) => void;
  onPreview: (src: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        onAdd([{ name: file.name, mimeType: file.type, base64, sizeBytes: file.size }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={() => {
            if (inputRef.current) { inputRef.current.accept = "image/*"; inputRef.current.click(); }
          }}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Photo
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={() => {
            if (inputRef.current) { inputRef.current.accept = "*/*"; inputRef.current.click(); }
          }}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          File
        </Button>
        {files.length > 0 && (
          <Typography variant="caption" color="text.secondary" alignSelf="center">
            {files.length} file{files.length !== 1 ? "s" : ""} attached
          </Typography>
        )}
      </Box>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => e.target.files && readFiles(e.target.files)}
      />
      {files.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {files.map((f, i) => (
            <Box key={i} sx={{ position: "relative" }}>
              {f.mimeType.startsWith("image/") ? (
                <Box
                  component="img"
                  src={`data:${f.mimeType};base64,${f.base64}`}
                  alt={f.name}
                  onClick={() => onPreview(`data:${f.mimeType};base64,${f.base64}`)}
                  sx={{
                    width: 80, height: 80, objectFit: "cover",
                    borderRadius: 1.5, border: "1px solid #E5E7EB", cursor: "zoom-in",
                  }}
                />
              ) : (
                <Box sx={{
                  width: 80, height: 80, borderRadius: 1.5, border: "1px solid #E5E7EB",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", bgcolor: "#F9FAFB",
                }}>
                  <AttachFileIcon sx={{ fontSize: 24, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled"
                    sx={{ fontSize: "0.6rem", px: 0.5, textAlign: "center" }}>
                    {f.name.split(".").pop()?.toUpperCase()}
                  </Typography>
                </Box>
              )}
              <IconButton
                size="small"
                onClick={() => onRemove(i)}
                sx={{
                  position: "absolute", top: -6, right: -6,
                  bgcolor: "#fff", border: "1px solid #E5E7EB",
                  width: 20, height: 20, "&:hover": { bgcolor: "#FEE2E2" },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductionReturnDetailClient({
  initialData,
  currentUser,
}: {
  initialData: any;
  currentUser: any;
}) {
  const router = useRouter();
  const [data] = useState(initialData);

  // ── Units ──────────────────────────────────────────────────────
  const [units, setUnits] = useState<ReturnUnit[]>(initialData.returnUnits ?? []);
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // ── Workers ────────────────────────────────────────────────────
  const [workers, setWorkers] = useState<Worker[]>([]);

  // ── Material requisitions ──────────────────────────────────────
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>(
    initialData.materialRequisitions ?? []
  );
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqItems, setReqItems] = useState<
    { material: any; quantityRequired: number }[]
  >([]);
  const [reqNotes, setReqNotes] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  // ── Stage action dialogs ───────────────────────────────────────
  const [stageDialog, setStageDialog] = useState<{
    open: boolean;
    type: "submit_findings" | "approve" | "scrap" | null;
    unitId: string;
    notes: string;
    files: AttachmentFile[];
  }>({ open: false, type: null, unitId: "", notes: "", files: [] });
  const [stageLoading, setStageLoading] = useState(false);

  // ── Add task ───────────────────────────────────────────────────
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // ── Complete task ──────────────────────────────────────────────
  const [completeDialog, setCompleteDialog] = useState<{
    open: boolean;
    task: RepairTask | null;
  }>({ open: false, task: null });
  const [taskNotes, setTaskNotes] = useState("");
  const [taskFiles, setTaskFiles] = useState<AttachmentFile[]>([]);
  const [completingTask, setCompletingTask] = useState(false);

  // ── Image preview ──────────────────────────────────────────────
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────
  const activeUnit: ReturnUnit | undefined = units[activeUnitIdx];
  const activeStageIdx = activeUnit
    ? (STATUS_ORDER[activeUnit.status] ?? 0)
    : 0;
  const isScrapped = activeUnit?.status === "SCRAPPED";

  // ── Init units if none (first load for legacy/new returns) ─────
  useEffect(() => {
    if (units.length === 0) {
      setUnitsLoading(true);
      fetch(`/api/returns/${data.id}/units`)
        .then((r) => r.json())
        .then(({ units: u }) => { if (u) setUnits(u); })
        .catch(console.error)
        .finally(() => setUnitsLoading(false));
    }
  }, [data.id, units.length]);

  // ── Fetch workers on mount ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/users/workers")
      .then((r) => r.json())
      .then(({ workers: w }) => { if (w) setWorkers(w); })
      .catch(console.error);
  }, []);

  // ── Helper: update a single unit in state ─────────────────────
  const patchUnit = useCallback((updated: ReturnUnit) => {
    setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Stage transitions
  // ─────────────────────────────────────────────────────────────

  const openStageDialog = (
    type: "submit_findings" | "approve" | "scrap",
    unitId: string,
  ) => {
    setStageDialog({ open: true, type, unitId, notes: "", files: [] });
  };

  const submitStageAction = async () => {
    if (!stageDialog.type || !stageDialog.unitId) return;
    setStageLoading(true);

    let nextStatus = "";
    const body: any = {};

    if (stageDialog.type === "submit_findings") {
      nextStatus = "PENDING_APPROVAL";
      body.evaluationNotes = stageDialog.notes;
      body.evaluationAttachments = stageDialog.files;
    } else if (stageDialog.type === "approve") {
      nextStatus = "IN_REPAIR";
      body.recommendedAction = stageDialog.notes;
      body.approvalAttachments = stageDialog.files;
    } else if (stageDialog.type === "scrap") {
      nextStatus = "SCRAPPED";
      body.recommendedAction = stageDialog.notes;
      body.approvalAttachments = stageDialog.files;
    }

    try {
      const res = await fetch(
        `/api/returns/${data.id}/units/${stageDialog.unitId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, ...body }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        patchUnit(updated);
        setStageDialog({ open: false, type: null, unitId: "", notes: "", files: [] });
      } else {
        const err = await res.json();
        alert(err.error ?? "Action failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStageLoading(false);
    }
  };

  const startInspection = async (unitId: string) => {
    const res = await fetch(`/api/returns/${data.id}/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INSPECTING" }),
    });
    if (res.ok) patchUnit(await res.json());
  };

  // ─────────────────────────────────────────────────────────────
  // Repair tasks
  // ─────────────────────────────────────────────────────────────

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !activeUnit) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/returns/${data.id}/repair-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTaskName.trim(),
          assignedToId: newTaskAssignee || null,
          returnUnitId: activeUnit.id,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        // If unit isn't in IN_REPAIR yet, transition it
        if (!["IN_REPAIR", "REPAIR_COMPLETED"].includes(activeUnit.status)) {
          const unitRes = await fetch(
            `/api/returns/${data.id}/units/${activeUnit.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "IN_REPAIR" }),
            }
          );
          if (unitRes.ok) patchUnit(await unitRes.json());
        }
        setUnits((prev) =>
          prev.map((u) =>
            u.id === activeUnit.id
              ? { ...u, repairTasks: [...u.repairTasks, task] }
              : u
          )
        );
        setNewTaskName("");
        setNewTaskAssignee("");
        setAddTaskOpen(false);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to add task");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const res = await fetch(`/api/returns/${data.id}/repair-tasks/${taskId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          repairTasks: u.repairTasks.filter((t) => t.id !== taskId),
        }))
      );
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to delete task");
    }
  };

  const openCompleteDialog = (task: RepairTask) => {
    setCompleteDialog({ open: true, task });
    setTaskNotes("");
    setTaskFiles([]);
  };

  const submitComplete = async () => {
    if (!completeDialog.task) return;
    if (taskFiles.length === 0) return; // enforced in UI, extra guard
    setCompletingTask(true);
    try {
      const res = await fetch(
        `/api/returns/${data.id}/repair-tasks/${completeDialog.task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: taskNotes || null, attachments: taskFiles }),
        }
      );
      if (res.ok) {
        const { task: updated, unitStatus } = await res.json();
        setUnits((prev) =>
          prev.map((u) => {
            const newTasks = u.repairTasks.map((t) =>
              t.id === updated.id ? updated : t
            );
            const newStatus = unitStatus && u.repairTasks.some((t) => t.id === updated.id)
              ? unitStatus
              : u.status;
            return { ...u, repairTasks: newTasks, status: newStatus };
          })
        );
        setCompleteDialog({ open: false, task: null });
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to complete task");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingTask(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Material requisitions
  // ─────────────────────────────────────────────────────────────

  const addReqItem = (material: any) => {
    setReqItems((prev) => [
      ...prev,
      { material, quantityRequired: 1 },
    ]);
  };

  const removeReqItem = (idx: number) => {
    setReqItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitReq = async () => {
    if (reqItems.length === 0) return;
    setSubmittingReq(true);
    try {
      const res = await fetch(`/api/returns/${data.id}/material-requisition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: reqNotes || null,
          items: reqItems.map((i) => ({
            materialId: i.material.id,
            quantityRequired: i.quantityRequired,
          })),
        }),
      });
      if (res.ok) {
        const req = await res.json();
        setRequisitions((prev) => [req, ...prev]);
        setReqDialogOpen(false);
        setReqItems([]);
        setReqNotes("");
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to create requisition");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReq(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────

  const hasOpenReq = requisitions.some((r) =>
    ["PENDING", "PARTIALLY_FULFILLED"].includes(r.status)
  );

  const REQ_STATUS_COLOR: Record<string, string> = {
    PENDING: "#DBEAFE",
    PARTIALLY_FULFILLED: "#FEF3C7",
    FULFILLED: "#DCFCE7",
    CANCELLED: "#F3F4F6",
  };
  const REQ_STATUS_TEXT: Record<string, string> = {
    PENDING: "#1E40AF",
    PARTIALLY_FULFILLED: "#92400E",
    FULFILLED: "#166534",
    CANCELLED: "#6B7280",
  };

  if (unitsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <IconButton onClick={() => router.push("/production/returns")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>
            Return #{data.returnNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.product?.name} · {data.customer?.name}
            {data.quantity > 1 && (
              <Chip
                label={`${data.quantity} units`}
                size="small"
                sx={{ ml: 1, bgcolor: "#E0E7FF", color: "#4338CA", fontWeight: 700, fontSize: "0.65rem" }}
              />
            )}
          </Typography>
        </Box>
        <StatusBadge status={data.status} />
      </Box>

      {/* ── Info card ──────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="overline" color="text.secondary" display="block">Customer</Typography>
            <Typography fontWeight={700}>{data.customer?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{data.customer?.phone}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="overline" color="text.secondary" display="block">Product</Typography>
            <Typography fontWeight={700}>{data.product?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{data.product?.productNumber}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="overline" color="text.secondary" display="block">Received</Typography>
            <Typography fontWeight={700}>{fmtDate(data.dateReceived)}</Typography>
            <Typography variant="body2" color="text.secondary">by {data.receivedBy?.name}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 0 }} />
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="overline" color="text.secondary" display="block">Issue Reported</Typography>
              <Typography variant="body2" sx={{ p: 1.5, bgcolor: "#F9FAFB", borderRadius: 2, mt: 0.5 }}>
                {data.issueReported}
              </Typography>
              {data.condition && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <strong>Condition:</strong> {data.condition}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Unit Tabs (if qty > 1) ──────────────────────────────── */}
      {units.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={activeUnitIdx}
            onChange={(_, v) => setActiveUnitIdx(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: "#F9FAFB", borderRadius: 2, p: 0.5,
              "& .MuiTab-root": { borderRadius: 1.5, textTransform: "none", fontWeight: 600, minHeight: 40 },
              "& .Mui-selected": { bgcolor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
            }}
          >
            {units.map((u, i) => (
              <Tab
                key={u.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Unit {u.unitNumber}</Typography>
                    <StatusBadge status={u.status} />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* ── Active Unit Workflow ───────────────────────────────── */}
      {activeUnit && (
        <Box>
          {/* Serial number label */}
          {activeUnit.serialNumber && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Serial:</strong> {activeUnit.serialNumber}
            </Typography>
          )}

          {/* Scrapped banner */}
          {isScrapped && (
            <Alert
              severity="error"
              icon={<WarningAmberIcon />}
              sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}
            >
              This unit has been marked as scrapped and will not proceed to repair.
            </Alert>
          )}

          {/* ── Stage 1: Received ─────────────────────────────── */}
          <StageCard
            stageNum={1}
            title="Received"
            icon="📦"
            isComplete={true}
            isCurrent={activeUnit.status === "RECEIVED"}
          >
            <Typography variant="body2" color="text.secondary">
              Received on {fmtDate(data.dateReceived)} by{" "}
              <strong>{data.receivedBy?.name}</strong>
            </Typography>
            {activeUnit.status === "RECEIVED" && !isScrapped && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => startInspection(activeUnit.id)}
                  sx={{
                    bgcolor: "#6D28D9", "&:hover": { bgcolor: "#5B21B6" },
                    textTransform: "none", fontWeight: 600, borderRadius: 2,
                  }}
                >
                  Start Inspection
                </Button>
              </Box>
            )}
          </StageCard>

          {/* ── Stage 2: Inspection ───────────────────────────── */}
          {(STATUS_ORDER[activeUnit.status] >= 1 || activeUnit.status === "SCRAPPED") && (
            <StageCard
              stageNum={2}
              title="Inspection"
              icon="🔍"
              isComplete={STATUS_ORDER[activeUnit.status] > 1}
              isCurrent={activeUnit.status === "INSPECTING"}
            >
              {activeUnit.status === "INSPECTING" ? (
                <>
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    Inspector: document your findings below and submit for manager approval.
                  </Alert>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openStageDialog("submit_findings", activeUnit.id)}
                    sx={{
                      bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" },
                      textTransform: "none", fontWeight: 600, borderRadius: 2,
                    }}
                  >
                    Submit Findings for Approval
                  </Button>
                </>
              ) : activeUnit.evaluationNotes ? (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                    {activeUnit.evaluationNotes}
                  </Typography>
                  <AttachmentGrid
                    attachments={activeUnit.evaluationAttachments ?? []}
                    onPreview={setPreviewImg}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    by {activeUnit.inspectedBy?.name} · {fmtDate(activeUnit.inspectedAt)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">No inspection notes recorded.</Typography>
              )}
            </StageCard>
          )}

          {/* ── Stage 3: Manager Approval ─────────────────────── */}
          {(STATUS_ORDER[activeUnit.status] >= 2 || activeUnit.status === "SCRAPPED") && (
            <StageCard
              stageNum={3}
              title="Manager Approval"
              icon="✅"
              isComplete={STATUS_ORDER[activeUnit.status] > 2 || activeUnit.status === "SCRAPPED"}
              isCurrent={activeUnit.status === "PENDING_APPROVAL"}
            >
              {activeUnit.status === "PENDING_APPROVAL" ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    Awaiting manager decision — approve for repair or scrap this unit.
                  </Alert>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      onClick={() => openStageDialog("approve", activeUnit.id)}
                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                    >
                      Approve for Repair
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => openStageDialog("scrap", activeUnit.id)}
                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                    >
                      Scrap Unit
                    </Button>
                  </Box>
                </>
              ) : activeUnit.recommendedAction ? (
                <>
                  <Box
                    sx={{
                      p: 2, borderRadius: 2,
                      bgcolor: activeUnit.status === "SCRAPPED" ? "#FFF1F2" : "#F0F9FF",
                      border: `1px solid ${activeUnit.status === "SCRAPPED" ? "#FECDD3" : "#BAE6FD"}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: activeUnit.status === "SCRAPPED" ? "#BE123C" : "#0369A1" }}
                    >
                      {activeUnit.status === "SCRAPPED" ? "SCRAPPED" : "APPROVED FOR REPAIR"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                      {activeUnit.recommendedAction}
                    </Typography>
                    <AttachmentGrid
                      attachments={activeUnit.approvalAttachments ?? []}
                      onPreview={setPreviewImg}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      by {activeUnit.approvedBy?.name} · {fmtDate(activeUnit.approvedAt)}
                    </Typography>
                  </Box>
                </>
              ) : null}
            </StageCard>
          )}

          {/* ── Stage 4: Repair ───────────────────────────────── */}
          {(STATUS_ORDER[activeUnit.status] >= 3) && !isScrapped && (
            <StageCard
              stageNum={4}
              title="Repair"
              icon="🔧"
              isComplete={STATUS_ORDER[activeUnit.status] > 3}
              isCurrent={activeUnit.status === "IN_REPAIR"}
            >
              <UnitRepairSection
                returnId={data.id}
                unit={activeUnit}
                workers={workers}
                currentUser={currentUser}
                onAddTask={() => setAddTaskOpen(true)}
                onDeleteTask={handleDeleteTask}
                onCompleteTask={openCompleteDialog}
                onPreview={setPreviewImg}
              />

              {/* Material Requisitions */}
              <Divider sx={{ my: 2.5 }} />
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <InventoryIcon sx={{ color: "#0369A1", fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Material Requisitions
                    </Typography>
                    {requisitions.length > 0 && (
                      <Chip
                        label={requisitions.length}
                        size="small"
                        sx={{ bgcolor: "#DBEAFE", color: "#1E40AF", fontWeight: 700, height: 18 }}
                      />
                    )}
                  </Box>
                  {!hasOpenReq && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setReqDialogOpen(true)}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Request Materials
                    </Button>
                  )}
                </Box>

                {requisitions.length === 0 ? (
                  <Box
                    sx={{
                      py: 3, textAlign: "center",
                      border: "1px dashed", borderColor: "divider", borderRadius: 2,
                    }}
                  >
                    <InventoryIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      No materials requested yet.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {requisitions.map((req) => (
                      <Paper
                        key={req.id}
                        elevation={0}
                        sx={{
                          p: 2, borderRadius: 2, border: "1px solid #E5E7EB",
                          bgcolor: REQ_STATUS_COLOR[req.status] ?? "#F9FAFB",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {req.requisitionNumber}
                          </Typography>
                          <Chip
                            label={req.status.replace(/_/g, " ")}
                            size="small"
                            sx={{
                              bgcolor: REQ_STATUS_COLOR[req.status],
                              color: REQ_STATUS_TEXT[req.status],
                              fontWeight: 700, fontSize: "0.65rem",
                            }}
                          />
                        </Box>
                        {req.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {req.notes}
                          </Typography>
                        )}
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {req.items.map((item) => (
                            <Box key={item.materialId} sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="caption">
                                {item.material.name}{" "}
                                <span style={{ color: "#9CA3AF" }}>({item.material.partNumber})</span>
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {item.quantityRequired} {item.material.unit}
                                {item.quantityIssued != null && ` → issued: ${item.quantityIssued}`}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                          Requested by {req.requestedBy.name} · {fmtDate(req.createdAt)}
                          {req.fulfilledBy && ` · Fulfilled by ${req.fulfilledBy.name}`}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </StageCard>
          )}

          {/* ── Stage 5: Repair Completed ─────────────────────── */}
          {STATUS_ORDER[activeUnit.status] >= 4 && !isScrapped && (
            <StageCard
              stageNum={5}
              title="Repair Completed"
              icon="🎉"
              isComplete={STATUS_ORDER[activeUnit.status] >= 4}
              isCurrent={activeUnit.status === "REPAIR_COMPLETED"}
            >
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                All repair tasks have been completed. Unit is ready for dispatch processing.
              </Alert>
            </StageCard>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════
          Dialogs
      ════════════════════════════════════════════════════════ */}

      {/* ── Stage Action Dialog (Submit Findings / Approve / Scrap) */}
      <Dialog
        open={stageDialog.open}
        onClose={() => !stageLoading && setStageDialog((p) => ({ ...p, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {stageDialog.type === "submit_findings" && "Submit Inspection Findings"}
          {stageDialog.type === "approve" && "Approve Unit for Repair"}
          {stageDialog.type === "scrap" && "Scrap Unit"}
        </DialogTitle>
        <DialogContent dividers>
          {stageDialog.type === "scrap" && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              This action is irreversible. The unit will be marked as scrapped.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label={
              stageDialog.type === "submit_findings"
                ? "Inspection findings & notes"
                : "Recommendation / Notes"
            }
            value={stageDialog.notes}
            onChange={(e) => setStageDialog((p) => ({ ...p, notes: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Supporting Files
          </Typography>
          <FileUploadArea
            files={stageDialog.files}
            onAdd={(f) => setStageDialog((p) => ({ ...p, files: [...p.files, ...f] }))}
            onRemove={(i) => setStageDialog((p) => ({
              ...p,
              files: p.files.filter((_, idx) => idx !== i),
            }))}
            onPreview={setPreviewImg}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStageDialog((p) => ({ ...p, open: false }))}
            disabled={stageLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={submitStageAction}
            variant="contained"
            disabled={stageLoading || !stageDialog.notes.trim()}
            color={stageDialog.type === "scrap" ? "error" : "primary"}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {stageLoading ? <CircularProgress size={20} color="inherit" /> : (
              stageDialog.type === "submit_findings" ? "Submit Findings" :
              stageDialog.type === "approve" ? "Approve for Repair" : "Confirm Scrap"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Task Dialog ──────────────────────────────────────── */}
      <Dialog open={addTaskOpen} onClose={() => !addingTask && setAddTaskOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Add Repair Task</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            autoFocus
            label="Task description"
            placeholder="e.g. Replace faulty capacitor on main PCB"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddTask()}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Assign to worker (optional)</InputLabel>
            <Select
              value={newTaskAssignee}
              label="Assign to worker (optional)"
              onChange={(e) => setNewTaskAssignee(e.target.value)}
            >
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {workers.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem", bgcolor: "#6D28D9" }}>
                      {w.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{w.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ROLE_LABEL[w.role] ?? w.role}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskOpen(false)} disabled={addingTask}>Cancel</Button>
          <Button
            onClick={handleAddTask}
            variant="contained"
            disabled={addingTask || !newTaskName.trim()}
            startIcon={addingTask ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1e293b" }, textTransform: "none", fontWeight: 600 }}
          >
            {addingTask ? "Adding…" : "Add Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Complete Task Dialog ─────────────────────────────────── */}
      <Dialog
        open={completeDialog.open}
        onClose={() => !completingTask && setCompleteDialog({ open: false, task: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <TaskAltIcon sx={{ color: "#16A34A" }} />
          Mark Task Complete
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            {completeDialog.task?.name}
          </Typography>
          <TextField
            fullWidth
            label="Completion notes (optional)"
            multiline
            rows={3}
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            placeholder="What was done, parts used, observations…"
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Evidence (photo or file required) *
          </Typography>
          <FileUploadArea
            files={taskFiles}
            onAdd={(f) => setTaskFiles((p) => [...p, ...f])}
            onRemove={(i) => setTaskFiles((p) => p.filter((_, idx) => idx !== i))}
            onPreview={setPreviewImg}
            label="Add Evidence Photo"
          />
          {taskFiles.length === 0 && (
            <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
              At least one photo or file is required to complete a task.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCompleteDialog({ open: false, task: null })}
            disabled={completingTask}
          >
            Cancel
          </Button>
          <Button
            onClick={submitComplete}
            variant="contained"
            disabled={completingTask || taskFiles.length === 0}
            startIcon={completingTask ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
            sx={{ bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" }, textTransform: "none", fontWeight: 600 }}
          >
            {completingTask ? "Saving…" : "Mark Complete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Material Requisition Dialog ──────────────────────────── */}
      <Dialog
        open={reqDialogOpen}
        onClose={() => !submittingReq && setReqDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon sx={{ color: "#0369A1" }} />
          Request Repair Materials
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search and add materials needed for this repair. The request will be sent to the inventory team.
          </Typography>

          <MaterialSearchPicker
            onAdd={addReqItem}
            alreadyAdded={reqItems.map((i) => i.material.id)}
          />

          {reqItems.length > 0 && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {reqItems.map((item, idx) => (
                <Paper
                  key={item.material.id}
                  elevation={0}
                  sx={{ p: 1.5, border: "1px solid #E5E7EB", borderRadius: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{item.material.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.material.partNumber} · {item.material.unit} · {item.material.currentStock} in stock
                      </Typography>
                    </Box>
                    <TextField
                      size="small"
                      type="number"
                      label="Qty"
                      value={item.quantityRequired}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value));
                        setReqItems((prev) =>
                          prev.map((pi, i) => i === idx ? { ...pi, quantityRequired: v } : pi)
                        );
                      }}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ width: 80 }}
                    />
                    <IconButton size="small" onClick={() => removeReqItem(idx)} color="error">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}

          <TextField
            fullWidth
            label="Notes for inventory team (optional)"
            multiline
            rows={2}
            value={reqNotes}
            onChange={(e) => setReqNotes(e.target.value)}
            placeholder="Urgency, special handling notes…"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReqDialogOpen(false)} disabled={submittingReq}>Cancel</Button>
          <Button
            onClick={submitReq}
            variant="contained"
            disabled={submittingReq || reqItems.length === 0}
            startIcon={submittingReq ? <CircularProgress size={14} color="inherit" /> : <InventoryIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {submittingReq ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Full-screen image preview ─────────────────────────────── */}
      {previewImg && (
        <Box
          onClick={() => setPreviewImg(null)}
          sx={{
            position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "zoom-out",
          }}
        >
          <IconButton
            onClick={() => setPreviewImg(null)}
            sx={{ position: "absolute", top: 16, right: 16, color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={previewImg}
            sx={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 2 }}
          />
        </Box>
      )}
    </Box>
  );
}

// ─── Stage Card ───────────────────────────────────────────────────────────────

function StageCard({
  stageNum,
  title,
  icon,
  isComplete,
  isCurrent,
  children,
}: {
  stageNum: number;
  title: string;
  icon: string;
  isComplete: boolean;
  isCurrent: boolean;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 3,
        border: "1px solid",
        borderColor: isCurrent ? "#6D28D9" : isComplete ? "#BBF7D0" : "#E5E7EB",
        mb: 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Stage header */}
      <Box
        sx={{
          px: 3, py: 2,
          bgcolor: isCurrent ? "#F5F3FF" : isComplete ? "#F0FDF4" : "#FAFAFA",
          borderBottom: "1px solid",
          borderColor: isCurrent ? "#DDD6FE" : isComplete ? "#BBF7D0" : "#E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: isCurrent ? "#6D28D9" : isComplete ? "#16A34A" : "#E5E7EB",
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
          ) : (
            <Typography sx={{ fontSize: "0.7rem", color: isCurrent ? "#fff" : "#9CA3AF", fontWeight: 700 }}>
              {stageNum}
            </Typography>
          )}
        </Box>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ color: isCurrent ? "#5B21B6" : isComplete ? "#15803D" : "#374151" }}
        >
          {icon} {title}
        </Typography>
        {isCurrent && (
          <Chip
            label="In Progress"
            size="small"
            sx={{ ml: "auto", bgcolor: "#EDE9FE", color: "#6D28D9", fontWeight: 700, fontSize: "0.65rem" }}
          />
        )}
        {isComplete && !isCurrent && (
          <Chip
            label="Completed"
            size="small"
            sx={{ ml: "auto", bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: "0.65rem" }}
          />
        )}
      </Box>
      {/* Stage body */}
      <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
    </Paper>
  );
}

// ─── Unit Repair Section ──────────────────────────────────────────────────────

function UnitRepairSection({
  returnId,
  unit,
  workers,
  currentUser,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onPreview,
}: {
  returnId: string;
  unit: ReturnUnit;
  workers: Worker[];
  currentUser: any;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (task: RepairTask) => void;
  onPreview: (src: string) => void;
}) {
  const tasks = unit.repairTasks;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && completedCount === tasks.length;
  const canManage = ["ADMIN", "PRODUCTION_MANAGER", "OPERATION_MANAGER"].includes(
    currentUser?.role ?? ""
  );

  return (
    <Box>
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BuildIcon sx={{ color: "#D97706", fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700}>Repair Tasks</Typography>
          <Chip
            label={`${completedCount}/${tasks.length}`}
            size="small"
            sx={{
              bgcolor: allDone ? "#DCFCE7" : "#FEF3C7",
              color: allDone ? "#166534" : "#92400E",
              fontWeight: 700, height: 18,
            }}
          />
        </Box>
        {unit.status === "IN_REPAIR" && canManage && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddTask}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
          >
            Add Task
          </Button>
        )}
      </Box>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6, borderRadius: 3, bgcolor: "#E5E7EB",
              "& .MuiLinearProgress-bar": {
                bgcolor: allDone ? "#16A34A" : "#D97706", borderRadius: 3,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            {progress}% complete
          </Typography>
        </Box>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <Box
          sx={{
            py: 4, textAlign: "center",
            border: "1px dashed", borderColor: "divider", borderRadius: 2,
          }}
        >
          <BuildIcon sx={{ fontSize: 32, color: "text.disabled", mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            No repair tasks yet. Add tasks to track the repair process.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {tasks.map((task, idx) => {
            const done = task.status === "COMPLETED";
            const attachments = Array.isArray(task.attachments) ? task.attachments : [];

            return (
              <Paper
                key={task.id}
                elevation={0}
                sx={{
                  p: 2, borderRadius: 2, border: "1px solid",
                  borderColor: done ? "#BBF7D0" : "divider",
                  bgcolor: done ? "#F0FDF4" : "background.paper",
                }}
              >
                {/* Task header */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  {done ? (
                    <CheckCircleIcon sx={{ color: "#16A34A", mt: 0.2, flexShrink: 0 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: "text.disabled", mt: 0.2, flexShrink: 0 }} />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        textDecoration: done ? "line-through" : "none",
                        color: done ? "text.secondary" : "text.primary",
                      }}
                    >
                      {idx + 1}. {task.name}
                    </Typography>

                    {/* Assignee */}
                    {task.assignedTo && !done && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">
                          {task.assignedTo.name}
                        </Typography>
                      </Box>
                    )}

                    {done && (
                      <Typography variant="caption" color="text.secondary">
                        Completed by {task.completedBy?.name}
                        {task.assignedTo && ` (assigned: ${task.assignedTo.name})`}
                        {" · "}{fmtDate(task.completedAt)}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  {!done && unit.status === "IN_REPAIR" && (
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<TaskAltIcon />}
                        onClick={() => onCompleteTask(task)}
                        sx={{
                          bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" },
                          textTransform: "none", fontWeight: 600, fontSize: "0.7rem",
                        }}
                      >
                        Complete
                      </Button>
                      {canManage && (
                        <Tooltip title="Remove task">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteTask(task.id)}
                            sx={{ color: "text.disabled", "&:hover": { color: "#DC2626" } }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Completion evidence */}
                {done && (task.notes || attachments.length > 0) && (
                  <Box sx={{ mt: 1.5, ml: 4 }}>
                    {task.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {task.notes}
                      </Typography>
                    )}
                    <AttachmentGrid attachments={attachments} onPreview={onPreview} />
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
