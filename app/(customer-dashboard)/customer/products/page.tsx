'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useCartStore } from '@/lib/stores/cartStore';
import CartDrawer, { CartFab } from '../../components/CartDrawer';

const CATEGORY_LABELS: Record<string, string> = {
  INVERTER: 'Inverter',
  UPS: 'UPS',
  BATTERY: 'Battery',
  SOLAR_PANEL: 'Solar Panel',
  SOLAR_GENERATOR: 'Solar Generator',
  CHARGE_CONTROLLER: 'Charge Controller',
  ACCESSORY: 'Accessory',
  PACKAGE: 'Package',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  INVERTER: { bg: '#dbeafe', text: '#1d4ed8' },
  UPS: { bg: '#ede9fe', text: '#5b21b6' },
  BATTERY: { bg: '#fef3c7', text: '#92400e' },
  SOLAR_PANEL: { bg: '#dcfce7', text: '#166534' },
  SOLAR_GENERATOR: { bg: '#d1fae5', text: '#065f46' },
  CHARGE_CONTROLLER: { bg: '#ffedd5', text: '#9a3412' },
  ACCESSORY: { bg: '#f1f5f9', text: '#475569' },
  PACKAGE: { bg: '#fce7f3', text: '#9d174d' },
  OTHER: { bg: '#f1f5f9', text: '#64748b' },
};

const CONDITION_LABELS: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  NEW: { label: 'New', bg: '#dcfce7', text: '#166534' },
  REFURBISHED: { label: 'Refurbished', bg: '#dbeafe', text: '#1d4ed8' },
};

interface StoreItem {
  id: string;
  itemNumber: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  condition: string;
  unitPrice: number | null;
  warrantyExpiry: string | null;
  imageUrl: string | null;
  product: {
    id: string;
    description: string;
    primaryImage: string | null;
    model: string | null;
    warranty: string | null;
  } | null;
}

function StoreItemCard({ item }: { item: StoreItem }) {
  const router = useRouter();
  const { items, addItem, openCart } = useCartStore();
  const inCart = items.some((i) => i.storeItemId === item.id);
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER;
  const conditionMeta = CONDITION_LABELS[item.condition];
  const inStock = item.quantity > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) {
      openCart();
      return;
    }
    addItem({
      storeItemId: item.id,
      itemName: item.name,
      itemNumber: item.itemNumber,
      category: item.category,
      primaryImage: item.imageUrl ?? item.product?.primaryImage ?? null,
      unitPrice: item.unitPrice ?? 0,
      availableStock: item.quantity,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: inCart ? '#10b981' : 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#10b981',
          boxShadow: '0 4px 24px rgba(16,185,129,0.12)',
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => router.push(`/customer/products/${item.id}`)}
    >
      {/* Image */}
      <Box
        sx={{
          height: 180,
          bgcolor: alpha('#10b981', 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {(item.imageUrl ?? item.product?.primaryImage) ? (
          <Box
            component="img"
            src={(item.imageUrl ?? item.product?.primaryImage)!}
            alt={item.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', color: '#94a3b8' }}>
            <InventoryIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          </Box>
        )}

        {/* Stock badge */}
        {/* <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Chip
            label={inStock ? `${item.quantity} ${item.unit} in stock` : 'Out of stock'}
            size="small"
            sx={{
              bgcolor: inStock ? '#dcfce7' : '#fee2e2',
              color: inStock ? '#166534' : '#991b1b',
              fontWeight: 700,
              fontSize: 11,
              height: 22,
            }}
          />
        </Box> */}

        {/* In-cart indicator */}
        {inCart && (
          <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={CATEGORY_LABELS[item.category] || item.category}
            size="small"
            sx={{
              bgcolor: catColor.bg,
              color: catColor.text,
              fontWeight: 600,
              fontSize: 11,
              height: 20,
            }}
          />
          {conditionMeta && (
            <Chip
              label={conditionMeta.label}
              size="small"
              sx={{
                bgcolor: conditionMeta.bg,
                color: conditionMeta.text,
                fontWeight: 600,
                fontSize: 11,
                height: 20,
              }}
            />
          )}
        </Box>

        <Typography
          variant="body1"
          fontWeight={700}
          sx={{ color: '#0f172a', lineHeight: 1.3, mb: 0.5 }}
        >
          {item.name}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
          {item.itemNumber}
          {item.product?.model && ` · ${item.product.model}`}
        </Typography>

        {item.product?.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.5,
            }}
          >
            {item.product.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
          {item.product?.warranty && (
            <Typography variant="caption" color="text.secondary">
              🛡 {item.product.warranty}
            </Typography>
          )}
          {item.warrantyExpiry && (
            <Typography variant="caption" color="text.secondary">
              📅 Warranty exp.{' '}
              {new Date(item.warrantyExpiry).toLocaleDateString('en-NG', {
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/customer/products/${item.id}`);
            }}
            sx={{
              flex: 1,
              borderColor: 'divider',
              color: '#64748b',
              fontWeight: 600,
              fontSize: 12,
              '&:hover': { borderColor: '#10b981', color: '#10b981' },
            }}
          >
            Details
          </Button>
          <Tooltip
            title={
              !inStock
                ? 'Out of stock'
                : inCart
                  ? 'Added to order list'
                  : 'Add to order list'
            }
          >
            <span style={{ flex: 1 }}>
              <Button
                size="small"
                fullWidth
                variant={inCart ? 'contained' : 'outlined'}
                onClick={handleAddToCart}
                disabled={!inStock && !inCart}
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                  ...(inCart
                    ? {
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#059669' },
                        color: '#fff',
                      }
                    : {
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': { bgcolor: alpha('#10b981', 0.06) },
                      }),
                }}
              >
                {inCart ? 'In Order List' : 'Add to Order'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

export default function CustomerProductsPage() {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { totalItems, openCart } = useCartStore();
  const cartCount = totalItems();

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      ...(search && { search }),
      ...(category && { category }),
    });
    fetch(`/api/customer/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStoreItems(d.storeItems);
        setTotalPages(d.pagination.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <Box sx={{ pb: 10, pt: 1 }}>
      {/* Header */}
      <Box
        mb={3}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>
            Available Products
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Browse our in-stock finished products and build your order request
          </Typography>
        </Box>

        {cartCount > 0 && (
          <Badge badgeContent={cartCount} color="error">
            <Button
              variant="contained"
              startIcon={<ShoppingCartOutlinedIcon />}
              onClick={openCart}
              sx={{
                bgcolor: '#0f172a',
                '&:hover': { bgcolor: '#1e293b' },
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Order List
            </Button>
          </Badge>
        )}
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
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name, item number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ maxWidth: 360, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleSearch}
                    sx={{ fontSize: 12 }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {(search || category) && (
            <Button
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setCategory('');
                setPage(1);
              }}
              sx={{ color: '#64748b', fontSize: 13 }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </Box>
      ) : storeItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12, color: 'text.secondary' }}>
          <InventoryIcon
            sx={{
              fontSize: 64,
              opacity: 0.2,
              mb: 2,
              display: 'block',
              mx: 'auto',
            }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No products found
          </Typography>
          <Typography variant="body2">
            {search || category
              ? 'Try adjusting your search or filters.'
              : 'No products are currently in stock. Please check back soon.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {storeItems.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <StoreItemCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root.Mui-selected': {
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
              },
            }}
          />
        </Box>
      )}

      <CartDrawer />
      <CartFab />
    </Box>
  );
}
