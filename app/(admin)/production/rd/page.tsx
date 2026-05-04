'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface Project {
  id: string;
  projectNumber: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'CLOSED';
  createdBy: { id: string; name: string };
  closedAt: string | null;
  createdAt: string;
  pendingTasks: number;
  _count: { tasks: number; notes: number; materialRequisitions: number };
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function RDProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>(
    'ALL',
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rd/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setCreateError('Title is required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/rd/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error || 'Failed to create project');
        return;
      }
      const project = await res.json();
      setCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      router.push(`/production/rd/${project.id}`);
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCount = projects.filter((p) => p.status === 'OPEN').length;
  const closedCount = projects.filter((p) => p.status === 'CLOSED').length;

  return (
    <Box sx={{ py: 3 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}
          >
            {/* <Box sx={{ width: 40, height: 40, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScienceIcon sx={{ color: '#2563EB', fontSize: '1.3rem' }} />
            </Box> */}
            <Typography variant="h5" fontWeight={800}>
              Research & Development
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Track R&D projects, tasks, material usage, and research notes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchProjects} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* ── Stats strip ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          {
            label: 'Total Projects',
            value: projects.length,
            color: '#2563EB',
            bg: '#EFF6FF',
          },
          { label: 'Open', value: openCount, color: '#16A34A', bg: '#F0FDF4' },
          {
            label: 'Closed',
            value: closedCount,
            color: '#6B7280',
            bg: '#F3F4F6',
          },
        ].map((s) => (
          <Box
            key={s.label}
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: s.bg,
              border: `1px solid ${s.color}20`,
              borderRadius: 2,
              minWidth: 110,
            }}
          >
            <Typography
              fontWeight={800}
              sx={{ fontSize: '1.5rem', color: s.color, lineHeight: 1 }}
            >
              {s.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Filters ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ fontSize: '1.1rem', color: 'text.disabled' }}
                />
              </InputAdornment>
            ),
          }}
          sx={{ width: 260 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setStatusFilter(s)}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              size="small"
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor:
                  statusFilter === s
                    ? s === 'OPEN'
                      ? '#DCFCE7'
                      : s === 'CLOSED'
                        ? '#F3F4F6'
                        : '#DBEAFE'
                    : 'transparent',
                color:
                  statusFilter === s
                    ? s === 'OPEN'
                      ? '#166534'
                      : s === 'CLOSED'
                        ? '#374151'
                        : '#1E40AF'
                    : 'text.secondary',
                borderColor: statusFilter === s ? 'transparent' : 'divider',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── Project cards ── */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          {/* <ScienceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} /> */}
          <Typography color="text.secondary">
            {projects.length === 0
              ? 'No research projects yet. Create your first one.'
              : 'No projects match your search.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((p) => {
            const totalTasks = p._count.tasks;
            const doneTasks = totalTasks - p.pendingTasks;
            const progressPct =
              totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            const isOpen = p.status === 'OPEN';

            return (
              <Box
                key={p.id}
                onClick={() => router.push(`/production/rd/${p.id}`)}
                sx={{
                  p: 2.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: isOpen ? '#BFDBFE' : 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundImage: isOpen
                    ? 'linear-gradient(135deg, #EFF6FF40 0%, transparent 60%)'
                    : 'none',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderColor: '#93C5FD',
                  },
                }}
              >
                {/* Left: icon + info */}
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
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      bgcolor: isOpen ? '#EFF6FF' : '#F3F4F6',
                      border: `1px solid ${isOpen ? '#BFDBFE' : '#E5E7EB'}`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isOpen ? (
                      <ScienceIcon sx={{ color: '#2563EB' }} />
                    ) : (
                      <LockIcon sx={{ color: '#6B7280' }} />
                    )}
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
                      <Typography fontWeight={700} variant="subtitle1" noWrap>
                        {p.title}
                      </Typography>
                      <Chip
                        label={p.status}
                        size="small"
                        icon={
                          isOpen ? (
                            <CheckCircleIcon
                              sx={{ fontSize: '0.85rem !important' }}
                            />
                          ) : (
                            <LockIcon sx={{ fontSize: '0.85rem !important' }} />
                          )
                        }
                        sx={{
                          height: 20,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          bgcolor: isOpen ? '#DCFCE7' : '#F3F4F6',
                          color: isOpen ? '#166534' : '#6B7280',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {p.projectNumber}
                    </Typography>
                    {p.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.description}
                      </Typography>
                    )}

                    {/* Task progress bar */}
                    {totalTasks > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={progressPct}
                          sx={{
                            flex: 1,
                            height: 5,
                            borderRadius: 3,
                            bgcolor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor:
                                progressPct === 100 ? '#16A34A' : '#2563EB',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{ minWidth: 50, color: 'text.secondary' }}
                        >
                          {doneTasks}/{totalTasks} tasks
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Right: meta + action */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${p._count.materialRequisitions} MRQ${p._count.materialRequisitions !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip
                      label={`${p._count.notes} note${p._count.notes !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    By {p.createdBy.name} · {fmt(p.createdAt)}
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
                    sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/production/rd/${p.id}`);
                    }}
                  >
                    Open
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Create dialog ── */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewTitle('');
          setNewDesc('');
          setCreateError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New Research Project</DialogTitle>
        <DialogContent
          sx={{
            pt: '12px !important',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            label="Project Title"
            fullWidth
            size="small"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => {
              setCreateOpen(false);
              setNewTitle('');
              setNewDesc('');
              setCreateError('');
            }}
            color="inherit"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {creating ? 'Creating…' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
