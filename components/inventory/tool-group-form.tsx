// src/components/inventory/tool-group-form.tsx

'use client';

import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';

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

interface ToolGroupFormData {
  name: string;
  category: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unitCost?: number;
  purchaseDate?: string;
  location?: string;
  condition: string;
  isGrouped: boolean;
}

interface ToolGroupFormProps {
  initialData?: Partial<ToolGroupFormData>;
  onSubmit: (data: ToolGroupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ToolGroupForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ToolGroupFormProps) {
  const [isGrouped, setIsGrouped] = useState(initialData?.isGrouped || false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ToolGroupFormData>({
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      quantity: initialData?.quantity || 1,
      unitCost: initialData?.unitCost || undefined,
      purchaseDate: initialData?.purchaseDate || undefined,
      location: initialData?.location || '',
      condition: initialData?.condition || 'GOOD',
      isGrouped: initialData?.isGrouped || false,
    },
  });

  const watchIsGrouped = watch('isGrouped');

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Grouped Tool Checkbox */}
          <Grid item xs={12}>
            <Controller
              name="isGrouped"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        setIsGrouped(e.target.checked);
                      }}
                      sx={{
                        '&.Mui-checked': {
                          color: '#0F172A',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        Create as Tool Group
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Check this if you have multiple identical tools (e.g.,
                        100 hammers)
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Grid>

          {/* Tool/Group Name */}
          <Grid item xs={12} md={watchIsGrouped ? 6 : 8}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Tool name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={watchIsGrouped ? 'Tool Group Name' : 'Tool Name'}
                  fullWidth
                  variant="standard"
                  required
                  error={!!errors.name}
                  helperText={
                    errors.name?.message ||
                    (watchIsGrouped
                      ? 'e.g., Standard Hammer'
                      : 'e.g., Digital Multimeter')
                  }
                />
              )}
            />
          </Grid>

          {/* Quantity - Only show if grouped */}
          {watchIsGrouped && (
            <Grid item xs={12} md={6}>
              <Controller
                name="quantity"
                control={control}
                rules={{
                  required: 'Quantity is required for grouped tools',
                  min: { value: 1, message: 'Minimum quantity is 1' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity"
                    type="number"
                    fullWidth
                    variant="standard"
                    required
                    error={!!errors.quantity}
                    helperText={
                      errors.quantity?.message ||
                      'Total number of identical tools'
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : 1,
                      )
                    }
                  />
                )}
              />
            </Grid>
          )}

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
                    errors.condition?.message ||
                    (watchIsGrouped
                      ? 'Condition of all tools in group'
                      : 'Current physical condition')
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
                  helperText="Brief description of the tool(s)"
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

          {/* Model */}
          <Grid item xs={12} md={6}>
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Model Number"
                  variant="standard"
                  fullWidth
                  helperText="Model or part number"
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
                  helperText="When were these tools purchased?"
                />
              )}
            />
          </Grid>

          {/* Unit Cost */}
          <Grid item xs={12} md={6}>
            <Controller
              name="unitCost"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={watchIsGrouped ? 'Cost per Unit' : 'Purchase Cost'}
                  type="number"
                  variant="standard"
                  value={field.value ?? ''}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₦</InputAdornment>
                    ),
                  }}
                  helperText={
                    watchIsGrouped ? 'Cost per individual tool' : 'Total cost'
                  }
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
                  helperText="Where are these tools stored? (e.g., Tool Room, Cabinet 2)"
                  placeholder="e.g., Tool Room, Shelf B"
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
                  ? 'Creating...'
                  : watchIsGrouped
                    ? `Create Group (${watch('quantity')} tools)`
                    : 'Create Tool'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
