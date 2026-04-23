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
  Edit,
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
    fontSize: 10,
    fontFamily: "Roboto",
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

  quoteTitleBox: { alignItems: "flex-end" },
  quoteTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: C.darkGreen,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  quoteMeta: { marginTop: 8, textAlign: "right" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaLabel: { width: 65, color: C.gray, textAlign: "right", marginRight: 8, fontSize: 9 },
  metaValue: { fontWeight: 700, color: C.black, textAlign: "right", fontSize: 9 },

  // Brand accent stripe below header
  accentStripe: {
    height: 3,
    backgroundColor: C.brandGreen,
    marginBottom: 14,
  },

  // ── Customer section ──
  customerSection: { flexDirection: "row", marginBottom: 20 },
  customerCol: { width: "55%" },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: C.mutedGreen,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  customerName: { fontSize: 12, fontWeight: 700, color: C.darkGreen, marginBottom: 3 },
  customerText: { fontSize: 9, color: "#475569", marginBottom: 2 },

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
    paddingHorizontal: 0,
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
  tableRowAlt: {
    backgroundColor: C.lightMint,
  },

  // cell column widths + vertical borders
  col1: {
    width: "50%",
    paddingHorizontal: 9,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  col2: {
    width: "13%",
    textAlign: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  col3: {
    width: "18%",
    textAlign: "right",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
  },
  col4: { width: "19%", textAlign: "right", paddingHorizontal: 9 },

  // ── Totals ──
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
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
  totalLabel: { color: C.gray, fontSize: 9.5 },
  totalValue: { color: C.black, fontWeight: 700, fontSize: 9.5 },
  grandTotalRow: {
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

  // ── Bank & Contact details ──
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

// --- PDF Component ---
const QuoteDocument = ({
  quote,
  companyDetails,
}: {
  quote: any;
  companyDetails: any;
}) => {
  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);

  const cd = companyDetails || {};

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoSection}>
            {COMPANY_LOGO_URL && (
              <PdfImage style={pdfStyles.logo} src={COMPANY_LOGO_URL} />
            )}
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
                  {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              {quote.expiryDate && (
                <View style={pdfStyles.metaRow}>
                  <Text style={pdfStyles.metaLabel}>Expires:</Text>
                  <Text style={pdfStyles.metaValue}>
                    {new Date(quote.expiryDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Status:</Text>
                <Text style={pdfStyles.metaValue}>{quote.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Brand accent stripe */}
        <View style={pdfStyles.accentStripe} />

        {/* Customer Info */}
        <View style={pdfStyles.customerSection}>
          <View style={pdfStyles.customerCol}>
            <Text style={pdfStyles.sectionLabel}>Quotation For:</Text>
            <Text style={pdfStyles.customerName}>{quote.customer.name}</Text>
            {quote.customer.phone && (
              <Text style={pdfStyles.customerText}>{quote.customer.phone}</Text>
            )}
            {quote.customer.email && (
              <Text style={pdfStyles.customerText}>{quote.customer.email}</Text>
            )}
            {quote.customer.address && (
              <Text style={pdfStyles.customerText}>{quote.customer.address}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={pdfStyles.tableWrapper}>
          {/* Header row */}
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

          {/* Line item rows */}
          {(quote.lineItems || []).map((li: any, i: number) => (
            <View
              key={i}
              style={[
                pdfStyles.tableRow,
                i % 2 !== 0 ? pdfStyles.tableRowAlt : {},
              ]}
            >
              <View style={pdfStyles.col1}>
                <Text style={{ fontWeight: 700, fontSize: 10, color: C.darkGreen }}>
                  {li.storeItem?.name || li.description || "Item"}
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
              <Text style={[pdfStyles.col2, { fontSize: 10 }]}>
                {li.quantity}
              </Text>
              <Text style={[pdfStyles.col3, { fontSize: 10 }]}>
                {fmt(li.unitPrice)}
              </Text>
              <Text
                style={[pdfStyles.col4, { fontSize: 10, fontWeight: 700 }]}
              >
                {fmt(li.unitPrice * li.quantity)}
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
                {fmt(quote.totalAmount)}
              </Text>
            </View>

            {quote.discountAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={[pdfStyles.totalLabel, { color: "#B91C1C" }]}>
                  Discount
                </Text>
                <Text style={[pdfStyles.totalValue, { color: "#B91C1C" }]}>
                  -{fmt(quote.discountAmount)}
                </Text>
              </View>
            )}

            {quote.taxAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Tax (VAT)</Text>
                <Text style={pdfStyles.totalValue}>{fmt(quote.taxAmount)}</Text>
              </View>
            )}

            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>Grand Total</Text>
              <Text style={pdfStyles.grandTotalValue}>
                {fmt(quote.finalAmount)}
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
            {quote.terms ||
              "This quote is valid for 30 days. Payment terms: 50% upfront, 50% on delivery."}
          </Text>
          <Text style={[pdfStyles.footerText, { marginTop: 3, color: "#B0BEC5" }]}>
            Generated by Greenage Technologies · {new Date().toLocaleDateString("en-GB")}
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

  const [companyDetails, setCompanyDetails] = useState<any>(null);

  // PDF Download State
  const [isDownloading, setIsDownloading] = useState(false);

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dueInDays, setDueInDays] = useState(30);

  useEffect(() => {
    fetchQuote();
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then(setCompanyDetails)
      .catch(() => {});
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
      const blob = await pdf(
        <QuoteDocument quote={quote} companyDetails={companyDetails} />,
      ).toBlob();

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
          >
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
          {!quote?.isAccepted && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => router.push(`/sales/quotes/${resolvedParams.id}/edit`)}
              sx={{
                borderColor: "#CBD5E1",
                color: "#0F172A",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#F8FAFC" },
              }}
            >
              Edit Quote
            </Button>
          )}
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {formatCurrency(li.unitPrice * li.quantity)}
                        </Typography>
                        {li.quantityBackordered > 0 && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            fontWeight={600}
                            display="block"
                          >
                            {li.quantityBackordered} Backordered
                          </Typography>
                        )}
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
