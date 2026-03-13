// components/store/store-dispatch-form.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Autocomplete,
  Divider,
  MenuItem,
  Tooltip,
  Chip,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { StoreDispatchFormData } from "@/types/store";

export interface StoreDispatchFormProps {
  onSubmit: (data: StoreDispatchFormData | any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: {
    orderId?: string;
    customerId?: string;
    invoiceId?: string;
    deliveryAddress?: string;
    items?: Array<{
      storeItemId: string;
      quantity: number;
      notes: string;
      maxAllowed?: number;
    }>;
  };
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  finalAmount: number;
  status: string;
  customer: { id: string; name: string };
}

interface StoreItemOption {
  id: string;
  name: string;
  itemNumber: string;
  unit: string;
  quantity: number;
}

const DELIVERY_METHODS = [
  "Pickup",
  "Delivery",
  "Courier",
  "Third-Party Logistics",
  "Other",
];

export default function StoreDispatchForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: StoreDispatchFormProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItemOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialData?.customerId || "",
  );
  const [formError, setFormError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoreDispatchFormData>({
    defaultValues: {
      orderId: initialData?.orderId || "",
      dispatchDate: todayStr,
      customerId: initialData?.customerId || "",
      invoiceId: initialData?.invoiceId || "",
      items: initialData?.items?.length
        ? initialData.items
        : [
            {
              storeItemId: "",
              quantity: 1,
              notes: "",
            },
          ],
      deliveryMethod: "",
      deliveryAddress: initialData?.deliveryAddress || "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers?limit=1000");
        const data = await res.json();
        setCustomers(
          data.customers?.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
          })) || [],
        );
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch store items
  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        const res = await fetch("/api/store?limit=1000");
        const data = await res.json();
        setStoreItems(
          data.storeItems?.map((item: any) => ({
            id: item.id,
            name: item.name,
            itemNumber: item.itemNumber,
            unit: item.unit,
            quantity: item.quantity,
          })) || [],
        );
      } catch (error) {
        console.error("Error fetching store items:", error);
      }
    };

    fetchStoreItems();
  }, []);

  // Fetch PAID or PARTIALLY PAID invoices for selected customer
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerId) {
        setInvoices([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/invoices?limit=1000&status=PAID,PARTIALLY_PAID`,
        );
        const data = await res.json();
        // Filter to selected customer's invoices
        const filtered = (data.invoices || []).filter(
          (inv: any) => inv.customerId === selectedCustomerId,
        );
        setInvoices(
          filtered.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            finalAmount: inv.finalAmount,
            status: inv.status,
            customer: inv.customer,
          })),
        );
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, [selectedCustomerId]);

  const addItem = () => {
    append({
      storeItemId: "",
      quantity: 0,
      notes: "",
    });
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setValue("customerId", customerId);
    // Reset invoice when customer changes
    setValue("invoiceId", "");

    // Auto-fill delivery address from customer
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setValue("deliveryAddress", customer.address);
    }
  };

  const onSubmitHandler = async (data: any) => {
    setFormError("");
    try {
      await onSubmit(data);
    } catch (err: any) {
      setFormError(err.message || "An error occurred during submission.");
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmitHandler)}>
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={4}>
          {/* Customer */}
          <Grid item xs={12} md={6}>
            <Controller
              name="customerId"
              control={control}
              rules={{ required: "Customer is required" }}
              render={({ field }) => {
                const selectedCustomer =
                  customers.find((c) => c.id === field.value) || null;

                return (
                  <Autocomplete<CustomerOption>
                    options={customers}
                    value={selectedCustomer}
                    getOptionLabel={(option) =>
                      `${option.name} — ${option.phone}`
                    }
                    onChange={(_, value) => {
                      handleCustomerChange(value?.id || "");
                    }}
                    disabled={isLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer"
                        variant="standard"
                        required
                        error={!!errors.customerId}
                        helperText={errors.customerId?.message as string}
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* Invoice (optional, filtered to PAID/PARTIALLY_PAID for selected customer) */}
          <Grid item xs={12} md={6}>
            <Controller
              name="invoiceId"
              control={control}
              render={({ field }) => {
                const selectedInvoice =
                  invoices.find((inv) => inv.id === field.value) || null;

                return (
                  <Autocomplete<InvoiceOption>
                    options={invoices}
                    value={selectedInvoice}
                    getOptionLabel={(option) =>
                      `${option.invoiceNumber} — ₦${option.finalAmount?.toLocaleString()} (${option.status.replace(/_/g, " ")})`
                    }
                    onChange={(_, value) => field.onChange(value?.id || "")}
                    disabled={isLoading || !selectedCustomerId}
                    noOptionsText={
                      selectedCustomerId
                        ? "No eligible invoices for this customer"
                        : "Select a customer first"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Linked Invoice (PAID/PARTIAL)"
                        variant="standard"
                        helperText={
                          selectedCustomerId
                            ? "Optional — link to an eligible invoice"
                            : "Select a customer first"
                        }
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* Dispatch Info and Delivery Address combined for better flow */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                bgcolor: "#F8FAFC",
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AddIcon fontSize="small" />
                Dispatch & Delivery Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Controller
                      name="dispatchDate"
                      control={control}
                      rules={{ required: "Dispatch Date is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="date"
                          label="Dispatch Date"
                          variant="standard"
                          fullWidth
                          disabled={isLoading}
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.dispatchDate}
                          helperText={errors.dispatchDate?.message}
                        />
                      )}
                    />
                    {initialData?.orderId && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Linked Order
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: "#0F172A" }}
                        >
                          # {initialData.orderId.substring(0, 8)}...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    <Controller
                      name="deliveryMethod"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Delivery Method"
                          fullWidth
                          variant="standard"
                          disabled={isLoading}
                          helperText="How items will be delivered (optional)"
                          size="small"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {DELIVERY_METHODS.map((m) => (
                            <MenuItem key={m} value={m}>
                              {m}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Controller
                      name="deliveryAddress"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Delivery Address"
                          variant="standard"
                          fullWidth
                          disabled={isLoading}
                          helperText="Auto-filled from customer, editable"
                          size="small"
                          multiline
                          maxRows={2}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Items Header */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Items to Dispatch
              </Typography>

              <Tooltip title="Add Item">
                <IconButton
                  sx={{ backgroundColor: "#f0f0f0" }}
                  aria-label="add item"
                  onClick={addItem}
                  size="small"
                  disabled={isLoading}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          {/* Items */}
          {fields.map((field, index) => (
            <Grid item xs={12} key={field.id}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Item {index + 1}
                  </Typography>
                  {fields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                      disabled={isLoading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={3}>
                  {/* Store Item */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`items.${index}.storeItemId`}
                      control={control}
                      rules={{ required: "Store item is required" }}
                      render={({ field }) => {
                        const selectedItem =
                          storeItems.find((s) => s.id === field.value) || null;

                        return (
                          <Autocomplete<StoreItemOption>
                            options={storeItems}
                            value={selectedItem}
                            getOptionLabel={(option) =>
                              `${option.itemNumber} – ${option.name}`
                            }
                            onChange={(_, value) =>
                              field.onChange(value?.id || "")
                            }
                            disabled={isLoading}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography variant="body2">
                                    {option.itemNumber} – {option.name}
                                  </Typography>
                                  <Chip
                                    label={`${option.quantity} ${option.unit}`}
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      fontSize: 11,
                                      bgcolor:
                                        option.quantity > 0
                                          ? "#e8f5e9"
                                          : "#ffebee",
                                      color:
                                        option.quantity > 0
                                          ? "#2e7d32"
                                          : "#c62828",
                                    }}
                                  />
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Store Item"
                                variant="standard"
                                required
                                error={!!(errors.items as any)?.[index]?.storeItemId}
                                helperText={
                                  (errors.items as any)?.[index]?.storeItemId?.message ||
                                  (selectedItem
                                    ? `Available: ${selectedItem.quantity} ${selectedItem.unit}`
                                    : "")
                                }
                              />
                            )}
                          />
                        );
                      }}
                    />
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      rules={{
                        required: "Required",
                        min: { value: 1, message: "Must be ≥ 1" },
                        validate: (val, formValues) => {
                          const itemId = formValues.items[index]?.storeItemId;
                          const item = storeItems.find((s) => s.id === itemId);
                          const maxAllowed =
                            formValues.items[index]?.maxAllowed;

                          let maxStock =
                            item?.quantity ?? Number.MAX_SAFE_INTEGER;
                          let effectiveMax =
                            maxAllowed !== undefined
                              ? Math.min(maxStock, maxAllowed)
                              : maxStock;

                          if (val > effectiveMax) {
                            return `Max allowed: ${effectiveMax}`;
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => {
                        const itemId = watch(`items.${index}.storeItemId`);
                        const item = storeItems.find((s) => s.id === itemId);
                        const maxAllowed = watch(`items.${index}.maxAllowed`);

                        let maxStock =
                          item?.quantity ?? Number.MAX_SAFE_INTEGER;
                        let effectiveMax =
                          maxAllowed !== undefined
                            ? Math.min(maxStock, maxAllowed)
                            : maxStock;

                        return (
                          <TextField
                            {...field}
                            label="Quantity"
                            variant="standard"
                            type="number"
                            fullWidth
                            required
                            disabled={isLoading}
                            error={!!(errors.items as any)?.[index]?.quantity}
                            helperText={
                              (errors.items as any)?.[index]?.quantity?.message
                            }
                            inputProps={{ min: 1, max: effectiveMax, step: 1 }}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                          />
                        );
                      }}
                    />
                  </Grid>

                  {/* Item Notes */}
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.notes`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Item Notes"
                          variant="standard"
                          fullWidth
                          disabled={isLoading}
                          helperText="Optional"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}

          {/* Notes */}
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="General Notes"
                  variant="standard"
                  fullWidth
                  multiline
                  rows={3}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
                size="medium"
                sx={{ minWidth: 100 }}
              >
                Cancel
              </Button>

              <Button
                sx={{
                  fontWeight: "bold",
                  bgcolor: "#0F172A",
                  "&:hover": { bgcolor: "#1e293b" },
                }}
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? "Dispatching…" : "Create Dispatch"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
