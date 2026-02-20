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
  Chip,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { Search, WarningAmber, ArrowBack } from "@mui/icons-material";

// --- Styled Components ---
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

interface Backorder {
  id: string;
  quantity: number;
  quantityAllocated: number | null;
  quantityBackordered: number | null;
  backorderStatus: string;
  backorderCreatedAt: string | null;
  quote: {
    id: string;
    quoteNumber: string;
    customer: { id: string; name: string; phone: string };
    createdBy: { id: string; name: string };
  };
  storeItem: {
    id: string;
    name: string;
    itemNumber: string;
    quantity: number;
  } | null;
  productionRequests: {
    id: string;
    requestNumber: string;
    status: string;
    quantityNeeded: number;
    dateRaised: string;
  }[];
}

const backorderStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E" },
  IN_PRODUCTION: { bg: "#DBEAFE", text: "#1E40AF" },
  FULFILLED: { bg: "#DCFCE7", text: "#166534" },
};

const prStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F3F4F6", text: "#6B7280" },
  ACKNOWLEDGED: { bg: "#FEF3C7", text: "#92400E" },
  SCHEDULED: { bg: "#DBEAFE", text: "#1E40AF" },
  COMPLETED: { bg: "#DCFCE7", text: "#166534" },
};

export default function BackordersPage() {
  const router = useRouter();
  const [backorders, setBackorders] = useState<Backorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchBackorders();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchBackorders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/sales/backorders?${params}`);
      const data = await res.json();
      if (res.ok) {
        setBackorders(data.backorders);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching backorders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 1, textTransform: "none", color: "text.secondary", p: 0 }}
        >
          Back
        </Button>
        <Typography variant="h6" fontWeight={600}>
          Backorder Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: 14 }}
        >
          All unresolved demand gaps — quotes with items on backorder
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "#FDBA74",
            bgcolor: "#FFF7ED",
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography variant="caption" color="#9A3412" fontWeight={600}>
            Pending
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#EA580C">
            {backorders.filter((b) => b.backorderStatus === "PENDING").length}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "#93C5FD",
            bgcolor: "#EFF6FF",
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography variant="caption" color="#1E40AF" fontWeight={600}>
            In Production
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#2563EB">
            {
              backorders.filter((b) => b.backorderStatus === "IN_PRODUCTION")
                .length
            }
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Total Backordered Units
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#0F172A">
            {backorders.reduce(
              (sum, b) => sum + (b.quantityBackordered || 0),
              0,
            )}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
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
            placeholder="Search by quote, customer, item..."
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
            label="Backorder Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PRODUCTION">In Production</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
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
                <StyledTableCell>Item</StyledTableCell>
                <StyledTableCell>Qty Requested</StyledTableCell>
                <StyledTableCell>Qty Allocated</StyledTableCell>
                <StyledTableCell>Qty Backordered</StyledTableCell>
                <StyledTableCell>Backorder Status</StyledTableCell>
                <StyledTableCell>Production Request</StyledTableCell>
                <StyledTableCell>Date</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : backorders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <WarningAmber
                      sx={{ fontSize: 48, color: "#D1D5DB", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No active backorders
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All demand is currently fulfilled
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                backorders.map((bo) => (
                  <StyledTableRow
                    key={bo.id}
                    onClick={() => router.push(`/sales/quotes/${bo.quote.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#0F172A" }}
                      >
                        {bo.quote.quoteNumber}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {bo.quote.customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bo.quote.customer.phone}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {bo.storeItem?.name || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bo.storeItem?.itemNumber || ""}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {bo.quantity}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color="success.main"
                      >
                        {bo.quantityAllocated ?? "—"}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="error.main"
                      >
                        {bo.quantityBackordered ?? "—"}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={bo.backorderStatus.replace("_", " ")}
                        size="small"
                        sx={{
                          bgcolor:
                            backorderStatusColors[bo.backorderStatus]?.bg ||
                            "#F3F4F6",
                          color:
                            backorderStatusColors[bo.backorderStatus]?.text ||
                            "#6B7280",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      {bo.productionRequests.length > 0 ? (
                        bo.productionRequests.map((pr) => (
                          <Box key={pr.id} sx={{ mb: 0.5 }}>
                            <Chip
                              label={`${pr.requestNumber} — ${pr.status}`}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/production/requests/${pr.id}`);
                              }}
                              sx={{
                                bgcolor:
                                  prStatusColors[pr.status]?.bg || "#F3F4F6",
                                color:
                                  prStatusColors[pr.status]?.text || "#6B7280",
                                fontWeight: 500,
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="caption" color="text.secondary">
                        {bo.backorderCreatedAt
                          ? formatDate(bo.backorderCreatedAt)
                          : "—"}
                      </Typography>
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
    </Box>
  );
}
