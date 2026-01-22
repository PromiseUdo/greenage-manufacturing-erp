// src/components/inventory/ToolReturnForm.tsx

'use client';

import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import { useForm, Controller } from 'react-hook-form';
import { ToolReturnFormData } from '@/types/tools';

const TOOL_CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent', description: 'Like new condition' },
  { value: 'GOOD', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'FAIR', label: 'Fair', description: 'Some wear but usable' },
  { value: 'POOR', label: 'Poor', description: 'Significant wear' },
  {
    value: 'NEEDS_REPAIR',
    label: 'Needs Repair',
    description: 'Requires maintenance',
  },
  {
    value: 'DAMAGED',
    label: 'Damaged',
    description: 'Not usable, needs repair',
  },
];

interface ToolReturnFormProps {
  toolName: string;
  toolNumber: string;
  issuedTo: string;
  onSubmit: (data: ToolReturnFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ToolReturnForm({
  toolName,
  toolNumber,
  issuedTo,
  onSubmit,
  onCancel,
  isLoading = false,
}: ToolReturnFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ToolReturnFormData>({
    defaultValues: {
      returnCondition: 'GOOD',
      returnNotes: '',
    },
  });

  const returnCondition = watch('returnCondition');

  const showWarning =
    returnCondition === 'NEEDS_REPAIR' ||
    returnCondition === 'POOR' ||
    returnCondition === 'DAMAGED';

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Tool:</strong> {toolName} ({toolNumber})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Borrowed by:</strong> {issuedTo}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Return Condition */}
          <Grid item xs={12}>
            <Controller
              name="returnCondition"
              control={control}
              rules={{ required: 'Return condition is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tool Condition on Return"
                  fullWidth
                  select
                  variant="standard"
                  required
                  error={!!errors.returnCondition}
                  helperText={
                    errors.returnCondition?.message ||
                    'Inspect the tool and select its current condition'
                  }
                >
                  {TOOL_CONDITIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Warning Alert */}
          {showWarning && (
            <Grid item xs={12}>
              <Alert severity="warning">
                {returnCondition === 'DAMAGED' ? (
                  <>
                    <strong>Tool will be marked as DAMAGED.</strong> It will not
                    be available for lending until repaired.
                  </>
                ) : (
                  <>
                    <strong>Tool will be sent for maintenance.</strong> It will
                    not be available until serviced.
                  </>
                )}
              </Alert>
            </Grid>
          )}

          {/* Return Notes */}
          <Grid item xs={12}>
            <Controller
              name="returnNotes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Return Notes"
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Document any damage, wear, or issues observed"
                  placeholder="E.g., Minor scratches on handle, blade needs sharpening..."
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
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'Processing Return...' : 'Complete Return'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
