// src/components/inventory/MaterialsTable.tsx

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { MaterialWithRelations } from '@/types/inventory';
import { useRouter } from 'next/navigation';

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
    onPageChange(newPage + 1); // MUI uses 0-based indexing
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

  if (materials.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No materials found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Create your first material to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Part Number</strong>
              </TableCell>
              <TableCell>
                <strong>Material Name</strong>
              </TableCell>
              <TableCell>
                <strong>Category</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Current Stock</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Reorder Level</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Unit Cost</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Supplier</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => {
              const status = getStockStatus(material);
              const showWarning =
                material.currentStock <= material.reorderLevel;

              return (
                <TableRow
                  key={material.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: showWarning ? 'error.lighter' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {showWarning && (
                        <Tooltip title="Stock level below reorder point">
                          <WarningIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                      <Typography variant="body2" fontWeight={500}>
                        {material.partNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={material.category.replace(/_/g, ' ')}
                      color={getCategoryColor(material.category)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={showWarning ? 'error.main' : 'text.primary'}
                      fontWeight={showWarning ? 600 : 400}
                    >
                      {material.currentStock} {material.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {material.reorderLevel} {material.unit}
                  </TableCell>
                  <TableCell align="right">
                    {material.unitCost
                      ? formatCurrency(material.unitCost)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{material.supplier?.name || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() =>
                          router.push(`/inventory/materials/${material.id}`)
                        }
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
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
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
      />
    </Paper>
  );
}
