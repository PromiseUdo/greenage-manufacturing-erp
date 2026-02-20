// // src/app/dashboard/sales/orders/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  People as PeopleIcon,
} from "@mui/icons-material";

import {
  Search,
  Add,
  MoreVert,
  Visibility,
  Description,
  Receipt,
  QrCode2,
} from "@mui/icons-material";

// --- Replicated Styled Components ---
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    padding: "8px 16px",
    borderBottom: "none",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: "14px 16px",
    borderBottom: `1px solid ${theme.palette.divider}`,
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
  cursor: "pointer",
}));

interface Order {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; phone: string };
  lineItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    storeItem: {
      id: string;
      name: string;
      itemNumber: string;
      category: string;
    } | null;
    product: {
      id: string;
      name: string;
      productNumber: string;
      productCode: string;
    } | null;
  }[];
  status: string;
  priority: string;
  paymentStatus: string;
  generatedUnitIds: string[] | null;
  quote: { id: string; quoteNumber: string } | null;
  invoice: { id: string; invoiceNumber: string; status: string } | null;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING_PLANNING: { bg: "#f3f4f6", text: "#6b7280" },
  IN_PRODUCTION: { bg: "#dbeafe", text: "#1e40af" },
  QC_TESTING: { bg: "#fef3c7", text: "#92400e" },
  PACKAGING: { bg: "#e0e7ff", text: "#4338ca" },
  READY_FOR_DISPATCH: { bg: "#d1fae5", text: "#065f46" },
  DISPATCHED: { bg: "#e0e7ff", text: "#4338ca" },
  DELIVERED: { bg: "#dcfce7", text: "#166534" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#f3f4f6", text: "#6b7280" },
  NORMAL: { bg: "#dbeafe", text: "#1e40af" },
  HIGH: { bg: "#fef3c7", text: "#92400e" },
  URGENT: { bg: "#fee2e2", text: "#991b1b" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    order: Order,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Orders
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Manage production orders and tracking
          </Typography>
        </Box>
        {/* <Button
          variant="contained"
          // startIcon={<Add />}
          onClick={() => router.push('/sales/orders/new')}
          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Create Order
        </Button> */}
      </Box>

      {/* Filters Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search orders, customers..."
            value={search}
            onChange={handleSearchChange}
            sx={{ maxWidth: 400, flexGrow: 1 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(statusColors).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table Container */}

      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading orders...
          </Typography>
        </Paper>
      ) : orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "grey.100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <Receipt sx={{ fontSize: 28, color: "action.active" }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              No Orders yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Orders will appear here once a customer pays an invoice.{" "}
            </Typography>
            {/* <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#1e293b" },
              }}
              startIcon={<AddIcon />}
              onClick={() => router.push("/sales/orders/new")}
            >
              Add Order
            </Button> */}
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Order #</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Product</StyledTableCell>
                  <StyledTableCell>Qty & Units</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Priority</StyledTableCell>
                  <StyledTableCell>Links</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <StyledTableRow
                    key={order.id}
                    onClick={() => router.push(`/sales/orders/${order.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#0F172A" }}
                      >
                        {order.orderNumber}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {order.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer.phone}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {order.lineItems?.[0]?.storeItem?.name ||
                            order.lineItems?.[0]?.product?.name ||
                            "N/A"}
                          {order.lineItems?.length > 1 && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              {" "}
                              +{order.lineItems.length - 1} more
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.lineItems?.[0]?.storeItem?.itemNumber ||
                            order.lineItems?.[0]?.product?.productNumber ||
                            ""}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {order.lineItems?.reduce(
                            (sum: number, li: any) => sum + li.quantity,
                            0,
                          ) || 0}
                        </Typography>
                        {order.generatedUnitIds && (
                          <Tooltip
                            title={`${order.generatedUnitIds.length} Unit IDs generated`}
                          >
                            <Chip
                              icon={<QrCode2 style={{ fontSize: 14 }} />}
                              label={order.generatedUnitIds.length}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                bgcolor: "#f1f5f9",
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={order.status.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          bgcolor: statusColors[order.status]?.bg || "#f3f4f6",
                          color: statusColors[order.status]?.text || "#6b7280",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={order.priority}
                        size="small"
                        sx={{
                          bgcolor:
                            priorityColors[order.priority]?.bg || "#f3f4f6",
                          color:
                            priorityColors[order.priority]?.text || "#6b7280",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {order.quote && (
                          <Tooltip title={`Quote: ${order.quote.quoteNumber}`}>
                            <IconButton
                              size="small"
                              sx={{ bgcolor: "#eff6ff", color: "#1d4ed8" }}
                            >
                              <Description sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.invoice && (
                          <Tooltip
                            title={`Invoice: ${order.invoice.invoiceNumber}`}
                          >
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/sales/invoices/${order.invoice!.id}`,
                                );
                              }}
                              size="small"
                              sx={{ bgcolor: "#ecfdf5", color: "#059669" }}
                            >
                              <Receipt sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        {formatDate(order.createdAt)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              backgroundColor: "#F8FAFC",
            }}
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 160,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/sales/orders/${selectedOrder?.id}`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="View Details"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}
