// components/store/store-form.tsx

"use client";

import { useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Autocomplete,
  InputAdornment,
  Paper,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { StoreItemFormData } from "@/types/store";
import Grid from "@mui/material/GridLegacy";

const CATEGORIES = [
  { value: "INVERTER", label: "Inverter" },
  { value: "UPS", label: "UPS" },
  { value: "BATTERY", label: "Battery" },
  { value: "SOLAR_PANEL", label: "Solar Panel" },
  { value: "CHARGE_CONTROLLER", label: "Charge Controller" },
  { value: "ACCESSORY", label: "Accessory" },
  { value: "PACKAGE", label: "Package" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "REFURBISHED", label: "Refurbished" },
  { value: "RETURNED", label: "Returned" },
  { value: "DAMAGED", label: "Damaged" },
];

const UNITS = ["pcs", "units", "sets", "boxes", "cartons", "pallets"];

interface StoreFormProps {
  initialData?: Partial<StoreItemFormData>;
  onSubmit: (data: StoreItemFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  products?: Array<{ id: string; name: string; productNumber: string }>;
}

export default function StoreForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  products = [],
}: StoreFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StoreItemFormData>({
    defaultValues: {
      itemNumber: initialData?.itemNumber || "",
      name: initialData?.name || "",
      productId: initialData?.productId || "",
      category: initialData?.category || "",
      quantity: initialData?.quantity ?? 0,
      unit: initialData?.unit || "pcs",
      location: initialData?.location || "",
      condition: initialData?.condition || "NEW",
      unitPrice: initialData?.unitPrice ?? undefined,
      batchNumber: initialData?.batchNumber || "",
      productionDate: initialData?.productionDate || "",
      warrantyExpiry: initialData?.warrantyExpiry || "",
      notes: initialData?.notes || "",
    },
  });

  useEffect(() => {
    if (initialData) reset({ ...initialData });
  }, [initialData, reset]);

  return (
    <Paper sx={{ p: 4, borderRadius: 2, marginBottom: "20px" }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          {/* ── Identification ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
            >
              Item Identification
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="itemNumber"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Item Number"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.itemNumber}
                  helperText={errors.itemNumber?.message || "Unique identifier"}
                  size="small"
                  disabled={!!initialData?.itemNumber}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Item Name"
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
              name="productId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Product"
                  fullWidth
                  variant="standard"
                  error={!!errors.productId}
                  helperText={
                    errors.productId?.message ||
                    "Optional — link to produced product"
                  }
                  size="small"
                >
                  <MenuItem value="">
                    <em>External</em>
                  </MenuItem>
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} ({p.productNumber})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Required" }}
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

          {/* ── Stock Details ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Stock Details
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="quantity"
              control={control}
              rules={{
                required: "Required",
                min: { value: 0, message: "≥ 0" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quantity"
                  type="number"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="unit"
              control={control}
              rules={{ required: "Required" }}
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
                      helperText={errors.unit?.message || "e.g. pcs, units"}
                      size="small"
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="condition"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Condition"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.condition}
                  helperText={errors.condition?.message}
                  size="small"
                >
                  {CONDITIONS.map((opt) => (
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
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Storage Location"
                  fullWidth
                  variant="standard"
                  helperText="Warehouse / shelf location (optional)"
                  size="small"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="batchNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Batch Number"
                  fullWidth
                  variant="standard"
                  helperText="Production batch reference (optional)"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* ── Pricing & Dates ── */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Pricing & Dates
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="unitPrice"
              control={control}
              rules={{ min: 0 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Unit Price (₦)"
                  type="number"
                  fullWidth
                  variant="standard"
                  error={!!errors.unitPrice}
                  helperText={errors.unitPrice?.message || "Optional"}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₦</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="productionDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Production Date"
                  type="date"
                  fullWidth
                  variant="standard"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Optional"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="warrantyExpiry"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Warranty Expiry"
                  type="date"
                  fullWidth
                  variant="standard"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Optional"
                />
              )}
            />
          </Grid>

          {/* ── Notes ── */}
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  variant="standard"
                  size="small"
                  helperText="Any additional notes (optional)"
                />
              )}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
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
                  bgcolor: "#0F172A",
                  fontWeight: "bold",
                  "&:hover": { bgcolor: "#1e293b" },
                }}
              >
                {isLoading
                  ? "Saving..."
                  : initialData
                    ? "Update Item"
                    : "Create Item"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
