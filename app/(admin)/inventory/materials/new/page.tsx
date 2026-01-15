// src/app/dashboard/inventory/materials/new/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MaterialFormData } from '@/types/inventory';
import MaterialForm from '@/components/inventory/material-form';

export default function CreateMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    // Fetch suppliers for dropdown
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/inventory/suppliers?limit=1000');
        const data = await res.json();
        setSuppliers(data.suppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async (data: MaterialFormData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create material');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/inventory/materials');
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
      <Typography variant="h4" fontWeight={600}>
        Add New Material
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a new material entry in your inventory
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Material created successfully! Redirecting...
        </Alert>
      )}

      <MaterialForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        suppliers={suppliers}
      />
    </Box>
  );
}
