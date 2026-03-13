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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  LocalShipping as ShippingIcon,
  FileDownload as DownloadIcon,
  FilterAltOff as ClearFilterIcon,
  TableView as ExcelIcon,
  PictureAsPdf as PdfIcon,
  KeyboardArrowDown as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
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
  status: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Styled Components                                                   */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */
const DELIVERY_METHODS = [
  "Pickup",
  "Delivery",
  "Courier",
  "Third-Party Logistics",
  "Other",
] as const;

const DELIVERY_COLORS: Record<string, { bg: string; color: string }> = {
  Pickup: { bg: "#fff3e0", color: "#ef6c00" },
  Delivery: { bg: "#e8f5e9", color: "#2e7d32" },
  Courier: { bg: "#e3f2fd", color: "#1565c0" },
  "Third-Party Logistics": { bg: "#f3e5f5", color: "#7b1fa2" },
  Other: { bg: "#f5f5f5", color: "#616161" },
};

/* ------------------------------------------------------------------ */
/*  Export helpers                                                       */
/* ------------------------------------------------------------------ */
function buildExportRows(dispatches: StoreDispatch[]) {
  return dispatches.map((d) => ({
    "Dispatch #": d.dispatchNumber,
    Date: format(new Date(d.dispatchDate), "MMM dd, yyyy"),
    Customer: d.customer?.name ?? "",
    "Delivery Method": d.deliveryMethod ?? "",
    Items: d.items?.length ?? 0,
    "Total Qty": d.items?.reduce((s, i) => s + i.quantity, 0) ?? 0,
    "Dispatched By": d.dispatchedBy,
  }));
}

async function exportToExcel(dispatches: StoreDispatch[]) {
  const XLSX = await import("xlsx");
  const rows = buildExportRows(dispatches);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dispatches");
  XLSX.writeFile(wb, `dispatches_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}

async function exportToPDF(dispatches: StoreDispatch[]) {
  const { default: jsPDF } = await import("jspdf");
  // jspdf-autotable v5 exports a standalone function — not a prototype patch
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dispatches Report", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 21);

  const rows = buildExportRows(dispatches);
  const columns = Object.keys(rows[0] || {});
  const body = rows.map((r) => columns.map((c) => (r as any)[c]));

  autoTable(doc, {
    head: [columns],
    body,
    startY: 26,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`dispatches_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                       */
/* ------------------------------------------------------------------ */
export default function StoreDispatchesPage() {
  const router = useRouter();

  // Table state
  const [dispatches, setDispatches] = useState<StoreDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");

  // Export menu anchor
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  // Actions menu anchor
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<StoreDispatch | null>(null);

  const handleActionOpen = (e: React.MouseEvent<HTMLElement>, dispatch: StoreDispatch) => {
    setActionAnchor(e.currentTarget);
    setSelectedDispatch(dispatch);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedDispatch(null);
  };

  const hasActiveFilters = !!(dateFrom || dateTo || deliveryMethod || search);

  /* --- fetch -------------------------------------------------------- */
  const buildParams = useCallback(
    (overrides: Record<string, string> = {}) => {
      const p: Record<string, string> = {
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(deliveryMethod && { deliveryMethod }),
        ...overrides,
      };
      return new URLSearchParams(p);
    },
    [page, limit, search, dateFrom, dateTo, deliveryMethod],
  );

  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/dispatches?${buildParams()}`);
      const data = await res.json();
      setDispatches(data.dispatches || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  /* --- handlers ----------------------------------------------------- */
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(0);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDeliveryMethod("");
    setPage(0);
  };

  const handleExport = async (type: "excel" | "pdf") => {
    setExportAnchor(null);
    setExporting(true);
    try {
      const params = buildParams({ export: "true" });
      const res = await fetch(`/api/store/dispatches?${params}`);
      const data = await res.json();
      const rows: StoreDispatch[] = data.dispatches || [];

      if (type === "excel") await exportToExcel(rows);
      else await exportToPDF(rows);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const getTotalQuantity = (items: DispatchItem[]) =>
    items.reduce((sum, item) => sum + item.quantity, 0);

  const handleFulfill = async (id: string) => {
    try {
      const res = await fetch(`/api/store/dispatches/${id}/fulfill`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fulfill request");
      }
      handleActionClose();
      // Refresh the table
      fetchDispatches();
    } catch (err) {
      console.error("Fulfill failed:", err);
      alert(err instanceof Error ? err.message : "Failed to fulfill request");
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      const res = await fetch(`/api/store/dispatches/${id}/deliver`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as delivered");
      }
      handleActionClose();
      fetchDispatches();
    } catch (err) {
      console.error("Deliver failed:", err);
      alert(err instanceof Error ? err.message : "Failed to mark as delivered");
    }
  };

  /* ----------------------------------------------------------------- */
  /*  Render                                                             */
  /* ----------------------------------------------------------------- */
  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
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

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          {/* Export button */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            endIcon={<ArrowDownIcon />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={exporting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "#0F172A", bgcolor: "transparent" },
            }}
          >
            {exporting ? "Exporting…" : "Export"}
          </Button>

          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{
              paper: { elevation: 2, sx: { mt: 0.5, minWidth: 160 } },
            }}
          >
            <MenuItem
              onClick={() => handleExport("excel")}
              sx={{ fontSize: 14, gap: 1 }}
            >
              <ExcelIcon fontSize="small" sx={{ color: "#217346" }} />
              Export as Excel
            </MenuItem>
            <MenuItem
              onClick={() => handleExport("pdf")}
              sx={{ fontSize: 14, gap: 1 }}
            >
              <PdfIcon fontSize="small" sx={{ color: "#c0392b" }} />
              Export as PDF
            </MenuItem>
          </Menu>

          {/* New Dispatch */}
          <Button
            variant="contained"
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
      </Box>

      {/* ── Filters ─────────────────────────────────────────────── */}
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr auto auto auto auto",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by dispatch #, customer, dispatched by…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
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

          {/* Date From */}
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />

          {/* Date To */}
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />

          {/* Delivery Method */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Delivery Method</InputLabel>
            <Select
              value={deliveryMethod}
              label="Delivery Method"
              onChange={(e) => {
                setDeliveryMethod(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Methods</MenuItem>
              {DELIVERY_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear Filters */}
          <Tooltip title="Clear all filters">
            <span>
              <IconButton
                size="small"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                sx={{
                  color: hasActiveFilters ? "#dc2626" : "text.disabled",
                  border: "1px solid",
                  borderColor: hasActiveFilters ? "#fca5a5" : "divider",
                  borderRadius: 2,
                  p: 0.75,
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: "#fef2f2", borderColor: "#dc2626" },
                }}
              >
                <ClearFilterIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            {search && (
              <Chip
                label={`Search: "${search}"`}
                size="small"
                onDelete={() => {
                  setSearch("");
                  setPage(0);
                }}
                sx={{ fontSize: 11 }}
              />
            )}
            {dateFrom && (
              <Chip
                label={`From: ${format(new Date(dateFrom), "MMM dd, yyyy")}`}
                size="small"
                onDelete={() => {
                  setDateFrom("");
                  setPage(0);
                }}
                sx={{ fontSize: 11 }}
              />
            )}
            {dateTo && (
              <Chip
                label={`To: ${format(new Date(dateTo), "MMM dd, yyyy")}`}
                size="small"
                onDelete={() => {
                  setDateTo("");
                  setPage(0);
                }}
                sx={{ fontSize: 11 }}
              />
            )}
            {deliveryMethod && (
              <Chip
                label={`Method: ${deliveryMethod}`}
                size="small"
                onDelete={() => {
                  setDeliveryMethod("");
                  setPage(0);
                }}
                sx={{
                  fontSize: 11,
                  bgcolor: DELIVERY_COLORS[deliveryMethod]?.bg,
                  color: DELIVERY_COLORS[deliveryMethod]?.color,
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* ── Table ───────────────────────────────────────────────── */}
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
            {hasActiveFilters
              ? "No dispatches match your filters"
              : "No dispatches found"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : "Create a new dispatch to send items from the store to a customer"}
          </Typography>
          {hasActiveFilters ? (
            <Button
              variant="outlined"
              startIcon={<ClearFilterIcon />}
              onClick={handleClearFilters}
              sx={{ borderColor: "#0F172A", color: "#0F172A" }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/sales/store/dispatches/new")}
              sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1e293b" } }}
            >
              New Dispatch
            </Button>
          )}
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
                  <StyledTableCell align="center">Status</StyledTableCell>
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

                      <StyledTableCell align="center">
                        <Chip
                          label={dispatch.status}
                          size="small"
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: dispatch.status === "REQUESTED" ? "#fef08a" : "#e2e8f0",
                            color: dispatch.status === "REQUESTED" ? "#854d0e" : "#475569",
                          }}
                        />
                      </StyledTableCell>

                      <StyledTableCell>
                        <Typography variant="body2">
                          {dispatch.dispatchedBy}
                        </Typography>
                      </StyledTableCell>

                      <StyledTableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionOpen(e, dispatch)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>

                    {/* Expanded items row */}
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
      {/* Actions Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 160,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            if (selectedDispatch) {
              router.push(`/sales/store/dispatches/${selectedDispatch.id}`);
            }
            handleActionClose();
          }}
          sx={{ fontSize: 13, py: 1.5, gap: 1.5 }}
        >
          <ViewIcon fontSize="small" sx={{ color: "text.secondary" }} />
          View Details
        </MenuItem>

        {selectedDispatch?.status === "REQUESTED" && (
          <MenuItem
            onClick={() => handleFulfill(selectedDispatch.id)}
            sx={{ fontSize: 13, py: 1.5, gap: 1.5, color: "#16a34a" }}
          >
            <CheckCircleIcon fontSize="small" />
            Fulfill Dispatch
          </MenuItem>
        )}

        {selectedDispatch && ["PENDING", "IN_TRANSIT", "DISPATCHED"].includes(selectedDispatch.status) && (
          <MenuItem
            onClick={() => handleMarkDelivered(selectedDispatch.id)}
            sx={{ fontSize: 13, py: 1.5, gap: 1.5, color: "#16a34a" }}
          >
            <CheckCircleIcon fontSize="small" />
            Mark as Delivered
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
