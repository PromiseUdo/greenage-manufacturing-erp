'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useOrderContext } from '../layout';
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
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
  Divider,
  IconButton,
  Collapse,
  InputAdornment,
  Paper,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BuildIcon from '@mui/icons-material/Build';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  NOT_REQUESTED: {
    bg: '#F3F4F6',
    text: '#6B7280',
    icon: <InfoOutlinedIcon fontSize="small" />,
    label: 'Not Requested',
  },
  PENDING: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    icon: <HourglassEmptyIcon fontSize="small" />,
    label: 'Awaiting Inventory',
  },
  PARTIALLY_FULFILLED: {
    bg: '#FEF3C7',
    text: '#92400E',
    icon: <WarningAmberIcon fontSize="small" />,
    label: 'Partially Fulfilled',
  },
  FULFILLED: {
    bg: '#DCFCE7',
    text: '#166534',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Fulfilled',
  },
  CANCELLED: {
    bg: '#FEE2E2',
    text: '#991B1B',
    icon: <CancelIcon fontSize="small" />,
    label: 'Cancelled',
  },
};

const itemStatusColor = (s: string) => {
  if (s === 'ISSUED') return { bg: '#DCFCE7', text: '#166534' };
  if (s === 'PARTIAL') return { bg: '#FEF3C7', text: '#92400E' };
  if (s === 'UNAVAILABLE') return { bg: '#FEE2E2', text: '#991B1B' };
  return { bg: '#F3F4F6', text: '#6B7280' };
};

// ─── Editable requisition item type ──────────────────────────────────────────
interface ReqItem {
  materialId: string;
  materialName: string;
  partNumber: string;
  unit: string;
  category: string;
  currentStock: number;
  quantityRequired: number;
  isFromBOM: boolean;
}

import { MaterialSearchPicker } from '@/app/components/shared/MaterialSearchPicker';

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductionMaterialsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order } = useOrderContext();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReq, setSendingReq] = useState(false);
  const [reqNotes, setReqNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'BOM_SIGNOUT' | 'REPLACEMENT'>(
    'BOM_SIGNOUT',
  );
  const [dialogUnit, setDialogUnit] = useState<any>(null);
  const [bomExpanded, setBomExpanded] = useState(false);
  const [expandedReqs, setExpandedReqs] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reqItems, setReqItems] = useState<ReqItem[]>([]);
  const [requestAllDialogOpen, setRequestAllDialogOpen] = useState(false);
  const [requestingAll, setRequestingAll] = useState(false);
  const [requestAllProgress, setRequestAllProgress] = useState({
    done: 0,
    total: 0,
    failed: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/material-requisition`,
      );
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDialog = (unit: any, type: 'BOM_SIGNOUT' | 'REPLACEMENT') => {
    setDialogUnit(unit);
    setDialogType(type);
    const bom: any[] = data?.bom ?? [];
    if (type === 'BOM_SIGNOUT') {
      setReqItems(
        bom.map((b) => ({
          materialId: b.materialId,
          materialName: b.material.name,
          partNumber: b.material.partNumber,
          unit: b.material.unit,
          category: b.material.category ?? '',
          currentStock: b.currentStock,
          quantityRequired: b.qtyPerUnit,
          isFromBOM: true,
        })),
      );
    } else {
      // Pre-populate with materials that have been received (ISSUED or PARTIAL) across all unit reqs
      const receivedMap = new Map<string, ReqItem>();
      for (const req of unit.requisitions ?? []) {
        for (const item of req.items ?? []) {
          if (item.status === 'ISSUED' || item.status === 'PARTIAL') {
            if (!receivedMap.has(item.materialId)) {
              receivedMap.set(item.materialId, {
                materialId: item.materialId,
                materialName: item.material.name,
                partNumber: item.material.partNumber,
                unit: item.material.unit,
                category: item.material.category ?? '',
                currentStock: item.material.currentStock,
                quantityRequired: item.quantityIssued ?? item.quantityRequired,
                isFromBOM: true,
              });
            }
          }
        }
      }
      setReqItems(Array.from(receivedMap.values()));
    }
    setReqNotes('');
    setDialogOpen(true);
  };

  const handleAddMaterial = (mat: any) => {
    setReqItems((prev) => [
      ...prev,
      {
        materialId: mat.id,
        materialName: mat.name,
        partNumber: mat.partNumber,
        unit: mat.unit,
        category: mat.category ?? '',
        currentStock: mat.currentStock ?? 0,
        quantityRequired: 1,
        isFromBOM: false,
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
    setError('');
    if (reqItems.length === 0) {
      setError('Add at least one material before sending.');
      return;
    }
    if (reqItems.some((i) => !i.quantityRequired || i.quantityRequired <= 0)) {
      setError('All materials must have a quantity greater than zero.');
      return;
    }
    setSendingReq(true);
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/material-requisition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: reqNotes,
            type: dialogType,
            productionUnitId: dialogUnit.id,
            items: reqItems.map((i) => ({
              materialId: i.materialId,
              quantityRequired: i.quantityRequired,
            })),
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to create requisition');
        return;
      }
      const typeLabel =
        dialogType === 'REPLACEMENT'
          ? 'Replacement Requisition'
          : 'Material Requisition';
      setSuccess(
        `${typeLabel} ${json.requisitionNumber} sent to inventory team!`,
      );
      setDialogOpen(false);
      await fetchData();
    } finally {
      setSendingReq(false);
    }
  };

  const requestAllUnits = async () => {
    const unrequestedUnits = (data?.units ?? []).filter(
      (u: any) => u.requisitions.length === 0,
    );
    setRequestingAll(true);
    setRequestAllProgress({ done: 0, total: unrequestedUnits.length, failed: 0 });
    let failed = 0;
    for (const unit of unrequestedUnits) {
      try {
        const res = await fetch(
          `/api/production/orders/${orderId}/material-requisition`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'BOM_SIGNOUT',
              productionUnitId: unit.id,
            }),
          },
        );
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
      setRequestAllProgress((prev) => ({
        ...prev,
        done: prev.done + 1,
        failed,
      }));
    }
    setRequestingAll(false);
    setRequestAllDialogOpen(false);
    if (failed === 0) {
      setSuccess(
        `BOM material requests sent for all ${unrequestedUnits.length} unit${unrequestedUnits.length !== 1 ? 's' : ''}!`,
      );
    } else {
      setSuccess(
        `Requests sent: ${unrequestedUnits.length - failed} succeeded, ${failed} failed.`,
      );
    }
    await fetchData();
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading BOM and requisitions…
        </Typography>
      </Box>
    );
  }

  if (!data) return null;

  const bom: any[] = data.bom ?? [];
  const units: any[] = data.units ?? [];
  const hasBOM = bom.length > 0;

  // Summary computations
  const totalBOMCostPerUnit = bom.reduce(
    (acc: number, b: any) => acc + (b.material.unitCost ?? 0) * b.qtyPerUnit,
    0,
  );
  const hasBOMCostData = bom.some((b: any) => b.material.unitCost != null);
  const unitsFulfilled = units.filter((u: any) =>
    u.requisitions.some(
      (r: any) =>
        !r.notes?.startsWith('[Replacement') && r.status === 'FULFILLED',
    ),
  ).length;
  const unitsPending = units.filter((u: any) =>
    u.requisitions.some((r: any) =>
      ['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status),
    ),
  ).length;
  const unitsNotStarted = units.filter(
    (u: any) => u.requisitions.length === 0,
  ).length;
  const totalShortfall = bom.reduce(
    (acc: number, b: any) => acc + (b.shortfall ?? 0),
    0,
  );

  return (
    <Box>
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* ── Summary Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight={800}>
              {units.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Units
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: unitsFulfilled > 0 ? '#BBF7D0' : 'divider',
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: unitsFulfilled > 0 ? '#F0FDF4' : 'background.paper',
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              color={unitsFulfilled > 0 ? '#166534' : 'text.primary'}
            >
              {unitsFulfilled}/{units.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              BOM Fulfilled
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: unitsPending > 0 ? '#BFDBFE' : 'divider',
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: unitsPending > 0 ? '#EFF6FF' : 'background.paper',
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              color={unitsPending > 0 ? '#1E40AF' : 'text.primary'}
            >
              {unitsPending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Awaiting Inventory
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: unitsNotStarted > 0 ? '#FEF3C7' : 'divider',
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: unitsNotStarted > 0 ? '#FFFBEB' : 'background.paper',
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              color={unitsNotStarted > 0 ? '#92400E' : 'text.primary'}
            >
              {unitsNotStarted}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Not Yet Requested
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── BOM Reference Card (collapsed by default) ── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setBomExpanded(!bomExpanded)}
          >
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Inventory2Icon sx={{ color: '#6366F1' }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Bill of Materials — Per Unit Reference
              </Typography>
              <Chip label={`${bom.length} materials`} size="small" />
              {/* {totalShortfall > 0 && (
                <Chip
                  label="Stock shortfall detected"
                  size="small"
                  sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}
                />
              )} */}
              {/* {hasBOMCostData && (
                <Chip
                  label={`${formatCurrency(totalBOMCostPerUnit)} / unit`}
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#3730A3', fontWeight: 700 }}
                />
              )} */}
            </Box>
            <IconButton size="small">
              {bomExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={bomExpanded}>
            {bom.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No BOM materials defined for{' '}
                <strong>{data.product?.name}</strong>. Add materials to the
                product first.
              </Alert>
            ) : (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Qty / Unit
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Unit Cost
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Cost / Unit
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        In Stock
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Units Coverable
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bom.map((item: any) => {
                      const unitsPossible =
                        item.qtyPerUnit > 0
                          ? Math.floor(item.currentStock / item.qtyPerUnit)
                          : 0;
                      const isShort = unitsPossible < (order?.quantity ?? 0);
                      return (
                        <TableRow
                          key={item.materialId}
                          sx={{
                            bgcolor: isShort ? '#FFF7F7' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.material.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.material.partNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {item.material.category?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700}>
                              {item.qtyPerUnit} {item.material.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(item.material.unitCost)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="#1E40AF"
                            >
                              {item.material.unitCost != null
                                ? formatCurrency(
                                    item.material.unitCost * item.qtyPerUnit,
                                  )
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={
                                unitsPossible >= (order?.quantity ?? 0)
                                  ? '#16A34A'
                                  : unitsPossible > 0
                                    ? '#D97706'
                                    : '#DC2626'
                              }
                            >
                              {item.currentStock} {item.material.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {isShort ? (
                              <Chip
                                label={`${unitsPossible} of ${order?.quantity}`}
                                size="small"
                                sx={{
                                  bgcolor: '#FEE2E2',
                                  color: '#991B1B',
                                  fontWeight: 700,
                                }}
                              />
                            ) : (
                              <CheckCircleIcon
                                sx={{ color: '#16A34A', fontSize: 18 }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* ── Per-unit header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          Materials by Unit ({units.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {unitsNotStarted > 0 && (
            <Chip
              label={`${unitsNotStarted} unit${unitsNotStarted !== 1 ? 's' : ''} not yet requested`}
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}
            />
          )}
          {hasBOM && unitsNotStarted > 0 && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              size="small"
              onClick={() => setRequestAllDialogOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#2563EB',
                '&:hover': { bgcolor: '#1D4ED8' },
                borderRadius: 2,
                fontSize: '0.78rem',
              }}
            >
              Request All Units
            </Button>
          )}
        </Box>
      </Box>

      {!hasBOM && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          No BOM defined for this product. Add materials to the product before
          raising requisitions.
        </Alert>
      )}

      {/* ── Per-unit cards ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {units.map((unit: any) => {
          const unitReqs: any[] = unit.requisitions;
          const latestReq = unitReqs[0] ?? null;
          const latestBOMReq = unitReqs.find(
            (r: any) => !r.notes?.startsWith('[Replacement'),
          );
          const hasOpenReq =
            latestReq &&
            ['PENDING', 'PARTIALLY_FULFILLED'].includes(latestReq.status);
          const canRequestBOM = true;
          const hasPartialOrFulfilledReq = unitReqs.some((r: any) =>
            ['PARTIALLY_FULFILLED', 'FULFILLED'].includes(r.status),
          );
          const canRequestReplacement =
            !!latestBOMReq &&
            latestBOMReq.status !== 'CANCELLED' &&
            hasPartialOrFulfilledReq;
          const reqStatusInfo =
            statusConfig[latestReq?.status ?? 'NOT_REQUESTED'] ??
            statusConfig.NOT_REQUESTED;
          const cardBorderColor =
            latestReq?.status === 'FULFILLED'
              ? '#BBF7D0'
              : hasOpenReq
                ? '#BFDBFE'
                : '#E5E7EB';
          const cardBgColor =
            latestReq?.status === 'FULFILLED'
              ? '#F0FDF4'
              : hasOpenReq
                ? '#EFF6FF'
                : 'background.paper';

          return (
            <Card
              key={unit.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: cardBorderColor,
                borderRadius: 2,
                bgcolor: cardBgColor,
              }}
            >
              <CardContent>
                {/* Unit header row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800}>
                      {unit.unitId}
                    </Typography>
                    <Chip
                      label={unit.status.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        bgcolor:
                          unit.status === 'COMPLETED'
                            ? '#DCFCE7'
                            : unit.status === 'IN_PROGRESS'
                              ? '#DBEAFE'
                              : '#F3F4F6',
                        color:
                          unit.status === 'COMPLETED'
                            ? '#166534'
                            : unit.status === 'IN_PROGRESS'
                              ? '#1E40AF'
                              : '#6B7280',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                      }}
                    />
                    <Chip
                      label={reqStatusInfo.label}
                      size="small"
                      sx={{
                        bgcolor: reqStatusInfo.bg,
                        color: reqStatusInfo.text,
                        fontWeight: 700,
                        fontSize: '0.65rem',
                      }}
                    />
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {canRequestBOM && hasBOM && (
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        size="small"
                        onClick={() => openDialog(unit, 'BOM_SIGNOUT')}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          bgcolor: '#16A34A',
                          '&:hover': { bgcolor: '#15803D' },
                          borderRadius: 2,
                          fontSize: '0.78rem',
                        }}
                      >
                        Request BOM Materials
                      </Button>
                    )}
                    <Tooltip
                      title={
                        !latestBOMReq || latestBOMReq.status === 'CANCELLED'
                          ? 'Raise an initial BOM request for this unit first'
                          : !hasPartialOrFulfilledReq
                            ? 'Available once at least some materials have been received (partial or full fulfilment)'
                            : ''
                      }
                    >
                      <span>
                        <Button
                          variant="outlined"
                          startIcon={<BuildIcon />}
                          size="small"
                          disabled={!canRequestReplacement}
                          onClick={() => openDialog(unit, 'REPLACEMENT')}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            borderColor: '#DC2626',
                            color: '#DC2626',
                            bgcolor: '#FFF5F5',
                            '&:hover': { bgcolor: '#FEE2E2' },
                            fontSize: '0.78rem',
                          }}
                        >
                          Replacement Request
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Status detail line */}
                {!latestReq && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 0.5 }}
                  >
                    No materials requested for this unit yet.
                  </Typography>
                )}
                {latestReq && (
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Latest: <strong>{latestReq.requisitionNumber}</strong> ·{' '}
                      {latestReq.requestedBy?.name} ·{' '}
                      {formatDate(latestReq.createdAt)}
                    </Typography>
                    {latestReq.status === 'PENDING' && (
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: '#1E40AF' }}
                      >
                        Awaiting inventory team to issue materials.
                      </Typography>
                    )}
                    {latestReq.status === 'PARTIALLY_FULFILLED' && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        ⚠ Some materials issued — awaiting remaining items.
                      </Typography>
                    )}
                    {latestReq.status === 'FULFILLED' && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        ✓ All materials issued.
                        {latestReq.fulfilledBy &&
                          ` Fulfilled by ${latestReq.fulfilledBy.name}.`}
                      </Typography>
                    )}
                    {latestReq.inventoryNotes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Inventory notes: {latestReq.inventoryNotes}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Requisition history */}
                {unitReqs.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        mt: 1.5,
                      }}
                    >
                      {unitReqs.map((req: any) => {
                          const isReqExpanded =
                            expandedReqs[req.id] ?? false;
                          const isReplacement =
                            req.notes?.startsWith('[Replacement');
                          const issued =
                            req.items?.filter((i: any) => i.status === 'ISSUED')
                              .length ?? 0;
                          const total = req.items?.length ?? 0;
                          const pct =
                            total > 0 ? Math.round((issued / total) * 100) : 0;

                          return (
                            <Card
                              key={req.id}
                              elevation={0}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                              }}
                            >
                              <CardContent sx={{ pb: '16px !important' }}>
                                {/* Req header */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: isReqExpanded ? 2 : 0,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() =>
                                    setExpandedReqs((prev) => ({
                                      ...prev,
                                      [req.id]: !isReqExpanded,
                                    }))
                                  }
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 1.5,
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {isReplacement ? (
                                      <BuildIcon
                                        sx={{ color: '#DC2626', fontSize: 18 }}
                                      />
                                    ) : (
                                      <SendIcon
                                        sx={{ color: '#2563EB', fontSize: 18 }}
                                      />
                                    )}
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={700}
                                    >
                                      {req.requisitionNumber}
                                    </Typography>
                                    <Chip
                                      label={
                                        isReplacement
                                          ? 'Replacement'
                                          : 'BOM Sign-out'
                                      }
                                      size="small"
                                      sx={{
                                        bgcolor: isReplacement
                                          ? '#FEE2E2'
                                          : '#DBEAFE',
                                        color: isReplacement
                                          ? '#991B1B'
                                          : '#1E40AF',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                      }}
                                    />
                                    <Chip
                                      label={
                                        statusConfig[req.status]?.label ??
                                        req.status
                                      }
                                      size="small"
                                      sx={{
                                        bgcolor: statusConfig[req.status]?.bg,
                                        color: statusConfig[req.status]?.text,
                                        fontWeight: 700,
                                        fontSize: '0.6rem',
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatDate(req.createdAt)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<PictureAsPdfIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(
                                          `/api/production/orders/${orderId}/material-requisition/${req.id}/pdf`,
                                          '_blank',
                                        );
                                      }}
                                      sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        borderColor: '#2563EB',
                                        color: '#2563EB',
                                        '&:hover': { bgcolor: '#EFF6FF', borderColor: '#1D4ED8' },
                                        borderRadius: 2,
                                        px: 1.5,
                                      }}
                                    >
                                      Download PDF
                                    </Button>
                                    <IconButton size="small">
                                      {isReqExpanded ? (
                                        <ExpandLessIcon />
                                      ) : (
                                        <ExpandMoreIcon />
                                      )}
                                    </IconButton>
                                  </Box>
                                </Box>

                                <Collapse in={isReqExpanded}>
                                  {/* Progress bar */}
                                  {total > 0 && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        mb: 2,
                                      }}
                                    >
                                      <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                          flex: 1,
                                          height: 8,
                                          borderRadius: 4,
                                          bgcolor: '#E5E7EB',
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            bgcolor:
                                              pct === 100
                                                ? '#16A34A'
                                                : '#2563EB',
                                          },
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        fontWeight={600}
                                      >
                                        {issued}/{total} items issued
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Items table */}
                                  <TableContainer>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow
                                          sx={{ bgcolor: 'action.hover' }}
                                        >
                                          <TableCell sx={{ fontWeight: 600 }}>
                                            Material
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 600 }}>
                                            Part #
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="center"
                                          >
                                            Required
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="center"
                                          >
                                            Issued
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="center"
                                          >
                                            Stock at Request
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="right"
                                          >
                                            Unit Cost
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="right"
                                          >
                                            Cost Requested
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontWeight: 600 }}
                                            align="right"
                                          >
                                            Cost Issued
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 600 }}>
                                            Status
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 600 }}>
                                            Notes
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {req.items?.map((item: any) => {
                                          const col = itemStatusColor(
                                            item.status,
                                          );
                                          const issuedPct =
                                            item.quantityIssued != null &&
                                            item.quantityRequired > 0
                                              ? Math.round(
                                                  (item.quantityIssued /
                                                    item.quantityRequired) *
                                                    100,
                                                )
                                              : null;
                                          return (
                                            <TableRow
                                              key={item.id}
                                              sx={{ verticalAlign: 'middle' }}
                                            >
                                              <TableCell>
                                                <Typography
                                                  variant="body2"
                                                  fontWeight={600}
                                                >
                                                  {item.material.name}
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {item.material.category?.replace(
                                                    /_/g,
                                                    ' ',
                                                  )}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {item.material.partNumber}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="center">
                                                <Typography
                                                  variant="body2"
                                                  fontWeight={700}
                                                >
                                                  {item.quantityRequired}{' '}
                                                  {item.material.unit}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="center">
                                                <Typography
                                                  variant="body2"
                                                  fontWeight={700}
                                                  color={
                                                    item.quantityIssued == null
                                                      ? 'text.disabled'
                                                      : item.quantityIssued >=
                                                          item.quantityRequired
                                                        ? '#16A34A'
                                                        : '#D97706'
                                                  }
                                                >
                                                  {item.quantityIssued != null
                                                    ? `${item.quantityIssued} ${item.material.unit}`
                                                    : '—'}
                                                </Typography>
                                                {issuedPct !== null &&
                                                  issuedPct < 100 && (
                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                    >
                                                      {issuedPct}%
                                                    </Typography>
                                                  )}
                                              </TableCell>
                                              <TableCell align="center">
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {item.stockAtRequest != null
                                                    ? `${item.stockAtRequest} ${item.material.unit}`
                                                    : '—'}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="right">
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {formatCurrency(
                                                    item.material.unitCost,
                                                  )}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="right">
                                                <Typography
                                                  variant="body2"
                                                  fontWeight={700}
                                                  color="#1E40AF"
                                                >
                                                  {item.material.unitCost !=
                                                  null
                                                    ? formatCurrency(
                                                        item.material.unitCost *
                                                          item.quantityRequired,
                                                      )
                                                    : '—'}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="right">
                                                <Typography
                                                  variant="body2"
                                                  fontWeight={700}
                                                  color={
                                                    item.quantityIssued !=
                                                      null &&
                                                    item.material.unitCost !=
                                                      null
                                                      ? '#16A34A'
                                                      : 'text.disabled'
                                                  }
                                                >
                                                  {item.quantityIssued !=
                                                    null &&
                                                  item.material.unitCost != null
                                                    ? formatCurrency(
                                                        item.material.unitCost *
                                                          item.quantityIssued,
                                                      )
                                                    : '—'}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>
                                                <Chip
                                                  label={item.status}
                                                  size="small"
                                                  sx={{
                                                    bgcolor: col.bg,
                                                    color: col.text,
                                                    fontWeight: 700,
                                                    fontSize: '0.65rem',
                                                  }}
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {item.notes || '—'}
                                                </Typography>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>

                                  {/* Cost summary */}
                                  {(() => {
                                    const hasCost = req.items?.some(
                                      (i: any) => i.material.unitCost != null,
                                    );
                                    if (!hasCost) return null;
                                    const totalCostReq = (
                                      req.items ?? []
                                    ).reduce(
                                      (acc: number, i: any) =>
                                        acc +
                                        (i.material.unitCost ?? 0) *
                                          i.quantityRequired,
                                      0,
                                    );
                                    const totalCostIssued = (
                                      req.items ?? []
                                    ).reduce(
                                      (acc: number, i: any) =>
                                        i.quantityIssued != null &&
                                        i.material.unitCost != null
                                          ? acc +
                                            i.material.unitCost *
                                              i.quantityIssued
                                          : acc,
                                      0,
                                    );
                                    const hasAnyIssued = req.items?.some(
                                      (i: any) => i.quantityIssued != null,
                                    );
                                    return (
                                      <Box
                                        sx={{
                                          mt: 2,
                                          borderRadius: 2,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            px: 2,
                                            py: 1,
                                            bgcolor: '#0F172A',
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            sx={{
                                              color: '#94A3B8',
                                              letterSpacing: '0.5px',
                                            }}
                                          >
                                            COST SUMMARY
                                          </Typography>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              flex: 1,
                                              minWidth: 160,
                                              p: 2,
                                              borderRight: '1px solid',
                                              borderColor: 'divider',
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              fontWeight={600}
                                              sx={{ display: 'block', mb: 0.5 }}
                                            >
                                              Total Requested
                                            </Typography>
                                            <Typography
                                              variant="h6"
                                              fontWeight={800}
                                              color="#1E40AF"
                                            >
                                              {formatCurrency(totalCostReq)}
                                            </Typography>
                                          </Box>
                                          {hasAnyIssued && (
                                            <>
                                              <Box
                                                sx={{
                                                  flex: 1,
                                                  minWidth: 160,
                                                  p: 2,
                                                  borderRight: '1px solid',
                                                  borderColor: 'divider',
                                                }}
                                              >
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                  fontWeight={600}
                                                  sx={{
                                                    display: 'block',
                                                    mb: 0.5,
                                                  }}
                                                >
                                                  Total Issued
                                                </Typography>
                                                <Typography
                                                  variant="h6"
                                                  fontWeight={800}
                                                  color="#16A34A"
                                                >
                                                  {formatCurrency(
                                                    totalCostIssued,
                                                  )}
                                                </Typography>
                                              </Box>
                                              <Box
                                                sx={{
                                                  flex: 1,
                                                  minWidth: 160,
                                                  p: 2,
                                                  bgcolor:
                                                    totalCostIssued <
                                                    totalCostReq
                                                      ? '#FFFBEB'
                                                      : '#F0FDF4',
                                                }}
                                              >
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                  fontWeight={600}
                                                  sx={{
                                                    display: 'block',
                                                    mb: 0.5,
                                                  }}
                                                >
                                                  Variance
                                                </Typography>
                                                <Typography
                                                  variant="h6"
                                                  fontWeight={800}
                                                  color={
                                                    totalCostIssued <
                                                    totalCostReq
                                                      ? '#D97706'
                                                      : '#16A34A'
                                                  }
                                                >
                                                  {formatCurrency(
                                                    totalCostReq -
                                                      totalCostIssued,
                                                  )}
                                                </Typography>
                                              </Box>
                                            </>
                                          )}
                                        </Box>
                                      </Box>
                                    );
                                  })()}

                                  {req.notes && (
                                    <Box
                                      sx={{
                                        mt: 2,
                                        p: 1.5,
                                        bgcolor: '#F9FAFB',
                                        borderRadius: 2,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Notes:{' '}
                                      </Typography>
                                      <Typography variant="caption">
                                        {req.notes}
                                      </Typography>
                                    </Box>
                                  )}
                                </Collapse>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* ─── Request All Dialog ─── */}
      <Dialog
        open={requestAllDialogOpen}
        onClose={() => !requestingAll && setRequestAllDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: '#EFF6FF',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SendIcon sx={{ color: '#2563EB' }} />
          <Typography fontWeight={700}>
            Request BOM Materials — All Units
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {!requestingAll ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              This will send a BOM material request for{' '}
              <strong>
                {unitsNotStarted} unit{unitsNotStarted !== 1 ? 's' : ''}
              </strong>{' '}
              that haven&apos;t been requested yet. Each unit will receive a
              separate requisition using the product&apos;s standard BOM
              quantities.
            </Typography>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Sending requests… {requestAllProgress.done} /{' '}
                {requestAllProgress.total}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  requestAllProgress.total > 0
                    ? (requestAllProgress.done / requestAllProgress.total) * 100
                    : 0
                }
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#DBEAFE',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: '#2563EB',
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Button
            onClick={() => setRequestAllDialogOpen(false)}
            disabled={requestingAll}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={requestAllUnits}
            disabled={requestingAll}
            startIcon={
              requestingAll ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {requestingAll
              ? `Sending (${requestAllProgress.done}/${requestAllProgress.total})…`
              : `Request All ${unitsNotStarted} Unit${unitsNotStarted !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Request Dialog ─── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !sendingReq && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: dialogType === 'REPLACEMENT' ? '#FFF5F5' : '#F0FDF4',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {dialogType === 'REPLACEMENT' ? (
            <BuildIcon sx={{ color: '#DC2626' }} />
          ) : (
            <SendIcon sx={{ color: '#16A34A' }} />
          )}
          <Box>
            <Typography fontWeight={700}>
              {dialogType === 'REPLACEMENT'
                ? 'P-4: Replacement Material Request'
                : 'P-1: BOM Sign-out Request'}
            </Typography>
            {dialogUnit && (
              <Typography variant="caption" color="text.secondary">
                For unit: <strong>{dialogUnit.unitId}</strong>
              </Typography>
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <Alert
              severity={dialogType === 'REPLACEMENT' ? 'warning' : 'info'}
              sx={{ borderRadius: 2, mb: 2 }}
            >
              {dialogType === 'REPLACEMENT'
                ? `List the non-conforming or damaged materials that need replacement for ${dialogUnit?.unitId ?? 'this unit'}. The inventory team will receive this as a replacement request.`
                : `BOM materials for ${dialogUnit?.unitId ?? 'this unit'} are pre-loaded below (1-unit quantities). Adjust quantities or add extra materials as needed before sending.`}
            </Alert>

            <MaterialSearchPicker
              onAdd={handleAddMaterial}
              alreadyAdded={reqItems.map((i) => i.materialId)}
            />

            {reqItems.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                No materials added yet. Use the search above to add materials.
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2, mb: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        In Stock
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Qty Required
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Source
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reqItems.map((item) => (
                      <TableRow
                        key={item.materialId}
                        sx={{
                          bgcolor: item.isFromBOM ? 'transparent' : '#F0FDF4',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.materialName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.category?.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {item.partNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              item.currentStock >= item.quantityRequired
                                ? '#16A34A'
                                : item.currentStock > 0
                                  ? '#D97706'
                                  : '#DC2626'
                            }
                          >
                            {item.currentStock} {item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantityRequired}
                            onChange={(e) =>
                              handleQtyChange(item.materialId, e.target.value)
                            }
                            inputProps={{ min: 0.01, step: 0.01 }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {item.unit}
                                  </Typography>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.isFromBOM ? 'BOM' : 'Added'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              bgcolor: item.isFromBOM ? '#EEF2FF' : '#F0FDF4',
                              color: item.isFromBOM ? '#4338CA' : '#16A34A',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item.materialId)}
                            sx={{ color: '#DC2626' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 1.5, borderRadius: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <TextField
              label={
                dialogType === 'REPLACEMENT'
                  ? 'Replacement notes — describe what failed and why'
                  : 'Notes (optional)'
              }
              multiline
              rows={2}
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder={
                dialogType === 'REPLACEMENT'
                  ? 'e.g., Faulty battery cells from batch #B2026. Need urgent replacement.'
                  : 'e.g., Urgent — production starts tomorrow. Please prioritise.'
              }
              fullWidth
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={sendingReq}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={sendRequisition}
            disabled={sendingReq || reqItems.length === 0}
            startIcon={
              sendingReq ? (
                <CircularProgress size={14} color="inherit" />
              ) : dialogType === 'REPLACEMENT' ? (
                <BuildIcon />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              bgcolor: dialogType === 'REPLACEMENT' ? '#DC2626' : '#16A34A',
              '&:hover': {
                bgcolor: dialogType === 'REPLACEMENT' ? '#B91C1C' : '#15803D',
              },
            }}
          >
            {sendingReq
              ? 'Sending…'
              : `Send ${dialogType === 'REPLACEMENT' ? 'Replacement' : 'Material'} Request`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
