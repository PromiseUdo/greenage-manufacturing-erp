// // src/app/dashboard/inventory/suppliers/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
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
//   IconButton,
//   Chip,
//   TablePagination,
//   TextField,
//   InputAdornment,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Visibility as ViewIcon,
//   Search as SearchIcon,
//   Phone as PhoneIcon,
//   Email as EmailIcon,
// } from '@mui/icons-material';
// import { useRouter } from 'next/navigation';
// import { useForm, Controller } from 'react-hook-form';
// import { SupplierFormData } from '@/types/inventory';

// interface Supplier {
//   id: string;
//   name: string;
//   contactPerson: string | null;
//   email: string | null;
//   phone: string;
//   address: string | null;
//   paymentTerms: string | null;
//   isActive: boolean;
//   _count?: {
//     materials: number;
//     grns: number;
//   };
// }

// export default function SuppliersPage() {
//   const router = useRouter();
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

//   const {
//     control,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<SupplierFormData>();

//   useEffect(() => {
//     fetchSuppliers();
//   }, [page, limit]);

//   const fetchSuppliers = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//         ...(search && { search }),
//       });

//       const res = await fetch(`/api/inventory/suppliers?${params}`);
//       const data = await res.json();
//       setSuppliers(data.suppliers);
//       setTotal(data?.pagination?.total);
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     setPage(1);
//     fetchSuppliers();
//   };

//   const handleOpenDialog = (supplier?: Supplier) => {
//     if (supplier) {
//       setEditingSupplier(supplier);
//       reset({
//         name: supplier.name,
//         contactPerson: supplier.contactPerson || '',
//         email: supplier.email || '',
//         phone: supplier.phone,
//         address: supplier.address || '',
//         paymentTerms: supplier.paymentTerms || '',
//       });
//     } else {
//       setEditingSupplier(null);
//       reset({
//         name: '',
//         contactPerson: '',
//         email: '',
//         phone: '',
//         address: '',
//         paymentTerms: '',
//       });
//     }
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setEditingSupplier(null);
//     reset();
//   };

//   const handleSaveSupplier = async (data: SupplierFormData) => {
//     try {
//       const url = editingSupplier
//         ? `/api/inventory/suppliers/${editingSupplier.id}`
//         : '/api/inventory/suppliers';

//       const res = await fetch(url, {
//         method: editingSupplier ? 'PUT' : 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       const result = await res.json();

//       if (!res.ok) {
//         console.error('Backend error:', result);

//         throw new Error('Failed to save supplier');
//       }

//       handleCloseDialog();
//       fetchSuppliers();
//     } catch (error) {
//       console.error('Error saving supplier:', error);
//     }
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
//             Suppliers
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Manage your supplier database
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={() => handleOpenDialog()}
//         >
//           Add Supplier
//         </Button>
//       </Box>

//       {/* Search */}
//       <Box sx={{ mb: 3 }}>
//         <TextField
//           fullWidth
//           placeholder="Search suppliers by name, contact, or email"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon />
//               </InputAdornment>
//             ),
//           }}
//         />
//       </Box>

//       {/* Suppliers Table */}
//       <Paper>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>
//                   <strong>Supplier Name</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Contact Person</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Contact Info</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Payment Terms</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Materials</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>GRNs</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Actions</strong>
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {suppliers?.map((supplier) => (
//                 <TableRow key={supplier.id} hover>
//                   <TableCell>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Typography variant="body2" fontWeight={600}>
//                         {supplier.name}
//                       </Typography>
//                       {!supplier.isActive && (
//                         <Chip label="Inactive" size="small" color="default" />
//                       )}
//                     </Box>
//                   </TableCell>
//                   <TableCell>{supplier.contactPerson || '-'}</TableCell>
//                   <TableCell>
//                     <Box>
//                       {supplier.phone && (
//                         <Box
//                           sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: 0.5,
//                             mb: 0.5,
//                           }}
//                         >
//                           <PhoneIcon fontSize="small" color="action" />
//                           <Typography variant="body2">
//                             {supplier.phone}
//                           </Typography>
//                         </Box>
//                       )}
//                       {supplier.email && (
//                         <Box
//                           sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: 0.5,
//                           }}
//                         >
//                           <EmailIcon fontSize="small" color="action" />
//                           <Typography variant="body2">
//                             {supplier.email}
//                           </Typography>
//                         </Box>
//                       )}
//                     </Box>
//                   </TableCell>
//                   <TableCell>{supplier.paymentTerms || '-'}</TableCell>
//                   <TableCell align="center">
//                     <Chip
//                       label={supplier._count?.materials || 0}
//                       size="small"
//                       color="primary"
//                     />
//                   </TableCell>
//                   <TableCell align="center">
//                     <Chip
//                       label={supplier._count?.grns || 0}
//                       size="small"
//                       color="secondary"
//                     />
//                   </TableCell>
//                   <TableCell align="center">
//                     <IconButton
//                       size="small"
//                       onClick={() => handleOpenDialog(supplier)}
//                     >
//                       <EditIcon fontSize="small" />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination
//           rowsPerPageOptions={[10, 20, 50]}
//           component="div"
//           count={total}
//           rowsPerPage={limit}
//           page={page - 1}
//           onPageChange={(_, newPage) => setPage(newPage + 1)}
//           onRowsPerPageChange={(e) => {
//             setLimit(parseInt(e.target.value));
//             setPage(1);
//           }}
//         />
//       </Paper>

//       {/* Supplier Form Dialog */}
//       <Dialog
//         open={openDialog}
//         onClose={handleCloseDialog}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
//         </DialogTitle>
//         <form onSubmit={handleSubmit(handleSaveSupplier)}>
//           <DialogContent>
//             <Grid container spacing={2}>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="name"
//                   control={control}
//                   rules={{ required: 'Supplier name is required' }}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Supplier Name"
//                       fullWidth
//                       required
//                       error={!!errors.name}
//                       helperText={errors.name?.message}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="contactPerson"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField {...field} label="Contact Person" fullWidth />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="phone"
//                   control={control}
//                   rules={{ required: 'Phone is required' }}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Phone"
//                       fullWidth
//                       required
//                       error={!!errors.phone}
//                       helperText={errors.phone?.message}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="email"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Email"
//                       type="email"
//                       fullWidth
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Controller
//                   name="address"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Address"
//                       fullWidth
//                       multiline
//                       rows={2}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Controller
//                   name="paymentTerms"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Payment Terms"
//                       fullWidth
//                       placeholder="e.g., Net 30 days"
//                     />
//                   )}
//                 />
//               </Grid>
//             </Grid>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleCloseDialog}>Cancel</Button>
//             <Button type="submit" variant="contained">
//               {editingSupplier ? 'Update' : 'Create'}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>
//     </Box>
//   );
// }

// // src/app/dashboard/inventory/suppliers/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   alpha,
//   Box,
//   Button,
//   Chip,
//   IconButton,
//   InputAdornment,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TablePagination,
//   TableRow,
//   TextField,
//   Toolbar,
//   Typography,
//   styled,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
// } from '@mui/material';
// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Phone as PhoneIcon,
//   Email as EmailIcon,
//   Search as SearchIcon,
// } from '@mui/icons-material';
// import Grid from '@mui/material/GridLegacy';
// import { useRouter } from 'next/navigation';
// import { useForm, Controller } from 'react-hook-form';
// import { SupplierFormData } from '@/types/inventory';

// interface Supplier {
//   id: string;
//   name: string;
//   contactPerson: string | null;
//   email: string | null;
//   phone: string;
//   address: string | null;
//   paymentTerms: string | null;
//   isActive: boolean;
//   _count?: {
//     materials: number;
//     grns: number;
//   };
// }

// // ── Styled Components ────────────────────────────────────────────────
// const StyledTableCell = styled(TableCell)(({ theme }) => ({
//   borderBottom: `1px solid ${theme.palette.divider}`,
//   padding: theme.spacing(1.5, 2),
//   '&.header': {
//     backgroundColor: alpha(theme.palette.primary.main, 0.06),
//     color: theme.palette.text.primary,
//     fontWeight: 600,
//     fontSize: '0.85rem',
//     textTransform: 'uppercase',
//     letterSpacing: '0.4px',
//   },
// }));

// const StyledTableRow = styled(TableRow)(({ theme }) => ({
//   '&:hover': {
//     backgroundColor: alpha(theme.palette.primary.main, 0.04),
//     transition: 'background-color 0.15s ease',
//   },
//   '&:last-child td': {
//     borderBottom: 0,
//   },
// }));

// // ── Main Component ───────────────────────────────────────────────────
// export default function SuppliersPage() {
//   const router = useRouter();
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');

//   const [openDialog, setOpenDialog] = useState(false);
//   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

//   const {
//     control,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<SupplierFormData>();

//   useEffect(() => {
//     fetchSuppliers();
//   }, [page, limit, search]);

//   const fetchSuppliers = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//         ...(search && { search }),
//       });

//       const res = await fetch(`/api/inventory/suppliers?${params}`);
//       const data = await res.json();
//       setSuppliers(data.suppliers || []);
//       setTotal(data?.pagination?.total || 0);
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearch(e.target.value);
//     setPage(1);
//   };

//   const handleOpenDialog = (supplier?: Supplier) => {
//     if (supplier) {
//       setEditingSupplier(supplier);
//       reset({
//         name: supplier.name,
//         contactPerson: supplier.contactPerson || '',
//         email: supplier.email || '',
//         phone: supplier.phone,
//         address: supplier.address || '',
//         paymentTerms: supplier.paymentTerms || '',
//       });
//     } else {
//       setEditingSupplier(null);
//       reset({
//         name: '',
//         contactPerson: '',
//         email: '',
//         phone: '',
//         address: '',
//         paymentTerms: '',
//       });
//     }
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setEditingSupplier(null);
//     reset();
//   };

//   const handleSaveSupplier = async (data: SupplierFormData) => {
//     try {
//       const url = editingSupplier
//         ? `/api/inventory/suppliers/${editingSupplier.id}`
//         : '/api/inventory/suppliers';

//       const res = await fetch(url, {
//         method: editingSupplier ? 'PUT' : 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (!res.ok) throw new Error('Failed to save supplier');

//       handleCloseDialog();
//       fetchSuppliers();
//     } catch (error) {
//       console.error('Error saving supplier:', error);
//     }
//   };

//   return (
//     <Box>
//       {/* Header + Add Button */}
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           mb: 3,
//           flexWrap: 'wrap',
//           gap: 2,
//         }}
//       >
//         <div>
//           <Typography variant="h6" fontWeight={700} component="h1">
//             Suppliers
//           </Typography>
//           <Typography color="text.secondary" variant="body2" mt={0.5}>
//             Manage all your vendors and suppliers
//           </Typography>
//         </div>

//         <Button
//           variant="contained"
//           disableElevation
//           // startIcon={<AddIcon />}
//           onClick={() => handleOpenDialog()}
//           sx={{ borderRadius: 2 }}
//         >
//           New Supplier
//         </Button>
//       </Box>

//       {/* Search & Controls */}
//       <Paper
//         elevation={0}
//         sx={{
//           p: 2,
//           mb: 3,
//           borderRadius: 1,
//           border: '1px solid',
//           borderColor: 'divider',
//           bgcolor: 'background.paper',
//         }}
//       >
//         <TextField
//           fullWidth
//           size="small"
//           placeholder="Search by name, contact person, phone or email..."
//           value={search}
//           onChange={handleSearchChange}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <SearchIcon fontSize="small" />
//               </InputAdornment>
//             ),
//           }}
//           sx={{ maxWidth: 500 }}
//         />
//       </Paper>

//       {/* ── Main Table ──────────────────────────────────────────────── */}
//       <Paper
//         sx={{
//           borderRadius: 1,
//           overflow: 'hidden',
//           border: '1px solid',
//           borderColor: 'divider',
//           boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
//         }}
//       >
//         <TableContainer>
//           <Table size="small" aria-label="suppliers table">
//             <TableHead>
//               <TableRow>
//                 <StyledTableCell className="header">Supplier</StyledTableCell>
//                 <StyledTableCell className="header">
//                   Contact Person
//                 </StyledTableCell>
//                 <StyledTableCell className="header">Contact</StyledTableCell>
//                 <StyledTableCell className="header">
//                   Payment Terms
//                 </StyledTableCell>
//                 <StyledTableCell className="header" align="center">
//                   Materials
//                 </StyledTableCell>
//                 <StyledTableCell className="header" align="center">
//                   GRNs
//                 </StyledTableCell>
//                 <StyledTableCell className="header" align="center" width={80}>
//                   Actions
//                 </StyledTableCell>
//               </TableRow>
//             </TableHead>

//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
//                     <Typography color="text.secondary">
//                       Loading suppliers...
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : suppliers.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
//                     <Typography variant="body1" color="text.secondary">
//                       No suppliers found
//                     </Typography>
//                     {search && (
//                       <Typography variant="body2" color="text.secondary" mt={1}>
//                         Try adjusting your search
//                       </Typography>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 suppliers.map((supplier) => (
//                   <StyledTableRow key={supplier.id}>
//                     <StyledTableCell>
//                       <Box
//                         sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
//                       >
//                         <Typography variant="body2" fontWeight={600}>
//                           {supplier.name}
//                         </Typography>
//                         {!supplier.isActive && (
//                           <Chip
//                             label="Inactive"
//                             size="small"
//                             color="default"
//                             variant="outlined"
//                             sx={{ height: 20, fontSize: '0.7rem' }}
//                           />
//                         )}
//                       </Box>
//                     </StyledTableCell>

//                     <StyledTableCell>
//                       <Typography variant="body2" color="text.secondary">
//                         {supplier.contactPerson || '—'}
//                       </Typography>
//                     </StyledTableCell>

//                     <StyledTableCell>
//                       <Box
//                         sx={{
//                           display: 'flex',
//                           flexDirection: 'column',
//                           gap: 0.5,
//                         }}
//                       >
//                         {supplier.phone && (
//                           <Box
//                             sx={{
//                               display: 'flex',
//                               alignItems: 'center',
//                               gap: 1,
//                             }}
//                           >
//                             <PhoneIcon
//                               fontSize="small"
//                               sx={{ color: 'action.active', opacity: 0.7 }}
//                             />
//                             <Typography variant="body2">
//                               {supplier.phone}
//                             </Typography>
//                           </Box>
//                         )}
//                         {supplier.email && (
//                           <Box
//                             sx={{
//                               display: 'flex',
//                               alignItems: 'center',
//                               gap: 1,
//                             }}
//                           >
//                             <EmailIcon
//                               fontSize="small"
//                               sx={{ color: 'action.active', opacity: 0.7 }}
//                             />
//                             <Typography variant="body2" color="primary">
//                               {supplier.email}
//                             </Typography>
//                           </Box>
//                         )}
//                       </Box>
//                     </StyledTableCell>

//                     <StyledTableCell>
//                       <Typography variant="body2" color="text.secondary">
//                         {supplier.paymentTerms || '—'}
//                       </Typography>
//                     </StyledTableCell>

//                     <StyledTableCell align="center">
//                       <Chip
//                         label={supplier._count?.materials ?? 0}
//                         size="small"
//                         color="primary"
//                         variant="outlined"
//                         sx={{ minWidth: 48 }}
//                       />
//                     </StyledTableCell>

//                     <StyledTableCell align="center">
//                       <Chip
//                         label={supplier._count?.grns ?? 0}
//                         size="small"
//                         color="secondary"
//                         variant="outlined"
//                         sx={{ minWidth: 48 }}
//                       />
//                     </StyledTableCell>

//                     <StyledTableCell align="center">
//                       <IconButton
//                         size="small"
//                         onClick={() => handleOpenDialog(supplier)}
//                         sx={{
//                           color: 'text.secondary',
//                           '&:hover': { bgcolor: alpha('#1976d2', 0.08) },
//                         }}
//                       >
//                         <EditIcon fontSize="small" />
//                       </IconButton>
//                     </StyledTableCell>
//                   </StyledTableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>

//         <TablePagination
//           rowsPerPageOptions={[10, 20, 50, 100]}
//           component="div"
//           count={total}
//           rowsPerPage={limit}
//           page={page - 1}
//           onPageChange={(_, newPage) => setPage(newPage + 1)}
//           onRowsPerPageChange={(e) => {
//             setLimit(Number(e.target.value));
//             setPage(1);
//           }}
//           sx={{
//             borderTop: '1px solid',
//             borderColor: 'divider',
//             '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
//               {
//                 fontSize: '0.875rem',
//               },
//           }}
//         />
//       </Paper>

//       <Dialog
//         open={openDialog}
//         onClose={handleCloseDialog}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
//         </DialogTitle>
//         <form onSubmit={handleSubmit(handleSaveSupplier)}>
//           <DialogContent>
//             <Grid container spacing={2}>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="name"
//                   control={control}
//                   rules={{ required: 'Supplier name is required' }}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Supplier Name"
//                       fullWidth
//                       required
//                       error={!!errors.name}
//                       helperText={errors.name?.message}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="contactPerson"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField {...field} label="Contact Person" fullWidth />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="phone"
//                   control={control}
//                   rules={{ required: 'Phone is required' }}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Phone"
//                       fullWidth
//                       required
//                       error={!!errors.phone}
//                       helperText={errors.phone?.message}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Controller
//                   name="email"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Email"
//                       type="email"
//                       fullWidth
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Controller
//                   name="address"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Address"
//                       fullWidth
//                       multiline
//                       rows={2}
//                     />
//                   )}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Controller
//                   name="paymentTerms"
//                   control={control}
//                   render={({ field }) => (
//                     <TextField
//                       {...field}
//                       label="Payment Terms"
//                       fullWidth
//                       placeholder="e.g., Net 30 days"
//                     />
//                   )}
//                 />
//               </Grid>
//             </Grid>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleCloseDialog}>Cancel</Button>
//             <Button type="submit" variant="contained">
//               {editingSupplier ? 'Update' : 'Create'}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>
//     </Box>
//   );
// }

// src/app/dashboard/inventory/suppliers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';

import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/GridLegacy';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { SupplierFormData } from '@/types/inventory';
import { theme } from '@/lib/theme';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  paymentTerms: string | null;
  isActive: boolean;
  _count?: {
    materials: number;
    grns: number;
  };
}

// ── Styled Components ────────────────────────────────────────────────
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2),
  '&.header': {
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transition: 'background-color 0.15s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

// ── Main Component ───────────────────────────────────────────────────
export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const exportMenuOpen = Boolean(exportAnchorEl);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>();

  useEffect(() => {
    fetchSuppliers();
  }, [page, limit, search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/inventory/suppliers?${params}`);
      const data = await res.json();
      setSuppliers(data.suppliers || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone,
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || '',
      });
    } else {
      setEditingSupplier(null);
      reset({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
    reset();
  };

  const handleSaveSupplier = async (data: SupplierFormData) => {
    try {
      const url = editingSupplier
        ? `/api/inventory/suppliers/${editingSupplier.id}`
        : '/api/inventory/suppliers';

      const res = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save supplier');

      handleCloseDialog();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  // Export handlers
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    handleExportClose();
    setExporting(true);

    try {
      const params = new URLSearchParams({
        format,
        ...(search && { search }),
      });

      const res = await fetch(`/api/inventory/suppliers/export?${params}`);

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers_${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'pdf'
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting suppliers:', error);
      alert('Failed to export suppliers. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      {/* Header + Add Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h6" fontWeight={700} component="h1">
            Suppliers
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: '14px',
            }}
            variant="body2"
            mt={0.5}
          >
            Manage all your vendors and suppliers
          </Typography>
        </div>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            disableElevation
            endIcon={
              exporting ? <CircularProgress size={16} /> : <ArrowDownIcon />
            }
            onClick={handleExportClick}
            disabled={exporting || suppliers.length === 0}
            sx={{
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha('#1976d2', 0.04),
              },
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>

          <Button
            variant="contained"
            disableElevation
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            New Supplier
          </Button>
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={exportMenuOpen}
        onClose={handleExportClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          onClick={() => handleExport('excel')}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <ListItemIcon>
            <ExcelIcon fontSize="small" sx={{ color: '#107C41' }} />
          </ListItemIcon>
          <ListItemText
            primary="Download as Excel"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('pdf')}
          sx={{ py: 1.5, gap: 1.5 }}
        >
          <ListItemIcon>
            <PdfIcon fontSize="small" sx={{ color: '#DC2626' }} />
          </ListItemIcon>
          <ListItemText
            primary="Download as PDF"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
      </Menu>

      {/* Search & Controls */}
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
          placeholder="Search by name, contact person, phone or email..."
          value={search}
          onChange={handleSearchChange}
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

      {/* ── Main Table ──────────────────────────────────────────────── */}
      <Paper
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <TableContainer>
          <Table size="small" aria-label="suppliers table">
            <TableHead>
              <TableRow>
                <StyledTableCell className="header">Supplier</StyledTableCell>
                <StyledTableCell className="header">
                  Contact Person
                </StyledTableCell>
                <StyledTableCell className="header">Contact</StyledTableCell>
                <StyledTableCell className="header">
                  Payment Terms
                </StyledTableCell>
                <StyledTableCell className="header" align="center">
                  Materials
                </StyledTableCell>
                <StyledTableCell className="header" align="center">
                  GRNs
                </StyledTableCell>
                <StyledTableCell className="header" align="center" width={80}>
                  Actions
                </StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Loading suppliers...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No suppliers found
                    </Typography>
                    {search && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Try adjusting your search
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <StyledTableRow key={supplier.id}>
                    <StyledTableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {supplier.name}
                        </Typography>
                        {!supplier.isActive && (
                          <Chip
                            label="Inactive"
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {supplier.contactPerson || '—'}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        {supplier.phone && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <PhoneIcon
                              fontSize="small"
                              sx={{ color: 'action.active', opacity: 0.7 }}
                            />
                            <Typography variant="body2">
                              {supplier.phone}
                            </Typography>
                          </Box>
                        )}
                        {supplier.email && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <EmailIcon
                              fontSize="small"
                              sx={{ color: 'action.active', opacity: 0.7 }}
                            />
                            <Typography variant="body2" color="primary">
                              {supplier.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {supplier.paymentTerms || '—'}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <Chip
                        label={supplier._count?.materials ?? 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ minWidth: 48 }}
                      />
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <Chip
                        label={supplier._count?.grns ?? 0}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ minWidth: 48 }}
                      />
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(supplier)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { bgcolor: alpha('#1976d2', 0.08) },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
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
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
              {
                fontSize: '0.875rem',
              },
          }}
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        // fullWidth
        fullScreen={fullScreen}
      >
        {/* <DialogTitle>
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
          {editingSupplier
            ? 'Update supplier information below'
            : 'Enter supplier details to add to your system'}
        </Typography> */}

        <Box
          sx={{
            // color: 'white',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
              {editingSupplier
                ? 'Update supplier information below'
                : 'Enter supplier details to add to your system'}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit(handleSaveSupplier)}>
          <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Supplier name is required' }}
                  render={({ field }) => (
                    // <TextField
                    //   {...field}
                    //   label="Supplier Name"
                    //   fullWidth
                    //   required
                    //   error={!!errors.name}
                    //   helperText={errors.name?.message}
                    // />

                    <TextField
                      {...field}
                      label="Supplier Name"
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contactPerson"
                  control={control}
                  render={({ field }) => (
                    // <TextField {...field} label="Contact Person" fullWidth />

                    <TextField
                      {...field}
                      label="Contact Person"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: 'Phone is required' }}
                  render={({ field }) => (
                    // <TextField
                    //   {...field}
                    //   label="Phone"
                    //   fullWidth
                    //   required
                    //   error={!!errors.phone}
                    //   helperText={errors.phone?.message}
                    // />

                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      required
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    // <TextField
                    //   {...field}
                    //   label="Email"
                    //   type="email"
                    //   fullWidth
                    // />

                    <TextField
                      {...field}
                      label="Email Address"
                      type="email"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    // <TextField
                    //   {...field}
                    //   label="Address"
                    //   fullWidth
                    //   multiline
                    //   rows={2}
                    // />

                    <TextField
                      {...field}
                      label="Address"
                      fullWidth
                      multiline
                      rows={2.5}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ alignSelf: 'flex-start', mt: 1.5 }}
                          >
                            <LocationOnIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="paymentTerms"
                  control={control}
                  render={({ field }) => (
                    // <TextField
                    //   {...field}
                    //   label="Payment Terms"
                    //   fullWidth
                    //   placeholder="e.g., Net 30 days"
                    // />

                    <TextField
                      {...field}
                      label="Payment Terms"
                      fullWidth
                      placeholder="e.g., Net 30 days, 50% advance"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaymentIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          {/* <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>

            <Button type="submit" variant="contained">
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogActions> */}

          <DialogActions
            sx={{
              px: 3,
              py: 2.5,
              bgcolor: alpha('#667eea', 0.03),
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: 1.5,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              sx={
                {
                  // borderRadius: 2,
                  // px: 3,
                  // py: 1,
                  // borderColor: 'divider',
                  // color: 'text.secondary',
                }
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={
                {
                  // borderRadius: 2,
                  // px: 3.5,
                  // py: 1,
                  // fontWeight: 600,
                }
              }
            >
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
