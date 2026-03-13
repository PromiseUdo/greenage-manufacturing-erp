// src/app/dashboard/sales/quotes/new/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
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
  TableHead,
  CircularProgress,
  InputAdornment,
  Divider,
  Stack,
  IconButton,
  Chip,
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
  WarningAmber,
  Add,
  DeleteOutline,
} from "@mui/icons-material";

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

interface LineItemRow {
  id: string; // client-side unique key
  storeItem: StoreItem | null;
  quantity: number;
  unitPrice: number;
}

let lineItemIdCounter = 0;
const generateLineItemKey = () => `li-${++lineItemIdCounter}-${Date.now()}`;

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

  // Dynamic line items
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { id: generateLineItemKey(), storeItem: null, quantity: 1, unitPrice: 0 },
  ]);

  const [formData, setFormData] = useState({
    deliveryDate: "",
    taxRate: 0,
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

  // --- Line item CRUD ---
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: generateLineItemKey(), storeItem: null, quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return; // Keep at least one
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItemRow>) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        const updated = { ...li, ...updates };
        // Auto-set unit price when store item changes
        if (updates.storeItem !== undefined && updates.storeItem) {
          updated.unitPrice = updates.storeItem.unitPrice || 0;
        }
        return updated;
      }),
    );
  };

  // --- Computed values ---
  const lineItemTotals = lineItems.map((li) => ({
    ...li,
    total: li.unitPrice * li.quantity,
    availableStock: li.storeItem?.quantity ?? 0,
    isBackorderNeeded: li.storeItem
      ? li.quantity > li.storeItem.quantity
      : false,
    backorderQty: li.storeItem
      ? Math.max(0, li.quantity - li.storeItem.quantity)
      : 0,
  }));

  const subtotal = lineItemTotals.reduce((sum, li) => sum + li.total, 0);
  const taxAmount = (subtotal * formData.taxRate) / 100;
  const finalAmount = subtotal + taxAmount - formData.discountAmount;
  const hasBackorders = lineItemTotals.some((li) => li.isBackorderNeeded);
  const validLineItems = lineItems.filter((li) => li.storeItem !== null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!selectedCustomer) throw new Error("Please select a customer");

      if (validLineItems.length === 0)
        throw new Error("Please add at least one line item with a store item");

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + formData.expiryDays);

      const payload = {
        customerId: selectedCustomer.id,
        lineItems: validLineItems.map((li) => ({
          storeItemId: li.storeItem!.id,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
        deliveryDate: formData.deliveryDate,
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
            Draft a formal proposal for a customer with multiple items.
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
            {/* 1. Customer Selection */}
            <FormCard>
              <SectionHeader>Quote Essentials</SectionHeader>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.name} (${option.phone})`}
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
            </FormCard>

            {/* 2. Line Items */}
            <FormCard>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <SectionHeader sx={{ mb: 0 }}>
                  <Inventory fontSize="small" /> Line Items
                </SectionHeader>
                <Button
                  startIcon={<Add />}
                  onClick={addLineItem}
                  size="small"
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Add Item
                </Button>
              </Box>

              <Stack spacing={2}>
                {lineItems.map((li, index) => {
                  const computed = lineItemTotals[index];
                  return (
                    <Paper
                      key={li.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: computed?.isBackorderNeeded
                          ? "1px solid #FDBA74"
                          : "1px solid #E2E8F0",
                        bgcolor: computed?.isBackorderNeeded
                          ? "#FFFBF5"
                          : "transparent",
                      }}
                    >
                      <Grid container spacing={2} alignItems="flex-end">
                        {/* Store Item Selector */}
                        <Grid item xs={12} md={5}>
                          <Autocomplete
                            options={storeItems}
                            getOptionLabel={(option) => option.name}
                            loading={storeItemsLoading}
                            value={li.storeItem}
                            onChange={(e, value) =>
                              updateLineItem(li.id, { storeItem: value })
                            }
                            renderOption={(props, option) => {
                              const { key, ...rest } = props;
                              return (
                                <li key={option.id} {...rest}>
                                  <Box
                                    sx={{
                                      width: "100%",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      py: 0.5,
                                    }}
                                  >
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {option.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {option.itemNumber} • Stock:{" "}
                                        {option.quantity}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      fontWeight={700}
                                      color="primary"
                                    >
                                      {option.unitPrice
                                        ? formatCurrency(option.unitPrice)
                                        : "N/A"}
                                    </Typography>
                                  </Box>
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={`Item ${index + 1}`}
                                variant="standard"
                                required
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {storeItemsLoading ? (
                                        <CircularProgress
                                          color="inherit"
                                          size={20}
                                        />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                          />
                        </Grid>

                        {/* Quantity */}
                        <Grid item xs={4} md={2}>
                          <TextField
                            fullWidth
                            label="Qty"
                            variant="standard"
                            type="number"
                            required
                            value={li.quantity}
                            onChange={(e) =>
                              updateLineItem(li.id, {
                                quantity: parseInt(e.target.value) || 1,
                              })
                            }
                            inputProps={{ min: 1 }}
                          />
                        </Grid>

                        {/* Unit Price */}
                        <Grid item xs={4} md={2}>
                          <TextField
                            fullWidth
                            label="Unit Price"
                            variant="standard"
                            type="number"
                            required
                            value={li.unitPrice ?? ""}
                            onChange={(e) =>
                              updateLineItem(li.id, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₦
                                </InputAdornment>
                              ),
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>

                        {/* Line Total */}
                        <Grid item xs={3} md={2}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ pb: 0.5, color: "#0F172A" }}
                          >
                            {formatCurrency(computed?.total || 0)}
                          </Typography>
                        </Grid>

                        {/* Remove */}
                        <Grid item xs={1} md={1}>
                          <IconButton
                            size="small"
                            onClick={() => removeLineItem(li.id)}
                            disabled={lineItems.length <= 1}
                            sx={{ color: "#EF4444" }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>

                      {/* Backorder Warning */}
                      {computed?.isBackorderNeeded && (
                        <Alert
                          severity="warning"
                          icon={<WarningAmber fontSize="inherit" />}
                          sx={{
                            mt: 1.5,
                            borderRadius: 1.5,
                            bgcolor: "#FFF7ED",
                            border: "1px solid #FDBA74",
                            "& .MuiAlert-icon": { color: "#EA580C" },
                            py: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="#9A3412"
                          >
                            Only {computed.availableStock} in stock —{" "}
                            {computed.backorderQty} will be backordered.
                          </Typography>
                        </Alert>
                      )}

                      {/* Store item info chip */}
                      {li.storeItem && (
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={`Stock: ${li.storeItem.quantity}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                          <Chip
                            label={li.storeItem.itemNumber}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                          {li.storeItem.product && (
                            <Chip
                              label={`Product: ${li.storeItem.product.productCode}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Stack>

              {/* Add another button at bottom */}
              <Button
                startIcon={<Add />}
                onClick={addLineItem}
                fullWidth
                variant="outlined"
                sx={{
                  mt: 2,
                  textTransform: "none",
                  borderStyle: "dashed",
                  borderColor: "#CBD5E1",
                  color: "#64748B",
                  "&:hover": {
                    borderColor: "#94A3B8",
                    bgcolor: "#F8FAFC",
                  },
                }}
              >
                Add Another Item
              </Button>
            </FormCard>

            {/* 3. Timeline */}
            <FormCard>
              <SectionHeader>Timeline</SectionHeader>
              <Grid container spacing={4}>
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

            {/* 4. Financials */}
            <FormCard>
              <SectionHeader>Pricing Adjustments</SectionHeader>
              <Grid container spacing={4}>
                <Grid item xs={6} md={4}>
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
                <Grid item xs={6} md={4}>
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

            {/* 5. Terms & Notes */}
            <FormCard sx={{ mb: 0 }}>
              <SectionHeader>Terms & Conditions</SectionHeader>
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

              {/* Line items mini-table */}
              {validLineItems.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {lineItemTotals
                    .filter((li) => li.storeItem)
                    .map((li, i) => (
                      <Box
                        key={li.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          py: 0.5,
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            maxWidth: "60%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {li.storeItem!.name} × {li.quantity}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#fff", fontWeight: 600 }}
                        >
                          {formatCurrency(li.total)}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              )}

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
                    <TableCell>
                      Subtotal ({validLineItems.length} items)
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {formatCurrency(subtotal)}
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
                  mb: hasBackorders ? 2 : 4,
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

              {hasBackorders && (
                <Alert
                  severity="warning"
                  icon={<WarningAmber fontSize="inherit" />}
                  sx={{
                    mb: 3,
                    bgcolor: "rgba(251,191,36,0.1)",
                    color: "#FBBF24",
                    border: "1px solid rgba(251,191,36,0.3)",
                    "& .MuiAlert-icon": { color: "#FBBF24" },
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    Some items exceed available stock. Production requests will
                    be auto-created.
                  </Typography>
                </Alert>
              )}

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
