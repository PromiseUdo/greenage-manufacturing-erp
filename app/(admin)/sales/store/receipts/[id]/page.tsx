// app/(admin)/sales/store/receipts/[id]/page.tsx

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
  AttachFile as AttachFileIcon,
  Description as FileIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface ReceiptItem {
  storeItemId: string;
  itemNumber: string;
  name: string;
  unit: string;
  quantity: number;
  batchNumber?: string;
  notes?: string;
}

interface StoreReceiptDetail {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  source: string;
  referenceNumber?: string;
  items: ReceiptItem[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  Production: { bg: "#e8f5e9", color: "#2e7d32" },
  Transfer: { bg: "#e3f2fd", color: "#1565c0" },
  Return: { bg: "#fff3e0", color: "#ef6c00" },
  // "Quality Cleared": { bg: "#f3e5f5", color: "#7b1fa2" },
  Other: { bg: "#f5f5f5", color: "#616161" },
};

export default function StoreReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<StoreReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/store/receipts/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch store receipt");
        }
        const data = await res.json();
        setReceipt(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [resolvedParams.id]);

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

  if (error || !receipt) {
    return (
      <Box>
        <Alert severity="error">{error || "Store receipt not found"}</Alert>
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

  const totalQuantity = (receipt.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push("/sales/store/receipts")}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          Back to Store Receipts
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
                {receipt.receiptNumber}
              </Typography>
              <Chip
                label={receipt.source}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: SOURCE_COLORS[receipt.source]?.bg || "#f5f5f5",
                  color: SOURCE_COLORS[receipt.source]?.color || "#616161",
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {format(
                new Date(receipt.receivedDate),
                "MMMM dd, yyyy - hh:mm a",
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Items Received */}
        <Grid item xs={12} md={8}>
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
              // elevation={0}
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
                Items Received
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {receipt.items?.length || 0} item(s) • Total quantity:{" "}
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
                      Batch
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      Notes
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(receipt.items || []).map((item, idx) => (
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
                          sx={{ color: "#16a34a" }}
                        >
                          +{item.quantity} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.batchNumber ? (
                          <Chip
                            label={item.batchNumber}
                            size="small"
                            sx={{
                              bgcolor: "#fef3c7",
                              color: "#f59e0b",
                              fontWeight: 500,
                              fontSize: 11,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
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

          {/* Attachments */}
          {receipt.attachments && receipt.attachments.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
                overflow: "hidden",
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
                  }}
                >
                  Supporting Documents
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {receipt.attachments.map((file, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          "&:hover": { bgcolor: "#f8fafc" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: "#eff6ff",
                            color: "#3b82f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FileIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            noWrap
                            title={file.name}
                          >
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024).toFixed(1)} KB •{" "}
                            {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<AttachFileIcon />}
                          sx={{ minWidth: "auto" }}
                        >
                          View
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Notes */}
          {receipt.notes && (
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
                {receipt.notes}
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
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Source
                </Typography>
                <Chip
                  label={receipt.source}
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontWeight: 500,
                    bgcolor: SOURCE_COLORS[receipt.source]?.bg || "#f5f5f5",
                    color: SOURCE_COLORS[receipt.source]?.color || "#616161",
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Reference Number
                </Typography>
                {receipt.referenceNumber ? (
                  <Chip
                    label={receipt.referenceNumber}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Received By
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{ fontSize: 15 }}
                >
                  {receipt.receivedBy}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={400}
                  sx={{ fontSize: 15 }}
                >
                  {receipt.items?.length || 0} item(s)
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: "#16a34a", fontSize: 15 }}
                >
                  +{totalQuantity}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
