// components/store/store-table.tsx

"use client";

import { styled } from "@mui/material/styles";
import {
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  TablePagination,
  Box,
  Typography,
  Button,
} from "@mui/material";
import { Edit as EditIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { StoreItemWithRelations } from "@/types/store";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

// Styled components matching materials table
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
}));

interface StoreTableProps {
  storeItems: StoreItemWithRelations[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function StoreTable({
  storeItems,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: StoreTableProps) {
  const router = useRouter();

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  const getConditionChip = (condition: string) => {
    const styles: Record<string, { bgcolor: string; color: string }> = {
      NEW: { bgcolor: "#e8f5e9", color: "#2e7d32" },
      REFURBISHED: { bgcolor: "#e3f2fd", color: "#1565c0" },
      RETURNED: { bgcolor: "#fff3e0", color: "#ed6c02" },
      DAMAGED: { bgcolor: "#ffebee", color: "#d32f2f" },
    };
    return styles[condition] || { bgcolor: "#f5f5f5", color: "#616161" };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (storeItems?.length === 0) {
    return (
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
            <StorefrontOutlinedIcon color="action" />
          </Box>

          <Typography variant="h6" fontWeight={600}>
            No items in store yet
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            You haven&apos;t added any finished products to the store. Create
            your first store item to start tracking.
          </Typography>

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => router.push("/sales/store/new")}
          >
            Add Store Item
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
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
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Item Number</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell>Product</StyledTableCell>
              <StyledTableCell>Category</StyledTableCell>
              <StyledTableCell align="right">Quantity</StyledTableCell>
              <StyledTableCell>Condition</StyledTableCell>
              <StyledTableCell align="right">Unit Price</StyledTableCell>
              <StyledTableCell>Location</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storeItems?.map((item) => {
              const conditionStyle = getConditionChip(item.condition);

              return (
                <StyledTableRow key={item.id}>
                  <StyledTableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.itemNumber}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2">{item.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.product?.name || "-"}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={item.category.replace(/_/g, " ")}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        fontSize: "11px",
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: item.quantity === 0 ? "#DC2626" : "#0F172A",
                        fontWeight: item.quantity === 0 ? 700 : 500,
                      }}
                    >
                      {item.quantity} {item.unit}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={item.condition.replace(/_/g, " ")}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 11,
                        ...conditionStyle,
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {item.unitPrice ? formatCurrency(item.unitPrice) : "-"}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.location || "-"}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        justifyContent: "center",
                      }}
                    >
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/sales/store/${item.id}`)}
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
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/sales/store/${item.id}/edit`)
                          }
                          sx={{
                            color: "#64748B",
                            "&:hover": {
                              backgroundColor: "#F1F5F9",
                              color: "#0F172A",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={limit}
        page={page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "#F8FAFC",
        }}
      />
    </Paper>
  );
}
