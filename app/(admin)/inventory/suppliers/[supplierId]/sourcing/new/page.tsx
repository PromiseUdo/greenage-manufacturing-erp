"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Autocomplete,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";

interface Material {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
  unitCost?: number;
}

interface POFormData {
  items: {
    materialId: string;
    materialName: string;
    partNumber: string;
    unit: string;
    quantity: number;
    unitCost: number;
  }[];
  tax: number;
  discount: number;
  notes: string;
}

export default function NewPurchaseOrderPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = use(params);
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supplierName, setSupplierName] = useState("");

  // New material dialog
  const [newMaterialDialog, setNewMaterialDialog] = useState(false);
  const [newMaterialData, setNewMaterialData] = useState({
    name: "",
    partNumber: "",
    unit: "pcs",
    category: "OTHER",
  });
  const [creatingMaterial, setCreatingMaterial] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<POFormData>({
    defaultValues: {
      items: [
        {
          materialId: "",
          materialName: "",
          partNumber: "",
          unit: "",
          quantity: 1,
          unitCost: 0,
        },
      ],
      tax: 0,
      discount: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedTax = watch("tax");
  const watchedDiscount = watch("discount");

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
    0,
  );
  const totalAmount = subtotal + (watchedTax || 0) - (watchedDiscount || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, supplierRes] = await Promise.all([
          fetch("/api/inventory/materials?limit=1000"),
          fetch(`/api/inventory/suppliers/${supplierId}`),
        ]);
        const [materialsData, supplierData] = await Promise.all([
          materialsRes.json(),
          supplierRes.json(),
        ]);
        setMaterials(materialsData.materials || []);
        setSupplierName(supplierData.name || "");
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [supplierId]);

  const handleCreateMaterial = async () => {
    try {
      setCreatingMaterial(true);
      const res = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMaterialData,
          currentStock: 0,
          reorderLevel: 0,
          supplierId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create material");
      }

      const material = await res.json();
      setMaterials((prev) => [...prev, material]);
      setNewMaterialDialog(false);
      setNewMaterialData({
        name: "",
        partNumber: "",
        unit: "pcs",
        category: "OTHER",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingMaterial(false);
    }
  };

  const handleFormSubmit = async (data: POFormData) => {
    try {
      setLoading(true);
      setError("");

      const enrichedItems = data.items.map((item) => ({
        ...item,
        totalCost: item.quantity * item.unitCost,
      }));

      const res = await fetch("/api/inventory/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: enrichedItems,
          tax: data.tax,
          discount: data.discount,
          notes: data.notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create purchase order");
      }

      const po = await res.json();
      router.push(`/inventory/suppliers/${supplierId}/sourcing/${po.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          Back to Sourcing
        </Button>

        <Typography variant="h5" fontWeight={700}>
          New Purchase Order
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a purchase order for {supplierName || "supplier"}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Items Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Line Items
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setNewMaterialDialog(true)}
                sx={{ fontSize: 12 }}
              >
                + New Material
              </Button>
              <Tooltip title="Add Item">
                <IconButton
                  size="small"
                  onClick={() =>
                    append({
                      materialId: "",
                      materialName: "",
                      partNumber: "",
                      unit: "",
                      quantity: 1,
                      unitCost: 0,
                    })
                  }
                  sx={{ bgcolor: "#f0f0f0" }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Items */}
          {fields.map((field, index) => (
            <Box
              key={field.id}
              sx={{
                mb: 3,
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: index % 2 === 0 ? "transparent" : "action.hover",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
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

              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Controller
                    name={`items.${index}.materialId`}
                    control={control}
                    rules={{ required: "Material is required" }}
                    render={({ field: formField }) => {
                      const selectedMaterial =
                        materials.find((m) => m.id === formField.value) || null;

                      return (
                        <Autocomplete<Material>
                          options={materials}
                          value={selectedMaterial}
                          getOptionLabel={(o) => `${o.partNumber} – ${o.name}`}
                          onChange={(_, value) => {
                            formField.onChange(value?.id || "");
                            if (value) {
                              const itemsArr = watchedItems;
                              itemsArr[index] = {
                                ...itemsArr[index],
                                materialId: value.id,
                                materialName: value.name,
                                partNumber: value.partNumber,
                                unit: value.unit,
                                unitCost: value.unitCost || 0,
                              };
                            }
                          }}
                          disabled={loading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Material"
                              variant="standard"
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
                <Grid item xs={6} md={2}>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    rules={{
                      required: "Required",
                      min: { value: 1, message: "Min 1" },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Quantity"
                        type="number"
                        variant="standard"
                        fullWidth
                        disabled={loading}
                        error={!!errors.items?.[index]?.quantity}
                        helperText={errors.items?.[index]?.quantity?.message}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <Controller
                    name={`items.${index}.unitCost`}
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Unit Cost (₦)"
                        type="number"
                        variant="standard"
                        fullWidth
                        disabled={loading}
                        error={!!errors.items?.[index]?.unitCost}
                        helperText={errors.items?.[index]?.unitCost?.message}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Line Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      ₦
                      {(
                        (watchedItems[index]?.quantity || 0) *
                        (watchedItems[index]?.unitCost || 0)
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Totals */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    variant="standard"
                    fullWidth
                    multiline
                    rows={3}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Controller
                      name="tax"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Tax (₦)"
                          type="number"
                          variant="standard"
                          fullWidth
                          disabled={loading}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      name="discount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Discount (₦)"
                          type="number"
                          variant="standard"
                          fullWidth
                          disabled={loading}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₦
                      {subtotal.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                  {(watchedTax || 0) > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Tax
                      </Typography>
                      <Typography variant="body2">
                        +₦
                        {(watchedTax || 0).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                  )}
                  {(watchedDiscount || 0) > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Discount
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        -₦
                        {(watchedDiscount || 0).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      ₦
                      {totalAmount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => router.back()}
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              disableElevation
              sx={{
                minWidth: 180,
                bgcolor: "#0F172A",
                fontWeight: 600,
                "&:hover": { bgcolor: "#1E293B" },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Create Purchase Order"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* New Material Dialog */}
      <Dialog
        open={newMaterialDialog}
        onClose={() => setNewMaterialDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Material</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This material will be created with 0 stock and linked to this
            supplier.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Material Name"
                fullWidth
                variant="standard"
                required
                value={newMaterialData.name}
                onChange={(e) =>
                  setNewMaterialData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Part Number"
                fullWidth
                variant="standard"
                required
                value={newMaterialData.partNumber}
                onChange={(e) =>
                  setNewMaterialData((p) => ({
                    ...p,
                    partNumber: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Unit"
                fullWidth
                variant="standard"
                value={newMaterialData.unit}
                onChange={(e) =>
                  setNewMaterialData((p) => ({ ...p, unit: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setNewMaterialDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            disabled={
              creatingMaterial ||
              !newMaterialData.name ||
              !newMaterialData.partNumber
            }
            onClick={handleCreateMaterial}
            sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" } }}
          >
            {creatingMaterial ? "Creating..." : "Create Material"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
