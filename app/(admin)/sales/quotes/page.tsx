// // src/app/dashboard/sales/quotes/page.tsx

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Search,
  Add,
  MoreVert,
  Visibility,
  Edit,
  Description,
  Receipt,
  Delete,
} from "@mui/icons-material";

// --- Replicated Styled Components from Products Table ---
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

interface Quote {
  id: string;
  quoteNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  lineItems: {
    id: string;
    storeItem: {
      id: string;
      name: string;
      itemNumber: string;
      category: string;
    } | null;
    quantity: number;
    unitPrice: number;
    backorderStatus: string;
    quantityBackordered?: number | null;
  }[];
  finalAmount: number;
  status: string;
  isAccepted: boolean;
  order: { id: string; orderNumber: string } | null;
  invoice: { id: string; invoiceNumber: string } | null;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#6b7280" },
  SENT: { bg: "#dbeafe", text: "#1e40af" },
  ACCEPTED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  EXPIRED: { bg: "#fef3c7", text: "#92400e" },
  CONVERTED: { bg: "#e0e7ff", text: "#4338ca" },
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/quotes?${params}`);
      const data = await res.json();
      if (res.ok) {
        setQuotes(data.quotes);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    quote: Quote,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotes/${selectedQuote?.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuotes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete quote");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
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
              Quotes Management
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: 14 }}
            >
              Track customer estimates and conversion status
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => router.push("/sales/quotes/new")}
            sx={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Create Quote
          </Button>
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
          }}
        >
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search quotes, customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
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
              sx={{ minWidth: 160 }}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(statusColors).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Table Container */}
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
                  <StyledTableCell>Quote #</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Product Details</StyledTableCell>
                  <StyledTableCell>Qty</StyledTableCell>
                  <StyledTableCell>Total Amount</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Related</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        No quotes found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <StyledTableRow
                      key={quote.id}
                      onClick={() => router.push(`/sales/quotes/${quote.id}`)}
                    >
                      <StyledTableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ color: "#0F172A" }}
                          >
                            {quote.quoteNumber}
                          </Typography>
                          {quote.lineItems?.some(
                            (li) => (li.quantityBackordered || 0) > 0,
                          ) && (
                            <Chip
                              label={`${quote.lineItems.reduce((sum, li) => sum + (li.quantityBackordered || 0), 0)} on Backorder`}
                              size="small"
                              sx={{
                                bgcolor: "#fef3c7",
                                color: "#92400e",
                                fontWeight: 600,
                                fontSize: 10,
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {quote.customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {quote.customer.phone}
                          </Typography>
                        </Box>
                      </StyledTableCell>

                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {quote.lineItems?.length > 0
                              ? quote.lineItems[0].storeItem?.name || "Item"
                              : "No items"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {quote.lineItems?.length > 1
                              ? `+${quote.lineItems.length - 1} more item${quote.lineItems.length > 2 ? "s" : ""}`
                              : quote.lineItems?.[0]?.storeItem?.itemNumber ||
                                ""}
                          </Typography>
                        </Box>
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {quote.lineItems?.reduce(
                            (sum: number, li: any) => sum + li.quantity,
                            0,
                          ) || 0}
                        </Typography>
                        {quote.lineItems?.some(
                          (li) => (li.quantityBackordered || 0) > 0,
                        ) && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            fontWeight={600}
                            display="block"
                          >
                            {quote.lineItems.reduce(
                              (sum, li) => sum + (li.quantityBackordered || 0),
                              0,
                            )}{" "}
                            Backordered
                          </Typography>
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(quote.finalAmount)}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell>
                        <Chip
                          label={quote.status}
                          size="small"
                          sx={{
                            bgcolor:
                              statusColors[quote.status]?.bg || "#f3f4f6",
                            color:
                              statusColors[quote.status]?.text || "#6b7280",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </StyledTableCell>

                      <StyledTableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {quote.order && (
                            <Tooltip
                              title={`Order: ${quote.order.orderNumber}`}
                            >
                              <IconButton
                                size="small"
                                sx={{ bgcolor: "#f1f5f9" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/sales/orders/${quote.order?.id}`,
                                  );
                                }}
                              >
                                <Description sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {quote.invoice && (
                            <Tooltip
                              title={`Invoice: ${quote.invoice.invoiceNumber}`}
                            >
                              <IconButton
                                size="small"
                                sx={{ bgcolor: "#f1f5f9" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/sales/invoices/${quote.invoice?.id}`,
                                  );
                                }}
                              >
                                <Receipt sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </StyledTableCell>

                      <StyledTableCell
                        align="right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, quote)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
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
              router.push(`/sales/quotes/${selectedQuote?.id}`);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="View Quote"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </MenuItem>
          {!selectedQuote?.isAccepted && (
            <MenuItem
              onClick={() => {
                router.push(`/sales/quotes/${selectedQuote?.id}/edit`);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Edit Quote"
                primaryTypographyProps={{ variant: "body2" }}
              />
            </MenuItem>
          )}
          <MenuItem
            sx={{
              "&:hover": {
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
              },
              "&:hover .MuiListItemIcon-root": {
                color: "#DC2626",
              },
            }}
            onClick={handleDelete}
            disabled={actionLoading}
          >
            <ListItemIcon>
              <Delete
                fontSize="small"
                sx={{
                  "&:hover": {
                    color: "#DC2626",
                  },
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Delete Quote"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </MenuItem>
        </Menu>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Sales quote? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
