// components/store/store-receipt-form.tsx

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
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { StoreReceiptFormData } from "@/types/store";

interface StoreItemOption {
  id: string;
  name: string;
  itemNumber: string;
  unit: string;
}

interface StoreReceiptFormProps {
  onSubmit: (data: StoreReceiptFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SOURCES = [
  "Production",
  "Transfer",
  "Return",
  // "Quality Cleared",
  "Other",
];

export default function StoreReceiptForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: StoreReceiptFormProps) {
  const [storeItems, setStoreItems] = useState<StoreItemOption[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreReceiptFormData>({
    defaultValues: {
      source: "",
      referenceNumber: "",
      items: [
        {
          storeItemId: "",
          quantity: 0,
          batchNumber: "",
          notes: "",
        },
      ],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

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
          })) || [],
        );
      } catch (error) {
        console.error("Error fetching store items:", error);
      }
    };

    fetchStoreItems();
  }, []);

  const addItem = () => {
    append({
      storeItemId: "",
      quantity: 0,
      batchNumber: "",
      notes: "",
    });
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* Source */}
          <Grid item xs={12} md={6}>
            <Controller
              name="source"
              control={control}
              rules={{ required: "Source is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Source"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.source}
                  helperText={
                    errors.source?.message || "Where the items are coming from"
                  }
                  size="small"
                  disabled={isLoading}
                >
                  {SOURCES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Reference Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reference Number"
                  variant="standard"
                  fullWidth
                  disabled={isLoading}
                  helperText="Production order / batch reference (optional)"
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
                Items Received
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
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Store Item"
                                variant="standard"
                                required
                                error={!!errors.items?.[index]?.storeItemId}
                                helperText={
                                  errors.items?.[index]?.storeItemId?.message
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

                  {/* Batch Number */}
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.batchNumber`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Batch Number"
                          variant="standard"
                          fullWidth
                          disabled={isLoading}
                          helperText="Optional"
                        />
                      )}
                    />
                  </Grid>

                  {/* Item Notes */}
                  <Grid item xs={12}>
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
                {isLoading ? "Creating…" : "Create Receipt"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
