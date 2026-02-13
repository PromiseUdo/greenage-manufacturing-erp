"use client";

import { useState, useEffect } from "react";
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      // Fetch all materials for autocomplete (could be optimized with search)
      const res = await fetch("/api/inventory/materials?limit=1000"); // Fetch enough for now
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

  const handleAddBOMItem = () => {
    if (selectedMaterial && materialQty > 0) {
      // Check if already exists
      if (bomItems.some((item) => item.materialId === selectedMaterial.id)) {
        alert("Material already likely added. Update quantity instead.");
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
    // Add to options and select it
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

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create product");

      router.push(`/products/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            Back to Products
          </Button>
          <Typography variant="h5" fontWeight={700} color="#0F172A">
            New Product
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define technical specs, BOM, and design documentation.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
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
                    label="Product Code Prefix *"
                    variant="standard"
                    required
                    value={formData.productCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 4);
                      handleChange("productCode", value);
                    }}
                    disabled={loading}
                    placeholder="e.g. INV5"
                    helperText="Unique 3-4 char ID prefix (e.g. INV5)"
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
                top: 24,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#fff" }}
              >
                Create Product
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}
              >
                Ensure all technical specifications and BOM are correct.
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
                  {loading ? "Processing..." : "Save Product"}
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
