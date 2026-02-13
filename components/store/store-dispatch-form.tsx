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
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { StoreDispatchFormData } from "@/types/store";

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

interface StoreDispatchFormProps {
  onSubmit: (data: StoreDispatchFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
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
}: StoreDispatchFormProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItemOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoreDispatchFormData>({
    defaultValues: {
      customerId: "",
      invoiceId: "",
      items: [
        {
          storeItemId: "",
          quantity: 0,
          notes: "",
        },
      ],
      deliveryMethod: "",
      deliveryAddress: "",
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

  // Fetch PAID invoices for selected customer
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerId) {
        setInvoices([]);
        return;
      }

      try {
        const res = await fetch(`/api/invoices?limit=1000&status=PAID`);
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

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
                        helperText={errors.customerId?.message}
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* Invoice (optional, filtered to PAID for selected customer) */}
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
                      `${option.invoiceNumber} — ₦${option.finalAmount?.toLocaleString()}`
                    }
                    onChange={(_, value) => field.onChange(value?.id || "")}
                    disabled={isLoading || !selectedCustomerId}
                    noOptionsText={
                      selectedCustomerId
                        ? "No paid invoices for this customer"
                        : "Select a customer first"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Linked Invoice (PAID only)"
                        variant="standard"
                        helperText={
                          selectedCustomerId
                            ? "Optional — link to a paid invoice"
                            : "Select a customer first"
                        }
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* Delivery Method */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* Delivery Address */}
          <Grid item xs={12} md={6}>
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
                />
              )}
            />
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
                                error={!!errors.items?.[index]?.storeItemId}
                                helperText={
                                  errors.items?.[index]?.storeItemId?.message ||
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
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity"
                          variant="standard"
                          type="number"
                          fullWidth
                          required
                          disabled={isLoading}
                          error={!!errors.items?.[index]?.quantity}
                          helperText={errors.items?.[index]?.quantity?.message}
                          inputProps={{ min: 1, step: 1 }}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      )}
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
