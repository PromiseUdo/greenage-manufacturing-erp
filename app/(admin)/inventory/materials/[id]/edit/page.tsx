// src/app/dashboard/inventory/materials/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { MaterialFormData, MaterialWithRelations } from '@/types/inventory';
import MaterialForm from '@/components/inventory/material-form';

export default function EditMaterialPage() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [material, setMaterial] = useState<MaterialWithRelations | null>(null);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch material and suppliers in parallel
      const [materialRes, suppliersRes] = await Promise.all([
        fetch(`/api/inventory/materials/${params.id}`),
        fetch('/api/inventory/suppliers?limit=1000'),
      ]);

      if (!materialRes.ok) {
        throw new Error('Material not found');
      }

      const [materialData, suppliersData] = await Promise.all([
        materialRes.json(),
        suppliersRes.json(),
      ]);

      setMaterial(materialData);
      setSuppliers(suppliersData.suppliers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: MaterialFormData) => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/inventory/materials/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update material');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/inventory/materials/${params.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/inventory/materials/${params.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !material) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Edit Material
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: '14px' }}
      >
        Update material information - Part Number:{' '}
        <strong>{material?.partNumber}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Material updated successfully! Redirecting...
        </Alert>
      )}

      {material && (
        <MaterialForm
          initialData={{
            name: material.name,
            partNumber: material.partNumber,
            category: material.category,
            unit: material.unit,
            currentStock: material.currentStock,
            reorderLevel: material.reorderLevel,
            maxStockLevel: material.maxStockLevel || undefined,
            unitCost: material.unitCost || undefined,
            supplierId: material.supplierId || '',
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
          suppliers={suppliers}
        />
      )}
    </Box>
  );
}
