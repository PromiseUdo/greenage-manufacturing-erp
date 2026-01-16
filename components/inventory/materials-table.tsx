// src/components/inventory/MaterialsTable.tsx

'use client';

import { useState } from 'react';
import { styled } from '@mui/material/styles';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { MaterialWithRelations } from '@/types/inventory';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

// Styled components for professional table appearance
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,

    fontSize: 13,
    // textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '8px 16px',

    borderBottom: 'none',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

const WarningTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

interface MaterialsTableProps {
  materials: MaterialWithRelations[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function MaterialsTable({
  materials,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: MaterialsTableProps) {
  const router = useRouter();

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      PCB: 'primary',
      ELECTRONIC_COMPONENT: 'secondary',
      CONNECTOR: 'info',
      WIRE_CABLE: 'warning',
      ENCLOSURE: 'success',
      PACKAGING_MATERIAL: 'default',
      CONSUMABLE: 'default',
      OTHER: 'default',
    };
    return colors[category] || 'default';
  };

  const getStockStatus = (material: MaterialWithRelations) => {
    if (material.currentStock === 0) {
      return { label: 'Out of Stock', color: 'error' as const };
    }
    if (material.currentStock <= material.reorderLevel) {
      return { label: 'Low Stock', color: 'warning' as const };
    }
    return { label: 'In Stock', color: 'success' as const };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // if (materials.length === 0) {
  //   return (
  //     <Paper
  //       elevation={0}
  //       sx={{
  //         p: 6,
  //         textAlign: 'center',
  //         border: '1px solid',
  //         borderColor: 'divider',
  //         borderRadius: 2,
  //       }}
  //     >
  //       <Typography variant="h6" color="text.secondary" gutterBottom>
  //         No materials found
  //       </Typography>
  //       <Typography variant="body2" color="text.secondary">
  //         Create your first material to get started
  //       </Typography>
  //     </Paper>
  //   );
  // }

  if (materials?.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          textAlign: 'center',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <Inventory2OutlinedIcon color="action" />
          </Box>

          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            No materials yet
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            You haven’t added any materials. Create your first material to start
            tracking inventory.
          </Typography>

          {/* CTA */}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => router.push('/inventory/materials/new')}
          >
            Add Material
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Material Name</StyledTableCell>
              <StyledTableCell>Category</StyledTableCell>
              <StyledTableCell align="right">Current Stock</StyledTableCell>
              <StyledTableCell align="right">Reorder Level</StyledTableCell>
              <StyledTableCell align="right">Unit Cost</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Supplier</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials?.map((material) => {
              const status = getStockStatus(material);
              const showWarning =
                material.currentStock <= material.reorderLevel;
              const RowComponent = showWarning
                ? WarningTableRow
                : StyledTableRow;

              return (
                <RowComponent key={material.id}>
                  <StyledTableCell>
                    <Typography variant="body2">{material.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    {/* <Chip
                      label={material.category.replace(/_/g, ' ')}
                      color={getCategoryColor(material.category)}
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        fontWeight: 500,
                        fontSize: 12,
                        color: '#1976d2',
                      }}
                    /> */}

                    <Chip
                      label={material.category.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{
                        // borderRadius: '4px',
                        fontWeight: 500,
                        fontSize: '11px',
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: showWarning ? '#DC2626' : '#0F172A',
                        fontWeight: showWarning ? 700 : 500,
                      }}
                    >
                      {material.currentStock} {material.unit}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {material.reorderLevel} {material.unit}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {material.unitCost
                        ? formatCurrency(material.unitCost)
                        : '-'}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 11,
                        bgcolor: '#e8f5e9',
                        color: '#2e7d32',
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {material.supplier?.name || '-'}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        justifyContent: 'center',
                      }}
                    >
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/inventory/materials/${material.id}`)
                          }
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
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
                            router.push(
                              `/inventory/materials/${material.id}/edit`
                            )
                          }
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </StyledTableCell>
                </RowComponent>
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
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#F8FAFC',
        }}
      />
    </Paper>
  );
}
