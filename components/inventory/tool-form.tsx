// src/components/inventory/ToolForm.tsx

'use client';

import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import { useForm, Controller } from 'react-hook-form';
import { ToolFormData } from '@/types/tools';

const TOOL_CATEGORIES = [
  { value: 'HAND_TOOL', label: 'Hand Tool' },
  { value: 'POWER_TOOL', label: 'Power Tool' },
  { value: 'MEASURING_TOOL', label: 'Measuring Tool' },
  { value: 'TESTING_EQUIPMENT', label: 'Testing Equipment' },
  { value: 'SAFETY_EQUIPMENT', label: 'Safety Equipment' },
  { value: 'WORKSTATION', label: 'Workstation' },
  { value: 'LIFTING_EQUIPMENT', label: 'Lifting Equipment' },
  { value: 'OTHER', label: 'Other' },
];

const TOOL_CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
];

interface ToolFormProps {
  initialData?: Partial<ToolFormData>;
  onSubmit: (data: ToolFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ToolForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ToolFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ToolFormData>({
    defaultValues: {
      name: initialData?.name || '',
      toolNumber: initialData?.toolNumber || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      serialNumber: initialData?.serialNumber || '',
      manufacturer: initialData?.manufacturer || '',
      purchaseDate: initialData?.purchaseDate || undefined,
      purchaseCost: initialData?.purchaseCost || undefined,
      location: initialData?.location || '',
      condition: initialData?.condition || 'GOOD',
    },
  });

  return (
    <Paper sx={{ p: 3 }}>
      {/* <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Tool/Equipment' : 'Add New Tool/Equipment'}
      </Typography> */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Tool Name */}
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Tool name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tool/Equipment Name"
                  fullWidth
                  variant="standard"
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="e.g., Digital Multimeter, Power Drill"
                />
              )}
            />
          </Grid>

          {/* Tool Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="toolNumber"
              control={control}
              rules={{ required: 'Tool number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tool Number"
                  fullWidth
                  required
                  variant="standard"
                  disabled={!!initialData}
                  error={!!errors.toolNumber}
                  helperText={
                    errors.toolNumber?.message ||
                    (initialData
                      ? 'Cannot change tool number'
                      : 'Unique identifier (e.g., TOOL-001)')
                  }
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
                  variant="standard"
                  select
                  required
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  {TOOL_CATEGORIES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Condition */}
          <Grid item xs={12} md={6}>
            <Controller
              name="condition"
              control={control}
              rules={{ required: 'Condition is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Condition"
                  fullWidth
                  select
                  variant="standard"
                  required
                  error={!!errors.condition}
                  helperText={
                    errors.condition?.message || 'Current physical condition'
                  }
                >
                  {TOOL_CONDITIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  variant="standard"
                  multiline
                  rows={2}
                  helperText="Brief description of the tool and its use"
                />
              )}
            />
          </Grid>

          {/* Serial Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="serialNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Serial Number"
                  variant="standard"
                  fullWidth
                  helperText="Manufacturer's serial number"
                />
              )}
            />
          </Grid>

          {/* Manufacturer */}
          <Grid item xs={12} md={6}>
            <Controller
              name="manufacturer"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Manufacturer"
                  variant="standard"
                  fullWidth
                  helperText="Brand or manufacturer name"
                />
              )}
            />
          </Grid>

          {/* Purchase Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Purchase Date"
                  variant="standard"
                  type="date"
                  fullWidth
                  value={field.value ?? ''}
                  InputLabelProps={{ shrink: true }}
                  helperText="When was this tool purchased?"
                />
              )}
            />
          </Grid>

          {/* Purchase Cost */}
          <Grid item xs={12} md={6}>
            <Controller
              name="purchaseCost"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Purchase Cost"
                  type="number"
                  variant="standard"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₦</InputAdornment>
                    ),
                  }}
                  helperText="Original purchase price"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined,
                    )
                  }
                />
              )}
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Storage Location"
                  fullWidth
                  variant="standard"
                  helperText="Where is this tool stored? (e.g., Store Room A, Shelf 3)"
                  placeholder="e.g., Tool Room, Cabinet 2, Shelf B"
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
                sx={{
                  minWidth: 140,
                  bgcolor: '#0F172A',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Saving...'
                  : initialData
                    ? 'Update Tool'
                    : 'Create Tool'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
