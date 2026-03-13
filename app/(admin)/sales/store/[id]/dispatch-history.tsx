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
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  FileDownload as DownloadIcon,
  TableView as ExcelIcon,
  PictureAsPdf as PdfIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
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
  customer?: { id: string; name: string; phone: string; address: string };
  items: DispatchItem[];
  dispatchedBy: string;
  deliveryMethod?: string;
}

/* ------------------------------------------------------------------ */
/*  Styled Components                                                   */
/* ------------------------------------------------------------------ */
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#F8FAFC", // Light gray background
    color: "#64748B", // Slate gray text
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #E2E8F0",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
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

/* ------------------------------------------------------------------ */
/*  Export helpers                                                    */
/* ------------------------------------------------------------------ */
function buildExportRows(dispatches: StoreDispatch[], storeItemId: string) {
  return dispatches.map((d) => {
    // Find the specific item in the dispatch payload
    const dispatchItem = d.items?.find((i) => i.storeItemId === storeItemId);

    return {
      Date: format(new Date(d.dispatchDate), "yyyy-MM-dd"),
      "Dispatch #": d.dispatchNumber,
      Customer: d.customer?.name ?? "",
      "Qty Dispatched": dispatchItem?.quantity ?? 0,
      Unit: dispatchItem?.unit ?? "pcs",
      "Delivery Method": d.deliveryMethod ?? "—",
      "Dispatched By": d.dispatchedBy,
    };
  });
}

async function exportToExcel(dispatches: StoreDispatch[], storeItemId: string) {
  const XLSX = await import("xlsx");
  const rows = buildExportRows(dispatches, storeItemId);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Item Dispatches");
  XLSX.writeFile(
    wb,
    `item_dispatches_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
}

async function exportToPDF(dispatches: StoreDispatch[], storeItemId: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Item Dispatch History", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 21);

  const rows = buildExportRows(dispatches, storeItemId);
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

  doc.save(`item_dispatches_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function StoreDispatchHistory({
  storeItemId,
}: {
  storeItemId: string;
}) {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<StoreDispatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  // Default to load up to 100 dispatches for the detail view table.
  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/${storeItemId}/dispatches?limit=100`);
      const data = await res.json();
      setDispatches(data.dispatches || []);
    } catch (error) {
      console.error("Error fetching item dispatches:", error);
    } finally {
      setLoading(false);
    }
  }, [storeItemId]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  // Handle Export
  const handleExport = async (type: "excel" | "pdf") => {
    setExportAnchor(null);
    setExporting(true);
    try {
      const res = await fetch(
        `/api/store/${storeItemId}/dispatches?export=true`,
      );
      const data = await res.json();
      const rows: StoreDispatch[] = data.dispatches || [];

      if (type === "excel") await exportToExcel(rows, storeItemId);
      else await exportToPDF(rows, storeItemId);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const getItemQuantity = (items: DispatchItem[]) => {
    const item = items.find((i) => i.storeItemId === storeItemId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CircularProgress size={32} />
      </Paper>
    );
  }

  // Hide the section completely if there are no dispatches
  if (dispatches.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        <ShippingIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
          No Dispatch History
        </Typography>
        <Typography variant="body2" color="text.disabled">
          This item has not been dispatched to any customers yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
          Dispatch History
        </Typography>
        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            endIcon={<ArrowDownIcon fontSize="small" />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={exporting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: 12,
              borderColor: "divider",
              color: "text.primary",
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
              sx={{ fontSize: 13, gap: 1 }}
            >
              <ExcelIcon fontSize="small" sx={{ color: "#217346" }} />
              Export as Excel
            </MenuItem>
            <MenuItem
              onClick={() => handleExport("pdf")}
              sx={{ fontSize: 13, gap: 1 }}
            >
              <PdfIcon fontSize="small" sx={{ color: "#c0392b" }} />
              Export as PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>Date</StyledTableCell>
              <StyledTableCell>Dispatch #</StyledTableCell>
              <StyledTableCell>Customer</StyledTableCell>
              <StyledTableCell align="center">Qty Dispatched</StyledTableCell>
              <StyledTableCell>Dispatched By</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispatches.map((dispatch) => (
              <StyledTableRow key={dispatch.id}>
                <StyledTableCell>
                  {format(new Date(dispatch.dispatchDate), "MMM dd, yyyy")}
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {dispatch.dispatchNumber}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {dispatch.customer?.name || "Unknown"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {dispatch.deliveryMethod || "—"}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: "#dc2626" }}
                  >
                    -{getItemQuantity(dispatch.items)}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>{dispatch.dispatchedBy}</StyledTableCell>
                <StyledTableCell align="center">
                  <Tooltip title="View Dispatch">
                    <IconButton
                      size="small"
                      onClick={() =>
                        router.push(`/sales/store/dispatches/${dispatch.id}`)
                      }
                      sx={{
                        "&:hover": { bgcolor: "#e3f2fd", color: "#1976d2" },
                      }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
