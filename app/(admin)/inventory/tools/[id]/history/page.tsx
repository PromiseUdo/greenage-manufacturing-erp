// // src/app/dashboard/inventory/tools/[id]/history/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Chip,
//   CircularProgress,
//   Alert,
//   Button,
//   TextField,
//   MenuItem,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
// import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
// import { useRouter, useParams } from 'next/navigation';
// import { format } from 'date-fns';

// interface Tool {
//   id: string;
//   name: string;
//   toolNumber: string;
// }

// interface Lending {
//   id: string;
//   issuedTo: string;
//   department?: string;
//   purpose?: string;
//   projectName?: string;
//   orderId?: string;
//   issuedBy: string;
//   issuedAt: string;
//   expectedReturn?: string;
//   returnedAt?: string;
//   returnedTo?: string;
//   returnCondition?: string;
//   returnNotes?: string;
//   status: string;
// }

// const LENDING_STATUSES = [
//   { value: '', label: 'All Statuses' },
//   { value: 'ISSUED', label: 'Issued' },
//   { value: 'RETURNED', label: 'Returned' },
//   { value: 'OVERDUE', label: 'Overdue' },
// ];

// export default function LendingHistoryPage() {
//   const router = useRouter();
//   const params = useParams();
//   const toolId = params.id as string;

//   const [tool, setTool] = useState<Tool | null>(null);
//   const [lendings, setLendings] = useState<Lending[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [statusFilter, setStatusFilter] = useState('');

//   useEffect(() => {
//     fetchData();
//   }, [toolId, page, limit, statusFilter]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         toolId,
//         page: page.toString(),
//         limit: limit.toString(),
//         ...(statusFilter && { status: statusFilter }),
//       });

//       const [toolRes, lendingsRes] = await Promise.all([
//         fetch(`/api/inventory/tools/${toolId}`),
//         fetch(`/api/inventory/tools/lending?${params}`),
//       ]);

//       if (!toolRes.ok) {
//         throw new Error('Failed to fetch tool');
//       }

//       const toolData = await toolRes.json();
//       const lendingsData = await lendingsRes.json();

//       setTool(toolData);
//       setLendings(lendingsData.lendings || []);
//       setTotal(lendingsData.pagination?.total || 0);
//     } catch (err: any) {
//       setError(err.message || 'Failed to load data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'RETURNED':
//         return 'success';
//       case 'ISSUED':
//         return 'warning';
//       case 'OVERDUE':
//         return 'error';
//       default:
//         return 'default';
//     }
//   };

//   if (error) {
//     return <Alert severity="error">{error}</Alert>;
//   }

//   return (
//     <Box>
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Button
//           startIcon={<ArrowBackIcon />}
//           onClick={() => router.back()}
//           sx={{ mb: 2 }}
//         >
//           Back
//         </Button>

//         {tool && (
//           <>
//             <Typography variant="h4" fontWeight={600} gutterBottom>
//               Lending History
//             </Typography>
//             <Typography variant="body1" color="text.secondary">
//               {tool.name} ({tool.toolNumber})
//             </Typography>
//           </>
//         )}
//       </Box>

//       {/* Filters */}
//       <Box sx={{ mb: 3 }}>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={4}>
//             <TextField
//               fullWidth
//               select
//               label="Status"
//               value={statusFilter}
//               onChange={(e) => {
//                 setStatusFilter(e.target.value);
//                 setPage(1);
//               }}
//             >
//               {LENDING_STATUSES.map((option) => (
//                 <MenuItem key={option.value} value={option.value}>
//                   {option.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>
//         </Grid>
//       </Box>

//       {/* History Table */}
//       <Paper>
//         {loading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           <>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>
//                       <strong>Issued To</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Department</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Purpose / Project</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Issued By</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Issued Date</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Expected Return</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Returned Date</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Return Condition</strong>
//                     </TableCell>
//                     <TableCell>
//                       <strong>Status</strong>
//                     </TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {lendings.length === 0 ? (
//                     <TableRow>
//                       <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
//                         <Typography variant="body1" color="text.secondary">
//                           No lending history found
//                         </Typography>
//                       </TableCell>
//                     </TableRow>
//                   ) : (
//                     lendings.map((lending) => (
//                       <TableRow key={lending.id} hover>
//                         <TableCell>
//                           <Typography variant="body2" fontWeight={500}>
//                             {lending.issuedTo}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>{lending.department || '-'}</TableCell>
//                         <TableCell>
//                           {lending.purpose || lending.projectName || '-'}
//                           {lending.orderId && (
//                             <Typography
//                               variant="caption"
//                               display="block"
//                               color="text.secondary"
//                             >
//                               Order: {lending.orderId}
//                             </Typography>
//                           )}
//                         </TableCell>
//                         <TableCell>{lending.issuedBy}</TableCell>
//                         <TableCell>
//                           {format(new Date(lending.issuedAt), 'MMM dd, yyyy')}
//                           <Typography
//                             variant="caption"
//                             display="block"
//                             color="text.secondary"
//                           >
//                             {format(new Date(lending.issuedAt), 'h:mm a')}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>
//                           {lending.expectedReturn
//                             ? format(
//                                 new Date(lending.expectedReturn),
//                                 'MMM dd, yyyy',
//                               )
//                             : '-'}
//                         </TableCell>
//                         <TableCell>
//                           {lending.returnedAt ? (
//                             <>
//                               {format(
//                                 new Date(lending.returnedAt),
//                                 'MMM dd, yyyy',
//                               )}
//                               <Typography
//                                 variant="caption"
//                                 display="block"
//                                 color="text.secondary"
//                               >
//                                 {format(new Date(lending.returnedAt), 'h:mm a')}
//                               </Typography>
//                               {lending.returnedTo && (
//                                 <Typography
//                                   variant="caption"
//                                   display="block"
//                                   color="text.secondary"
//                                 >
//                                   To: {lending.returnedTo}
//                                 </Typography>
//                               )}
//                             </>
//                           ) : (
//                             '-'
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           {lending.returnCondition ? (
//                             <>
//                               <Chip
//                                 label={lending.returnCondition.replace(
//                                   /_/g,
//                                   ' ',
//                                 )}
//                                 size="small"
//                                 variant="outlined"
//                               />
//                               {lending.returnNotes && (
//                                 <Typography
//                                   variant="caption"
//                                   display="block"
//                                   color="text.secondary"
//                                   sx={{ mt: 0.5 }}
//                                 >
//                                   {lending.returnNotes}
//                                 </Typography>
//                               )}
//                             </>
//                           ) : (
//                             '-'
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           <Chip
//                             label={lending.status}
//                             color={getStatusColor(lending.status) as any}
//                             size="small"
//                           />
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//             <TablePagination
//               rowsPerPageOptions={[10, 20, 50]}
//               component="div"
//               count={total}
//               rowsPerPage={limit}
//               page={page - 1}
//               onPageChange={(_, newPage) => setPage(newPage + 1)}
//               onRowsPerPageChange={(e) => {
//                 setLimit(parseInt(e.target.value));
//                 setPage(1);
//               }}
//             />
//           </>
//         )}
//       </Paper>
//     </Box>
//   );
// }

// src/app/dashboard/inventory/tools/[id]/history/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import LendingHistoryTable from '@/components/inventory/lending-history-table';

interface Tool {
  id: string;
  name: string;
  toolNumber: string;
}

interface Lending {
  id: string;
  issuedTo: string;
  department?: string;
  purpose?: string;
  projectName?: string;
  orderId?: string;
  issuedBy: string;
  issuedAt: string;
  expectedReturn?: string;
  returnedAt?: string;
  returnedTo?: string;
  returnCondition?: string;
  returnNotes?: string;
  status: string;
}

const LENDING_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export default function LendingHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [toolId, page, limit, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        toolId,
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter && { status: statusFilter }),
      });

      const [toolRes, lendingsRes] = await Promise.all([
        fetch(`/api/inventory/tools/${toolId}`),
        fetch(`/api/inventory/tools/lending?${params}`),
      ]);

      if (!toolRes.ok) {
        throw new Error('Failed to fetch tool');
      }

      const toolData = await toolRes.json();
      const lendingsData = await lendingsRes.json();

      setTool(toolData);
      setLendings(lendingsData.lendings || []);
      setTotal(lendingsData.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{
            mb: 2,
            color: '#64748B',
            '&:hover': {
              bgcolor: '#F1F5F9',
              color: '#0F172A',
            },
          }}
        >
          Back
        </Button>

        {tool && (
          <>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Lending History
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: 14 }}
            >
              {tool.name} ({tool.toolNumber})
            </Typography>
          </>
        )}
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Status"
              size="small"
              value={statusFilter}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#475569',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {LENDING_STATUSES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* History Table */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading lending history...
          </Typography>
        </Paper>
      ) : (
        <LendingHistoryTable
          lendings={lendings}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}
    </Box>
  );
}
