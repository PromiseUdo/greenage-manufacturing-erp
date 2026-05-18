'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import { useCartStore } from '@/lib/stores/cartStore';
import CartDrawer, { CartFab } from '../../../components/CartDrawer';

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

const CONDITION_META: Record<string, { label: string; bg: string; text: string }> = {
  NEW: { label: 'New', bg: '#dcfce7', text: '#166534' },
  REFURBISHED: { label: 'Refurbished', bg: '#dbeafe', text: '#1d4ed8' },
  RETURNED: { label: 'Returned', bg: '#fef3c7', text: '#92400e' },
  DAMAGED: { label: 'Damaged', bg: '#fee2e2', text: '#991b1b' },
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
  batchNumber: string | null;
  location: string | null;
  notes: string | null;
  imageUrl: string | null;
  product: {
    id: string;
    productNumber: string;
    description: string;
    primaryImage: string | null;
    images: unknown;
    model: string | null;
    warranty: string | null;
    leadTime: number | null;
    specifications: unknown;
    tags: unknown;
  } | null;
}

function SpecTable({ specs }: { specs: Record<string, unknown> }) {
  const entries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;

  return (
    <Box>
      {entries.map(([key, value], idx) => (
        <Box
          key={key}
          sx={{
            display: 'flex',
            py: 1.5,
            borderBottom: idx < entries.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              minWidth: 200,
              color: '#64748b',
              fontWeight: 500,
              textTransform: 'capitalize',
              flexShrink: 0,
            }}
          >
            {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, wordBreak: 'break-word' }}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [storeItem, setStoreItem] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { items, addItem, updateQuantity, openCart } = useCartStore();
  const cartItem = items.find((i) => i.storeItemId === id);
  const inCart = Boolean(cartItem);

  useEffect(() => {
    fetch(`/api/customer/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStoreItem(d.storeItem);
        setSelectedImage(d.storeItem.imageUrl ?? d.storeItem.product?.primaryImage ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!storeItem) return;
    const clampedQty = Math.min(qty, storeItem.quantity);
    if (inCart) {
      updateQuantity(storeItem.id, (cartItem?.quantity ?? 0) + clampedQty);
    } else {
      addItem(
        {
          storeItemId: storeItem.id,
          itemName: storeItem.name,
          itemNumber: storeItem.itemNumber,
          category: storeItem.category,
          primaryImage: storeItem.imageUrl ?? storeItem.product?.primaryImage ?? null,
          unitPrice: storeItem.unitPrice ?? 0,
          availableStock: storeItem.quantity,
        },
        clampedQty,
      );
    }
    openCart();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  if (error || !storeItem) {
    return (
      <Box py={4}>
        <Alert severity="error">{error || 'Item not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/customer/products')}
          sx={{ mt: 2, color: '#10b981' }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  const inStock = storeItem.quantity > 0;
  const catColor = CATEGORY_COLORS[storeItem.category] || CATEGORY_COLORS.OTHER;
  const condMeta = CONDITION_META[storeItem.condition];

  const specs =
    storeItem.product?.specifications &&
    typeof storeItem.product.specifications === 'object'
      ? (storeItem.product.specifications as Record<string, unknown>)
      : {};

  const primaryImageSrc = storeItem.imageUrl ?? storeItem.product?.primaryImage ?? null;
  const images: string[] = Array.isArray(storeItem.product?.images) && (storeItem.product!.images as string[]).length > 0
    ? (storeItem.product!.images as string[])
    : primaryImageSrc
    ? [primaryImageSrc]
    : [];

  return (
    <Box sx={{ pb: 10, pt: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/customer/products')}
        sx={{ color: '#64748b', mb: 3, fontWeight: 600, '&:hover': { color: '#0f172a' } }}
      >
        Back to Products
      </Button>

      <Grid container spacing={4}>
        {/* Image gallery */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              height: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#10b981', 0.03),
              mb: 1.5,
            }}
          >
            {selectedImage ? (
              <Box
                component="img"
                src={selectedImage}
                alt={storeItem.name}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 2 }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', color: '#94a3b8' }}>
                <InventoryIcon sx={{ fontSize: 72, opacity: 0.3 }} />
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.5 }}>
                  No image available
                </Typography>
              </Box>
            )}
          </Paper>

          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {images.map((img, idx) => (
                <Box
                  key={idx}
                  component="img"
                  src={img}
                  alt={`${storeItem.name} ${idx + 1}`}
                  onClick={() => setSelectedImage(img)}
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: selectedImage === img ? '#10b981' : 'divider',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: '#10b981' },
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* Info panel */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={CATEGORY_LABELS[storeItem.category] || storeItem.category}
              size="small"
              sx={{ bgcolor: catColor.bg, color: catColor.text, fontWeight: 600, fontSize: 12 }}
            />
            {condMeta && (
              <Chip
                label={condMeta.label}
                size="small"
                sx={{ bgcolor: condMeta.bg, color: condMeta.text, fontWeight: 600, fontSize: 12 }}
              />
            )}
            <Chip
              label={inStock ? `${storeItem.quantity} ${storeItem.unit} in stock` : 'Out of stock'}
              size="small"
              sx={{
                bgcolor: inStock ? '#dcfce7' : '#fee2e2',
                color: inStock ? '#166534' : '#991b1b',
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', lineHeight: 1.2, mb: 1 }}>
            {storeItem.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
            Item #: {storeItem.itemNumber}
            {storeItem.product?.productNumber && ` · Product #: ${storeItem.product.productNumber}`}
            {storeItem.product?.model && ` · Model: ${storeItem.product.model}`}
          </Typography>

          {storeItem.batchNumber && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Batch: {storeItem.batchNumber}
            </Typography>
          )}

          {storeItem.product?.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {storeItem.product.description}
            </Typography>
          )}

          {/* Key details */}
          <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
            {storeItem.product?.warranty && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>PRODUCT WARRANTY</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                  {storeItem.product.warranty}
                </Typography>
              </Box>
            )}
            {storeItem.warrantyExpiry && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>WARRANTY EXPIRES</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                  {new Date(storeItem.warrantyExpiry).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Typography>
              </Box>
            )}
            {storeItem.product?.leadTime && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>LEAD TIME</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                  {storeItem.product.leadTime} days
                </Typography>
              </Box>
            )}
            {storeItem.location && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>LOCATION</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                  {storeItem.location}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Quantity + add to order */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600} sx={{ mr: 2, color: '#64748b' }}>
                Quantity
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  sx={{ borderRadius: 0, color: '#64748b' }}
                  disabled={!inStock}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= storeItem.quantity) setQty(v);
                  }}
                  size="small"
                  disabled={!inStock}
                  inputProps={{
                    style: { textAlign: 'center', width: 48, fontWeight: 700 },
                    min: 1,
                    max: storeItem.quantity,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiInputBase-root': { borderRadius: 0 },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => setQty((q) => Math.min(q + 1, storeItem.quantity))}
                  sx={{ borderRadius: 0, color: '#64748b' }}
                  disabled={!inStock || qty >= storeItem.quantity}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              {inStock && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
                  max {storeItem.quantity}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={inCart ? <CheckIcon /> : <AddShoppingCartIcon />}
              onClick={handleAdd}
              disabled={!inStock}
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                flexGrow: 1,
                maxWidth: 260,
              }}
            >
              {!inStock ? 'Out of Stock' : inCart ? 'Update Order List' : 'Add to Order List'}
            </Button>

            {inCart && (
              <Button
                variant="outlined"
                startIcon={<ShoppingCartOutlinedIcon />}
                onClick={openCart}
                sx={{ borderColor: '#10b981', color: '#10b981', fontWeight: 700, borderRadius: 2 }}
              >
                View Order List
              </Button>
            )}
          </Box>

          {storeItem.notes && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              {storeItem.notes}
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Technical Specifications */}
      {Object.keys(specs).length > 0 && (
        <Box mt={5}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', mb: 2 }}>
            Technical Specifications
          </Typography>
          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}
          >
            <SpecTable specs={specs} />
          </Paper>
        </Box>
      )}

      {/* Tags */}
      {Array.isArray(storeItem.product?.tags) && (storeItem.product!.tags as string[]).length > 0 && (
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(storeItem.product!.tags as string[]).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 12 }}
              />
            ))}
          </Box>
        </Box>
      )}

      <CartDrawer />
      <CartFab />
    </Box>
  );
}
