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
import { Search, ArrowBack, PrecisionManufacturing } from "@mui/icons-material";

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

interface ProductionRequest {
  id: string;
  requestNumber: string;
  quantityNeeded: number;
  status: string;
  dateRaised: string;
  dateCompleted: string | null;
  storeItem: {
    id: string;
    name: string;
    itemNumber: string;
    category: string;
    quantity: number;
  };
  quote: {
    id: string;
    quoteNumber: string;
    quantity: number;
    customer: { id: string; name: string };
  };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F3F4F6", text: "#6B7280" },
  ACKNOWLEDGED: { bg: "#FEF3C7", text: "#92400E" },
  SCHEDULED: { bg: "#DBEAFE", text: "#1E40AF" },
  COMPLETED: { bg: "#DCFCE7", text: "#166534" },
};

export default function ProductionRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchRequests();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/production/requests?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching production requests:", error);
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
          Production Requests
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: 14 }}
        >
          Manage production requests generated from backorders
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {Object.entries(statusColors).map(([status, colors]) => (
          <Paper
            key={status}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: colors.bg,
              minWidth: 140,
              flex: 1,
            }}
          >
            <Typography variant="caption" color={colors.text} fontWeight={600}>
              {status.replace("_", " ")}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={colors.text}>
              {requests.filter((r) => r.status === status).length}
            </Typography>
          </Paper>
        ))}
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
            placeholder="Search by request #, item, quote..."
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
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="ACKNOWLEDGED">Acknowledged</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
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
                <StyledTableCell>Request #</StyledTableCell>
                <StyledTableCell>Item</StyledTableCell>
                <StyledTableCell>Qty Needed</StyledTableCell>
                <StyledTableCell>Current Stock</StyledTableCell>
                <StyledTableCell>Quote</StyledTableCell>
                <StyledTableCell>Customer</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Date Raised</StyledTableCell>
                <StyledTableCell>Date Completed</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <PrecisionManufacturing
                      sx={{ fontSize: 48, color: "#D1D5DB", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No production requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((pr) => (
                  <StyledTableRow
                    key={pr.id}
                    onClick={() => router.push(`/production/requests/${pr.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#0F172A" }}
                      >
                        {pr.requestNumber}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {pr.storeItem.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pr.storeItem.itemNumber}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="error.main"
                      >
                        {pr.quantityNeeded}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {pr.storeItem.quantity}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={pr.quote.quoteNumber}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/sales/quotes/${pr.quote.id}`);
                        }}
                        sx={{
                          fontWeight: 500,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {pr.quote.customer.name}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={pr.status.replace("_", " ")}
                        size="small"
                        sx={{
                          bgcolor: statusColors[pr.status]?.bg || "#F3F4F6",
                          color: statusColors[pr.status]?.text || "#6B7280",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(pr.dateRaised)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="caption" color="text.secondary">
                        {pr.dateCompleted ? formatDate(pr.dateCompleted) : "—"}
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
