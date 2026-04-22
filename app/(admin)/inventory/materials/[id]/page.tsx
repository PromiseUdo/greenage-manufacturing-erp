'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  CallReceived as InIcon,
  CallMade as OutIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { MaterialWithRelations } from '@/types/inventory';
import { format } from 'date-fns';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material';

// ── Types ──────────────────────────────────────────────────────────────────

interface Movement {
  type: 'IN' | 'OUT';
  date: string;
  quantity: number;
  reference: string;
  source: string;
  note: string;
  runningBalance: number;
}

interface HistoryData {
  movements: Movement[];
  summary: {
    totalIn: number;
    totalOut: number;
    currentStock: number;
    unit: string;
  };
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

const getStockStatus = (stock: number, reorder: number) => {
  if (stock === 0)
    return { label: 'Out of Stock', sx: { bgcolor: '#ffebee', color: '#d32f2f' } };
  if (stock <= reorder)
    return { label: 'Low Stock', sx: { bgcolor: '#fff3e0', color: '#ed6c02' } };
  return { label: 'In Stock', sx: { bgcolor: '#e8f5e9', color: '#2e7d32' } };
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n);

// ── Sub-components ─────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string;
  chipBgColor?: string;
  valueColor?: string;
}

function InfoRow({
  label,
  value,
  highlight,
  bold,
  chip,
  chipColor,
  chipBgColor,
  valueColor,
}: InfoRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}:
      </Typography>
      {chip ? (
        <Chip
          label={value}
          size="small"
          sx={{ fontWeight: 500, color: chipColor, backgroundColor: chipBgColor }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            fontWeight: bold || highlight ? 600 : 400,
            color: valueColor || (highlight ? 'error.main' : 'text.primary'),
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

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
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
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

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MaterialDetailsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState(0);

  // History
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [histPage, setHistPage] = useState(0);
  const [histRowsPerPage, setHistRowsPerPage] = useState(20);

  // Datasheet
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      const resolved = await params;
      setId(resolved.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchMaterial();
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/inventory/materials/${id}`);
      if (!res.ok) throw new Error('Material not found');
      setMaterial(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!id || historyFetched) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/inventory/materials/${id}/history`);
      if (res.ok) {
        setHistoryData(await res.json());
        setHistoryFetched(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [id, historyFetched]);

  useEffect(() => {
    if (tab === 1) fetchHistory();
  }, [tab, fetchHistory]);

  const handleDownloadDatasheet = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/inventory/materials/${id}/datasheet`);
      if (!res.ok) throw new Error('Failed to generate datasheet');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        (material?.partNumber.replace(/[^a-zA-Z0-9]/g, '-') ?? 'material') +
        '-datasheet.pdf';
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

  if (error || !material) {
    return (
      <Box>
        <Alert severity="error">{error || 'Material not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const status = getStockStatus(material.currentStock, material.reorderLevel);
  const totalValue = material.currentStock * (material.unitCost ?? 0);
  const showAlert = material.currentStock <= material.reorderLevel;

  // Filtered + paginated history
  const filteredMovements =
    historyData?.movements.filter(
      (m) => typeFilter === 'ALL' || m.type === typeFilter,
    ) ?? [];
  const pagedMovements = filteredMovements.slice(
    histPage * histRowsPerPage,
    histPage * histRowsPerPage + histRowsPerPage,
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Back button ── */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => router.push('/inventory/materials')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back to Materials
      </Button>

      {/* ── Page header ── */}
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
            {material.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={material.partNumber}
              size="small"
              sx={{ fontWeight: 600, bgcolor: '#F1F5F9', color: '#0F172A' }}
            />
            <Chip
              label={material.category.replace(/_/g, ' ')}
              size="small"
              sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 500 }}
            />
            <Chip label={status.label} size="small" sx={{ fontWeight: 600, ...status.sx }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Download PDF datasheet for this material">
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
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/inventory/materials/${material.id}/edit`)}
            sx={{ bgcolor: '#0F172A', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#1e293b' } }}
          >
            Edit Material
          </Button>
        </Box>
      </Box>

      {/* ── Low stock alert ── */}
      {showAlert && (
        <Alert severity={material.currentStock === 0 ? 'error' : 'warning'} sx={{ mb: 3 }}>
          <strong>
            {material.currentStock === 0 ? 'Out of Stock! ' : 'Low Stock Alert! '}
          </strong>
          {material.currentStock > 0 &&
            `Current stock (${material.currentStock} ${material.unit}) is at or below the reorder level (${material.reorderLevel} ${material.unit}).`}
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard
          label="Current Stock"
          value={`${material.currentStock}`}
          sub={material.unit}
          color={material.currentStock === 0 ? '#d32f2f' : material.currentStock <= material.reorderLevel ? '#ed6c02' : '#2e7d32'}
        />
        <StatCard
          label="Reorder Level"
          value={`${material.reorderLevel}`}
          sub={material.unit}
        />
        <StatCard
          label="Unit Cost"
          value={material.unitCost ? formatCurrency(material.unitCost) : '—'}
        />
        <StatCard
          label="Total Value"
          value={material.unitCost ? formatCurrency(totalValue) : '—'}
          color="#0F172A"
        />
        <StatCard
          label="Total Receipts"
          value={String(material._count?.batches ?? 0)}
          sub="GRN batches"
        />
        <StatCard
          label="Total Issuances"
          value={String(material._count?.issuances ?? 0)}
          sub="recorded"
        />
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
          <Tab label={`History${material._count ? ` (${(material._count.batches ?? 0) + (material._count.issuances ?? 0)})` : ''}`} />
        </Tabs>

        {/* ── Overview tab ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Basic info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                  Basic Information
                </Typography>
                <InfoRow label="Part Number" value={material.partNumber} bold />
                <InfoRow label="Material Name" value={material.name} />
                <InfoRow
                  label="Category"
                  value={material.category.replace(/_/g, ' ')}
                  chip
                  chipColor="#1976d2"
                  chipBgColor="#e3f2fd"
                />
                <InfoRow label="Unit of Measure" value={material.unit} />
                <InfoRow
                  label="Supplier"
                  value={material.supplier?.name || 'Not assigned'}
                  valueColor={material.supplier?.name ? 'text.primary' : 'text.secondary'}
                />
                {material.supplier?.contactPerson && (
                  <InfoRow label="Contact Person" value={material.supplier.contactPerson} />
                )}
                {material.supplier?.phone && (
                  <InfoRow label="Supplier Phone" value={material.supplier.phone} />
                )}
                <Divider sx={{ my: 2 }} />
                <InfoRow
                  label="Date Added"
                  value={format(new Date(material.createdAt), 'dd MMM yyyy')}
                />
                <InfoRow
                  label="Last Updated"
                  value={format(new Date(material.updatedAt), 'dd MMM yyyy')}
                />
              </Grid>

              {/* Stock info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0F172A' }}>
                  Stock Information
                </Typography>
                <InfoRow
                  label="Current Stock"
                  value={`${material.currentStock} ${material.unit}`}
                  highlight={showAlert}
                />
                <InfoRow
                  label="Reorder Level"
                  value={`${material.reorderLevel} ${material.unit}`}
                />
                <InfoRow
                  label="Max Stock Level"
                  value={
                    material.maxStockLevel
                      ? `${material.maxStockLevel} ${material.unit}`
                      : 'Not set'
                  }
                />
                <InfoRow
                  label="Unit Cost"
                  value={material.unitCost ? formatCurrency(material.unitCost) : 'Not set'}
                />
                <InfoRow label="Total Stock Value" value={formatCurrency(totalValue)} bold />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#0F172A' }}>
                  Recent Batches
                </Typography>
                {material.batches && material.batches.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Batch No.</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Received</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {material.batches.slice(0, 5).map((b) => (
                          <TableRow key={b.id}>
                            <TableCell sx={{ fontSize: 12 }}>{b.batchNumber}</TableCell>
                            <TableCell align="right" sx={{ fontSize: 12 }}>
                              {b.quantity} {material.unit}
                            </TableCell>
                            <TableCell sx={{ fontSize: 12 }}>
                              {format(new Date(b.receivedDate), 'dd MMM yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No batches recorded yet.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── History tab ── */}
        {tab === 1 && (
          <Box>
            {/* History summary bar */}
            {historyData && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    p: 2.5,
                    textAlign: 'center',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#f0fdf4',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total Received
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#16a34a' }}>
                    +{historyData.summary.totalIn} {historyData.summary.unit}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2.5,
                    textAlign: 'center',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#fff5f5',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total Issued
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#dc2626' }}>
                    -{historyData.summary.totalOut} {historyData.summary.unit}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2.5, textAlign: 'center', bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Current Stock
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color:
                        historyData.summary.currentStock === 0
                          ? '#dc2626'
                          : historyData.summary.currentStock <= material.reorderLevel
                            ? '#d97706'
                            : '#0F172A',
                    }}
                  >
                    {historyData.summary.currentStock} {historyData.summary.unit}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Filter row */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#FAFAFA',
              }}
            >
              <FilterIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Show:
              </Typography>
              {(['ALL', 'IN', 'OUT'] as const).map((f) => (
                <Chip
                  key={f}
                  label={f === 'ALL' ? 'All Movements' : f === 'IN' ? 'Received (IN)' : 'Issued (OUT)'}
                  size="small"
                  onClick={() => { setTypeFilter(f); setHistPage(0); }}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor:
                      typeFilter === f
                        ? f === 'IN'
                          ? '#dcfce7'
                          : f === 'OUT'
                            ? '#fee2e2'
                            : '#0F172A'
                        : '#F1F5F9',
                    color:
                      typeFilter === f
                        ? f === 'IN'
                          ? '#16a34a'
                          : f === 'OUT'
                            ? '#dc2626'
                            : '#fff'
                        : '#64748b',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {filteredMovements.length} movements
              </Typography>
            </Box>

            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredMovements.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">No movement records found.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell>Batch / Reference</StyledTableCell>
                        <StyledTableCell>Source / Destination</StyledTableCell>
                        <StyledTableCell>Note / Purpose</StyledTableCell>
                        <StyledTableCell align="right">Quantity</StyledTableCell>
                        <StyledTableCell align="right">Balance After</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedMovements.map((m, i) => (
                        <StyledTableRow key={i}>
                          <StyledTableCell>
                            <Chip
                              icon={
                                m.type === 'IN' ? (
                                  <InIcon sx={{ fontSize: '13px !important' }} />
                                ) : (
                                  <OutIcon sx={{ fontSize: '13px !important' }} />
                                )
                              }
                              label={m.type === 'IN' ? 'IN' : 'OUT'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: 11,
                                bgcolor: m.type === 'IN' ? '#dcfce7' : '#fee2e2',
                                color: m.type === 'IN' ? '#16a34a' : '#dc2626',
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2">
                              {format(new Date(m.date), 'dd MMM yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(m.date), 'HH:mm')}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {m.reference}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2">{m.source}</Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {m.note || '—'}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ color: m.type === 'IN' ? '#16a34a' : '#dc2626' }}
                            >
                              {m.type === 'IN' ? '+' : '-'}{m.quantity} {material.unit}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              {m.runningBalance} {material.unit}
                            </Typography>
                          </StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50]}
                  component="div"
                  count={filteredMovements.length}
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
