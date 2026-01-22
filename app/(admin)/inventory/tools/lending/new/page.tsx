// 'use client';

// import { useState } from 'react';
// import { Box, Typography, Alert } from '@mui/material';
// import { useRouter } from 'next/navigation';
// import { ToolLendingFormData } from '@/types/tools';
// import ToolLendingForm from '@/components/inventory/tool-lending-form';
// import { useSearchParams } from 'next/navigation';

// export default function CreateToolLendingPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const preselectedToolId = searchParams.get('toolId');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   const handleSubmit = async (data: ToolLendingFormData) => {
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/inventory/tools/lending', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to issue tool');
//       }

//       setSuccess(true);

//       setTimeout(() => {
//         router.push('/inventory/tools');
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
//         Issue Tool / Equipment
//       </Typography>

//       <Typography
//         variant="body2"
//         color="text.secondary"
//         sx={{ mb: 3, fontSize: 14 }}
//       >
//         Assign a tool or equipment to a person, department, or project
//       </Typography>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }}>
//           Tool issued successfully! Redirecting…
//         </Alert>
//       )}

//       {/* <ToolLendingForm
//         onSubmit={handleSubmit}
//         onCancel={handleCancel}
//         isLoading={loading}
//       /> */}

//       <ToolLendingForm
//         onSubmit={handleSubmit}
//         onCancel={handleCancel}
//         isLoading={loading}
//         preselectedToolId={preselectedToolId}
//       />
//     </Box>
//   );
// }

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import CreateToolLendingClient from './components/create-tool-lending-client';

export default function CreateToolLendingPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      }
    >
      <CreateToolLendingClient />
    </Suspense>
  );
}
