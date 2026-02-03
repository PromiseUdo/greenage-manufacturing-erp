// // src/app/dashboard/sales/quotes/[id]/page.tsx

// 'use client';

// import { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   Alert,
//   Chip,
//   CircularProgress,
//   Table,
//   TableBody,
//   TableRow,
//   TableCell,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Tabs,
//   Tab,
//   Grid,
// } from '@mui/material';
// import {
//   ArrowBack,
//   CheckCircle,
//   Print,
//   Description,
//   Receipt,
//   ShoppingCart,
// } from '@mui/icons-material';

// interface TabPanelProps {
//   children?: React.ReactNode;
//   index: number;
//   value: number;
// }

// function TabPanel(props: TabPanelProps) {
//   const { children, value, index, ...other } = props;

//   return (
//     <div hidden={value !== index} {...other}>
//       {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
//     </div>
//   );
// }

// export default function QuoteDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [quote, setQuote] = useState<any>(null);
//   const [tabValue, setTabValue] = useState(0);
//   const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
//   const [accepting, setAccepting] = useState(false);
//   const [dueInDays, setDueInDays] = useState(30);

//   useEffect(() => {
//     fetchQuote();
//   }, [resolvedParams.id]);

//   const fetchQuote = async () => {
//     try {
//       const res = await fetch(`/api/quotes/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch quote');
//       }

//       setQuote(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptQuote = async () => {
//     try {
//       setAccepting(true);
//       setError('');

//       const res = await fetch(`/api/quotes/${resolvedParams.id}/accept`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ dueInDays }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to accept quote');
//       }

//       setSuccess(
//         `Quote accepted successfully! Invoice ${data.invoice.invoiceNumber} created.`,
//       );
//       setAcceptDialogOpen(false);
//       fetchQuote();
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setAccepting(false);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//     }).format(amount);
//   };

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   if (loading) {
//     return (
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           minHeight: '60vh',
//         }}
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error && !quote) {
//     return (
//       <Box>
//         <Alert severity="error">{error}</Alert>
//         <Button
//           startIcon={<ArrowBack />}
//           onClick={() => router.back()}
//           sx={{ mt: 2 }}
//         >
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   const statusColors: Record<string, { bg: string; text: string }> = {
//     DRAFT: { bg: '#f3f4f6', text: '#6b7280' },
//     SENT: { bg: '#dbeafe', text: '#1e40af' },
//     ACCEPTED: { bg: '#dcfce7', text: '#166534' },
//     REJECTED: { bg: '#fee2e2', text: '#991b1b' },
//     EXPIRED: { bg: '#fef3c7', text: '#92400e' },
//     CONVERTED: { bg: '#e0e7ff', text: '#4338ca' },
//   };

//   return (
//     <Box>
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Button
//           startIcon={<ArrowBack />}
//           onClick={() => router.back()}
//           sx={{ mb: 2, color: 'text.secondary' }}
//         >
//           Back to Quotes
//         </Button>
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <Box>
//             <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//               <Typography variant="h6" fontWeight={600}>
//                 {quote?.quoteNumber}
//               </Typography>
//               <Chip
//                 label={quote?.status}
//                 size="small"
//                 sx={{
//                   bgcolor: statusColors[quote?.status]?.bg || '#f3f4f6',
//                   color: statusColors[quote?.status]?.text || '#6b7280',
//                   fontWeight: 500,
//                 }}
//               />
//               {quote?.isAccepted && (
//                 <Chip
//                   label="Accepted"
//                   icon={<CheckCircle />}
//                   size="small"
//                   sx={{
//                     bgcolor: '#dcfce7',
//                     color: '#166534',
//                     fontWeight: 500,
//                   }}
//                 />
//               )}
//             </Box>
//           </Box>
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             {!quote?.isAccepted && (
//               <Button
//                 variant="contained"
//                 startIcon={<CheckCircle />}
//                 onClick={() => setAcceptDialogOpen(true)}
//                 sx={{
//                   bgcolor: '#10b981',
//                   fontWeight: 600,
//                   '&:hover': { bgcolor: '#059669' },
//                 }}
//               >
//                 Accept Quote
//               </Button>
//             )}
//             <Button variant="outlined" startIcon={<Print />}>
//               Print
//             </Button>
//           </Box>
//         </Box>
//       </Box>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
//           {success}
//         </Alert>
//       )}

//       {/* Tabs */}
//       <Paper sx={{ borderRadius: 2, mb: 3 }}>
//         <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
//           <Tab
//             label="Quote Details"
//             icon={<Description />}
//             iconPosition="start"
//           />
//           <Tab label="Order" icon={<ShoppingCart />} iconPosition="start" />
//           <Tab label="Invoice" icon={<Receipt />} iconPosition="start" />
//         </Tabs>
//       </Paper>

//       {/* Quote Details Tab */}
//       <TabPanel value={tabValue} index={0}>
//         <Grid container spacing={3}>
//           {/* Main Details */}
//           <Grid size={{ xs: 12, md: 8 }}>
//             {/* Customer Info */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Customer Information
//               </Typography>
//               <Table size="small">
//                 <TableBody>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600, width: '30%' }}>
//                       Name:
//                     </TableCell>
//                     <TableCell>{quote?.customer.name}</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Phone:</TableCell>
//                     <TableCell>{quote?.customer.phone}</TableCell>
//                   </TableRow>
//                   {quote?.customer.email && (
//                     <TableRow>
//                       <TableCell sx={{ fontWeight: 600 }}>Email:</TableCell>
//                       <TableCell>{quote?.customer.email}</TableCell>
//                     </TableRow>
//                   )}
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Address:</TableCell>
//                     <TableCell>{quote?.customer.address}</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </Paper>

//             {/* Product Info */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Product Details
//               </Typography>
//               <Table size="small">
//                 <TableBody>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600, width: '30%' }}>
//                       Product:
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" fontWeight={600}>
//                         {quote?.product.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {quote?.product.productNumber} • Code:{' '}
//                         {quote?.product.productCode}
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Category:</TableCell>
//                     <TableCell>
//                       {quote?.product.category.replace(/_/g, ' ')}
//                     </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Quantity:</TableCell>
//                     <TableCell>{quote?.quantity} units</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>
//                       Delivery Date:
//                     </TableCell>
//                     <TableCell>{formatDate(quote?.deliveryDate)}</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>

//               {/* Specifications */}
//               {quote?.product.specifications &&
//                 quote.product.specifications.length > 0 && (
//                   <Box sx={{ mt: 3 }}>
//                     <Typography
//                       variant="subtitle2"
//                       fontWeight={600}
//                       gutterBottom
//                     >
//                       Specifications
//                     </Typography>
//                     <Table size="small">
//                       <TableBody>
//                         {quote.product.specifications.map(
//                           (spec: any, index: number) => (
//                             <TableRow key={index}>
//                               <TableCell sx={{ fontWeight: 600, width: '30%' }}>
//                                 {spec.label}:
//                               </TableCell>
//                               <TableCell>{spec.value}</TableCell>
//                             </TableRow>
//                           ),
//                         )}
//                       </TableBody>
//                     </Table>
//                   </Box>
//                 )}
//             </Paper>

//             {/* Pricing Breakdown */}
//             <Paper sx={{ p: 3, borderRadius: 2 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Pricing Breakdown
//               </Typography>
//               <Table size="small">
//                 <TableBody>
//                   <TableRow>
//                     <TableCell>Unit Price:</TableCell>
//                     <TableCell align="right">
//                       {formatCurrency(quote?.unitPrice)}
//                     </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Quantity:</TableCell>
//                     <TableCell align="right">{quote?.quantity} units</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell>Subtotal:</TableCell>
//                     <TableCell align="right">
//                       {formatCurrency(quote?.totalAmount)}
//                     </TableCell>
//                   </TableRow>
//                   {quote?.taxAmount > 0 && (
//                     <TableRow>
//                       <TableCell>Tax:</TableCell>
//                       <TableCell align="right">
//                         {formatCurrency(quote?.taxAmount)}
//                       </TableCell>
//                     </TableRow>
//                   )}
//                   {quote?.discountAmount > 0 && (
//                     <TableRow>
//                       <TableCell>Discount:</TableCell>
//                       <TableCell align="right" sx={{ color: 'error.main' }}>
//                         -{formatCurrency(quote?.discountAmount)}
//                       </TableCell>
//                     </TableRow>
//                   )}
//                   <TableRow>
//                     <TableCell>
//                       <Typography variant="body1" fontWeight={700}>
//                         Total Amount:
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="right">
//                       <Typography variant="h6" fontWeight={700} color="primary">
//                         {formatCurrency(quote?.finalAmount)}
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </Paper>
//           </Grid>

//           {/* Sidebar */}
//           <Grid size={{ xs: 12, md: 4 }}>
//             {/* Quote Info */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Quote Information
//               </Typography>
//               <Box sx={{ mt: 2 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   Created:
//                 </Typography>
//                 <Typography variant="body2">
//                   {formatDate(quote?.createdAt)}
//                 </Typography>
//               </Box>
//               {quote?.expiryDate && (
//                 <Box sx={{ mt: 1 }}>
//                   <Typography variant="caption" color="text.secondary">
//                     Expires:
//                   </Typography>
//                   <Typography variant="body2">
//                     {formatDate(quote?.expiryDate)}
//                   </Typography>
//                 </Box>
//               )}
//               {quote?.acceptedAt && (
//                 <Box sx={{ mt: 1 }}>
//                   <Typography variant="caption" color="text.secondary">
//                     Accepted:
//                   </Typography>
//                   <Typography variant="body2">
//                     {formatDate(quote?.acceptedAt)}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     By: {quote.acceptedBy}
//                   </Typography>
//                 </Box>
//               )}
//             </Paper>

//             {/* Related Documents */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Related Documents
//               </Typography>
//               {quote?.order && (
//                 <Chip
//                   label={quote.order.orderNumber}
//                   icon={<ShoppingCart />}
//                   onClick={() => router.push(`/sales/orders/${quote.order.id}`)}
//                   sx={{ mt: 1, mr: 1 }}
//                 />
//               )}
//               {quote?.invoice && (
//                 <Chip
//                   label={quote.invoice.invoiceNumber}
//                   icon={<Receipt />}
//                   onClick={() =>
//                     router.push(`/sales/invoices/${quote.invoice.id}`)
//                   }
//                   sx={{ mt: 1 }}
//                 />
//               )}
//               {!quote?.order && !quote?.invoice && (
//                 <Typography
//                   variant="body2"
//                   color="text.secondary"
//                   sx={{ mt: 1 }}
//                 >
//                   No related documents yet
//                 </Typography>
//               )}
//             </Paper>

//             {/* Payment Terms */}
//             {quote?.paymentTerms && (
//               <Paper sx={{ p: 3, borderRadius: 2 }}>
//                 <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                   Payment Terms
//                 </Typography>
//                 <Typography variant="body2">{quote.paymentTerms}</Typography>
//               </Paper>
//             )}
//           </Grid>
//         </Grid>
//       </TabPanel>

//       {/* Order Tab */}
//       <TabPanel value={tabValue} index={1}>
//         {quote?.order ? (
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Order {quote.order.orderNumber}
//             </Typography>
//             <Button
//               variant="contained"
//               onClick={() => router.push(`/sales/orders/${quote.order.id}`)}
//             >
//               View Order Details
//             </Button>
//           </Paper>
//         ) : (
//           <Alert severity="info">
//             Order will be created when quote is accepted
//           </Alert>
//         )}
//       </TabPanel>

//       {/* Invoice Tab */}
//       <TabPanel value={tabValue} index={2}>
//         {quote?.invoice ? (
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Invoice {quote.invoice.invoiceNumber}
//             </Typography>
//             <Button
//               variant="contained"
//               onClick={() => router.push(`/sales/invoices/${quote.invoice.id}`)}
//             >
//               View Invoice Details
//             </Button>
//           </Paper>
//         ) : (
//           <Alert severity="info">
//             Invoice will be created when quote is accepted
//           </Alert>
//         )}
//       </TabPanel>

//       {/* Accept Quote Dialog */}
//       <Dialog
//         open={acceptDialogOpen}
//         onClose={() => setAcceptDialogOpen(false)}
//       >
//         <DialogTitle>Accept Quote</DialogTitle>
//         <DialogContent>
//           <Box sx={{ pt: 2 }}>
//             <Typography variant="body2" gutterBottom>
//               This will:
//             </Typography>
//             <Typography variant="body2" component="ul" sx={{ pl: 3 }}>
//               <li>Mark the quote as accepted</li>
//               <li>Create an invoice for this quote</li>
//               <li>Set the invoice due date</li>
//             </Typography>

//             <TextField
//               fullWidth
//               label="Invoice Due In (days)"
//               type="number"
//               value={dueInDays}
//               onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
//               sx={{ mt: 3 }}
//               inputProps={{ min: 1 }}
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={() => setAcceptDialogOpen(false)}
//             disabled={accepting}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAcceptQuote}
//             variant="contained"
//             disabled={accepting}
//             sx={{
//               bgcolor: '#10b981',
//               '&:hover': { bgcolor: '#059669' },
//             }}
//           >
//             {accepting ? 'Processing...' : 'Accept Quote'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// 'use client';

// import { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   Alert,
//   Chip,
//   CircularProgress,
//   Table,
//   TableBody,
//   TableRow,
//   TableCell,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Tabs,
//   Tab,
//   Divider,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';

// import {
//   ArrowBack,
//   CheckCircle,
//   Print,
//   Description,
//   Receipt,
//   ShoppingCart,
//   CalendarMonth,
//   Person,
//   Inventory,
//   LocalShipping,
// } from '@mui/icons-material';
// import { styled } from '@mui/material/styles';

// // --- Shared Constants ---
// const statusColors: Record<string, { bg: string; text: string }> = {
//   DRAFT: { bg: '#f3f4f6', text: '#6b7280' },
//   SENT: { bg: '#dbeafe', text: '#1e40af' },
//   ACCEPTED: { bg: '#dcfce7', text: '#166534' },
//   REJECTED: { bg: '#fee2e2', text: '#991b1b' },
//   EXPIRED: { bg: '#fef3c7', text: '#92400e' },
//   CONVERTED: { bg: '#e0e7ff', text: '#4338ca' },
// };

// const SectionHeader = styled(Typography)(({ theme }) => ({
//   fontSize: 14,
//   fontWeight: 700,
//   color: '#0F172A',
//   textTransform: 'uppercase',
//   letterSpacing: '0.5px',
//   marginBottom: theme.spacing(2),
//   display: 'flex',
//   alignItems: 'center',
//   gap: '8px',
// }));

// export default function QuoteDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [quote, setQuote] = useState<any>(null);
//   const [tabValue, setTabValue] = useState(0);
//   const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
//   const [accepting, setAccepting] = useState(false);
//   const [dueInDays, setDueInDays] = useState(30);

//   useEffect(() => {
//     fetchQuote();
//   }, [resolvedParams.id]);

//   const fetchQuote = async () => {
//     try {
//       const res = await fetch(`/api/quotes/${resolvedParams.id}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to fetch quote');
//       setQuote(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptQuote = async () => {
//     try {
//       setAccepting(true);
//       const res = await fetch(`/api/quotes/${resolvedParams.id}/accept`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ dueInDays }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to accept');
//       setSuccess(
//         `Quote accepted! Invoice ${data.invoice.invoiceNumber} created.`,
//       );
//       setAcceptDialogOpen(false);
//       fetchQuote();
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setAccepting(false);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   if (loading)
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
//         <CircularProgress size={40} />
//       </Box>
//     );

//   return (
//     <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
//       {/* Breadcrumbs & Actions Header */}
//       <Box
//         sx={{
//           mb: 4,
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'flex-start',
//         }}
//       >
//         <Box>
//           <Button
//             startIcon={<ArrowBack />}
//             onClick={() => router.back()}
//             sx={{ mb: 1, textTransform: 'none', color: 'text.secondary' }}
//           >
//             Back to Quotes
//           </Button>
//           <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//             <Typography variant="h5" fontWeight={700} sx={{ color: '#0F172A' }}>
//               {quote?.quoteNumber}
//             </Typography>
//             <Chip
//               label={quote?.status}
//               size="small"
//               sx={{
//                 bgcolor: statusColors[quote?.status]?.bg,
//                 color: statusColors[quote?.status]?.text,
//                 fontWeight: 700,
//                 fontSize: 12,
//               }}
//             />
//           </Box>
//           <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
//             Created on {formatDate(quote?.createdAt)}
//           </Typography>
//         </Box>

//         <Box sx={{ display: 'flex', gap: 1.5 }}>
//           <Button
//             variant="outlined"
//             startIcon={<Print />}
//             sx={{ borderColor: 'divider', color: 'text.primary' }}
//           >
//             Print PDF
//           </Button>
//           {!quote?.isAccepted && (
//             <Button
//               variant="contained"
//               startIcon={<CheckCircle />}
//               onClick={() => setAcceptDialogOpen(true)}
//               sx={{
//                 bgcolor: '#10b981',
//                 '&:hover': { bgcolor: '#059669' },
//                 fontWeight: 600,
//               }}
//             >
//               Accept Quote
//             </Button>
//           )}
//         </Box>
//       </Box>

//       {success && (
//         <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
//           {success}
//         </Alert>
//       )}
//       {error && (
//         <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
//           {error}
//         </Alert>
//       )}

//       {/* Tabs Navigation */}
//       {/* <Paper
//         elevation={0}
//         sx={{
//           borderBottom: '1px solid',
//           borderColor: 'divider',
//           bgcolor: 'transparent',
//           mb: 4,
//         }}
//       >
//         <Tabs
//           value={tabValue}
//           onChange={(e, v) => setTabValue(v)}
//           sx={{
//             '& .MuiTab-root': {
//               textTransform: 'none',
//               fontWeight: 600,
//               minHeight: 48,
//             },
//           }}
//         >
//           <Tab label="Detailed Overview" />
//           <Tab label="Order History" disabled={!quote?.order} />
//           <Tab label="Financials" disabled={!quote?.invoice} />
//         </Tabs>
//       </Paper> */}

//       {/* Main Content Area */}
//       <Grid container spacing={3}>
//         <Grid item xs={12} md={8}>
//           {/* Section: Product & Pricing */}
//           <Paper
//             elevation={0}
//             sx={{
//               p: 3,
//               borderRadius: 3,
//               border: '1px solid',
//               borderColor: 'divider',
//               mb: 3,
//             }}
//           >
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
//               {/* <Inventory sx={{ color: 'text.secondary', fontSize: 20 }} /> */}
//               {/* <Typography variant="subtitle1" fontWeight={700}>
//               </Typography> */}

//               <SectionHeader>Line Items</SectionHeader>
//             </Box>

//             <Box
//               sx={{
//                 p: 2,
//                 bgcolor: '#F8FAFC',
//                 borderRadius: 2,
//                 mb: 4,
//                 display: 'flex',
//                 justifyContent: 'space-between',
//               }}
//             >
//               <Box>
//                 <Typography variant="body2" fontWeight={600}>
//                   {quote?.product.name}
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">
//                   {quote?.product.productNumber}
//                 </Typography>
//               </Box>
//               <Box sx={{ textAlign: 'right' }}>
//                 <Typography variant="body2" fontWeight={600}>
//                   {quote?.quantity} Units
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">
//                   @{formatCurrency(quote?.unitPrice)}
//                 </Typography>
//               </Box>
//             </Box>

//             <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

//             <Box sx={{ ml: 'auto', maxWidth: 300 }}>
//               <Box
//                 sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
//               >
//                 <Typography variant="body2" color="text.secondary">
//                   Subtotal
//                 </Typography>
//                 <Typography variant="body2" fontWeight={500}>
//                   {formatCurrency(quote?.totalAmount)}
//                 </Typography>
//               </Box>
//               {quote?.discountAmount > 0 && (
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     mb: 1,
//                   }}
//                 >
//                   <Typography variant="body2" color="error.main">
//                     Discount
//                   </Typography>
//                   <Typography variant="body2" color="error.main">
//                     -{formatCurrency(quote?.discountAmount)}
//                   </Typography>
//                 </Box>
//               )}
//               <Box
//                 sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
//               >
//                 <Typography variant="h6" fontWeight={700}>
//                   Grand Total
//                 </Typography>
//                 <Typography variant="h6" fontWeight={700} color="primary.main">
//                   {formatCurrency(quote?.finalAmount)}
//                 </Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Section: Specifications */}
//           {quote?.product.specifications?.length > 0 && (
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 borderRadius: 3,
//                 border: '1px solid',
//                 borderColor: 'divider',
//               }}
//             >
//               {/* <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
//                 Technical Specifications
//               </Typography> */}

//               <SectionHeader>Technical Specifications</SectionHeader>
//               <Grid container spacing={2}>
//                 {quote.product.specifications.map((spec: any, i: number) => (
//                   <Grid item xs={6} key={i}>
//                     <Typography
//                       variant="caption"
//                       color="text.secondary"
//                       display="block"
//                     >
//                       {spec.label}
//                     </Typography>
//                     <Typography variant="body2" fontWeight={500}>
//                       {spec.value}
//                     </Typography>
//                   </Grid>
//                 ))}
//               </Grid>
//             </Paper>
//           )}
//         </Grid>

//         <Grid item xs={12} md={4}>
//           {/* Customer Card */}
//           <Paper
//             elevation={0}
//             sx={{
//               p: 3,
//               borderRadius: 3,
//               border: '1px solid',
//               borderColor: 'divider',
//               mb: 3,
//             }}
//           >
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//               {/* <Person sx={{ color: 'text.secondary', fontSize: 20 }} /> */}
//               {/* <Typography variant="subtitle1" fontWeight={700}>
//                 Customer
//               </Typography> */}
//               <SectionHeader> Customer</SectionHeader>
//             </Box>
//             <Typography variant="body1" fontWeight={600}>
//               {quote?.customer.name}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {quote?.customer.phone}
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//               {quote?.customer.address}
//             </Typography>
//           </Paper>

//           {/* Delivery & Timeline */}
//           <Paper
//             elevation={0}
//             sx={{
//               p: 3,
//               borderRadius: 3,
//               border: '1px solid',
//               borderColor: 'divider',
//               mb: 3,
//             }}
//           >
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//               {/* <LocalShipping sx={{ color: 'text.secondary', fontSize: 20 }} /> */}
//               {/* <Typography variant="subtitle1" fontWeight={700}>
//                 Logistics
//               </Typography> */}
//               <SectionHeader>Logistics</SectionHeader>
//             </Box>
//             <Box
//               sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
//             >
//               <Typography variant="caption" color="text.secondary">
//                 Est. Delivery
//               </Typography>
//               <Typography variant="body2" fontWeight={500}>
//                 {formatDate(quote?.deliveryDate)}
//               </Typography>
//             </Box>
//             {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//               <Typography variant="caption" color="text.secondary">
//                 Expiration
//               </Typography>
//               <Typography variant="body2" fontWeight={500} color="error.main">
//                 {formatDate(quote?.expiryDate)}
//               </Typography>
//             </Box> */}
//           </Paper>

//           {/* Related Docs */}
//           {(quote?.order || quote?.invoice) && (
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 borderRadius: 3,
//                 bgcolor: '#F1F5F9',
//                 border: '1px solid',
//                 borderColor: 'divider',
//               }}
//             >
//               {/* <Typography variant="subtitle2" fontWeight={700} gutterBottom>
//                 Related Links
//               </Typography> */}
//               <SectionHeader> Related Links</SectionHeader>

//               <Box
//                 sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}
//               >
//                 {quote?.order && (
//                   <Button
//                     size="small"
//                     variant="text"
//                     startIcon={<ShoppingCart />}
//                     sx={{
//                       justifyContent: 'flex-start',
//                       color: '#0F172A',
//                       // p: 2,
//                     }}
//                     onClick={() =>
//                       router.push(`/sales/orders/${quote.order.id}`)
//                     }
//                   >
//                     Order {quote.order.orderNumber}
//                   </Button>
//                 )}
//                 {quote?.invoice && (
//                   <Button
//                     size="small"
//                     variant="text"
//                     startIcon={<Receipt />}
//                     sx={{ justifyContent: 'flex-start', color: '#0F172A' }}
//                     onClick={() =>
//                       router.push(`/sales/invoices/${quote.invoice.id}`)
//                     }
//                   >
//                     Invoice {quote.invoice.invoiceNumber}
//                   </Button>
//                 )}
//               </Box>
//             </Paper>
//           )}
//         </Grid>
//       </Grid>

//       {/* Standard Dialog for Quote Acceptance */}
//       <Dialog
//         open={acceptDialogOpen}
//         onClose={() => setAcceptDialogOpen(false)}
//         PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
//       >
//         <DialogTitle sx={{ fontWeight: 700 }}>
//           Confirm Quote Acceptance
//         </DialogTitle>
//         <DialogContent>
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//             Accepting this quote will automatically generate an Invoice and move
//             this to the processing stage.
//           </Typography>
//           <TextField
//             fullWidth
//             label="Invoice Due In (Days)"
//             type="number"
//             variant="outlined"
//             size="small"
//             value={dueInDays}
//             onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
//           />
//         </DialogContent>
//         <DialogActions sx={{ p: 3 }}>
//           <Button
//             onClick={() => setAcceptDialogOpen(false)}
//             sx={{ color: 'text.secondary' }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAcceptQuote}
//             variant="contained"
//             disabled={accepting}
//             sx={{ bgcolor: '#0F172A' }}
//           >
//             {accepting ? 'Processing...' : 'Confirm & Generate Invoice'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// src/app/dashboard/sales/quotes/[id]/page.tsx

'use client';

import '@/lib/pdf/fonts'; // 👈 MUST be before styles or <Document />

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  ArrowBack,
  CheckCircle,
  Print,
  ShoppingCart,
  Receipt,
  Download,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// --- PDF Imports ---
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
  Font,
} from '@react-pdf/renderer';
import { formatPrice } from '@/lib/utils';

// --- Configuration ---
// REPLACE THIS with your specific Cloudinary URL or public folder path (e.g., '/logo.png')
// For PDFs, absolute URLs (Cloudinary) are often more reliable than relative public paths.
const COMPANY_LOGO_URL = '/greenage_logo_black.png';

// // --- PDF Styles ---
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/helvetica/v1/0.ttf' }, // Regular
//     { src: 'https://fonts.gstatic.com/s/helvetica/v1/1.ttf', fontWeight: 700 }, // Bold
//   ],
// });

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    // fontFamily: 'Helvetica',
    fontSize: 10,
    fontFamily: 'Roboto',
    // fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logoSection: { flexDirection: 'column' },
  logo: { width: 120, height: 'auto', marginBottom: 10 },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  companyDetails: { fontSize: 9, color: '#64748B', lineHeight: 1.4 },

  quoteTitleBox: { alignItems: 'flex-end' },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  quoteMeta: { marginTop: 10, textAlign: 'right' },
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: {
    width: 80,
    color: '#64748B',
    textAlign: 'right',
    marginRight: 10,
  },
  metaValue: { fontWeight: 700, color: '#0F172A', textAlign: 'right' },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginVertical: 20,
  },

  customerSection: { flexDirection: 'row', marginBottom: 30 },
  customerCol: { width: '50%' },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: 4,
  },
  customerText: { fontSize: 10, color: '#475569', marginBottom: 2 },

  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 8,
    alignItems: 'center',
  },
  tableHeaderCell: { color: '#FFFFFF', fontWeight: 700, fontSize: 9 },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
  },
  col1: { width: '50%' }, // Product
  col2: { width: '15%', textAlign: 'center' }, // Qty
  col3: { width: '15%', textAlign: 'right' }, // Unit Price
  col4: { width: '20%', textAlign: 'right' }, // Total

  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsBox: { width: '40%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  totalLabel: { color: '#64748B' },
  totalValue: { color: '#0F172A', fontWeight: 700 },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 700, color: '#0F172A' },
  grandTotalValue: { fontSize: 12, fontWeight: 700, color: '#10B981' },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  footerText: { fontSize: 8, color: '#94A3B8', marginBottom: 4 },
});

// --- PDF Component ---
const QuoteDocument = ({ quote }: { quote: any }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoSection}>
            {/* Ensure this URL is accessible. If using Cloudinary, put full URL here */}
            {COMPANY_LOGO_URL && (
              <PdfImage style={pdfStyles.logo} src={COMPANY_LOGO_URL} />
            )}
            {/* <Text style={pdfStyles.companyName}>Your Company Name</Text> */}
            <Text style={pdfStyles.companyDetails}>
              Greenage office, ECCIMA House, Garden Avenue, Enugu, Nigeria.
            </Text>
            <Text style={pdfStyles.companyDetails}>
              contact@greenagetech.com
            </Text>
            <Text style={pdfStyles.companyDetails}>+234 906 000 3896</Text>
          </View>
          <View style={pdfStyles.quoteTitleBox}>
            <Text style={pdfStyles.quoteTitle}>Quote</Text>
            <View style={pdfStyles.quoteMeta}>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Quote #:</Text>
                <Text style={pdfStyles.metaValue}>{quote.quoteNumber}</Text>
              </View>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Date:</Text>
                <Text style={pdfStyles.metaValue}>
                  {new Date(quote.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaLabel}>Status:</Text>
                <Text style={pdfStyles.metaValue}>{quote.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        {/* Customer Info */}
        <View style={pdfStyles.customerSection}>
          <View style={pdfStyles.customerCol}>
            <Text style={pdfStyles.sectionTitle}>Quotation For:</Text>
            <Text style={pdfStyles.customerName}>{quote.customer.name}</Text>
            <Text style={pdfStyles.customerText}>{quote.customer.phone}</Text>
            <Text style={pdfStyles.customerText}>
              {quote.customer.email || ''}
            </Text>
            <Text style={pdfStyles.customerText}>
              {quote.customer.address || ''}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col1]}>
              Item Description
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col2]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col3]}>
              Unit Price
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col4]}>
              Amount
            </Text>
          </View>

          {/* Row (Single Product logic based on your data structure) */}
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.col1}>
              <Text style={{ fontWeight: 700, fontSize: 10, color: '#0F172A' }}>
                {quote.product.name}
              </Text>
              <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
                Code: {quote.product.productCode} • {quote.product.category}
              </Text>
            </View>
            <Text style={[pdfStyles.col2, { fontSize: 10 }]}>
              {quote.quantity}
            </Text>
            <Text style={[pdfStyles.col3, { fontSize: 10 }]}>
              {formatCurrency(quote.unitPrice)}
            </Text>
            <Text style={[pdfStyles.col4, { fontSize: 10, fontWeight: 700 }]}>
              {formatCurrency(quote.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Totals */}

        <View style={pdfStyles.totalsSection}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Subtotal</Text>
              <Text style={pdfStyles.totalValue}>
                {formatCurrency(quote.totalAmount)}
              </Text>
            </View>

            {/* Discount Row */}
            {quote.discountAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={[pdfStyles.totalLabel, { color: '#B91C1C' }]}>
                  Discount
                </Text>
                <Text style={[pdfStyles.totalValue, { color: '#B91C1C' }]}>
                  -{formatCurrency(quote.discountAmount)}
                </Text>
              </View>
            )}

            {/* Tax Row */}
            {quote.taxAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Tax (VAT)</Text>
                <Text style={pdfStyles.totalValue}>
                  {formatCurrency(quote.taxAmount)}
                </Text>
              </View>
            )}

            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>Grand Total</Text>
              <Text style={pdfStyles.grandTotalValue}>
                {formatCurrency(quote.finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>
            Terms & Conditions
          </Text>
          <Text style={pdfStyles.footerText}>
            1. This quote is valid for 30 days. 2. Payment terms: 50% upfront,
            50% on delivery. 3. Goods sold are in good condition.
          </Text>
          <Text style={{ marginTop: 10, fontSize: 8, color: '#CBD5E1' }}>
            Generated by Greenage Technologies
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// --- Main Page Component ---

// ... (Re-use your existing styles)
const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f3f4f6', text: '#6b7280' },
  SENT: { bg: '#dbeafe', text: '#1e40af' },
  ACCEPTED: { bg: '#dcfce7', text: '#166534' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  EXPIRED: { bg: '#fef3c7', text: '#92400e' },
  CONVERTED: { bg: '#e0e7ff', text: '#4338ca' },
};

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 700,
  color: '#0F172A',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quote, setQuote] = useState<any>(null);

  // PDF Download State
  const [isDownloading, setIsDownloading] = useState(false);

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dueInDays, setDueInDays] = useState(30);

  useEffect(() => {
    fetchQuote();
  }, [resolvedParams.id]);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch quote');
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setIsDownloading(true);
    try {
      // Generate Blob
      const blob = await pdf(<QuoteDocument quote={quote} />).toBlob();

      // Create Link and Click
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote_${quote.quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('PDF Generation Error', e);
      setError('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAcceptQuote = async () => {
    try {
      setAccepting(true);
      const res = await fetch(`/api/quotes/${resolvedParams.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueInDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept');
      setSuccess(
        `Quote accepted! Invoice ${data.invoice.invoiceNumber} created.`,
      );
      setAcceptDialogOpen(false);
      fetchQuote();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
        <CircularProgress size={40} />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Breadcrumbs & Actions Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mb: 1, textTransform: 'none', color: 'text.secondary' }}
          >
            Back to Quotes
          </Button>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0F172A' }}>
              {quote?.quoteNumber}
            </Typography>
            <Chip
              label={quote?.status}
              size="small"
              sx={{
                bgcolor: statusColors[quote?.status]?.bg,
                color: statusColors[quote?.status]?.text,
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Created on {formatDate(quote?.createdAt)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            startIcon={
              isDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            sx={{
              bgcolor: '#0F172A',
              '&:hover': { bgcolor: '#1E293B' },
              fontWeight: 600,
              textTransform: 'none',
            }}
            // sx={{ borderColor: '#CBD5E1', color: '#0F172A', fontWeight: 600 }}
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          {!quote?.isAccepted && (
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => setAcceptDialogOpen(true)}
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                fontWeight: 600,
              }}
            >
              Accept Quote
            </Button>
          )}
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Section: Product & Pricing */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SectionHeader>Line Items</SectionHeader>
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: '#F8FAFC',
                borderRadius: 2,
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {quote?.product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {quote?.product.productNumber}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={600}>
                  {quote?.quantity} Units
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{formatCurrency(quote?.unitPrice)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

            {/* <Box sx={{ ml: 'auto', maxWidth: 300 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(quote?.totalAmount)}
                </Typography>
              </Box>
              {quote?.discountAmount > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="error.main">
                    Discount
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(quote?.discountAmount)}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(quote?.finalAmount)}
                </Typography>
              </Box>
            </Box> */}

            {/* Main Content Area -> Line Items Paper */}
            <Box sx={{ ml: 'auto', maxWidth: 300 }}>
              {/* Subtotal */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(quote?.totalAmount)}
                </Typography>
              </Box>

              {/* Discount */}
              {quote?.discountAmount > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="error.main">
                    Discount
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(quote?.discountAmount)}
                  </Typography>
                </Box>
              )}

              {/* Tax */}
              {quote?.taxAmount > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Tax
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(quote?.taxAmount)}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(quote?.finalAmount)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Section: Specifications */}
          {quote?.product.specifications?.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SectionHeader>Technical Specifications</SectionHeader>
              <Grid container spacing={2}>
                {quote.product.specifications.map((spec: any, i: number) => (
                  <Grid item xs={6} key={i}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {spec.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {spec.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Customer Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SectionHeader> Customer</SectionHeader>
            </Box>
            <Typography variant="body1" fontWeight={600}>
              {quote?.customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quote?.customer.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {quote?.customer.address}
            </Typography>
          </Paper>

          {/* Delivery & Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SectionHeader>Logistics</SectionHeader>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                Est. Delivery
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(quote?.deliveryDate)}
              </Typography>
            </Box>
          </Paper>

          {/* Related Docs */}
          {(quote?.order || quote?.invoice) && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#F1F5F9',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SectionHeader> Related Links</SectionHeader>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}
              >
                {quote?.order && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ShoppingCart />}
                    sx={{ justifyContent: 'flex-start', color: '#0F172A' }}
                    onClick={() =>
                      router.push(`/sales/orders/${quote.order.id}`)
                    }
                  >
                    Order {quote.order.orderNumber}
                  </Button>
                )}
                {quote?.invoice && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Receipt />}
                    sx={{ justifyContent: 'flex-start', color: '#0F172A' }}
                    onClick={() =>
                      router.push(`/sales/invoices/${quote.invoice.id}`)
                    }
                  >
                    Invoice {quote.invoice.invoiceNumber}
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Standard Dialog for Quote Acceptance */}
      <Dialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Quote Acceptance
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Accepting this quote will automatically generate an Invoice and move
            this to the processing stage.
          </Typography>
          <TextField
            fullWidth
            label="Invoice Due In (Days)"
            type="number"
            variant="outlined"
            size="small"
            value={dueInDays}
            onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setAcceptDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptQuote}
            variant="contained"
            disabled={accepting}
            sx={{ bgcolor: '#0F172A' }}
          >
            {accepting ? 'Processing...' : 'Confirm & Generate Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
