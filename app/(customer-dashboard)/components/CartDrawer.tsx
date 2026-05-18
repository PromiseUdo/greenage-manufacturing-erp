'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useCartStore } from '@/lib/stores/cartStore';

const DRAWER_WIDTH = 420;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(n);

export function CartFab() {
  const { totalItems, openCart } = useCartStore();
  const count = totalItems();

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}>
      <Badge
        badgeContent={count}
        color="error"
        overlap="circular"
        sx={{ '& .MuiBadge-badge': { fontSize: 11, fontWeight: 700 } }}
      >
        <Button
          variant="contained"
          onClick={openCart}
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            minWidth: 'unset',
            bgcolor: '#10b981',
            boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
            '&:hover': { bgcolor: '#059669', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' },
          }}
        >
          <ShoppingCartOutlinedIcon />
        </Button>
      </Badge>
    </Box>
  );
}

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
  } = useCartStore();

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ quoteNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/quotes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ storeItemId: i.storeItemId, quantity: i.quantity })),
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit order request');

      setSuccess({ quoteNumber: data.quoteNumber });
      clearCart();
      setNotes('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSuccess(null);
    closeCart();
    router.push('/customer/quotes');
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={closeCart}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#0f172a',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartOutlinedIcon sx={{ color: '#10b981', fontSize: '1.3rem' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', fontSize: '1rem' }}>
            Order Request
          </Typography>
          {items.length > 0 && (
            <Chip
              label={items.length}
              size="small"
              sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 700, height: 20, fontSize: 11 }}
            />
          )}
        </Box>
        <IconButton onClick={closeCart} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        {success ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 6,
              gap: 2,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10b981' }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
              Order Request Submitted!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Your request has been received as quote{' '}
              <strong>{success.quoteNumber}</strong>. Our team will review and
              send you a formal quote shortly.
            </Typography>
            <Button
              variant="contained"
              onClick={handleDone}
              sx={{ mt: 1, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2 }}
            >
              View My Quotes
            </Button>
          </Box>
        ) : items.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <ShoppingCartOutlinedIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Your order list is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Browse products and add them here
            </Typography>
            <Button onClick={closeCart} sx={{ color: '#10b981', mt: 1, fontWeight: 600 }}>
              Browse Products
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Box
                key={item.storeItemId}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#f8fafc',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Thumbnail */}
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 1.5,
                      bgcolor: alpha('#10b981', 0.08),
                      flexShrink: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.primaryImage ? (
                      <Box
                        component="img"
                        src={item.primaryImage}
                        alt={item.itemName}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 20 }}>📦</Typography>
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{ color: '#0f172a' }}
                    >
                      {item.itemName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.itemNumber}
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => removeItem(item.storeItemId)}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' }, p: 0.5 }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 1.5,
                  }}
                >
                  {/* Quantity controls */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: '#fff',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      px: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.storeItemId, item.quantity - 1)}
                      sx={{ p: 0.5, color: '#64748b' }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ minWidth: 24, textAlign: 'center', color: '#0f172a' }}
                    >
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.storeItemId, item.quantity + 1)}
                      disabled={item.quantity >= item.availableStock}
                      sx={{ p: 0.5, color: '#64748b' }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    {item.unitPrice > 0 ? (
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Price on quote
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Stock: {item.availableStock}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {items.length > 0 && !success && (
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#f8fafc',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: 13 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Additional notes (optional)"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery preferences, special requirements..."
            sx={{ mb: 2 }}
          />

          <Divider sx={{ mb: 2 }} />

          {totalAmount() > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Estimated total
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ color: '#0f172a' }}>
                {formatCurrency(totalAmount())}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Final pricing will be confirmed in your quote. Our team will review
            and send a formal quote within 24–48 hours.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              fontWeight: 700,
              borderRadius: 2,
              py: 1.5,
              fontSize: '0.9rem',
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              'Submit Order Request'
            )}
          </Button>

          <Button
            fullWidth
            onClick={clearCart}
            sx={{ mt: 1, color: '#94a3b8', fontSize: '0.8rem' }}
          >
            Clear all
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
