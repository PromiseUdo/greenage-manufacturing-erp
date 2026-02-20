// // src/app/dashboard/sales/orders/[id]/page.tsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Card,
  Divider,
  LinearProgress,
  Stack,
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
  Print,
  QrCode2,
  ContentCopy,
  CheckCircle,
  LocalShipping,
  Inventory,
  Assignment,
  Person,
  Description,
  Settings,
  Download,
} from "@mui/icons-material";

// Add these to your imports at the top
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
  Font,
} from "@react-pdf/renderer";

const COMPANY_LOGO_URL = "/greenage_logo_black.png";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: { width: 120, height: "auto" },
  orderInfo: { textAlign: "right" },
  title: { fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 4 },
  statusBadge: {
    padding: "4 8",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    backgroundColor: "#F1F5F9",
    color: "#475569",
    textAlign: "center",
  },
  section: { marginTop: 25 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
    marginBottom: 10,
  },
  row: { flexDirection: "row", marginBottom: 15 },
  column: { flex: 1 },
  label: { fontSize: 8, color: "#94A3B8", marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 700, color: "#0F172A" },
  specGrid: { flexDirection: "row", flexWrap: "wrap" },
  specItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    marginRight: "2%",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    textAlign: "center",
  },
  footerText: { fontSize: 8, color: "#94A3B8" },
});

const OrderDocument = ({ order }: { order: any }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <View>
          <PdfImage src={COMPANY_LOGO_URL} style={pdfStyles.logo} />
        </View>
        <View style={pdfStyles.orderInfo}>
          <Text style={pdfStyles.title}>ORDER SUMMARY</Text>
          <Text style={pdfStyles.value}>{order.orderNumber}</Text>
          <Text style={[pdfStyles.statusBadge, { marginTop: 5 }]}>
            STATUS: {order.status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      {/* Customer & Logistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Client & Logistics</Text>
        <View style={pdfStyles.row}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Customer Name</Text>
            <Text style={pdfStyles.value}>{order.customer.name}</Text>
          </View>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Due Date</Text>
            <Text style={pdfStyles.value}>
              {new Date(order.deliveryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.row}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Installation Address</Text>
            <Text style={pdfStyles.value}>{order.customer.address}</Text>
          </View>
        </View>
      </View>

      {/* Product Specification */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Order Line Items</Text>
        {/* Table Header */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F1F5F9",
            padding: 8,
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          <Text
            style={{ flex: 2, fontWeight: 700, fontSize: 9, color: "#0F172A" }}
          >
            Item
          </Text>
          <Text
            style={{
              flex: 0.5,
              fontWeight: 700,
              fontSize: 9,
              color: "#0F172A",
              textAlign: "center",
            }}
          >
            Qty
          </Text>
          <Text
            style={{
              flex: 1,
              fontWeight: 700,
              fontSize: 9,
              color: "#0F172A",
              textAlign: "right",
            }}
          >
            Unit Price
          </Text>
          <Text
            style={{
              flex: 1,
              fontWeight: 700,
              fontSize: 9,
              color: "#0F172A",
              textAlign: "right",
            }}
          >
            Total
          </Text>
        </View>
        {/* Table Rows */}
        {order.lineItems?.map((li: any, i: number) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              padding: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <View style={{ flex: 2 }}>
              <Text style={pdfStyles.value}>
                {li.storeItem?.name || li.product?.name || "Item"}
              </Text>
              <Text style={pdfStyles.label}>
                {li.storeItem?.itemNumber || li.product?.productNumber || ""}
                {li.storeItem?.category ? ` • ${li.storeItem.category}` : ""}
              </Text>
            </View>
            <Text style={{ flex: 0.5, textAlign: "center", fontSize: 10 }}>
              {li.quantity}
            </Text>
            <Text style={{ flex: 1, textAlign: "right", fontSize: 10 }}>
              {li.unitPrice ? `₦${li.unitPrice.toLocaleString()}` : "N/A"}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {li.totalAmount ? `₦${li.totalAmount.toLocaleString()}` : "N/A"}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>
          Confidential Production Document • Generated on{" "}
          {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Page>
  </Document>
);

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

// --- Status Configuration ---
const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING_PLANNING: { bg: "#f3f4f6", text: "#6b7280" },
  IN_PRODUCTION: { bg: "#dbeafe", text: "#1e40af" },
  QC_TESTING: { bg: "#fef3c7", text: "#92400e" },
  PACKAGING: { bg: "#e0e7ff", text: "#4338ca" },
  READY_FOR_DISPATCH: { bg: "#d1fae5", text: "#065f46" },
  DISPATCHED: { bg: "#fae8ff", text: "#86198f" },
  DELIVERED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
};

const ORDER_STEPS = [
  {
    key: "PENDING_PLANNING",
    label: "Planning",
    icon: <Assignment fontSize="small" />,
  },
  {
    key: "IN_PRODUCTION",
    label: "Production",
    icon: <Settings fontSize="small" />,
  },
  {
    key: "QC_TESTING",
    label: "Quality Control",
    icon: <CheckCircle fontSize="small" />,
  },
  {
    key: "PACKAGING",
    label: "Packaging",
    icon: <Inventory fontSize="small" />,
  },
  {
    key: "READY_FOR_DISPATCH",
    label: "Ready for Dispatch",
    icon: <LocalShipping fontSize="small" />,
  },
  {
    key: "DISPATCHED",
    label: "Dispatched",
    icon: <LocalShipping fontSize="small" />,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: <CheckCircle fontSize="small" />,
  },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const handleDownloadPdf = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const blob = await pdf(<OrderDocument order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Order_${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("PDF Error:", err);
      setError("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch order");
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Helpers ---
  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return ORDER_STEPS.findIndex((step) => step.key === order.status);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / ORDER_STEPS.length) * 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(""), 2000);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error && !order) return <Alert severity="error">{error}</Alert>;

  const currentStepIndex = getCurrentStepIndex();
  const progressPercent = getProgressPercentage();

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mb: 1, textTransform: "none", color: "text.secondary", p: 0 }}
          >
            Back to Orders List
          </Button>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="h5" fontWeight={700} color="#0F172A">
              Order {order?.orderNumber}
            </Typography>
            <Chip
              label={order?.status.replace(/_/g, " ")}
              sx={{
                bgcolor: statusColors[order?.status]?.bg,
                color: statusColors[order?.status]?.text,
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Items:{" "}
              <strong>
                {order?.lineItems?.length || 0} line item
                {order?.lineItems?.length !== 1 ? "s" : ""}
              </strong>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" color="text.secondary">
              Due: <strong>{formatDate(order?.deliveryDate)}</strong>
            </Typography>
          </Stack>
        </Box>
        {/* <Button
          variant="contained"
          startIcon={<Print />}
          sx={{ fontWeight: 600 }}
        >
          Export Documents
        </Button> */}

        <Button
          variant="contained"
          startIcon={
            isDownloading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Download />
            )
          }
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          sx={{
            bgcolor: "#0F172A",
            "&:hover": { bgcolor: "#1E293B" },
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          {isDownloading ? "Generating..." : "Download Order PDF"}
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Dynamic Timeline & Status */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", mb: 3 }}
          >
            <SectionHeader>
              {/* <Assignment fontSize="small" /> Production Track */}
              Production Track
            </SectionHeader>

            {/* Progress Bar */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="caption" fontWeight={700}>
                  Completion
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progressPercent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "#F1F5F9",
                  "& .MuiLinearProgress-bar": { bgcolor: "#10B981" },
                }}
              />
            </Box>

            {/* Dynamic Timeline Stepper */}
            <Stack spacing={0}>
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === ORDER_STEPS.length - 1;

                return (
                  <Box
                    key={step.key}
                    sx={{ display: "flex", position: "relative" }}
                  >
                    {/* Step Connector Line */}
                    {!isLast && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: 15,
                          top: 30,
                          bottom: -10,
                          width: 2,
                          bgcolor: isCompleted ? "#10B981" : "#E2E8F0",
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Visual Logic */}
                    <Box sx={{ mr: 2, zIndex: 1, pb: 3 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: isCompleted
                            ? "#10B981"
                            : isCurrent
                              ? "#EFF6FF"
                              : "#F1F5F9",
                          border: isCurrent ? "2px solid #3B82F6" : "none",
                          color: isCompleted
                            ? "#fff"
                            : isCurrent
                              ? "#3B82F6"
                              : "#94A3B8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle fontSize="small" sx={{ fontSize: 18 }} />
                        ) : (
                          step.icon
                        )}
                      </Box>
                    </Box>

                    {/* Text Logic */}
                    <Box sx={{ pt: 0.5 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isCurrent ? 700 : 500}
                        color={
                          isCurrent
                            ? "#0F172A"
                            : isCompleted
                              ? "text.primary"
                              : "text.secondary"
                        }
                      >
                        {step.label}
                      </Typography>
                      {isCurrent && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        >
                          Current Stage
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* Docs Card */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}
          >
            <SectionHeader>
              Reference Docs
              {/* <Description fontSize="small" /> Reference Docs */}
            </SectionHeader>
            <Stack spacing={2}>
              {/* <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#F8FAFC",
                  borderRadius: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Quote Ref
                </Typography>
                {order?.quote ? (
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(`/sales/quotes/${order.quote.id}`)
                    }
                  >
                    {order.quote.quoteNumber}
                  </Button>
                ) : (
                  <Typography variant="caption">N/A</Typography>
                )}
              </Box> */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#F8FAFC",
                  borderRadius: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Invoice
                </Typography>
                {order?.invoice ? (
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(`/sales/invoices/${order.invoice.id}`)
                    }
                  >
                    {order.invoice.invoiceNumber}
                  </Button>
                ) : (
                  <Typography variant="caption">Pending</Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Tabbed Details */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{
                bgcolor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 13,
                },
              }}
            >
              <Tab
                label="Order Details"
                icon={<Assignment fontSize="small" />}
                iconPosition="start"
              />
              <Tab
                label="Unit Serial IDs"
                icon={<QrCode2 fontSize="small" />}
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Stack spacing={4}>
                  {/* Customer Info */}
                  <Box>
                    <SectionHeader>
                      Customer Details
                      {/* <Person fontSize="small" /> Customer Details */}
                    </SectionHeader>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Client Name
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.phone}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Installation Address
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.address}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider />
                  {/* Line Items Table */}
                  <Box>
                    <SectionHeader>Order Line Items</SectionHeader>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                fontWeight: 600,
                                color: "#64748B",
                                fontSize: 12,
                              }}
                            >
                              ITEM
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 600,
                                color: "#64748B",
                                fontSize: 12,
                              }}
                            >
                              QTY
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: "#64748B",
                                fontSize: 12,
                              }}
                            >
                              UNIT PRICE
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: "#64748B",
                                fontSize: 12,
                              }}
                            >
                              TOTAL
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order?.lineItems?.map((li: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {li.storeItem?.name ||
                                    li.product?.name ||
                                    "Item"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {li.storeItem?.itemNumber ||
                                    li.product?.productNumber ||
                                    ""}
                                  {li.storeItem?.category
                                    ? ` • ${li.storeItem.category}`
                                    : ""}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" fontWeight={600}>
                                  {li.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {li.unitPrice
                                    ? `₦${li.unitPrice.toLocaleString()}`
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={600}>
                                  {li.totalAmount
                                    ? `₦${li.totalAmount.toLocaleString()}`
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Stack>
              )}

              {tabValue === 1 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Generated IDs for production programming.
                    </Typography>
                  </Box>
                  {order?.generatedUnitIds?.length > 0 ? (
                    <Grid container spacing={2}>
                      {order.generatedUnitIds.map((id: string, i: number) => (
                        <Grid item xs={12} sm={4} key={i}>
                          <Box
                            sx={{
                              p: 2,
                              border: "1px solid #E2E8F0",
                              borderRadius: 2,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              bgcolor: "#fff",
                              transition: "0.2s",
                              "&:hover": { borderColor: "#94A3B8" },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              {id}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(id)}
                            >
                              <ContentCopy sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info" variant="outlined">
                      No IDs generated yet. Wait for production to start.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
