// // src/app/dashboard/inventory/grn/new/page.tsx

// 'use client';

// import { useState } from 'react';
// import { Box, Typography, Alert } from '@mui/material';
// import { useRouter } from 'next/navigation';
// import { GRNFormData } from '@/types/inventory';
// import GRNForm from '@/components/inventory/grn-form';

// export default function CreateGRNPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   const handleSubmit = async (data: GRNFormData) => {
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/inventory/grn', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to create GRN');
//       }

//       setSuccess(true);
//       setTimeout(() => {
//         router.push('/inventory/grn');
//       }, 1500);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     router.back();
//   };

//   return (
//     <Box>
//       <Typography variant="h6" fontWeight={600}>
//         Create Goods Received Note (GRN)
//       </Typography>
//       <Typography
//         variant="body1"
//         color="text.secondary"
//         sx={{ mb: 3, fontSize: 14 }}
//       >
//         Record receipt of materials from suppliers and update inventory stock
//       </Typography>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }}>
//           GRN created successfully! Inventory updated. Redirecting...
//         </Alert>
//       )}

//       <GRNForm
//         onSubmit={handleSubmit}
//         onCancel={handleCancel}
//         isLoading={loading}
//       />
//     </Box>
//   );
// }

// src/app/dashboard/inventory/grn/new/page.tsx

'use client';

import { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import GRNForm from '@/components/inventory/grn-form';
import { GRNFormData } from '@/types/inventory';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// export interface GRNFormData {
//   supplierId: string;
//   invoiceNumber?: string;
//   items: Array<{
//     materialId: string;
//     quantity: number;
//     batchNumber: string;
//     expiryDate?: string;
//     supplierBatchNo?: string;
//   }>;
//   notes?: string;
//   attachments?: FileAttachment[];
// }

export default function CreateGRNPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: GRNFormData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create GRN');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/inventory/grn');
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
        Create Goods Received Note (GRN)
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: 14 }}
      >
        Record receipt of materials from suppliers and update inventory stock
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          GRN created successfully! Inventory updated. Redirecting...
        </Alert>
      )}

      <GRNForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </Box>
  );
}
