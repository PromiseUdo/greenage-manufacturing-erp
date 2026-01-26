// 'use client';

// import { useEffect, useState } from 'react';
// import { Box, Typography, Alert, CircularProgress } from '@mui/material';
// import { useParams, useRouter } from 'next/navigation';

// import { ToolReturnFormData } from '@/types/tools';
// import ToolReturnForm from '@/components/inventory/tool-return-form';

// interface LendingDetails {
//   id: string;
//   issuedTo: string;
//   tool: {
//     name: string;
//     toolNumber: string;
//   };
// }

// export default function ToolReturnPage() {
//   const router = useRouter();
//   const { id } = useParams<{ id: string }>();

//   const [lending, setLending] = useState<LendingDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   useEffect(() => {
//     fetchLending();
//   }, [id]);

//   const fetchLending = async () => {
//     try {
//       const res = await fetch(`/api/inventory/tools/lending/details/${id}`);

//       if (!res.ok) {
//         throw new Error('Failed to load lending record');
//       }

//       const data = await res.json();
//       setLending(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (data: ToolReturnFormData) => {
//     setSubmitting(true);
//     setError('');

//     try {
//       const res = await fetch(`/api/inventory/tools/lending/${id}/return`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to return tool');
//       }

//       setSuccess(true);

//       setTimeout(() => {
//         router.push('/inventory/tools');
//       }, 1500);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleCancel = () => {
//     router.back();
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error && !lending) {
//     return <Alert severity="error">{error}</Alert>;
//   }

//   if (!lending) {
//     return <Alert severity="warning">Lending record not found</Alert>;
//   }

//   return (
//     <Box>
//       <Typography variant="h6" fontWeight={600} gutterBottom>
//         Return Tool / Equipment
//       </Typography>

//       <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//         Inspect the tool and complete the return process
//       </Typography>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }}>
//           Tool returned successfully! Redirecting…
//         </Alert>
//       )}

//       <ToolReturnForm
//         toolName={lending.tool.name}
//         toolNumber={lending.tool.toolNumber}
//         issuedTo={lending.issuedTo}
//         onSubmit={handleSubmit}
//         onCancel={handleCancel}
//         isLoading={submitting}
//       />
//     </Box>
//   );
// }

// src/app/dashboard/inventory/tools/lending/[id]/return/page.tsx - UPDATED

'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { ToolReturnFormData } from '@/types/tools';
import ToolReturnForm from '@/components/inventory/tool-return-form';

interface LendingDetails {
  id: string;
  issuedTo: string;
  tool: {
    name: string;
    toolId: string; // Changed from toolNumber to toolId
  };
}

export default function ToolReturnPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [lending, setLending] = useState<LendingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchLending();
  }, [id]);

  const fetchLending = async () => {
    try {
      const res = await fetch(`/api/inventory/tools/lending/details/${id}`);

      if (!res.ok) {
        throw new Error('Failed to load lending record');
      }

      const data = await res.json();
      setLending(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ToolReturnFormData) => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/inventory/tools/lending/${id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to return tool');
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/inventory/tools');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !lending) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!lending) {
    return <Alert severity="warning">Lending record not found</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Return Tool / Equipment
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Inspect the tool and complete the return process
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tool returned successfully! Redirecting…
        </Alert>
      )}

      <ToolReturnForm
        toolName={lending.tool.name}
        toolNumber={lending.tool.toolId} // Pass toolId as toolNumber for display
        issuedTo={lending.issuedTo}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </Box>
  );
}
