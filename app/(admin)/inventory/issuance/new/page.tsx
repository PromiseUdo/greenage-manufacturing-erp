// src/app/dashboard/inventory/issuance/new/page.tsx

'use client';

import { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MaterialIssuanceFormData } from '@/types/inventory';
import MaterialIssuanceForm from '@/components/inventory/material-issuance-form';

export default function MaterialIssuancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: MaterialIssuanceFormData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/issuances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to issue material');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/inventory/issuance');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Issue Material
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: '14px' }}
      >
        Issue materials from inventory to production or other departments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Material issued successfully! Stock updated. Redirecting...
        </Alert>
      )}

      <MaterialIssuanceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </Box>
  );
}
