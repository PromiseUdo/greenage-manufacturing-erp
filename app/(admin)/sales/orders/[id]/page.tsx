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
  Close as CloseIcon
} from "@mui/icons-material";

// Add these to your imports at the top
import { Modal, Backdrop, Fade } from "@mui/material";
import StoreDispatchForm from "@/components/store/store-dispatch-form";
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
    key: "ORDER_RECEIVED",
    label: "Order Received",
    icon: <Assignment fontSize="small" />,
    isActive: (order: any) => true, // always on
  },
  {
    key: "PAYMENT_RECEIVED",
    label: "Payment",
    getLabel: (order: any) => {
      if (order?.invoice?.paymentStatus === "PARTIALLY_PAID") return "Payment (Partial)";
      if (order?.invoice?.paymentStatus === "PAID") return "Payment Received";
      return "Payment Pending";
    },
    icon: <Description fontSize="small" />,
    isActive: (order: any) =>
      order?.invoice?.paymentStatus === "PARTIALLY_PAID" ||
      order?.invoice?.paymentStatus === "PAID",
  },
  {
    key: "READY_FOR_DISPATCH",
    label: "Ready for Dispatch",
    icon: <Inventory fontSize="small" />,
    isActive: (order: any) => {
      const statuses = [
        "READY_FOR_DISPATCH",
        "DISPATCHED",
        "DELIVERED",
      ];
      return statuses.includes(order?.status);
    },
  },
  {
    key: "DISPATCHED",
    label: "Dispatched",
    icon: <LocalShipping fontSize="small" />,
    isActive: (order: any) =>
      Array.isArray(order?.storeDispatches) &&
      order.storeDispatches.some((d: any) => d.status !== "REQUESTED"),
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: <CheckCircle fontSize="small" />,
    isActive: (order: any) =>
      Array.isArray(order?.storeDispatches) &&
      order.storeDispatches.some((d: any) => d.status !== "REQUESTED"),
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
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

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
    // Find the last step that is active
    let lastActiveIndex = 0;
    for (let i = 0; i < ORDER_STEPS.length; i++) {
      if (ORDER_STEPS[i].isActive(order)) {
        lastActiveIndex = i;
      } else {
        break; // Stop if the chain of active states breaks
      }
    }

    // If we've reached the DELIVERED step (the last step is active),
    // and there is actually a "DELIVERED" dispatch, push index past the end
    // so that the final step gets marked as completed (green checkmark).
    if (
      lastActiveIndex === ORDER_STEPS.length - 1 &&
      Array.isArray(order?.storeDispatches) &&
      order.storeDispatches.some((d: any) => d.status === "DELIVERED")
    ) {
      return ORDER_STEPS.length;
    }

    return lastActiveIndex;
  };

  const getProgressPercentage = () => {
    if (!order) return 0;
    const activeSteps = ORDER_STEPS.filter((step) => step.isActive(order)).length;
    return Math.round((activeSteps / ORDER_STEPS.length) * 100);
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

  const handleDispatchSubmit = async (data: any) => {
    try {
      const payload = { ...data, status: "REQUESTED" };
      const res = await fetch("/api/store/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create dispatch");
      }
      setSuccess("Dispatch requested successfully");
      setIsDispatchModalOpen(false);
      fetchOrder(); // refresh data
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error && !order) return <Alert severity="error">{error}</Alert>;

  const currentStepIndex = getCurrentStepIndex();
  const progressPercent = getProgressPercentage();

  // Compute logic for Dispatch buttons
  const dispatchHistory = order?.storeDispatches || [];
  const dispatchedQuantities: Record<string, number> = {};
  dispatchHistory.forEach((d: any) => {
    if (d.status !== "CANCELLED" && d.status !== "FAILED_DELIVERY") {
      const items = Array.isArray(d.items) ? d.items : [];
      items.forEach((di: any) => {
        dispatchedQuantities[di.storeItemId] =
          (dispatchedQuantities[di.storeItemId] || 0) + di.quantity;
      });
    }
  });

  const remainingLineItems = (order?.lineItems || []).map((li: any) => {
    const storeItemId = li.storeItem?.id;
    const dispatched = dispatchedQuantities[storeItemId] || 0;
    const remaining = Math.max(0, li.quantity - dispatched);
    return { ...li, dispatched, remaining };
  });

  const fullyDispatched =
    remainingLineItems?.length > 0 &&
    remainingLineItems.every((li: any) => li.remaining === 0);
  const canDispatchMore = !fullyDispatched && remainingLineItems?.length > 0;
  const hasDispatch = dispatchHistory.length > 0;

  const activeDispatch = dispatchHistory.find((d: any) => 
    d.status !== 'REQUESTED' && d.status !== 'DELIVERED'
  );

  const handleMarkDelivered = async (dispatchId: string) => {
    try {
      const res = await fetch(`/api/store/dispatches/${dispatchId}/deliver`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark as delivered');
      }
      setSuccess('Order successfully marked as delivered');
      fetchOrder(); // refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

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
              Order Track
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
                const isActive = step.isActive(order);
                const isCurrent = index === currentStepIndex;
                const isCompleted = isActive && !isCurrent;
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
                        {step.getLabel ? step.getLabel(order) : step.label}
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
            
            <Divider sx={{ my: 3 }} />
            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LocalShipping />}
                onClick={() => setIsDispatchModalOpen(true)}
                disabled={!canDispatchMore}
                sx={{ fontWeight: 600 }}
              >
                {!canDispatchMore
                  ? "Fully Dispatched"
                  : hasDispatch
                  ? "Request Partial Dispatch"
                  : "Request Store Dispatch"}
              </Button>

              <Button
                variant="contained"
                fullWidth
                startIcon={<CheckCircle />}
                onClick={() => activeDispatch && handleMarkDelivered(activeDispatch.id)}
                disabled={!activeDispatch}
                sx={{ 
                  fontWeight: 600,
                  bgcolor: "#10B981",
                  "&:hover": { bgcolor: "#059669" },
                  "&.Mui-disabled": {
                    bgcolor: "#e2e8f0",
                    color: "#94a3b8"
                  }
                }}
              >
                Mark as Delivered
              </Button>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {order.invoice.status === "PARTIALLY_PAID" && (
                      <Chip
                        label="PARTIAL PAY"
                        size="small"
                        sx={{
                          fontSize: 10,
                          height: 20,
                          bgcolor: "#ffedd5",
                          color: "#ea580c",
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <Button
                      size="small"
                      onClick={() =>
                        router.push(`/sales/invoices/${order.invoice.id}`)
                      }
                    >
                      {order.invoice.invoiceNumber}
                    </Button>
                  </Box>
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
                          {remainingLineItems?.map((li: any, i: number) => (
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
                                {(li.quantityBackordered || 0) > 0 && (
                                  <Chip
                                    label={`${li.quantityBackordered} Backordered`}
                                    size="small"
                                    sx={{
                                      mt: 1,
                                      bgcolor: "#fef3c7",
                                      color: "#92400e",
                                      fontWeight: 600,
                                      fontSize: 10,
                                      height: 20,
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" fontWeight={600}>
                                  {li.quantity}
                                </Typography>
                                {li.dispatched > 0 && (
                                  <Typography variant="caption" color="success.main" display="block">
                                    {li.dispatched} dispatched
                                  </Typography>
                                )}
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
                  {/* Dispatch History Table */}
                  <Box sx={{ mt: 3 }}>
                    <SectionHeader>Dispatch History</SectionHeader>
                    {dispatchHistory.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#64748B",
                                  fontSize: 12,
                                }}
                              >
                                DISPATCH #
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#64748B",
                                  fontSize: 12,
                                }}
                              >
                                DATE
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#64748B",
                                  fontSize: 12,
                                }}
                              >
                                STATUS
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#64748B",
                                  fontSize: 12,
                                }}
                              >
                                DISPATCHED ITEMS
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dispatchHistory.map((d: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {d.dispatchNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(d.dispatchDate).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={d.status?.replace(/_/g, " ")}
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      bgcolor:
                                        d.status === "DELIVERED"
                                          ? "#dcfce7"
                                          : d.status === "REQUESTED"
                                          ? "#f1f5f9"
                                          : "#dbeafe",
                                      color:
                                        d.status === "DELIVERED"
                                          ? "#166534"
                                          : d.status === "REQUESTED"
                                          ? "#475569"
                                          : "#1e40af",
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {(d.items || []).map((di: any, idx: number) => {
                                    const matchingLineItem = order?.lineItems?.find(
                                      (li: any) => li.storeItem?.id === di.storeItemId
                                    );
                                    const itemName =
                                      matchingLineItem?.storeItem?.name ||
                                      matchingLineItem?.product?.name ||
                                      "Item";
                                    return (
                                      <Typography
                                        key={idx}
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                      >
                                        {di.quantity}x {itemName}
                                      </Typography>
                                    );
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No dispatches have been created yet.
                      </Typography>
                    )}
                  </Box>
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

      {/* Dispatch Request Modal */}
      <Modal
        open={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={isDispatchModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: 800,
              maxHeight: "90vh",
              overflowY: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 3,
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
                position: "sticky",
                top: 0,
                bgcolor: "background.paper",
                zIndex: 1,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Create Dispatch Request
              </Typography>
              <IconButton onClick={() => setIsDispatchModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 4, pt: 2 }}>
              {order && (
                <StoreDispatchForm
                  onSubmit={handleDispatchSubmit}
                  onCancel={() => setIsDispatchModalOpen(false)}
                  initialData={{
                    orderId: order.id,
                    customerId: order.customer.id,
                    invoiceId: order.invoice?.id || "",
                    deliveryAddress: order.customer.address || "",
                    items: remainingLineItems
                      .filter((li: any) => li.remaining > 0)
                      .map((li: any) => ({
                        storeItemId: li.storeItem?.id || "",
                        quantity: li.remaining,
                        maxAllowed: li.remaining,
                        notes: "",
                      })),
                  }}
                />
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
