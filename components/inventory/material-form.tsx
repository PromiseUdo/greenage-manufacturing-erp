// // src/components/inventory/MaterialForm.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Box,
//   TextField,
//   Button,
//   MenuItem,
//   Paper,
//   Typography,
//   Autocomplete,
//   InputAdornment,
//   Alert,
// } from '@mui/material';
// import { useForm, Controller } from 'react-hook-form';
// import { MaterialFormData } from '@/types/inventory';
// import Grid from '@mui/material/GridLegacy';

// const CATEGORIES = [
//   { value: 'PCB', label: 'PCB' },
//   { value: 'ELECTRONIC_COMPONENT', label: 'Electronic Component' },
//   { value: 'CONNECTOR', label: 'Connector' },
//   { value: 'WIRE_CABLE', label: 'Wire/Cable' },
//   { value: 'ENCLOSURE', label: 'Enclosure' },
//   { value: 'PACKAGING_MATERIAL', label: 'Packaging Material' },
//   { value: 'CONSUMABLE', label: 'Consumable' },
//   { value: 'OTHER', label: 'Other' },
// ];

// const UNITS = ['pieces', 'kg', 'meters', 'liters', 'boxes', 'rolls', 'sets'];

// interface MaterialFormProps {
//   initialData?: Partial<MaterialFormData>;
//   onSubmit: (data: MaterialFormData) => Promise<void>;
//   onCancel: () => void;
//   isLoading?: boolean;
//   suppliers?: Array<{ id: string; name: string }>;
// }

// export default function MaterialForm({
//   initialData,
//   onSubmit,
//   onCancel,
//   isLoading = false,
//   suppliers = [],
// }: MaterialFormProps) {
//   const {
//     control,
//     handleSubmit,
//     formState: { errors },
//     watch,
//   } = useForm<MaterialFormData>({
//     defaultValues: {
//       name: initialData?.name || '',
//       partNumber: initialData?.partNumber || '',
//       category: initialData?.category || '',
//       unit: initialData?.unit || 'pieces',
//       currentStock: initialData?.currentStock || 0,
//       reorderLevel: initialData?.reorderLevel || 0,
//       maxStockLevel: initialData?.maxStockLevel || undefined,
//       unitCost: initialData?.unitCost || undefined,
//       supplierId: initialData?.supplierId || '',
//     },
//   });

//   const currentStock = watch('currentStock');
//   const reorderLevel = watch('reorderLevel');
//   const unitCost = watch('unitCost');

//   const totalValue = currentStock && unitCost ? currentStock * unitCost : 0;

//   return (
//     <Paper
//       sx={{
//         p: 3,
//         backgroundColor: 'transparent',
//         boxShadow: 'none',
//         border: '1px solid',
//         borderRadius: 2,
//         borderColor: 'divider',
//         bgcolor: 'background.paper',
//       }}
//     >
//       {/* <Typography variant="h6" gutterBottom>
//         {initialData ? 'Edit Material' : 'Add New Material'}
//       </Typography> */}
//       <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
//         <Grid container spacing={3}>
//           <Grid item xs={12}>
//             <Typography
//               variant="subtitle2"
//               color="text.secondary"
//               sx={{ fontWeight: 600, mb: -2 }}
//             >
//               Material Details{' '}
//             </Typography>
//           </Grid>
//           {/* Material Name */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="name"
//               control={control}
//               rules={{ required: 'Material name is required' }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   required
//                   fullWidth
//                   variant="standard"
//                   label="Material Name"
//                   error={!!errors.name}
//                   size="small"
//                   helperText={errors.name?.message}
//                 />
//               )}
//             />
//           </Grid>

//           {/* Part Number */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="partNumber"
//               control={control}
//               rules={{ required: 'Part number is required' }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   fullWidth
//                   label="Part Number"
//                   disabled={!!initialData}
//                   error={!!errors.partNumber}
//                   variant="standard"
//                   size="small"
//                   helperText={errors.partNumber?.message}
//                 />
//               )}
//             />
//           </Grid>

//           {/* Category */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="category"
//               control={control}
//               rules={{ required: 'Category is required' }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Category"
//                   fullWidth
//                   select
//                   variant="standard"
//                   size="small"
//                   required
//                   error={!!errors.category}
//                   helperText={errors.category?.message}
//                 >
//                   {CATEGORIES.map((option) => (
//                     <MenuItem key={option.value} value={option.value}>
//                       {option.label}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               )}
//             />
//           </Grid>

//           {/* Unit */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="unit"
//               control={control}
//               rules={{ required: 'Unit is required' }}
//               render={({ field }) => (
//                 <Autocomplete
//                   {...field}
//                   options={UNITS}
//                   freeSolo
//                   onChange={(_, value) => field.onChange(value)}
//                   renderInput={(params) => (
//                     <TextField
//                       {...params}
//                       label="Unit of Measurement"
//                       required
//                       variant="standard"
//                       size="small"
//                       error={!!errors.unit}
//                       helperText={errors.unit?.message}
//                     />
//                   )}
//                 />
//               )}
//             />
//           </Grid>

//           <Grid item xs={12}>
//             <Typography
//               variant="subtitle2"
//               color="text.secondary"
//               sx={{ fontWeight: 600, mb: -1 }}
//             >
//               Stock Information
//             </Typography>
//           </Grid>

//           {/* Current Stock */}
//           <Grid item xs={12} md={4}>
//             <Controller
//               name="currentStock"
//               control={control}
//               rules={{
//                 required: 'Current stock is required',
//                 min: { value: 0, message: 'Must be 0 or greater' },
//               }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Current Stock"
//                   type="number"
//                   fullWidth
//                   // variant="outlined"
//                   size="small"
//                   variant="standard"
//                   required
//                   error={!!errors.currentStock}
//                   helperText={errors.currentStock?.message}
//                   // onChange={(e) => field.onChange(parseFloat(e.target.value))}

//                   onChange={(e) =>
//                     field.onChange(
//                       e.target.value === '' ? 0 : Number(e.target.value)
//                     )
//                   }
//                 />
//               )}
//             />
//           </Grid>

//           {/* Reorder Level */}
//           <Grid item xs={12} md={4}>
//             <Controller
//               name="reorderLevel"
//               control={control}
//               rules={{
//                 required: 'Reorder level is required',
//                 min: { value: 0, message: 'Must be 0 or greater' },
//               }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Reorder Level"
//                   type="number"
//                   value={field.value ?? ''}
//                   fullWidth
//                   variant="standard"
//                   size="small"
//                   required
//                   error={!!errors.reorderLevel}
//                   helperText={
//                     errors.reorderLevel?.message ||
//                     'Alert when stock reaches this level'
//                   }
//                   onChange={(e) => field.onChange(parseFloat(e.target.value))}
//                 />
//               )}
//             />
//           </Grid>

//           {/* Max Stock Level */}
//           <Grid item xs={12} md={4}>
//             <Controller
//               name="maxStockLevel"
//               control={control}
//               rules={{
//                 min: { value: 0, message: 'Must be 0 or greater' },
//               }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Max Stock Level"
//                   type="number"
//                   value={field.value ?? ''}
//                   fullWidth
//                   variant="standard"
//                   size="small"
//                   error={!!errors.maxStockLevel}
//                   helperText={errors.maxStockLevel?.message}
//                   onChange={(e) =>
//                     field.onChange(
//                       e.target.value ? parseFloat(e.target.value) : undefined
//                     )
//                   }
//                 />
//               )}
//             />
//           </Grid>

//           <Grid item xs={12}>
//             <Typography
//               variant="subtitle2"
//               color="text.secondary"
//               sx={{ fontWeight: 600, mb: -1 }}
//             >
//               Material Costing
//             </Typography>
//           </Grid>
//           {/* Unit Cost */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="unitCost"
//               control={control}
//               rules={{
//                 min: { value: 0, message: 'Must be 0 or greater' },
//               }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Unit Cost"
//                   type="number"
//                   value={field.value ?? ''}
//                   fullWidth
//                   variant="standard"
//                   size="small"
//                   error={!!errors.unitCost}
//                   helperText={errors.unitCost?.message}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">₦</InputAdornment>
//                     ),
//                   }}
//                   onChange={(e) =>
//                     field.onChange(
//                       e.target.value ? parseFloat(e.target.value) : undefined
//                     )
//                   }
//                 />
//               )}
//             />
//           </Grid>

//           {/* Supplier */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="supplierId"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Supplier"
//                   fullWidth
//                   variant="standard"
//                   size="small"
//                   select
//                   helperText="Optional - link to supplier"
//                 >
//                   <MenuItem value="">
//                     <em>None</em>
//                   </MenuItem>
//                   {suppliers.map((supplier) => (
//                     <MenuItem key={supplier.id} value={supplier.id}>
//                       {supplier.name}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               )}
//             />
//           </Grid>

//           {/* Calculated Total Value */}
//           {totalValue > 0 && (
//             <Grid item xs={12}>
//               <Alert severity="info">
//                 <Typography variant="body2">
//                   <strong>Total Inventory Value:</strong>{' '}
//                   {new Intl.NumberFormat('en-NG', {
//                     style: 'currency',
//                     currency: 'NGN',
//                   }).format(totalValue)}
//                 </Typography>
//               </Alert>

//               {/* <Paper
//                 sx={{
//                   p: 2,
//                   backgroundColor: 'primary.light',
//                   color: 'primary.contrastText',
//                 }}
//               >
//                 <Typography variant="body2">
//                   <strong>Total Inventory Value:</strong>{' '}
//                   {new Intl.NumberFormat('en-NG', {
//                     style: 'currency',
//                     currency: 'NGN',
//                   }).format(totalValue)}
//                 </Typography>
//               </Paper> */}
//             </Grid>
//           )}

//           {/* Warning if stock below reorder level */}
//           {currentStock <= reorderLevel && (
//             <Grid item xs={12}>
//               <Alert
//                 severity="warning"
//                 sx={{
//                   fontSize: '14px',
//                 }}
//               >
//                 <strong>Warning:</strong> Current stock is at or below reorder
//                 level.
//               </Alert>
//             </Grid>
//           )}

//           {/* Action Buttons */}
//           <Grid item xs={12}>
//             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
//               <Button
//                 variant="outlined"
//                 onClick={onCancel}
//                 disabled={isLoading}
//                 sx={{
//                   borderColor: '#0F172A',
//                   color: '#0F172A',
//                   fontWeight: 'normal',
//                   fontSize: '14',
//                   '&:hover': {
//                     borderColor: '#020617',
//                   },
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 disabled={isLoading}
//                 sx={{
//                   backgroundColor: '#0F172A',
//                   fontWeight: 'bold',
//                   fontSize: '14',
//                   '&:hover': {
//                     backgroundColor: '#020617',
//                   },
//                 }}
//               >
//                 {isLoading
//                   ? 'Saving...'
//                   : initialData
//                   ? 'Update Material'
//                   : 'Create Material'}
//               </Button>
//             </Box>
//           </Grid>
//         </Grid>
//       </Box>
//     </Paper>
//   );
// }

'use client';

import { useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Autocomplete,
  InputAdornment,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MaterialFormData } from '@/types/inventory';
import Grid from '@mui/material/GridLegacy';

const CATEGORIES = [
  { value: 'PCB', label: 'PCB' },
  { value: 'ELECTRONIC_COMPONENT', label: 'Electronic Component' },
  { value: 'CONNECTOR', label: 'Connector' },
  { value: 'WIRE_CABLE', label: 'Wire / Cable' },
  { value: 'ENCLOSURE', label: 'Enclosure' },
  { value: 'PACKAGING_MATERIAL', label: 'Packaging Material' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'OTHER', label: 'Other' },
];

const UNITS = [
  'pcs',
  'kg',
  'g',
  'm',
  'cm',
  'mm',
  'liters',
  'rolls',
  'boxes',
  'sets',
  'pairs',
];

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
    reset,
  } = useForm<MaterialFormData>({
    defaultValues: {
      name: initialData?.name || '',
      partNumber: initialData?.partNumber || '',
      category: initialData?.category || '',
      unit: initialData?.unit || 'pcs',
      currentStock: initialData?.currentStock ?? 0,
      reorderLevel: initialData?.reorderLevel ?? 0,
      maxStockLevel: initialData?.maxStockLevel ?? undefined,
      unitCost: initialData?.unitCost ?? undefined,
      supplierId: initialData?.supplierId || '',
    },
  });

  const currentStock = useWatch({ control, name: 'currentStock' }) ?? 0;
  const reorderLevel = useWatch({ control, name: 'reorderLevel' }) ?? 0;
  const unitCost = useWatch({ control, name: 'unitCost' }) ?? 0;

  const totalValue = currentStock * unitCost;

  useEffect(() => {
    if (initialData) reset({ ...initialData });
  }, [initialData, reset]);

  return (
    <Paper sx={{ p: 4, borderRadius: 2, marginBottom: '20px' }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          {/* ── Identification ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
            >
              Material Identification
            </Typography>
            {/* <Divider sx={{ my: 1.5 }} /> */}
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Material Name"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="partNumber"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Part Number / MPN"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.partNumber}
                  helperText={
                    errors.partNumber?.message || 'Manufacturer Part Number'
                  }
                  size="small"
                  disabled={!!initialData}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  size="small"
                >
                  {CATEGORIES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="unit"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  freeSolo
                  options={UNITS}
                  onChange={(_, v) => field.onChange(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit"
                      required
                      variant="standard"
                      error={!!errors.unit}
                      helperText={errors.unit?.message || 'e.g. pcs, kg'}
                      size="small"
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* ── Stock ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Stock Management
            </Typography>
            {/* <Divider sx={{ my: 1.5 }} /> */}
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="currentStock"
              control={control}
              rules={{
                required: 'Required',
                min: { value: 0, message: '≥ 0' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Current Stock"
                  type="number"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.currentStock}
                  helperText={errors.currentStock?.message}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="reorderLevel"
              control={control}
              rules={{ required: 'Required', min: 0 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reorder Level"
                  type="number"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.reorderLevel}
                  helperText={errors.reorderLevel?.message || 'Reorder trigger'}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="maxStockLevel"
              control={control}
              rules={{ min: 0 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Max Stock"
                  type="number"
                  fullWidth
                  variant="standard"
                  error={!!errors.maxStockLevel}
                  helperText={errors.maxStockLevel?.message || 'Optional'}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              )}
            />
          </Grid>

          {/* ── Cost & Supplier ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Cost & Supplier
            </Typography>
            {/* <Divider sx={{ my: 1.5 }} /> */}
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="unitCost"
              control={control}
              rules={{ min: 0 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Unit Cost (₦)"
                  type="number"
                  fullWidth
                  variant="standard"
                  error={!!errors.unitCost}
                  helperText={
                    errors.unitCost?.message || 'Latest purchase price'
                  }
                  size="small"
                  //                   InputLabelProps={{ shrink: true }}

                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₦</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Preferred Supplier"
                  fullWidth
                  variant="standard"
                  size="small"
                  helperText="Optional"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Alerts */}
          {/* <Grid item xs={12}>
          <Box sx={{ mt: 1.5 }}>
            {totalValue > 0 && (
              <Alert severity="info" sx={{ py: 1, mb: 1.5 }}>
                Inventory Value:{' '}
                {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                }).format(totalValue)}
              </Alert>
            )}

            {currentStock <= reorderLevel && currentStock > 0 && (
              <Alert severity="warning" sx={{ py: 1 }}>
                Current stock ≤ reorder level
              </Alert>
            )}

            {currentStock === 0 && (
              <Alert severity="error" sx={{ py: 1 }}>
                Out of stock
              </Alert>
            )}
          </Box>
        </Grid> */}

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

          {/* Actions */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
                size="medium"
                sx={{ minWidth: 100 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  minWidth: 140,
                  bgcolor: '#0F172A',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
