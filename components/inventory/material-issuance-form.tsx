// src/components/inventory/MaterialIssuanceForm.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Autocomplete,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { MaterialIssuanceFormData } from '@/types/inventory';

interface Material {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  unit: string;
}

interface MaterialLineItem {
  selectedMaterial: Material | null;
  quantity: number | '';
  batchNumber: string;
}

interface SharedFields {
  issuedTo: string;
  orderId: string;
  purpose: string;
}

interface MaterialIssuanceFormProps {
  onSubmitMultiple: (items: MaterialIssuanceFormData[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const emptyLine = (): MaterialLineItem => ({
  selectedMaterial: null,
  quantity: '',
  batchNumber: '',
});

export default function MaterialIssuanceForm({
  onSubmitMultiple,
  onCancel,
  isLoading = false,
}: MaterialIssuanceFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [lines, setLines] = useState<MaterialLineItem[]>([emptyLine()]);
  const [shared, setShared] = useState<SharedFields>({
    issuedTo: '',
    orderId: '',
    purpose: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch('/api/inventory/materials?limit=1000');
        const data = await res.json();
        setMaterials(Array.isArray(data.materials) ? data.materials : []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  const updateLine = (index: number, patch: Partial<MaterialLineItem>) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
    // Clear related errors
    const errorKeys = Object.keys(patch).map((k) => `${index}_${k}`);
    if (errorKeys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        errorKeys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!shared.issuedTo.trim()) {
      newErrors['issuedTo'] = 'Recipient is required';
    }

    lines.forEach((line, i) => {
      if (!line.selectedMaterial) {
        newErrors[`${i}_selectedMaterial`] = 'Select a material';
      }
      if (line.quantity === '' || Number(line.quantity) <= 0) {
        newErrors[`${i}_quantity`] = 'Enter a valid quantity';
      }
      if (
        line.selectedMaterial &&
        line.quantity !== '' &&
        Number(line.quantity) > line.selectedMaterial.currentStock
      ) {
        newErrors[`${i}_quantity`] = 'Exceeds available stock';
      }
      if (!line.batchNumber.trim()) {
        newErrors[`${i}_batchNumber`] = 'Batch number is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const items: MaterialIssuanceFormData[] = lines.map((line) => ({
      materialId: line.selectedMaterial!.id,
      quantity: Number(line.quantity),
      batchNumber: line.batchNumber.trim(),
      issuedTo: shared.issuedTo.trim(),
      purpose: shared.purpose.trim() || undefined,
      orderId: shared.orderId.trim() || undefined,
    }));

    onSubmitMultiple(items);
  };

  const hasInsufficientStock = (line: MaterialLineItem) =>
    line.selectedMaterial &&
    line.quantity !== '' &&
    Number(line.quantity) > line.selectedMaterial.currentStock;

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }} component="form" onSubmit={handleSubmit}>
      {/* Material Line Items */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Materials to Issue
      </Typography>

      {lines.map((line, index) => (
        <Box key={index}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                mt: 2.5,
                minWidth: 24,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {index + 1}.
            </Typography>

            <Grid container spacing={2} sx={{ flex: 1 }}>
              {/* Material selector */}
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={materials}
                  loading={loadingMaterials}
                  value={line.selectedMaterial}
                  getOptionLabel={(option) =>
                    `${option.partNumber} – ${option.name}`
                  }
                  onChange={(_, value) =>
                    updateLine(index, { selectedMaterial: value, quantity: '' })
                  }
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={key} {...rest}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.partNumber} • Stock: {option.currentStock}{' '}
                            {option.unit}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Material"
                      variant="standard"
                      required
                      error={!!errors[`${index}_selectedMaterial`]}
                      helperText={
                        errors[`${index}_selectedMaterial`] ||
                        (line.selectedMaterial
                          ? `Stock: ${line.selectedMaterial.currentStock} ${line.selectedMaterial.unit}`
                          : 'Search by name or part number')
                      }
                    />
                  )}
                />
              </Grid>

              {/* Quantity */}
              <Grid item xs={6} md={3}>
                <TextField
                  label="Quantity"
                  variant="standard"
                  type="number"
                  fullWidth
                  required
                  value={line.quantity}
                  disabled={!line.selectedMaterial}
                  error={
                    !!errors[`${index}_quantity`] ||
                    !!hasInsufficientStock(line)
                  }
                  helperText={
                    errors[`${index}_quantity`] ||
                    (hasInsufficientStock(line)
                      ? 'Insufficient stock'
                      : line.selectedMaterial
                      ? `Unit: ${line.selectedMaterial.unit}`
                      : '')
                  }
                  onChange={(e) =>
                    updateLine(index, {
                      quantity:
                        e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  inputProps={{ min: 0.01, step: 'any' }}
                />
              </Grid>

              {/* Batch Number */}
              <Grid item xs={6} md={4}>
                <TextField
                  label="Batch Number"
                  variant="standard"
                  fullWidth
                  required
                  value={line.batchNumber}
                  disabled={!line.selectedMaterial}
                  error={!!errors[`${index}_batchNumber`]}
                  helperText={errors[`${index}_batchNumber`]}
                  onChange={(e) =>
                    updateLine(index, { batchNumber: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {/* Remove button */}
            <Tooltip title="Remove line">
              <span>
                <IconButton
                  size="small"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  sx={{ mt: 1.5, color: 'error.main' }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {index < lines.length - 1 && (
            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
          )}
        </Box>
      ))}

      {/* Add another material line */}
      <Button
        variant="text"
        startIcon={<AddCircleOutlineIcon />}
        onClick={addLine}
        sx={{ mt: 2, mb: 3, textTransform: 'none', fontWeight: 600 }}
      >
        Add another material
      </Button>

      <Divider sx={{ mb: 3 }} />

      {/* Shared fields */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Issuance Details
      </Typography>

      <Grid container spacing={3}>
        {/* Issued To */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Issued To"
            variant="standard"
            fullWidth
            required
            value={shared.issuedTo}
            error={!!errors['issuedTo']}
            helperText={
              errors['issuedTo'] || 'Department, operator, or location'
            }
            onChange={(e) =>
              setShared((prev) => ({ ...prev, issuedTo: e.target.value }))
            }
          />
        </Grid>

        {/* Order ID */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Order Number"
            variant="standard"
            fullWidth
            value={shared.orderId}
            helperText="Optional production or job reference"
            onChange={(e) =>
              setShared((prev) => ({ ...prev, orderId: e.target.value }))
            }
          />
        </Grid>

        {/* Purpose */}
        <Grid item xs={12}>
          <TextField
            label="Purpose / Notes"
            variant="standard"
            fullWidth
            multiline
            rows={3}
            value={shared.purpose}
            onChange={(e) =>
              setShared((prev) => ({ ...prev, purpose: e.target.value }))
            }
          />
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ fontWeight: 'bold' }}
              disabled={isLoading || lines.some(hasInsufficientStock)}
            >
              {isLoading
                ? 'Issuing…'
                : lines.length > 1
                ? `Issue ${lines.length} Materials`
                : 'Issue Material'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
