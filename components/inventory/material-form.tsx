// src/components/inventory/MaterialForm.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Paper,
  Typography,
  Autocomplete,
  InputAdornment,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { MaterialFormData } from '@/types/inventory';
import Grid from '@mui/material/GridLegacy';

const CATEGORIES = [
  { value: 'PCB', label: 'PCB' },
  { value: 'ELECTRONIC_COMPONENT', label: 'Electronic Component' },
  { value: 'CONNECTOR', label: 'Connector' },
  { value: 'WIRE_CABLE', label: 'Wire/Cable' },
  { value: 'ENCLOSURE', label: 'Enclosure' },
  { value: 'PACKAGING_MATERIAL', label: 'Packaging Material' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'OTHER', label: 'Other' },
];

const UNITS = ['pieces', 'kg', 'meters', 'liters', 'boxes', 'rolls', 'sets'];

interface MaterialFormProps {
  initialData?: Partial<MaterialFormData>;
  onSubmit: (data: MaterialFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  suppliers?: Array<{ id: string; name: string }>;
}

export default function MaterialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  suppliers = [],
}: MaterialFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MaterialFormData>({
    defaultValues: {
      name: initialData?.name || '',
      partNumber: initialData?.partNumber || '',
      category: initialData?.category || '',
      unit: initialData?.unit || 'pieces',
      currentStock: initialData?.currentStock || 0,
      reorderLevel: initialData?.reorderLevel || 0,
      maxStockLevel: initialData?.maxStockLevel || undefined,
      unitCost: initialData?.unitCost || undefined,
      supplierId: initialData?.supplierId || '',
    },
  });

  const currentStock = watch('currentStock');
  const reorderLevel = watch('reorderLevel');
  const unitCost = watch('unitCost');

  const totalValue = currentStock && unitCost ? currentStock * unitCost : 0;

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: '1px solid',
        borderRadius: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Material' : 'Add New Material'}
      </Typography> */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: -2 }}
            >
              Material Details{' '}
            </Typography>
          </Grid>
          {/* Material Name */}
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Material name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  variant="standard"
                  label="Material Name"
                  error={!!errors.name}
                  size="small"
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>

          {/* Part Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="partNumber"
              control={control}
              rules={{ required: 'Part number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Part Number"
                  disabled={!!initialData}
                  error={!!errors.partNumber}
                  variant="standard"
                  size="small"
                  helperText={errors.partNumber?.message}
                />
              )}
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Category"
                  fullWidth
                  select
                  variant="standard"
                  size="small"
                  required
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  {CATEGORIES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Unit */}
          <Grid item xs={12} md={6}>
            <Controller
              name="unit"
              control={control}
              rules={{ required: 'Unit is required' }}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={UNITS}
                  freeSolo
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit of Measurement"
                      required
                      variant="standard"
                      size="small"
                      error={!!errors.unit}
                      helperText={errors.unit?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: -1 }}
            >
              Stock Information
            </Typography>
          </Grid>

          {/* Current Stock */}
          <Grid item xs={12} md={4}>
            <Controller
              name="currentStock"
              control={control}
              rules={{
                required: 'Current stock is required',
                min: { value: 0, message: 'Must be 0 or greater' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Current Stock"
                  type="number"
                  fullWidth
                  // variant="outlined"
                  size="small"
                  variant="standard"
                  required
                  error={!!errors.currentStock}
                  helperText={errors.currentStock?.message}
                  // onChange={(e) => field.onChange(parseFloat(e.target.value))}

                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                />
              )}
            />
          </Grid>

          {/* Reorder Level */}
          <Grid item xs={12} md={4}>
            <Controller
              name="reorderLevel"
              control={control}
              rules={{
                required: 'Reorder level is required',
                min: { value: 0, message: 'Must be 0 or greater' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reorder Level"
                  type="number"
                  value={field.value ?? ''}
                  fullWidth
                  variant="standard"
                  size="small"
                  required
                  error={!!errors.reorderLevel}
                  helperText={
                    errors.reorderLevel?.message ||
                    'Alert when stock reaches this level'
                  }
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
          </Grid>

          {/* Max Stock Level */}
          <Grid item xs={12} md={4}>
            <Controller
              name="maxStockLevel"
              control={control}
              rules={{
                min: { value: 0, message: 'Must be 0 or greater' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Max Stock Level"
                  type="number"
                  value={field.value ?? ''}
                  fullWidth
                  variant="standard"
                  size="small"
                  error={!!errors.maxStockLevel}
                  helperText={errors.maxStockLevel?.message}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: -1 }}
            >
              Material Costing
            </Typography>
          </Grid>
          {/* Unit Cost */}
          <Grid item xs={12} md={6}>
            <Controller
              name="unitCost"
              control={control}
              rules={{
                min: { value: 0, message: 'Must be 0 or greater' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Unit Cost"
                  type="number"
                  value={field.value ?? ''}
                  fullWidth
                  variant="standard"
                  size="small"
                  error={!!errors.unitCost}
                  helperText={errors.unitCost?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₦</InputAdornment>
                    ),
                  }}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              )}
            />
          </Grid>

          {/* Supplier */}
          <Grid item xs={12} md={6}>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Supplier"
                  fullWidth
                  variant="standard"
                  size="small"
                  select
                  helperText="Optional - link to supplier"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Calculated Total Value */}
          {totalValue > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Total Inventory Value:</strong>{' '}
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                  }).format(totalValue)}
                </Typography>
              </Alert>

              {/* <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                }}
              >
                <Typography variant="body2">
                  <strong>Total Inventory Value:</strong>{' '}
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                  }).format(totalValue)}
                </Typography>
              </Paper> */}
            </Grid>
          )}

          {/* Warning if stock below reorder level */}
          {currentStock <= reorderLevel && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                sx={{
                  fontSize: '14px',
                }}
              >
                <strong>Warning:</strong> Current stock is at or below reorder
                level.
              </Alert>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
                sx={{
                  borderColor: '#0F172A',
                  color: '#0F172A',
                  fontWeight: 'normal',
                  fontSize: '14',
                  '&:hover': {
                    borderColor: '#020617',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  backgroundColor: '#0F172A',
                  fontWeight: 'bold',
                  fontSize: '14',
                  '&:hover': {
                    backgroundColor: '#020617',
                  },
                }}
              >
                {isLoading
                  ? 'Saving...'
                  : initialData
                  ? 'Update Material'
                  : 'Create Material'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
