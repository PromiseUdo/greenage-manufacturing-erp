// app/(admin)/sales/store/dispatches/page.tsx

"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  LocalShipping as ShippingIcon,
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

interface StoreDispatch {
  id: string;
  dispatchNumber: string;
  dispatchDate: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
  invoiceId?: string;
  items: DispatchItem[];
  dispatchedBy: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
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

const DELIVERY_COLORS: Record<string, { bg: string; color: string }> = {
  Pickup: { bg: "#fff3e0", color: "#ef6c00" },
  Delivery: { bg: "#e8f5e9", color: "#2e7d32" },
  Courier: { bg: "#e3f2fd", color: "#1565c0" },
  "Third-Party Logistics": { bg: "#f3e5f5", color: "#7b1fa2" },
  Other: { bg: "#f5f5f5", color: "#616161" },
};

export default function StoreDispatchesPage() {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<StoreDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/store/dispatches?${params}`);
      const data = await res.json();
      setDispatches(data.dispatches || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(0);
      fetchDispatches();
    }
  };

  const getTotalQuantity = (items: DispatchItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
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
            Dispatched Items
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Track items dispatched from the store to customers
          </Typography>
        </Box>

        <Button
          variant="contained"
          // startIcon={<AddIcon />}
          onClick={() => router.push("/sales/store/dispatches/new")}
          sx={{
            textTransform: "uppercase",
            bgcolor: "#0F172A",
            fontWeight: "bold",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          New Dispatch
        </Button>
      </Box>

      {/* Search */}
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
        <TextField
          fullWidth
          size="small"
          placeholder="Search by dispatch number, customer name, dispatched by..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Paper>

      {/* Table */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "40vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : dispatches.length === 0 ? (
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
          <ShippingIcon
            sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No dispatches found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new dispatch to send items from the store to a customer
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/sales/store/dispatches/new")}
            sx={{
              bgcolor: "#0F172A",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            New Dispatch
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell width={40} />
                  <StyledTableCell>Dispatch #</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Delivery</StyledTableCell>
                  <StyledTableCell align="center">Items</StyledTableCell>
                  <StyledTableCell align="center">Total Qty</StyledTableCell>
                  <StyledTableCell>Dispatched By</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispatches.map((dispatch) => (
                  <React.Fragment key={dispatch.id}>
                    <StyledTableRow>
                      <StyledTableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedId(
                              expandedId === dispatch.id ? null : dispatch.id,
                            )
                          }
                        >
                          {expandedId === dispatch.id ? (
                            <CollapseIcon fontSize="small" />
                          ) : (
                            <ExpandIcon fontSize="small" />
                          )}
                        </IconButton>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {dispatch.dispatchNumber}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {format(
                          new Date(dispatch.dispatchDate),
                          "MMM dd, yyyy",
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {dispatch.customer?.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {dispatch.customer?.phone}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {dispatch.deliveryMethod ? (
                          <Chip
                            label={dispatch.deliveryMethod}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              fontSize: 11,
                              bgcolor:
                                DELIVERY_COLORS[dispatch.deliveryMethod]?.bg ||
                                "#f5f5f5",
                              color:
                                DELIVERY_COLORS[dispatch.deliveryMethod]
                                  ?.color || "#616161",
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          label={dispatch.items?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: "#dc2626" }}
                        >
                          -{getTotalQuantity(dispatch.items || [])}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2">
                          {dispatch.dispatchedBy}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(
                                `/sales/store/dispatches/${dispatch.id}`,
                              )
                            }
                            sx={{
                              "&:hover": {
                                bgcolor: "#e3f2fd",
                                color: "#1565c0",
                              },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>

                    {/* Expanded Items Row */}
                    {expandedId === dispatch.id && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0 }}>
                          <Box
                            sx={{
                              bgcolor: "#f8fafc",
                              p: 2,
                              borderTop: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mb: 1 }}
                            >
                              Dispatched items:
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  >
                                    Item #
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  >
                                    Name
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  >
                                    Quantity
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  >
                                    Notes
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(dispatch.items || []).map(
                                  (item: DispatchItem, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontSize: 12 }}>
                                        {item.itemNumber}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: 12 }}>
                                        {item.name}
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: "#dc2626",
                                        }}
                                      >
                                        -{item.quantity} {item.unit}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: 12 }}>
                                        {item.notes || "—"}
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      )}
    </Box>
  );
}
