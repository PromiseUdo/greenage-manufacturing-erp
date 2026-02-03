// // src/app/dashboard/sales/invoices/page.tsx

// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Button,
//   TextField,
//   InputAdornment,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Chip,
//   MenuItem,
//   CircularProgress,
//   LinearProgress,
// } from '@mui/material';
// import { Search, Receipt, Payment, Warning } from '@mui/icons-material';

// interface Invoice {
//   id: string;
//   invoiceNumber: string;
//   customer: {
//     id: string;
//     name: string;
//     email: string;
//   };
//   quote: {
//     id: string;
//     quoteNumber: string;
//   };
//   order: {
//     id: string;
//     orderNumber: string;
//     status: string;
//   };
//   productType: string;
//   quantity: number;
//   finalAmount: number;
//   paidAmount: number;
//   balanceAmount: number;
//   status: string;
//   paymentStatus: string;
//   issueDate: string;
//   dueDate: string;
//   createdAt: string;
// }

// const statusColors: Record<string, { bg: string; text: string }> = {
//   PENDING: { bg: '#fef3c7', text: '#92400e' },
//   PARTIALLY_PAID: { bg: '#dbeafe', text: '#1e40af' },
//   PAID: { bg: '#dcfce7', text: '#166534' },
//   OVERDUE: { bg: '#fee2e2', text: '#991b1b' },
//   CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
// };

// export default function InvoicesPage() {
//   const router = useRouter();
//   const [invoices, setInvoices] = useState<Invoice[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('');

//   useEffect(() => {
//     fetchInvoices();
//   }, [page, rowsPerPage, search, statusFilter]);

//   const fetchInvoices = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: (page + 1).toString(),
//         limit: rowsPerPage.toString(),
//         ...(search && { search }),
//         ...(statusFilter && { status: statusFilter }),
//       });

//       const res = await fetch(`/api/invoices?${params}`);
//       const data = await res.json();

//       if (res.ok) {
//         setInvoices(data.invoices);
//         setTotal(data.pagination.total);
//       }
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearch(e.target.value);
//     setPage(0);
//   };

//   const handleChangePage = (event: unknown, newPage: number) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (
//     event: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
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
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const isOverdue = (invoice: Invoice) => {
//     if (invoice.status === 'PAID') return false;
//     return new Date(invoice.dueDate) < new Date();
//   };

//   const getPaymentProgress = (invoice: Invoice) => {
//     return (invoice.paidAmount / invoice.finalAmount) * 100;
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
//           <Typography variant="h6" fontWeight={600}>
//             Invoices
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Manage customer invoices and payments
//           </Typography>
//         </Box>
//       </Box>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//         <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//           <TextField
//             placeholder="Search invoices..."
//             value={search}
//             onChange={handleSearchChange}
//             sx={{ minWidth: 300 }}
//             size="small"
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Search />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <TextField
//             select
//             label="Status"
//             value={statusFilter}
//             onChange={(e) => {
//               setStatusFilter(e.target.value);
//               setPage(0);
//             }}
//             sx={{ minWidth: 150 }}
//             size="small"
//           >
//             <MenuItem value="">All</MenuItem>
//             <MenuItem value="PENDING">Pending</MenuItem>
//             <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
//             <MenuItem value="PAID">Paid</MenuItem>
//             <MenuItem value="OVERDUE">Overdue</MenuItem>
//             <MenuItem value="CANCELLED">Cancelled</MenuItem>
//           </TextField>
//         </Box>
//       </Paper>

//       {/* Table */}
//       <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#f8fafc' }}>
//               <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
//                   <CircularProgress />
//                 </TableCell>
//               </TableRow>
//             ) : invoices.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
//                   <Typography color="text.secondary">
//                     No invoices found
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               invoices.map((invoice) => (
//                 <TableRow
//                   key={invoice.id}
//                   hover
//                   sx={{
//                     cursor: 'pointer',
//                     bgcolor: isOverdue(invoice) ? '#fef2f2' : 'inherit',
//                   }}
//                   onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
//                 >
//                   <TableCell>
//                     <Box>
//                       <Box
//                         sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//                       >
//                         <Typography variant="body2" fontWeight={600}>
//                           {invoice.invoiceNumber}
//                         </Typography>
//                         {isOverdue(invoice) && (
//                           <Warning sx={{ fontSize: 16, color: '#dc2626' }} />
//                         )}
//                       </Box>
//                       <Typography variant="caption" color="text.secondary">
//                         {formatDate(invoice.issueDate)}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {invoice.customer.name}
//                     </Typography>
//                     {invoice.customer.email && (
//                       <Typography variant="caption" color="text.secondary">
//                         {invoice.customer.email}
//                       </Typography>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {invoice.productType}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                       Qty: {invoice.quantity}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {formatCurrency(invoice.finalAmount)}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Box sx={{ minWidth: 120 }}>
//                       <Box
//                         sx={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           mb: 0.5,
//                         }}
//                       >
//                         <Typography variant="caption" color="text.secondary">
//                           Paid: {formatCurrency(invoice.paidAmount)}
//                         </Typography>
//                       </Box>
//                       <LinearProgress
//                         variant="determinate"
//                         value={getPaymentProgress(invoice)}
//                         sx={{
//                           height: 6,
//                           borderRadius: 3,
//                           bgcolor: '#e5e7eb',
//                           '& .MuiLinearProgress-bar': {
//                             bgcolor:
//                               invoice.status === 'PAID' ? '#10b981' : '#3b82f6',
//                           },
//                         }}
//                       />
//                       <Typography variant="caption" color="text.secondary">
//                         Balance: {formatCurrency(invoice.balanceAmount)}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography
//                       variant="body2"
//                       color={isOverdue(invoice) ? 'error' : 'text.primary'}
//                       fontWeight={isOverdue(invoice) ? 600 : 400}
//                     >
//                       {formatDate(invoice.dueDate)}
//                     </Typography>
//                     {isOverdue(invoice) && (
//                       <Typography variant="caption" color="error">
//                         Overdue
//                       </Typography>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={invoice.status}
//                       size="small"
//                       icon={invoice.status === 'PAID' ? <Payment /> : undefined}
//                       sx={{
//                         bgcolor: statusColors[invoice.status]?.bg || '#f3f4f6',
//                         color: statusColors[invoice.status]?.text || '#6b7280',
//                         fontWeight: 500,
//                       }}
//                     />
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//         <TablePagination
//           component="div"
//           count={total}
//           page={page}
//           onPageChange={handleChangePage}
//           rowsPerPage={rowsPerPage}
//           onRowsPerPageChange={handleChangeRowsPerPage}
//           rowsPerPageOptions={[10, 20, 50]}
//         />
//       </TableContainer>
//     </Box>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Visibility,
  Warning,
  Receipt,
  CheckCircle,
  Payment,
  Cancel,
  AttachMoney,
} from '@mui/icons-material';

// --- Replicated Styled Components (From Orders Table) ---
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  quote: {
    id: string;
    quoteNumber: string;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
  productType: string;
  quantity: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fff7ed', text: '#c2410c' }, // Orange
  PARTIALLY_PAID: { bg: '#eff6ff', text: '#1d4ed8' }, // Blue
  PAID: { bg: '#f0fdf4', text: '#15803d' }, // Green
  OVERDUE: { bg: '#fef2f2', text: '#b91c1c' }, // Red
  CANCELLED: { bg: '#f3f4f6', text: '#4b5563' }, // Gray
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();

      if (res.ok) {
        setInvoices(data.invoices);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    invoice: Invoice,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
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

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED')
      return false;
    return new Date(invoice.dueDate) < new Date();
  };

  const getPaymentProgress = (invoice: Invoice) => {
    if (invoice.finalAmount === 0) return 0;
    return (invoice.paidAmount / invoice.finalAmount) * 100;
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
            Invoices
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Track payments and outstanding balances
          </Typography>
        </Box>
        <Button
          variant="contained"
          // startIcon={<Add />}
          onClick={() => router.push('/sales/invoices/new')}
          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Create Invoice
        </Button>
      </Box>

      {/* Filters Search Bar */}
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search invoices, customers..."
            value={search}
            onChange={handleSearchChange}
            sx={{ maxWidth: 400, flexGrow: 1 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(statusColors).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table Content */}
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
            Loading invoices...
          </Typography>
        </Paper>
      ) : invoices.length === 0 ? (
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
              <AttachMoney sx={{ fontSize: 28, color: 'action.active' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              No Invoices Found
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Create an invoice to start tracking payments.
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: '#0F172A',
                '&:hover': { bgcolor: '#1e293b' },
              }}
              startIcon={<Add />}
              onClick={() => router.push('/sales/invoices/new')}
            >
              Create Invoice
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
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Invoice #</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Product</StyledTableCell>
                  <StyledTableCell>Total</StyledTableCell>
                  <StyledTableCell width={180}>
                    Payment Progress
                  </StyledTableCell>
                  <StyledTableCell>Due Date</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <StyledTableRow
                    key={invoice.id}
                    onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
                  >
                    <StyledTableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: '#0F172A' }}
                        >
                          {invoice.invoiceNumber}
                        </Typography>
                        {isOverdue(invoice) && (
                          <Tooltip title="Payment Overdue">
                            <Warning sx={{ fontSize: 16, color: '#dc2626' }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(invoice.issueDate)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.customer.email}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.productType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty: {invoice.quantity}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(invoice.finalAmount)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box sx={{ width: '100%' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.secondary"
                          >
                            {getPaymentProgress(invoice).toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Bal: {formatCurrency(invoice.balanceAmount)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getPaymentProgress(invoice)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                invoice.status === 'PAID'
                                  ? '#16a34a'
                                  : '#2563eb',
                            },
                          }}
                        />
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={isOverdue(invoice) ? 700 : 400}
                        sx={{
                          color: isOverdue(invoice) ? '#dc2626' : 'inherit',
                        }}
                      >
                        {formatDate(invoice.dueDate)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={invoice.status.replace(/_/g, ' ')}
                        size="small"
                        icon={
                          invoice.status === 'PAID' ? (
                            <CheckCircle style={{ fontSize: 14 }} />
                          ) : undefined
                        }
                        sx={{
                          bgcolor:
                            statusColors[invoice.status]?.bg || '#f3f4f6',
                          color:
                            statusColors[invoice.status]?.text || '#6b7280',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, invoice)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#F8FAFC',
            }}
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 160,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/sales/invoices/${selectedInvoice?.id}`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="View Details"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}
