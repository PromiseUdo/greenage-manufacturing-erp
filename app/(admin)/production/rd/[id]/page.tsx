'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
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
  Paper,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import { MaterialSearchPicker } from '@/app/components/shared/MaterialSearchPicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile {
  name: string;
  mimeType: string;
  url: string; // Cloudinary secure_url
  publicId: string; // Cloudinary public_id
  sizeBytes: number;
}

interface ResearchTask {
  id: string;
  name: string;
  status: 'PENDING' | 'DONE';
  assignedTo: { id: string; name: string } | null;
  completionDescription: string | null;
  attachments: AttachmentFile[] | null;
  completedAt: string | null;
  completedBy: { id: string; name: string } | null;
  createdAt: string;
}

interface ResearchNote {
  id: string;
  content: string;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface MRQItem {
  id: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
    currentStock: number;
  };
  quantityRequired: number;
  quantityIssued: number | null;
  status: string;
}

interface Requisition {
  id: string;
  requisitionNumber: string;
  status: string;
  notes: string | null;
  inventoryNotes: string | null;
  requestedBy: { id: string; name: string };
  fulfilledBy: { id: string; name: string } | null;
  fulfilledAt: string | null;
  items: MRQItem[];
  createdAt: string;
}

interface ResearchProject {
  id: string;
  projectNumber: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'CLOSED';
  createdBy: { id: string; name: string; email: string };
  closedBy: { id: string; name: string } | null;
  closedAt: string | null;
  reopenedBy: { id: string; name: string } | null;
  reopenedAt: string | null;
  tasks: ResearchTask[];
  notes: ResearchNote[];
  materialRequisitions: Requisition[];
  createdAt: string;
  updatedAt: string;
}

interface Worker {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtTs = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const MRQ_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#DBEAFE', text: '#1E40AF' },
  PARTIALLY_FULFILLED: { bg: '#FEF3C7', text: '#92400E' },
  FULFILLED: { bg: '#DCFCE7', text: '#166534' },
  CANCELLED: { bg: '#F3F4F6', text: '#6B7280' },
};

const ITEM_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#DBEAFE', text: '#1E40AF' },
  ISSUED: { bg: '#DCFCE7', text: '#166534' },
  PARTIAL: { bg: '#FEF3C7', text: '#92400E' },
  UNAVAILABLE: { bg: '#FEE2E2', text: '#991B1B' },
};

// ─── Cloudinary unsigned upload ───────────────────────────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<AttachmentFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', 'rd_tasks');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: form },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error?.message || 'Cloudinary upload failed');
  }

  const data = await res.json();
  return {
    name: file.name,
    mimeType: file.type,
    url: data.secure_url,
    publicId: data.public_id,
    sizeBytes: file.size,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Uploads files to Cloudinary and stores {name,mimeType,url,publicId,sizeBytes} */
function AttachmentPicker({
  files,
  onChange,
  disabled,
}: {
  files: AttachmentFile[];
  onChange: (f: AttachmentFile[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const pick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr('');
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    if (files.length + selected.length > 5) {
      setErr('Max 5 files');
      return;
    }
    const oversized = selected.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      setErr('Files must be under 10 MB');
      return;
    }

    setUploading(true);
    try {
      const uploaded: AttachmentFile[] = [];
      for (let i = 0; i < selected.length; i++) {
        setProgress(`Uploading ${i + 1} of ${selected.length}…`);
        uploaded.push(await uploadToCloudinary(selected[i]));
      }
      onChange([...files, ...uploaded]);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled || uploading}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={
          uploading ? <CircularProgress size={14} /> : <AttachFileIcon />
        }
        onClick={pick}
        disabled={disabled || uploading || files.length >= 5}
        sx={{
          textTransform: 'none',
          borderStyle: 'dashed',
          borderWidth: 1.5,
          '&:hover': { borderStyle: 'dashed', borderWidth: 1.5 },
        }}
        fullWidth
      >
        {uploading
          ? progress
          : files.length >= 5
            ? 'Max files reached'
            : 'Attach file (PDF, JPG, PNG)'}
      </Button>
      <Typography variant="caption" color="text.secondary">
        Max 5 files · 10 MB each · Stored securely in cloud
      </Typography>
      {err && (
        <Alert severity="error" sx={{ mt: 1, py: 0 }}>
          {err}
        </Alert>
      )}
      {files.length > 0 && (
        <Box
          sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}
        >
          {files.map((f, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
              }}
            >
              {f.mimeType.startsWith('image/') ? (
                <ImageIcon sx={{ color: '#2563EB', fontSize: '1.1rem' }} />
              ) : (
                <PictureAsPdf sx={{ color: '#DC2626', fontSize: '1.1rem' }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name}
              </Typography>
              <Chip
                label={`${(f.sizeBytes / 1024).toFixed(0)} KB`}
                size="small"
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
              <IconButton
                size="small"
                onClick={() => remove(i)}
                disabled={uploading}
                sx={{ color: 'error.main' }}
              >
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RDProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;

  const [project, setProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Task state ──
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [doneDialogTask, setDoneDialogTask] = useState<ResearchTask | null>(
    null,
  );
  const [doneDesc, setDoneDesc] = useState('');
  const [doneFiles, setDoneFiles] = useState<AttachmentFile[]>([]);
  const [markingDone, setMarkingDone] = useState(false);
  const [doneError, setDoneError] = useState('');
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // ── Note state ──
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [editNote, setEditNote] = useState<ResearchNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // ── MRQ state ──
  const [mrqDialogOpen, setMrqDialogOpen] = useState(false);
  const [mrqItems, setMrqItems] = useState<
    {
      materialId: string;
      name: string;
      unit: string;
      currentStock: number;
      quantityRequired: number;
    }[]
  >([]);
  const [mrqNotes, setMrqNotes] = useState('');
  const [mrqError, setMrqError] = useState('');
  const [raisingMrq, setRaisingMrq] = useState(false);
  const [expandedMrq, setExpandedMrq] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/rd/projects/${projectId}`);
      if (!res.ok) {
        router.push('/production/rd');
        return;
      }
      setProject(await res.json());
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/users/workers');
      const data = await res.json();
      setWorkers(data.workers || data || []);
    } catch {
      // silently handle
    }
  }, []);

  useEffect(() => {
    fetchProject();
    fetchWorkers();
  }, [fetchProject, fetchWorkers]);

  // ── Project actions ────────────────────────────────────────────────────────

  const toggleStatus = async () => {
    if (!project) return;
    setActionError('');
    setActionLoading(true);
    try {
      const action = project.status === 'OPEN' ? 'close' : 'reopen';
      const res = await fetch(`/api/rd/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Action failed');
        return;
      }
      setProject(data);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/rd/projects/${projectId}/pdf`);
      if (!res.ok) {
        alert('Failed to generate PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.projectNumber}-history.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Tasks ──────────────────────────────────────────────────────────────────

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      setTaskError('Task name is required');
      return;
    }
    setAddingTask(true);
    setTaskError('');
    try {
      const res = await fetch(`/api/rd/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          assignedToId: taskAssignee || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setTaskError(d.error || 'Failed');
        return;
      }
      setAddTaskOpen(false);
      setTaskName('');
      setTaskAssignee('');
      fetchProject();
    } finally {
      setAddingTask(false);
    }
  };

  const handleMarkDone = async () => {
    if (!doneDialogTask) return;
    if (doneFiles.length === 0) {
      setDoneError('At least one file attachment is required');
      return;
    }
    setMarkingDone(true);
    setDoneError('');
    try {
      const res = await fetch(
        `/api/rd/projects/${projectId}/tasks/${doneDialogTask.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            completionDescription: doneDesc,
            attachments: doneFiles,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        setDoneError(d.error || 'Failed');
        return;
      }
      setDoneDialogTask(null);
      setDoneDesc('');
      setDoneFiles([]);
      fetchProject();
    } finally {
      setMarkingDone(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/rd/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      setDeleteTaskId(null);
      fetchProject();
    } catch {
      // silently handle
    }
  };

  // ── Notes ──────────────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      setNoteError('Note content is required');
      return;
    }
    setAddingNote(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/rd/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      if (!res.ok) {
        const d = await res.json();
        setNoteError(d.error || 'Failed');
        return;
      }
      setNoteContent('');
      fetchProject();
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditNote = async () => {
    if (!editNote || !editNoteContent.trim()) return;
    try {
      await fetch(`/api/rd/projects/${projectId}/notes/${editNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editNoteContent }),
      });
      setEditNote(null);
      fetchProject();
    } catch {
      // silently handle
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/rd/projects/${projectId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      setDeleteNoteId(null);
      fetchProject();
    } catch {
      // silently handle
    }
  };

  // ── MRQ ────────────────────────────────────────────────────────────────────

  const handleAddMaterial = (mat: any) => {
    if (mrqItems.find((i) => i.materialId === mat.id)) return;
    setMrqItems((prev) => [
      ...prev,
      {
        materialId: mat.id,
        name: mat.name,
        unit: mat.unit,
        currentStock: mat.currentStock,
        quantityRequired: 1,
      },
    ]);
  };

  const handleRaiseMrq = async () => {
    if (mrqItems.length === 0) {
      setMrqError('Add at least one material');
      return;
    }
    const invalid = mrqItems.filter(
      (i) => !i.quantityRequired || i.quantityRequired <= 0,
    );
    if (invalid.length) {
      setMrqError('All quantities must be greater than 0');
      return;
    }
    setRaisingMrq(true);
    setMrqError('');
    try {
      const res = await fetch(
        `/api/rd/projects/${projectId}/material-requisition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: mrqItems.map((i) => ({
              materialId: i.materialId,
              quantityRequired: i.quantityRequired,
            })),
            notes: mrqNotes,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        setMrqError(d.error || 'Failed');
        return;
      }
      setMrqDialogOpen(false);
      setMrqItems([]);
      setMrqNotes('');
      fetchProject();
    } finally {
      setRaisingMrq(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ py: 3 }}>
        <Skeleton width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton height={120} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!project) return null;

  const isOpen = project.status === 'OPEN';
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
  const progressPct =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const canClose = isOpen && project.tasks.every((t) => t.status === 'DONE');

  return (
    <Box sx={{ py: 3 }}>
      {/* ── Breadcrumb ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={() => router.push('/production/rd')}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          R&amp;D Projects /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {project.projectNumber}
        </Typography>
      </Box>

      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setActionError('')}
        >
          {actionError}
        </Alert>
      )}

      {/* ── Header card ── */}
      <Box
        sx={{
          p: 2.5,
          mb: 0,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: isOpen ? '#BFDBFE' : 'divider',
          borderRadius: '12px 12px 0 0',
          backgroundImage: isOpen
            ? 'linear-gradient(135deg, #EFF6FF60 0%, transparent 60%)'
            : 'none',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* <Box
            sx={{
              width: 52,
              height: 52,
              bgcolor: isOpen ? '#EFF6FF' : '#F3F4F6',
              border: `1px solid ${isOpen ? '#BFDBFE' : '#E5E7EB'}`,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ScienceIcon sx={{ color: isOpen ? '#2563EB' : '#6B7280' }} />
          </Box> */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 0.5,
              }}
            >
              <Typography variant="h5" fontWeight={800}>
                {project.title}
              </Typography>
              <Chip
                label={project.status}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: isOpen ? '#DCFCE7' : '#F3F4F6',
                  color: isOpen ? '#166534' : '#6B7280',
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', mb: 0.5 }}
            >
              {project.projectNumber}
            </Typography>
            {project.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {project.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Created by <strong>{project.createdBy.name}</strong> on{' '}
                {fmt(project.createdAt)}
              </Typography>
              {project.closedAt && (
                <Typography variant="caption" color="text.secondary">
                  Closed by <strong>{project.closedBy?.name}</strong> on{' '}
                  {fmtTs(project.closedAt)}
                </Typography>
              )}
              {project.reopenedAt && (
                <Typography variant="caption" color="text.secondary">
                  Reopened by <strong>{project.reopenedBy?.name}</strong> on{' '}
                  {fmtTs(project.reopenedAt)}
                </Typography>
              )}
            </Box>
            {totalTasks > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  maxWidth: 340,
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: progressPct === 100 ? '#16A34A' : '#2563EB',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ minWidth: 60, color: 'text.secondary' }}
                >
                  {doneTasks}/{totalTasks} tasks
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Action buttons */}
        <Box
          sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}
        >
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchProject}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              pdfLoading ? <CircularProgress size={14} /> : <PictureAsPdfIcon />
            }
            onClick={downloadPdf}
            disabled={pdfLoading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Export PDF
          </Button>
          {isOpen ? (
            <Tooltip
              title={
                !canClose ? 'All tasks must be completed before closing' : ''
              }
            >
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={
                    actionLoading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <LockIcon />
                    )
                  }
                  onClick={toggleStatus}
                  disabled={actionLoading || !canClose}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: '#374151',
                    '&:hover': { bgcolor: '#1F2937' },
                  }}
                >
                  Close Project
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={
                actionLoading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <LockOpenIcon />
                )
              }
              onClick={toggleStatus}
              disabled={actionLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: '#2563EB',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Reopen Project
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Tab bar ── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '0 0 12px 12px',
          mb: 3,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 48,
            },
            '& .MuiTabs-indicator': { bgcolor: '#2563EB' },
            '& .Mui-selected': { color: '#2563EB !important' },
          }}
        >
          <Tab label={`Tasks (${project.tasks.length})`} />
          <Tab label={`Materials (${project.materialRequisitions.length})`} />
          <Tab label={`Notes (${project.notes.length})`} />
        </Tabs>
      </Box>

      {/* ════════════════════════════════════════════════════════════════
          TAB 0 — TASKS
      ════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddTaskOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: '#2563EB',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Add Task
            </Button>
          </Box>

          {project.tasks.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No tasks yet. Add the first task for this project.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {project.tasks.map((task) => {
                const isDone = task.status === 'DONE';
                return (
                  <Paper
                    key={task.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderRadius: 2,
                      borderColor: isDone ? '#BBF7D0' : '#BFDBFE',
                      bgcolor: isDone ? '#F0FDF4' : '#EFF6FF',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Status icon */}
                      <Box sx={{ mt: 0.3, flexShrink: 0 }}>
                        {isDone ? (
                          <CheckCircleIcon
                            sx={{ color: '#16A34A', fontSize: '1.4rem' }}
                          />
                        ) : (
                          <RadioButtonUncheckedIcon
                            sx={{ color: '#93C5FD', fontSize: '1.4rem' }}
                          />
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
                            fontWeight={700}
                            sx={{
                              textDecoration: isDone ? 'line-through' : 'none',
                              color: isDone ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {task.name}
                          </Typography>
                          <Chip
                            label={isDone ? 'Done' : 'Pending'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: isDone ? '#DCFCE7' : '#DBEAFE',
                              color: isDone ? '#166534' : '#1E40AF',
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            mt: 0.5,
                          }}
                        >
                          {task.assignedTo && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Assigned to:{' '}
                              <strong>{task.assignedTo.name}</strong>
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Created: {fmt(task.createdAt)}
                          </Typography>
                          {isDone && task.completedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Completed: {fmtTs(task.completedAt)} by{' '}
                              <strong>{task.completedBy?.name}</strong>
                            </Typography>
                          )}
                        </Box>

                        {isDone && task.completionDescription && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, fontStyle: 'italic' }}
                          >
                            {task.completionDescription}
                          </Typography>
                        )}

                        {/* Attachments */}
                        {isDone &&
                          task.attachments &&
                          task.attachments.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              {/* Inline image previews */}
                              {task.attachments.filter((a) =>
                                a.mimeType?.startsWith('image/'),
                              ).length > 0 && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    mb: 1,
                                  }}
                                >
                                  {task.attachments
                                    .filter((a) =>
                                      a.mimeType?.startsWith('image/'),
                                    )
                                    .map((a, i) => (
                                      <Box
                                        key={i}
                                        component="a"
                                        href={a.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ display: 'block', flexShrink: 0 }}
                                      >
                                        <Box
                                          component="img"
                                          src={a.url}
                                          alt={a.name}
                                          sx={{
                                            height: 72,
                                            width: 'auto',
                                            maxWidth: 120,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.15s',
                                            '&:hover': { opacity: 0.85 },
                                          }}
                                        />
                                      </Box>
                                    ))}
                                </Box>
                              )}
                              {/* Document chips */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {task.attachments
                                  .filter(
                                    (a) => !a.mimeType?.startsWith('image/'),
                                  )
                                  .map((a, i) => (
                                    <Chip
                                      key={i}
                                      size="small"
                                      icon={
                                        <PictureAsPdf
                                          sx={{ fontSize: '0.8rem !important' }}
                                        />
                                      }
                                      label={a.name}
                                      component="a"
                                      href={a.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      clickable
                                      sx={{ fontSize: '0.7rem', maxWidth: 200 }}
                                    />
                                  ))}
                              </Box>
                            </Box>
                          )}
                      </Box>

                      {/* Task actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        {!isDone && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => {
                              setDoneDialogTask(task);
                              setDoneDesc('');
                              setDoneFiles([]);
                              setDoneError('');
                            }}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              bgcolor: '#16A34A',
                              '&:hover': { bgcolor: '#15803D' },
                              fontSize: '0.78rem',
                            }}
                          >
                            Mark Done
                          </Button>
                        )}
                        <Tooltip title="Delete task">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTaskId(task.id)}
                            sx={{
                              color: 'text.disabled',
                              '&:hover': { color: 'error.main' },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 1 — MATERIALS
      ════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setMrqDialogOpen(true);
                setMrqItems([]);
                setMrqNotes('');
                setMrqError('');
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: '#2563EB',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Raise Material Request
            </Button>
          </Box>

          {project.materialRequisitions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No material requisitions yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {project.materialRequisitions.map((req) => {
                const sc =
                  MRQ_STATUS_COLORS[req.status] ?? MRQ_STATUS_COLORS.PENDING;
                const isExpanded = expandedMrq === req.id;
                const issuedCount = req.items.filter(
                  (i) => i.status === 'ISSUED',
                ).length;
                const pct =
                  req.items.length > 0
                    ? Math.round((issuedCount / req.items.length) * 100)
                    : 0;

                return (
                  <Paper
                    key={req.id}
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {/* MRQ header row */}
                    <Box
                      sx={{
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => setExpandedMrq(isExpanded ? null : req.id)}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            fontWeight={700}
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {req.requisitionNumber}
                          </Typography>
                          <Chip
                            label={req.status.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: sc.bg,
                              color: sc.text,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {req.items.length} material
                          {req.items.length !== 1 ? 's' : ''}
                          {' · '}Raised by {req.requestedBy.name} on{' '}
                          {fmtTs(req.createdAt)}
                          {req.fulfilledBy &&
                            ` · Fulfilled by ${req.fulfilledBy.name}`}
                        </Typography>
                        {req.items.length > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 0.75,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: '#E5E7EB',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 2,
                                  bgcolor: pct === 100 ? '#16A34A' : '#2563EB',
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ minWidth: 60, color: 'text.secondary' }}
                            >
                              {issuedCount}/{req.items.length} issued
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {isExpanded ? '▲' : '▼'}
                      </Typography>
                    </Box>

                    {/* MRQ expanded items */}
                    {isExpanded && (
                      <Box
                        sx={{
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          p: 2,
                        }}
                      >
                        {req.notes && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1.5, fontStyle: 'italic' }}
                          >
                            Notes: {req.notes}
                          </Typography>
                        )}
                        <Box
                          component="table"
                          sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Box component="thead">
                            <Box
                              component="tr"
                              sx={{
                                '& th': {
                                  textAlign: 'left',
                                  fontWeight: 700,
                                  py: 0.75,
                                  px: 1,
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                },
                              }}
                            >
                              <Box component="th">Material</Box>
                              <Box component="th">Part No.</Box>
                              <Box component="th" sx={{ textAlign: 'center' }}>
                                Required
                              </Box>
                              <Box component="th" sx={{ textAlign: 'center' }}>
                                Issued
                              </Box>
                              <Box component="th" sx={{ textAlign: 'center' }}>
                                Status
                              </Box>
                            </Box>
                          </Box>
                          <Box component="tbody">
                            {req.items.map((item) => {
                              const ic =
                                ITEM_STATUS_COLORS[item.status] ??
                                ITEM_STATUS_COLORS.PENDING;
                              return (
                                <Box
                                  component="tr"
                                  key={item.id}
                                  sx={{
                                    '& td': {
                                      py: 0.75,
                                      px: 1,
                                      borderBottom: '1px solid',
                                      borderColor: 'divider',
                                    },
                                    '&:last-child td': { borderBottom: 0 },
                                  }}
                                >
                                  <Box component="td">
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      {item.material.name}
                                    </Typography>
                                  </Box>
                                  <Box component="td">
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {item.material.partNumber || '—'}
                                    </Typography>
                                  </Box>
                                  <Box
                                    component="td"
                                    sx={{ textAlign: 'center' }}
                                  >
                                    <Typography variant="body2">
                                      {item.quantityRequired}{' '}
                                      {item.material.unit}
                                    </Typography>
                                  </Box>
                                  <Box
                                    component="td"
                                    sx={{ textAlign: 'center' }}
                                  >
                                    <Typography variant="body2">
                                      {item.quantityIssued != null
                                        ? `${item.quantityIssued} ${item.material.unit}`
                                        : '—'}
                                    </Typography>
                                  </Box>
                                  <Box
                                    component="td"
                                    sx={{ textAlign: 'center' }}
                                  >
                                    <Chip
                                      label={item.status}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        bgcolor: ic.bg,
                                        color: ic.text,
                                      }}
                                    />
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                        {req.inventoryNotes && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            Inventory notes: {req.inventoryNotes}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2 — NOTES
      ════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          {/* Add note input */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Add Research Note
            </Typography>
            {noteError && (
              <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
                {noteError}
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Write your research note here…"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="contained"
                disabled={addingNote || !noteContent.trim()}
                onClick={handleAddNote}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: '#2563EB',
                  '&:hover': { bgcolor: '#1D4ED8' },
                }}
              >
                {addingNote ? 'Saving…' : 'Add Note'}
              </Button>
            </Box>
          </Paper>

          {/* Notes list */}
          {project.notes.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No research notes yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {project.notes.map((note) => (
                <Paper
                  key={note.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Typography variant="caption" fontWeight={700}>
                          {note.author.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtTs(note.createdAt)}
                        </Typography>
                        {note.updatedAt !== note.createdAt && (
                          <Typography variant="caption" color="text.disabled">
                            (edited)
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {note.content}
                      </Typography>
                    </Box>
                    {note.author.id === session?.user?.id && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditNote(note);
                              setEditNoteContent(note.content);
                            }}
                          >
                            <EditIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteNoteId(note.id)}
                            sx={{
                              color: 'text.disabled',
                              '&:hover': { color: 'error.main' },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════════════════════ */}

      {/* Add task */}
      <Dialog
        open={addTaskOpen}
        onClose={() => {
          setAddTaskOpen(false);
          setTaskName('');
          setTaskAssignee('');
          setTaskError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add Task</DialogTitle>
        <DialogContent
          sx={{
            pt: '12px !important',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {taskError && <Alert severity="error">{taskError}</Alert>}
          <TextField
            label="Task Name"
            fullWidth
            size="small"
            required
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Assign To (optional)</InputLabel>
            <Select
              label="Assign To (optional)"
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {workers.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => {
              setAddTaskOpen(false);
              setTaskName('');
              setTaskAssignee('');
              setTaskError('');
            }}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTask}
            variant="contained"
            disabled={addingTask}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {addingTask ? 'Adding…' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark task done */}
      <Dialog
        open={!!doneDialogTask}
        onClose={() => {
          setDoneDialogTask(null);
          setDoneDesc('');
          setDoneFiles([]);
          setDoneError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Mark Task as Done</DialogTitle>
        <DialogContent
          sx={{
            pt: '12px !important',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {doneDialogTask && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#F8FAFC',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                {doneDialogTask.name}
              </Typography>
            </Box>
          )}
          {doneError && <Alert severity="error">{doneError}</Alert>}
          <TextField
            label="Completion notes (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={doneDesc}
            onChange={(e) => setDoneDesc(e.target.value)}
            placeholder="Describe the outcome, findings, or result…"
          />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Attach File{' '}
              <Typography component="span" sx={{ color: 'error.main' }}>
                *
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              A file attachment is required to mark a task as done (photo of
              result, test report, document, etc.)
            </Typography>
            <AttachmentPicker files={doneFiles} onChange={setDoneFiles} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => {
              setDoneDialogTask(null);
              setDoneDesc('');
              setDoneFiles([]);
              setDoneError('');
            }}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkDone}
            variant="contained"
            disabled={markingDone || doneFiles.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
            }}
          >
            {markingDone ? (
              <CircularProgress size={14} color="inherit" sx={{ mr: 0.5 }} />
            ) : null}
            {markingDone ? 'Saving…' : 'Confirm Done'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete task confirm */}
      <Dialog
        open={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Task?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteTaskId(null)}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit note */}
      <Dialog
        open={!!editNote}
        onClose={() => setEditNote(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Note</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            size="small"
            value={editNoteContent}
            onChange={(e) => setEditNoteContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setEditNote(null)}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditNote}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete note confirm */}
      <Dialog
        open={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Note?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteNoteId(null)}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Raise MRQ dialog */}
      <Dialog
        open={mrqDialogOpen}
        onClose={() => setMrqDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Raise Material Request
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {mrqError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mrqError}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <MaterialSearchPicker
              onAdd={handleAddMaterial}
              alreadyAdded={mrqItems.map((i) => i.materialId)}
            />
          </Box>

          {mrqItems.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Selected Materials
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {mrqItems.map((item, idx) => (
                  <Box
                    key={item.materialId}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stock: {item.currentStock} {item.unit}
                      </Typography>
                    </Box>
                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={item.quantityRequired}
                      onChange={(e) => {
                        const updated = [...mrqItems];
                        updated[idx].quantityRequired = Number(e.target.value);
                        setMrqItems(updated);
                      }}
                      inputProps={{ min: 0.01, step: 0.01 }}
                      sx={{ width: 100 }}
                    />
                    <Chip label={item.unit} size="small" />
                    <IconButton
                      size="small"
                      onClick={() =>
                        setMrqItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      sx={{ color: 'error.main' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="Notes (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={mrqNotes}
            onChange={(e) => setMrqNotes(e.target.value)}
            placeholder="Urgency, purpose, special handling…"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setMrqDialogOpen(false)}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRaiseMrq}
            variant="contained"
            disabled={raisingMrq || mrqItems.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {raisingMrq ? (
              <CircularProgress size={14} color="inherit" sx={{ mr: 0.5 }} />
            ) : null}
            {raisingMrq ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
