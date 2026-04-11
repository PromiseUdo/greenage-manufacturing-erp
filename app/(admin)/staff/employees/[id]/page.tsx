// src/app/dashboard/staff/employees/[id]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { ArrowBack, LockReset } from '@mui/icons-material';

// DEPARTMENTS are now fetched from the database
interface Employee {
  id: string;
  employeeNumber: string;
  phone: string;
  address: string;
  department: string;
  departmentId: string | null;
  position?: string;
  notes?: string;
  appRoleId: string | null;

  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    departmentId: '',
    position: '',
    appRoleId: '',
    isActive: true,
    notes: '',
  });

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesRes, deptsRes] = await Promise.all([
          fetch('/api/settings/roles'),
          fetch('/api/settings/departments'),
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
        console.error('Failed to load settings data', e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchEmployee();
  }, [resolvedParams.id]);

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/employees/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch employee');
      }

      setEmployee(data);
      setFormData({
        name: data.user.name,
        phone: data.phone,
        address: data.address || '',
        departmentId: data.departmentId || '',
        position: data.position || '',
        appRoleId: data.appRoleId || '',
        isActive: data.user.isActive,
        notes: data.notes || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/employees/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      setSuccess('Employee updated successfully');
      setEmployee(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    router.push(`/staff/employees/${resolvedParams.id}/reset-password`);
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

  if (error && !employee) {
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
          Back to Employees
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
              Edit Employee
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee?.employeeNumber} • {employee?.user.email}
            </Typography>
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
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                variant="standard"
                type="email"
                disabled
                value={employee?.user.email}
                helperText="Email cannot be changed"
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
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                variant="standard"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={saving}
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
                disabled={saving || dbDepartments.length === 0}
              >
                {dbDepartments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="System Role"
                variant="standard"
                required
                value={formData.appRoleId}
                onChange={(e) => handleChange('appRoleId', e.target.value)}
                disabled={saving || dbRoles.length === 0}
              >
                {dbRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                variant="standard"
                required
                value={formData.isActive}
                onChange={(e) =>
                  handleChange('isActive', e.target.value === 'true')
                }
                disabled={saving}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
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
                disabled={saving}
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
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
