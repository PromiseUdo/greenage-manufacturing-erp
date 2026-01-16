// // src/app/dashboard/inventory/grn/page.tsx

// 'use client';
// import dynamic from 'next/dynamic';

// import React, { useEffect, useState } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Chip,
//   Card,
//   CardContent,
//   IconButton,
//   Collapse,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TableFooter,
//   TextField,
//   InputAdornment,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';

// import {
//   Add as AddIcon,
//   TrendingUp as TrendingUpIcon,
//   LocalShipping as ShippingIcon,
//   ExpandMore as ExpandIcon,
//   ExpandLess as CollapseIcon,
//   Visibility as ViewIcon,
//   Search as SearchIcon,
// } from '@mui/icons-material';

// import { useRouter } from 'next/navigation';
// import { format } from 'date-fns';
// import { GRNWithSupplier } from '@/types/inventory';

// const ClientTablePagination = dynamic(
//   () => import('@mui/material/TablePagination'),
//   { ssr: false }
// );

// export default function GRNPage() {
//   const router = useRouter();
//   const [grns, setGrns] = useState<GRNWithSupplier[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [expandedGRN, setExpandedGRN] = useState<string | null>(null);
//   const [selectedGRN, setSelectedGRN] = useState<GRNWithSupplier | null>(null);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [stats, setStats] = useState({
//     totalGRNs: 0,
//     last7Days: 0,
//     last30Days: 0,
//   });

//   useEffect(() => {
//     fetchGRNs();
//     fetchStats();
//   }, [page, limit]);

//   const fetchGRNs = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//       });

//       const res = await fetch(`/api/inventory/grn?${params}`);
//       const data = await res.json();
//       setGrns(data.grns);
//       setTotal(data.pagination.total);
//     } catch (error) {
//       console.error('Error fetching GRNs:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const res = await fetch('/api/inventory/grn?limit=1000');
//       const data = await res.json();

//       const now = new Date();
//       const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//       const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

//       const last7Days = data.grns.filter(
//         (g: any) => new Date(g.receivedDate) >= sevenDaysAgo
//       ).length;

//       const last30Days = data.grns.filter(
//         (g: any) => new Date(g.receivedDate) >= thirtyDaysAgo
//       ).length;

//       setStats({
//         totalGRNs: data.pagination.total,
//         last7Days,
//         last30Days,
//       });
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   const handleToggleExpand = (grnId: string) => {
//     setExpandedGRN(expandedGRN === grnId ? null : grnId);
//   };

//   const handleViewDetails = (grn: GRNWithSupplier) => {
//     setSelectedGRN(grn);
//     setDialogOpen(true);
//   };

//   const getTotalItems = (items: any) => {
//     if (Array.isArray(items)) {
//       return items.length;
//     }
//     return 0;
//   };

//   const getTotalQuantity = (batches: any[]) => {
//     return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
//   };

//   return (
//     <Box>
//       {/* Header */}
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           mb: 3,
//         }}
//       >
//         <Box>
//           <Typography variant="h4" fontWeight={600}>
//             Goods Received Notes (GRN)
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Track all materials received from suppliers
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={() => router.push('/inventory/grn/new')}
//         >
//           Create GRN
//         </Button>
//       </Box>

//       {/* Statistics Cards */}
//       {/* <Grid container spacing={3} sx={{ mb: 3 }}>
//         <Grid item xs={12} md={4}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <Box
//                   sx={{
//                     backgroundColor: 'success.light',
//                     borderRadius: 2,
//                     p: 1,
//                     display: 'flex',
//                     mr: 2,
//                   }}
//                 >
//                   <TrendingUpIcon sx={{ color: 'success.main' }} />
//                 </Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Total GRNs
//                 </Typography>
//               </Box>
//               <Typography variant="h4" fontWeight={600}>
//                 {stats.totalGRNs}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={4}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <Box
//                   sx={{
//                     backgroundColor: 'primary.light',
//                     borderRadius: 2,
//                     p: 1,
//                     display: 'flex',
//                     mr: 2,
//                   }}
//                 >
//                   <ShippingIcon sx={{ color: 'primary.main' }} />
//                 </Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Last 7 Days
//                 </Typography>
//               </Box>
//               <Typography variant="h4" fontWeight={600}>
//                 {stats.last7Days}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={4}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <Box
//                   sx={{
//                     backgroundColor: 'info.light',
//                     borderRadius: 2,
//                     p: 1,
//                     display: 'flex',
//                     mr: 2,
//                   }}
//                 >
//                   <ShippingIcon sx={{ color: 'info.main' }} />
//                 </Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Last 30 Days
//                 </Typography>
//               </Box>
//               <Typography variant="h4" fontWeight={600}>
//                 {stats.last30Days}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid> */}

//       <Paper
//         elevation={0}
//         sx={{
//           p: 2,
//           mb: 3,
//           borderRadius: 2,
//           border: '1px solid',
//           borderColor: 'divider',
//           bgcolor: 'background.paper',
//         }}
//       >
//         <TextField
//           fullWidth
//           size="small"
//           placeholder="Search by batch number or issued by..."
//           // value={search}
//           // onChange={handleSearchChange}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon fontSize="small" />
//               </InputAdornment>
//             ),
//           }}
//           sx={{ maxWidth: 500, fontSize: 14 }}
//         />
//       </Paper>

//       {/* GRNs Table */}
//       <Paper>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell width={50}></TableCell>
//                 <TableCell>
//                   <strong>GRN Number</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Date Received</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Supplier</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Invoice No.</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Items</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Total Qty</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Received By</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Actions</strong>
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {grns.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body1" color="text.secondary">
//                       No GRNs found
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{ mt: 1 }}
//                     >
//                       Create your first GRN to get started
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 grns.map((grn) => (
//                   <React.Fragment key={grn.id}>
//                     <TableRow hover>
//                       <TableCell>
//                         <IconButton
//                           size="small"
//                           onClick={() => handleToggleExpand(grn.id)}
//                         >
//                           {expandedGRN === grn.id ? (
//                             <CollapseIcon />
//                           ) : (
//                             <ExpandIcon />
//                           )}
//                         </IconButton>
//                       </TableCell>
//                       <TableCell>
//                         <Chip
//                           label={grn.grnNumber}
//                           color="success"
//                           variant="outlined"
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Box>
//                           <Typography variant="body2" fontWeight={600}>
//                             {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
//                           </Typography>
//                           <Typography variant="caption" color="text.secondary">
//                             {format(new Date(grn.receivedDate), 'hh:mm a')}
//                           </Typography>
//                         </Box>
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" fontWeight={500}>
//                           {grn.supplier.name}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         {grn.invoiceNumber ? (
//                           <Chip
//                             label={grn.invoiceNumber}
//                             size="small"
//                             variant="outlined"
//                           />
//                         ) : (
//                           '-'
//                         )}
//                       </TableCell>
//                       <TableCell align="center">
//                         <Chip
//                           label={getTotalItems(grn.items)}
//                           size="small"
//                           color="primary"
//                         />
//                       </TableCell>
//                       <TableCell align="center">
//                         <Typography
//                           variant="body2"
//                           fontWeight={600}
//                           color="success.main"
//                         >
//                           +{getTotalQuantity(grn.batches || [])}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" color="text.secondary">
//                           {grn.receivedBy}
//                         </Typography>
//                       </TableCell>
//                       <TableCell align="center">
//                         <IconButton
//                           size="small"
//                           onClick={() => handleViewDetails(grn)}
//                         >
//                           <ViewIcon fontSize="small" />
//                         </IconButton>
//                       </TableCell>
//                     </TableRow>

//                     {/* Expanded Row - Items Details */}
//                     {expandedGRN === grn.id && grn.batches && (
//                       <TableRow>
//                         <TableCell colSpan={9} sx={{ py: 0 }}>
//                           <Collapse
//                             in={expandedGRN === grn.id}
//                             timeout="auto"
//                             unmountOnExit
//                           >
//                             <Box sx={{ p: 3, backgroundColor: 'grey.50' }}>
//                               <Typography variant="h6" gutterBottom>
//                                 Received Items
//                               </Typography>
//                               <Table size="small">
//                                 <TableHead>
//                                   <TableRow>
//                                     <TableCell>
//                                       <strong>Material</strong>
//                                     </TableCell>
//                                     <TableCell>
//                                       <strong>Part Number</strong>
//                                     </TableCell>
//                                     <TableCell align="right">
//                                       <strong>Quantity</strong>
//                                     </TableCell>
//                                     <TableCell>
//                                       <strong>Batch Number</strong>
//                                     </TableCell>
//                                     <TableCell>
//                                       <strong>Supplier Batch</strong>
//                                     </TableCell>
//                                     <TableCell>
//                                       <strong>Expiry Date</strong>
//                                     </TableCell>
//                                   </TableRow>
//                                 </TableHead>
//                                 <TableBody>
//                                   {grn.batches.map((batch) => (
//                                     <TableRow key={batch.id}>
//                                       <TableCell>
//                                         {batch.material?.name}
//                                       </TableCell>
//                                       <TableCell>
//                                         <Chip
//                                           label={batch.material?.partNumber}
//                                           size="small"
//                                           variant="outlined"
//                                         />
//                                       </TableCell>
//                                       <TableCell align="right">
//                                         <strong>{batch.quantity}</strong>{' '}
//                                         {batch.material?.unit}
//                                       </TableCell>
//                                       <TableCell>
//                                         <Chip
//                                           label={batch.batchNumber}
//                                           size="small"
//                                         />
//                                       </TableCell>
//                                       <TableCell>
//                                         {batch.supplierBatchNo || '-'}
//                                       </TableCell>
//                                       <TableCell>
//                                         {batch.expiryDate
//                                           ? format(
//                                               new Date(batch.expiryDate),
//                                               'MMM dd, yyyy'
//                                             )
//                                           : '-'}
//                                       </TableCell>
//                                     </TableRow>
//                                   ))}
//                                 </TableBody>
//                               </Table>
//                               {grn.notes && (
//                                 <Box sx={{ mt: 2 }}>
//                                   <Typography
//                                     variant="body2"
//                                     color="text.secondary"
//                                   >
//                                     <strong>Notes:</strong> {grn.notes}
//                                   </Typography>
//                                 </Box>
//                               )}
//                             </Box>
//                           </Collapse>
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </React.Fragment>
//                 ))
//               )}
//             </TableBody>

//             <TableFooter>
//               <TableRow>
//                 <ClientTablePagination
//                   rowsPerPageOptions={[10, 20, 50, 100]}
//                   count={total}
//                   rowsPerPage={limit}
//                   page={page - 1}
//                   onPageChange={(_, newPage) => setPage(newPage + 1)}
//                   onRowsPerPageChange={(e) => {
//                     setLimit(parseInt(e.target.value));
//                     setPage(1);
//                   }}
//                 />
//               </TableRow>
//             </TableFooter>
//           </Table>
//         </TableContainer>
//       </Paper>

//       {/* GRN Details Dialog */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>GRN Details - {selectedGRN?.grnNumber}</DialogTitle>
//         <DialogContent dividers>
//           {selectedGRN && (
//             <Box>
//               <Grid container spacing={2}>
//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Supplier
//                   </Typography>
//                   <Typography variant="body1" fontWeight={600}>
//                     {selectedGRN.supplier.name}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Date Received
//                   </Typography>
//                   <Typography variant="body1" fontWeight={600}>
//                     {format(
//                       new Date(selectedGRN.receivedDate),
//                       'MMM dd, yyyy hh:mm a'
//                     )}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Invoice Number
//                   </Typography>
//                   <Typography variant="body1" fontWeight={600}>
//                     {selectedGRN.invoiceNumber || 'Not provided'}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Received By
//                   </Typography>
//                   <Typography variant="body1" fontWeight={600}>
//                     {selectedGRN.receivedBy}
//                   </Typography>
//                 </Grid>
//                 {selectedGRN.notes && (
//                   <Grid item xs={12}>
//                     <Typography variant="body2" color="text.secondary">
//                       Notes
//                     </Typography>
//                     <Typography variant="body1">{selectedGRN.notes}</Typography>
//                   </Grid>
//                 )}
//               </Grid>

//               <Box sx={{ mt: 3 }}>
//                 <Typography variant="h6" gutterBottom>
//                   Items Received
//                 </Typography>
//                 <Table size="small">
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>Material</TableCell>
//                       <TableCell align="right">Quantity</TableCell>
//                       <TableCell>Batch Number</TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {selectedGRN.batches?.map((batch) => (
//                       <TableRow key={batch.id}>
//                         <TableCell>{batch.material?.name}</TableCell>
//                         <TableCell align="right">
//                           <strong>{batch.quantity}</strong>{' '}
//                           {batch.material?.unit}
//                         </TableCell>
//                         <TableCell>
//                           <Chip label={batch.batchNumber} size="small" />
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </Box>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDialogOpen(false)}>Close</Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// src/app/dashboard/inventory/grn/page.tsx

'use client';
import dynamic from 'next/dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableFooter,
  TextField,
  InputAdornment,
  styled,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  Add as AddIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { GRNWithSupplier } from '@/types/inventory';

const ClientTablePagination = dynamic(
  () => import('@mui/material/TablePagination'),
  { ssr: false }
);

// Styled components for professional table appearance
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.5px',
    padding: '8px 16px',
    borderBottom: 'none',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

export default function GRNPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRNWithSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedGRN, setExpandedGRN] = useState<string | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<GRNWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchGRNs();
  }, [page, limit]);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/inventory/grn?${params}`);
      const data = await res.json();
      setGrns(data.grns);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (grnId: string) => {
    setExpandedGRN(expandedGRN === grnId ? null : grnId);
  };

  const handleViewDetails = (grn: GRNWithSupplier) => {
    setSelectedGRN(grn);
    setDialogOpen(true);
  };

  const getTotalItems = (items: any) => {
    if (Array.isArray(items)) {
      return items.length;
    }
    return 0;
  };

  const getTotalQuantity = (batches: any[]) => {
    return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Goods Received Notes (GRN)
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Track all materials received from suppliers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/inventory/grn/new')}
          sx={{
            textTransform: 'uppercase',
            bgcolor: '#0F172A',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          Create GRN
        </Button>
      </Box>

      {/* Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by GRN number, supplier, or invoice number..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500, fontSize: 14 }}
        />
      </Paper>

      {/* GRNs Table */}
      {grns.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            textAlign: 'center',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <ReceiptIcon color="action" />
            </Box>

            <Typography variant="h6" fontWeight={600}>
              No GRNs yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Create your first Goods Received Note to track materials received
              from suppliers
            </Typography>

            <Button
              variant="contained"
              sx={{ mt: 2 }}
              startIcon={<AddIcon />}
              onClick={() => router.push('/inventory/grn/new')}
            >
              Create GRN
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell width={50}></StyledTableCell>
                  <StyledTableCell>GRN Number</StyledTableCell>
                  <StyledTableCell>Date Received</StyledTableCell>
                  <StyledTableCell>Supplier</StyledTableCell>
                  <StyledTableCell>Invoice No.</StyledTableCell>
                  <StyledTableCell align="center">Items</StyledTableCell>
                  <StyledTableCell align="center">Total Qty</StyledTableCell>
                  <StyledTableCell>Received By</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grns.map((grn) => (
                  <React.Fragment key={grn.id}>
                    <StyledTableRow>
                      <StyledTableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(grn.id)}
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          {expandedGRN === grn.id ? (
                            <CollapseIcon fontSize="small" />
                          ) : (
                            <ExpandIcon fontSize="small" />
                          )}
                        </IconButton>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={grn.grnNumber}
                          size="small"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#16a34a',
                            fontWeight: 600,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(grn.receivedDate), 'hh:mm a')}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {grn.supplier.name}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {grn.invoiceNumber ? (
                          <Chip
                            label={grn.invoiceNumber}
                            // size="small"
                            // variant="outlined"
                            // sx={{ fontWeight: 500 }}

                            size="small"
                            variant="outlined"
                            sx={{
                              // borderRadius: '4px',
                              fontWeight: 500,
                              fontSize: '11px',
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          label={getTotalItems(grn.items)}
                          size="small"
                          sx={{
                            minWidth: 40,
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 600,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: '#16a34a' }}
                        >
                          +{getTotalQuantity(grn.batches || [])}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {grn.receivedBy}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(grn)}
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>

                    {/* Expanded Row - Items Details */}
                    {expandedGRN === grn.id && grn.batches && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          sx={{
                            py: 0,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Collapse
                            in={expandedGRN === grn.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                p: 3,
                                backgroundColor: '#f8fafc',
                                // borderTop: '1px solid',
                                // borderColor: 'divider',
                                marginTop: 1,
                                borderRadius: 2,
                                marginBottom: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                gutterBottom
                                sx={{ mb: 2 }}
                              >
                                Received Items
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Material
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Part Number
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      Quantity
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Batch Number
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Supplier Batch
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Expiry Date
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {grn.batches.map((batch) => (
                                    <TableRow
                                      key={batch.id}
                                      sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                      }}
                                    >
                                      <TableCell>
                                        <Typography variant="body2">
                                          {batch.material?.name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={batch.material?.partNumber}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: 11 }}
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                        >
                                          {batch.quantity}{' '}
                                          {batch.material?.unit}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={batch.batchNumber}
                                          size="small"
                                          sx={{
                                            bgcolor: '#fef3c7',
                                            color: '#f59e0b',
                                            fontWeight: 500,
                                            fontSize: 11,
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {batch.supplierBatchNo || '—'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {batch.expiryDate
                                            ? format(
                                                new Date(batch.expiryDate),
                                                'MMM dd, yyyy'
                                              )
                                            : '—'}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {grn.notes && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    <strong>Notes:</strong> {grn.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={limit}
            page={page - 1}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#F8FAFC',
            }}
          />
        </Paper>
      )}

      {/* GRN Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={600}>
              GRN Details
            </Typography>
            <Chip
              label={selectedGRN?.grnNumber}
              size="small"
              sx={{
                bgcolor: '#dcfce7',
                color: '#16a34a',
                fontWeight: 600,
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedGRN && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Supplier
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.supplier.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date Received
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {format(
                      new Date(selectedGRN.receivedDate),
                      'MMM dd, yyyy hh:mm a'
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.invoiceNumber || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Received By
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedGRN.receivedBy}
                  </Typography>
                </Grid>
                {selectedGRN.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">{selectedGRN.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Items Received
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Batch Number
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedGRN.batches?.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.material?.name}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {batch.quantity} {batch.material?.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={batch.batchNumber}
                            size="small"
                            sx={{
                              bgcolor: '#fef3c7',
                              color: '#f59e0b',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
