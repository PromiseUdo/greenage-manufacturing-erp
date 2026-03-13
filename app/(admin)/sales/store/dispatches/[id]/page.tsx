// app/(admin)/sales/store/dispatches/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface DispatchItem {
  storeItemId: string;
  itemNumber: string;
  name: string;
  unit: string;
  quantity: number;
  notes?: string;
}

interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  finalAmount: number;
  status: string;
  paymentStatus: string;
}

interface StoreDispatchDetail {
  id: string;
  dispatchNumber: string;
  dispatchDate: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    address: string;
    contactPerson?: string;
  };
  invoiceId?: string;
  invoice?: InvoiceInfo | null;
  items: DispatchItem[];
  dispatchedBy: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  status: string;
}

const DELIVERY_COLORS: Record<string, { bg: string; color: string }> = {
  Pickup: { bg: "#fff3e0", color: "#ef6c00" },
  Delivery: { bg: "#e8f5e9", color: "#2e7d32" },
  Courier: { bg: "#e3f2fd", color: "#1565c0" },
  "Third-Party Logistics": { bg: "#f3e5f5", color: "#7b1fa2" },
  Other: { bg: "#f5f5f5", color: "#616161" },
};

export default function StoreDispatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [dispatch, setDispatch] = useState<StoreDispatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDispatch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/store/dispatches/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch dispatch");
        }
        const data = await res.json();
        setDispatch(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDispatch();
  }, [resolvedParams.id]);

  const handleMarkDelivered = async () => {
    try {
      const res = await fetch(`/api/store/dispatches/${resolvedParams.id}/deliver`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as delivered");
      }
      
      // refresh dispatch data
      const fetchDispatch = async () => {
        setLoading(true);
        const refetch = await fetch(`/api/store/dispatches/${resolvedParams.id}`);
        const data = await refetch.json();
        setDispatch(data);
        setLoading(false);
      };
      fetchDispatch();
    } catch (err: any) {
      alert(err.message || "Failed to mark as delivered");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dispatch) {
    return (
      <Box>
        <Alert severity="error">{error || "Dispatch not found"}</Alert>
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

  const totalQuantity = (dispatch.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/sales/store/dispatches")}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          Back to Dispatches
        </Button>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" fontWeight={600}>
                {dispatch.dispatchNumber}
              </Typography>
              <Chip
                label={dispatch.status}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor:
                    dispatch.status === "DELIVERED"
                      ? "#dcfce7"
                      : dispatch.status === "REQUESTED"
                        ? "#fef08a"
                        : "#e3f2fd",
                  color:
                    dispatch.status === "DELIVERED"
                      ? "#16a34a"
                      : dispatch.status === "REQUESTED"
                        ? "#854d0e"
                        : "#1565c0",
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {format(
                new Date(dispatch.dispatchDate),
                "MMMM dd, yyyy - hh:mm a",
              )}
            </Typography>
          </Box>
          
          <Box>
            {["PENDING", "IN_TRANSIT", "DISPATCHED"].includes(dispatch.status) && (
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={handleMarkDelivered}
                sx={{
                  bgcolor: "#10B981",
                  "&:hover": { bgcolor: "#059669" },
                  fontWeight: 600
                }}
              >
                Mark as Delivered
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Customer Information */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 2,
              }}
            >
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Customer Name
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.primary", fontSize: 15 }}
                  fontWeight={400}
                >
                  {dispatch.customer.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.primary", fontSize: 15 }}
                  fontWeight={400}
                >
                  {dispatch.customer.phone}
                </Typography>
              </Grid>
              {dispatch.customer.contactPerson && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Person
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "text.primary", fontSize: 15 }}
                    fontWeight={400}
                  >
                    {dispatch.customer.contactPerson}
                  </Typography>
                </Grid>
              )}
              {dispatch.customer.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "text.primary", fontSize: 15 }}
                    fontWeight={400}
                  >
                    {dispatch.customer.email}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.primary", fontSize: 15 }}
                  fontWeight={400}
                >
                  {dispatch.customer.address}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Items Dispatched */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#0F172A",
                  fontSize: 18,
                  mb: 0.5,
                }}
              >
                Items Dispatched
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dispatch.items?.length || 0} item(s) • Total quantity:{" "}
                {totalQuantity}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Item #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Name
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontSize: 13 }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Notes
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dispatch.items || []).map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Chip
                          label={item.itemNumber}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: "#dc2626" }}
                        >
                          -{item.quantity} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.notes || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Notes */}
          {dispatch.notes && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                p: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#0F172A",
                  fontSize: 18,
                  mb: 2,
                }}
              >
                Notes
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {dispatch.notes}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Summary */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                fontSize: 18,
                mb: 2,
              }}
            >
              Summary
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Linked Invoice */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Linked Invoice
                </Typography>
                {dispatch.invoice ? (
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={dispatch.invoice.invoiceNumber}
                      size="small"
                      sx={{
                        bgcolor: "#e8f5e9",
                        color: "#2e7d32",
                        fontWeight: 500,
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      ₦{dispatch.invoice.finalAmount?.toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No invoice linked
                  </Typography>
                )}
              </Box>

              {/* Delivery Method */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Delivery Method
                </Typography>
                {dispatch.deliveryMethod ? (
                  <Chip
                    label={dispatch.deliveryMethod}
                    size="small"
                    sx={{
                      mt: 0.5,
                      fontWeight: 500,
                      bgcolor:
                        DELIVERY_COLORS[dispatch.deliveryMethod]?.bg ||
                        "#f5f5f5",
                      color:
                        DELIVERY_COLORS[dispatch.deliveryMethod]?.color ||
                        "#616161",
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Box>

              {/* Delivery Address */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Delivery Address
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{ fontSize: 15 }}
                >
                  {dispatch.deliveryAddress || "—"}
                </Typography>
              </Box>

              {/* Dispatched By */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Dispatched By
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{ fontSize: 15 }}
                >
                  {dispatch.dispatchedBy}
                </Typography>
              </Box>

              {/* Total Items */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{ fontSize: 15 }}
                >
                  {dispatch.items?.length || 0} item(s)
                </Typography>
              </Box>

              {/* Total Quantity */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: "#dc2626", fontSize: 15 }}
                >
                  -{totalQuantity}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
