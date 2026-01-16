// src/app/dashboard/inventory/materials/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Switch,
  Paper,
  Menu,
  alpha,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import { MaterialWithRelations } from '@/types/inventory';
import MaterialsTable from '@/components/inventory/materials-table';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'PCB', label: 'PCB' },
  { value: 'ELECTRONIC_COMPONENT', label: 'Electronic Component' },
  { value: 'CONNECTOR', label: 'Connector' },
  { value: 'WIRE_CABLE', label: 'Wire/Cable' },
  { value: 'ENCLOSURE', label: 'Enclosure' },
  { value: 'PACKAGING_MATERIAL', label: 'Packaging Material' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'OTHER', label: 'Other' },
];

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const exportMenuOpen = Boolean(exportAnchorEl);

  useEffect(() => {
    fetchMaterials();
  }, [page, limit, category, lowStockOnly]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(lowStockOnly && { lowStock: 'true' }),
      });

      const res = await fetch(`/api/inventory/materials?${params}`);
      const data = await res.json();
      setMaterials(data.materials);
      setTotal(data?.pagination?.total);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMaterials();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
        ...(category && { category }),
        ...(lowStockOnly && { lowStock: 'true' }),
      });

      const res = await fetch(`/api/inventory/materials/export?${params}`);

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials_${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'pdf'
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export materials. Please try again.');
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
            Materials
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: 14,
            }}
          >
            Manage your inventory materials and stock levels
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {/* <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchMaterials}
            sx={{
              textTransform: 'uppercase',
              borderColor: '#0F172A',
              color: '#0F172A',
              // fontWeight: 'bold',
              // fontSize: '14',
            }}
          >
            Refresh
          </Button> */}

          <Button
            variant="outlined"
            endIcon={
              exporting ? <CircularProgress size={16} /> : <ArrowDownIcon />
            }
            onClick={handleExportClick}
            disabled={exporting || materials.length === 0}
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
              textTransform: 'uppercase',
              bgcolor: '#0F172A',
              color: '#ffffff',
              fontWeight: 'bold',
              // fontSize: '14',
            }}
            onClick={() => router.push('/inventory/materials/new')}
          >
            Add Material
          </Button>
        </Box>
      </Box>

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

      {/* Filters */}
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or part number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Category"
              size="small"
              value={category}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#475569', // default label color
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A', // focused label color
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={lowStockOnly}
                  onChange={(e) => {
                    setLowStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#0F172A', // thumb color
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#0F172A', // track color
                    },
                  }}
                />
              }
              label="Low Stock Only"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '12px',
                },
              }}
            />
          </Grid>
          {/* <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              // startIcon={<SearchIcon />}
              sx={{
                textTransform: 'uppercase',
                bgcolor: '#0F172A',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14',
              }}
            >
              Search
            </Button>
          </Grid> */}
        </Grid>
      </Paper>

      {/* Materials Table */}
      <MaterialsTable
        materials={materials}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </Box>
  );
}
