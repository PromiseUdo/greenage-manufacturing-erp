'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import {
  Edit as EditIcon,
  KeyboardReturn as ReturnIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon,
  CallMade as IssuedIcon,
  CallReceived as ReturnedIcon,
  Build as MaintenanceIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

interface ToolMaintenance {
  id: string;
  maintenanceType: string;
  description?: string;
  performedBy: string;
  startDate: string;
  completedDate?: string;
  cost?: number;
  partsReplaced?: string;
  notes?: string;
}

interface Tool {
  id: string;
  toolId: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  description?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  location?: string;
  currentHolder?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
  updatedAt: string;
  toolGroup?: {
    id: string;
    name: string;
    groupNumber: string;
    totalQuantity: number;
    availableQuantity: number;
  };
  maintenanceHistory?: ToolMaintenance[];
  _count?: { lendings: number; maintenanceHistory: number };
}

interface Lending {
  id: string;
  issuedTo: string;
  department?: string;
  purpose?: string;
  projectName?: string;
  issuedBy: string;
  issuedAt: string;
  expectedReturn?: string;
  returnedAt?: string;
  returnedTo?: string;
  returnCondition?: string;
  returnNotes?: string;
  status: string;
}

type EventType = 'ISSUED' | 'RETURNED' | 'MAINTENANCE';
type HistoryFilter = 'ALL' | EventType;

interface ToolEvent {
  type: EventType;
  date: string;
  actor: string;
  recipient: string;
  department: string;
  purpose: string;
  condition: string;
  notes: string;
  lendingId?: string;
  maintenanceType?: string;
  cost?: number;
  statusAfter: string;
}

interface HistorySummary {
  totalIssued: number;
  totalReturned: number;
  totalMaintenance: number;
  currentlyOut: number;
}

// ── Styled components ──────────────────────────────────────────────────────

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: '0.4px',
    padding: '10px 14px',
    borderBottom: 'none',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    padding: '12px 14px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.15s ease',
  },
  '&:last-child td': { borderBottom: 0 },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bgcolor: string; color: string }> = {
  AVAILABLE:         { bgcolor: '#e8f5e9', color: '#2e7d32' },
  IN_USE:            { bgcolor: '#fff3e0', color: '#ed6c02' },
  UNDER_MAINTENANCE: { bgcolor: '#e3f2fd', color: '#1976d2' },
  RESERVED:          { bgcolor: '#f3e5f5', color: '#9c27b0' },
  DAMAGED:           { bgcolor: '#ffebee', color: '#d32f2f' },
  RETIRED:           { bgcolor: '#f5f5f5', color: '#757575' },
};

const CONDITION_COLOR: Record<string, string> = {
  EXCELLENT:    '#2e7d32',
  GOOD:         '#388e3c',
  FAIR:         '#ed6c02',
  POOR:         '#d32f2f',
  NEEDS_REPAIR: '#d32f2f',
};

const LENDING_STATUS_STYLES: Record<string, { bgcolor: string; color: string }> = {
  RETURNED: { bgcolor: '#e8f5e9', color: '#2e7d32' },
  ISSUED:   { bgcolor: '#fff3e0', color: '#ed6c02' },
  OVERDUE:  { bgcolor: '#ffebee', color: '#d32f2f' },
  LOST:     { bgcolor: '#fce4ec', color: '#880e4f' },
  DAMAGED:  { bgcolor: '#ffebee', color: '#d32f2f' },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n);

// ── StatCard ───────────────────────────────────────────────────────────────

function StatCard({
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
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        flex: 1,
        minWidth: 130,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, color: color || 'text.primary' }}>
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

// ── InfoRow ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ color: color || 'text.primary', textAlign: 'right', ml: 2 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

// ── Event type config ──────────────────────────────────────────────────────

const EVENT_CONFIG = {
  ISSUED: {
    label: 'Issued',
    bgcolor: '#fff7ed',
    color: '#c2410c',
    Icon: IssuedIcon,
  },
  RETURNED: {
    label: 'Returned',
    bgcolor: '#f0fdf4',
    color: '#16a34a',
    Icon: ReturnedIcon,
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bgcolor: '#eff6ff',
    color: '#2563eb',
    Icon: MaintenanceIcon,
  },
} as const;

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ToolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs
  const [tab, setTab] = useState(0);

  // History
  const [events, setEvents] = useState<ToolEvent[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<HistoryFilter>('ALL');
  const [histPage, setHistPage] = useState(0);
  const [histRowsPerPage, setHistRowsPerPage] = useState(20);

  // Datasheet
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchToolDetails();
  }, [toolId]);

  const activeLending = lendings.find((l) => l.status === 'ISSUED');

  const fetchToolDetails = async () => {
    try {
      const [toolRes, lendingsRes] = await Promise.all([
        fetch(`/api/inventory/tools/${toolId}`),
        fetch(`/api/inventory/tools/lending?toolId=${toolId}&limit=5`),
      ]);
      if (!toolRes.ok) throw new Error('Failed to fetch tool');
      setTool(await toolRes.json());
      const lData = await lendingsRes.json();
      setLendings(lData.lendings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tool details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!toolId || historyFetched) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/inventory/tools/${toolId}/history`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setSummary(data.summary);
        setHistoryFetched(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [toolId, historyFetched]);

  useEffect(() => {
    if (tab === 1) fetchHistory();
  }, [tab, fetchHistory]);

  const handleDownloadDatasheet = async () => {
    if (!toolId) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/inventory/tools/${toolId}/datasheet`);
      if (!res.ok) throw new Error('Failed to generate datasheet');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(tool?.toolId ?? 'tool').replace(/[^a-zA-Z0-9]/g, '-')}-datasheet.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tool) {
    return <Alert severity="error">{error || 'Tool not found'}</Alert>;
  }

  const statusStyle = STATUS_STYLES[tool.status] ?? { bgcolor: '#f5f5f5', color: '#757575' };
  const totalEvents = (tool._count?.lendings ?? 0) + (tool._count?.maintenanceHistory ?? 0);

  const filteredEvents = events.filter(
    (e) => typeFilter === 'ALL' || e.type === typeFilter,
  );
  const pagedEvents = filteredEvents.slice(
    histPage * histRowsPerPage,
    histPage * histRowsPerPage + histRowsPerPage,
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Back ── */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => router.push('/inventory/tools')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back to Tools
      </Button>

      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {tool.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={tool.toolId}
              size="small"
              sx={{ fontWeight: 600, bgcolor: '#F1F5F9', color: '#0F172A' }}
            />
            <Chip
              label={tool.category.replace(/_/g, ' ')}
              size="small"
              sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 500 }}
            />
            <Chip
              label={tool.status.replace(/_/g, ' ')}
              size="small"
              sx={{ fontWeight: 600, ...statusStyle }}
            />
            <Chip
              label={tool.condition.replace(/_/g, ' ')}
              size="small"
              sx={{ fontWeight: 500, color: CONDITION_COLOR[tool.condition] || '#757575' }}
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {tool.status === 'IN_USE' && (
            <Button
              variant="contained"
              startIcon={<ReturnIcon />}
              disabled={!activeLending}
              onClick={() => {
                if (!activeLending) return;
                router.push(`/inventory/tools/lending/${activeLending.id}/return`);
              }}
              sx={{ bgcolor: '#2e7d32', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#1b5e20' } }}
            >
              Return Tool
            </Button>
          )}
          {tool.status === 'AVAILABLE' && (
            <Button
              variant="contained"
              onClick={() => router.push('/inventory/tools/lending/new')}
              sx={{ bgcolor: '#0F172A', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#1e293b' } }}
            >
              Issue Tool
            </Button>
          )}
          <Tooltip title="Download PDF datasheet for this tool">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadDatasheet}
              disabled={downloading}
              sx={{
                borderColor: '#0F172A',
                color: '#0F172A',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#0F172A' },
              }}
            >
              {downloading ? 'Generating...' : 'Download Datasheet'}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/inventory/tools/${toolId}/edit`)}
            sx={{
              borderColor: '#64748B',
              color: '#64748B',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#0F172A', color: '#0F172A' },
            }}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard
          label="Status"
          value={tool.status.replace(/_/g, ' ')}
          color={statusStyle.color}
        />
        <StatCard
          label="Condition"
          value={tool.condition.replace(/_/g, ' ')}
          color={CONDITION_COLOR[tool.condition]}
        />
        <StatCard
          label="Times Issued"
          value={String(tool._count?.lendings ?? 0)}
          sub="total lendings"
        />
        <StatCard
          label="Maintenance Events"
          value={String(tool._count?.maintenanceHistory ?? 0)}
          sub="recorded"
        />
        {tool.purchaseCost && (
          <StatCard
            label="Purchase Cost"
            value={formatCurrency(tool.purchaseCost)}
          />
        )}
        {tool.currentHolder && (
          <StatCard
            label="Current Holder"
            value={tool.currentHolder}
            color="#ed6c02"
          />
        )}
      </Box>

      {/* ── Tabs ── */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            bgcolor: '#FAFAFA',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 14 },
            '& .Mui-selected': { color: '#0F172A' },
            '& .MuiTabs-indicator': { bgcolor: '#0F172A' },
          }}
        >
          <Tab label="Overview" />
          <Tab label={`History${totalEvents > 0 ? ` (${totalEvents})` : ''}`} />
        </Tabs>

        {/* ── Overview tab ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Tool details */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                  Tool Information
                </Typography>
                <InfoRow label="Tool ID" value={tool.toolId} />
                <InfoRow label="Category" value={tool.category.replace(/_/g, ' ')} />
                <InfoRow
                  label="Condition"
                  value={tool.condition.replace(/_/g, ' ')}
                  color={CONDITION_COLOR[tool.condition]}
                />
                {tool.description && <InfoRow label="Description" value={tool.description} />}
                {tool.serialNumber && <InfoRow label="Serial Number" value={tool.serialNumber} />}
                {tool.manufacturer && <InfoRow label="Manufacturer" value={tool.manufacturer} />}
                {tool.location && <InfoRow label="Storage Location" value={tool.location} />}
                {tool.currentHolder && (
                  <InfoRow label="Current Holder" value={tool.currentHolder} color="#ed6c02" />
                )}
                {tool.toolGroup && (
                  <InfoRow
                    label="Tool Group"
                    value={`${tool.toolGroup.name} — ${tool.toolGroup.availableQuantity}/${tool.toolGroup.totalQuantity} available`}
                  />
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                  Purchase Details
                </Typography>
                <InfoRow
                  label="Purchase Date"
                  value={tool.purchaseDate ? format(new Date(tool.purchaseDate), 'dd MMM yyyy') : '—'}
                />
                <InfoRow
                  label="Purchase Cost"
                  value={tool.purchaseCost ? formatCurrency(tool.purchaseCost) : '—'}
                />
                <Divider sx={{ my: 2 }} />
                <InfoRow label="Date Added" value={format(new Date(tool.createdAt), 'dd MMM yyyy, h:mm a')} />
                <InfoRow label="Last Updated" value={format(new Date(tool.updatedAt), 'dd MMM yyyy, h:mm a')} />
                {tool.lastMaintenance && (
                  <InfoRow label="Last Maintenance" value={format(new Date(tool.lastMaintenance), 'dd MMM yyyy')} />
                )}
                {tool.nextMaintenance && (
                  <InfoRow
                    label="Next Maintenance"
                    value={format(new Date(tool.nextMaintenance), 'dd MMM yyyy')}
                    color={new Date(tool.nextMaintenance) < new Date() ? '#d32f2f' : '#2e7d32'}
                  />
                )}
              </Grid>

              {/* Recent lending + recent maintenance */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                  Recent Lending Activity
                </Typography>
                {lendings.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No lending history yet
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Issued To</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lendings.slice(0, 5).map((l) => {
                          const ls = LENDING_STATUS_STYLES[l.status] ?? { bgcolor: '#f5f5f5', color: '#757575' };
                          return (
                            <TableRow key={l.id}>
                              <TableCell sx={{ fontSize: 12 }}>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: 12 }}>
                                  {l.issuedTo}
                                </Typography>
                                {l.department && (
                                  <Typography variant="caption" color="text.secondary">
                                    {l.department}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ fontSize: 12 }}>
                                {format(new Date(l.issuedAt), 'dd MMM yy')}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={l.status}
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: 10, ...ls }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tool.maintenanceHistory && tool.maintenanceHistory.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                      Recent Maintenance
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Performed By</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tool.maintenanceHistory.slice(0, 3).map((m) => (
                            <TableRow key={m.id}>
                              <TableCell sx={{ fontSize: 12 }}>
                                {m.maintenanceType.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{m.performedBy}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>
                                {format(new Date(m.startDate), 'dd MMM yy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── History tab ── */}
        {tab === 1 && (
          <Box>
            {/* Summary bar */}
            {summary && (
              <Box sx={{ display: 'flex', gap: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                {[
                  { label: 'Times Issued', value: summary.totalIssued, color: '#c2410c', bg: '#fff7ed' },
                  { label: 'Times Returned', value: summary.totalReturned, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Maintenance Events', value: summary.totalMaintenance, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Currently Out', value: summary.currentlyOut, color: summary.currentlyOut > 0 ? '#ed6c02' : '#64748b', bg: '#f8fafc' },
                ].map((s, i, arr) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      p: 2.5,
                      textAlign: 'center',
                      bgcolor: s.bg,
                      borderRight: i < arr.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}
                    >
                      {s.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>
                      {s.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Filter chips */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#FAFAFA',
                flexWrap: 'wrap',
              }}
            >
              <FilterIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Show:
              </Typography>
              {(
                [
                  { key: 'ALL', label: 'All Events' },
                  { key: 'ISSUED', label: 'Issued' },
                  { key: 'RETURNED', label: 'Returned' },
                  { key: 'MAINTENANCE', label: 'Maintenance' },
                ] as { key: HistoryFilter; label: string }[]
              ).map(({ key, label }) => {
                const active = typeFilter === key;
                const cfg = key !== 'ALL' ? EVENT_CONFIG[key] : null;
                return (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    onClick={() => { setTypeFilter(key); setHistPage(0); }}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: active
                        ? key === 'ALL' ? '#0F172A' : cfg!.bgcolor
                        : '#F1F5F9',
                      color: active
                        ? key === 'ALL' ? '#fff' : cfg!.color
                        : '#64748b',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                );
              })}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {filteredEvents.length} events
              </Typography>
            </Box>

            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredEvents.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">No events recorded yet.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Event</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell>Person / Actor</StyledTableCell>
                        <StyledTableCell>Department / Type</StyledTableCell>
                        <StyledTableCell>Purpose / Description</StyledTableCell>
                        <StyledTableCell>Condition / Notes</StyledTableCell>
                        <StyledTableCell>Status After</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedEvents.map((e, i) => {
                        const cfg = EVENT_CONFIG[e.type];
                        const afterStyle = STATUS_STYLES[e.statusAfter] ?? { bgcolor: '#f5f5f5', color: '#757575' };
                        return (
                          <StyledTableRow key={i}>
                            <StyledTableCell>
                              <Chip
                                icon={<cfg.Icon sx={{ fontSize: '13px !important' }} />}
                                label={cfg.label}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 11,
                                  bgcolor: cfg.bgcolor,
                                  color: cfg.color,
                                }}
                              />
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {format(new Date(e.date), 'dd MMM yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(e.date), 'HH:mm')}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {e.type === 'RETURNED' ? e.recipient : e.actor || e.recipient}
                              </Typography>
                              {e.type !== 'MAINTENANCE' && e.actor && e.type === 'RETURNED' && (
                                <Typography variant="caption" color="text.secondary">
                                  via {e.actor}
                                </Typography>
                              )}
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {e.type === 'MAINTENANCE'
                                  ? e.maintenanceType?.replace(/_/g, ' ')
                                  : e.department || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 180,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {e.purpose || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 160,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {e.condition
                                  ? e.condition.replace(/_/g, ' ')
                                  : e.notes || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Chip
                                label={e.statusAfter.replace(/_/g, ' ')}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: 10,
                                  ...afterStyle,
                                }}
                              />
                            </StyledTableCell>
                          </StyledTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50]}
                  component="div"
                  count={filteredEvents.length}
                  rowsPerPage={histRowsPerPage}
                  page={histPage}
                  onPageChange={(_, p) => setHistPage(p)}
                  onRowsPerPageChange={(e) => {
                    setHistRowsPerPage(parseInt(e.target.value, 10));
                    setHistPage(0);
                  }}
                  sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}
                />
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
