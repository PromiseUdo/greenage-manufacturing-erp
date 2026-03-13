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
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ReturnFormProps {
  customers: { id: string; name: string; phone: string }[];
  products: { id: string; name: string; productNumber: string; productCode: string }[];
  orders: { id: string; orderNumber: string }[];
}

export default function ReturnForm({ customers, products, orders }: ReturnFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    orderId: "",
    unitId: "",
    serialNumber: "",
    quantity: 1,
    issueReported: "",
    condition: "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.customerId || !formData.productId || !formData.issueReported) {
      setError("Please fill in all required fields (Customer, Product, Issue Reported).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create return");
      }

      const newReturn = await res.json();
      router.push(`/returns/${newReturn.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/returns')}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800}>
          Log New Return
        </Typography>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171" }}>
          {error}
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #E5E7EB" }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Customer Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Customer Information *
              </Typography>
              <TextField
                select
                fullWidth
                label="Select Customer"
                value={formData.customerId}
                onChange={(e) => handleChange("customerId", e.target.value)}
                required
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Product Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Product Details *
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                select
                fullWidth
                label="Select Product"
                value={formData.productId}
                onChange={(e) => handleChange("productId", e.target.value)}
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
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit ID (Optional)"
                placeholder="e.g. INV50001"
                value={formData.unitId}
                onChange={(e) => handleChange("unitId", e.target.value)}
                helperText="8-character physical device ID"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Serial Number (Optional)"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                helperText="Manufacturer serial if different from Unit ID"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Original Order (Optional)"
                value={formData.orderId}
                onChange={(e) => handleChange("orderId", e.target.value)}
                helperText="Link back to the original sales order if known"
              >
                <MenuItem value=""><em>None Selected</em></MenuItem>
                {orders.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.orderNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Issue Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Return Reason *
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Reported Issue / Problem Description"
                multiline
                rows={3}
                value={formData.issueReported}
                onChange={(e) => handleChange("issueReported", e.target.value)}
                required
                placeholder="Describe what the customer says is wrong with the product..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Condition on Arrival"
                value={formData.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                placeholder="e.g. Scratched casing, smells burnt, etc."
              />
            </Grid>
            
            <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/returns')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1e293b" } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Log Return"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
