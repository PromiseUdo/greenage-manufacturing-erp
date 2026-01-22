// src/app/dashboard/inventory/tools/[id]/edit/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { ToolFormData } from '@/types/tools';
import ToolForm from '@/components/inventory/tool-form';

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ToolFormData> | null>(
    null,
  );

  useEffect(() => {
    fetchTool();
  }, [toolId]);

  const fetchTool = async () => {
    try {
      const res = await fetch(`/api/inventory/tools/${toolId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch tool');
      }

      const tool = await res.json();

      setInitialData({
        name: tool.name,
        toolNumber: tool.toolNumber,
        category: tool.category,
        description: tool.description || '',
        serialNumber: tool.serialNumber || '',
        manufacturer: tool.manufacturer || '',
        purchaseDate: tool.purchaseDate
          ? tool.purchaseDate.split('T')[0]
          : undefined,
        purchaseCost: tool.purchaseCost || undefined,
        location: tool.location || '',
        condition: tool.condition,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load tool');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ToolFormData) => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/inventory/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update tool');
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/inventory/tools/${toolId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!initialData) {
    return <Alert severity="error">Tool not found</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Edit Tool / Equipment
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update tool or equipment information
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tool updated successfully! Redirecting…
        </Alert>
      )}

      <ToolForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </Box>
  );
}
