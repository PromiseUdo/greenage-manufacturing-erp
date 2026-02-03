// // src/app/dashboard/sales/invoices/[id]/page.tsx

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
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Divider,
//   MenuItem,
//   LinearProgress,
//   List,
//   ListItem,
//   ListItemText,
//   Grid,
// } from '@mui/material';
// import {
//   ArrowBack,
//   Payment,
//   Print,
//   Receipt,
//   CheckCircle,
//   Warning,
// } from '@mui/icons-material';

// export default function InvoiceDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [invoice, setInvoice] = useState<any>(null);

//   // Payment dialog states
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
//   const [paymentAmount, setPaymentAmount] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('');
//   const [paymentReference, setPaymentReference] = useState('');
//   const [paymentNotes, setPaymentNotes] = useState('');

//   useEffect(() => {
//     fetchInvoice();
//   }, [resolvedParams.id]);

//   const fetchInvoice = async () => {
//     try {
//       const res = await fetch(`/api/invoices/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch invoice');
//       }

//       setInvoice(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRecordPayment = async () => {
//     setProcessing(true);
//     setError('');

//     try {
//       const amount = parseFloat(paymentAmount);
//       if (!amount || amount <= 0) {
//         throw new Error('Please enter a valid payment amount');
//       }

//       if (amount > invoice.balanceAmount) {
//         throw new Error('Payment amount exceeds balance');
//       }

//       const res = await fetch(`/api/invoices/${resolvedParams.id}/payment`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           amount,
//           paymentMethod,
//           paymentReference,
//           notes: paymentNotes,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to record payment');
//       }

//       setSuccess(`Payment of ${formatCurrency(amount)} recorded successfully!`);
//       setShowPaymentDialog(false);
//       setPaymentAmount('');
//       setPaymentMethod('');
//       setPaymentReference('');
//       setPaymentNotes('');
//       fetchInvoice();
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setProcessing(false);
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

//   const isOverdue = () => {
//     if (invoice?.status === 'PAID') return false;
//     return new Date(invoice?.dueDate) < new Date();
//   };

//   const getPaymentProgress = () => {
//     return (invoice?.paidAmount / invoice?.finalAmount) * 100;
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

//   if (error && !invoice) {
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
//     PENDING: { bg: '#fef3c7', text: '#92400e' },
//     PARTIALLY_PAID: { bg: '#dbeafe', text: '#1e40af' },
//     PAID: { bg: '#dcfce7', text: '#166534' },
//     OVERDUE: { bg: '#fee2e2', text: '#991b1b' },
//     CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
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
//           Back to Invoices
//         </Button>
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <Box>
//             <Typography variant="h6" fontWeight={600}>
//               {invoice?.invoiceNumber}
//             </Typography>
//             <Box
//               sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}
//             >
//               <Chip
//                 label={invoice?.status}
//                 size="small"
//                 icon={invoice?.status === 'PAID' ? <CheckCircle /> : undefined}
//                 sx={{
//                   bgcolor: statusColors[invoice?.status]?.bg || '#f3f4f6',
//                   color: statusColors[invoice?.status]?.text || '#6b7280',
//                   fontWeight: 500,
//                 }}
//               />
//               {isOverdue() && (
//                 <Chip
//                   label="Overdue"
//                   size="small"
//                   icon={<Warning />}
//                   sx={{
//                     bgcolor: '#fee2e2',
//                     color: '#991b1b',
//                     fontWeight: 500,
//                   }}
//                 />
//               )}
//             </Box>
//           </Box>
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             {invoice?.status !== 'PAID' && (
//               <Button
//                 variant="contained"
//                 startIcon={<Payment />}
//                 onClick={() => setShowPaymentDialog(true)}
//                 sx={{
//                   bgcolor: '#10b981',
//                   '&:hover': { bgcolor: '#059669' },
//                 }}
//               >
//                 Record Payment
//               </Button>
//             )}
//             <Button variant="outlined" startIcon={<Print />}>
//               Print Invoice
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

//       {isOverdue() && (
//         <Alert severity="error" sx={{ mb: 3 }}>
//           <strong>Payment Overdue!</strong> This invoice was due on{' '}
//           {formatDate(invoice.dueDate)}
//         </Alert>
//       )}

//       <Grid container spacing={3}>
//         {/* Payment Summary */}
//         <Grid size={{ xs: 12 }}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Payment Summary
//             </Typography>
//             <Grid container spacing={2} sx={{ mt: 1 }}>
//               <Grid size={{ xs: 12, md: 4 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Total Amount
//                 </Typography>
//                 <Typography variant="h5" fontWeight={700}>
//                   {formatCurrency(invoice?.finalAmount)}
//                 </Typography>
//               </Grid>
//               <Grid size={{ xs: 12, md: 4 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Paid Amount
//                 </Typography>
//                 <Typography variant="h5" fontWeight={700} color="success.main">
//                   {formatCurrency(invoice?.paidAmount)}
//                 </Typography>
//               </Grid>
//               <Grid size={{ xs: 12, md: 4 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Balance Due
//                 </Typography>
//                 <Typography
//                   variant="h5"
//                   fontWeight={700}
//                   color={
//                     invoice?.balanceAmount > 0 ? 'error.main' : 'success.main'
//                   }
//                 >
//                   {formatCurrency(invoice?.balanceAmount)}
//                 </Typography>
//               </Grid>
//               <Grid size={{ xs: 12 }}>
//                 <Box sx={{ mt: 2 }}>
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       mb: 1,
//                     }}
//                   >
//                     <Typography variant="body2" color="text.secondary">
//                       Payment Progress
//                     </Typography>
//                     <Typography variant="body2" fontWeight={600}>
//                       {getPaymentProgress().toFixed(0)}%
//                     </Typography>
//                   </Box>
//                   <LinearProgress
//                     variant="determinate"
//                     value={getPaymentProgress()}
//                     sx={{
//                       height: 8,
//                       borderRadius: 4,
//                       bgcolor: '#e5e7eb',
//                       '& .MuiLinearProgress-bar': {
//                         bgcolor:
//                           invoice?.status === 'PAID' ? '#10b981' : '#3b82f6',
//                       },
//                     }}
//                   />
//                 </Box>
//               </Grid>
//             </Grid>
//           </Paper>
//         </Grid>

//         {/* Customer & Invoice Info */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Customer
//             </Typography>
//             <Typography variant="body1" fontWeight={600}>
//               {invoice?.customer.name}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {invoice?.customer.email}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               {invoice?.customer.phone}
//             </Typography>
//           </Paper>
//         </Grid>

//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Invoice Information
//             </Typography>
//             <Box
//               sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
//             >
//               <Typography variant="body2" color="text.secondary">
//                 Issue Date:
//               </Typography>
//               <Typography variant="body2">
//                 {formatDate(invoice?.issueDate)}
//               </Typography>
//             </Box>
//             <Box
//               sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
//             >
//               <Typography variant="body2" color="text.secondary">
//                 Due Date:
//               </Typography>
//               <Typography
//                 variant="body2"
//                 color={isOverdue() ? 'error' : 'text.primary'}
//                 fontWeight={isOverdue() ? 600 : 400}
//               >
//                 {formatDate(invoice?.dueDate)}
//               </Typography>
//             </Box>
//             {invoice?.paymentTerms && (
//               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Payment Terms:
//                 </Typography>
//                 <Typography variant="body2">{invoice?.paymentTerms}</Typography>
//               </Box>
//             )}
//           </Paper>
//         </Grid>

//         {/* Product Details */}
//         <Grid size={{ xs: 12 }}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Invoice Items
//             </Typography>
//             <Box
//               sx={{
//                 mt: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 borderRadius: 1,
//               }}
//             >
//               <Box
//                 sx={{
//                   display: 'flex',
//                   p: 2,
//                   bgcolor: '#f8fafc',
//                   fontWeight: 600,
//                 }}
//               >
//                 <Typography sx={{ flex: 2 }}>Product</Typography>
//                 <Typography sx={{ flex: 1, textAlign: 'center' }}>
//                   Quantity
//                 </Typography>
//                 <Typography sx={{ flex: 1, textAlign: 'right' }}>
//                   Unit Price
//                 </Typography>
//                 <Typography sx={{ flex: 1, textAlign: 'right' }}>
//                   Total
//                 </Typography>
//               </Box>
//               <Box sx={{ display: 'flex', p: 2 }}>
//                 <Typography variant="body2" sx={{ flex: 2 }}>
//                   {invoice?.productType}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   sx={{ flex: 1, textAlign: 'center' }}
//                 >
//                   {invoice?.quantity}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   sx={{ flex: 1, textAlign: 'right' }}
//                 >
//                   {formatCurrency(invoice?.unitPrice)}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   sx={{ flex: 1, textAlign: 'right' }}
//                 >
//                   {formatCurrency(invoice?.totalAmount)}
//                 </Typography>
//               </Box>
//             </Box>

//             <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
//               <Box sx={{ minWidth: 300 }}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     mb: 1,
//                   }}
//                 >
//                   <Typography variant="body2">Subtotal:</Typography>
//                   <Typography variant="body2" fontWeight={600}>
//                     {formatCurrency(invoice?.totalAmount)}
//                   </Typography>
//                 </Box>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     mb: 1,
//                   }}
//                 >
//                   <Typography variant="body2">Tax:</Typography>
//                   <Typography variant="body2" fontWeight={600}>
//                     {formatCurrency(invoice?.taxAmount)}
//                   </Typography>
//                 </Box>
//                 {invoice?.discountAmount > 0 && (
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       mb: 1,
//                     }}
//                   >
//                     <Typography variant="body2">Discount:</Typography>
//                     <Typography variant="body2" fontWeight={600} color="error">
//                       -{formatCurrency(invoice?.discountAmount)}
//                     </Typography>
//                   </Box>
//                 )}
//                 <Divider sx={{ my: 1 }} />
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                   <Typography variant="h6" fontWeight={700}>
//                     Total:
//                   </Typography>
//                   <Typography variant="h6" fontWeight={700} color="primary">
//                     {formatCurrency(invoice?.finalAmount)}
//                   </Typography>
//                 </Box>
//               </Box>
//             </Box>
//           </Paper>
//         </Grid>

//         {/* Linked Documents */}
//         <Grid size={{ xs: 12 }}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Related Documents
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
//               <Button
//                 variant="outlined"
//                 startIcon={<Receipt />}
//                 onClick={() =>
//                   router.push(`/sales/quotes/${invoice?.quote.id}`)
//                 }
//               >
//                 View Quote: {invoice?.quote.quoteNumber}
//               </Button>
//               <Button
//                 variant="outlined"
//                 onClick={() =>
//                   router.push(`/sales/orders/${invoice?.order.id}`)
//                 }
//               >
//                 View Order: {invoice?.order.orderNumber}
//               </Button>
//             </Box>
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* Record Payment Dialog */}
//       <Dialog
//         open={showPaymentDialog}
//         onClose={() => !processing && setShowPaymentDialog(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Record Payment</DialogTitle>
//         <DialogContent>
//           <Alert severity="info" sx={{ mb: 3 }}>
//             Balance Due:{' '}
//             <strong>{formatCurrency(invoice?.balanceAmount)}</strong>
//           </Alert>

//           <TextField
//             fullWidth
//             label="Payment Amount"
//             type="number"
//             required
//             value={paymentAmount}
//             onChange={(e) => setPaymentAmount(e.target.value)}
//             disabled={processing}
//             sx={{ mb: 2 }}
//             InputProps={{
//               startAdornment: <span style={{ marginRight: 8 }}>₦</span>,
//             }}
//             inputProps={{
//               min: 0,
//               max: invoice?.balanceAmount,
//               step: 0.01,
//             }}
//             helperText={`Maximum: ${formatCurrency(invoice?.balanceAmount)}`}
//           />

//           <TextField
//             fullWidth
//             label="Payment Method"
//             select
//             required
//             value={paymentMethod}
//             onChange={(e) => setPaymentMethod(e.target.value)}
//             disabled={processing}
//             sx={{ mb: 2 }}
//           >
//             <MenuItem value="Cash">Cash</MenuItem>
//             <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
//             <MenuItem value="Card">Card</MenuItem>
//             <MenuItem value="Cheque">Cheque</MenuItem>
//             <MenuItem value="Mobile Money">Mobile Money</MenuItem>
//             <MenuItem value="Other">Other</MenuItem>
//           </TextField>

//           <TextField
//             fullWidth
//             label="Payment Reference"
//             value={paymentReference}
//             onChange={(e) => setPaymentReference(e.target.value)}
//             disabled={processing}
//             sx={{ mb: 2 }}
//             placeholder="Transaction ID, cheque number, etc."
//           />

//           <TextField
//             fullWidth
//             label="Notes"
//             multiline
//             rows={2}
//             value={paymentNotes}
//             onChange={(e) => setPaymentNotes(e.target.value)}
//             disabled={processing}
//             placeholder="Optional payment notes"
//           />
//         </DialogContent>
//         <DialogActions sx={{ p: 3 }}>
//           <Button
//             onClick={() => setShowPaymentDialog(false)}
//             disabled={processing}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             onClick={handleRecordPayment}
//             disabled={processing || !paymentAmount || !paymentMethod}
//             sx={{
//               bgcolor: '#10b981',
//               '&:hover': { bgcolor: '#059669' },
//             }}
//           >
//             {processing ? 'Processing...' : 'Record Payment'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

'use client';
import '@/lib/pdf/fonts'; // 👈 MUST be before styles or <Document />

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  MenuItem,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  ArrowBack,
  Payment,
  Print,
  Receipt,
  CheckCircle,
  Warning,
  Person,
  CalendarMonth,
  CreditCard,
  Description,
} from '@mui/icons-material';

// Add these to your imports
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
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: { width: 140, height: 'auto' },
  invoiceInfo: { textAlign: 'right' },
  title: { fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: 1 },
  metaText: { fontSize: 9, color: '#64748B', marginTop: 2 },

  section: { flexDirection: 'row', marginBottom: 30 },
  addressBox: { flex: 1 },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressText: { fontSize: 10, lineHeight: 1.4, color: '#1E293B' },

  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: { color: '#FFFFFF', fontWeight: 700, fontSize: 9 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 10,
    alignItems: 'center',
  },

  colDesc: { flex: 2 },
  colQty: { flex: 0.5, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },

  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsBox: { width: 200 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderTopWidth: 2,
    borderTopColor: '#0F172A',
  },

  statusStamp: {
    position: 'absolute',
    top: 150,
    right: 40,
    padding: 10,
    borderWidth: 2,
    borderRadius: 4,
    transform: 'rotate(15deg)',
    opacity: 0.4,
    fontSize: 20,
    fontWeight: 700,
  },
});

const InvoiceDocument = ({ invoice, formatCurrency, formatDate }: any) => {
  const isPaid = invoice.status === 'PAID';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Paid Stamp */}
        {isPaid && (
          <View
            style={[
              pdfStyles.statusStamp,
              { borderColor: '#10B981', color: '#10B981' },
            ]}
          >
            <Text>PAID IN FULL</Text>
          </View>
        )}

        <View style={pdfStyles.header}>
          <View>
            <PdfImage src={COMPANY_LOGO_URL} style={pdfStyles.logo} />
            <Text style={[pdfStyles.addressText, { marginTop: 10 }]}>
              Greenage office, ECCIMA House, Garden Avenue, Enugu, Nigeria.{' '}
            </Text>
            <Text style={pdfStyles.addressText}>contact@greenagetech.com</Text>
          </View>
          <View style={pdfStyles.invoiceInfo}>
            <Text style={pdfStyles.title}>INVOICE</Text>
            <Text style={pdfStyles.metaText}>
              Invoice #: {invoice.invoiceNumber}
            </Text>
            <Text style={pdfStyles.metaText}>
              Date: {formatDate(invoice.issueDate)}
            </Text>
            <Text
              style={[
                pdfStyles.metaText,
                { fontWeight: 700, color: '#EF4444' },
              ]}
            >
              Due: {formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.addressBox}>
            <Text style={pdfStyles.sectionLabel}>Bill To:</Text>
            <Text
              style={[pdfStyles.addressText, { fontWeight: 700, fontSize: 12 }]}
            >
              {invoice.customer.name}
            </Text>
            <Text style={pdfStyles.addressText}>
              {invoice.customer.address}
            </Text>
            <Text style={pdfStyles.addressText}>{invoice.customer.phone}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>
              Description
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>
              Qty
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>
              Unit Price
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>
              Amount
            </Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.colDesc}>
              <Text style={{ fontWeight: 700 }}>{invoice.product.name}</Text>

              <Text style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>
                Ref: {invoice.order.orderNumber}
              </Text>
            </View>
            <Text style={pdfStyles.colQty}>{invoice.quantity}</Text>
            <Text style={pdfStyles.colPrice}>
              {formatCurrency(invoice.unitPrice)}
            </Text>
            <Text style={[pdfStyles.colTotal, { fontWeight: 700 }]}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.totalsContainer}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.metaText}>Subtotal</Text>
              <Text style={pdfStyles.addressText}>
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </View>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.metaText}>Tax (VAT)</Text>
              <Text style={pdfStyles.addressText}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={[pdfStyles.metaText, { color: '#EF4444' }]}>
                  Discount
                </Text>
                <Text style={[pdfStyles.addressText, { color: '#EF4444' }]}>
                  -{formatCurrency(invoice.discountAmount)}
                </Text>
              </View>
            )}
            <View style={pdfStyles.grandTotal}>
              <Text style={{ fontWeight: 700 }}>Grand Total</Text>
              <Text style={{ fontWeight: 700, color: '#0F172A' }}>
                {formatCurrency(invoice.finalAmount)}
              </Text>
            </View>
            <View style={[pdfStyles.totalRow, { marginTop: 10 }]}>
              <Text style={pdfStyles.metaText}>Amount Paid</Text>
              <Text style={pdfStyles.addressText}>
                {formatCurrency(invoice.paidAmount)}
              </Text>
            </View>
            <View
              style={[
                pdfStyles.totalRow,
                { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 5 },
              ]}
            >
              <Text style={{ fontWeight: 700 }}>Balance Due</Text>
              <Text
                style={{
                  fontWeight: 700,
                  color: invoice.balanceAmount > 0 ? '#EF4444' : '#10B981',
                }}
              >
                {formatCurrency(invoice.balanceAmount)}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

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

const MoneyText = styled(Typography)(({ theme }) => ({
  fontFamily: 'monospace',
  fontWeight: 700,
  letterSpacing: '-0.5px',
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: 'none',
  height: '100%',
}));

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invoice, setInvoice] = useState<any>(null);

  // Payment dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      const blob = await pdf(
        <InvoiceDocument
          invoice={invoice}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF generation failed', err);
      setError('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [resolvedParams.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch invoice');
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const amount = parseFloat(paymentAmount);
      if (!amount || amount <= 0)
        throw new Error('Please enter a valid payment amount');
      if (amount > invoice.balanceAmount)
        throw new Error('Payment amount exceeds balance');

      const res = await fetch(`/api/invoices/${resolvedParams.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentReference,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setSuccess(`Payment of ${formatCurrency(amount)} recorded successfully!`);
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setPaymentReference('');
      setPaymentNotes('');
      fetchInvoice();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const isOverdue = () =>
    invoice?.status !== 'PAID' && new Date(invoice?.dueDate) < new Date();
  const getPaymentProgress = () =>
    (invoice?.paidAmount / invoice?.finalAmount) * 100;

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  if (error && !invoice) return <Alert severity="error">{error}</Alert>;

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: '#fef3c7', text: '#92400e' },
    PARTIALLY_PAID: { bg: '#dbeafe', text: '#1e40af' },
    PAID: { bg: '#dcfce7', text: '#166534' },
    OVERDUE: { bg: '#fee2e2', text: '#991b1b' },
    CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
        >
          Back to List
        </Button>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: '#0F172A' }}
              >
                {invoice?.invoiceNumber}
              </Typography>
              <Chip
                label={invoice?.status.replace('_', ' ')}
                icon={
                  invoice?.status === 'PAID' ? (
                    <CheckCircle fontSize="small" />
                  ) : undefined
                }
                sx={{
                  bgcolor: statusColors[invoice?.status]?.bg,
                  color: statusColors[invoice?.status]?.text,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Issued on {formatDate(invoice?.issueDate)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {/* <Button variant="outlined" startIcon={<Print />}>
              Print / PDF
            </Button> */}

            <Button
              variant="outlined"
              startIcon={
                isDownloading ? <CircularProgress size={18} /> : <Print />
              }
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              sx={{
                borderColor: '#CBD5E1',
                color: '#334155',
                fontWeight: 600,
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>

            {invoice?.status !== 'PAID' && (
              <Button
                variant="contained"
                startIcon={<Payment />}
                onClick={() => setShowPaymentDialog(true)}
                sx={{
                  bgcolor: '#0F172A',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#334155' },
                }}
              >
                Record Payment
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {isOverdue() && (
        <Alert
          severity="error"
          icon={<Warning />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>Payment Overdue!</strong> This invoice was due on{' '}
          {formatDate(invoice.dueDate)}. Please follow up with the client.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Financial Overview Card */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 3,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Payment Progress
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {getPaymentProgress().toFixed(0)}% Paid
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getPaymentProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#E2E8F0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: invoice?.status === 'PAID' ? '#10B981' : '#3B82F6',
                  },
                }}
              />
            </Box>
            <Grid container>
              <Grid item xs={12} md={4} sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Total Invoice Value
                </Typography>
                <MoneyText variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(invoice?.finalAmount)}
                </MoneyText>
              </Grid>
              <Grid item xs={12} md={4} sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Amount Paid
                </Typography>
                <MoneyText variant="h5" sx={{ mt: 1, color: '#166534' }}>
                  {formatCurrency(invoice?.paidAmount)}
                </MoneyText>
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  p: 3,
                  bgcolor: invoice?.balanceAmount > 0 ? '#FEF2F2' : '#F0FDF4',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Balance Due
                </Typography>
                <MoneyText
                  variant="h5"
                  sx={{
                    mt: 1,
                    color: invoice?.balanceAmount > 0 ? '#B91C1C' : '#166534',
                  }}
                >
                  {formatCurrency(invoice?.balanceAmount)}
                </MoneyText>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Customer & Meta Data */}
        <Grid item xs={12} md={6}>
          <InfoCard>
            <SectionHeader>
              Customer
              {/* <Person fontSize="small" /> Customer */}
            </SectionHeader>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {invoice?.customer.name}
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Email:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Phone:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.phone}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Addr:
                </Typography>
                <Typography variant="body2">
                  {invoice?.customer.address || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard>
            <SectionHeader>
              Payment Details
              {/* <CreditCard fontSize="small" /> Payment Details */}
            </SectionHeader>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px dashed #E2E8F0',
                  pb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={isOverdue() ? 'error.main' : 'text.primary'}
                >
                  {formatDate(invoice?.dueDate)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px dashed #E2E8F0',
                  pb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Payment Terms
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {invoice?.paymentTerms || 'Immediate'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Related Quote
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ minWidth: 0, p: 0, height: 'auto' }}
                  onClick={() =>
                    router.push(`/sales/quotes/${invoice?.quote.id}`)
                  }
                >
                  {invoice?.quote.quoteNumber}
                </Button>
              </Box>
            </Stack>
          </InfoCard>
        </Grid>

        {/* Line Items Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <SectionHeader sx={{ mb: 0 }}>
                Invoice Items
                {/* <Description fontSize="small" /> Invoice Items */}
              </SectionHeader>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 600, color: '#64748B', fontSize: 12 }}
                    >
                      ITEM DESCRIPTION
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: '#64748B', fontSize: 12 }}
                    >
                      QTY
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: '#64748B', fontSize: 12 }}
                    >
                      UNIT PRICE
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: '#64748B', fontSize: 12 }}
                    >
                      TOTAL
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {invoice?.productType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order Ref: {invoice?.order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{invoice?.quantity}</TableCell>
                    <TableCell align="right">
                      <MoneyText variant="body2">
                        {formatCurrency(invoice?.unitPrice)}
                      </MoneyText>
                    </TableCell>
                    <TableCell align="right">
                      <MoneyText variant="body2">
                        {formatCurrency(invoice?.totalAmount)}
                      </MoneyText>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Section */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                p: 3,
                bgcolor: '#F8FAFC',
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 360 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <MoneyText variant="body2">
                      {formatCurrency(invoice?.totalAmount)}
                    </MoneyText>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tax (VAT)
                    </Typography>
                    <MoneyText variant="body2">
                      {formatCurrency(invoice?.taxAmount)}
                    </MoneyText>
                  </Box>
                  {invoice?.discountAmount > 0 && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body2" color="error.main">
                        Discount
                      </Typography>
                      <MoneyText variant="body2" color="error.main">
                        -{formatCurrency(invoice?.discountAmount)}
                      </MoneyText>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Grand Total
                    </Typography>
                    <MoneyText variant="h6" color="#0F172A">
                      {formatCurrency(invoice?.finalAmount)}
                    </MoneyText>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Record Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => !processing && setShowPaymentDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 500 } }}
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}
        >
          Record Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert
            severity="info"
            variant="outlined"
            sx={{ mb: 3, border: '1px solid #BFDBFE', bgcolor: '#EFF6FF' }}
          >
            Balance Due:{' '}
            <strong>{formatCurrency(invoice?.balanceAmount)}</strong>
          </Alert>

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={processing}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₦</InputAdornment>
                ),
              }}
              inputProps={{ min: 0, max: invoice?.balanceAmount, step: 0.01 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {['Cash', 'Bank Transfer', 'Card', 'Cheque', 'POS'].map(
                    (m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Reference ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Txn Ref..."
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Internal Notes"
              multiline
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
        >
          <Button
            onClick={() => setShowPaymentDialog(false)}
            disabled={processing}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={processing || !paymentAmount || !paymentMethod}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
