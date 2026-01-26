// 'use client';

// import { useState } from 'react';
// import { Box, Typography, Alert } from '@mui/material';
// import { useRouter } from 'next/navigation';
// import { ToolFormData } from '@/types/tools';
// import ToolForm from '@/components/inventory/tool-form';
// import ToolGroupForm from '@/components/inventory/tool-group-form';

// export default function CreateToolPage() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   const handleSubmit = async (data: ToolFormData) => {
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/inventory/tools', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to create tool');
//       }

//       setSuccess(true);

//       setTimeout(() => {
//         router.push('/inventory/tools');
//       }, 1500);
//     } catch (err: any) {
//       setError(err.message || 'Something went wrong');
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
//         Add New Tool / Equipment
//       </Typography>

//       <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//         Register a new tool or equipment in your inventory
//       </Typography>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }}>
//           Tool created successfully! Redirecting…
//         </Alert>
//       )}

//       <ToolGroupForm
//         onSubmit={handleSubmit}
//         onCancel={handleCancel}
//         isLoading={loading}
//       />
//     </Box>
//   );
// }

// src/app/dashboard/inventory/tools/new/page.tsx

'use client';

import { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import ToolGroupForm from '@/components/inventory/tool-group-form';

// Define the form data type to match ToolGroupForm
interface ToolGroupFormData {
  name: string;
  category: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unitCost?: number;
  purchaseDate?: string;
  location?: string;
  condition: string;
  isGrouped: boolean;
}

export default function CreateToolPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ToolGroupFormData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create tool');
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/inventory/tools');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
        Add New Tool / Equipment
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register a new tool or equipment in your inventory
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tool created successfully! Redirecting…
        </Alert>
      )}

      <ToolGroupForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </Box>
  );
}
