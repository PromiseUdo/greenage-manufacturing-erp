"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  MenuItem,
  IconButton,
  Chip,
  InputAdornment,
  CircularProgress,
  Stack,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Settings,
  Label,
  Construction,
  Description,
  Memory,
} from "@mui/icons-material";
import SimpleMaterialDialog from "@/components/inventory/simple-material-dialog";
import FileUpload from "@/components/inventory/file-upload";
import { FileAttachment } from "@/types/inventory";

// --- Design Tokens ---
const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 700,
  color: "#0F172A",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

const FormCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  border: "1px solid #E2E8F0",
  boxShadow: "none",
  marginBottom: theme.spacing(3),
}));

// --- Types ---
interface Specification {
  label: string;
  value: string;
}

interface BOMItem {
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
}

interface MaterialOption {
  id: string;
  name: string;
  partNumber: string;
  unit: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    productCode: "",
    model: "",
    costPrice: 0,
    warranty: "",
    leadTime: 0,
    notes: "",
    isActive: true,
    isAvailable: true,
  });

  const [specifications, setSpecifications] = useState<Specification[]>([
    { label: "", value: "" },
  ]);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // BOM State
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialOption | null>(null);
  const [materialQty, setMaterialQty] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Design Files State
  const [designFiles, setDesignFiles] = useState<FileAttachment[]>([]);

  // --- Fetch Data ---
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProduct(), fetchMaterials()]);
    };
    init();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      setFetchLoading(true);
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch product");

      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        productCode: data.productCode || "",
        model: data.model || "",
        costPrice: data.costPrice || 0,
        warranty: data.warranty || "",
        leadTime: data.leadTime || 0,
        notes: data.notes || "",
        isActive: data.isActive ?? true,
        isAvailable: data.isAvailable ?? true,
      });

      if (data.specifications && Array.isArray(data.specifications)) {
        setSpecifications(
          data.specifications.length > 0
            ? data.specifications
            : [{ label: "", value: "" }],
        );
      }

      if (data.tags && Array.isArray(data.tags)) {
        setTags(data.tags);
      }

      if (data.materials && Array.isArray(data.materials)) {
        setBomItems(
          data.materials.map((m: any) => ({
            materialId: m.material.id,
            name: m.material.name,
            quantity: m.quantity,
            unit: m.material.unit,
          })),
        );
      }

      if (data.designFiles && Array.isArray(data.designFiles)) {
        setDesignFiles(data.designFiles);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const res = await fetch("/api/inventory/materials?limit=1000");
      const data = await res.json();
      if (data.materials) {
        setMaterialOptions(
          data.materials.map((m: any) => ({
            id: m.id,
            name: m.name,
            partNumber: m.partNumber,
            unit: m.unit,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch materials", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // --- handlers ---
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSpecification = () => {
    setSpecifications([...specifications, { label: "", value: "" }]);
  };
  const handleRemoveSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };
  const handleSpecificationChange = (
    index: number,
    field: "label" | "value",
    value: string,
  ) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // --- BOM Logic ---
  const handleAddBOMItem = () => {
    if (selectedMaterial && materialQty > 0) {
      if (bomItems.some((item) => item.materialId === selectedMaterial.id)) {
        alert(
          "Material already added. Update quantity removing and re-adding.",
        );
        return;
      }
      setBomItems([
        ...bomItems,
        {
          materialId: selectedMaterial.id,
          name: selectedMaterial.name,
          quantity: materialQty,
          unit: selectedMaterial.unit,
        },
      ]);
      setSelectedMaterial(null);
      setMaterialQty(1);
    }
  };

  const handleRemoveBOMItem = (materialId: string) => {
    setBomItems(bomItems.filter((item) => item.materialId !== materialId));
  };

  const handleMaterialCreated = (newMaterial: any) => {
    const option = {
      id: newMaterial.id,
      name: newMaterial.name,
      partNumber: newMaterial.partNumber,
      unit: newMaterial.unit,
    };
    setMaterialOptions([...materialOptions, option]);
    setSelectedMaterial(option);
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const validSpecs = specifications.filter(
        (spec) => spec.label.trim() && spec.value.trim(),
      );
      if (validSpecs.length === 0)
        throw new Error("At least one specification is required");

      const payload = {
        ...formData,
        specifications: validSpecs,
        tags,
        materials: bomItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
        })),
        designFiles,
      };

      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update product");

      setSuccess("Product updated successfully!");
      // Don't redirect immediately to allow further edits, or redirect
      setTimeout(() => {
        router.push(`/products/${resolvedParams.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{
              mb: 1,
              textTransform: "none",
              color: "text.secondary",
              p: 0,
            }}
          >
            Back to Product
          </Button>
          <Typography variant="h5" fontWeight={700} color="#0F172A">
            Edit Product
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update technical specs, BOM, and design files.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* LEFT COLUMN - Main Form */}
          <Grid item xs={12} lg={8}>
            {/* 1. Core Details */}
            <FormCard>
              <SectionHeader>
                <Settings fontSize="small" /> Core Details
              </SectionHeader>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    variant="standard"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    disabled={loading}
                    placeholder="e.g. 5KVA Inverter"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    variant="standard"
                    required
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    disabled={loading}
                  >
                    {[
                      "INVERTER",
                      "UPS",
                      "BATTERY",
                      "SOLAR_PANEL",
                      "CHARGE_CONTROLLER",
                      "ACCESSORY",
                      "PACKAGE",
                      "OTHER",
                    ].map((c) => (
                      <MenuItem key={c} value={c}>
                        {c.replace("_", " ")}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Technical Description"
                    variant="standard"
                    required
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Code (Read Only)"
                    variant="standard"
                    value={formData.productCode}
                    disabled={true}
                    sx={{ bgcolor: "#F8FAFC", borderRadius: 1, px: 1 }}
                    InputProps={{ disableUnderline: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Model Number"
                    variant="standard"
                    value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    disabled={loading}
                    placeholder="e.g. NGI-5000"
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* 2. Specifications */}
            <FormCard>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  borderBottom: "1px solid #E2E8F0",
                  pb: 1,
                }}
              >
                <SectionHeader sx={{ mb: 0, borderBottom: "none", pb: 0 }}>
                  <Construction fontSize="small" /> Specifications
                </SectionHeader>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddSpecification}
                  size="small"
                  sx={{ textTransform: "none" }}
                >
                  Add Field
                </Button>
              </Box>

              {specifications.map((spec, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ mb: 2, alignItems: "center" }}
                >
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Label"
                      variant="standard"
                      size="small"
                      value={spec.label}
                      onChange={(e) =>
                        handleSpecificationChange(
                          index,
                          "label",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Power Output"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      variant="standard"
                      size="small"
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecificationChange(
                          index,
                          "value",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 5000W"
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleRemoveSpecification(index)}
                      disabled={specifications.length === 1}
                      color="error"
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </FormCard>

            {/* 3. Bill of Materials (BOM) */}
            <FormCard>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <SectionHeader>
                  <Memory fontSize="small" /> Bill of Materials
                </SectionHeader>
                <Button
                  startIcon={<Add />}
                  onClick={() => setDialogOpen(true)}
                  size="small"
                >
                  New Material
                </Button>
              </Box>

              <Box
                sx={{ display: "flex", gap: 2, alignItems: "flex-end", mb: 3 }}
              >
                <Autocomplete
                  options={materialOptions}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.partNumber})`
                  }
                  value={selectedMaterial}
                  onChange={(_, newValue) => setSelectedMaterial(newValue)}
                  loading={loadingMaterials}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Material"
                      variant="standard"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Qty"
                  type="number"
                  variant="standard"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(parseFloat(e.target.value))}
                  sx={{ width: 80 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {selectedMaterial?.unit || ""}
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddBOMItem}
                  disabled={!selectedMaterial || materialQty <= 0}
                  sx={{ bgcolor: "#0F172A", color: "white" }}
                >
                  Add
                </Button>
              </Box>

              {bomItems.length > 0 ? (
                <TableContainer
                  sx={{ border: "1px solid #E2E8F0", borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell>Material Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bomItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleRemoveBOMItem(item.materialId)
                              }
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
                >
                  No materials added yet.
                </Typography>
              )}
            </FormCard>

            {/* 4. Design Documentation */}
            <FormCard>
              <SectionHeader>
                <Description fontSize="small" /> Design Documentation
              </SectionHeader>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload Product Design UI, Line Diagrams, and Schematics.
              </Typography>
              <FileUpload
                files={designFiles}
                onChange={setDesignFiles}
                maxFiles={5}
                maxSizeMB={10}
                accept=".pdf,.png,.jpg,.jpeg,.svg"
              />
            </FormCard>
          </Grid>

          {/* RIGHT COLUMN - Meta & Actions */}
          <Grid item xs={12} lg={4}>
            {/* Financials */}
            <FormCard>
              <SectionHeader>Financials</SectionHeader>
              <TextField
                fullWidth
                label="Cost Price (Production)"
                variant="standard"
                type="number"
                required
                value={formData.costPrice}
                onChange={(e) =>
                  handleChange("costPrice", parseFloat(e.target.value) || 0)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₦</InputAdornment>
                  ),
                }}
                helperText="Total cost of production per unit"
              />
            </FormCard>

            {/* Production Settings */}
            <FormCard>
              <SectionHeader>Production Settings</SectionHeader>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Production Lead Time (Days)"
                    variant="standard"
                    type="number"
                    value={formData.leadTime}
                    onChange={(e) =>
                      handleChange("leadTime", parseInt(e.target.value) || 0)
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Warranty Period"
                    variant="standard"
                    value={formData.warranty}
                    onChange={(e) => handleChange("warranty", e.target.value)}
                    placeholder="e.g. 12 Months"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    variant="standard"
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      handleChange("isActive", e.target.value === "active")
                    }
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Availability"
                    variant="standard"
                    value={formData.isAvailable ? "available" : "unavailable"}
                    onChange={(e) =>
                      handleChange(
                        "isAvailable",
                        e.target.value === "available",
                      )
                    }
                  >
                    <MenuItem value="available">Orderable</MenuItem>
                    <MenuItem value="unavailable">Unavailable</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </FormCard>

            {/* Tags */}
            <FormCard>
              <SectionHeader>
                <Label fontSize="small" /> Tags
              </SectionHeader>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTag())
                  }
                />
                <Button
                  variant="contained"
                  onClick={handleAddTag}
                  sx={{ bgcolor: "#0F172A", minWidth: "auto" }}
                >
                  <Add fontSize="small" />
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    sx={{ bgcolor: "#F1F5F9", fontWeight: 500 }}
                  />
                ))}
                {tags.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No tags added.
                  </Typography>
                )}
              </Box>
            </FormCard>

            <FormCard>
              <TextField
                fullWidth
                label="Internal Notes"
                variant="standard"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Private notes..."
              />
            </FormCard>

            {/* Stick Action Bar */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#0F172A",
                color: "white",
                position: "sticky",
                top: 70, // adjusted for topbar
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#fff" }}
              >
                Update Product
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}
              >
                Changes reflect immediately.
              </Typography>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Save />
                    )
                  }
                  sx={{
                    bgcolor: "#fff",
                    color: "#0F172A",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#F1F5F9" },
                  }}
                >
                  {loading ? "Saving..." : "Save Product"}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => router.back()}
                  disabled={loading}
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Dialog for creating new material */}
      <SimpleMaterialDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleMaterialCreated}
      />
    </Box>
  );
}
