// src/components/inventory/MaterialIssuanceForm.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Autocomplete,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIssuanceFormData } from '@/types/inventory';

interface Material {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  unit: string;
}

interface MaterialIssuanceFormProps {
  onSubmit: (data: MaterialIssuanceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function MaterialIssuanceForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: MaterialIssuanceFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MaterialIssuanceFormData>({
    defaultValues: {
      materialId: '',
      quantity: 0,
      batchNumber: '',
      issuedTo: '',
      purpose: '',
      orderId: '',
    },
  });

  const quantity = watch('quantity');

  useEffect(() => {
    // Fetch materials
    const fetchMaterials = async () => {
      try {
        const res = await fetch('/api/inventory/materials?limit=1000');
        const data = await res.json();
        // setMaterials(data.materials);
        setMaterials(Array.isArray(data.materials) ? data.materials : []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleMaterialChange = (material: Material | null) => {
    setSelectedMaterial(material);
    if (material) {
      setValue('materialId', material.id);
    }
  };

  const insufficientStock =
    selectedMaterial && quantity > selectedMaterial.currentStock;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Issue Material
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Material Selection */}
          <Grid item xs={12}>
            <Autocomplete
              // options={materials}
              options={materials ?? []}
              loading={loadingMaterials}
              getOptionLabel={(option) =>
                `${option.partNumber} - ${option.name}`
              }
              onChange={(_, value) => handleMaterialChange(value)}
              // renderOption={(props, option) => (
              //   <Box component="li" key={key} {...rest}>
              //     <Box sx={{ flexGrow: 1 }}>
              //       <Typography variant="body2" fontWeight={600}>
              //         {option.name}
              //       </Typography>
              //       <Typography variant="caption" color="text.secondary">
              //         {option.partNumber} | Stock: {option.currentStock}{' '}
              //         {option.unit}
              //       </Typography>
              //     </Box>
              //   </Box>
              // )}

              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.partNumber} | Stock: {option.currentStock}{' '}
                        {option.unit}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Material"
                  required
                  error={!!errors.materialId}
                  helperText={
                    errors.materialId?.message ||
                    'Search by name or part number'
                  }
                />
              )}
            />
          </Grid>

          {/* Current Stock Info */}
          {selectedMaterial && (
            <Grid item xs={12}>
              <Alert severity="info">
                <strong>Available Stock:</strong>{' '}
                {selectedMaterial.currentStock} {selectedMaterial.unit}
              </Alert>
            </Grid>
          )}

          {/* Quantity */}
          <Grid item xs={12} md={6}>
            <Controller
              name="quantity"
              control={control}
              rules={{
                required: 'Quantity is required',
                min: { value: 0.01, message: 'Must be greater than 0' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quantity to Issue"
                  type="number"
                  fullWidth
                  value={field.value ?? ''}
                  required
                  error={!!errors.quantity || insufficientStock || undefined}
                  helperText={
                    errors.quantity?.message ||
                    (insufficientStock
                      ? 'Insufficient stock available'
                      : selectedMaterial
                      ? `Unit: ${selectedMaterial.unit}`
                      : '')
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? '' : parseFloat(value));
                  }}
                  disabled={!selectedMaterial}
                />
              )}
            />
          </Grid>

          {/* Batch Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="batchNumber"
              control={control}
              rules={{ required: 'Batch number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Batch Number"
                  fullWidth
                  required
                  error={!!errors.batchNumber}
                  helperText={
                    errors.batchNumber?.message ||
                    'Enter the batch number being issued'
                  }
                  disabled={!selectedMaterial}
                />
              )}
            />
          </Grid>

          {/* Issued To */}
          <Grid item xs={12} md={6}>
            <Controller
              name="issuedTo"
              control={control}
              rules={{ required: 'Recipient is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issued To"
                  fullWidth
                  required
                  error={!!errors.issuedTo}
                  helperText={
                    errors.issuedTo?.message || 'Department or operator name'
                  }
                  disabled={!selectedMaterial}
                />
              )}
            />
          </Grid>

          {/* Order ID (Optional) */}
          <Grid item xs={12} md={6}>
            <Controller
              name="orderId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Order Number (Optional)"
                  fullWidth
                  helperText="Link to production order if applicable"
                  disabled={!selectedMaterial}
                />
              )}
            />
          </Grid>

          {/* Purpose */}
          <Grid item xs={12}>
            <Controller
              name="purpose"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Purpose / Notes"
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Optional notes about this issuance"
                  disabled={!selectedMaterial}
                />
              )}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || insufficientStock || !selectedMaterial}
              >
                {isLoading ? 'Issuing...' : 'Issue Material'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
