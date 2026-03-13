// src/app/dashboard/staff/employees/new/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';

// DEPARTMENTS are now fetched from the database

// Removing static roles
// const ROLES = [...]

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    departmentId: '',
    position: '',
    appRoleId: '',
    password: '',
    notes: '',
  });

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesRes, deptsRes] = await Promise.all([
          fetch("/api/settings/roles"),
          fetch("/api/settings/departments")
        ]);

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setDbRoles(rolesData);
        }

        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDbDepartments(deptsData);
        }
      } catch (e) {
        console.error("Failed to load settings data", e);
      }
    };
    loadData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      setCredentials(data.credentials);
      setShowCredentials(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.defaultPassword}\nNote: Password must be changed on first login`;
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    setShowCredentials(false);
    router.push('/staff/employees');
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
          Back to Employees
        </Button>
        <Typography variant="h6" fontWeight={600}>
          Add New Employee
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new staff member account with login credentials
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
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                variant="standard"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                variant="standard"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                variant="standard"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* Employment Details */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Employment Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Department"
                variant="standard"
                required
                value={formData.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                disabled={loading}
              >
                {dbDepartments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position/Job Title"
                variant="standard"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                disabled={loading}
              />
            </Grid> */}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="System Role"
                variant="standard"
                required
                value={formData.appRoleId}
                onChange={(e) => handleChange('appRoleId', e.target.value)}
                disabled={loading}
              >
                {dbRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Login Credentials */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Login Credentials
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Leave password blank to auto-generate. Employee will be required
                to change password on first login.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password (Optional)"
                variant="standard"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
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

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                variant="standard"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
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
                    bgcolor: '#0F172A',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  {loading ? 'Creating...' : 'Create Employee'}
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
          Employee Created Successfully
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Employee account has been created. Please share these credentials
            with the employee.
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
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {credentials?.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Temporary Password
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ fontFamily: 'monospace' }}
                >
                  {credentials?.defaultPassword}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ fontSize: 13 }}>
                  Employee must change this password on first login
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
