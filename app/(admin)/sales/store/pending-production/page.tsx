'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';

interface PendingUnit {
  id: string;
  unitId: string;
  unitNumber: number;
  itemType: 'production_unit';
  qc5CompletedAt: string | null;
  qc5CompletedBy: { id: string; name: string } | null;
  productionOrder: {
    id: string;
    orderNumber: string;
    product: {
      id: string;
      name: string;
      productNumber: string;
      category: string;
    };
    manager: { id: string; name: string };
  } | null;
}

interface PendingReturn {
  id: string;
  returnNumber: string;
  itemType: 'return';
  unitId: string | null;
  updatedAt: string;
  customer: { id: string; name: string };
  product: {
    id: string;
    name: string;
    productNumber: string;
    category: string;
  };
  repairTasks: {
    id: string;
    name: string;
    status: string;
    completedAt: string | null;
  }[];
}

export default function PendingProductionPage() {
  const [units, setUnits] = useState<PendingUnit[]>([]);
  const [returns, setReturns] = useState<PendingReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [confirmUnit, setConfirmUnit] = useState<PendingUnit | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<PendingReturn | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store/pending-production');
      const data = await res.json();
      setUnits(data.pendingUnits || []);
      setReturns(data.pendingReturns || []);
    } catch (error) {
      console.error('Error fetching pending production:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReceiveUnit = async (unit: PendingUnit) => {
    setReceiving(unit.id);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/store/pending-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unit', unitId: unit.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to receive');
      }
      setSuccessMessage(
        `Unit ${unit.unitId} (${unit.productionOrder?.product.name}) received into store inventory.`,
      );
      await fetchPending();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReceiving(null);
      setConfirmUnit(null);
    }
  };

  const handleReceiveReturn = async (ret: PendingReturn) => {
    setReceiving(ret.id);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/store/pending-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'return', returnId: ret.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to receive');
      }
      setSuccessMessage(
        `Return ${ret.returnNumber} (${ret.product.name}) received into store inventory.`,
      );
      await fetchPending();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReceiving(null);
      setConfirmReturn(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    } as any);
  };

  const totalPending = units.length + returns.length;

  const ReceiveButton = ({
    id,
    onClick,
  }: {
    id: string;
    onClick: () => void;
  }) => (
    <Button
      variant="contained"
      size="small"
      startIcon={
        receiving === id ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <CheckCircleIcon />
        )
      }
      onClick={onClick}
      disabled={!!receiving}
      sx={{
        bgcolor: '#16A34A',
        '&:hover': { bgcolor: '#15803D' },
        textTransform: 'none',
        fontWeight: 600,
      }}
    >
      Receive into Store
    </Button>
  );

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Pending Store Receipt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Production units that completed QC-5 and repaired return units
            awaiting receipt into store inventory
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchPending}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage('')}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* KPI Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            flex: 1,
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2,
              '&:last-child': { pb: 2 },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#FEF3C7',
                color: '#D97706',
              }}
            >
              <FactoryIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#D97706">
                {loading ? <Skeleton width={30} /> : units.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Production units
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            flex: 1,
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2,
              '&:last-child': { pb: 2 },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#EDE9FE',
                color: '#7C3AED',
              }}
            >
              <AssignmentReturnIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#7C3AED">
                {loading ? <Skeleton width={30} /> : returns.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Repaired returns
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── Section 1: Production Units ─────────────────────────── */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* <FactoryIcon sx={{ fontSize: 20, color: '#D97706' }} /> */}
        <Typography variant="h6" fontWeight={700}>
          Production Units
        </Typography>{' '}
        <Chip
          label={units.length}
          size="small"
          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
        />
      </Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 4,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Unit ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>QC-4 Completed</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Packaged by</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <InventoryIcon
                    sx={{
                      fontSize: 40,
                      color: 'text.disabled',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography color="text.secondary" variant="body2">
                    No production units awaiting receipt
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow
                  key={unit.id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {unit.unitId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unit #{unit.unitNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {unit.productionOrder?.orderNumber ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {unit.productionOrder?.product.name ?? '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {unit.productionOrder?.product.productNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {unit.productionOrder?.product.category.replace(
                        /_/g,
                        ' ',
                      ) ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(unit.qc5CompletedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {unit.qc5CompletedBy?.name ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <ReceiveButton
                      id={unit.id}
                      onClick={() => setConfirmUnit(unit)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Section 2: Repaired Returns ──────────────────────────── */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* <AssignmentReturnIcon sx={{ fontSize: 20, color: "#7C3AED" }} /> */}
        <Typography variant="h6" fontWeight={700}>
          Repaired Returns
        </Typography>
        <Chip
          label={returns.length}
          size="small"
          sx={{ bgcolor: '#EDE9FE', color: '#5B21B6', fontWeight: 700 }}
        />
      </Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Return #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unit ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Repair Tasks</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <AssignmentReturnIcon
                    sx={{
                      fontSize: 40,
                      color: 'text.disabled',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography color="text.secondary" variant="body2">
                    No repaired returns awaiting receipt
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              returns.map((ret) => (
                <TableRow
                  key={ret.id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {ret.returnNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {ret.customer.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {ret.product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ret.product.productNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {ret.product.category.replace(/_/g, ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {ret.unitId ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${ret.repairTasks.length} / ${ret.repairTasks.length} done`}
                      size="small"
                      sx={{
                        bgcolor: '#DCFCE7',
                        color: '#166534',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <ReceiveButton
                      id={ret.id}
                      onClick={() => setConfirmReturn(ret)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Dialog — Production Unit */}
      <Dialog open={!!confirmUnit} onClose={() => setConfirmUnit(null)}>
        <DialogTitle>Confirm Store Receipt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Receive unit <strong>{confirmUnit?.unitId}</strong> (
            <strong>{confirmUnit?.productionOrder?.product.name}</strong>) from
            production order{' '}
            <strong>{confirmUnit?.productionOrder?.orderNumber}</strong> into
            store inventory?
            <br />
            <br />
            This will add <strong>1 unit</strong> to store stock and cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmUnit(null)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmUnit && handleReceiveUnit(confirmUnit)}
            variant="contained"
            disabled={!!receiving}
            startIcon={
              receiving ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {receiving ? 'Receiving...' : 'Confirm Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog — Repaired Return */}
      <Dialog open={!!confirmReturn} onClose={() => setConfirmReturn(null)}>
        <DialogTitle>Confirm Store Receipt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Receive repaired return{' '}
            <strong>{confirmReturn?.returnNumber}</strong> (
            <strong>{confirmReturn?.product.name}</strong>) into store
            inventory?
            <br />
            <br />
            All{' '}
            <strong>
              {confirmReturn?.repairTasks.length} repair tasks
            </strong>{' '}
            are complete. This will add <strong>1 unit</strong> to store stock
            and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmReturn(null)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmReturn && handleReceiveReturn(confirmReturn)}
            variant="contained"
            disabled={!!receiving}
            startIcon={
              receiving ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {receiving ? 'Receiving...' : 'Confirm Receipt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
