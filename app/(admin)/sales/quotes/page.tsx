// // src/app/dashboard/sales/quotes/page.tsx

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
//   IconButton,
//   Chip,
//   MenuItem,
//   CircularProgress,
//   Menu,
//   ListItemIcon,
//   ListItemText,
// } from '@mui/material';
// import {
//   Search,
//   Add,
//   MoreVert,
//   Visibility,
//   CheckCircle,
//   Description,
//   Receipt,
// } from '@mui/icons-material';

// interface Quote {
//   id: string;
//   quoteNumber: string;
//   customer: {
//     id: string;
//     name: string;
//     phone: string;
//   };
//   product: {
//     id: string;
//     name: string;
//     productNumber: string;
//     category: string;
//   };
//   quantity: number;
//   finalAmount: number;
//   status: string;
//   isAccepted: boolean;
//   order: {
//     id: string;
//     orderNumber: string;
//   } | null;
//   invoice: {
//     id: string;
//     invoiceNumber: string;
//   } | null;
//   createdAt: string;
// }

// const statusColors: Record<string, { bg: string; text: string }> = {
//   DRAFT: { bg: '#f3f4f6', text: '#6b7280' },
//   SENT: { bg: '#dbeafe', text: '#1e40af' },
//   ACCEPTED: { bg: '#dcfce7', text: '#166534' },
//   REJECTED: { bg: '#fee2e2', text: '#991b1b' },
//   EXPIRED: { bg: '#fef3c7', text: '#92400e' },
//   CONVERTED: { bg: '#e0e7ff', text: '#4338ca' },
// };

// export default function QuotesPage() {
//   const router = useRouter();
//   const [quotes, setQuotes] = useState<Quote[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('');
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

//   useEffect(() => {
//     fetchQuotes();
//   }, [page, rowsPerPage, search, statusFilter]);

//   const fetchQuotes = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: (page + 1).toString(),
//         limit: rowsPerPage.toString(),
//         ...(search && { search }),
//         ...(statusFilter && { status: statusFilter }),
//       });

//       const res = await fetch(`/api/quotes?${params}`);
//       const data = await res.json();

//       if (res.ok) {
//         setQuotes(data.quotes);
//         setTotal(data.pagination.total);
//       }
//     } catch (error) {
//       console.error('Error fetching quotes:', error);
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

//   const handleMenuOpen = (
//     event: React.MouseEvent<HTMLElement>,
//     quote: Quote,
//   ) => {
//     event.stopPropagation();
//     setAnchorEl(event.currentTarget);
//     setSelectedQuote(quote);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//     setSelectedQuote(null);
//   };

//   const handleView = () => {
//     if (selectedQuote) {
//       router.push(`/sales/quotes/${selectedQuote.id}`);
//     }
//     handleMenuClose();
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
//             Quotes
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Manage customer quotes
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<Add />}
//           onClick={() => router.push('/sales/quotes/new')}
//           sx={{
//             bgcolor: '#0F172A',
//             fontWeight: 600,
//             '&:hover': { bgcolor: '#1e293b' },
//           }}
//         >
//           Create Quote
//         </Button>
//       </Box>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//         <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//           <TextField
//             placeholder="Search quotes..."
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
//             <MenuItem value="">All Statuses</MenuItem>
//             <MenuItem value="DRAFT">Draft</MenuItem>
//             <MenuItem value="SENT">Sent</MenuItem>
//             <MenuItem value="ACCEPTED">Accepted</MenuItem>
//             <MenuItem value="REJECTED">Rejected</MenuItem>
//             <MenuItem value="EXPIRED">Expired</MenuItem>
//             <MenuItem value="CONVERTED">Converted</MenuItem>
//           </TextField>
//         </Box>
//       </Paper>

//       {/* Table */}
//       <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#f8fafc' }}>
//               <TableCell sx={{ fontWeight: 600 }}>Quote #</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Links</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
//               <TableCell sx={{ fontWeight: 600 }} align="right">
//                 Actions
//               </TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
//                   <CircularProgress />
//                 </TableCell>
//               </TableRow>
//             ) : quotes.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
//                   <Typography color="text.secondary">
//                     No quotes found
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               quotes.map((quote) => (
//                 <TableRow
//                   key={quote.id}
//                   hover
//                   sx={{ cursor: 'pointer' }}
//                   onClick={() => router.push(`/sales/quotes/${quote.id}`)}
//                 >
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {quote.quoteNumber}
//                     </Typography>
//                     {quote.isAccepted && (
//                       <Chip
//                         label="Accepted"
//                         size="small"
//                         icon={<CheckCircle />}
//                         sx={{
//                           mt: 0.5,
//                           bgcolor: '#dcfce7',
//                           color: '#166534',
//                           fontSize: '0.7rem',
//                           height: 20,
//                         }}
//                       />
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <Box>
//                       <Typography variant="body2" fontWeight={600}>
//                         {quote.customer.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {quote.customer.phone}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Box>
//                       <Typography variant="body2" fontWeight={600}>
//                         {quote.product.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {quote.product.productNumber}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {quote.quantity} units
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {formatCurrency(quote.finalAmount)}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={quote.status}
//                       size="small"
//                       sx={{
//                         bgcolor: statusColors[quote.status]?.bg || '#f3f4f6',
//                         color: statusColors[quote.status]?.text || '#6b7280',
//                         fontWeight: 500,
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
//                       {quote.order && (
//                         <Chip
//                           label={quote.order.orderNumber}
//                           size="small"
//                           icon={<Description />}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             router.push(`/sales/orders/${quote.order!.id}`);
//                           }}
//                           sx={{ fontSize: '0.7rem' }}
//                         />
//                       )}
//                       {quote.invoice && (
//                         <Chip
//                           label={quote.invoice.invoiceNumber}
//                           size="small"
//                           icon={<Receipt />}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             router.push(`/sales/invoices/${quote.invoice!.id}`);
//                           }}
//                           sx={{ fontSize: '0.7rem' }}
//                         />
//                       )}
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="caption" color="text.secondary">
//                       {formatDate(quote.createdAt)}
//                     </Typography>
//                   </TableCell>
//                   <TableCell align="right" onClick={(e) => e.stopPropagation()}>
//                     <IconButton
//                       size="small"
//                       onClick={(e) => handleMenuOpen(e, quote)}
//                     >
//                       <MoreVert fontSize="small" />
//                     </IconButton>
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

//       {/* Actions Menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//       >
//         <MenuItem onClick={handleView}>
//           <ListItemIcon>
//             <Visibility fontSize="small" />
//           </ListItemIcon>
//           <ListItemText>View Details</ListItemText>
//         </MenuItem>
//       </Menu>
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
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Visibility,
  CheckCircle,
  Description,
  Receipt,
} from '@mui/icons-material';

// --- Replicated Styled Components from Products Table ---
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

interface Quote {
  id: string;
  quoteNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  product: {
    id: string;
    name: string;
    productNumber: string;
    category: string;
  };
  quantity: number;
  finalAmount: number;
  status: string;
  isAccepted: boolean;
  order: { id: string; orderNumber: string } | null;
  invoice: { id: string; invoiceNumber: string } | null;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f3f4f6', text: '#6b7280' },
  SENT: { bg: '#dbeafe', text: '#1e40af' },
  ACCEPTED: { bg: '#dcfce7', text: '#166534' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  EXPIRED: { bg: '#fef3c7', text: '#92400e' },
  CONVERTED: { bg: '#e0e7ff', text: '#4338ca' },
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/quotes?${params}`);
      const data = await res.json();
      if (res.ok) {
        setQuotes(data.quotes);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    quote: Quote,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
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
            Quotes Management
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Track customer estimates and conversion status
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => router.push('/sales/quotes/new')}
          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Create Quote
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
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search quotes, customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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
            sx={{ minWidth: 160 }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(statusColors).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table Container */}
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
                <StyledTableCell>Quote #</StyledTableCell>
                <StyledTableCell>Customer</StyledTableCell>
                <StyledTableCell>Product Details</StyledTableCell>
                <StyledTableCell>Qty</StyledTableCell>
                <StyledTableCell>Total Amount</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Related</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No quotes found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <StyledTableRow
                    key={quote.id}
                    onClick={() => router.push(`/sales/quotes/${quote.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: '#0F172A' }}
                      >
                        {quote.quoteNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {quote.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quote.customer.phone}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {quote.product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quote.product.productNumber}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {quote.quantity}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(quote.finalAmount)}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={quote.status}
                        size="small"
                        sx={{
                          bgcolor: statusColors[quote.status]?.bg || '#f3f4f6',
                          color: statusColors[quote.status]?.text || '#6b7280',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {quote.order && (
                          <Tooltip title={`Order: ${quote.order.orderNumber}`}>
                            <IconButton
                              size="small"
                              sx={{ bgcolor: '#f1f5f9' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/sales/orders/${quote.order?.id}`);
                              }}
                            >
                              <Description sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {quote.invoice && (
                          <Tooltip
                            title={`Invoice: ${quote.invoice.invoiceNumber}`}
                          >
                            <IconButton
                              size="small"
                              sx={{ bgcolor: '#f1f5f9' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/sales/invoices/${quote.invoice?.id}`,
                                );
                              }}
                            >
                              <Receipt sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </StyledTableCell>

                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, quote)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
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
            router.push(`/sales/quotes/${selectedQuote?.id}`);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="View Quote"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}
