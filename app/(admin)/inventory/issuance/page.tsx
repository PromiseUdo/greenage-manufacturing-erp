// src/app/dashboard/inventory/issuance/page.tsx

'use client';

import { useEffect, useState } from 'react';
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
  TextField,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { IssuanceWithMaterial } from '@/types/inventory';
import Grid from '@mui/material/GridLegacy';

export default function IssuancesPage() {
  const router = useRouter();
  const [issuances, setIssuances] = useState<IssuanceWithMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalIssuances: 0,
    last7Days: 0,
    last30Days: 0,
  });

  useEffect(() => {
    fetchIssuances();
    fetchStats();
  }, [page, limit]);

  const fetchIssuances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/inventory/issuances?${params}`);
      const data = await res.json();
      setIssuances(data.issuances);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching issuances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from recent issuances
      const res = await fetch('/api/inventory/issuances?limit=1000');
      const data = await res.json();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last7Days = data.issuances.filter(
        (i: any) => new Date(i.issuedAt) >= sevenDaysAgo
      ).length;

      const last30Days = data.issuances.filter(
        (i: any) => new Date(i.issuedAt) >= thirtyDaysAgo
      ).length;

      setStats({
        totalIssuances: data.pagination.total,
        last7Days,
        last30Days,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
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
            Material Issuances
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all materials issued from inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/inventory/issuance/new')}
        >
          Issue Material
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
                    backgroundColor: 'primary.light',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  <TrendingDownIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Issuances
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={600}>
                {stats.totalIssuances}
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
                    backgroundColor: 'success.light',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  <CalendarIcon sx={{ color: 'success.main' }} />
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
                  <CalendarIcon sx={{ color: 'info.main' }} />
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

      {/* Issuances Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Date & Time</strong>
                </TableCell>
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
                  <strong>Issued To</strong>
                </TableCell>
                <TableCell>
                  <strong>Issued By</strong>
                </TableCell>
                <TableCell>
                  <strong>Purpose</strong>
                </TableCell>
                <TableCell>
                  <strong>Order</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issuances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No issuances found
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Issue your first material to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                issuances.map((issuance) => (
                  <TableRow key={issuance.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {format(new Date(issuance.issuedAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(issuance.issuedAt), 'hh:mm a')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {issuance.material.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issuance.material.partNumber}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="error"
                      >
                        -{issuance.quantity} {issuance.material.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={issuance.batchNumber} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {issuance.issuedTo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {issuance.issuedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {issuance.purpose || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {issuance.orderId ? (
                        <Chip
                          label={issuance.orderId}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
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
        />
      </Paper>
    </Box>
  );
}
