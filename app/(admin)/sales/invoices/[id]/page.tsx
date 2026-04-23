// // src/app/dashboard/sales/invoices/[id]/page.tsx

"use client";
import "@/lib/pdf/fonts"; // 👈 MUST be before styles or <Document />

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  MenuItem,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import {
  ArrowBack,
  Payment,
  Print,
  Receipt,
  CheckCircle,
  Warning,
  Person,
  CalendarMonth,
  CreditCard,
  Description,
} from "@mui/icons-material";

// Add these to your imports
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

const C = {
  darkGreen: "#003D34",
  brandGreen: "#1FA43B",
  mintGreen: "#D3F2AF",
  black: "#000000",
  mutedGreen: "#326444",
  lightMint: "#EBF9DE",
  border: "#C8E6C9",
  gray: "#64748B",
};

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: "Roboto",
    fontSize: 10,
    color: C.black,
    backgroundColor: "#FFFFFF",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  logoSection: { flexDirection: "column" },
  logo: { width: 110, height: "auto", marginBottom: 8 },
  companyDetails: { fontSize: 8.5, color: C.gray, lineHeight: 1.5 },

  invoiceInfo: { alignItems: "flex-end" },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: C.darkGreen,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaText: { fontSize: 9, color: C.gray, marginTop: 3 },
  metaDue: { fontSize: 9, fontWeight: 700, color: "#B91C1C", marginTop: 3 },

  // Brand accent stripe
  accentStripe: {
    height: 3,
    backgroundColor: C.brandGreen,
    marginBottom: 14,
  },

  // ── Bill To ──
  section: { flexDirection: "row", marginBottom: 20 },
  addressBox: { width: "55%" },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: C.mutedGreen,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  customerName: { fontSize: 12, fontWeight: 700, color: C.darkGreen, marginBottom: 3 },
  addressText: { fontSize: 9.5, lineHeight: 1.5, color: "#475569" },

  // ── Table ──
  tableWrapper: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.darkGreen,
    paddingVertical: 7,
  },
  tableHeaderCell: { color: "#FFFFFF", fontWeight: 700, fontSize: 9 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    paddingVertical: 8,
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: C.lightMint },

  colDesc: {
    flex: 2,
    paddingHorizontal: 9,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  colQty: {
    flex: 0.5,
    textAlign: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  colPrice: {
    flex: 1,
    textAlign: "right",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  colTotal: { flex: 1, textAlign: "right", paddingHorizontal: 9 },

  // ── Totals ──
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  totalsBox: { width: "42%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  totalLabel: { fontSize: 9.5, color: C.gray },
  totalValue: { fontSize: 9.5, color: C.black, fontWeight: 700 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: C.darkGreen,
    borderRadius: 3,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700, color: "#FFFFFF" },
  grandTotalValue: { fontSize: 11, fontWeight: 700, color: C.mintGreen },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 2,
  },

  // ── Paid stamp ──
  statusStamp: {
    position: "absolute",
    top: 150,
    right: 40,
    padding: 10,
    borderWidth: 2,
    borderRadius: 4,
    transform: "rotate(15deg)",
    opacity: 0.35,
    fontSize: 20,
    fontWeight: 700,
  },

  // ── Bank & Contact ──
  bottomSection: {
    flexDirection: "row",
    marginTop: 22,
    borderTopWidth: 2,
    borderTopColor: C.brandGreen,
    borderTopStyle: "solid",
    paddingTop: 12,
  },
  bottomCol: { width: "50%" },
  bottomColRight: { width: "50%", paddingLeft: 20 },
  bottomTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.darkGreen,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  bottomRow: { flexDirection: "row", marginBottom: 3 },
  bottomLabel: { fontSize: 8.5, color: C.gray, width: 90 },
  bottomValue: { fontSize: 8.5, color: C.black, fontWeight: 700, flex: 1 },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
  },
  footerStripe: {
    height: 2,
    backgroundColor: C.mintGreen,
    marginBottom: 6,
  },
  footerText: { fontSize: 7.5, color: C.gray, textAlign: "center" },
});

const InvoiceDocument = ({ invoice, companyDetails }: any) => {
  const isPaid = invoice.status === "PAID";
  const cd = companyDetails || {};

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount ?? 0);

  const fmtDate = (d: any) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Paid stamp */}
        {isPaid && (
          <View
            style={[
              pdfStyles.statusStamp,
              { borderColor: C.brandGreen, color: C.brandGreen },
            ]}
          >
            <Text>PAID IN FULL</Text>
          </View>
        )}

        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoSection}>
            <PdfImage src={COMPANY_LOGO_URL} style={pdfStyles.logo} />
            {cd.address && (
              <Text style={pdfStyles.companyDetails}>{cd.address}</Text>
            )}
            {cd.email && (
              <Text style={pdfStyles.companyDetails}>{cd.email}</Text>
            )}
            {cd.phone && (
              <Text style={pdfStyles.companyDetails}>{cd.phone}</Text>
            )}
            {cd.website && (
              <Text style={pdfStyles.companyDetails}>{cd.website}</Text>
            )}
          </View>

          <View style={pdfStyles.invoiceInfo}>
            <Text style={pdfStyles.title}>INVOICE</Text>
            <Text style={pdfStyles.metaText}>
              Invoice #: {invoice.invoiceNumber}
            </Text>
            <Text style={pdfStyles.metaText}>
              Date: {fmtDate(invoice.issueDate)}
            </Text>
            <Text style={pdfStyles.metaDue}>
              Due: {fmtDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Brand accent stripe */}
        <View style={pdfStyles.accentStripe} />

        {/* Bill To */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.addressBox}>
            <Text style={pdfStyles.sectionLabel}>Bill To:</Text>
            <Text style={pdfStyles.customerName}>{invoice.customer.name}</Text>
            {invoice.customer.address && (
              <Text style={pdfStyles.addressText}>
                {invoice.customer.address}
              </Text>
            )}
            {invoice.customer.phone && (
              <Text style={pdfStyles.addressText}>{invoice.customer.phone}</Text>
            )}
            {invoice.customer.email && (
              <Text style={pdfStyles.addressText}>{invoice.customer.email}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={pdfStyles.tableWrapper}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>
              Description
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>
              Qty
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>
              Unit Price
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>
              Amount
            </Text>
          </View>

          {invoice.lineItems?.map((li: any, i: number) => (
            <View
              key={i}
              style={[pdfStyles.tableRow, i % 2 !== 0 ? pdfStyles.tableRowAlt : {}]}
            >
              <View style={pdfStyles.colDesc}>
                <Text style={{ fontWeight: 700, fontSize: 10, color: C.darkGreen }}>
                  {li.storeItem?.name || li.product?.name || "Item"}
                </Text>
                {(li.storeItem?.itemNumber || li.storeItem?.category) && (
                  <Text style={{ fontSize: 8.5, color: C.gray, marginTop: 2 }}>
                    {li.storeItem?.itemNumber
                      ? `Code: ${li.storeItem.itemNumber}`
                      : ""}
                    {li.storeItem?.itemNumber && li.storeItem?.category
                      ? "  •  "
                      : ""}
                    {li.storeItem?.category || ""}
                  </Text>
                )}
              </View>
              <Text style={[pdfStyles.colQty, { fontSize: 10 }]}>
                {li.quantity}
              </Text>
              <Text style={[pdfStyles.colPrice, { fontSize: 10 }]}>
                {fmt(li.unitPrice)}
              </Text>
              <Text style={[pdfStyles.colTotal, { fontSize: 10, fontWeight: 700 }]}>
                {fmt(li.totalAmount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={pdfStyles.totalsContainer}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Subtotal</Text>
              <Text style={pdfStyles.totalValue}>{fmt(invoice.totalAmount)}</Text>
            </View>

            {invoice.taxAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Tax (VAT)</Text>
                <Text style={pdfStyles.totalValue}>{fmt(invoice.taxAmount)}</Text>
              </View>
            )}

            {invoice.discountAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={[pdfStyles.totalLabel, { color: "#B91C1C" }]}>
                  Discount
                </Text>
                <Text style={[pdfStyles.totalValue, { color: "#B91C1C" }]}>
                  -{fmt(invoice.discountAmount)}
                </Text>
              </View>
            )}

            <View style={pdfStyles.grandTotal}>
              <Text style={pdfStyles.grandTotalLabel}>Grand Total</Text>
              <Text style={pdfStyles.grandTotalValue}>
                {fmt(invoice.finalAmount)}
              </Text>
            </View>

            <View style={[pdfStyles.totalRow, { marginTop: 8 }]}>
              <Text style={pdfStyles.totalLabel}>Amount Paid</Text>
              <Text style={[pdfStyles.totalValue, { color: C.brandGreen }]}>
                {fmt(invoice.paidAmount)}
              </Text>
            </View>

            <View style={pdfStyles.balanceRow}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: C.black }}>
                Balance Due
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: invoice.balanceAmount > 0 ? "#B91C1C" : C.brandGreen,
                }}
              >
                {fmt(invoice.balanceAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank & Contact details */}
        {(cd.bankAccountName || cd.address) && (
          <View style={pdfStyles.bottomSection}>
            {cd.bankAccountName && (
              <View style={pdfStyles.bottomCol}>
                <Text style={pdfStyles.bottomTitle}>Bank Details</Text>
                {cd.bankAccountName && (
                  <View style={pdfStyles.bottomRow}>
                    <Text style={pdfStyles.bottomLabel}>Account Name:</Text>
                    <Text style={pdfStyles.bottomValue}>{cd.bankAccountName}</Text>
                  </View>
                )}
                {cd.bankAccountNumber && (
                  <View style={pdfStyles.bottomRow}>
                    <Text style={pdfStyles.bottomLabel}>Account Number:</Text>
                    <Text style={pdfStyles.bottomValue}>{cd.bankAccountNumber}</Text>
                  </View>
                )}
                {cd.bankName && (
                  <View style={pdfStyles.bottomRow}>
                    <Text style={pdfStyles.bottomLabel}>Bank Name:</Text>
                    <Text style={pdfStyles.bottomValue}>{cd.bankName}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={pdfStyles.bottomColRight}>
              <Text style={pdfStyles.bottomTitle}>Contact Details</Text>
              {cd.address && (
                <View style={pdfStyles.bottomRow}>
                  <Text style={pdfStyles.bottomLabel}>Address:</Text>
                  <Text style={pdfStyles.bottomValue}>{cd.address}</Text>
                </View>
              )}
              {cd.phone && (
                <View style={pdfStyles.bottomRow}>
                  <Text style={pdfStyles.bottomLabel}>Phone:</Text>
                  <Text style={pdfStyles.bottomValue}>{cd.phone}</Text>
                </View>
              )}
              {cd.email && (
                <View style={pdfStyles.bottomRow}>
                  <Text style={pdfStyles.bottomLabel}>Email:</Text>
                  <Text style={pdfStyles.bottomValue}>{cd.email}</Text>
                </View>
              )}
              {cd.website && (
                <View style={pdfStyles.bottomRow}>
                  <Text style={pdfStyles.bottomLabel}>Website:</Text>
                  <Text style={pdfStyles.bottomValue}>{cd.website}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <View style={pdfStyles.footerStripe} />
          <Text style={pdfStyles.footerText}>
            Thank you for your business. Please make payment by the due date.
          </Text>
          <Text style={[pdfStyles.footerText, { marginTop: 3, color: "#B0BEC5" }]}>
            Generated by Greenage Technologies ·{" "}
            {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

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

const MoneyText = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  fontWeight: 700,
  letterSpacing: "-0.5px",
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  border: "1px solid #E2E8F0",
  boxShadow: "none",
  height: "100%",
}));

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoice, setInvoice] = useState<any>(null);

  // Payment dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      const blob = await pdf(
        <InvoiceDocument invoice={invoice} companyDetails={companyDetails} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("PDF generation failed", err);
      setError("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then(setCompanyDetails)
      .catch(() => {});
  }, [resolvedParams.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch invoice");
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    setProcessing(true);
    setError("");
    try {
      const amount = parseFloat(paymentAmount);
      if (!amount || amount <= 0)
        throw new Error("Please enter a valid payment amount");
      if (amount > invoice.balanceAmount)
        throw new Error("Payment amount exceeds balance");

      const res = await fetch(`/api/invoices/${resolvedParams.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentReference,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      setSuccess(`Payment of ${formatCurrency(amount)} recorded successfully!`);
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentReference("");
      setPaymentNotes("");
      fetchInvoice();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const isOverdue = () =>
    invoice?.status !== "PAID" && new Date(invoice?.dueDate) < new Date();
  const getPaymentProgress = () =>
    (invoice?.paidAmount / invoice?.finalAmount) * 100;

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error && !invoice) return <Alert severity="error">{error}</Alert>;

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    PARTIALLY_PAID: { bg: "#dbeafe", text: "#1e40af" },
    PAID: { bg: "#dcfce7", text: "#166534" },
    OVERDUE: { bg: "#fee2e2", text: "#991b1b" },
    CANCELLED: { bg: "#f3f4f6", text: "#6b7280" },
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
        >
          Back to List
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: "#0F172A" }}
              >
                {invoice?.invoiceNumber}
              </Typography>
              <Chip
                label={invoice?.status.replace("_", " ")}
                icon={
                  invoice?.status === "PAID" ? (
                    <CheckCircle fontSize="small" />
                  ) : undefined
                }
                sx={{
                  bgcolor: statusColors[invoice?.status]?.bg,
                  color: statusColors[invoice?.status]?.text,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Issued on {formatDate(invoice?.issueDate)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {/* <Button variant="outlined" startIcon={<Print />}>
              Print / PDF
            </Button> */}

            <Button
              variant="outlined"
              startIcon={
                isDownloading ? <CircularProgress size={18} /> : <Print />
              }
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              sx={{
                borderColor: "#CBD5E1",
                color: "#334155",
                fontWeight: 600,
                "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
              }}
            >
              {isDownloading ? "Generating..." : "Download PDF"}
            </Button>

            {invoice?.status !== "PAID" && (
              <Button
                variant="contained"
                startIcon={<Payment />}
                onClick={() => setShowPaymentDialog(true)}
                sx={{
                  bgcolor: "#0F172A",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#334155" },
                }}
              >
                Record Payment
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {isOverdue() && (
        <Alert
          severity="error"
          icon={<Warning />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>Payment Overdue!</strong> This invoice was due on{" "}
          {formatDate(invoice.dueDate)}. Please follow up with the client.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Financial Overview Card */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 3,
                bgcolor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Payment Progress
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {getPaymentProgress().toFixed(0)}% Paid
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getPaymentProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "#E2E8F0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: invoice?.status === "PAID" ? "#10B981" : "#3B82F6",
                  },
                }}
              />
            </Box>
            <Grid container>
              <Grid item xs={12} md={4} sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Total Invoice Value
                </Typography>
                <MoneyText variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(invoice?.finalAmount)}
                </MoneyText>
              </Grid>
              <Grid item xs={12} md={4} sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Amount Paid
                </Typography>
                <MoneyText variant="h5" sx={{ mt: 1, color: "#166534" }}>
                  {formatCurrency(invoice?.paidAmount)}
                </MoneyText>
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  p: 3,
                  bgcolor: invoice?.balanceAmount > 0 ? "#FEF2F2" : "#F0FDF4",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Balance Due
                </Typography>
                <MoneyText
                  variant="h5"
                  sx={{
                    mt: 1,
                    color: invoice?.balanceAmount > 0 ? "#B91C1C" : "#166534",
                  }}
                >
                  {formatCurrency(invoice?.balanceAmount)}
                </MoneyText>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Customer & Meta Data */}
        <Grid item xs={12} md={6}>
          <InfoCard>
            <SectionHeader>
              Customer
              {/* <Person fontSize="small" /> Customer */}
            </SectionHeader>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {invoice?.customer.name}
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Email:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.email}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Phone:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.phone}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Addr:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.address || "N/A"}
                </Typography>
              </Box>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard>
            <SectionHeader>
              Payment Details
              {/* <CreditCard fontSize="small" /> Payment Details */}
            </SectionHeader>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #E2E8F0",
                  pb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={isOverdue() ? "error.main" : "text.primary"}
                >
                  {formatDate(invoice?.dueDate)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #E2E8F0",
                  pb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Payment Terms
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {invoice?.paymentTerms || "Immediate"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Related Quote
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ minWidth: 0, p: 0, height: "auto" }}
                  onClick={() =>
                    router.push(`/sales/quotes/${invoice?.quote.id}`)
                  }
                >
                  {invoice?.quote.quoteNumber}
                </Button>
              </Box>
            </Stack>
          </InfoCard>
        </Grid>

        {/* Line Items Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <SectionHeader sx={{ mb: 0 }}>
                Invoice Items
                {/* <Description fontSize="small" /> Invoice Items */}
              </SectionHeader>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}
                    >
                      ITEM DESCRIPTION
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}
                    >
                      QTY
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}
                    >
                      UNIT PRICE
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}
                    >
                      TOTAL
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice?.lineItems?.map((lineItem: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {lineItem.storeItem?.name ||
                            lineItem.product?.name ||
                            "Item"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lineItem.storeItem?.itemNumber ||
                            lineItem.product?.productNumber ||
                            ""}
                          {lineItem.storeItem?.category
                            ? ` • ${lineItem.storeItem.category}`
                            : ""}
                        </Typography>
                        {(lineItem.quantityBackordered || 0) > 0 && (
                          <Chip
                            label={`${lineItem.quantityBackordered} Backordered`}
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
                      <TableCell align="center">{lineItem.quantity}</TableCell>
                      <TableCell align="right">
                        <MoneyText variant="body2">
                          {formatCurrency(lineItem.unitPrice)}
                        </MoneyText>
                      </TableCell>
                      <TableCell align="right">
                        <MoneyText variant="body2">
                          {formatCurrency(lineItem.totalAmount)}
                        </MoneyText>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Section */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                p: 3,
                bgcolor: "#F8FAFC",
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 360 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <MoneyText variant="body2">
                      {formatCurrency(invoice?.totalAmount)}
                    </MoneyText>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tax (VAT)
                    </Typography>
                    <MoneyText variant="body2">
                      {formatCurrency(invoice?.taxAmount)}
                    </MoneyText>
                  </Box>
                  {invoice?.discountAmount > 0 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="error.main">
                        Discount
                      </Typography>
                      <MoneyText variant="body2" color="error.main">
                        -{formatCurrency(invoice?.discountAmount)}
                      </MoneyText>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Grand Total
                    </Typography>
                    <MoneyText variant="h6" color="#0F172A">
                      {formatCurrency(invoice?.finalAmount)}
                    </MoneyText>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Payment History Table */}
        {invoice?.payments?.length > 0 && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                overflow: "hidden",
                mt: 1,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <SectionHeader sx={{ mb: 0 }}>
                  Payment History
                </SectionHeader>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                        DATE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                        AMOUNT
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                        METHOD
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                        REFERENCE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                        RECORDED BY
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.payments.map((payment: any) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#334155" }}>
                            {formatDate(payment.paymentDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#166534" }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.paymentMethod || "N/A"} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {payment.reference || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {payment.recordedBy?.name || "Unknown"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Record Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => !processing && setShowPaymentDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 500 } }}
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: "1px solid #E2E8F0" }}
        >
          Record Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert
            severity="info"
            variant="outlined"
            sx={{ mb: 3, border: "1px solid #BFDBFE", bgcolor: "#EFF6FF" }}
          >
            Balance Due:{" "}
            <strong>{formatCurrency(invoice?.balanceAmount)}</strong>
          </Alert>

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={processing}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₦</InputAdornment>
                ),
              }}
              inputProps={{ min: 0, max: invoice?.balanceAmount, step: 0.01 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {["Cash", "Bank Transfer", "Card", "Cheque", "POS"].map(
                    (m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Reference ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Txn Ref..."
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Internal Notes"
              multiline
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}
        >
          <Button
            onClick={() => setShowPaymentDialog(false)}
            disabled={processing}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={processing || !paymentAmount || !paymentMethod}
            sx={{ bgcolor: "#10B981", "&:hover": { bgcolor: "#059669" } }}
          >
            {processing ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
