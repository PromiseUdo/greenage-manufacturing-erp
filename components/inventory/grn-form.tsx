// src/components/inventory/GRNForm.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Autocomplete,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { GRNFormData, GRNItemInput } from '@/types/inventory';

interface Supplier {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
}

interface GRNFormProps {
  onSubmit: (data: GRNFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function GRNForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: GRNFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GRNFormData>({
    defaultValues: {
      supplierId: '',
      invoiceNumber: '',
      items: [
        {
          materialId: '',
          quantity: 0,
          batchNumber: '',
          expiryDate: undefined,
          supplierBatchNo: '',
        },
      ],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    // Fetch suppliers and materials
    const fetchData = async () => {
      try {
        const [suppliersRes, materialsRes] = await Promise.all([
          fetch('/api/inventory/suppliers?limit=1000'),
          fetch('/api/inventory/materials?limit=1000'),
        ]);

        const [suppliersData, materialsData] = await Promise.all([
          suppliersRes.json(),
          materialsRes.json(),
        ]);

        setSuppliers(suppliersData.suppliers);
        setMaterials(materialsData.materials);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const addItem = () => {
    append({
      materialId: '',
      quantity: 0,
      batchNumber: '',
      expiryDate: undefined,
      supplierBatchNo: '',
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create Goods Received Note (GRN)
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Supplier */}
          <Grid item xs={12} md={6}>
            <Controller
              name="supplierId"
              control={control}
              rules={{ required: 'Supplier is required' }}
              render={({ field }) => {
                const selectedSupplier =
                  suppliers?.find((s) => s.id === field.value) || null;

                return (
                  <Autocomplete<Supplier>
                    options={suppliers ?? []}
                    value={selectedSupplier} // ✅ object, not string
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => field.onChange(value?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Supplier"
                        required
                        error={!!errors.supplierId}
                        helperText={errors.supplierId?.message}
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* Invoice Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="invoiceNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Invoice Number"
                  fullWidth
                  helperText="Supplier's invoice reference"
                />
              )}
            />
          </Grid>

          {/* Items Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Received Items</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                size="small"
              >
                Add Item
              </Button>
            </Box>
          </Grid>

          {/* Items */}
          {fields.map((field, index) => (
            <Grid item xs={12} key={field.id}>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Item {index + 1}
                      </Typography>
                      {fields.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  {/* Material */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`items.${index}.materialId`}
                      control={control}
                      rules={{ required: 'Material is required' }}
                      render={({ field }) => {
                        const selectedMaterial =
                          materials?.find((m) => m.id === field.value) || null;

                        return (
                          <Autocomplete<Material>
                            options={materials ?? []}
                            value={selectedMaterial}
                            getOptionLabel={(option) =>
                              `${option.partNumber} - ${option.name}`
                            }
                            onChange={(_, value) =>
                              field.onChange(value?.id || '')
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Material"
                                size="small"
                                required
                                error={!!errors.items?.[index]?.materialId}
                                helperText={
                                  errors.items?.[index]?.materialId?.message
                                }
                              />
                            )}
                          />
                        );
                      }}
                    />
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      rules={{
                        required: 'Quantity is required',
                        min: { value: 0.01, message: 'Must be > 0' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity"
                          type="number"
                          size="small"
                          fullWidth
                          required
                          error={!!errors.items?.[index]?.quantity}
                          helperText={errors.items?.[index]?.quantity?.message}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      )}
                    />
                  </Grid>

                  {/* Batch Number */}
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.batchNumber`}
                      control={control}
                      rules={{ required: 'Batch number is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Batch Number"
                          size="small"
                          fullWidth
                          required
                          error={!!errors.items?.[index]?.batchNumber}
                          helperText={
                            errors.items?.[index]?.batchNumber?.message
                          }
                        />
                      )}
                    />
                  </Grid>

                  {/* Supplier Batch Number */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`items.${index}.supplierBatchNo`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Supplier Batch No."
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  {/* Expiry Date */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`items.${index}.expiryDate`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Expiry Date"
                          type="date"
                          size="small"
                          value={field.value ?? ''}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}

          {/* Notes */}
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Any additional notes about this delivery"
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
                {isLoading ? 'Creating GRN...' : 'Create GRN'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
