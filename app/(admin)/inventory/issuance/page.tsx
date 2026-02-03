// src/app/dashboard/inventory/issuance/page.tsx

'use client';

import IssuancesTable from '@/components/inventory/issuance-table';
import { IssuanceWithMaterial } from '@/types/inventory';
import {
  KeyboardArrowDown as ArrowDownIcon,
  TableChart as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const exportMenuOpen = Boolean(exportAnchorEl);

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
        (i: any) => new Date(i.issuedAt) >= sevenDaysAgo,
      ).length;

      const last30Days = data.issuances.filter(
        (i: any) => new Date(i.issuedAt) >= thirtyDaysAgo,
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

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    handleExportClose();
    setExporting(true);

    try {
      const params = new URLSearchParams({
        format,
        ...(search && { search }),
      });

      const res = await fetch(`/api/inventory/issuances/export?${params}`);

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `issuances_${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'pdf'
      }`;
      a.click();
      window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export issuances. Please try again.');
    } finally {
      setExporting(false);
    }
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

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            endIcon={
              exporting ? <CircularProgress size={16} /> : <ArrowDownIcon />
            }
            onClick={handleExportClick}
            disabled={exporting || issuances.length === 0}
            sx={{
              textTransform: 'uppercase',
              borderColor: '#0F172A',
              color: '#0F172A',
              fontWeight: 'bold',
              fontSize: 14,
              '&:hover': {
                borderColor: '#0F172A',
                bgcolor: alpha('#0F172A', 0.04),
              },
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>

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
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={exportMenuOpen}
        onClose={handleExportClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          onClick={() => handleExport('excel')}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <ExcelIcon fontSize="small" sx={{ color: '#107C41' }} />
          <Typography variant="body2">Download as Excel</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('pdf')}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <PdfIcon fontSize="small" sx={{ color: '#DC2626' }} />
          <Typography variant="body2">Download as PDF</Typography>
        </MenuItem>
      </Menu>

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
