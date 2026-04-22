'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
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
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search,
  Edit,
  MoreVert,
  Visibility,
  CheckCircle,
  PowerSettingsNew,
} from '@mui/icons-material';
import BlockIcon from '@mui/icons-material/Block';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
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
    cursor: 'pointer',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

interface Product {
  id: string;
  productNumber: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  model: string | null;
  isActive: boolean;
  isAvailable: boolean;
  stockQuantity: number | null;
  _count: {
    quoteLineItems: number;
    orders: number;
  };
  createdAt: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  INVERTER: { bg: '#dbeafe', text: '#1e40af' },
  UPS: { bg: '#fce7f3', text: '#9f1239' },
  BATTERY: { bg: '#fef3c7', text: '#92400e' },
  SOLAR_PANEL: { bg: '#d1fae5', text: '#065f46' },
  CHARGE_CONTROLLER: { bg: '#e0e7ff', text: '#4338ca' },
  SOLAR_GENERATOR: { bg: '#e0e7ff', text: '#4338ca' },
  ACCESSORY: { bg: '#f3f4f6', text: '#374151' },
  PACKAGE: { bg: '#fae8ff', text: '#86198f' },
  OTHER: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function InactiveProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Product | null>(
    null,
  );
  const [reactivating, setReactivating] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        isActive: 'false',
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setReactivating(true);
    try {
      const res = await fetch(`/api/products/${reactivateTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        setReactivateTarget(null);
        setSnackbar({
          open: true,
          message: `"${reactivateTarget.name}" has been reactivated.`,
          severity: 'success',
        });
        fetchProducts();
      } else {
        const err = await res.json();
        setSnackbar({
          open: true,
          message: err.error || 'Failed to reactivate product.',
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'An unexpected error occurred.',
        severity: 'error',
      });
    } finally {
      setReactivating(false);
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    product: Product,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);

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
            Draft Products
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Products that have been deactivated and are no longer in use
          </Typography>
        </Box>
        <Chip
          icon={<BlockIcon sx={{ fontSize: '16px !important' }} />}
          label={`${total} draft`}
          sx={{
            bgcolor: '#fee2e2',
            color: '#991b1b',
            fontWeight: 600,
            fontSize: 13,
            px: 1,
          }}
        />
      </Box>

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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search draft products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ maxWidth: 400, flexGrow: 1 }}
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
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
            size="small"
          >
            <MenuItem value="">All Categories</MenuItem>
            {Object.keys(categoryColors).map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
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
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>Product #</StyledTableCell>
                <StyledTableCell>Name & Description</StyledTableCell>
                <StyledTableCell>Category</StyledTableCell>
                <StyledTableCell>Model</StyledTableCell>
                <StyledTableCell>Cost Price</StyledTableCell>
                <StyledTableCell>Stock</StyledTableCell>
                <StyledTableCell>Usage</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 26, color: '#22c55e' }} />
                      </Box>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="text.primary"
                      >
                        No draft products
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All products are currently active.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <StyledTableRow
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: '#0F172A' }}
                      >
                        {product.productNumber}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {product.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            maxWidth: 200,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {product.description}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={product.category.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor:
                            categoryColors[product.category]?.bg || '#f3f4f6',
                          color:
                            categoryColors[product.category]?.text || '#6b7280',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>{product.model || '—'}</StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(product.costPrice)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      {product.stockQuantity !== null ? (
                        <Typography variant="body2" fontWeight={500}>
                          {product.stockQuantity}
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Quotes">
                          <Chip
                            label={product._count.quoteLineItems}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </Tooltip>
                        <Tooltip title="Orders">
                          <Chip
                            label={product._count.orders}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </Tooltip>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, product)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#F8FAFC',
          }}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/products/${selectedProduct?.id}`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="View Details"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/products/${selectedProduct?.id}/edit`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Edit Product"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setReactivateTarget(selectedProduct);
            handleMenuClose();
          }}
          sx={{ color: '#16a34a' }}
        >
          <ListItemIcon>
            <PowerSettingsNew fontSize="small" sx={{ color: '#16a34a' }} />
          </ListItemIcon>
          <ListItemText
            primary="Reactivate"
            primaryTypographyProps={{
              variant: 'body2',
              color: '#16a34a',
              fontWeight: 600,
            }}
          />
        </MenuItem>
      </Menu>

      {/* Reactivate Confirmation Dialog */}
      <Dialog
        open={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reactivate Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to reactivate{' '}
            <strong>{reactivateTarget?.name}</strong>? It will become visible
            and available across the system again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setReactivateTarget(null)}
            sx={{ color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReactivate}
            disabled={reactivating}
            sx={{
              bgcolor: '#16a34a',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#15803d' },
            }}
          >
            {reactivating ? 'Reactivating...' : 'Reactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success / Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
