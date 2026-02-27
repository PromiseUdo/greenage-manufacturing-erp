// src/app/dashboard/sales/quotes/[id]/page.tsx

"use client";

import "@/lib/pdf/fonts"; // 👈 MUST be before styles or <Document />

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import {
  ArrowBack,
  CheckCircle,
  Print,
  ShoppingCart,
  Receipt,
  Download,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// --- PDF Imports ---
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
import { formatPrice } from "@/lib/utils";

// --- Configuration ---
// REPLACE THIS with your specific Cloudinary URL or public folder path (e.g., '/logo.png')
// For PDFs, absolute URLs (Cloudinary) are often more reliable than relative public paths.
const COMPANY_LOGO_URL = "/greenage_logo_black.png";

// // --- PDF Styles ---
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/helvetica/v1/0.ttf' }, // Regular
//     { src: 'https://fonts.gstatic.com/s/helvetica/v1/1.ttf', fontWeight: 700 }, // Bold
//   ],
// });

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    // fontFamily: 'Helvetica',
    fontSize: 10,
    fontFamily: "Roboto",
    // fontSize: 10,
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logoSection: { flexDirection: "column" },
  logo: { width: 120, height: "auto", marginBottom: 10 },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0F172A",
    textTransform: "uppercase",
  },
  companyDetails: { fontSize: 9, color: "#64748B", lineHeight: 1.4 },

  quoteTitleBox: { alignItems: "flex-end" },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0F172A",
    textTransform: "uppercase",
  },
  quoteMeta: { marginTop: 10, textAlign: "right" },
  metaRow: { flexDirection: "row", marginBottom: 4 },
  metaLabel: {
    width: 80,
    color: "#64748B",
    textAlign: "right",
    marginRight: 10,
  },
  metaValue: { fontWeight: 700, color: "#0F172A", textAlign: "right" },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginVertical: 20,
  },

  customerSection: { flexDirection: "row", marginBottom: 30 },
  customerCol: { width: "50%" },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: 4,
  },
  customerText: { fontSize: 10, color: "#475569", marginBottom: 2 },

  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    padding: 8,
    alignItems: "center",
  },
  tableHeaderCell: { color: "#FFFFFF", fontWeight: 700, fontSize: 9 },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    padding: 10,
    alignItems: "center",
  },
  col1: { width: "50%" }, // Product
  col2: { width: "15%", textAlign: "center" }, // Qty
  col3: { width: "15%", textAlign: "right" }, // Unit Price
  col4: { width: "20%", textAlign: "right" }, // Total

  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsBox: { width: "40%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  totalLabel: { color: "#64748B" },
  totalValue: { color: "#0F172A", fontWeight: 700 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 700, color: "#0F172A" },
  grandTotalValue: { fontSize: 12, fontWeight: 700, color: "#10B981" },

  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 20,
  },
  footerText: { fontSize: 8, color: "#94A3B8", marginBottom: 4 },
});

// --- PDF Component ---
const QuoteDocument = ({ quote }: { quote: any }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoSection}>
            {/* Ensure this URL is accessible. If using Cloudinary, put full URL here */}
            {COMPANY_LOGO_URL && (
              <PdfImage style={pdfStyles.logo} src={COMPANY_LOGO_URL} />
            )}
            {/* <Text style={pdfStyles.companyName}>Your Company Name</Text> */}
            <Text style={pdfStyles.companyDetails}>
              Greenage office, ECCIMA House, Garden Avenue, Enugu, Nigeria.
            </Text>
            <Text style={pdfStyles.companyDetails}>
              contact@greenagetech.com
            </Text>
            <Text style={pdfStyles.companyDetails}>+234 906 000 3896</Text>
          </View>
          <View style={pdfStyles.quoteTitleBox}>
            <Text style={pdfStyles.quoteTitle}>Quote</Text>
            <View style={pdfStyles.quoteMeta}>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Quote #:</Text>
                <Text style={pdfStyles.metaValue}>{quote.quoteNumber}</Text>
              </View>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Date:</Text>
                <Text style={pdfStyles.metaValue}>
                  {new Date(quote.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Status:</Text>
                <Text style={pdfStyles.metaValue}>{quote.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        {/* Customer Info */}
        <View style={pdfStyles.customerSection}>
          <View style={pdfStyles.customerCol}>
            <Text style={pdfStyles.sectionTitle}>Quotation For:</Text>
            <Text style={pdfStyles.customerName}>{quote.customer.name}</Text>
            <Text style={pdfStyles.customerText}>{quote.customer.phone}</Text>
            <Text style={pdfStyles.customerText}>
              {quote.customer.email || ""}
            </Text>
            <Text style={pdfStyles.customerText}>
              {quote.customer.address || ""}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col1]}>
              Item Description
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col2]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col3]}>
              Unit Price
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col4]}>
              Amount
            </Text>
          </View>

          {/* Line Item Rows */}
          {(quote.lineItems || []).map((li: any, i: number) => (
            <View key={i} style={pdfStyles.tableRow}>
              <View style={pdfStyles.col1}>
                <Text
                  style={{ fontWeight: 700, fontSize: 10, color: "#0F172A" }}
                >
                  {li.storeItem?.name || "Item"}
                </Text>
                <Text style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>
                  Code: {li.storeItem?.itemNumber || "N/A"} •{" "}
                  {li.storeItem?.category || ""}
                </Text>
              </View>
              <Text style={[pdfStyles.col2, { fontSize: 10 }]}>
                {li.quantity}
              </Text>
              <Text style={[pdfStyles.col3, { fontSize: 10 }]}>
                {formatCurrency(li.unitPrice)}
              </Text>
              <Text style={[pdfStyles.col4, { fontSize: 10, fontWeight: 700 }]}>
                {formatCurrency(li.unitPrice * li.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}

        <View style={pdfStyles.totalsSection}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Subtotal</Text>
              <Text style={pdfStyles.totalValue}>
                {formatCurrency(quote.totalAmount)}
              </Text>
            </View>

            {/* Discount Row */}
            {quote.discountAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={[pdfStyles.totalLabel, { color: "#B91C1C" }]}>
                  Discount
                </Text>
                <Text style={[pdfStyles.totalValue, { color: "#B91C1C" }]}>
                  -{formatCurrency(quote.discountAmount)}
                </Text>
              </View>
            )}

            {/* Tax Row */}
            {quote.taxAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Tax (VAT)</Text>
                <Text style={pdfStyles.totalValue}>
                  {formatCurrency(quote.taxAmount)}
                </Text>
              </View>
            )}

            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>Grand Total</Text>
              <Text style={pdfStyles.grandTotalValue}>
                {formatCurrency(quote.finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>
            Terms & Conditions
          </Text>
          <Text style={pdfStyles.footerText}>
            1. This quote is valid for 30 days. 2. Payment terms: 50% upfront,
            50% on delivery. 3. Goods sold are in good condition.
          </Text>
          <Text style={{ marginTop: 10, fontSize: 8, color: "#CBD5E1" }}>
            Generated by Greenage Technologies
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// --- Main Page Component ---

// ... (Re-use your existing styles)
const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#6b7280" },
  SENT: { bg: "#dbeafe", text: "#1e40af" },
  ACCEPTED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  EXPIRED: { bg: "#fef3c7", text: "#92400e" },
  CONVERTED: { bg: "#e0e7ff", text: "#4338ca" },
};

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

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quote, setQuote] = useState<any>(null);

  // PDF Download State
  const [isDownloading, setIsDownloading] = useState(false);

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dueInDays, setDueInDays] = useState(30);

  useEffect(() => {
    fetchQuote();
  }, [resolvedParams.id]);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch quote");
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setIsDownloading(true);
    try {
      // Generate Blob
      const blob = await pdf(<QuoteDocument quote={quote} />).toBlob();

      // Create Link and Click
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Quote_${quote.quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("PDF Generation Error", e);
      setError("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAcceptQuote = async () => {
    try {
      setAccepting(true);
      const res = await fetch(`/api/quotes/${resolvedParams.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueInDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");

      setSuccess(
        `Quote accepted! Invoice ${data.invoice.invoiceNumber} created.`,
      );
      setAcceptDialogOpen(false);
      fetchQuote();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
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
      month: "short",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 20 }}>
        <CircularProgress size={40} />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Breadcrumbs & Actions Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mb: 1, textTransform: "none", color: "text.secondary" }}
          >
            Back to Quotes
          </Button>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#0F172A" }}>
              {quote?.quoteNumber}
            </Typography>
            <Chip
              label={quote?.status}
              size="small"
              sx={{
                bgcolor: statusColors[quote?.status]?.bg,
                color: statusColors[quote?.status]?.text,
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Created on {formatDate(quote?.createdAt)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            startIcon={
              isDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            sx={{
              bgcolor: "#0F172A",
              "&:hover": { bgcolor: "#1E293B" },
              fontWeight: 600,
              textTransform: "none",
            }}
            // sx={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: 600 }}
          >
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
          {!quote?.isAccepted && (
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => setAcceptDialogOpen(true)}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
                fontWeight: 600,
              }}
            >
              Accept Quote
            </Button>
          )}
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Section: Product & Pricing */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <SectionHeader>Line Items</SectionHeader>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              {quote?.lineItems?.length > 0 ? (
                <>
                  {quote.lineItems.map((li: any, i: number) => (
                    <Box
                      key={li.id || i}
                      sx={{
                        p: 2,
                        bgcolor: i % 2 === 0 ? "#F8FAFC" : "transparent",
                        borderRadius: 2,
                        mb: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {li.storeItem?.name || "Item"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {li.storeItem?.itemNumber || "N/A"}
                          {li.backorderStatus &&
                            li.backorderStatus !== "NONE" && (
                              <Chip
                                label={li.backorderStatus}
                                size="small"
                                sx={{
                                  ml: 1,
                                  fontSize: 10,
                                  height: 20,
                                  bgcolor:
                                    li.backorderStatus === "FULFILLED"
                                      ? "#dcfce7"
                                      : "#fef3c7",
                                  color:
                                    li.backorderStatus === "FULFILLED"
                                      ? "#166534"
                                      : "#92400e",
                                }}
                              />
                            )}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" fontWeight={600}>
                          {li.quantity} × {formatCurrency(li.unitPrice)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(li.unitPrice * li.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  No line items found.
                </Typography>
              )}
            </Box>

            {/* Main Content Area -> Line Items Paper */}
            <Box sx={{ ml: "auto", maxWidth: 300 }}>
              {/* Subtotal */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(quote?.totalAmount)}
                </Typography>
              </Box>

              {/* Discount */}
              {quote?.discountAmount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="error.main">
                    Discount
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(quote?.discountAmount)}
                  </Typography>
                </Box>
              )}

              {/* Tax */}
              {quote?.taxAmount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Tax
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(quote?.taxAmount)}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(quote?.finalAmount)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Section: Specifications */}
          {quote?.product?.specifications?.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionHeader>Technical Specifications</SectionHeader>
              <Grid container spacing={2}>
                {quote.product.specifications.map((spec: any, i: number) => (
                  <Grid item xs={6} key={i}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {spec.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {spec.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Customer Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SectionHeader> Customer</SectionHeader>
            </Box>
            <Typography variant="body1" fontWeight={600}>
              {quote?.customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quote?.customer.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {quote?.customer.address}
            </Typography>
          </Paper>

          {/* Delivery & Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SectionHeader>Logistics</SectionHeader>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                Est. Delivery
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(quote?.deliveryDate)}
              </Typography>
            </Box>
          </Paper>

          {/* Related Docs */}
          {(quote?.order || quote?.invoice) && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#F1F5F9",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionHeader> Related Links</SectionHeader>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
              >
                {quote?.order && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ShoppingCart />}
                    sx={{ justifyContent: "flex-start", color: "#0F172A" }}
                    onClick={() =>
                      router.push(`/sales/orders/${quote.order.id}`)
                    }
                  >
                    Order {quote.order.orderNumber}
                  </Button>
                )}
                {quote?.invoice && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Receipt />}
                    sx={{ justifyContent: "flex-start", color: "#0F172A" }}
                    onClick={() =>
                      router.push(`/sales/invoices/${quote.invoice.id}`)
                    }
                  >
                    Invoice {quote.invoice.invoiceNumber}
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Standard Dialog for Quote Acceptance */}
      <Dialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Quote Acceptance
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Accepting this quote will automatically generate an Invoice and move
            this to the processing stage.
          </Typography>
          <TextField
            fullWidth
            label="Invoice Due In (Days)"
            type="number"
            variant="outlined"
            size="small"
            value={dueInDays}
            onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setAcceptDialogOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptQuote}
            variant="contained"
            disabled={accepting}
            sx={{ bgcolor: "#0F172A" }}
          >
            {accepting ? "Processing..." : "Confirm & Generate Invoice"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
