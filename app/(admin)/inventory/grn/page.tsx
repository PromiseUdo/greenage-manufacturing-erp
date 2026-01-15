// src/app/dashboard/inventory/grn/page.tsx

'use client';
import dynamic from 'next/dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableFooter,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as ShippingIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { GRNWithSupplier } from '@/types/inventory';

const ClientTablePagination = dynamic(
  () => import('@mui/material/TablePagination'),
  { ssr: false }
);

export default function GRNPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRNWithSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedGRN, setExpandedGRN] = useState<string | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<GRNWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalGRNs: 0,
    last7Days: 0,
    last30Days: 0,
  });

  useEffect(() => {
    fetchGRNs();
    fetchStats();
  }, [page, limit]);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/inventory/grn?${params}`);
      const data = await res.json();
      setGrns(data.grns);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/inventory/grn?limit=1000');
      const data = await res.json();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last7Days = data.grns.filter(
        (g: any) => new Date(g.receivedDate) >= sevenDaysAgo
      ).length;

      const last30Days = data.grns.filter(
        (g: any) => new Date(g.receivedDate) >= thirtyDaysAgo
      ).length;

      setStats({
        totalGRNs: data.pagination.total,
        last7Days,
        last30Days,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleToggleExpand = (grnId: string) => {
    setExpandedGRN(expandedGRN === grnId ? null : grnId);
  };

  const handleViewDetails = (grn: GRNWithSupplier) => {
    setSelectedGRN(grn);
    setDialogOpen(true);
  };

  const getTotalItems = (items: any) => {
    if (Array.isArray(items)) {
      return items.length;
    }
    return 0;
  };

  const getTotalQuantity = (batches: any[]) => {
    return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Goods Received Notes (GRN)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all materials received from suppliers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/inventory/grn/new')}
        >
          Create GRN
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: 'success.light',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total GRNs
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={600}>
                {stats.totalGRNs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: 'primary.light',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  <ShippingIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Last 7 Days
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={600}>
                {stats.last7Days}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: 'info.light',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  <ShippingIcon sx={{ color: 'info.main' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Last 30 Days
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={600}>
                {stats.last30Days}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* GRNs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>
                  <strong>GRN Number</strong>
                </TableCell>
                <TableCell>
                  <strong>Date Received</strong>
                </TableCell>
                <TableCell>
                  <strong>Supplier</strong>
                </TableCell>
                <TableCell>
                  <strong>Invoice No.</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Items</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Total Qty</strong>
                </TableCell>
                <TableCell>
                  <strong>Received By</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No GRNs found
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Create your first GRN to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                grns.map((grn) => (
                  <React.Fragment key={grn.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(grn.id)}
                        >
                          {expandedGRN === grn.id ? (
                            <CollapseIcon />
                          ) : (
                            <ExpandIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={grn.grnNumber}
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(grn.receivedDate), 'hh:mm a')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {grn.supplier.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {grn.invoiceNumber ? (
                          <Chip
                            label={grn.invoiceNumber}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getTotalItems(grn.items)}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="success.main"
                        >
                          +{getTotalQuantity(grn.batches || [])}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {grn.receivedBy}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(grn)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Items Details */}
                    {expandedGRN === grn.id && grn.batches && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0 }}>
                          <Collapse
                            in={expandedGRN === grn.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ p: 3, backgroundColor: 'grey.50' }}>
                              <Typography variant="h6" gutterBottom>
                                Received Items
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>
                                      <strong>Material</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Part Number</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                      <strong>Quantity</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Batch Number</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Supplier Batch</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Expiry Date</strong>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {grn.batches.map((batch) => (
                                    <TableRow key={batch.id}>
                                      <TableCell>
                                        {batch.material?.name}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={batch.material?.partNumber}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <strong>{batch.quantity}</strong>{' '}
                                        {batch.material?.unit}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={batch.batchNumber}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {batch.supplierBatchNo || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {batch.expiryDate
                                          ? format(
                                              new Date(batch.expiryDate),
                                              'MMM dd, yyyy'
                                            )
                                          : '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {grn.notes && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    <strong>Notes:</strong> {grn.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <ClientTablePagination
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  count={total}
                  rowsPerPage={limit}
                  page={page - 1}
                  onPageChange={(_, newPage) => setPage(newPage + 1)}
                  onRowsPerPageChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        {/* <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={limit}
          page={page - 1}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
        /> */}

        {/* <ClientTablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          count={total}
          rowsPerPage={limit}
          page={page - 1}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
        /> */}
      </Paper>

      {/* GRN Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>GRN Details - {selectedGRN?.grnNumber}</DialogTitle>
        <DialogContent dividers>
          {selectedGRN && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Supplier
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.supplier.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date Received
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {format(
                      new Date(selectedGRN.receivedDate),
                      'MMM dd, yyyy hh:mm a'
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.invoiceNumber || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Received By
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.receivedBy}
                  </Typography>
                </Grid>
                {selectedGRN.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">{selectedGRN.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Items Received
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Batch Number</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedGRN.batches?.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.material?.name}</TableCell>
                        <TableCell align="right">
                          <strong>{batch.quantity}</strong>{' '}
                          {batch.material?.unit}
                        </TableCell>
                        <TableCell>
                          <Chip label={batch.batchNumber} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
