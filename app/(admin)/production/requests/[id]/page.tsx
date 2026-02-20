"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack,
  PrecisionManufacturing,
  CheckCircle,
  Schedule,
  Inventory,
  Receipt,
} from "@mui/icons-material";

interface ProductionRequestDetail {
  id: string;
  requestNumber: string;
  quantityNeeded: number;
  status: string;
  dateRaised: string;
  dateCompleted: string | null;
  notes: string | null;
  storeItem: {
    id: string;
    name: string;
    itemNumber: string;
    category: string;
    quantity: number;
    unitPrice: number | null;
  };
  quote: {
    id: string;
    quoteNumber: string;
    quantity: number;
    quantityAllocated: number | null;
    quantityBackordered: number | null;
    backorderStatus: string;
    customer: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
  };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F3F4F6", text: "#6B7280" },
  ACKNOWLEDGED: { bg: "#FEF3C7", text: "#92400E" },
  SCHEDULED: { bg: "#DBEAFE", text: "#1E40AF" },
  COMPLETED: { bg: "#DCFCE7", text: "#166534" },
};

const statusTransitions: Record<string, string[]> = {
  PENDING: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["SCHEDULED"],
  SCHEDULED: ["COMPLETED"],
  COMPLETED: [],
};

export default function ProductionRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<ProductionRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRequest();
  }, [resolvedParams.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/production/requests/${resolvedParams.id}`);
      const data = await res.json();
      if (res.ok) {
        setRequest(data);
        setNotes(data.notes || "");
      } else {
        setError(data.error || "Failed to load production request");
      }
    } catch (err) {
      setError("Failed to load production request");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/production/requests/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setSuccess(
        newStatus === "COMPLETED"
          ? "Production completed! Stock has been restored and backorder fulfilled."
          : `Status updated to ${newStatus}`,
      );
      fetchRequest();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ py: 5, textAlign: "center" }}>
        <Typography color="error">{error || "Not found"}</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const nextStatuses = statusTransitions[request.status] || [];
  const isCompleted = request.status === "COMPLETED";

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push("/production/requests")}
          sx={{ mb: 1, textTransform: "none", color: "text.secondary", p: 0 }}
        >
          Back to Production Requests
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0F172A">
              {request.requestNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Production Request •{" "}
              {new Date(request.dateRaised).toLocaleDateString()}
            </Typography>
          </Box>
          <Chip
            label={request.status.replace("_", " ")}
            sx={{
              bgcolor: statusColors[request.status]?.bg || "#F3F4F6",
              color: statusColors[request.status]?.text || "#6B7280",
              fontWeight: 700,
              fontSize: 13,
              px: 1.5,
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Production Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              {/* <PrecisionManufacturing sx={{ color: "#0F172A" }} /> */}
              <Typography variant="h6" fontWeight={600}>
                Production Details
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "40%", border: 0 }}>
                    Quantity Needed
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Typography
                      fontWeight={700}
                      color="error.main"
                      variant="h6"
                    >
                      {request.quantityNeeded} units
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Date Raised
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {formatDate(request.dateRaised)}
                  </TableCell>
                </TableRow>
                {request.dateCompleted && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: 0 }}>
                      Date Completed
                    </TableCell>
                    <TableCell sx={{ border: 0 }}>
                      {formatDate(request.dateCompleted)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Store Item Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              {/* <Inventory sx={{ color: "#0F172A" }} /> */}
              <Typography variant="h6" fontWeight={600}>
                Store Item
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "40%", border: 0 }}>
                    Item Name
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.storeItem.name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Item Number
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.storeItem.itemNumber}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Category
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.storeItem.category.replace(/_/g, " ")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Current Stock
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Typography fontWeight={600}>
                      {request.storeItem.quantity} units
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Originating Quote */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              {/* <Receipt sx={{ color: "#0F172A" }} /> */}
              <Typography variant="h6" fontWeight={600}>
                Originating Quote
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "40%", border: 0 }}>
                    Quote Number
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Chip
                      label={request.quote.quoteNumber}
                      size="small"
                      onClick={() =>
                        router.push(`/sales/quotes/${request.quote.id}`)
                      }
                      sx={{ cursor: "pointer", fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.quote.customer.name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Contact
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.quote.customer.phone}
                    {request.quote.customer.email &&
                      ` • ${request.quote.customer.email}`}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Qty Requested
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.quote.quantity} units
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Qty Allocated
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {request.quote.quantityAllocated ?? "—"} units
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: 0 }}>
                    Backorder Status
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Chip
                      label={
                        request.quote.backorderStatus?.replace("_", " ") || "—"
                      }
                      size="small"
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Status Update Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              position: "sticky",
              top: 80,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Update Status
            </Typography>

            {/* Status Timeline */}
            <Box sx={{ mb: 3 }}>
              {["PENDING", "ACKNOWLEDGED", "SCHEDULED", "COMPLETED"].map(
                (step, index) => {
                  const isActive = request.status === step;
                  const isPast =
                    [
                      "PENDING",
                      "ACKNOWLEDGED",
                      "SCHEDULED",
                      "COMPLETED",
                    ].indexOf(request.status) > index;

                  return (
                    <Box
                      key={step}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isPast
                            ? "#DCFCE7"
                            : isActive
                              ? "#DBEAFE"
                              : "#F3F4F6",
                          border: "2px solid",
                          borderColor: isPast
                            ? "#166534"
                            : isActive
                              ? "#2563EB"
                              : "#D1D5DB",
                        }}
                      >
                        {isPast ? (
                          <CheckCircle
                            sx={{ fontSize: 16, color: "#166534" }}
                          />
                        ) : isActive ? (
                          <Schedule sx={{ fontSize: 16, color: "#2563EB" }} />
                        ) : (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "#D1D5DB",
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={isActive || isPast ? 600 : 400}
                        color={
                          isPast
                            ? "#166534"
                            : isActive
                              ? "#2563EB"
                              : "text.secondary"
                        }
                      >
                        {step.replace("_", " ")}
                      </Typography>
                    </Box>
                  );
                },
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCompleted}
              sx={{ mb: 2 }}
              size="small"
            />

            {/* Action Buttons */}
            {!isCompleted && nextStatuses.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {nextStatuses.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    variant={
                      nextStatus === "COMPLETED" ? "contained" : "outlined"
                    }
                    fullWidth
                    onClick={() => handleStatusUpdate(nextStatus)}
                    disabled={updating}
                    startIcon={
                      updating ? (
                        <CircularProgress size={16} />
                      ) : nextStatus === "COMPLETED" ? (
                        <CheckCircle />
                      ) : (
                        <Schedule />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      ...(nextStatus === "COMPLETED" && {
                        bgcolor: "#166534",
                        "&:hover": { bgcolor: "#14532D" },
                      }),
                    }}
                  >
                    {nextStatus === "COMPLETED"
                      ? "Mark as Completed"
                      : `Move to ${nextStatus.replace("_", " ")}`}
                  </Button>
                ))}
              </Box>
            )}

            {isCompleted && (
              <Alert
                severity="success"
                icon={<CheckCircle fontSize="inherit" />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Production completed
                </Typography>
                <Typography variant="caption">
                  Stock restored &bull; Backorder fulfilled
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
