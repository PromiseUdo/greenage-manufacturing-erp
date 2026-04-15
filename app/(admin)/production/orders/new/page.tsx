'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from '@mui/icons-material/Person';
import {
  PRODUCTION_STAGES,
  StageTemplate,
  ActionItemTemplate,
} from '@/lib/production-stages';

interface Product {
  id: string;
  name: string;
  productNumber: string;
  category: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface SelectedActionItem extends ActionItemTemplate {
  selected: boolean;
  responsibleId: string;
  scheduledStart: string;
  scheduledEnd: string;
  isCustom?: boolean;
  durationDays?: string;
}

interface SelectedStage extends StageTemplate {
  selected: boolean;
  scheduledStart: string;
  scheduledEnd: string;
  responsibleId: string;
  isCustom?: boolean;
  selectedActionItems: SelectedActionItem[];
}

const steps = [
  'Product & Timeline',
  'Production Stages',
  'Assign Personnel',
  'Review & Submit',
];

export default function NewProductionOrderPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Step 1: Product & Timeline
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [notes, setNotes] = useState('');

  // Pending Production Requests (Backorders)
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

  // Step 2: Production Stages
  const [selectedStages, setSelectedStages] = useState<SelectedStage[]>(() =>
    PRODUCTION_STAGES.map((stage) => ({
      ...stage,
      selected: true,
      scheduledStart: '',
      scheduledEnd: '',
      responsibleId: '',
      isCustom: false,
      selectedActionItems: stage.actionItems.map((action) => ({
        ...action,
        selected: true,
        responsibleId: '',
        scheduledStart: '',
        scheduledEnd: '',
        isCustom: false,
        durationDays: '',
      })),
    })),
  );

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=200&isActive=true');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch pending requests when product changes
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!selectedProduct) {
        setPendingRequests([]);
        setSelectedRequestIds([]);
        return;
      }

      try {
        setLoadingRequests(true);
        const res = await fetch(
          `/api/production/requests?status=PENDING&productId=${selectedProduct.id}&limit=100`,
        );
        const data = await res.json();
        setPendingRequests(data.requests || []);
        setSelectedRequestIds([]); // Reset selection when product changes
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchPendingRequests();
  }, [selectedProduct]);

  // Handle toggling a pending request
  const toggleRequestSelection = (
    requestId: string,
    quantityNeeded: number,
  ) => {
    const isSelected = selectedRequestIds.includes(requestId);

    if (isSelected) {
      setSelectedRequestIds((prev) => prev.filter((id) => id !== requestId));
      // decrease quantity
      setQuantity((current) => Math.max(0, current - quantityNeeded));
    } else {
      setSelectedRequestIds((prev) => [...prev, requestId]);
      setQuantity((current) => current + quantityNeeded);
    }
  };

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees?limit=200');
        const data = await res.json();
        setEmployees(data.employees || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const toggleStage = (stageIndex: number) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              selected: !stage.selected,
              selectedActionItems: stage.selectedActionItems.map((a) => ({
                ...a,
                selected: !stage.selected,
              })),
            }
          : stage,
      ),
    );
  };

  const toggleActionItem = (stageIndex: number, actionIndex: number) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              selectedActionItems: stage.selectedActionItems.map((a, j) =>
                j === actionIndex ? { ...a, selected: !a.selected } : a,
              ),
              selected: stage.selectedActionItems.some((a, j) =>
                j === actionIndex ? !a.selected : a.selected,
              ),
            }
          : stage,
      ),
    );
  };

  const updateStageDate = (
    stageIndex: number,
    field: 'scheduledStart' | 'scheduledEnd',
    value: string,
  ) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex ? { ...stage, [field]: value } : stage,
      ),
    );
  };

  const updateStageResponsible = (stageIndex: number, userId: string) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex ? { ...stage, responsibleId: userId } : stage,
      ),
    );
  };

  const updateActionResponsible = (
    stageIndex: number,
    actionIndex: number,
    userId: string,
  ) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              selectedActionItems: stage.selectedActionItems.map((a, j) =>
                j === actionIndex ? { ...a, responsibleId: userId } : a,
              ),
            }
          : stage,
      ),
    );
  };

  const updateActionDate = (
    stageIndex: number,
    actionIndex: number,
    field: 'scheduledStart' | 'scheduledEnd',
    value: string,
  ) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) => {
        if (i === stageIndex) {
          const updatedStage = {
            ...stage,
            selectedActionItems: stage.selectedActionItems.map((a, j) => {
              if (j === actionIndex) {
                const updatedAction = { ...a, [field]: value };
                if (
                  updatedAction.scheduledStart &&
                  updatedAction.scheduledEnd
                ) {
                  const start = new Date(updatedAction.scheduledStart);
                  const end = new Date(updatedAction.scheduledEnd);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const diffTime = end.getTime() - start.getTime();
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24),
                    );
                    if (diffDays >= 0) {
                      updatedAction.durationDays = diffDays.toString();
                    }
                  }
                }
                return updatedAction;
              }
              return a;
            }),
          };
          if (field === 'scheduledStart' && actionIndex === 0) {
            updatedStage.scheduledStart = value;
          }
          if (
            field === 'scheduledEnd' &&
            actionIndex === stage.selectedActionItems.length - 1
          ) {
            updatedStage.scheduledEnd = value;
          }
          return updatedStage;
        }
        return stage;
      }),
    );
  };

  const handleActionDurationChange = (
    stageIndex: number,
    actionIndex: number,
    durationStr: string,
  ) => {
    const duration = parseInt(durationStr);

    setSelectedStages((prev) => {
      let referenceStartDate = '';

      let prevSelectedEnd = '';
      for (let j = actionIndex - 1; j >= 0; j--) {
        const a = prev[stageIndex].selectedActionItems[j];
        if (a.selected && a.scheduledEnd) {
          prevSelectedEnd = a.scheduledEnd;
          break;
        }
      }

      if (!prevSelectedEnd) {
        for (let i = stageIndex - 1; i >= 0; i--) {
          const s = prev[i];
          if (s.selected) {
            for (let j = s.selectedActionItems.length - 1; j >= 0; j--) {
              const a = s.selectedActionItems[j];
              if (a.selected && a.scheduledEnd) {
                prevSelectedEnd = a.scheduledEnd;
                break;
              }
            }
          }
          if (prevSelectedEnd) break;
        }
      }

      referenceStartDate = prevSelectedEnd || scheduledStart;

      return prev.map((stage, i) => {
        if (i === stageIndex) {
          const updatedStage = {
            ...stage,
            selectedActionItems: stage.selectedActionItems.map((a, j) => {
              if (j === actionIndex) {
                const newStart = referenceStartDate;
                let newEnd = '';
                if (newStart && !isNaN(duration) && duration >= 0) {
                  const d = new Date(newStart);
                  if (!isNaN(d.getTime())) {
                    d.setDate(d.getDate() + duration);
                    newEnd = d.toISOString().split('T')[0];
                  }
                }
                return {
                  ...a,
                  durationDays: durationStr,
                  scheduledStart: newStart || a.scheduledStart,
                  scheduledEnd: newEnd || a.scheduledEnd,
                };
              }
              return a;
            }),
          };
          if (
            actionIndex === 0 &&
            updatedStage.selectedActionItems[0].scheduledStart
          ) {
            updatedStage.scheduledStart =
              updatedStage.selectedActionItems[0].scheduledStart;
          }
          if (
            actionIndex === stage.selectedActionItems.length - 1 &&
            updatedStage.selectedActionItems[actionIndex].scheduledEnd
          ) {
            updatedStage.scheduledEnd =
              updatedStage.selectedActionItems[actionIndex].scheduledEnd;
          }
          return updatedStage;
        }
        return stage;
      });
    });
  };

  const updateCustomStage = (
    stageIndex: number,
    field: 'stageLabel',
    value: string,
  ) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              [field]: value,
              stageName: value.toUpperCase().replace(/\s+/g, '_'),
            }
          : stage,
      ),
    );
  };

  const updateCustomAction = (
    stageIndex: number,
    actionIndex: number,
    field: 'actionName' | 'defaultResponsibility' | 'outputNextStep',
    value: string,
  ) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              selectedActionItems: stage.selectedActionItems.map((a, j) =>
                j === actionIndex ? { ...a, [field]: value } : a,
              ),
            }
          : stage,
      ),
    );
  };

  const handleAddCustomStage = () => {
    const newSortOrder = selectedStages.length + 1;
    const newStage: SelectedStage = {
      stageName: `CUSTOM_STAGE_${newSortOrder}`,
      stageLabel: 'New Custom Stage',
      sortOrder: newSortOrder,
      selected: true,
      scheduledStart: '',
      scheduledEnd: '',
      responsibleId: '',
      isCustom: true,
      actionItems: [],
      selectedActionItems: [],
    };
    setSelectedStages((prev) => [...prev, newStage]);
  };

  const handleAddCustomActionItem = (stageIndex: number) => {
    setSelectedStages((prev) =>
      prev.map((stage, i) => {
        if (i === stageIndex) {
          const newSortOrder = stage.selectedActionItems.length + 1;
          const newStepId = `C-${stage.sortOrder}-${newSortOrder}`;
          const newAction: SelectedActionItem = {
            stepId: newStepId,
            actionName: 'New Custom Action',
            defaultResponsibility: 'To be assigned',
            outputNextStep: 'Done',
            focusGoal: '',
            sortOrder: newSortOrder,
            selected: true,
            responsibleId: '',
            scheduledStart: '',
            scheduledEnd: '',
            isCustom: true,
            durationDays: '',
          };
          return {
            ...stage,
            actionItems: [...stage.actionItems, newAction],
            selectedActionItems: [...stage.selectedActionItems, newAction],
          };
        }
        return stage;
      }),
    );
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return (
          selectedProduct && quantity > 0 && scheduledStart && scheduledEnd
        );
      case 1: {
        const hasSelectedStages = selectedStages.some(
          (s) => s.selected && s.selectedActionItems.some((a) => a.selected),
        );
        if (!hasSelectedStages) return false;

        for (const stage of selectedStages) {
          if (stage.selected) {
            if (!stage.scheduledStart || !stage.scheduledEnd) return false;
            for (const action of stage.selectedActionItems) {
              if (action.selected) {
                if (!action.scheduledStart || !action.scheduledEnd)
                  return false;
              }
            }
          }
        }
        return true;
      }
      case 2:
        return true; // Personnel assignment is optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const stages = selectedStages
        .filter((s) => s.selected)
        .map((stage) => ({
          stageName: stage.stageName,
          stageLabel: stage.stageLabel,
          sortOrder: stage.sortOrder,
          scheduledStart: stage.scheduledStart || null,
          scheduledEnd: stage.scheduledEnd || null,
          responsibleId: stage.responsibleId || null,
          actionItems: stage.selectedActionItems
            .filter((a) => a.selected)
            .map((action) => ({
              stepId: action.stepId,
              actionName: action.actionName,
              defaultResponsibility: action.defaultResponsibility,
              outputNextStep: action.outputNextStep,
              focusGoal: action.focusGoal,
              sortOrder: action.sortOrder,
              responsibleId: action.responsibleId || null,
              scheduledStart: action.scheduledStart || null,
              scheduledEnd: action.scheduledEnd || null,
            })),
        }));

      const res = await fetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct!.id,
          quantity,
          scheduledStart,
          scheduledEnd,
          priority,
          notes: notes || null,
          stages,
          productionRequestIds: selectedRequestIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create production order');
      }

      const order = await res.json();
      router.push(`/production/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedActionCount = () => {
    return selectedStages.reduce(
      (acc, stage) =>
        acc +
        (stage.selected
          ? stage.selectedActionItems.filter((a) => a.selected).length
          : 0),
      0,
    );
  };

  const getEmployeeName = (userId: string) => {
    const emp = employees.find((e) => e.user.id === userId);
    return emp ? emp.user.name : '—';
  };

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardHeader
          title="Select Product"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          subheader="Choose the product to be manufactured"
        />
        <CardContent>
          <Autocomplete
            options={products}
            getOptionLabel={(opt) => `${opt.name} (${opt.productNumber})`}
            value={selectedProduct}
            onChange={(_, value) => setSelectedProduct(value)}
            loading={loadingProducts}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                placeholder="Search products..."
                required
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.productNumber} • {option.category}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardHeader
          title="Production Details"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          subheader="Specify quantity, timeline, and priority"
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT" sx={{ color: 'error.main' }}>
                  Urgent
                </MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Scheduled Start"
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Scheduled End"
                type="date"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pending Production Requests Selection */}
      {selectedProduct && (
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <CardHeader
            title="Fulfill Backorders (Optional)"
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            subheader="Select pending production requests to include in this manufacturing run"
          />
          <CardContent sx={{ pt: 0 }}>
            {loadingRequests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : pendingRequests.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 600 }}>Request #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Qty Needed
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((req) => (
                    <TableRow
                      key={req.id}
                      hover
                      onClick={() =>
                        toggleRequestSelection(req.id, req.quantityNeeded)
                      }
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRequestIds.includes(req.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </TableCell>
                      <TableCell>{req.requestNumber}</TableCell>
                      <TableCell>
                        {new Date(req.dateRaised).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {req.quote.quoteNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {req.quote.customer.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="error.main"
                        >
                          {req.quantityNeeded}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                No pending production requests (backorders) for this product.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Toggle entire stages on/off, or pick individual action items within each
        stage. All stages are selected by default.
      </Alert>

      {selectedStages.map((stage, stageIndex) => (
        <Card
          key={stage.stageName}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: stage.selected ? 'primary.main' : 'divider',
            borderRadius: 2,
            transition: 'border-color 0.2s',
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Switch
                  checked={stage.selected}
                  onChange={() => toggleStage(stageIndex)}
                  color="primary"
                />
                <Box>
                  {stage.isCustom ? (
                    <TextField
                      size="small"
                      placeholder="Custom Stage Name"
                      value={stage.stageLabel}
                      onChange={(e) =>
                        updateCustomStage(
                          stageIndex,
                          'stageLabel',
                          e.target.value,
                        )
                      }
                      sx={{ minWidth: 200 }}
                    />
                  ) : (
                    <Typography variant="h6" fontWeight={600}>
                      Stage {stage.sortOrder}: {stage.stageLabel}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {stage.selectedActionItems.filter((a) => a.selected).length}{' '}
                    / {stage.actionItems.length} action items selected
                  </Typography>
                </Box>
              </Box>
            }
            action={
              <Box sx={{ display: 'flex', gap: 2, mr: 1, mt: 1 }}>
                <TextField
                  label="Stage Start"
                  type="date"
                  size="small"
                  value={stage.scheduledStart}
                  onChange={(e) =>
                    updateStageDate(
                      stageIndex,
                      'scheduledStart',
                      e.target.value,
                    )
                  }
                  InputLabelProps={{ shrink: true }}
                  disabled={!stage.selected}
                  sx={{ width: 160 }}
                />
                <TextField
                  label="Stage End"
                  type="date"
                  size="small"
                  value={stage.scheduledEnd}
                  onChange={(e) =>
                    updateStageDate(stageIndex, 'scheduledEnd', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  disabled={!stage.selected}
                  sx={{ width: 160 }}
                />
              </Box>
            }
          />
          {stage.selected && (
            <CardContent sx={{ pt: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 600 }}>Step</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Action details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Timeline</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stage.selectedActionItems.map((action, actionIndex) => (
                    <TableRow
                      key={action.stepId}
                      sx={{
                        bgcolor: action.selected
                          ? 'transparent'
                          : 'action.disabledBackground',
                        opacity: action.selected ? 1 : 0.5,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={action.selected}
                          onChange={() =>
                            toggleActionItem(stageIndex, actionIndex)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={action.stepId}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {action.isCustom ? (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            <TextField
                              size="small"
                              placeholder="Action Name"
                              value={action.actionName}
                              onChange={(e) =>
                                updateCustomAction(
                                  stageIndex,
                                  actionIndex,
                                  'actionName',
                                  e.target.value,
                                )
                              }
                            />
                            <TextField
                              size="small"
                              placeholder="Output Next Step"
                              value={action.outputNextStep}
                              onChange={(e) =>
                                updateCustomAction(
                                  stageIndex,
                                  actionIndex,
                                  'outputNextStep',
                                  e.target.value,
                                )
                              }
                            />
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {action.actionName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Role: {action.defaultResponsibility}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Output: {action.outputNextStep}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          label="Days"
                          type="number"
                          size="small"
                          sx={{ width: 120 }}
                          value={action.durationDays || ''}
                          onChange={(e) =>
                            handleActionDurationChange(
                              stageIndex,
                              actionIndex,
                              e.target.value,
                            )
                          }
                          disabled={!action.selected}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            minWidth: 140,
                          }}
                        >
                          <TextField
                            label="Start"
                            type="date"
                            size="small"
                            value={action.scheduledStart}
                            onChange={(e) =>
                              updateActionDate(
                                stageIndex,
                                actionIndex,
                                'scheduledStart',
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                            disabled={!action.selected}
                          />
                          <TextField
                            label="End"
                            type="date"
                            size="small"
                            value={action.scheduledEnd}
                            onChange={(e) =>
                              updateActionDate(
                                stageIndex,
                                actionIndex,
                                'scheduledEnd',
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                            disabled={!action.selected}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  bgcolor: 'action.hover',
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddCustomActionItem(stageIndex)}
                >
                  + Add Action Item
                </Button>
              </Box>
            </CardContent>
          )}
        </Card>
      ))}
      <Button
        variant="outlined"
        sx={{ py: 2, border: '1px dashed', borderColor: 'divider' }}
        onClick={handleAddCustomStage}
      >
        + Add Custom Stage
      </Button>
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Assign a responsible person for each stage and each action item. The
        stage responsible person oversees the entire stage, while action item
        responsible persons oversee their specific tasks.
      </Alert>

      {selectedStages
        .filter((s) => s.selected)
        .map((stage, filteredIndex) => {
          const stageIndex = selectedStages.findIndex(
            (s) => s.stageName === stage.stageName,
          );
          return (
            <Accordion key={stage.stageName} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                  }}
                >
                  <FactoryIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>
                      Stage {stage.sortOrder}: {stage.stageLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {
                        stage.selectedActionItems.filter((a) => a.selected)
                          .length
                      }{' '}
                      action items
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="primary"
                    gutterBottom
                  >
                    <PersonIcon
                      fontSize="small"
                      sx={{ verticalAlign: 'text-bottom', mr: 0.5 }}
                    />
                    Stage Responsible Person
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Responsible Person</InputLabel>
                    <Select
                      value={stage.responsibleId}
                      label="Select Responsible Person"
                      onChange={(e) =>
                        updateStageResponsible(stageIndex, e.target.value)
                      }
                    >
                      <MenuItem value="">
                        <em>Not Assigned</em>
                      </MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.user.id} value={emp.user.id}>
                          {emp.user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Action Item Assignments
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>
                        Step
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 280 }}>
                        Responsible Person
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stage.selectedActionItems
                      .filter((a) => a.selected)
                      .map((action) => {
                        const actionIndex = stage.selectedActionItems.findIndex(
                          (a) => a.stepId === action.stepId,
                        );
                        return (
                          <TableRow key={action.stepId}>
                            <TableCell>
                              <Chip
                                label={action.stepId}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {action.actionName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Default: {action.defaultResponsibility}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={action.responsibleId}
                                  displayEmpty
                                  onChange={(e) =>
                                    updateActionResponsible(
                                      stageIndex,
                                      actionIndex,
                                      e.target.value,
                                    )
                                  }
                                >
                                  <MenuItem value="">
                                    <em>Not assigned</em>
                                  </MenuItem>
                                  {employees.map((emp) => (
                                    <MenuItem
                                      key={emp.user.id}
                                      value={emp.user.id}
                                    >
                                      {emp.user.name} (
                                      {emp.user.role.replace(/_/g, ' ')})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          );
        })}
    </Box>
  );

  const renderStep4 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert
        severity="success"
        icon={<CheckCircleIcon />}
        sx={{ borderRadius: 2 }}
      >
        Review your production order details before submitting.
      </Alert>

      {/* Product & Timeline Summary */}
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardHeader
          title="Product & Timeline"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Product
              </Typography>
              <Typography fontWeight={600}>
                {selectedProduct?.name} ({selectedProduct?.productNumber})
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Quantity
              </Typography>
              <Typography fontWeight={600}>{quantity} units</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Priority
              </Typography>
              <Typography fontWeight={600}>{priority}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Scheduled Start
              </Typography>
              <Typography fontWeight={600}>
                {scheduledStart
                  ? new Date(scheduledStart).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Scheduled End
              </Typography>
              <Typography fontWeight={600}>
                {scheduledEnd
                  ? new Date(scheduledEnd).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Typography>
            </Grid>
            {notes && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography>{notes}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Stages & Actions Summary */}
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardHeader
          title={`Production Stages (${
            selectedStages.filter((s) => s.selected).length
          } stages, ${getSelectedActionCount()} action items)`}
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 0 }}>
          {selectedStages
            .filter((s) => s.selected)
            .map((stage) => (
              <Box key={stage.stageName} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <FactoryIcon fontSize="small" color="primary" />
                  <Typography fontWeight={600}>
                    Stage {stage.sortOrder}: {stage.stageLabel}
                  </Typography>
                  {stage.responsibleId && (
                    <Chip
                      label={getEmployeeName(stage.responsibleId)}
                      size="small"
                      icon={<PersonIcon />}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Table size="small">
                  <TableBody>
                    {stage.selectedActionItems
                      .filter((a) => a.selected)
                      .map((action) => (
                        <TableRow key={action.stepId}>
                          <TableCell sx={{ width: 70, py: 0.5 }}>
                            <Chip
                              label={action.stepId}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Typography variant="body2">
                              {action.actionName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: 180, py: 0.5 }}>
                            <Typography variant="caption">
                              {action.responsibleId
                                ? getEmployeeName(action.responsibleId)
                                : action.defaultResponsibility}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ py: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            New Production Order
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new production workflow
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
        {activeStep === 2 && renderStep3()}
        {activeStep === 3 && renderStep4()}
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Navigation Buttons */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Button
          onClick={() => setActiveStep((prev) => prev - 1)}
          disabled={activeStep === 0}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              bgcolor: '#16A34A',
              '&:hover': { bgcolor: '#15803D' },
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
            }}
          >
            {submitting ? 'Creating...' : 'Create Production Order'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => setActiveStep((prev) => prev + 1)}
            disabled={!canProceed()}
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Next
          </Button>
        )}
      </Paper>
    </Box>
  );
}
