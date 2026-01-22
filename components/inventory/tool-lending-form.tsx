// src/components/inventory/ToolLendingForm.tsx

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
import { ToolLendingFormData } from '@/types/tools';

interface Tool {
  id: string;
  name: string;
  toolNumber: string;
  status: string;
  condition: string;
  currentHolder?: string;
}

interface ToolLendingFormProps {
  onSubmit: (data: ToolLendingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ToolLendingForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: ToolLendingFormProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [loadingTools, setLoadingTools] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ToolLendingFormData>({
    defaultValues: {
      toolId: '',
      issuedTo: '',
      department: '',
      purpose: '',
      orderId: '',
      projectName: '',
      expectedReturn: undefined,
    },
  });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const res = await fetch(
        '/api/inventory/tools?status=AVAILABLE&limit=1000',
      );
      const data = await res.json();
      setTools(data.tools);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleToolChange = (tool: Tool | null) => {
    setSelectedTool(tool);
    if (tool) {
      setValue('toolId', tool.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'IN_USE':
        return 'warning';
      case 'UNDER_MAINTENANCE':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* <Typography variant="h6" gutterBottom>
        Issue Tool/Equipment
      </Typography> */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Tool Selection */}
          <Grid item xs={12}>
            <Autocomplete
              options={tools}
              loading={loadingTools}
              getOptionLabel={(option) =>
                `${option.toolNumber} - ${option.name}`
              }
              onChange={(_, value) => handleToolChange(value)}
              // renderOption={(props, option) => (
              //   <Box component="li" {...props}>
              //     <Box sx={{ flexGrow: 1 }}>
              //       <Typography variant="body2" fontWeight={600}>
              //         {option.name}
              //       </Typography>
              //       <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              //         <Chip
              //           label={option.toolNumber}
              //           size="small"
              //           variant="outlined"
              //         />
              //         <Chip
              //           label={option.status}
              //           size="small"
              //           color={getStatusColor(option.status) as any}
              //         />
              //         <Chip
              //           label={option.condition}
              //           size="small"
              //           variant="outlined"
              //         />
              //       </Box>
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
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={option.toolNumber}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={option.status}
                          size="small"
                          color={getStatusColor(option.status) as any}
                        />
                        <Chip
                          label={option.condition}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Tool/Equipment"
                  required
                  variant="standard"
                  error={!!errors.toolId}
                  helperText={
                    errors.toolId?.message || 'Search by name or tool number'
                  }
                />
              )}
            />
          </Grid>

          {/* Tool Info */}
          {selectedTool && (
            <Grid item xs={12}>
              <Alert severity="info">
                <strong>Selected:</strong> {selectedTool.name} (
                {selectedTool.toolNumber}) - Condition: {selectedTool.condition}
              </Alert>
            </Grid>
          )}

          {/* Issued To */}
          <Grid item xs={12} md={6}>
            <Controller
              name="issuedTo"
              control={control}
              rules={{ required: 'Recipient name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issued To (Name)"
                  fullWidth
                  variant="standard"
                  required
                  error={!!errors.issuedTo}
                  helperText={
                    errors.issuedTo?.message ||
                    'Enter person or department name'
                  }
                  disabled={!selectedTool}
                />
              )}
            />
          </Grid>

          {/* Department */}
          <Grid item xs={12} md={6}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Department"
                  fullWidth
                  variant="standard"
                  helperText="e.g., Production, Assembly, QC"
                  disabled={!selectedTool}
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
                  label="Purpose"
                  fullWidth
                  multiline
                  rows={2}
                  variant="standard"
                  helperText="Why is this tool being borrowed?"
                  disabled={!selectedTool}
                />
              )}
            />
          </Grid>

          {/* Order ID */}
          <Grid item xs={12} md={6}>
            <Controller
              name="orderId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Order Number (Optional)"
                  fullWidth
                  variant="standard"
                  helperText="Link to production order if applicable"
                  disabled={!selectedTool}
                />
              )}
            />
          </Grid>

          {/* Project Name */}
          <Grid item xs={12} md={6}>
            <Controller
              name="projectName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Project Name (Optional)"
                  fullWidth
                  variant="standard"
                  helperText="Project or job name"
                  disabled={!selectedTool}
                />
              )}
            />
          </Grid>

          {/* Expected Return Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="expectedReturn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Expected Return Date"
                  type="date"
                  fullWidth
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  helperText="When should this tool be returned?"
                  value={field.value ?? ''}
                  disabled={!selectedTool}
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
                sx={{
                  minWidth: 140,
                  bgcolor: '#0F172A',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
                variant="contained"
                disabled={isLoading || !selectedTool}
              >
                {isLoading ? 'Issuing...' : 'Issue Tool'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
