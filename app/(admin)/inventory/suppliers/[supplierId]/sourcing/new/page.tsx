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
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Build as ToolIcon,
  Category as MaterialIcon,
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";

interface Material {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
  unitCost?: number;
}

// Unified option shown in the tool autocomplete.
// isGroup=true  → ToolGroup record (many identical units)
// isGroup=false → standalone Tool record (single unique unit)
interface ToolOption {
  id: string;
  name: string;
  displayNumber: string; // groupNumber or toolId
  category: string;
  unitCost?: number;
  isGroup: boolean;
  totalQuantity?: number;
  availableQuantity?: number;
}

interface POFormData {
  items: {
    itemType: "material" | "tool";
    // material fields
    materialId: string;
    materialName: string;
    partNumber: string;
    // grouped-tool fields (ToolGroup)
    toolGroupId: string;
    toolGroupName: string;
    groupNumber: string;
    // standalone-tool fields
    toolId: string;
    toolName: string;
    toolNumber: string;
    // shared
    unit: string;
    quantity: number;
    unitCost: number;
  }[];
  tax: number;
  discount: number;
  notes: string;
}

const emptyItem = (): POFormData["items"][number] => ({
  itemType: "material",
  materialId: "",
  materialName: "",
  partNumber: "",
  toolGroupId: "",
  toolGroupName: "",
  groupNumber: "",
  toolId: "",
  toolName: "",
  toolNumber: "",
  unit: "",
  quantity: 1,
  unitCost: 0,
});

export default function NewPurchaseOrderPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  const [materials, setMaterials] = useState<Material[]>([]);
  const [toolOptions, setToolOptions] = useState<ToolOption[]>([]);
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

  // New tool dialog
  const [newToolDialog, setNewToolDialog] = useState(false);
  const [newToolType, setNewToolType] = useState<"group" | "standalone">("group");
  const [newToolData, setNewToolData] = useState({
    name: "",
    category: "OTHER",
    quantity: 1,
    unitCost: 0,
  });
  const [newToolErrors, setNewToolErrors] = useState<Record<string, string>>({});
  const [creatingTool, setCreatingTool] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<POFormData>({
    defaultValues: {
      items: [emptyItem()],
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
        const [materialsRes, supplierRes, toolGroupsRes, toolsRes] =
          await Promise.all([
            fetch("/api/inventory/materials?limit=1000"),
            fetch(`/api/inventory/suppliers/${supplierId}`),
            fetch("/api/inventory/tool-groups?limit=1000"),
            fetch("/api/inventory/tools?limit=1000"),
          ]);
        const [materialsData, supplierData, toolGroupsData, toolsData] =
          await Promise.all([
            materialsRes.json(),
            supplierRes.json(),
            toolGroupsRes.json(),
            toolsRes.json(),
          ]);

        setMaterials(materialsData.materials || []);
        setSupplierName(supplierData.name || "");

        // Tool groups → one option per group (represents many identical units)
        const groupOptions: ToolOption[] = (
          toolGroupsData.toolGroups || []
        ).map((g: any) => ({
          id: g.id,
          name: g.name,
          displayNumber: g.groupNumber,
          category: g.category,
          unitCost: g.unitCost,
          isGroup: true,
          totalQuantity: g.totalQuantity,
          availableQuantity: g.availableQuantity,
        }));

        // Standalone tools → one option per unique tool (no group)
        const standaloneOptions: ToolOption[] = (
          toolsData.standaloneTools || []
        ).map((t: any) => ({
          id: t.id,
          name: t.name,
          displayNumber: t.toolId,
          category: t.category,
          unitCost: t.purchaseCost,
          isGroup: false,
        }));

        setToolOptions([...groupOptions, ...standaloneOptions]);
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
      setNewMaterialData({ name: "", partNumber: "", unit: "pcs", category: "OTHER" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingMaterial(false);
    }
  };

  const handleCreateTool = async () => {
    // Validate
    const errs: Record<string, string> = {};
    if (!newToolData.name.trim()) errs.name = "Name is required";
    if (!newToolData.category) errs.category = "Category is required";
    if (newToolType === "group" && (!newToolData.quantity || newToolData.quantity < 1))
      errs.quantity = "Quantity must be at least 1";
    if (Object.keys(errs).length) { setNewToolErrors(errs); return; }
    setNewToolErrors({});

    try {
      setCreatingTool(true);
      const res = await fetch("/api/inventory/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newToolData.name.trim(),
          category: newToolData.category,
          unitCost: newToolData.unitCost || undefined,
          quantity: newToolType === "group" ? newToolData.quantity : undefined,
          isGrouped: newToolType === "group",
          // Standalone tools created from PO are placeholders — stock is set on receipt
          currentStock: newToolType === "standalone" ? 0 : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create tool");
      }

      const result = await res.json();

      if (newToolType === "group") {
        // result = { group: ToolGroup, toolCount: N }
        const g = result.group;
        setToolOptions((prev) => [
          ...prev,
          {
            id: g.id,
            name: g.name,
            displayNumber: g.groupNumber,
            category: g.category,
            unitCost: g.unitCost,
            isGroup: true,
            totalQuantity: g.totalQuantity,
            availableQuantity: g.availableQuantity,
          },
        ]);
      } else {
        // result = Tool record
        setToolOptions((prev) => [
          ...prev,
          {
            id: result.id,
            name: result.name,
            displayNumber: result.toolId,
            category: result.category,
            unitCost: result.purchaseCost,
            isGroup: false,
          },
        ]);
      }

      setNewToolDialog(false);
      setNewToolData({ name: "", category: "OTHER", quantity: 1, unitCost: 0 });
      setNewToolType("group");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingTool(false);
    }
  };

  const handleFormSubmit = async (data: POFormData) => {
    try {
      setLoading(true);
      setError("");

      const enrichedItems = data.items.map((item) => {
        if (item.itemType === "tool") {
          // Grouped tool: references the ToolGroup
          if (item.toolGroupId) {
            return {
              itemType: "tool",
              toolGroupId: item.toolGroupId,
              toolGroupName: item.toolGroupName,
              groupNumber: item.groupNumber,
              unit: item.unit || "unit",
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            };
          }
          // Standalone tool: references a single Tool record
          return {
            itemType: "tool",
            toolId: item.toolId,
            toolName: item.toolName,
            toolNumber: item.toolNumber,
            unit: item.unit || "unit",
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          };
        }
        return {
          itemType: "material",
          materialId: item.materialId,
          materialName: item.materialName,
          partNumber: item.partNumber,
          unit: item.unit,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        };
      });

      const res = await fetch("/api/inventory/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: enrichedItems,
          tax: data.tax,
          discount: data.discount,
          notes: data.notes,
          ...(groupId ? { groupId } : {}),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create purchase order");
      }

      const po = await res.json();
      if (groupId) {
        router.push(`/inventory/po-groups/${groupId}`);
      } else {
        router.push(`/inventory/suppliers/${supplierId}/sourcing/${po.id}`);
      }
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
        sx={{ p: 4, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
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
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setNewMaterialDialog(true)}
                sx={{ fontSize: 12 }}
              >
                + New Material
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setNewToolDialog(true)}
                sx={{ fontSize: 12, borderColor: "#c7d2fe", color: "#4338ca" }}
              >
                + New Tool
              </Button>
              <Tooltip title="Add Line Item">
                <IconButton
                  size="small"
                  onClick={() => append(emptyItem())}
                  sx={{ bgcolor: "#f0f0f0" }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Items */}
          {fields.map((field, index) => {
            const itemType = watchedItems[index]?.itemType || "material";
            return (
              <Box
                key={field.id}
                sx={{
                  mb: 3,
                  p: 2.5,
                  border: "1px solid",
                  borderColor: itemType === "tool" ? "#c7d2fe" : "divider",
                  borderRadius: 2,
                  bgcolor:
                    itemType === "tool"
                      ? "#eef2ff"
                      : index % 2 === 0
                        ? "transparent"
                        : "action.hover",
                }}
              >
                {/* Row header: item number + type toggle + remove */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Item {index + 1}
                    </Typography>
                    <Controller
                      name={`items.${index}.itemType`}
                      control={control}
                      render={({ field: f }) => (
                        <ToggleButtonGroup
                          size="small"
                          value={f.value}
                          exclusive
                          onChange={(_, val) => {
                            if (!val) return;
                            f.onChange(val);
                            // Reset item-specific fields when switching type
                            setValue(`items.${index}.materialId`, "");
                            setValue(`items.${index}.materialName`, "");
                            setValue(`items.${index}.partNumber`, "");
                            setValue(`items.${index}.toolGroupId`, "");
                            setValue(`items.${index}.toolGroupName`, "");
                            setValue(`items.${index}.groupNumber`, "");
                            setValue(`items.${index}.toolId`, "");
                            setValue(`items.${index}.toolName`, "");
                            setValue(`items.${index}.toolNumber`, "");
                            setValue(`items.${index}.unit`, "");
                            setValue(`items.${index}.unitCost`, 0);
                          }}
                          sx={{
                            "& .MuiToggleButton-root": {
                              py: 0.25,
                              px: 1.25,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "none",
                              border: "1px solid #e2e8f0",
                            },
                            "& .Mui-selected": {
                              bgcolor:
                                f.value === "tool" ? "#4f46e5 !important" : "#0F172A !important",
                              color: "white !important",
                            },
                          }}
                        >
                          <ToggleButton value="material">
                            <MaterialIcon sx={{ fontSize: 13, mr: 0.5 }} />
                            Material
                          </ToggleButton>
                          <ToggleButton value="tool">
                            <ToolIcon sx={{ fontSize: 13, mr: 0.5 }} />
                            Tool
                          </ToggleButton>
                        </ToggleButtonGroup>
                      )}
                    />
                  </Box>
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
                  {/* Item picker — material or tool group */}
                  <Grid item xs={12} md={5}>
                    {itemType === "material" ? (
                      <Controller
                        name={`items.${index}.materialId`}
                        control={control}
                        rules={{ required: "Material is required" }}
                        render={({ field: formField }) => {
                          const selected =
                            materials.find((m) => m.id === formField.value) ||
                            null;
                          return (
                            <Autocomplete<Material>
                              options={materials}
                              value={selected}
                              getOptionLabel={(o) =>
                                `${o.partNumber} – ${o.name}`
                              }
                              onChange={(_, value) => {
                                formField.onChange(value?.id || "");
                                if (value) {
                                  setValue(
                                    `items.${index}.materialName`,
                                    value.name,
                                  );
                                  setValue(
                                    `items.${index}.partNumber`,
                                    value.partNumber,
                                  );
                                  setValue(
                                    `items.${index}.unit`,
                                    value.unit,
                                  );
                                  setValue(
                                    `items.${index}.unitCost`,
                                    value.unitCost || 0,
                                  );
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
                    ) : (
                      <Controller
                        name={`items.${index}.toolGroupId`}
                        control={control}
                        rules={{
                          validate: () => {
                            const hasGroup = !!watchedItems[index]?.toolGroupId;
                            const hasStandalone = !!watchedItems[index]?.toolId;
                            return hasGroup || hasStandalone || "Select a tool";
                          },
                        }}
                        render={({ field: formField }) => {
                          const currentGroupId = formField.value;
                          const currentToolId = watchedItems[index]?.toolId;
                          const selected =
                            toolOptions.find(
                              (o) =>
                                (o.isGroup && o.id === currentGroupId) ||
                                (!o.isGroup && o.id === currentToolId),
                            ) || null;
                          return (
                            <Autocomplete<ToolOption>
                              options={toolOptions}
                              value={selected}
                              groupBy={(o) =>
                                o.isGroup ? "Tool Groups" : "Standalone Tools"
                              }
                              getOptionLabel={(o) =>
                                `${o.displayNumber} – ${o.name}`
                              }
                              renderOption={(props, option) => {
                                const { key, ...rest } = props;
                                return (
                                  <li key={option.id} {...rest}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {option.displayNumber} — {option.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {option.category.replace(/_/g, " ")}
                                        {option.isGroup
                                          ? ` • ${option.availableQuantity} available`
                                          : " • Single unit"}
                                      </Typography>
                                    </Box>
                                  </li>
                                );
                              }}
                              onChange={(_, value) => {
                                // Clear both sets of fields first
                                setValue(`items.${index}.toolGroupId`, "");
                                setValue(`items.${index}.toolGroupName`, "");
                                setValue(`items.${index}.groupNumber`, "");
                                setValue(`items.${index}.toolId`, "");
                                setValue(`items.${index}.toolName`, "");
                                setValue(`items.${index}.toolNumber`, "");

                                if (!value) return;
                                setValue(`items.${index}.unit`, "unit");
                                setValue(`items.${index}.unitCost`, value.unitCost || 0);

                                if (value.isGroup) {
                                  formField.onChange(value.id);
                                  setValue(`items.${index}.toolGroupName`, value.name);
                                  setValue(`items.${index}.groupNumber`, value.displayNumber);
                                } else {
                                  formField.onChange("");
                                  setValue(`items.${index}.toolId`, value.id);
                                  setValue(`items.${index}.toolName`, value.name);
                                  setValue(`items.${index}.toolNumber`, value.displayNumber);
                                }
                              }}
                              disabled={loading}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Tool"
                                  variant="standard"
                                  required
                                  error={!!errors.items?.[index]?.toolGroupId}
                                  helperText={
                                    errors.items?.[index]?.toolGroupId?.message
                                  }
                                />
                              )}
                            />
                          );
                        }}
                      />
                    )}
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={6} md={2}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      rules={{ required: "Required", min: { value: 1, message: "Min 1" } }}
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

                  {/* Unit Cost */}
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

                  {/* Line Total */}
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
            );
          })}

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
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                    sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
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
                      sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
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
                      sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
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
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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

      {/* New Tool Dialog */}
      <Dialog
        open={newToolDialog}
        onClose={() => {
          setNewToolDialog(false);
          setNewToolErrors({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Add New Tool</DialogTitle>
        <DialogContent>
          {/* Group vs Standalone toggle */}
          <Box sx={{ mb: 3, mt: 0.5 }}>
            <ToggleButtonGroup
              value={newToolType}
              exclusive
              onChange={(_, val) => {
                if (val) { setNewToolType(val); setNewToolErrors({}); }
              }}
              size="small"
              fullWidth
            >
              <ToggleButton value="group" sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}>
                <ToolIcon sx={{ fontSize: 14, mr: 0.75 }} />
                Tool Group
                <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
                  — multiple identical units
                </Typography>
              </ToggleButton>
              <ToggleButton value="standalone" sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}>
                <ToolIcon sx={{ fontSize: 14, mr: 0.75 }} />
                Single Tool
                <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
                  — one unique item
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {newToolType === "group"
                ? "Creates a Tool Group and the specified number of individual unit records."
                : "Creates a single standalone tool record tracked as a unique item."}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Name */}
            <Grid item xs={12}>
              <TextField
                label="Tool Name"
                fullWidth
                variant="standard"
                required
                value={newToolData.name}
                onChange={(e) =>
                  setNewToolData((p) => ({ ...p, name: e.target.value }))
                }
                error={!!newToolErrors.name}
                helperText={newToolErrors.name}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={newToolType === "group" ? 6 : 12}>
              <FormControl
                fullWidth
                variant="standard"
                required
                error={!!newToolErrors.category}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  value={newToolData.category}
                  onChange={(e) =>
                    setNewToolData((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  {[
                    "HAND_TOOL",
                    "POWER_TOOL",
                    "MEASURING_TOOL",
                    "TESTING_EQUIPMENT",
                    "SAFETY_EQUIPMENT",
                    "WORKSTATION",
                    "LIFTING_EQUIPMENT",
                    "OTHER",
                  ].map((c) => (
                    <MenuItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
                {newToolErrors.category && (
                  <FormHelperText>{newToolErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Quantity — group only */}
            {newToolType === "group" && (
              <Grid item xs={6}>
                <TextField
                  label="No. of Units"
                  fullWidth
                  variant="standard"
                  type="number"
                  required
                  value={newToolData.quantity}
                  onChange={(e) =>
                    setNewToolData((p) => ({
                      ...p,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  inputProps={{ min: 1 }}
                  error={!!newToolErrors.quantity}
                  helperText={
                    newToolErrors.quantity ||
                    "How many identical units exist in this group"
                  }
                />
              </Grid>
            )}

            {/* Unit cost */}
            <Grid item xs={12}>
              <TextField
                label="Unit Cost (₦) — optional"
                fullWidth
                variant="standard"
                type="number"
                value={newToolData.unitCost || ""}
                onChange={(e) =>
                  setNewToolData((p) => ({
                    ...p,
                    unitCost: parseFloat(e.target.value) || 0,
                  }))
                }
                inputProps={{ min: 0 }}
                helperText="Will pre-fill the unit cost field when this tool is selected on a PO line"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setNewToolDialog(false);
              setNewToolErrors({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={creatingTool || !newToolData.name.trim()}
            onClick={handleCreateTool}
            sx={{ bgcolor: "#4338ca", "&:hover": { bgcolor: "#3730a3" } }}
          >
            {creatingTool
              ? "Creating..."
              : newToolType === "group"
                ? "Create Tool Group"
                : "Create Tool"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
