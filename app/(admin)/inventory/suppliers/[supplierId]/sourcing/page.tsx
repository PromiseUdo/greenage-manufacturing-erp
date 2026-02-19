"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  styled,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ShoppingCart as SourcingIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    transition: "background-color 0.2s ease",
  },
  "&:last-child td": {
    borderBottom: 0,
  },
}));

const statusConfig: Record<
  string,
  {
    label: string;
    color:
      | "default"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "error"
      | "info";
  }
> = {
  DRAFT: { label: "Draft", color: "default" },
  INVOICED: { label: "Invoiced", color: "info" },
  PAYMENT_TRACKING: { label: "Payment", color: "warning" },
  SHIPMENT_TRACKING: { label: "Shipment", color: "secondary" },
  RECEIVING: { label: "Receiving", color: "primary" },
  COMPLETED: { label: "Completed", color: "success" },
  CANCELLED: { label: "Cancelled", color: "error" },
};

export default function SourcingListPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = use(params);
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [supplierName, setSupplierName] = useState("");

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        supplierId,
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/inventory/purchase-orders?${params}`);
      const data = await res.json();
      setPurchaseOrders(data.purchaseOrders || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  }, [supplierId, page, limit, search]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  useEffect(() => {
    // Fetch supplier name
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/inventory/suppliers/${supplierId}`);
        const data = await res.json();
        setSupplierName(data.name || "");
      } catch (error) {
        console.error("Error fetching supplier:", error);
      }
    };
    fetchSupplier();
  }, [supplierId]);

  const handleNewPO = () => {
    router.push(`/inventory/suppliers/${supplierId}/sourcing/new`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/inventory/suppliers/${supplierId}`)}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          Back to {supplierName || "Supplier"}
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Material Sourcing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Purchase orders for {supplierName || "this supplier"}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewPO}
            disableElevation
            sx={{
              bgcolor: "#0F172A",
              fontWeight: 600,
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            New Purchase Order
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by PO number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : purchaseOrders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <SourcingIcon
              sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No purchase orders yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start a new material sourcing process by creating a purchase
              order.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewPO}
              disableElevation
              sx={{
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#1E293B" },
              }}
            >
              Create First Purchase Order
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>PO Number</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell align="center">Items</StyledTableCell>
                    <StyledTableCell align="right">Total</StyledTableCell>
                    <StyledTableCell align="center">Status</StyledTableCell>
                    <StyledTableCell align="center">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((po) => {
                    const items = Array.isArray(po.items) ? po.items : [];
                    const config =
                      statusConfig[po.status] || statusConfig.DRAFT;
                    return (
                      <StyledTableRow key={po.id}>
                        <StyledTableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {po.poNumber}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Typography variant="body2">
                            {format(new Date(po.createdAt), "dd MMM yyyy")}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <Chip
                            label={items.length}
                            size="small"
                            sx={{
                              minWidth: 40,
                              bgcolor: "#e3f2fd",
                              color: "#1565c0",
                              fontWeight: 600,
                            }}
                          />
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ₦
                            {po.totalAmount?.toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <Chip
                            label={config.label}
                            size="small"
                            color={config.color}
                            variant="outlined"
                          />
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(
                                `/inventory/suppliers/${supplierId}/sourcing/${po.id}`,
                              )
                            }
                            sx={{
                              color: "#64748B",
                              "&:hover": {
                                backgroundColor: "#F1F5F9",
                                color: "#0F172A",
                              },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </StyledTableCell>
                      </StyledTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={total}
              rowsPerPage={limit}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
