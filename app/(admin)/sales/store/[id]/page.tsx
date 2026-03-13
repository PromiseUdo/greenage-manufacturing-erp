// app/(admin)/sales/store/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Edit as EditIcon, ArrowBack as BackIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { StoreItemWithRelations } from "@/types/store";
import { format } from "date-fns";
import StoreDispatchHistory from "./dispatch-history";

export default function StoreItemDetailsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [storeItem, setStoreItem] = useState<StoreItemWithRelations | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchStoreItem();
  }, [id]);

  const fetchStoreItem = async () => {
    try {
      const res = await fetch(`/api/store/${id}`);
      if (!res.ok) {
        throw new Error("Store item not found");
      }
      const data = await res.json();
      setStoreItem(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getConditionChip = (condition: string) => {
    const styles: Record<string, { bgcolor: string; color: string }> = {
      NEW: { bgcolor: "#e8f5e9", color: "#2e7d32" },
      REFURBISHED: { bgcolor: "#e3f2fd", color: "#1565c0" },
      RETURNED: { bgcolor: "#fff3e0", color: "#ed6c02" },
      DAMAGED: { bgcolor: "#ffebee", color: "#d32f2f" },
    };
    return styles[condition] || { bgcolor: "#f5f5f5", color: "#616161" };
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !storeItem) {
    return (
      <Box>
        <Alert severity="error">{error || "Store item not found"}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const conditionStyle = getConditionChip(storeItem.condition);
  const totalValue = storeItem.quantity * (storeItem.unitPrice || 0);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/sales/store")}
          sx={{ mb: 2 }}
        >
          Back to Store
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {storeItem.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip label={storeItem.itemNumber} size="small" />
              <Chip
                label={storeItem.category.replace(/_/g, " ")}
                size="small"
                sx={{
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                }}
              />
              <Chip
                label={storeItem.condition.replace(/_/g, " ")}
                size="small"
                sx={{
                  fontWeight: 500,
                  ...conditionStyle,
                }}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/sales/store/${storeItem.id}/edit`)}
          >
            Edit Item
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid
          item
          xs={12}
          lg={4}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {/* Basic Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 3,
              }}
            >
              Basic Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <InfoRow label="Item Number" value={storeItem.itemNumber} bold />
              <InfoRow label="Name" value={storeItem.name} />
              <InfoRow
                label="Product"
                value={storeItem.product?.name || "Not linked"}
                valueColor={
                  storeItem.product?.name ? "text.primary" : "text.secondary"
                }
              />
              <InfoRow
                label="Category"
                value={storeItem.category.replace(/_/g, " ")}
                chip
                chipColor="#1976d2"
                chipBgColor="#e3f2fd"
              />
              <InfoRow
                label="Condition"
                value={storeItem.condition.replace(/_/g, " ")}
                chip
                chipColor={conditionStyle.color}
                chipBgColor={conditionStyle.bgcolor}
              />
            </Box>
          </Paper>

          {/* Stock & Pricing */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 3,
              }}
            >
              Stock & Pricing
            </Typography>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Quantity"
                value={`${storeItem.quantity} ${storeItem.unit}`}
                highlight={storeItem.quantity === 0}
              />
              <InfoRow label="Unit" value={storeItem.unit} />
              <InfoRow
                label="Unit Price"
                value={
                  storeItem.unitPrice
                    ? formatCurrency(storeItem.unitPrice)
                    : "Not set"
                }
              />
              <InfoRow
                label="Total Value"
                value={formatCurrency(totalValue)}
                bold
              />
              <InfoRow
                label="Location"
                value={storeItem.location || "Not specified"}
                valueColor={
                  storeItem.location ? "text.primary" : "text.secondary"
                }
              />
            </Box>
          </Paper>

          {/* Additional Details */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 3,
              }}
            >
              Production Details
            </Typography>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Batch Number"
                value={storeItem.batchNumber || "Not specified"}
                valueColor={
                  storeItem.batchNumber ? "text.primary" : "text.secondary"
                }
              />
              <InfoRow
                label="Production Date"
                value={
                  storeItem.productionDate
                    ? format(new Date(storeItem.productionDate), "MMM dd, yyyy")
                    : "Not set"
                }
                valueColor={
                  storeItem.productionDate ? "text.primary" : "text.secondary"
                }
              />
              <InfoRow
                label="Warranty Expiry"
                value={
                  storeItem.warrantyExpiry
                    ? format(new Date(storeItem.warrantyExpiry), "MMM dd, yyyy")
                    : "Not set"
                }
                valueColor={
                  storeItem.warrantyExpiry ? "text.primary" : "text.secondary"
                }
              />
            </Box>
          </Paper>

          {/* Notes */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 3,
              }}
            >
              Notes
            </Typography>
            {storeItem.notes ? (
              <Typography
                variant="body2"
                sx={{ mt: 2, whiteSpace: "pre-wrap" }}
              >
                {storeItem.notes}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No notes recorded
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Dispatch History */}
        <Grid item xs={12} lg={8}>
          <StoreDispatchHistory storeItemId={storeItem.id} />
        </Grid>
      </Grid>
    </Box>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string;
  chipBgColor?: string;
  valueColor?: string;
}

function InfoRow({
  label,
  value,
  highlight,
  bold,
  chip,
  chipColor,
  chipBgColor,
  valueColor,
}: InfoRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {label}:
      </Typography>
      {chip ? (
        <Chip
          label={value}
          size="small"
          sx={{
            fontWeight: 500,
            color: chipColor || "inherit",
            backgroundColor: chipBgColor || "inherit",
          }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            fontWeight: bold || highlight ? 600 : 400,
            color: valueColor || (highlight ? "error.main" : "text.primary"),
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}
