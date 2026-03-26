"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  MenuItem,
  CircularProgress,
  IconButton,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface ReturnFormProps {
  customers: { id: string; name: string; phone: string }[];
  products: { id: string; name: string; productNumber: string; productCode: string }[];
  orders: { id: string; orderNumber: string }[];
}

interface UnitRow {
  id: number;
  productId: string;
  unitId: string;
  serialNumber: string;
  quantity: number;
  issueReported: string;
  condition: string;
}

let rowCounter = 1;

function makeRow(): UnitRow {
  return {
    id: rowCounter++,
    productId: "",
    unitId: "",
    serialNumber: "",
    quantity: 1,
    issueReported: "",
    condition: "",
  };
}

export default function ReturnForm({ customers, products, orders }: ReturnFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Common fields
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");

  // Unit rows
  const [rows, setRows] = useState<UnitRow[]>([makeRow()]);

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: number) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: number, field: keyof UnitRow, value: string | number) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.productId || !r.issueReported.trim()) {
        setError(
          `Unit ${i + 1}: Product and Issue Reported are required.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        rows.map((r) =>
          fetch("/api/returns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId,
              orderId: orderId || undefined,
              productId: r.productId,
              unitId: r.unitId || undefined,
              serialNumber: r.serialNumber || undefined,
              quantity: r.quantity,
              issueReported: r.issueReported,
              condition: r.condition || undefined,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Failed to create return");
            }
            return res.json();
          })
        )
      );

      // If only one unit, go straight to its detail page; otherwise go to list
      if (results.length === 1) {
        router.push(`/inventory/returns/${results[0].id}`);
      } else {
        router.push("/inventory/returns");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 860, mx: "auto" }}>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/inventory/returns")}
          sx={{ color: "text.secondary" }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800}>
          Log New Return
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Common fields ──────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Customer &amp; Order
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                select
                fullWidth
                label="Customer *"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                select
                fullWidth
                label="Original Order (optional)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {orders.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.orderNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* ── Unit rows ──────────────────────────────────────── */}
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Return Units
            </Typography>
            <Chip
              label={rows.length}
              size="small"
              sx={{ bgcolor: "#0F172A", color: "#fff", fontWeight: 700, height: 22, fontSize: "0.75rem" }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addRow}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Add Unit
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          {rows.map((row, idx) => (
            <Paper
              key={row.id}
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", position: "relative" }}
            >
              {/* Row header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  Unit {idx + 1}
                </Typography>
                {rows.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeRow(row.id)}
                    sx={{ color: "#DC2626", "&:hover": { bgcolor: "#FEE2E2" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2.5}>
                {/* Product */}
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    select
                    fullWidth
                    label="Product *"
                    value={row.productId}
                    onChange={(e) => updateRow(row.id, "productId", e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} ({p.productCode})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.id, "quantity", parseInt(e.target.value) || 1)
                    }
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                {/* IDs */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Unit ID (optional)"
                    placeholder="e.g. GRN50001"
                    value={row.unitId}
                    onChange={(e) => updateRow(row.id, "unitId", e.target.value)}
                    helperText="Physical unit identifier"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Serial Number (optional)"
                    value={row.serialNumber}
                    onChange={(e) => updateRow(row.id, "serialNumber", e.target.value)}
                    helperText="Manufacturer serial if different from Unit ID"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                {/* Issue */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Issue Reported *"
                    multiline
                    rows={2}
                    value={row.issueReported}
                    onChange={(e) => updateRow(row.id, "issueReported", e.target.value)}
                    required
                    placeholder="Describe what the customer says is wrong..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Condition on Arrival (optional)"
                    value={row.condition}
                    onChange={(e) => updateRow(row.id, "condition", e.target.value)}
                    placeholder="e.g. Scratched casing, smells burnt..."
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>

        {/* Add row shortcut at the bottom */}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          onClick={addRow}
          sx={{
            mb: 3,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            borderStyle: "dashed",
            color: "text.secondary",
            borderColor: "divider",
            "&:hover": { borderStyle: "dashed", bgcolor: "action.hover" },
          }}
        >
          Add another unit
        </Button>

        {/* Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/inventory/returns")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1e293b" }, minWidth: 140 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              `Log ${rows.length > 1 ? `${rows.length} Returns` : "Return"}`
            )}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
