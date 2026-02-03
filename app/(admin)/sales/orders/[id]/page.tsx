// // src/app/dashboard/sales/orders/[id]/page.tsx

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
//   Tabs,
//   Tab,
//   IconButton,
//   Tooltip,
//   Grid,
// } from '@mui/material';
// import {
//   ArrowBack,
//   Print,
//   Description,
//   Receipt,
//   QrCode2,
//   ContentCopy,
//   CheckCircle,
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

// export default function OrderDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [order, setOrder] = useState<any>(null);
//   const [tabValue, setTabValue] = useState(0);

//   useEffect(() => {
//     fetchOrder();
//   }, [resolvedParams.id]);

//   const fetchOrder = async () => {
//     try {
//       const res = await fetch(`/api/orders/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch order');
//       }

//       setOrder(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text);
//     setSuccess('Unit ID copied to clipboard!');
//     setTimeout(() => setSuccess(''), 2000);
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

//   if (error && !order) {
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
//     PENDING_PLANNING: { bg: '#f3f4f6', text: '#6b7280' },
//     IN_PRODUCTION: { bg: '#dbeafe', text: '#1e40af' },
//     QC_TESTING: { bg: '#fef3c7', text: '#92400e' },
//     PACKAGING: { bg: '#e0e7ff', text: '#4338ca' },
//     READY_FOR_DISPATCH: { bg: '#d1fae5', text: '#065f46' },
//     DISPATCHED: { bg: '#e0e7ff', text: '#4338ca' },
//     DELIVERED: { bg: '#dcfce7', text: '#166534' },
//     CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
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
//           Back to Orders
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
//                 {order?.orderNumber}
//               </Typography>
//               <Chip
//                 label={order?.status.replace(/_/g, ' ')}
//                 size="small"
//                 sx={{
//                   bgcolor: statusColors[order?.status]?.bg || '#f3f4f6',
//                   color: statusColors[order?.status]?.text || '#6b7280',
//                   fontWeight: 500,
//                 }}
//               />
//               <Chip
//                 label={order?.priority}
//                 size="small"
//                 color={
//                   order?.priority === 'URGENT'
//                     ? 'error'
//                     : order?.priority === 'HIGH'
//                       ? 'warning'
//                       : 'default'
//                 }
//               />
//             </Box>
//           </Box>
//           <Button variant="outlined" startIcon={<Print />}>
//             Print
//           </Button>
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
//             label="Order Details"
//             icon={<Description />}
//             iconPosition="start"
//           />
//           <Tab label="Unit IDs" icon={<QrCode2 />} iconPosition="start" />
//           <Tab label="Quote" icon={<Description />} iconPosition="start" />
//           <Tab label="Invoice" icon={<Receipt />} iconPosition="start" />
//         </Tabs>
//       </Paper>

//       {/* Order Details Tab */}
//       <TabPanel value={tabValue} index={0}>
//         <Grid container spacing={3}>
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
//                     <TableCell>{order?.customer.name}</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Phone:</TableCell>
//                     <TableCell>{order?.customer.phone}</TableCell>
//                   </TableRow>
//                   {order?.customer.email && (
//                     <TableRow>
//                       <TableCell sx={{ fontWeight: 600 }}>Email:</TableCell>
//                       <TableCell>{order?.customer.email}</TableCell>
//                     </TableRow>
//                   )}
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Address:</TableCell>
//                     <TableCell>{order?.customer.address}</TableCell>
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
//                         {order?.product.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {order?.product.productNumber} • Code:{' '}
//                         {order?.product.productCode}
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Category:</TableCell>
//                     <TableCell>
//                       {order?.product.category.replace(/_/g, ' ')}
//                     </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Quantity:</TableCell>
//                     <TableCell>{order?.quantity} units</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>
//                       Delivery Date:
//                     </TableCell>
//                     <TableCell>{formatDate(order?.deliveryDate)}</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>

//               {/* Specifications */}
//               {order?.product.specifications &&
//                 order.product.specifications.length > 0 && (
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
//                         {order.product.specifications.map(
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

//             {/* Production Units */}
//             {order?.units && order.units.length > 0 && (
//               <Paper sx={{ p: 3, borderRadius: 2 }}>
//                 <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                   Production Units ({order.units.length})
//                 </Typography>
//                 <Box sx={{ mt: 2 }}>
//                   {order.units.map((unit: any) => (
//                     <Box
//                       key={unit.id}
//                       sx={{
//                         p: 2,
//                         mb: 1,
//                         bgcolor: '#f8fafc',
//                         borderRadius: 1,
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                       }}
//                     >
//                       <Box>
//                         <Typography variant="body2" fontWeight={600}>
//                           Unit {unit.unitNumber} • {unit.unitId}
//                         </Typography>
//                         <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
//                           <Chip
//                             label={unit.currentStage.replace(/_/g, ' ')}
//                             size="small"
//                           />
//                           <Chip
//                             label={unit.status}
//                             size="small"
//                             color={
//                               unit.status === 'COMPLETED'
//                                 ? 'success'
//                                 : 'default'
//                             }
//                           />
//                         </Box>
//                       </Box>
//                     </Box>
//                   ))}
//                 </Box>
//               </Paper>
//             )}
//           </Grid>

//           {/* Sidebar */}
//           <Grid size={{ xs: 12, md: 4 }}>
//             {/* Order Info */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Order Information
//               </Typography>
//               <Box sx={{ mt: 2 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   Created:
//                 </Typography>
//                 <Typography variant="body2">
//                   {formatDate(order?.createdAt)}
//                 </Typography>
//               </Box>
//               <Box sx={{ mt: 1 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   Payment Status:
//                 </Typography>
//                 <Box sx={{ mt: 0.5 }}>
//                   <Chip
//                     label={order?.paymentStatus}
//                     size="small"
//                     color={
//                       order?.paymentStatus === 'PAID'
//                         ? 'success'
//                         : order?.paymentStatus === 'PARTIAL'
//                           ? 'warning'
//                           : 'default'
//                     }
//                   />
//                 </Box>
//               </Box>
//             </Paper>

//             {/* Related Documents */}
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Related Documents
//               </Typography>
//               {order?.quote && (
//                 <Chip
//                   label={order.quote.quoteNumber}
//                   icon={<Description />}
//                   onClick={() => router.push(`/sales/quotes/${order.quote.id}`)}
//                   sx={{ mt: 1, mr: 1 }}
//                 />
//               )}
//               {order?.invoice && (
//                 <Chip
//                   label={order.invoice.invoiceNumber}
//                   icon={<Receipt />}
//                   onClick={() =>
//                     router.push(`/sales/invoices/${order.invoice.id}`)
//                   }
//                   sx={{ mt: 1 }}
//                 />
//               )}
//             </Paper>

//             {/* Payment Terms */}
//             {order?.paymentTerms && (
//               <Paper sx={{ p: 3, borderRadius: 2 }}>
//                 <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                   Payment Terms
//                 </Typography>
//                 <Typography variant="body2">{order.paymentTerms}</Typography>
//               </Paper>
//             )}
//           </Grid>
//         </Grid>
//       </TabPanel>

//       {/* Unit IDs Tab */}
//       <TabPanel value={tabValue} index={1}>
//         <Paper sx={{ p: 3, borderRadius: 2 }}>
//           <Typography variant="h6" gutterBottom>
//             Generated Unit IDs ({order?.generatedUnitIds?.length || 0})
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//             These unique IDs will be programmed into each physical device
//           </Typography>

//           {order?.generatedUnitIds && order.generatedUnitIds.length > 0 ? (
//             <Grid container spacing={1}>
//               {order.generatedUnitIds.map((unitId: string, index: number) => (
//                 <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
//                   <Box
//                     sx={{
//                       p: 2,
//                       bgcolor: '#f8fafc',
//                       borderRadius: 1,
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       alignItems: 'center',
//                     }}
//                   >
//                     <Box>
//                       <Typography variant="caption" color="text.secondary">
//                         Unit {index + 1}
//                       </Typography>
//                       <Typography
//                         variant="body1"
//                         fontFamily="monospace"
//                         fontWeight={700}
//                         sx={{ letterSpacing: 1 }}
//                       >
//                         {unitId}
//                       </Typography>
//                     </Box>
//                     <Tooltip title="Copy">
//                       <IconButton
//                         size="small"
//                         onClick={() => copyToClipboard(unitId)}
//                       >
//                         <ContentCopy fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                   </Box>
//                 </Grid>
//               ))}
//             </Grid>
//           ) : (
//             <Alert severity="info">No unit IDs generated yet</Alert>
//           )}
//         </Paper>
//       </TabPanel>

//       {/* Quote Tab */}
//       <TabPanel value={tabValue} index={2}>
//         {order?.quote ? (
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Quote {order.quote.quoteNumber}
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//               <Chip label={order.quote.status} size="small" />
//               {order.quote.finalAmount && (
//                 <Chip
//                   label={`Amount: ₦${order.quote.finalAmount.toLocaleString()}`}
//                   size="small"
//                   color="primary"
//                 />
//               )}
//             </Box>
//             <Button
//               variant="contained"
//               onClick={() => router.push(`/sales/quotes/${order.quote.id}`)}
//             >
//               View Quote Details
//             </Button>
//           </Paper>
//         ) : (
//           <Alert severity="info">No quote linked to this order</Alert>
//         )}
//       </TabPanel>

//       {/* Invoice Tab */}
//       <TabPanel value={tabValue} index={3}>
//         {order?.invoice ? (
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Invoice {order.invoice.invoiceNumber}
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//               <Chip label={order.invoice.status} size="small" />
//               <Chip
//                 label={`Paid: ₦${order.invoice.paidAmount.toLocaleString()}`}
//                 size="small"
//                 color="success"
//               />
//               <Chip
//                 label={`Balance: ₦${order.invoice.balanceAmount.toLocaleString()}`}
//                 size="small"
//                 color="warning"
//               />
//             </Box>
//             <Button
//               variant="contained"
//               onClick={() => router.push(`/sales/invoices/${order.invoice.id}`)}
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
//     </Box>
//   );
// }

// // src/app/dashboard/sales/orders/[id]/page.tsx - ENHANCED VERSION

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
//   Tabs,
//   Tab,
//   IconButton,
//   Tooltip,
//   Grid,
//   Card,
//   CardContent,
//   Divider,
//   LinearProgress,
//   Stack,
// } from '@mui/material';
// import {
//   ArrowBack,
//   Print,
//   Description,
//   Receipt,
//   QrCode2,
//   ContentCopy,
//   CheckCircle,
//   LocalShipping,
//   Inventory,
//   Assignment,
//   Person,
//   CalendarMonth,
//   Phone,
//   Email,
//   LocationOn,
//   AttachMoney,
//   Category,
//   Numbers,
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

// // Timeline Step Component
// interface TimelineStepProps {
//   label: string;
//   icon: React.ReactNode;
//   isActive: boolean;
//   isCompleted: boolean;
//   date?: string;
//   isLast?: boolean;
// }

// function TimelineStep({
//   label,
//   icon,
//   isActive,
//   isCompleted,
//   date,
//   isLast = false,
// }: TimelineStepProps) {
//   return (
//     <Box
//       sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}
//     >
//       <Box
//         sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
//       >
//         <Box
//           sx={{
//             width: 48,
//             height: 48,
//             borderRadius: '50%',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             bgcolor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
//             color: isCompleted || isActive ? '#fff' : '#9ca3af',
//             transition: 'all 0.3s ease',
//             boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
//           }}
//         >
//           {isCompleted ? <CheckCircle /> : icon}
//         </Box>
//         {!isLast && (
//           <Box
//             sx={{
//               width: 2,
//               height: 60,
//               bgcolor: isCompleted ? '#10b981' : '#e5e7eb',
//               mt: 1,
//             }}
//           />
//         )}
//       </Box>
//       <Box sx={{ ml: 3, flex: 1, pb: isLast ? 0 : 4 }}>
//         <Typography
//           variant="subtitle1"
//           fontWeight={isActive ? 700 : 600}
//           color={isCompleted || isActive ? 'text.primary' : 'text.secondary'}
//         >
//           {label}
//         </Typography>
//         {date && (
//           <Typography variant="caption" color="text.secondary">
//             {date}
//           </Typography>
//         )}
//       </Box>
//     </Box>
//   );
// }

// export default function OrderDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [order, setOrder] = useState<any>(null);
//   const [tabValue, setTabValue] = useState(0);

//   useEffect(() => {
//     fetchOrder();
//   }, [resolvedParams.id]);

//   const fetchOrder = async () => {
//     try {
//       const res = await fetch(`/api/orders/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch order');
//       }

//       setOrder(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text);
//     setSuccess('Copied to clipboard!');
//     setTimeout(() => setSuccess(''), 2000);
//   };

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//     }).format(amount);
//   };

//   // Timeline configuration
//   const orderSteps = [
//     {
//       key: 'PENDING_PLANNING',
//       label: 'Pending Planning',
//       icon: <Assignment />,
//     },
//     {
//       key: 'IN_PRODUCTION',
//       label: 'In Production',
//       icon: <Inventory />,
//     },
//     {
//       key: 'QC_TESTING',
//       label: 'Quality Control',
//       icon: <CheckCircle />,
//     },
//     {
//       key: 'PACKAGING',
//       label: 'Packaging',
//       icon: <Inventory />,
//     },
//     {
//       key: 'READY_FOR_DISPATCH',
//       label: 'Ready for Dispatch',
//       icon: <LocalShipping />,
//     },
//     {
//       key: 'DISPATCHED',
//       label: 'Dispatched',
//       icon: <LocalShipping />,
//     },
//     {
//       key: 'DELIVERED',
//       label: 'Delivered',
//       icon: <CheckCircle />,
//     },
//   ];

//   const getCurrentStepIndex = () => {
//     if (!order) return 0;
//     return orderSteps.findIndex((step) => step.key === order.status);
//   };

//   const getProgressPercentage = () => {
//     const currentIndex = getCurrentStepIndex();
//     return ((currentIndex + 1) / orderSteps.length) * 100;
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

//   if (error && !order) {
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
//     PENDING_PLANNING: { bg: '#f3f4f6', text: '#6b7280' },
//     IN_PRODUCTION: { bg: '#dbeafe', text: '#1e40af' },
//     QC_TESTING: { bg: '#fef3c7', text: '#92400e' },
//     PACKAGING: { bg: '#e0e7ff', text: '#4338ca' },
//     READY_FOR_DISPATCH: { bg: '#d1fae5', text: '#065f46' },
//     DISPATCHED: { bg: '#fae8ff', text: '#86198f' },
//     DELIVERED: { bg: '#dcfce7', text: '#166534' },
//     CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
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
//           Back to Orders
//         </Button>
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'flex-start',
//             flexWrap: 'wrap',
//             gap: 2,
//           }}
//         >
//           <Box>
//             <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
//               <Typography variant="h5" fontWeight={700}>
//                 {order?.orderNumber}
//               </Typography>
//               <Chip
//                 label={order?.status.replace(/_/g, ' ')}
//                 size="medium"
//                 sx={{
//                   bgcolor: statusColors[order?.status]?.bg || '#f3f4f6',
//                   color: statusColors[order?.status]?.text || '#6b7280',
//                   fontWeight: 600,
//                   px: 2,
//                 }}
//               />
//             </Box>
//             <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
//               <Chip
//                 label={order?.priority}
//                 size="small"
//                 color={
//                   order?.priority === 'URGENT'
//                     ? 'error'
//                     : order?.priority === 'HIGH'
//                       ? 'warning'
//                       : 'default'
//                 }
//               />
//               <Chip
//                 label={`${order?.quantity} Units`}
//                 size="small"
//                 icon={<Numbers />}
//               />
//               <Chip
//                 label={formatDate(order?.deliveryDate)}
//                 size="small"
//                 icon={<CalendarMonth />}
//               />
//             </Box>
//           </Box>
//           <Button variant="outlined" startIcon={<Print />}>
//             Print Order
//           </Button>
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

//       {/* Progress Bar */}
//       <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
//         <Box sx={{ mb: 2 }}>
//           <Box
//             sx={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               mb: 1,
//             }}
//           >
//             <Typography variant="subtitle2" fontWeight={600}>
//               Order Progress
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {Math.round(getProgressPercentage())}% Complete
//             </Typography>
//           </Box>
//           <LinearProgress
//             variant="determinate"
//             value={getProgressPercentage()}
//             sx={{
//               height: 8,
//               borderRadius: 4,
//               bgcolor: '#e5e7eb',
//               '& .MuiLinearProgress-bar': {
//                 bgcolor: '#10b981',
//                 borderRadius: 4,
//               },
//             }}
//           />
//         </Box>
//       </Paper>

//       <Grid container spacing={3}>
//         {/* Left Column - Timeline & Details */}
//         <Grid size={{ xs: 12, lg: 4 }}>
//           {/* Timeline */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="h6" fontWeight={700} gutterBottom>
//               Order Timeline
//             </Typography>
//             <Divider sx={{ mb: 3 }} />
//             <Box>
//               {orderSteps.map((step, index) => (
//                 <TimelineStep
//                   key={step.key}
//                   label={step.label}
//                   icon={step.icon}
//                   isActive={getCurrentStepIndex() === index}
//                   isCompleted={getCurrentStepIndex() > index}
//                   isLast={index === orderSteps.length - 1}
//                 />
//               ))}
//             </Box>
//           </Paper>

//           {/* Quick Stats */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="h6" fontWeight={700} gutterBottom>
//               Quick Stats
//             </Typography>
//             <Divider sx={{ mb: 2 }} />
//             <Stack spacing={2}>
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Payment Status
//                 </Typography>
//                 <Box sx={{ mt: 0.5 }}>
//                   <Chip
//                     label={order?.paymentStatus}
//                     size="small"
//                     color={
//                       order?.paymentStatus === 'PAID'
//                         ? 'success'
//                         : order?.paymentStatus === 'PARTIAL'
//                           ? 'warning'
//                           : 'default'
//                     }
//                   />
//                 </Box>
//               </Box>
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Created On
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {formatDate(order?.createdAt)}
//                 </Typography>
//               </Box>
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Unit IDs Generated
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {order?.generatedUnitIds?.length || 0} IDs
//                 </Typography>
//               </Box>
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Production Units
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {order?.units?.length || 0} / {order?.quantity}
//                 </Typography>
//               </Box>
//             </Stack>
//           </Paper>

//           {/* Related Documents */}
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" fontWeight={700} gutterBottom>
//               Related Documents
//             </Typography>
//             <Divider sx={{ mb: 2 }} />
//             <Stack spacing={1.5}>
//               {order?.quote ? (
//                 <Card
//                   variant="outlined"
//                   sx={{
//                     cursor: 'pointer',
//                     '&:hover': { bgcolor: '#f8fafc' },
//                   }}
//                   onClick={() => router.push(`/sales/quotes/${order.quote.id}`)}
//                 >
//                   <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Description color="primary" />
//                       <Box>
//                         <Typography variant="body2" fontWeight={600}>
//                           {order.quote.quoteNumber}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           Quote
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               ) : (
//                 <Typography variant="caption" color="text.secondary">
//                   No quote linked
//                 </Typography>
//               )}

//               {order?.invoice ? (
//                 <Card
//                   variant="outlined"
//                   sx={{
//                     cursor: 'pointer',
//                     '&:hover': { bgcolor: '#f8fafc' },
//                   }}
//                   onClick={() =>
//                     router.push(`/sales/invoices/${order.invoice.id}`)
//                   }
//                 >
//                   <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Receipt color="success" />
//                       <Box>
//                         <Typography variant="body2" fontWeight={600}>
//                           {order.invoice.invoiceNumber}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           Invoice • {order.invoice.status}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               ) : (
//                 <Typography variant="caption" color="text.secondary">
//                   No invoice yet
//                 </Typography>
//               )}
//             </Stack>
//           </Paper>
//         </Grid>

//         {/* Right Column - Tabs Content */}
//         <Grid size={{ xs: 12, lg: 8 }}>
//           <Paper sx={{ borderRadius: 2, mb: 3 }}>
//             <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
//               <Tab
//                 label="Details"
//                 icon={<Description />}
//                 iconPosition="start"
//               />
//               <Tab label="Unit IDs" icon={<QrCode2 />} iconPosition="start" />
//             </Tabs>
//           </Paper>

//           {/* Details Tab */}
//           <TabPanel value={tabValue} index={0}>
//             {/* Customer Info */}
//             <Card sx={{ mb: 3, borderRadius: 2 }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 1,
//                     mb: 2,
//                   }}
//                 >
//                   <Person color="primary" />
//                   <Typography variant="h6" fontWeight={700}>
//                     Customer Information
//                   </Typography>
//                 </Box>
//                 <Grid container spacing={2}>
//                   <Grid size={{ xs: 12, sm: 6 }}>
//                     <Box>
//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                         display="block"
//                       >
//                         Name
//                       </Typography>
//                       <Typography variant="body1" fontWeight={600}>
//                         {order?.customer.name}
//                       </Typography>
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, sm: 6 }}>
//                     <Box>
//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                         display="block"
//                       >
//                         Phone
//                       </Typography>
//                       <Box
//                         sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
//                       >
//                         <Phone fontSize="small" color="action" />
//                         <Typography variant="body1">
//                           {order?.customer.phone}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </Grid>
//                   {order?.customer.email && (
//                     <Grid size={{ xs: 12, sm: 6 }}>
//                       <Box>
//                         <Typography
//                           variant="caption"
//                           color="text.secondary"
//                           display="block"
//                         >
//                           Email
//                         </Typography>
//                         <Box
//                           sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
//                         >
//                           <Email fontSize="small" color="action" />
//                           <Typography variant="body1">
//                             {order?.customer.email}
//                           </Typography>
//                         </Box>
//                       </Box>
//                     </Grid>
//                   )}
//                   <Grid size={{ xs: 12 }}>
//                     <Box>
//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                         display="block"
//                       >
//                         Address
//                       </Typography>
//                       <Box
//                         sx={{ display: 'flex', alignItems: 'start', gap: 1 }}
//                       >
//                         <LocationOn fontSize="small" color="action" />
//                         <Typography variant="body1">
//                           {order?.customer.address}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </Grid>
//                 </Grid>
//               </CardContent>
//             </Card>

//             {/* Product Info */}
//             <Card sx={{ mb: 3, borderRadius: 2 }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 1,
//                     mb: 2,
//                   }}
//                 >
//                   <Category color="primary" />
//                   <Typography variant="h6" fontWeight={700}>
//                     Product Details
//                   </Typography>
//                 </Box>
//                 <Grid container spacing={2}>
//                   <Grid size={{ xs: 12 }}>
//                     <Box>
//                       <Typography variant="h6" fontWeight={700}>
//                         {order?.product.name}
//                       </Typography>
//                       <Typography variant="body2" color="text.secondary">
//                         {order?.product.productNumber} • Code:{' '}
//                         {order?.product.productCode}
//                       </Typography>
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, sm: 6 }}>
//                     <Box>
//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                         display="block"
//                       >
//                         Category
//                       </Typography>
//                       <Chip
//                         label={order?.product.category.replace(/_/g, ' ')}
//                         size="small"
//                         sx={{ mt: 0.5 }}
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, sm: 6 }}>
//                     <Box>
//                       <Typography
//                         variant="caption"
//                         color="text.secondary"
//                         display="block"
//                       >
//                         Quantity
//                       </Typography>
//                       <Typography variant="body1" fontWeight={600}>
//                         {order?.quantity} units
//                       </Typography>
//                     </Box>
//                   </Grid>
//                 </Grid>

//                 {/* Specifications */}
//                 {order?.product.specifications &&
//                   order.product.specifications.length > 0 && (
//                     <Box sx={{ mt: 3 }}>
//                       <Typography
//                         variant="subtitle2"
//                         fontWeight={700}
//                         gutterBottom
//                       >
//                         Technical Specifications
//                       </Typography>
//                       <Divider sx={{ mb: 2 }} />
//                       <Grid container spacing={2}>
//                         {order.product.specifications.map(
//                           (spec: any, index: number) => (
//                             <Grid size={{ xs: 12, sm: 6 }} key={index}>
//                               <Box
//                                 sx={{
//                                   p: 2,
//                                   bgcolor: '#f8fafc',
//                                   borderRadius: 1,
//                                 }}
//                               >
//                                 <Typography
//                                   variant="caption"
//                                   color="text.secondary"
//                                   display="block"
//                                 >
//                                   {spec.label}
//                                 </Typography>
//                                 <Typography variant="body2" fontWeight={600}>
//                                   {spec.value}
//                                 </Typography>
//                               </Box>
//                             </Grid>
//                           ),
//                         )}
//                       </Grid>
//                     </Box>
//                   )}
//               </CardContent>
//             </Card>

//             {/* Payment Terms */}
//             {order?.paymentTerms && (
//               <Card sx={{ borderRadius: 2 }}>
//                 <CardContent sx={{ p: 3 }}>
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: 1,
//                       mb: 2,
//                     }}
//                   >
//                     <AttachMoney color="primary" />
//                     <Typography variant="h6" fontWeight={700}>
//                       Payment Terms
//                     </Typography>
//                   </Box>
//                   <Typography variant="body1">{order.paymentTerms}</Typography>
//                 </CardContent>
//               </Card>
//             )}
//           </TabPanel>

//           {/* Unit IDs Tab */}
//           <TabPanel value={tabValue} index={1}>
//             <Card sx={{ borderRadius: 2 }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Box sx={{ mb: 3 }}>
//                   <Typography variant="h6" fontWeight={700} gutterBottom>
//                     Generated Unit IDs ({order?.generatedUnitIds?.length || 0})
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     These unique IDs will be programmed into each physical
//                     device
//                   </Typography>
//                 </Box>

//                 {order?.generatedUnitIds &&
//                 order.generatedUnitIds.length > 0 ? (
//                   <Grid container spacing={2}>
//                     {order.generatedUnitIds.map(
//                       (unitId: string, index: number) => (
//                         <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
//                           <Card
//                             variant="outlined"
//                             sx={{
//                               transition: 'all 0.2s',
//                               '&:hover': {
//                                 boxShadow: 2,
//                                 borderColor: 'primary.main',
//                               },
//                             }}
//                           >
//                             <CardContent sx={{ p: 2 }}>
//                               <Box
//                                 sx={{
//                                   display: 'flex',
//                                   justifyContent: 'space-between',
//                                   alignItems: 'center',
//                                 }}
//                               >
//                                 <Box>
//                                   <Typography
//                                     variant="caption"
//                                     color="text.secondary"
//                                   >
//                                     Unit {index + 1}
//                                   </Typography>
//                                   <Typography
//                                     variant="h6"
//                                     fontFamily="monospace"
//                                     fontWeight={700}
//                                     sx={{ letterSpacing: 1 }}
//                                   >
//                                     {unitId}
//                                   </Typography>
//                                 </Box>
//                                 <Tooltip title="Copy Unit ID">
//                                   <IconButton
//                                     size="small"
//                                     onClick={() => copyToClipboard(unitId)}
//                                     sx={{
//                                       bgcolor: '#f8fafc',
//                                       '&:hover': { bgcolor: '#e5e7eb' },
//                                     }}
//                                   >
//                                     <ContentCopy fontSize="small" />
//                                   </IconButton>
//                                 </Tooltip>
//                               </Box>
//                             </CardContent>
//                           </Card>
//                         </Grid>
//                       ),
//                     )}
//                   </Grid>
//                 ) : (
//                   <Alert severity="info">No unit IDs generated yet</Alert>
//                 )}
//               </CardContent>
//             </Card>
//           </TabPanel>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Card,
  Divider,
  LinearProgress,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  ArrowBack,
  Print,
  QrCode2,
  ContentCopy,
  CheckCircle,
  LocalShipping,
  Inventory,
  Assignment,
  Person,
  Description,
  Settings,
  Download,
} from '@mui/icons-material';

// Add these to your imports at the top
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

const COMPANY_LOGO_URL = '/greenage_logo_black.png';

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: { width: 120, height: 'auto' },
  orderInfo: { textAlign: 'right' },
  title: { fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 },
  statusBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    textAlign: 'center',
  },
  section: { marginTop: 25 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', marginBottom: 15 },
  column: { flex: 1 },
  label: { fontSize: 8, color: '#94A3B8', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 700, color: '#0F172A' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  specItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    marginRight: '2%',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: { fontSize: 8, color: '#94A3B8' },
});

const OrderDocument = ({ order }: { order: any }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <View>
          <PdfImage src={COMPANY_LOGO_URL} style={pdfStyles.logo} />
        </View>
        <View style={pdfStyles.orderInfo}>
          <Text style={pdfStyles.title}>ORDER SUMMARY</Text>
          <Text style={pdfStyles.value}>{order.orderNumber}</Text>
          <Text style={[pdfStyles.statusBadge, { marginTop: 5 }]}>
            STATUS: {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Customer & Logistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Client & Logistics</Text>
        <View style={pdfStyles.row}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Customer Name</Text>
            <Text style={pdfStyles.value}>{order.customer.name}</Text>
          </View>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Due Date</Text>
            <Text style={pdfStyles.value}>
              {new Date(order.deliveryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.row}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Installation Address</Text>
            <Text style={pdfStyles.value}>{order.customer.address}</Text>
          </View>
        </View>
      </View>

      {/* Product Specification */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Technical Specifications</Text>
        <View style={pdfStyles.row}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Product</Text>
            <Text style={pdfStyles.value}>{order.product.name}</Text>
          </View>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.label}>Quantity</Text>
            <Text style={pdfStyles.value}>{order.quantity} Units</Text>
          </View>
        </View>

        <View style={pdfStyles.specGrid}>
          {order.product.specifications?.map((spec: any, i: number) => (
            <View key={i} style={pdfStyles.specItem}>
              <Text style={pdfStyles.label}>{spec.label}</Text>
              <Text style={pdfStyles.value}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>
          Confidential Production Document • Generated on{' '}
          {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Page>
  </Document>
);

// --- Design Tokens ---
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

// --- Status Configuration ---
const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING_PLANNING: { bg: '#f3f4f6', text: '#6b7280' },
  IN_PRODUCTION: { bg: '#dbeafe', text: '#1e40af' },
  QC_TESTING: { bg: '#fef3c7', text: '#92400e' },
  PACKAGING: { bg: '#e0e7ff', text: '#4338ca' },
  READY_FOR_DISPATCH: { bg: '#d1fae5', text: '#065f46' },
  DISPATCHED: { bg: '#fae8ff', text: '#86198f' },
  DELIVERED: { bg: '#dcfce7', text: '#166534' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

const ORDER_STEPS = [
  {
    key: 'PENDING_PLANNING',
    label: 'Planning',
    icon: <Assignment fontSize="small" />,
  },
  {
    key: 'IN_PRODUCTION',
    label: 'Production',
    icon: <Settings fontSize="small" />,
  },
  {
    key: 'QC_TESTING',
    label: 'Quality Control',
    icon: <CheckCircle fontSize="small" />,
  },
  {
    key: 'PACKAGING',
    label: 'Packaging',
    icon: <Inventory fontSize="small" />,
  },
  {
    key: 'READY_FOR_DISPATCH',
    label: 'Ready for Dispatch',
    icon: <LocalShipping fontSize="small" />,
  },
  {
    key: 'DISPATCHED',
    label: 'Dispatched',
    icon: <LocalShipping fontSize="small" />,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: <CheckCircle fontSize="small" />,
  },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const handleDownloadPdf = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const blob = await pdf(<OrderDocument order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Order_${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF Error:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Helpers ---
  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return ORDER_STEPS.findIndex((step) => step.key === order.status);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / ORDER_STEPS.length) * 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error && !order) return <Alert severity="error">{error}</Alert>;

  const currentStepIndex = getCurrentStepIndex();
  const progressPercent = getProgressPercentage();

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mb: 1, textTransform: 'none', color: 'text.secondary', p: 0 }}
          >
            Back to Orders List
          </Button>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="#0F172A">
              Order {order?.orderNumber}
            </Typography>
            <Chip
              label={order?.status.replace(/_/g, ' ')}
              sx={{
                bgcolor: statusColors[order?.status]?.bg,
                color: statusColors[order?.status]?.text,
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Product: <strong>{order?.product.name}</strong>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" color="text.secondary">
              Due: <strong>{formatDate(order?.deliveryDate)}</strong>
            </Typography>
          </Stack>
        </Box>
        {/* <Button
          variant="contained"
          startIcon={<Print />}
          sx={{ fontWeight: 600 }}
        >
          Export Documents
        </Button> */}

        <Button
          variant="contained"
          startIcon={
            isDownloading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Download />
            )
          }
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          sx={{
            bgcolor: '#0F172A',
            '&:hover': { bgcolor: '#1E293B' },
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          {isDownloading ? 'Generating...' : 'Download Order PDF'}
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Dynamic Timeline & Status */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', mb: 3 }}
          >
            <SectionHeader>
              {/* <Assignment fontSize="small" /> Production Track */}
              Production Track
            </SectionHeader>

            {/* Progress Bar */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="caption" fontWeight={700}>
                  Completion
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progressPercent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#F1F5F9',
                  '& .MuiLinearProgress-bar': { bgcolor: '#10B981' },
                }}
              />
            </Box>

            {/* Dynamic Timeline Stepper */}
            <Stack spacing={0}>
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === ORDER_STEPS.length - 1;

                return (
                  <Box
                    key={step.key}
                    sx={{ display: 'flex', position: 'relative' }}
                  >
                    {/* Step Connector Line */}
                    {!isLast && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 15,
                          top: 30,
                          bottom: -10,
                          width: 2,
                          bgcolor: isCompleted ? '#10B981' : '#E2E8F0',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Visual Logic */}
                    <Box sx={{ mr: 2, zIndex: 1, pb: 3 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: isCompleted
                            ? '#10B981'
                            : isCurrent
                              ? '#EFF6FF'
                              : '#F1F5F9',
                          border: isCurrent ? '2px solid #3B82F6' : 'none',
                          color: isCompleted
                            ? '#fff'
                            : isCurrent
                              ? '#3B82F6'
                              : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle fontSize="small" sx={{ fontSize: 18 }} />
                        ) : (
                          step.icon
                        )}
                      </Box>
                    </Box>

                    {/* Text Logic */}
                    <Box sx={{ pt: 0.5 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isCurrent ? 700 : 500}
                        color={
                          isCurrent
                            ? '#0F172A'
                            : isCompleted
                              ? 'text.primary'
                              : 'text.secondary'
                        }
                      >
                        {step.label}
                      </Typography>
                      {isCurrent && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        >
                          Current Stage
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* Docs Card */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}
          >
            <SectionHeader>
              Reference Docs
              {/* <Description fontSize="small" /> Reference Docs */}
            </SectionHeader>
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#F8FAFC',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Quote Ref
                </Typography>
                {order?.quote ? (
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(`/sales/quotes/${order.quote.id}`)
                    }
                  >
                    {order.quote.quoteNumber}
                  </Button>
                ) : (
                  <Typography variant="caption">N/A</Typography>
                )}
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#F8FAFC',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Invoice
                </Typography>
                {order?.invoice ? (
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(`/sales/invoices/${order.invoice.id}`)
                    }
                  >
                    {order.invoice.invoiceNumber}
                  </Button>
                ) : (
                  <Typography variant="caption">Pending</Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Tabbed Details */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                },
              }}
            >
              <Tab
                label="Order Details"
                icon={<Assignment fontSize="small" />}
                iconPosition="start"
              />
              <Tab
                label="Unit Serial IDs"
                icon={<QrCode2 fontSize="small" />}
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Stack spacing={4}>
                  {/* Customer Info */}
                  <Box>
                    <SectionHeader>
                      Customer Details
                      {/* <Person fontSize="small" /> Customer Details */}
                    </SectionHeader>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Client Name
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.phone}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Installation Address
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.customer.address}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider />
                  {/* Product Details */}
                  <Box>
                    <SectionHeader>
                      {/* <Inventory fontSize="small" /> Item Specification */}
                      Item Specification
                    </SectionHeader>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Product Category
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.product.category}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Order Quantity
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order?.quantity} Units
                        </Typography>
                      </Grid>
                      {order?.product.specifications?.map(
                        (spec: any, i: number) => (
                          <Grid item xs={6} key={i}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: '#F8FAFC',
                                borderRadius: 2,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {spec.label}
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {spec.value}
                              </Typography>
                            </Box>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </Box>
                </Stack>
              )}

              {tabValue === 1 && (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 3,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Generated IDs for production programming.
                    </Typography>
                  </Box>
                  {order?.generatedUnitIds?.length > 0 ? (
                    <Grid container spacing={2}>
                      {order.generatedUnitIds.map((id: string, i: number) => (
                        <Grid item xs={12} sm={4} key={i}>
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid #E2E8F0',
                              borderRadius: 2,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              bgcolor: '#fff',
                              transition: '0.2s',
                              '&:hover': { borderColor: '#94A3B8' },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: '#334155',
                              }}
                            >
                              {id}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(id)}
                            >
                              <ContentCopy sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info" variant="outlined">
                      No IDs generated yet. Wait for production to start.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
