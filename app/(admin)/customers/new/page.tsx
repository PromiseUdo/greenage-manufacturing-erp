// src/app/dashboard/customers/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    createPortalAccess: false,
    portalEmail: '',
    portalPassword: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }

      if (data.credentials) {
        setCredentials(data.credentials);
        setShowCredentials(true);
      } else {
        router.push('/customers');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}\nNote: Customer can change password after login`;
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    setShowCredentials(false);
    router.push('/customers');
  };

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
        <Typography variant="h6" fontWeight={600}>
          Add New Customer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new customer account
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0 }}>
                Customer Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Customer Name"
                variant="standard"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading}
                helperText="Company or individual name"
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
                disabled={loading}
                helperText="Optional - for invoices/quotes"
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
                disabled={loading}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contact Person"
                variant="standard"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                disabled={loading}
                helperText="Optional - main point of contact"
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
                disabled={loading}
              />
            </Grid>

            {/* Portal Access */}
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.createPortalAccess}
                    onChange={(e) =>
                      handleChange('createPortalAccess', e.target.checked)
                    }
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Create Portal Access
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow customer to login and view orders/invoices
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {formData.createPortalAccess && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Portal credentials will be created for customer login.
                  </Alert>
                  {/* <Alert severity="info" sx={{ mb: 2 }}>
                    Portal credentials will be created for customer login.
                    Unlike employees, customers are not required to change their
                    password on first login.
                  </Alert> */}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Portal Email"
                    variant="standard"
                    type="email"
                    required={formData.createPortalAccess}
                    value={formData.portalEmail}
                    onChange={(e) =>
                      handleChange('portalEmail', e.target.value)
                    }
                    disabled={loading}
                    helperText="Email for customer login"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Portal Password"
                    variant="standard"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.portalPassword}
                    onChange={(e) =>
                      handleChange('portalPassword', e.target.value)
                    }
                    disabled={loading}
                    helperText="Leave blank for auto-generated password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Actions */}
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: '#0F172A',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Credentials Dialog */}
      <Dialog
        open={showCredentials}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white' }}>
          Customer Created Successfully
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Customer account has been created with portal access. Please share
            these credentials with the customer.
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
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Portal Email
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {credentials?.email}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Password
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ fontFamily: 'monospace' }}
                >
                  {credentials?.password}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ fontSize: 13 }}>
                  Customer can change password after login (not required)
                </Alert>
              </Grid>
            </Grid>

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
            onClick={handleClose}
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
