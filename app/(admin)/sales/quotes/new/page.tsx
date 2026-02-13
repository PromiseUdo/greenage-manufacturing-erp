// // src/app/dashboard/sales/quotes/new/page.tsx

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
  Autocomplete,
  Table,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  InputAdornment,
  Divider,
  Stack,
} from "@mui/material";

import Grid from "@mui/material/GridLegacy";

import {
  ArrowBack,
  Save,
  Person,
  Inventory,
  Description,
  AttachMoney,
  CalendarMonth,
  Numbers,
  InfoOutlined,
  Gavel,
} from "@mui/icons-material";

// --- Design Tokens (Shared with Order Page) ---
const SectionHeader = styled(Typography)(({ theme }) => ({
  // fontSize: 13,
  // fontWeight: 700,
  // color: '#64748B', // Slate 500
  // textTransform: 'uppercase',
  // letterSpacing: '0.8px',
  // marginBottom: theme.spacing(3),
  // display: 'flex',
  // alignItems: 'center',
  // gap: '8px',
  // borderBottom: '1px solid #E2E8F0',
  // paddingBottom: theme.spacing(1),

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

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

interface StoreItem {
  id: string;
  itemNumber: string;
  name: string;
  productId: string | null;
  product: {
    productCode: string;
    model: string | null;
  } | null;
  category: string;
  quantity: number;
  unitPrice: number | null;
  condition: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customersLoading, setCustomersLoading] = useState(false);
  const [storeItemsLoading, setStoreItemsLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedStoreItem, setSelectedStoreItem] = useState<StoreItem | null>(
    null,
  );

  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryDate: "",
    unitPrice: 0,
    taxRate: 7.5,
    discountAmount: 0,
    paymentTerms: "50% upfront, 50% on delivery",
    expiryDays: 30,
    notes: "",
    termsConditions: "Standard warranty applies. Quote valid for 30 days.",
  });

  useEffect(() => {
    fetchCustomers();
    fetchStoreItems();
  }, []);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const res = await fetch("/api/customers?limit=1000");
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchStoreItems = async () => {
    try {
      setStoreItemsLoading(true);
      const res = await fetch("/api/store?limit=1000");
      const data = await res.json();
      if (res.ok) {
        setStoreItems(data.storeItems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStoreItemsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStoreItem) {
      setFormData((prev) => ({
        ...prev,
        unitPrice: selectedStoreItem.unitPrice || 0,
      }));
    }
  }, [selectedStoreItem]);

  const totalAmount = formData.unitPrice * formData.quantity;
  const taxAmount = (totalAmount * formData.taxRate) / 100;
  const finalAmount = totalAmount + taxAmount - formData.discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!selectedCustomer || !selectedStoreItem)
        throw new Error("Please select both customer and product");

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + formData.expiryDays);

      const payload = {
        customerId: selectedCustomer.id,
        productId: selectedStoreItem.productId || undefined,
        storeItemId: selectedStoreItem.id,
        quantity: formData.quantity,
        deliveryDate: formData.deliveryDate,
        unitPrice: formData.unitPrice,
        taxAmount,
        discountAmount: formData.discountAmount,
        paymentTerms: formData.paymentTerms,
        expiryDate: expiryDate.toISOString(),
        notes: formData.notes,
        termsConditions: formData.termsConditions,
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quote");
      router.push(`/sales/quotes/${data.quote.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
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
            sx={{ mb: 1, textTransform: "none", color: "text.secondary", p: 0 }}
          >
            Back to Quotes
          </Button>
          <Typography variant="h5" fontWeight={700} color="#0F172A">
            Create New Quote
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Draft a formal proposal for a customer.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* LEFT COLUMN: Inputs */}
          <Grid item xs={12} md={8}>
            {/* 1. Essentials */}
            <FormCard>
              <SectionHeader>
                Quote Essentials
                {/* <Person fontSize="small" /> Quote Essentials */}
              </SectionHeader>
              <Stack spacing={4}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.phone})`
                  }
                  loading={customersLoading}
                  value={selectedCustomer}
                  onChange={(e, value) => setSelectedCustomer(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customer"
                      variant="standard"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {customersLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <Autocomplete
                  options={storeItems}
                  getOptionLabel={(option) => option.name}
                  loading={storeItemsLoading}
                  value={selectedStoreItem}
                  onChange={(e, value) => setSelectedStoreItem(value)}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {option.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.itemNumber}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="primary"
                          >
                            {option.unitPrice
                              ? formatCurrency(option.unitPrice)
                              : "Price N/A"}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Store Item"
                      variant="standard"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {storeItemsLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                {selectedStoreItem && (
                  <Alert
                    icon={<Inventory fontSize="inherit" />}
                    severity="info"
                    sx={{
                      bgcolor: "#F8FAFC",
                      color: "#334155",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {selectedStoreItem.name}
                    </Typography>
                    <Typography variant="caption">
                      Store Item: {selectedStoreItem.itemNumber} • Selling
                      Price:{" "}
                      {selectedStoreItem.unitPrice
                        ? formatCurrency(selectedStoreItem.unitPrice)
                        : "N/A"}
                    </Typography>
                    {selectedStoreItem.product && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, color: "text.secondary" }}
                      >
                        Linked Product: {selectedStoreItem.product.productCode}{" "}
                        {selectedStoreItem.product.model
                          ? `(${selectedStoreItem.product.model})`
                          : ""}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Stack>
            </FormCard>

            {/* 2. Timeline & Logistics */}
            <FormCard>
              <SectionHeader>
                Quantity & Timeline
                {/* <Description fontSize="small" /> Quantity & Timeline */}
              </SectionHeader>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    variant="standard"
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Numbers
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery Date"
                    variant="standard"
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryDate: e.target.value,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarMonth
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Valid For (Days)"
                    variant="standard"
                    type="number"
                    value={formData.expiryDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryDays: parseInt(e.target.value) || 30,
                      }))
                    }
                    helperText="Quote expiration"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* 3. Financials */}
            <FormCard>
              <SectionHeader>
                {/* <AttachMoney fontSize="small" /> Pricing Breakdown */}
                Pricing Breakdown
              </SectionHeader>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unit Price"
                    variant="standard"
                    type="number"
                    required
                    value={formData.unitPrice ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unitPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₦</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    variant="standard"
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        taxRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Discount Amount"
                    variant="standard"
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₦</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* 4. Terms & Notes */}
            <FormCard sx={{ mb: 0 }}>
              <SectionHeader>
                Terms & Conditions
                {/* <Gavel fontSize="small" /> Terms & Conditions */}
              </SectionHeader>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Payment Terms"
                  variant="standard"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentTerms: e.target.value,
                    }))
                  }
                  placeholder="e.g., 50% upfront, 50% on delivery"
                />
                <Box sx={{ width: "100%", overflow: "hidden" }}>
                  <Grid container columnSpacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Customer-Facing Terms"
                        variant="standard"
                        multiline
                        rows={3}
                        value={formData.termsConditions}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            termsConditions: e.target.value,
                          }))
                        }
                        placeholder="Warranty info, validity, etc."
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Internal Notes (Private)"
                        variant="standard"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Sales context, approval notes..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </FormCard>
          </Grid>

          {/* RIGHT COLUMN: Sticky Summary */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#0F172A",
                color: "white",
                position: "sticky",
                top: 70,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: "#fff" }}
              >
                Quote Summary
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

              <Table
                size="small"
                sx={{
                  "& td": {
                    borderBottom: "none",
                    color: "rgba(255,255,255,0.7)",
                    px: 0,
                    py: 0.5,
                  },
                }}
              >
                <TableBody>
                  <TableRow>
                    <TableCell>Subtotal</TableCell>
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {formatCurrency(totalAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tax ({formData.taxRate}%)</TableCell>
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {formatCurrency(taxAmount)}
                    </TableCell>
                  </TableRow>
                  {formData.discountAmount > 0 && (
                    <TableRow>
                      <TableCell sx={{ color: "#FCA5A5 !important" }}>
                        Discount
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "#FCA5A5 !important" }}
                      >
                        -{formatCurrency(formData.discountAmount)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  Total Value
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ color: "#4ADE80" }}
                >
                  {formatCurrency(finalAmount)}
                </Typography>
              </Box>

              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <InfoOutlined
                      fontSize="small"
                      sx={{ color: "rgba(255,255,255,0.5)", mt: 0.2 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      Status will be <strong>DRAFT</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <InfoOutlined
                      fontSize="small"
                      sx={{ color: "rgba(255,255,255,0.5)", mt: 0.2 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      Quote expires in{" "}
                      <strong>{formData.expiryDays} days</strong>
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <></>
                  )
                }
                disabled={loading}
                sx={{
                  bgcolor: "#fff",
                  color: "#0F172A",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#F1F5F9" },
                  mb: 2,
                }}
              >
                {loading ? "Processing..." : "Generate Quote"}
              </Button>
              <Button
                fullWidth
                onClick={() => router.back()}
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  "&:hover": { color: "#fff" },
                }}
              >
                Cancel
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
