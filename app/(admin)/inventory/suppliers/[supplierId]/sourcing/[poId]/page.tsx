'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  CircularProgress,
  Chip,
  Alert,
  TextField,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  LocalShipping as ShipmentIcon,
  Inventory as ReceivingIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  NavigateNext as NextIcon,
  Add as AddIcon,
  EventNote as PlanIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const steps = [
  { label: 'Planning', icon: <PlanIcon /> },
  { label: 'Invoice', icon: <InvoiceIcon /> },
  { label: 'Payment', icon: <PaymentIcon /> },
  { label: 'Shipment', icon: <ShipmentIcon /> },
  { label: 'Receiving', icon: <ReceivingIcon /> },
];

const statusToStep: Record<string, number> = {
  DRAFT: 0,
  PLANNED: 1,
  INVOICED: 2,
  PAYMENT_TRACKING: 2,
  SHIPMENT_TRACKING: 3,
  RECEIVING: 4,
  COMPLETED: 5,
  CANCELLED: -1,
};

const stepToNextStatus: Record<number, string> = {
  0: 'PLANNED',
  1: 'INVOICED',
  2: 'SHIPMENT_TRACKING',
  3: 'RECEIVING',
  4: 'COMPLETED',
};

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: '#0F172A',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: '#0F172A',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
  },
}));

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ supplierId: string; poId: string }>;
}) {
  const { supplierId, poId } = use(params);
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment form state (for recording partial payments)
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');

  const [shipmentMethod, setShipmentMethod] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [shipmentStartDate, setShipmentStartDate] = useState('');
  const [shipmentEndDate, setShipmentEndDate] = useState('');

  const [receivingStartDate, setReceivingStartDate] = useState('');
  const [receivingEndDate, setReceivingEndDate] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  const [invoiceStartDate, setInvoiceStartDate] = useState('');
  const [invoiceEndDate, setInvoiceEndDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Planning step state
  const [planInvoiceStart, setPlanInvoiceStart] = useState('');
  const [planInvoiceEnd, setPlanInvoiceEnd] = useState('');
  const [planPaymentStart, setPlanPaymentStart] = useState('');
  const [planPaymentEnd, setPlanPaymentEnd] = useState('');
  const [planShipmentMethod, setPlanShipmentMethod] = useState('');
  const [planShipmentStart, setPlanShipmentStart] = useState('');
  const [planShipmentEnd, setPlanShipmentEnd] = useState('');
  const [planEstimatedArrival, setPlanEstimatedArrival] = useState('');
  const [planReceivingStart, setPlanReceivingStart] = useState('');
  const [planReceivingEnd, setPlanReceivingEnd] = useState('');

  // Receiving: track quantities being received in this session
  const [receivingQtys, setReceivingQtys] = useState<Record<string, number>>(
    {},
  );
  const [receivingChecked, setReceivingChecked] = useState<
    Record<string, boolean>
  >({});
  const [recordingReceipt, setRecordingReceipt] = useState(false);
  const [receiptConfirmOpen, setReceiptConfirmOpen] = useState(false);
  const [pendingReceiptItems, setPendingReceiptItems] = useState<
    {
      itemType: string;
      materialId?: string;
      materialName?: string;
      toolGroupId?: string;
      toolGroupName?: string;
      groupNumber?: string;
      toolId?: string;
      toolName?: string;
      toolNumber?: string;
      quantity: number;
      unit: string;
    }[]
  >([]);

  // viewStep allows navigating to previous steps; null = follow activeStep
  const [viewStep, setViewStep] = useState<number | null>(null);

  // Invoice editing state
  const [editingInvoice, setEditingInvoice] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editTax, setEditTax] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);

  const fetchPO = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/purchase-orders/${poId}`);
      if (!res.ok) throw new Error('Failed to fetch purchase order');
      const data = await res.json();
      setPo(data);

      // Populate form fields from existing data
      if (data.paymentStartDate)
        setPaymentStartDate(
          format(new Date(data.paymentStartDate), 'yyyy-MM-dd'),
        );
      if (data.paymentEndDate)
        setPaymentEndDate(format(new Date(data.paymentEndDate), 'yyyy-MM-dd'));

      if (data.shipmentMethod) setShipmentMethod(data.shipmentMethod);
      if (data.trackingNumber) setTrackingNumber(data.trackingNumber);
      if (data.estimatedArrival)
        setEstimatedArrival(
          format(new Date(data.estimatedArrival), 'yyyy-MM-dd'),
        );
      if (data.shipmentNotes) setShipmentNotes(data.shipmentNotes);
      if (data.shipmentStartDate)
        setShipmentStartDate(
          format(new Date(data.shipmentStartDate), 'yyyy-MM-dd'),
        );
      if (data.shipmentEndDate)
        setShipmentEndDate(
          format(new Date(data.shipmentEndDate), 'yyyy-MM-dd'),
        );

      if (data.receivingStartDate)
        setReceivingStartDate(
          format(new Date(data.receivingStartDate), 'yyyy-MM-dd'),
        );
      if (data.receivingEndDate)
        setReceivingEndDate(
          format(new Date(data.receivingEndDate), 'yyyy-MM-dd'),
        );
      if (data.receivingNotes) setReceivingNotes(data.receivingNotes);

      if (data.invoiceStartDate)
        setInvoiceStartDate(
          format(new Date(data.invoiceStartDate), 'yyyy-MM-dd'),
        );
      if (data.invoiceEndDate)
        setInvoiceEndDate(format(new Date(data.invoiceEndDate), 'yyyy-MM-dd'));
      if (data.invoiceNotes) setInvoiceNotes(data.invoiceNotes);

      // Planning fields
      const fmtD = (d: any) => (d ? format(new Date(d), 'yyyy-MM-dd') : '');
      setPlanInvoiceStart(fmtD(data.plannedInvoiceStartDate));
      setPlanInvoiceEnd(fmtD(data.plannedInvoiceEndDate));
      setPlanPaymentStart(fmtD(data.plannedPaymentStartDate));
      setPlanPaymentEnd(fmtD(data.plannedPaymentEndDate));
      setPlanShipmentMethod(data.plannedShipmentMethod || '');
      setPlanShipmentStart(fmtD(data.plannedShipmentStartDate));
      setPlanShipmentEnd(fmtD(data.plannedShipmentEndDate));
      setPlanEstimatedArrival(fmtD(data.plannedEstimatedArrival));
      setPlanReceivingStart(fmtD(data.plannedReceivingStartDate));
      setPlanReceivingEnd(fmtD(data.plannedReceivingEndDate));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  const activeStep = po ? (statusToStep[po.status] ?? 0) : 0;
  const displayStep = viewStep !== null ? viewStep : activeStep;
  const isViewingPrevious = viewStep !== null && viewStep < activeStep;
  const isCompleted = po?.status === 'COMPLETED';

  // Invoice edit helpers
  const editSubtotal = editItems.reduce(
    (sum: number, item: any) => sum + (item.totalCost || 0),
    0,
  );
  const editTotal = editSubtotal + editTax - editDiscount;

  const startEditingInvoice = () => {
    if (!po) return;
    const clonedItems = (Array.isArray(po.items) ? po.items : []).map(
      (item: any) => ({ ...item }),
    );
    setEditItems(clonedItems);
    setEditTax(po.tax || 0);
    setEditDiscount(po.discount || 0);
    setEditingInvoice(true);
  };

  const cancelEditingInvoice = () => {
    setEditingInvoice(false);
    setEditItems([]);
    setEditTax(0);
    setEditDiscount(0);
  };

  const handleUpdateEditItem = (
    index: number,
    field: 'quantity' | 'unitCost',
    value: number,
  ) => {
    setEditItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        totalCost:
          field === 'quantity'
            ? value * (updated[index].unitCost || 0)
            : (updated[index].quantity || 0) * value,
      };
      return updated;
    });
  };

  const handleSaveInvoice = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/inventory/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editItems,
          subtotal: editSubtotal,
          tax: editTax,
          discount: editDiscount,
          totalAmount: editTotal,
        }),
      });
      if (!res.ok) throw new Error('Failed to update invoice');
      const updatedPO = await res.json();
      setPo(updatedPO);
      setEditingInvoice(false);
      setSuccessMsg('Invoice updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep = async (stepData: any) => {
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/inventory/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updatedPO = await res.json();
      setPo(updatedPO);
      setSuccessMsg('Saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteStep = async (stepIndex: number) => {
    const nextStatus = stepToNextStatus[stepIndex];
    if (!nextStatus) return;

    let stepData: any = { status: nextStatus };

    if (stepIndex === 0) {
      // Complete Planning step
      stepData.plannedInvoiceStartDate = planInvoiceStart || null;
      stepData.plannedInvoiceEndDate = planInvoiceEnd || null;
      stepData.plannedPaymentStartDate = planPaymentStart || null;
      stepData.plannedPaymentEndDate = planPaymentEnd || null;
      stepData.plannedShipmentMethod = planShipmentMethod || null;
      stepData.plannedShipmentStartDate = planShipmentStart || null;
      stepData.plannedShipmentEndDate = planShipmentEnd || null;
      stepData.plannedEstimatedArrival = planEstimatedArrival || null;
      stepData.plannedReceivingStartDate = planReceivingStart || null;
      stepData.plannedReceivingEndDate = planReceivingEnd || null;
      stepData.invoiceStartDate = new Date().toISOString();
    } else if (stepIndex === 1) {
      // Complete Invoice step
      stepData.invoiceEndDate = invoiceEndDate || new Date().toISOString();
      stepData.invoiceNotes = invoiceNotes;
      stepData.paymentStartDate = new Date().toISOString();
    } else if (stepIndex === 2) {
      // Complete Payment step — does NOT require full payment
      stepData.paymentEndDate = paymentEndDate || new Date().toISOString();
      stepData.shipmentStartDate = new Date().toISOString();
    } else if (stepIndex === 3) {
      // Complete Shipment step
      stepData.shipmentMethod = shipmentMethod;
      stepData.trackingNumber = trackingNumber;
      stepData.estimatedArrival = estimatedArrival;
      stepData.shipmentNotes = shipmentNotes;
      stepData.shipmentEndDate = shipmentEndDate || new Date().toISOString();
      stepData.receivingStartDate = new Date().toISOString();
    } else if (stepIndex === 4) {
      // Complete Receiving step
      stepData.receivingEndDate = receivingEndDate || new Date().toISOString();
      stepData.receivingNotes = receivingNotes;
    }

    await handleSaveStep(stepData);
    setViewStep(null); // Reset so displayStep follows the new activeStep
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${poId}/pdf`);
      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po?.poNumber || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRecordPayment = async () => {
    const amount = Number(newPaymentAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (!newPaymentMethod) {
      setError('Payment method is required');
      return;
    }
    const remaining = (po?.totalAmount || 0) - (po?.paidAmount || 0);
    if (amount > remaining) {
      setError(
        `Amount exceeds remaining balance of ₦${remaining.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      );
      return;
    }

    try {
      setRecordingPayment(true);
      setError('');
      const res = await fetch(
        `/api/inventory/purchase-orders/${poId}/payments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            paymentMethod: newPaymentMethod,
            reference: newPaymentRef,
            paymentDate: newPaymentDate,
            notes: newPaymentNotes,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record payment');
      }
      // Refresh PO
      await fetchPO();
      // Reset form
      setNewPaymentAmount('');
      setNewPaymentMethod('');
      setNewPaymentRef('');
      setNewPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setNewPaymentNotes('');
      setPaymentDialogOpen(false);
      setSuccessMsg('Payment recorded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRecordingPayment(false);
    }
  };

  // Returns a unique key for any PO line item (material or tool)
  const getItemKey = (item: any): string =>
    item.materialId || item.toolId || item.toolGroupId || '';

  // Opens confirmation dialog with validated items
  const handleRecordReceipt = () => {
    if (!po) return;
    const poItems: any[] = Array.isArray(po.items) ? po.items : [];
    const existingReceived: any[] = Array.isArray(po.receivedItems)
      ? po.receivedItems
      : [];

    // Build map of existing received quantities keyed by materialId or toolId
    const receivedMap: Record<string, number> = {};
    existingReceived.forEach((r: any) => {
      const key = r.materialId || r.toolId || r.toolGroupId;
      if (key)
        receivedMap[key] = (receivedMap[key] || 0) + (r.receivedQty || 0);
    });

    // Validate selected items
    const itemsToReceive: typeof pendingReceiptItems = [];
    for (const item of poItems) {
      const key = getItemKey(item);
      if (!receivingChecked[key]) continue;
      const qty = receivingQtys[key] || 0;
      if (qty <= 0) continue;
      const alreadyReceived = receivedMap[key] || 0;
      const remaining = (item.quantity || 0) - alreadyReceived;
      const displayName =
        item.itemType === 'tool'
          ? item.toolGroupName || key
          : item.materialName || key;
      if (qty > remaining) {
        setError(
          `Cannot receive more than remaining ${remaining} for ${displayName}`,
        );
        return;
      }
      itemsToReceive.push({
        itemType: item.itemType || 'material',
        materialId: item.materialId,
        materialName: item.materialName,
        toolGroupId: item.toolGroupId || undefined,
        toolGroupName: item.toolGroupName || undefined,
        groupNumber: item.groupNumber || undefined,
        toolId: item.toolId || undefined,
        toolName: item.toolName || undefined,
        toolNumber: item.toolNumber || undefined,
        quantity: qty,
        unit: item.unit || 'unit',
      });
    }

    if (itemsToReceive.length === 0) {
      setError('Select at least one item and enter a quantity to record.');
      return;
    }

    setError('');
    setPendingReceiptItems(itemsToReceive);
    setReceiptConfirmOpen(true);
  };

  // Calls the new API endpoint to update inventory + PO
  const handleConfirmReceipt = async () => {
    try {
      setRecordingReceipt(true);
      setError('');

      const res = await fetch(
        `/api/inventory/purchase-orders/${poId}/receive-items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: pendingReceiptItems }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to receive items');
      }

      // Reset form, close dialog, refresh PO
      setReceivingQtys({});
      setReceivingChecked({});
      setReceiptConfirmOpen(false);
      setPendingReceiptItems([]);
      await fetchPO();
      setSuccessMsg('Items received and inventory updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRecordingReceipt(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!po) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Purchase order not found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const items = Array.isArray(po.items) ? po.items : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            router.push(`/inventory/suppliers/${supplierId}/sourcing`)
          }
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Sourcing
        </Button>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {po.poNumber}
              </Typography>
              <Chip
                label={po.status.replace(/_/g, ' ')}
                size="small"
                color={
                  po.status === 'COMPLETED'
                    ? 'success'
                    : po.status === 'CANCELLED'
                      ? 'error'
                      : 'primary'
                }
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {po.supplier?.name} • Created{' '}
              {format(new Date(po.createdAt), 'dd MMM yyyy')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Download Invoice
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<ColorConnector />}
        >
          {steps.map((step, index) => {
            const isCompleted = activeStep > index;
            const isCurrent = activeStep === index;
            const isViewing = displayStep === index;
            const isClickable = isCompleted; // Can click completed steps
            return (
              <Step
                key={step.label}
                completed={isCompleted}
                onClick={() => {
                  if (isClickable) {
                    setViewStep(index);
                  } else if (isCurrent) {
                    setViewStep(null); // Reset to current
                  }
                }}
                sx={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isViewing
                          ? '#1e40af'
                          : isCompleted
                            ? '#0F172A'
                            : isCurrent
                              ? '#334155'
                              : '#e2e8f0',
                        color:
                          activeStep >= index || isViewing
                            ? 'white'
                            : '#94a3b8',
                        transition: 'all 0.3s ease',
                        outline:
                          isViewing && !isCurrent
                            ? '2px solid #1e40af'
                            : 'none',
                        outlineOffset: 2,
                      }}
                    >
                      {isCompleted && !isViewing ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        step.icon
                      )}
                    </Box>
                  )}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isViewing || isCurrent ? 700 : 500}
                    color={
                      activeStep >= index || isViewing
                        ? 'text.primary'
                        : 'text.disabled'
                    }
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Return to current step banner */}
      {isViewingPrevious && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="#1e40af">
            Viewing: {steps[viewStep!]?.label} — You can save changes here
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setViewStep(null)}
            disableElevation
            sx={{
              bgcolor: '#1e40af',
              fontWeight: 600,
              '&:hover': { bgcolor: '#1e3a8a' },
            }}
          >
            Return to {steps[activeStep]?.label}
          </Button>
        </Paper>
      )}

      {/* Step Content */}

      {/* Step 0: Planning */}
      {displayStep === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Step 1: Planning
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter all planned dates and logistics details upfront. Actuals will
            be tracked as the PO progresses through each stage.
          </Typography>

          {/* Invoice Planning */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#475569' }}
          >
            Invoice Dates
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Planned Start Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planInvoiceStart}
              onChange={(e) => setPlanInvoiceStart(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Planned End Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planInvoiceEnd}
              onChange={(e) => setPlanInvoiceEnd(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Planning */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#475569' }}
          >
            Payment Dates
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Planned Start Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planPaymentStart}
              onChange={(e) => setPlanPaymentStart(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Planned End Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planPaymentEnd}
              onChange={(e) => setPlanPaymentEnd(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Shipment Planning */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#475569' }}
          >
            Shipment Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Planned Shipment Method"
              variant="standard"
              value={planShipmentMethod}
              onChange={(e) => setPlanShipmentMethod(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Planned Start Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planShipmentStart}
              onChange={(e) => setPlanShipmentStart(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Planned End Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planShipmentEnd}
              onChange={(e) => setPlanShipmentEnd(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Estimated Arrival"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planEstimatedArrival}
              onChange={(e) => setPlanEstimatedArrival(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Receiving Planning */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#475569' }}
          >
            Receiving Dates
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Planned Start Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planReceivingStart}
              onChange={(e) => setPlanReceivingStart(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Planned End Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={planReceivingEnd}
              onChange={(e) => setPlanReceivingEnd(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}
          >
            <Button
              variant="outlined"
              onClick={() =>
                handleSaveStep({
                  plannedInvoiceStartDate: planInvoiceStart || null,
                  plannedInvoiceEndDate: planInvoiceEnd || null,
                  plannedPaymentStartDate: planPaymentStart || null,
                  plannedPaymentEndDate: planPaymentEnd || null,
                  plannedShipmentMethod: planShipmentMethod || null,
                  plannedShipmentStartDate: planShipmentStart || null,
                  plannedShipmentEndDate: planShipmentEnd || null,
                  plannedEstimatedArrival: planEstimatedArrival || null,
                  plannedReceivingStartDate: planReceivingStart || null,
                  plannedReceivingEndDate: planReceivingEnd || null,
                })
              }
              disabled={saving}
            >
              Save Plan
            </Button>
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={() => handleCompleteStep(0)}
              disabled={saving || isCompleted}
              disableElevation
              sx={{
                bgcolor: '#0F172A',
                fontWeight: 600,
                '&:hover': { bgcolor: '#1E293B' },
              }}
            >
              {saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                ' Move to Invoice'
              )}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 1: Invoice */}
      {displayStep === 1 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
            Step 2: Invoice Details
          </Typography>
          {isCompleted && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This purchase order is completed. All fields are read-only.
            </Alert>
          )}

          {/* Edit Invoice Button */}
          {!editingInvoice && !isCompleted && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={startEditingInvoice}
                sx={{ fontWeight: 600 }}
              >
                Edit Invoice
              </Button>
            </Box>
          )}

          {/* Items Table */}
          <TableContainer
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: editingInvoice ? '#3b82f6' : 'divider',
              borderRadius: 1,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: editingInvoice ? '#1e40af' : '#f8fafc' }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Material / Tool
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Part No.
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Unit
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Qty
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Unit Cost
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: editingInvoice ? 'white' : 'inherit',
                    }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(editingInvoice ? editItems : items).map(
                  (item: any, i: number) => (
                    <TableRow
                      key={i}
                      sx={editingInvoice ? { bgcolor: '#eff6ff' } : {}}
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        {item.itemType === 'tool'
                          ? item.toolGroupName || item.toolName
                          : item.materialName}
                      </TableCell>
                      <TableCell>{item.partNumber}</TableCell>
                      <TableCell align="center">{item.unit}</TableCell>
                      <TableCell align="center">
                        {editingInvoice ? (
                          <TextField
                            type="number"
                            size="small"
                            variant="outlined"
                            value={item.quantity || 0}
                            onChange={(e) =>
                              handleUpdateEditItem(
                                i,
                                'quantity',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingInvoice ? (
                          <TextField
                            type="number"
                            size="small"
                            variant="outlined"
                            value={item.unitCost || 0}
                            onChange={(e) =>
                              handleUpdateEditItem(
                                i,
                                'unitCost',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        ) : (
                          <>
                            ₦
                            {(item.unitCost || 0).toLocaleString('en-NG', {
                              minimumFractionDigits: 2,
                            })}
                          </>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={editingInvoice ? 700 : 400}
                        >
                          ₦
                          {(item.totalCost || 0).toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: 300 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₦
                  {(editingInvoice
                    ? editSubtotal
                    : po.subtotal || 0
                  ).toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Tax
                </Typography>
                {editingInvoice ? (
                  <TextField
                    type="number"
                    size="small"
                    variant="outlined"
                    value={editTax}
                    onChange={(e) =>
                      setEditTax(parseFloat(e.target.value) || 0)
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: 120 }}
                  />
                ) : (
                  <Typography variant="body2">
                    +₦
                    {(po.tax || 0).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Discount
                </Typography>
                {editingInvoice ? (
                  <TextField
                    type="number"
                    size="small"
                    variant="outlined"
                    value={editDiscount}
                    onChange={(e) =>
                      setEditDiscount(parseFloat(e.target.value) || 0)
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: 120 }}
                  />
                ) : (
                  <Typography variant="body2" color="error.main">
                    -₦
                    {(po.discount || 0).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  ₦
                  {(editingInvoice
                    ? editTotal
                    : po.totalAmount || 0
                  ).toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Edit mode actions */}
          {editingInvoice && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mb: 3,
              }}
            >
              <Button
                variant="outlined"
                onClick={cancelEditingInvoice}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveInvoice}
                disabled={saving}
                disableElevation
                sx={{
                  bgcolor: '#16a34a',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Save Invoice Changes'
                )}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Dates */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="Actual Invoice Start Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={invoiceStartDate}
              onChange={(e) => setInvoiceStartDate(e.target.value)}
              disabled={isCompleted}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Actual Invoice End Date"
              type="date"
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={invoiceEndDate}
              onChange={(e) => setInvoiceEndDate(e.target.value)}
              disabled={isCompleted}
              sx={{ minWidth: 200 }}
            />
          </Box>
          {(po.plannedInvoiceStartDate || po.plannedInvoiceEndDate) &&
            (() => {
              const startOverdue =
                po.plannedInvoiceStartDate &&
                invoiceStartDate &&
                new Date(invoiceStartDate) >
                  new Date(po.plannedInvoiceStartDate);
              const endOverdue =
                po.plannedInvoiceEndDate &&
                invoiceEndDate &&
                new Date(invoiceEndDate) > new Date(po.plannedInvoiceEndDate);
              const anyOverdue = startOverdue || endOverdue;
              return (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    mt: 1,
                    mb: 2,
                    px: 1.5,
                    py: 0.75,
                    bgcolor: anyOverdue ? '#fef2f2' : '#f0f9ff',
                    borderRadius: 1,
                    border: `1px solid ${anyOverdue ? '#fecaca' : '#bae6fd'}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color={anyOverdue ? '#b91c1c' : '#0369a1'}
                    fontWeight={600}
                  >
                    {anyOverdue ? '⚠ Overdue — Planned:' : 'Planned:'}
                  </Typography>
                  {po.plannedInvoiceStartDate && (
                    <Chip
                      label={`Start: ${format(new Date(po.plannedInvoiceStartDate), 'dd MMM yyyy')}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: startOverdue ? '#fee2e2' : '#e0f2fe',
                        color: startOverdue ? '#b91c1c' : '#0369a1',
                        fontWeight: startOverdue ? 700 : 500,
                      }}
                    />
                  )}
                  {po.plannedInvoiceEndDate && (
                    <Chip
                      label={`End: ${format(new Date(po.plannedInvoiceEndDate), 'dd MMM yyyy')}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: endOverdue ? '#fee2e2' : '#e0f2fe',
                        color: endOverdue ? '#b91c1c' : '#0369a1',
                        fontWeight: endOverdue ? 700 : 500,
                      }}
                    />
                  )}
                </Box>
              );
            })()}
          <TextField
            label="Invoice Notes"
            variant="standard"
            fullWidth
            multiline
            rows={2}
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            disabled={isCompleted}
            sx={{ mb: 3 }}
          />

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
          >
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => setViewStep(0)}
              sx={{ color: '#64748b', fontWeight: 600 }}
            >
              Previous Step
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={() => handleCompleteStep(1)}
                disabled={saving || isCompleted}
                disableElevation
                sx={{
                  bgcolor: '#0F172A',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#1E293B' },
                }}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Move to Payment'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Step 2: Payment (Partial Payments) */}
      {displayStep === 2 &&
        (() => {
          const payments = Array.isArray(po.payments) ? po.payments : [];
          const totalPaid = po.paidAmount || 0;
          const totalAmount = po.totalAmount || 0;
          const remaining = totalAmount - totalPaid;
          const pctPaid = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
          const isFullyPaid = remaining <= 0;

          return (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Step 3: Payment Tracking
                </Typography>
                {!isFullyPaid && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setPaymentDialogOpen(true)}
                    disableElevation
                    sx={{
                      bgcolor: '#0F172A',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#1E293B' },
                    }}
                  >
                    Record Payment
                  </Button>
                )}
              </Box>

              {/* Payment Progress */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  border: '1px solid',
                  borderColor: isFullyPaid ? '#bbf7d0' : 'divider',
                  borderRadius: 1.5,
                  bgcolor: isFullyPaid ? '#f0fdf4' : '#f8fafc',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {isFullyPaid ? '✓ Fully Paid' : 'Payment Progress'}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {pctPaid.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(pctPaid, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 1.5,
                    bgcolor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      bgcolor: isFullyPaid ? '#16a34a' : '#0F172A',
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Paid:{' '}
                    <strong>
                      ₦
                      {totalPaid.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total:{' '}
                    <strong>
                      ₦
                      {totalAmount.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </Typography>
                </Box>
                {!isFullyPaid && (
                  <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                    Remaining: ₦
                    {remaining.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                )}
              </Paper>

              {/* Payment History */}
              {payments.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 1.5 }}
                  >
                    Payment History ({payments.length} payment
                    {payments.length !== 1 ? 's' : ''})
                  </Typography>
                  <TableContainer
                    sx={{
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Reference
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Amount
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Recorded By
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((p: any, i: number) => (
                          <TableRow key={p.id}>
                            <TableCell>{payments.length - i}</TableCell>
                            <TableCell>
                              {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>{p.paymentMethod}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {p.reference || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                ₦
                                {p.amount.toLocaleString('en-NG', {
                                  minimumFractionDigits: 2,
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 150,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.notes || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>{p.recordedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {payments.length === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No payments recorded yet. Click "Record Payment" to add the
                  first payment.
                </Alert>
              )}

              {/* Dates */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  label="Actual Payment Start Date"
                  type="date"
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  value={paymentStartDate}
                  onChange={(e) => setPaymentStartDate(e.target.value)}
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label="Actual Payment End Date"
                  type="date"
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  value={paymentEndDate}
                  onChange={(e) => setPaymentEndDate(e.target.value)}
                  sx={{ minWidth: 200 }}
                />
              </Box>
              {(po.plannedPaymentStartDate || po.plannedPaymentEndDate) &&
                (() => {
                  const startOverdue =
                    po.plannedPaymentStartDate &&
                    paymentStartDate &&
                    new Date(paymentStartDate) >
                      new Date(po.plannedPaymentStartDate);
                  const endOverdue =
                    po.plannedPaymentEndDate &&
                    paymentEndDate &&
                    new Date(paymentEndDate) >
                      new Date(po.plannedPaymentEndDate);
                  const anyOverdue = startOverdue || endOverdue;
                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mt: 1,
                        mb: 2,
                        px: 1.5,
                        py: 0.75,
                        bgcolor: anyOverdue ? '#fef2f2' : '#f0f9ff',
                        borderRadius: 1,
                        border: `1px solid ${anyOverdue ? '#fecaca' : '#bae6fd'}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color={anyOverdue ? '#b91c1c' : '#0369a1'}
                        fontWeight={600}
                      >
                        {anyOverdue ? '⚠ Overdue — Planned:' : 'Planned:'}
                      </Typography>
                      {po.plannedPaymentStartDate && (
                        <Chip
                          label={`Start: ${format(new Date(po.plannedPaymentStartDate), 'dd MMM yyyy')}`}
                          size="small"
                          sx={{
                            fontSize: 11,
                            bgcolor: startOverdue ? '#fee2e2' : '#e0f2fe',
                            color: startOverdue ? '#b91c1c' : '#0369a1',
                            fontWeight: startOverdue ? 700 : 500,
                          }}
                        />
                      )}
                      {po.plannedPaymentEndDate && (
                        <Chip
                          label={`End: ${format(new Date(po.plannedPaymentEndDate), 'dd MMM yyyy')}`}
                          size="small"
                          sx={{
                            fontSize: 11,
                            bgcolor: endOverdue ? '#fee2e2' : '#e0f2fe',
                            color: endOverdue ? '#b91c1c' : '#0369a1',
                            fontWeight: endOverdue ? 700 : 500,
                          }}
                        />
                      )}
                    </Box>
                  );
                })()}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setViewStep(1)}
                  sx={{ color: '#64748b', fontWeight: 600 }}
                >
                  Previous Step
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleSaveStep({
                        paymentStartDate,
                        paymentEndDate,
                      })
                    }
                    disabled={saving}
                  >
                    Save Dates
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<NextIcon />}
                    onClick={() => handleCompleteStep(2)}
                    disabled={saving || isCompleted}
                    disableElevation
                    sx={{
                      bgcolor: '#0F172A',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#1E293B' },
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Move to Shipment'
                    )}
                  </Button>
                </Box>
              </Box>
              {/* {!isFullyPaid && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "right", mt: 1 }}
                >
                  All payments must be completed before advancing to the next
                  step.
                </Typography>
              )} */}

              {/* Record Payment Dialog */}
              <Dialog
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle sx={{ fontWeight: 700 }}>
                  Record Payment
                </DialogTitle>
                <DialogContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Remaining balance:{' '}
                    <strong>
                      ₦
                      {remaining.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                  >
                    <TextField
                      label="Amount (₦) *"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      inputProps={{ min: 0, max: remaining, step: '0.01' }}
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      label="Payment Method *"
                      variant="outlined"
                      size="small"
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      placeholder="e.g. Bank Transfer, Cash, Cheque"
                      fullWidth
                    />
                    <TextField
                      label="Reference / Transaction ID"
                      variant="outlined"
                      size="small"
                      value={newPaymentRef}
                      onChange={(e) => setNewPaymentRef(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Payment Date"
                      type="date"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Notes"
                      variant="outlined"
                      size="small"
                      value={newPaymentNotes}
                      onChange={(e) => setNewPaymentNotes(e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    onClick={() => setPaymentDialogOpen(false)}
                    disabled={recordingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleRecordPayment}
                    disabled={recordingPayment}
                    disableElevation
                    sx={{
                      bgcolor: '#0F172A',
                      '&:hover': { bgcolor: '#1E293B' },
                    }}
                  >
                    {recordingPayment ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Record Payment'
                    )}
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          );
        })()}

      {/* Step 3: Shipment */}
      {displayStep === 3 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
            Step 4: Shipment Tracking
          </Typography>

          {/* Payment incomplete warning */}
          {po.totalAmount > 0 && (po.paidAmount || 0) < po.totalAmount && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                border: '1px solid #fbbf24',
                bgcolor: '#fffbeb',
                '& .MuiAlert-icon': { color: '#d97706' },
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Payment Outstanding
              </Typography>
              <Typography variant="body2">
                Shipment is proceeding with incomplete payment. ₦
                {(po.paidAmount || 0).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                })}{' '}
                of ₦
                {po.totalAmount.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                })}{' '}
                paid —{' '}
                <strong>
                  ₦
                  {(po.totalAmount - (po.paidAmount || 0)).toLocaleString(
                    'en-NG',
                    { minimumFractionDigits: 2 },
                  )}{' '}
                  remaining
                </strong>
              </Typography>
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Shipping Method"
                variant="standard"
                value={shipmentMethod}
                onChange={(e) => setShipmentMethod(e.target.value)}
                placeholder="e.g. Road Freight, Air, Courier"
                sx={{ minWidth: 250, flex: 1 }}
              />
              <TextField
                label="Tracking Number"
                variant="standard"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking/waybill number"
                sx={{ minWidth: 250, flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Actual Arrival"
                type="date"
                variant="standard"
                InputLabelProps={{ shrink: true }}
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <TextField
                label="Actual Shipment Start Date"
                type="date"
                variant="standard"
                InputLabelProps={{ shrink: true }}
                value={shipmentStartDate}
                onChange={(e) => setShipmentStartDate(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <TextField
                label="Actual Shipment End Date"
                type="date"
                variant="standard"
                InputLabelProps={{ shrink: true }}
                value={shipmentEndDate}
                onChange={(e) => setShipmentEndDate(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </Box>
            <TextField
              label="Shipment Notes"
              variant="standard"
              fullWidth
              multiline
              rows={2}
              value={shipmentNotes}
              onChange={(e) => setShipmentNotes(e.target.value)}
            />
          </Box>
          {(po.plannedShipmentStartDate ||
            po.plannedShipmentEndDate ||
            po.plannedShipmentMethod ||
            po.plannedEstimatedArrival) &&
            (() => {
              const startOverdue =
                po.plannedShipmentStartDate &&
                shipmentStartDate &&
                new Date(shipmentStartDate) >
                  new Date(po.plannedShipmentStartDate);
              const endOverdue =
                po.plannedShipmentEndDate &&
                shipmentEndDate &&
                new Date(shipmentEndDate) > new Date(po.plannedShipmentEndDate);
              const etaOverdue =
                po.plannedEstimatedArrival &&
                estimatedArrival &&
                new Date(estimatedArrival) >
                  new Date(po.plannedEstimatedArrival);
              const anyOverdue = startOverdue || endOverdue || etaOverdue;
              return (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    mt: 2,
                    px: 1.5,
                    py: 0.75,
                    bgcolor: anyOverdue ? '#fef2f2' : '#f0f9ff',
                    borderRadius: 1,
                    border: `1px solid ${anyOverdue ? '#fecaca' : '#bae6fd'}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color={anyOverdue ? '#b91c1c' : '#0369a1'}
                    fontWeight={600}
                  >
                    {anyOverdue ? '⚠ Overdue — Planned:' : ' Planned:'}
                  </Typography>
                  {po.plannedShipmentMethod && (
                    <Chip
                      label={`Method: ${po.plannedShipmentMethod}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: '#e0f2fe',
                        color: '#0369a1',
                      }}
                    />
                  )}
                  {po.plannedShipmentStartDate && (
                    <Chip
                      label={`Start: ${format(new Date(po.plannedShipmentStartDate), 'dd MMM yyyy')}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: startOverdue ? '#fee2e2' : '#e0f2fe',
                        color: startOverdue ? '#b91c1c' : '#0369a1',
                        fontWeight: startOverdue ? 700 : 500,
                      }}
                    />
                  )}
                  {po.plannedShipmentEndDate && (
                    <Chip
                      label={`End: ${format(new Date(po.plannedShipmentEndDate), 'dd MMM yyyy')}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: endOverdue ? '#fee2e2' : '#e0f2fe',
                        color: endOverdue ? '#b91c1c' : '#0369a1',
                        fontWeight: endOverdue ? 700 : 500,
                      }}
                    />
                  )}
                  {po.plannedEstimatedArrival && (
                    <Chip
                      label={`ETA: ${format(new Date(po.plannedEstimatedArrival), 'dd MMM yyyy')}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        bgcolor: etaOverdue ? '#fee2e2' : '#e0f2fe',
                        color: etaOverdue ? '#b91c1c' : '#0369a1',
                        fontWeight: etaOverdue ? 700 : 500,
                      }}
                    />
                  )}
                </Box>
              );
            })()}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              mt: 4,
            }}
          >
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => setViewStep(2)}
              sx={{ color: '#64748b', fontWeight: 600 }}
            >
              Previous Step
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  handleSaveStep({
                    shipmentMethod,
                    trackingNumber,
                    estimatedArrival,
                    shipmentNotes,
                    shipmentStartDate,
                    shipmentEndDate,
                  })
                }
                disabled={saving}
              >
                Save Progress
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={() => handleCompleteStep(3)}
                disabled={saving || isCompleted}
                disableElevation
                sx={{
                  bgcolor: '#0F172A',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#1E293B' },
                }}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  ' Move to Receiving'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Step 4: Receiving */}
      {displayStep === 4 &&
        (() => {
          const poItems: any[] = Array.isArray(po.items) ? po.items : [];
          const existingReceived: any[] = Array.isArray(po.receivedItems)
            ? po.receivedItems
            : [];

          // Build cumulative received map keyed by materialId, toolId, or toolGroupId
          const receivedMap: Record<string, number> = {};
          existingReceived.forEach((r: any) => {
            const key = r.materialId || r.toolId || r.toolGroupId;
            if (key)
              receivedMap[key] = (receivedMap[key] || 0) + (r.receivedQty || 0);
          });

          const totalOrdered = poItems.reduce(
            (sum: number, i: any) => sum + (i.quantity || 0),
            0,
          );
          const totalReceived = poItems.reduce(
            (sum: number, i: any) => sum + (receivedMap[getItemKey(i)] || 0),
            0,
          );
          const allFullyReceived = poItems.every(
            (i: any) => (receivedMap[getItemKey(i)] || 0) >= (i.quantity || 0),
          );
          const hasPartialReceipt = totalReceived > 0 && !allFullyReceived;
          const receivedPct =
            totalOrdered > 0
              ? Math.min((totalReceived / totalOrdered) * 100, 100)
              : 0;

          // Items the user just checked for this receipt session
          const selectedForGRN = poItems
            .filter(
              (i: any) =>
                receivingChecked[getItemKey(i)] &&
                (receivingQtys[getItemKey(i)] || 0) > 0,
            )
            .map((i: any) => ({
              itemType: i.itemType || 'material',
              materialId: i.materialId,
              quantity: receivingQtys[getItemKey(i)] || 0,
            }));

          return (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Step 5: Receiving Materials
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Select items received in this shipment. You can receive items
                  in parts — just like partial payments.
                </Typography>

                {/* Receipt progress alert */}
                {hasPartialReceipt && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2, border: '1px solid #fbbf24' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Partial Receipt — {totalReceived} of {totalOrdered} items
                      received ({receivedPct.toFixed(0)}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Some items have not been fully received. Record additional
                      receipts below.
                    </Typography>
                  </Alert>
                )}
                {allFullyReceived && totalReceived > 0 && (
                  <Alert
                    severity="success"
                    sx={{ mb: 2, border: '1px solid #86efac' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      All items fully received ({totalReceived} of{' '}
                      {totalOrdered})
                    </Typography>
                  </Alert>
                )}

                {po.grnId && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    GRN has been created and linked to this purchase order.
                    {po.grn && ` (${po.grn.grnNumber})`}
                  </Alert>
                )}

                {/* Overall receiving progress bar */}
                {totalOrdered > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Receiving Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {receivedPct.toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={receivedPct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: allFullyReceived
                            ? '#16a34a'
                            : receivedPct >= 50
                              ? '#f59e0b'
                              : receivedPct > 0
                                ? '#ef4444'
                                : '#cbd5e1',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        0
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalOrdered} items
                      </Typography>
                    </Box>
                  </Paper>
                )}

                {/* Items table */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ p: 2, pb: 1 }}
                  >
                    Items to Receive
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#0F172A' }}>
                          <TableCell padding="checkbox" sx={{ color: 'white' }}>
                            <Checkbox
                              size="small"
                              sx={{
                                color: 'white',
                                '&.Mui-checked': { color: 'white' },
                              }}
                              checked={
                                poItems.length > 0 &&
                                poItems.every(
                                  (i: any) => receivingChecked[getItemKey(i)],
                                )
                              }
                              indeterminate={
                                poItems.some(
                                  (i: any) => receivingChecked[getItemKey(i)],
                                ) &&
                                !poItems.every(
                                  (i: any) => receivingChecked[getItemKey(i)],
                                )
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const next: Record<string, boolean> = {};
                                poItems.forEach((i: any) => {
                                  const key = getItemKey(i);
                                  const remaining =
                                    (i.quantity || 0) - (receivedMap[key] || 0);
                                  if (remaining > 0) next[key] = checked;
                                });
                                setReceivingChecked(next);
                                if (checked) {
                                  const qtys: Record<string, number> = {
                                    ...receivingQtys,
                                  };
                                  poItems.forEach((i: any) => {
                                    const key = getItemKey(i);
                                    const remaining =
                                      (i.quantity || 0) -
                                      (receivedMap[key] || 0);
                                    if (remaining > 0 && !qtys[key])
                                      qtys[key] = remaining;
                                  });
                                  setReceivingQtys(qtys);
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Item
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            PO Qty
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Received
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Remaining
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Progress
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Receiving Now
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {poItems.map((item: any) => {
                          const key = getItemKey(item);
                          const isTool = item.itemType === 'tool';
                          const displayName = isTool
                            ? item.toolName || item.toolGroupName || key
                            : item.materialName || key;
                          const subLabel = isTool
                            ? item.toolNumber || item.groupNumber
                            : item.partNumber;
                          const ordered = item.quantity || 0;
                          const received = receivedMap[key] || 0;
                          const remaining = Math.max(0, ordered - received);
                          const itemPct =
                            ordered > 0
                              ? Math.min((received / ordered) * 100, 100)
                              : 0;
                          const fullyReceived = remaining <= 0;

                          return (
                            <TableRow
                              key={key}
                              sx={{
                                bgcolor: fullyReceived
                                  ? '#f0fdf4'
                                  : receivingChecked[key]
                                    ? '#eff6ff'
                                    : 'transparent',
                                opacity: fullyReceived ? 0.75 : 1,
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={!!receivingChecked[key]}
                                  disabled={fullyReceived}
                                  onChange={(e) => {
                                    setReceivingChecked((prev) => ({
                                      ...prev,
                                      [key]: e.target.checked,
                                    }));
                                    if (
                                      e.target.checked &&
                                      !receivingQtys[key]
                                    ) {
                                      setReceivingQtys((prev) => ({
                                        ...prev,
                                        [key]: remaining,
                                      }));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                  }}
                                >
                                  <Typography variant="body2" fontWeight={600}>
                                    {displayName}
                                  </Typography>
                                  {isTool && (
                                    <Chip
                                      label="Tool"
                                      size="small"
                                      sx={{
                                        fontSize: 10,
                                        height: 18,
                                        bgcolor: '#e0e7ff',
                                        color: '#4338ca',
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                </Box>
                                {subLabel && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {subLabel}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {ordered} {item.unit || 'unit'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color={
                                    fullyReceived
                                      ? '#16a34a'
                                      : received > 0
                                        ? '#d97706'
                                        : '#64748b'
                                  }
                                >
                                  {received}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color={remaining > 0 ? '#b91c1c' : '#16a34a'}
                                >
                                  {remaining}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ minWidth: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={itemPct}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: fullyReceived
                                        ? '#16a34a'
                                        : received > 0
                                          ? '#f59e0b'
                                          : '#cbd5e1',
                                      borderRadius: 3,
                                    },
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {itemPct.toFixed(0)}%
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 100 }}>
                                {fullyReceived ? (
                                  <Chip
                                    label="Complete"
                                    size="small"
                                    sx={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      bgcolor: '#dcfce7',
                                      color: '#16a34a',
                                    }}
                                  />
                                ) : receivingChecked[key] ? (
                                  <TextField
                                    type="number"
                                    variant="standard"
                                    size="small"
                                    value={receivingQtys[key] || ''}
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        Math.min(
                                          remaining,
                                          Number(e.target.value) || 0,
                                        ),
                                      );
                                      setReceivingQtys((prev) => ({
                                        ...prev,
                                        [key]: val,
                                      }));
                                    }}
                                    inputProps={{
                                      min: 0,
                                      max: remaining,
                                      style: { textAlign: 'right', width: 60 },
                                    }}
                                  />
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Record Receipt Button */}
                {!allFullyReceived && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}
                  >
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={handleRecordReceipt}
                      disabled={recordingReceipt || selectedForGRN.length === 0}
                      sx={{
                        bgcolor: '#0F172A',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#334155' },
                      }}
                    >
                      {recordingReceipt ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        `Record Receipt (${selectedForGRN.length} item${selectedForGRN.length !== 1 ? 's' : ''})`
                      )}
                    </Button>
                  </Box>
                )}

                {/* Receipt history */}
                {existingReceived.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Receipt History ({existingReceived.length} entries)
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                              Item
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, fontSize: 12 }}
                            >
                              Qty Received
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                              Date
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {existingReceived.map((r: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Typography variant="body2">
                                  {r.itemType === 'tool'
                                    ? r.toolName ||
                                      r.toolGroupName ||
                                      r.toolId ||
                                      r.toolGroupId
                                    : r.materialName || r.materialId}
                                </Typography>
                                {r.itemType === 'tool' && (
                                  <Chip
                                    label="Tool"
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      height: 16,
                                      bgcolor: '#e0e7ff',
                                      color: '#4338ca',
                                      fontWeight: 600,
                                      ml: 0.5,
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={600}>
                                  {r.receivedQty}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {r.receivedAt
                                    ? format(
                                        new Date(r.receivedAt),
                                        'dd MMM yyyy HH:mm',
                                      )
                                    : '—'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                <Divider sx={{ mb: 3 }} />

                {/* Dates and notes */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                  <TextField
                    label="Receiving Start Date"
                    type="date"
                    variant="standard"
                    InputLabelProps={{ shrink: true }}
                    value={receivingStartDate}
                    onChange={(e) => setReceivingStartDate(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <TextField
                    label="Receiving End Date"
                    type="date"
                    variant="standard"
                    InputLabelProps={{ shrink: true }}
                    value={receivingEndDate}
                    onChange={(e) => setReceivingEndDate(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                </Box>
                {(po.plannedReceivingStartDate || po.plannedReceivingEndDate) &&
                  (() => {
                    const startOverdue =
                      po.plannedReceivingStartDate &&
                      receivingStartDate &&
                      new Date(receivingStartDate) >
                        new Date(po.plannedReceivingStartDate);
                    const endOverdue =
                      po.plannedReceivingEndDate &&
                      receivingEndDate &&
                      new Date(receivingEndDate) >
                        new Date(po.plannedReceivingEndDate);
                    const anyOverdue = startOverdue || endOverdue;
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          mt: 1,
                          mb: 2,
                          px: 1.5,
                          py: 0.75,
                          bgcolor: anyOverdue ? '#fef2f2' : '#f0f9ff',
                          borderRadius: 1,
                          border: `1px solid ${anyOverdue ? '#fecaca' : '#bae6fd'}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={anyOverdue ? '#b91c1c' : '#0369a1'}
                          fontWeight={600}
                        >
                          {anyOverdue ? 'Overdue — Planned:' : 'Planned:'}
                        </Typography>
                        {po.plannedReceivingStartDate && (
                          <Chip
                            label={`Start: ${format(new Date(po.plannedReceivingStartDate), 'dd MMM yyyy')}`}
                            size="small"
                            sx={{
                              fontSize: 11,
                              bgcolor: startOverdue ? '#fee2e2' : '#e0f2fe',
                              color: startOverdue ? '#b91c1c' : '#0369a1',
                              fontWeight: startOverdue ? 700 : 500,
                            }}
                          />
                        )}
                        {po.plannedReceivingEndDate && (
                          <Chip
                            label={`End: ${format(new Date(po.plannedReceivingEndDate), 'dd MMM yyyy')}`}
                            size="small"
                            sx={{
                              fontSize: 11,
                              bgcolor: endOverdue ? '#fee2e2' : '#e0f2fe',
                              color: endOverdue ? '#b91c1c' : '#0369a1',
                              fontWeight: endOverdue ? 700 : 500,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })()}
                <TextField
                  label="Receiving Notes"
                  variant="standard"
                  fullWidth
                  multiline
                  rows={2}
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setViewStep(3)}
                    sx={{ color: '#64748b', fontWeight: 600 }}
                  >
                    Previous Step
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        handleSaveStep({
                          receivingStartDate,
                          receivingEndDate,
                          receivingNotes,
                        })
                      }
                      disabled={saving}
                    >
                      Save Progress
                    </Button>
                    <Button
                      variant="contained"
                      endIcon={<CheckIcon />}
                      onClick={() => handleCompleteStep(4)}
                      disabled={saving || isCompleted}
                      disableElevation
                      sx={{
                        bgcolor: '#16a34a',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#15803d' },
                      }}
                    >
                      {saving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Mark as Completed'
                      )}
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Receipt Confirmation Dialog */}
              <Dialog
                open={receiptConfirmOpen}
                onClose={() =>
                  !recordingReceipt && setReceiptConfirmOpen(false)
                }
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Confirm Receipt & Update Inventory
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    The following items will be marked as received and{' '}
                    <strong>
                      inventory stock will be updated automatically
                    </strong>
                    .
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#0F172A' }}>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Item
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Quantity
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Unit
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingReceiptItems.map((item, idx) => (
                          <TableRow key={item.materialId || item.toolId || idx}>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                }}
                              >
                                <Typography variant="body2" fontWeight={600}>
                                  {item.itemType === 'tool'
                                    ? item.toolGroupName || item.toolName
                                    : item.materialName}
                                </Typography>
                                {item.itemType === 'tool' && (
                                  <Chip
                                    label="Tool"
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      height: 18,
                                      bgcolor: '#e0e7ff',
                                      color: '#4338ca',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="#16a34a"
                              >
                                {item.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.unit}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>{pendingReceiptItems.length}</strong> item
                      {pendingReceiptItems.length !== 1
                        ? 's'
                        : ''} totalling{' '}
                      <strong>
                        {pendingReceiptItems.reduce(
                          (sum, i) => sum + i.quantity,
                          0,
                        )}
                      </strong>{' '}
                      units will be added to inventory.
                    </Typography>
                  </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    onClick={() => setReceiptConfirmOpen(false)}
                    disabled={recordingReceipt}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirmReceipt}
                    disabled={recordingReceipt}
                    disableElevation
                    sx={{
                      bgcolor: '#16a34a',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#15803d' },
                    }}
                  >
                    {recordingReceipt ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Confirm & Update Inventory'
                    )}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          );
        })()}

      {/* Completed View */}
      {displayStep >= 5 &&
        (() => {
          const totalAmount = po.totalAmount || 0;
          const paidAmount = po.paidAmount || 0;
          const paymentIncomplete = totalAmount > 0 && paidAmount < totalAmount;
          const remaining = totalAmount - paidAmount;

          // Helper to compute day variance
          const dayDiff = (actual: string | null, planned: string | null) => {
            if (!actual || !planned) return null;
            const diffMs =
              new Date(actual).getTime() - new Date(planned).getTime();
            return Math.round(diffMs / (1000 * 60 * 60 * 24));
          };

          const stages = [
            {
              label: 'Invoice',
              plannedStart: po.plannedInvoiceStartDate,
              plannedEnd: po.plannedInvoiceEndDate,
              actualStart: po.invoiceStartDate,
              actualEnd: po.invoiceEndDate,
            },
            {
              label: 'Payment',
              plannedStart: po.plannedPaymentStartDate,
              plannedEnd: po.plannedPaymentEndDate,
              actualStart: po.paymentStartDate,
              actualEnd: po.paymentEndDate,
            },
            {
              label: 'Shipment',
              plannedStart: po.plannedShipmentStartDate,
              plannedEnd: po.plannedShipmentEndDate,
              actualStart: po.shipmentStartDate,
              actualEnd: po.shipmentEndDate,
            },
            {
              label: 'Receiving',
              plannedStart: po.plannedReceivingStartDate,
              plannedEnd: po.plannedReceivingEndDate,
              actualStart: po.receivingStartDate,
              actualEnd: po.receivingEndDate,
            },
          ];

          const hasAnyPlanned = stages.some(
            (s) => s.plannedStart || s.plannedEnd,
          );

          return (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: '1px solid',
                borderColor: '#bbf7d0',
                borderRadius: 2,
                bgcolor: '#f0fdf4',
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <CheckIcon sx={{ color: '#16a34a', fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700} color="#16a34a">
                  Sourcing Complete
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This purchase order has been fully processed through all steps.
              </Typography>

              {/* Payment Incomplete Alert */}
              {paymentIncomplete && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    border: '1px solid #fbbf24',
                    bgcolor: '#fffbeb',
                    '& .MuiAlert-icon': { color: '#d97706' },
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Payment Outstanding
                  </Typography>
                  <Typography variant="body2">
                    ₦
                    {paidAmount.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    of ₦
                    {totalAmount.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    paid &nbsp;—&nbsp;
                    <strong>
                      ₦
                      {remaining.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      remaining
                    </strong>
                  </Typography>
                </Alert>
              )}

              {/* Receiving Incomplete Alert */}
              {(() => {
                const compItems: any[] = Array.isArray(po.items)
                  ? po.items
                  : [];
                const compReceived: any[] = Array.isArray(po.receivedItems)
                  ? po.receivedItems
                  : [];
                const compReceivedMap: Record<string, number> = {};
                compReceived.forEach((r: any) => {
                  const key = r.materialId || r.toolId || r.toolGroupId;
                  if (key)
                    compReceivedMap[key] =
                      (compReceivedMap[key] || 0) + (r.receivedQty || 0);
                });
                const compTotalOrdered = compItems.reduce(
                  (s: number, i: any) => s + (i.quantity || 0),
                  0,
                );
                const compTotalReceived = compItems.reduce(
                  (s: number, i: any) =>
                    s +
                    (compReceivedMap[
                      i.materialId || i.toolId || i.toolGroupId
                    ] || 0),
                  0,
                );
                const receiptIncomplete =
                  compTotalOrdered > 0 && compTotalReceived < compTotalOrdered;
                if (!receiptIncomplete) return null;
                return (
                  <Alert
                    severity="warning"
                    sx={{
                      mb: 3,
                      border: '1px solid #fbbf24',
                      bgcolor: '#fffbeb',
                      '& .MuiAlert-icon': { color: '#d97706' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ mb: 0.5 }}
                    >
                      Items Not Fully Received
                    </Typography>
                    <Typography variant="body2">
                      {compTotalReceived} of {compTotalOrdered} items received —
                      use the Receiving step to record additional receipts.
                    </Typography>
                  </Alert>
                );
              })()}

              {/* Timeline Summary */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Timeline
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {po.invoiceStartDate &&
                  (() => {
                    const overdue =
                      po.plannedInvoiceEndDate &&
                      po.invoiceEndDate &&
                      new Date(po.invoiceEndDate) >
                        new Date(po.plannedInvoiceEndDate);
                    return (
                      <Box
                        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                      >
                        <Chip
                          label="Invoice"
                          size="small"
                          sx={{
                            minWidth: 90,
                            ...(overdue
                              ? { bgcolor: '#fee2e2', color: '#b91c1c' }
                              : {}),
                          }}
                        />
                        <Typography variant="body2">
                          {format(new Date(po.invoiceStartDate), 'dd MMM yyyy')}
                          {po.invoiceEndDate &&
                            ` → ${format(new Date(po.invoiceEndDate), 'dd MMM yyyy')}`}
                        </Typography>
                        {overdue && (
                          <Chip
                            label="OVERDUE"
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })()}
                {po.paymentStartDate &&
                  (() => {
                    const overdue =
                      po.plannedPaymentEndDate &&
                      po.paymentEndDate &&
                      new Date(po.paymentEndDate) >
                        new Date(po.plannedPaymentEndDate);
                    return (
                      <Box
                        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                      >
                        <Chip
                          label="Payment"
                          size="small"
                          sx={{
                            minWidth: 90,
                            ...(paymentIncomplete
                              ? {
                                  bgcolor: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fbbf24',
                                }
                              : overdue
                                ? { bgcolor: '#fee2e2', color: '#b91c1c' }
                                : {}),
                          }}
                        />
                        <Typography variant="body2">
                          {format(new Date(po.paymentStartDate), 'dd MMM yyyy')}
                          {po.paymentEndDate &&
                            ` → ${format(new Date(po.paymentEndDate), 'dd MMM yyyy')}`}
                          {po.paymentMethod && ` • ${po.paymentMethod}`}
                        </Typography>
                        {paymentIncomplete && (
                          <Chip
                            label="INCOMPLETE"
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#fffbeb',
                              color: '#92400e',
                              border: '1px solid #fbbf24',
                            }}
                          />
                        )}
                        {overdue && !paymentIncomplete && (
                          <Chip
                            label="OVERDUE"
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })()}
                {po.shipmentStartDate &&
                  (() => {
                    const overdue =
                      po.plannedShipmentEndDate &&
                      po.shipmentEndDate &&
                      new Date(po.shipmentEndDate) >
                        new Date(po.plannedShipmentEndDate);
                    return (
                      <Box
                        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                      >
                        <Chip
                          label="Shipment"
                          size="small"
                          sx={{
                            minWidth: 90,
                            ...(overdue
                              ? { bgcolor: '#fee2e2', color: '#b91c1c' }
                              : {}),
                          }}
                        />
                        <Typography variant="body2">
                          {format(
                            new Date(po.shipmentStartDate),
                            'dd MMM yyyy',
                          )}
                          {po.shipmentEndDate &&
                            ` → ${format(new Date(po.shipmentEndDate), 'dd MMM yyyy')}`}
                          {po.trackingNumber && ` • ${po.trackingNumber}`}
                        </Typography>
                        {overdue && (
                          <Chip
                            label="OVERDUE"
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })()}
                {po.receivingStartDate &&
                  (() => {
                    const overdue =
                      po.plannedReceivingEndDate &&
                      po.receivingEndDate &&
                      new Date(po.receivingEndDate) >
                        new Date(po.plannedReceivingEndDate);
                    return (
                      <Box
                        sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
                      >
                        <Chip
                          label="Received"
                          size="small"
                          color="success"
                          sx={{
                            minWidth: 90,
                            ...(overdue
                              ? { bgcolor: '#fee2e2', color: '#b91c1c' }
                              : {}),
                          }}
                        />
                        <Typography variant="body2">
                          {format(
                            new Date(po.receivingStartDate),
                            'dd MMM yyyy',
                          )}
                          {po.receivingEndDate &&
                            ` → ${format(new Date(po.receivingEndDate), 'dd MMM yyyy')}`}
                          {po.grn && ` • GRN: ${po.grn.grnNumber}`}
                        </Typography>
                        {overdue && (
                          <Chip
                            label="OVERDUE"
                            size="small"
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })()}
              </Box>

              {/* Planned vs Actual Statistics */}
              {hasAnyPlanned && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 1.5 }}
                  >
                    Planned vs Actual
                  </Typography>
                  <TableContainer
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                            Stage
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                            Planned End
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                            Actual End
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontWeight: 600, fontSize: 12 }}
                          >
                            Variance
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontWeight: 600, fontSize: 12 }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stages
                          .filter((s) => s.plannedEnd || s.actualEnd)
                          .map((s) => {
                            const variance = dayDiff(s.actualEnd, s.plannedEnd);
                            const isOverdue = variance !== null && variance > 0;
                            const isEarly = variance !== null && variance < 0;
                            return (
                              <TableRow key={s.label}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {s.label}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {s.plannedEnd
                                      ? format(
                                          new Date(s.plannedEnd),
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: isOverdue ? '#b91c1c' : 'inherit',
                                      fontWeight: isOverdue ? 700 : 400,
                                    }}
                                  >
                                    {s.actualEnd
                                      ? format(
                                          new Date(s.actualEnd),
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{
                                      color: isOverdue
                                        ? '#b91c1c'
                                        : isEarly
                                          ? '#16a34a'
                                          : '#64748b',
                                    }}
                                  >
                                    {variance !== null
                                      ? isOverdue
                                        ? `+${variance}d late`
                                        : isEarly
                                          ? `${variance}d early`
                                          : '0d'
                                      : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {variance !== null ? (
                                    <Chip
                                      label={
                                        isOverdue
                                          ? 'Overdue'
                                          : isEarly
                                            ? 'Early'
                                            : 'On Time'
                                      }
                                      size="small"
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        bgcolor: isOverdue
                                          ? '#fee2e2'
                                          : isEarly
                                            ? '#dcfce7'
                                            : '#f0f9ff',
                                        color: isOverdue
                                          ? '#b91c1c'
                                          : isEarly
                                            ? '#16a34a'
                                            : '#0369a1',
                                      }}
                                    />
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      —
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          );
        })()}
    </Box>
  );
}
