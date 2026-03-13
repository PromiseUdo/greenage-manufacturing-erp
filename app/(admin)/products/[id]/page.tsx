"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  AttachFile as AttachIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomIcon,
  Description as DescriptionIcon,
  Memory as MemoryIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Types ---
interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface ProductMaterial {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
    category: string;
  };
}

interface ProductDetail {
  id: string;
  name: string;
  productNumber: string;
  description: string;
  category: string;
  productCode: string;
  model: string;
  costPrice: number;
  currency: string;
  isActive: boolean;
  warranty: string;
  leadTime: number;
  designFiles: FileAttachment[];
  materials: ProductMaterial[];
  specifications: { label: string; value: string }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string };
  _count: {
    quotes: number;
    orders: number;
    invoices: number;
  };
}

// --- Styles ---
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

const InfoRow = ({
  label,
  value,
  highlight,
  bold,
  chip,
  chipColor,
  chipBgColor,
  valueColor,
}: {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string;
  chipBgColor?: string;
  valueColor?: string;
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
      borderBottom: "1px dashed",
      borderColor: "divider",
      pb: 1,
      "&:last-child": {
        borderBottom: "none",
        mb: 0,
        pb: 0,
      },
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
      {label}:
    </Typography>
    {chip ? (
      <Chip
        label={value as string}
        size="small"
        sx={{
          fontWeight: 500,
          color: chipColor || "inherit",
          backgroundColor: chipBgColor || "inherit",
          height: 24,
        }}
      />
    ) : (
      <Typography
        variant="body2"
        component="div"
        sx={{
          fontWeight: bold || highlight ? 600 : 400,
          color: valueColor || (highlight ? "error.main" : "text.primary"),
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    )}
  </Box>
);

const categoryColors: Record<string, { bg: string; text: string }> = {
  INVERTER: { bg: "#dbeafe", text: "#1e40af" },
  UPS: { bg: "#fce7f3", text: "#9f1239" },
  BATTERY: { bg: "#fef3c7", text: "#92400e" },
  SOLAR_PANEL: { bg: "#d1fae5", text: "#065f46" },
  CHARGE_CONTROLLER: { bg: "#e0e7ff", text: "#4338ca" },
  SOLAR_GENERATOR: { bg: "#e0e7ff", text: "#4338ca" },
  ACCESSORY: { bg: "#f3f4f6", text: "#374151" },
  PACKAGE: { bg: "#fae8ff", text: "#86198f" },
  OTHER: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update product status");

      setSuccess("Product status updated successfully");
      fetchProduct();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownloadBOM = () => {
    if (!product) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bill of Materials - ${product.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Product Code: ${product.productCode}`, 14, 22);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 27);

    const tableData = product.materials.map((pm) => [
      pm.material.name,
      pm.material.partNumber,
      pm.material.category.replace(/_/g, " "),
      `${pm.quantity} ${pm.material.unit}`,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["Material Name", "Part Number", "Category", "Quantity"]],
      body: tableData,
    });

    doc.save(`${product.productCode}_BOM.pdf`);
  };

  const handleDownload = (file: FileAttachment) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <PdfIcon sx={{ color: "#d32f2f", fontSize: 40 }} />;
    }
    if (type.startsWith("image/")) {
      return <ImageIcon sx={{ color: "#1976d2", fontSize: 40 }} />;
    }
    return <AttachIcon sx={{ fontSize: 40 }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box>
        <Alert severity="error">{error || "Product not found"}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      {/* Print Header */}
      <Box
        sx={{ display: "none", "@media print": { display: "block", mb: 4 } }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 2,
            borderBottom: "2px solid #0F172A",
            pb: 2,
          }}
        >
          <Box>
            {/* <Typography variant="h4" fontWeight={700} color="#0F172A">
              GREENAGE
            </Typography>
            <Typography variant="caption" color="text.secondary">
              POWER SOLUTIONS
            </Typography> */}
            {/* <img
              src="/greenage_logo_black.png"
              alt="Greenage Technologies"
              style={{
                height: "60px",
                maxWidth: "200px",
                objectFit: "contain",
              }}
            /> */}
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.02em",
              }}
            >
              LOGO
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h5" fontWeight={600} color="#0F172A">
              Technical Specification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {product.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Product Code
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {product.productCode}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Model
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {product.model || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Category
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {product.category?.replace(/_/g, " ") || "-"}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Warranty
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {product.warranty || "N/A"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Default Header */}
      <Box sx={{ mb: 3, "@media print": { display: "none" } }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/products")}
          sx={{ mb: 2 }}
        >
          Back to Products
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {product.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip label={product.productNumber} size="small" />
              <Chip
                label={product.category?.replace(/_/g, " ") || ""}
                size="small"
                sx={{
                  bgcolor: categoryColors[product.category]?.bg || "#f3f4f6",
                  color: categoryColors[product.category]?.text || "#6b7280",
                  fontWeight: 500,
                }}
              />
              <Chip
                label={product.isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  fontWeight: 500,
                  bgcolor: product.isActive ? "#e8f5e9" : "#ffebee",
                  color: product.isActive ? "#2e7d32" : "#d32f2f",
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ "@media print": { display: "none" } }} // Hide button when printing
            >
              Print Tech Spec
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/products/${product.id}/edit`)}
              sx={{
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#1e293b" },
                "@media print": { display: "none" },
              }}
            >
              Edit Product
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{ "@media print": { flexBasis: "100%", maxWidth: "100%" } }}
        >
          {/* Technical Specifications */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <SectionHeader>
              <DescriptionIcon fontSize="small" /> Technical Specifications
            </SectionHeader>

            {product.specifications && product.specifications.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {product.specifications.map((spec: any, index: number) => (
                  <InfoRow key={index} label={spec.label} value={spec.value} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No specifications listed.
              </Typography>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #eee" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                {product.description || "No description provided."}
              </Typography>
            </Box>
          </Paper>

          {/* Bill of Materials (BOM) */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              overflow: "hidden",
              "@media print": { breakBefore: "page" },
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SectionHeader sx={{ mb: 0 }}>
                <MemoryIcon fontSize="small" /> Bill of Materials (BOM)
              </SectionHeader>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={handleDownloadBOM}
                sx={{ "@media print": { display: "none" } }}
              >
                Download PDF
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Material Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Part Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Qty Required
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.materials && product.materials.length > 0 ? (
                    product.materials.map((pm) => (
                      <TableRow key={pm.id} hover>
                        <TableCell>{pm.material.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={pm.material.partNumber}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          {pm.material.category.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {pm.quantity} {pm.material.unit}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          py: 4,
                          color: "text.secondary",
                          fontStyle: "italic",
                        }}
                      >
                        No materials linked to this product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Design Files */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <SectionHeader>
              <AttachIcon fontSize="small" /> Design & Technical Documents
            </SectionHeader>

            {product.designFiles && product.designFiles.length > 0 ? (
              <>
                {/* Screen View */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    "@media print": { display: "none" },
                  }}
                >
                  {product.designFiles.map((file, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: "action.hover",
                          cursor: "pointer",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                        }}
                      >
                        {getFileIcon(file.type)}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)} •{" "}
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1, display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => setPreviewFile(file)}
                              sx={{ bgcolor: "action.hover" }}
                            >
                              <ZoomIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(file)}
                              sx={{ bgcolor: "action.hover" }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {/* Print View - Full Images */}
                <Box
                  sx={{
                    display: "none",
                    "@media print": { display: "block" },
                  }}
                >
                  {product.designFiles
                    .filter((file) => file.type.startsWith("image/"))
                    .map((file, index) => (
                      <Box key={index} sx={{ mb: 4, breakInside: "avoid" }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          gutterBottom
                        >
                          {file.name}
                        </Typography>
                        <Box
                          component="img"
                          src={file.url}
                          alt={file.name}
                          sx={{
                            width: "100%",
                            maxHeight: "800px",
                            objectFit: "contain",
                            border: "1px solid #ddd",
                          }}
                        />
                      </Box>
                    ))}
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                <AttachIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  No design files attached.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{ "@media print": { display: "none" } }}
        >
          {/* Basic Info & Metadata */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <SectionHeader>Product Information</SectionHeader>
            <Box>
              <InfoRow label="Product Code" value={product.productCode} bold />
              <InfoRow label="Model" value={product.model || "N/A"} />
              <InfoRow label="Warranty" value={product.warranty || "None"} />
              <InfoRow
                label="Lead Time"
                value={product.leadTime ? `${product.leadTime} days` : "N/A"}
              />
              <InfoRow
                label="Created By"
                value={product.createdBy?.name || "Unknown"}
              />
              <InfoRow
                label="Created On"
                value={formatDate(product.createdAt)}
              />
            </Box>
          </Paper>

          {/* Financials - Cost Price */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "#F8FAFC",
              "@media print": { display: "none" },
            }}
          >
            <SectionHeader>Financials</SectionHeader>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Cost Price (Production)"
                value={formatCurrency(product.costPrice)}
                bold
                valueColor="#0F172A"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                * This is the internal production cost.
              </Typography>
            </Box>
          </Paper>

          {/* Settings */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              "@media print": { display: "none" },
            }}
          >
            <SectionHeader>Settings</SectionHeader>
            <Box sx={{ mt: 0 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={product.isActive}
                    onChange={handleToggleActive}
                  />
                }
                label={
                  <Typography variant="body2">
                    Product is{" "}
                    <strong>{product.isActive ? "Active" : "Inactive"}</strong>
                  </Typography>
                }
              />
            </Box>
          </Paper>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                "@media print": { display: "none" },
              }}
            >
              <SectionHeader>Tags</SectionHeader>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {product.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* File Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {getFileIcon(previewFile.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={600} noWrap>
                    {previewFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(previewFile.size)}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {previewFile.type.startsWith("image/") ? (
                <Box
                  component="img"
                  src={previewFile.url}
                  alt={previewFile.name}
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              ) : previewFile.type === "application/pdf" ? (
                <Box
                  component="iframe"
                  src={previewFile.url}
                  sx={{
                    width: "100%",
                    height: "70vh",
                    border: "none",
                  }}
                />
              ) : (
                <Alert severity="info">
                  Preview not available for this file type. Please download to
                  view.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewFile(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewFile)}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
