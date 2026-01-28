// src/app/dashboard/customers/[id]/page.tsx

'use client';

import { useState, useEffect, use, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  VpnKey,
  VpnKeyOff,
  ContentCopy,
  Visibility,
  VisibilityOff,
  Delete,
  ShoppingCart,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'portal' ? 1 : 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(initialTab);
  const [customer, setCustomer] = useState<any>(null);

  // Portal access states
  const [showPortalDialog, setShowPortalDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  useEffect(() => {
    fetchCustomer();
  }, [resolvedParams.id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch customer');
      }

      setCustomer(data);
      setFormData({
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        address: data.address,
        contactPerson: data.contactPerson || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/customers/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      setCustomer(data);
      setSuccess('Customer updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPortalAccess = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(
        `/api/customers/${resolvedParams.id}/portal-access`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: portalEmail,
            password: portalPassword || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to grant portal access');
      }

      setCredentials(data.credentials);
      setShowPortalDialog(false);
      setShowCredentials(true);
      fetchCustomer();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePortalAccess = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(
        `/api/customers/${resolvedParams.id}/portal-access`,
        {
          method: 'DELETE',
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove portal access');
      }

      setShowRemoveDialog(false);
      setSuccess('Portal access removed successfully');
      fetchCustomer();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !customer) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Customers
        </Button>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {customer?.name}
            </Typography>
            <Box
              sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                {customer?.phone}
              </Typography>
              {customer?.userId && (
                <Chip
                  label="Portal Enabled"
                  size="small"
                  color="success"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#166534',
                  }}
                  icon={<VpnKey />}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            sx={{
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.5px',
            }}
            label="Customer Details"
          />
          <Tab
            sx={{
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.5px',
            }}
            label="Portal Access"
          />
          <Tab
            sx={{
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.5px',
            }}
            label="Orders"
          />
        </Tabs>

        {/* Customer Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleSubmit} sx={{ px: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  variant="standard"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Business Email"
                  variant="standard"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  variant="standard"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  variant="standard"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    handleChange('contactPerson', e.target.value)
                  }
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  variant="standard"
                  required
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-end',
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{
                      bgcolor: '#0F172A',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: '#1e293b' },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Portal Access Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 2 }}>
            {customer?.userId ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Portal access is enabled for this customer
                </Alert>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Portal Email
                  </Typography>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    {customer.user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Customer can login with this email to view orders and
                    invoices
                  </Typography>
                </Paper>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<VpnKeyOff />}
                  onClick={() => setShowRemoveDialog(true)}
                  sx={{ mt: 3 }}
                >
                  Remove Portal Access
                </Button>
              </Box>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  This customer does not have portal access yet
                </Alert>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Grant portal access to allow the customer to login and view
                  their orders, quotes, and invoices.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<VpnKey />}
                  onClick={() => setShowPortalDialog(true)}
                  sx={{
                    bgcolor: '#0F172A',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  Grant Portal Access
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 2 }}>
            {customer?.orders && customer.orders.length > 0 ? (
              <List>
                {customer.orders.map((order: any) => (
                  <ListItem
                    key={order.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {order.orderNumber}
                          </Typography>
                          <Chip label={order.status} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            Quantity: {order.quantity}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Delivery:{' '}
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ShoppingCart
                  sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No orders yet
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Grant Portal Access Dialog */}
      <Dialog
        open={showPortalDialog}
        onClose={() => !saving && setShowPortalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grant Portal Access</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Create login credentials for customer portal access. Unlike
            employees, customers are not required to change password on first
            login.
          </Alert>

          <TextField
            fullWidth
            label="Portal Email"
            type="email"
            required
            value={portalEmail}
            onChange={(e) => setPortalEmail(e.target.value)}
            disabled={saving}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password (Optional)"
            type={showPassword ? 'text' : 'password'}
            value={portalPassword}
            onChange={(e) => setPortalPassword(e.target.value)}
            disabled={saving}
            helperText="Leave blank for auto-generated password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowPortalDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGrantPortalAccess}
            disabled={saving || !portalEmail}
            sx={{
              bgcolor: '#0F172A',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            {saving ? 'Creating...' : 'Grant Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Portal Access Dialog */}
      <Dialog
        open={showRemoveDialog}
        onClose={() => !saving && setShowRemoveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Portal Access?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This will disable the customer's ability to login to the portal. The
            customer record will be preserved.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowRemoveDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemovePortalAccess}
            disabled={saving}
          >
            {saving ? 'Removing...' : 'Remove Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog
        open={showCredentials}
        onClose={() => setShowCredentials(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white' }}>
          Portal Access Created
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Portal credentials created successfully. Share these with the
            customer.
          </Alert>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: '#f8fafc',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              {credentials?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Password
            </Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{ fontFamily: 'monospace' }}
              gutterBottom
            >
              {credentials?.password}
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleCopyCredentials}
              sx={{ mt: 2 }}
            >
              Copy Credentials
            </Button>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowCredentials(false)}
            variant="contained"
            sx={{
              bgcolor: '#0F172A',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
