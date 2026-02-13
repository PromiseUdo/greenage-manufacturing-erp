// app/(admin)/sales/store/receipts/page.tsx

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
  Alert,
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
  AttachFile as AttachIcon,
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

interface StoreReceipt {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  source: string;
  referenceNumber?: string;
  items: ReceiptItem[];
  receivedBy: string;
  notes?: string;
  createdAt: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
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

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  Production: { bg: "#e8f5e9", color: "#2e7d32" },
  Transfer: { bg: "#e3f2fd", color: "#1565c0" },
  Return: { bg: "#fff3e0", color: "#ef6c00" },
  // "Quality Cleared": { bg: "#f3e5f5", color: "#7b1fa2" },
  Other: { bg: "#f5f5f5", color: "#616161" },
};

export default function StoreReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<StoreReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/store/receipts?${params}`);
      const data = await res.json();
      setReceipts(data.receipts || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(0);
      fetchReceipts();
    }
  };

  const getTotalQuantity = (items: ReceiptItem[]) => {
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
            Store Receipts
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Record and track receipt of finished products into the store
          </Typography>
        </Box>

        <Button
          variant="contained"
          // startIcon={<AddIcon />}
          onClick={() => router.push("/sales/store/receipts/new")}
          sx={{
            textTransform: "uppercase",
            bgcolor: "#0F172A",
            fontWeight: "bold",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          New Receipt
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
          placeholder="Search by receipt number, source, reference, receiver..."
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
      ) : receipts.length === 0 ? (
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
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No store receipts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new receipt to record items received into the store
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/sales/store/receipts/new")}
            sx={{
              bgcolor: "#0F172A",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            New Receipt
          </Button>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell width={40} />
                  <StyledTableCell>Receipt #</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Source</StyledTableCell>
                  <StyledTableCell>Reference</StyledTableCell>
                  <StyledTableCell align="center">Items</StyledTableCell>
                  <StyledTableCell align="center">Total Qty</StyledTableCell>
                  <StyledTableCell align="center">Attachments</StyledTableCell>
                  <StyledTableCell>Received By</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((receipt) => (
                  <React.Fragment key={receipt.id}>
                    <StyledTableRow>
                      <StyledTableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedId(
                              expandedId === receipt.id ? null : receipt.id,
                            )
                          }
                        >
                          {expandedId === receipt.id ? (
                            <CollapseIcon fontSize="small" />
                          ) : (
                            <ExpandIcon fontSize="small" />
                          )}
                        </IconButton>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {receipt.receiptNumber}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {format(new Date(receipt.receivedDate), "MMM dd, yyyy")}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={receipt.source}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            fontSize: 11,
                            bgcolor:
                              SOURCE_COLORS[receipt.source]?.bg || "#f5f5f5",
                            color:
                              SOURCE_COLORS[receipt.source]?.color || "#616161",
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {receipt.referenceNumber || "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          label={receipt.items?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: "#16a34a" }}
                        >
                          +{getTotalQuantity(receipt.items || [])}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {receipt.attachments &&
                        receipt.attachments.length > 0 ? (
                          <Chip
                            icon={<AttachIcon fontSize="small" />}
                            label={receipt.attachments.length}
                            size="small"
                            sx={{
                              bgcolor: "#f3e5f5",
                              color: "#9c27b0",
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2">
                          {receipt.receivedBy}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(`/sales/store/receipts/${receipt.id}`)
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
                    {expandedId === receipt.id && (
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
                              Items in this receipt:
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
                                    Batch
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  >
                                    Notes
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(receipt.items || []).map(
                                  (item: ReceiptItem, idx: number) => (
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
                                          color: "#16a34a",
                                        }}
                                      >
                                        +{item.quantity} {item.unit}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: 12 }}>
                                        {item.batchNumber || "—"}
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
