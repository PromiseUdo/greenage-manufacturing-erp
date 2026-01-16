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
  IconButton,
  Tooltip,
  CircularProgress,
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
import IssuancesTable from '@/components/inventory/issuance-table';

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
  }, [page, limit, search]);

  const fetchIssuances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
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
          <Typography variant="h6" fontWeight={600}>
            Material Issuances
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: 14,
            }}
          >
            Track all materials issued from inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          // startIcon={<AddIcon />}
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
          onClick={() => router.push('/inventory/issuance/new')}
        >
          Issue Material
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by batch number or issued by..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500, fontSize: 14 }}
        />
      </Paper>

      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading issuances...
          </Typography>
        </Paper>
      ) : (
        <IssuancesTable
          issuances={issuances}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}
    </Box>
  );
}
