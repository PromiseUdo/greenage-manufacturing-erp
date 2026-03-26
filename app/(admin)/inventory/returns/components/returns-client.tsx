"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Search, Add, Edit, AssignmentReturn } from "@mui/icons-material";
import { styled, tableCellClasses } from "@mui/material";

type ProductReturn = any; // Will be properly typed when we integrate Prisma types on the client if needed

interface ReturnsClientProps {
  data: ProductReturn[];
  isProductionView?: boolean;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    padding: "12px 16px",
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
}));

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ");
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "RECEIVED":
      return { bg: "#FEF3C7", text: "#92400E" }; // amber
    case "INSPECTING":
    case "PENDING_APPROVAL":
      return { bg: "#E0E7FF", text: "#4338CA" }; // indigo
    case "IN_REPAIR":
      return { bg: "#DBEAFE", text: "#1E40AF" }; // blue
    case "REPAIR_COMPLETED":
    case "READY_FOR_DISPATCH":
      return { bg: "#ECFCCB", text: "#3F6212" }; // lime
    case "DISPATCHED":
      return { bg: "#DCFCE7", text: "#166534" }; // green
    case "SCRAPPED":
      return { bg: "#FEE2E2", text: "#991B1B" }; // red
    default:
      return { bg: "#F3F4F6", text: "#4B5563" }; // gray
  }
};

export default function ReturnsClient({ data, isProductionView = false }: ReturnsClientProps) {
  const router = useRouter();
  const basePath = isProductionView ? "/production/returns" : "/inventory/returns";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.issueReported.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          <Typography variant="h5" fontWeight={800}>
            Product Returns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage product returns, inspections, and repairs
          </Typography>
        </Box>
        {!isProductionView && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push(`${basePath}/new`)}
            sx={{
              fontWeight: "bold",
              bgcolor: "#0F172A",
              textTransform: "uppercase",
              borderRadius: 2.5,
              px: 3,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Log Return
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search returns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ flex: 1, minWidth: 250 }}
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
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
            <MenuItem value="INSPECTING">Inspecting</MenuItem>
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="IN_REPAIR">In Repair</MenuItem>
            <MenuItem value="REPAIR_COMPLETED">Repair Completed</MenuItem>
            <MenuItem value="READY_FOR_DISPATCH">Ready for Dispatch</MenuItem>
            <MenuItem value="DISPATCHED">Dispatched</MenuItem>
            <MenuItem value="SCRAPPED">Scrapped</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Table Area */}
      {filteredData.length === 0 ? (
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
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <AssignmentReturn sx={{ fontSize: 28, color: "#64748B" }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              No returns found
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              {data.length > 0
                ? "No returns match your current filters. Try adjusting your search."
                : "There are no product returns yet."}
            </Typography>
            {data.length === 0 && !isProductionView && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => router.push(`${basePath}/new`)}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Log Return
              </Button>
            )}
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
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Return #</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Product / Unit</StyledTableCell>
                  <StyledTableCell>Issue Reported</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Date Received</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item) => {
                  const sColor = getStatusColor(item.status);
                  return (
                    <StyledTableRow
                      key={item.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => router.push(`${basePath}/${item.id}`)}
                    >
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.returnNumber}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.customer?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.customer?.phone}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.product?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.unitId || "Unit unknown"} (Qty: {item.quantity})
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.issueReported}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={formatStatus(item.status)}
                          size="small"
                          sx={{
                            bgcolor: sColor.bg,
                            color: sColor.text,
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2">
                          {new Date(item.dateReceived).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Tooltip title="Manage Return">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${basePath}/${item.id}`);
                            }}
                            sx={{
                              color: "#64748B",
                              "&:hover": {
                                backgroundColor: "#F1F5F9",
                                color: "#0F172A",
                              },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
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
    </Box>
  );
}
