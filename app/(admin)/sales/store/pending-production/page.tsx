"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import FactoryIcon from "@mui/icons-material/Factory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import InventoryIcon from "@mui/icons-material/Inventory";

interface PendingOrder {
  id: string;
  orderNumber: string;
  quantity: number;
  quantityPackaged: number | null;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualEnd: string | null;
  product: {
    id: string;
    name: string;
    productNumber: string;
    category: string;
  };
  manager: {
    id: string;
    name: string;
  };
  updatedAt: string;
}

export default function PendingProductionPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<PendingOrder | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/pending-production");
      const data = await res.json();
      setOrders(data.pendingOrders || []);
    } catch (error) {
      console.error("Error fetching pending production:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReceive = async (order: PendingOrder) => {
    setReceiving(order.id);
    setSuccessMessage("");
    try {
      const res = await fetch("/api/store/pending-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionOrderId: order.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to receive");
      }

      setSuccessMessage(
        `Successfully received ${order.quantityPackaged ?? order.quantity} units of ${order.product.name} from ${order.orderNumber} into store.`,
      );
      await fetchPending();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReceiving(null);
      setConfirmDialog(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Pending from Production
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed production orders awaiting receipt into store inventory
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchPending}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* KPI Card */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 2,
            "&:last-child": { pb: 2 },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FEF3C7",
              color: "#D97706",
            }}
          >
            <FactoryIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#D97706">
              {loading ? <Skeleton width={30} /> : orders.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Orders awaiting store receipt
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Quantity
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Completed</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Manager</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <InventoryIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No pending production items to receive
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed production orders will appear here automatically
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {order.product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.product.productNumber}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${order.quantityPackaged ?? order.quantity} units`}
                      size="small"
                      sx={{
                        bgcolor: "#DCFCE7",
                        color: "#166534",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.product.category.replace(/_/g, " ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.actualEnd || order.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.manager.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        receiving === order.id ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <CheckCircleIcon />
                        )
                      }
                      onClick={() => setConfirmDialog(order)}
                      disabled={!!receiving}
                      sx={{
                        bgcolor: "#16A34A",
                        "&:hover": { bgcolor: "#15803D" },
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Receive into Store
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Confirm Store Receipt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Receive{" "}
            <strong>
              {confirmDialog?.quantityPackaged ?? confirmDialog?.quantity} units
            </strong>{" "}
            of <strong>{confirmDialog?.product.name}</strong> from production
            order <strong>{confirmDialog?.orderNumber}</strong> into the store?
            <br />
            <br />
            This will update the store stock automatically.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmDialog && handleReceive(confirmDialog)}
            variant="contained"
            disabled={!!receiving}
            startIcon={
              receiving ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              bgcolor: "#16A34A",
              "&:hover": { bgcolor: "#15803D" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {receiving ? "Receiving..." : "Confirm Receipt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
