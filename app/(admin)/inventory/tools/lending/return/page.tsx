// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { Box, CircularProgress, Alert } from '@mui/material';

// export default function ResolveToolReturnPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const toolId = searchParams.get('toolId');

//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (!toolId) {
//       setError('Tool ID missing');
//       return;
//     }

//     resolveActiveLending();
//   }, [toolId]);

//   const resolveActiveLending = async () => {
//     try {
//       const res = await fetch(
//         `/api/inventory/tools/lending?toolId=${toolId}&status=ISSUED&limit=1`,
//       );

//       const data = await res.json();

//       if (!data.lendings?.length) {
//         throw new Error('No active lending found for this tool');
//       }

//       const activeLending = data.lendings[0];

//       router.replace(`/inventory/tools/lending/${activeLending.id}/return`);
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   if (error) {
//     return <Alert severity="error">{error}</Alert>;
//   }

//   return (
//     <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
//       <CircularProgress />
//     </Box>
//   );
// }

import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ResolveToolReturnClient from './components/resolve-tool-return-client';

export default function ResolveToolReturnPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ResolveToolReturnClient />
    </Suspense>
  );
}
