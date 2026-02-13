"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { MaterialFormData } from "@/types/inventory";
import Grid from "@mui/material/GridLegacy";

const CATEGORIES = [
  { value: "PCB", label: "PCB" },
  { value: "ELECTRONIC_COMPONENT", label: "Electronic Component" },
  { value: "CONNECTOR", label: "Connector" },
  { value: "WIRE_CABLE", label: "Wire / Cable" },
  { value: "ENCLOSURE", label: "Enclosure" },
  { value: "PACKAGING_MATERIAL", label: "Packaging Material" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "OTHER", label: "Other" },
];

const UNITS = [
  "pcs",
  "kg",
  "g",
  "m",
  "cm",
  "mm",
  "liters",
  "rolls",
  "boxes",
  "sets",
  "pairs",
];

interface SimpleMaterialDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (material: any) => void;
}

export default function SimpleMaterialDialog({
  open,
  onClose,
  onSuccess,
}: SimpleMaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialFormData>({
    defaultValues: {
      name: "",
      partNumber: "",
      category: "",
      unit: "pcs",
      currentStock: 0,
      reorderLevel: 0,
    },
  });

  const onSubmit = async (data: MaterialFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          currentStock: 0,
          reorderLevel: 0,
          unitCost: 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create material");
      }

      onSuccess(result);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Add New Material</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new material record. Stock will be initialized to 0.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Material Name"
                    fullWidth
                    required
                    variant="outlined"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="partNumber"
                control={control}
                rules={{ required: "Part number is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Number"
                    fullWidth
                    required
                    variant="outlined"
                    error={!!errors.partNumber}
                    helperText={errors.partNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Category"
                    fullWidth
                    required
                    variant="outlined"
                    error={!!errors.category}
                    helperText={errors.category?.message}
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

            <Grid item xs={12} sm={6}>
              <Controller
                name="unit"
                control={control}
                rules={{ required: "Unit is required" }}
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
                        variant="outlined"
                        error={!!errors.unit}
                        helperText={errors.unit?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" } }}
          >
            {loading ? "Creating..." : "Create Material"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
