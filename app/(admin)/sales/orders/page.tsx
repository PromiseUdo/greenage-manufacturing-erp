// // src/app/dashboard/sales/orders/page.tsx

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
//   Tooltip,
// } from '@mui/material';
// import {
//   Search,
//   Add,
//   MoreVert,
//   Visibility,
//   Description,
//   Receipt,
//   QrCode2,
// } from '@mui/icons-material';

// interface Order {
//   id: string;
//   orderNumber: string;
//   customer: {
//     id: string;
//     name: string;
//     phone: string;
//   };
//   product: {
//     id: string;
//     name: string;
//     productNumber: string;
//     productCode: string;
//   };
//   quantity: number;
//   status: string;
//   priority: string;
//   paymentStatus: string;
//   generatedUnitIds: string[] | null;
//   quote: {
//     id: string;
//     quoteNumber: string;
//   } | null;
//   invoice: {
//     id: string;
//     invoiceNumber: string;
//     status: string;
//   } | null;
//   _count: {
//     units: number;
//   };
//   createdAt: string;
// }

// const statusColors: Record<string, { bg: string; text: string }> = {
//   PENDING_PLANNING: { bg: '#f3f4f6', text: '#6b7280' },
//   IN_PRODUCTION: { bg: '#dbeafe', text: '#1e40af' },
//   QC_TESTING: { bg: '#fef3c7', text: '#92400e' },
//   PACKAGING: { bg: '#e0e7ff', text: '#4338ca' },
//   READY_FOR_DISPATCH: { bg: '#d1fae5', text: '#065f46' },
//   DISPATCHED: { bg: '#e0e7ff', text: '#4338ca' },
//   DELIVERED: { bg: '#dcfce7', text: '#166534' },
//   CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
// };

// const priorityColors: Record<string, { bg: string; text: string }> = {
//   LOW: { bg: '#f3f4f6', text: '#6b7280' },
//   NORMAL: { bg: '#dbeafe', text: '#1e40af' },
//   HIGH: { bg: '#fef3c7', text: '#92400e' },
//   URGENT: { bg: '#fee2e2', text: '#991b1b' },
// };

// export default function OrdersPage() {
//   const router = useRouter();
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('');
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

//   useEffect(() => {
//     fetchOrders();
//   }, [page, rowsPerPage, search, statusFilter]);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: (page + 1).toString(),
//         limit: rowsPerPage.toString(),
//         ...(search && { search }),
//         ...(statusFilter && { status: statusFilter }),
//       });

//       const res = await fetch(`/api/orders?${params}`);
//       const data = await res.json();

//       if (res.ok) {
//         setOrders(data.orders);
//         setTotal(data.pagination.total);
//       }
//     } catch (error) {
//       console.error('Error fetching orders:', error);
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
//     order: Order,
//   ) => {
//     event.stopPropagation();
//     setAnchorEl(event.currentTarget);
//     setSelectedOrder(order);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//     setSelectedOrder(null);
//   };

//   const handleView = () => {
//     if (selectedOrder) {
//       router.push(`/sales/orders/${selectedOrder.id}`);
//     }
//     handleMenuClose();
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
//             Orders
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Manage production orders
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<Add />}
//           onClick={() => router.push('/sales/orders/new')}
//           sx={{
//             bgcolor: '#0F172A',
//             fontWeight: 600,
//             '&:hover': { bgcolor: '#1e293b' },
//           }}
//         >
//           Create Order
//         </Button>
//       </Box>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//         <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//           <TextField
//             placeholder="Search orders..."
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
//             sx={{ minWidth: 180 }}
//             size="small"
//           >
//             <MenuItem value="">All Statuses</MenuItem>
//             <MenuItem value="PENDING_PLANNING">Pending Planning</MenuItem>
//             <MenuItem value="IN_PRODUCTION">In Production</MenuItem>
//             <MenuItem value="QC_TESTING">QC Testing</MenuItem>
//             <MenuItem value="PACKAGING">Packaging</MenuItem>
//             <MenuItem value="READY_FOR_DISPATCH">Ready for Dispatch</MenuItem>
//             <MenuItem value="DISPATCHED">Dispatched</MenuItem>
//             <MenuItem value="DELIVERED">Delivered</MenuItem>
//             <MenuItem value="CANCELLED">Cancelled</MenuItem>
//           </TextField>
//         </Box>
//       </Paper>

//       {/* Table */}
//       <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#f8fafc' }}>
//               <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Unit IDs</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
//               <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
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
//                 <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
//                   <CircularProgress />
//                 </TableCell>
//               </TableRow>
//             ) : orders.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
//                   <Typography color="text.secondary">
//                     No orders found
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               orders.map((order) => (
//                 <TableRow
//                   key={order.id}
//                   hover
//                   sx={{ cursor: 'pointer' }}
//                   onClick={() => router.push(`/sales/orders/${order.id}`)}
//                 >
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {order.orderNumber}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Box>
//                       <Typography variant="body2" fontWeight={600}>
//                         {order.customer.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {order.customer.phone}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Box>
//                       <Typography variant="body2" fontWeight={600}>
//                         {order.product.name}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {order.product.productNumber} •{' '}
//                         {order.product.productCode}
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {order.quantity} units
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     {order.generatedUnitIds &&
//                     order.generatedUnitIds.length > 0 ? (
//                       <Tooltip
//                         title={
//                           <Box>
//                             {order.generatedUnitIds.slice(0, 5).map((id) => (
//                               <Typography
//                                 key={id}
//                                 variant="caption"
//                                 display="block"
//                               >
//                                 {id}
//                               </Typography>
//                             ))}
//                             {order.generatedUnitIds.length > 5 && (
//                               <Typography variant="caption">
//                                 +{order.generatedUnitIds.length - 5} more
//                               </Typography>
//                             )}
//                           </Box>
//                         }
//                       >
//                         <Chip
//                           icon={<QrCode2 />}
//                           label={`${order.generatedUnitIds.length} IDs`}
//                           size="small"
//                           sx={{ fontSize: '0.7rem' }}
//                         />
//                       </Tooltip>
//                     ) : (
//                       <Typography variant="caption" color="text.secondary">
//                         Not generated
//                       </Typography>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={order.status.replace(/_/g, ' ')}
//                       size="small"
//                       sx={{
//                         bgcolor: statusColors[order.status]?.bg || '#f3f4f6',
//                         color: statusColors[order.status]?.text || '#6b7280',
//                         fontWeight: 500,
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={order.priority}
//                       size="small"
//                       sx={{
//                         bgcolor:
//                           priorityColors[order.priority]?.bg || '#f3f4f6',
//                         color:
//                           priorityColors[order.priority]?.text || '#6b7280',
//                         fontWeight: 500,
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={order.paymentStatus}
//                       size="small"
//                       color={
//                         order.paymentStatus === 'PAID'
//                           ? 'success'
//                           : order.paymentStatus === 'PARTIAL'
//                             ? 'warning'
//                             : 'default'
//                       }
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
//                       {order.quote && (
//                         <Chip
//                           label={order.quote.quoteNumber}
//                           size="small"
//                           icon={<Description />}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             router.push(`/sales/quotes/${order.quote!.id}`);
//                           }}
//                           sx={{ fontSize: '0.7rem' }}
//                         />
//                       )}
//                       {order.invoice && (
//                         <Chip
//                           label={order.invoice.invoiceNumber}
//                           size="small"
//                           icon={<Receipt />}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             router.push(`/sales/invoices/${order.invoice!.id}`);
//                           }}
//                           sx={{ fontSize: '0.7rem' }}
//                         />
//                       )}
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="caption" color="text.secondary">
//                       {formatDate(order.createdAt)}
//                     </Typography>
//                   </TableCell>
//                   <TableCell align="right" onClick={(e) => e.stopPropagation()}>
//                     <IconButton
//                       size="small"
//                       onClick={(e) => handleMenuOpen(e, order)}
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
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import {
  Search,
  Add,
  MoreVert,
  Visibility,
  Description,
  Receipt,
  QrCode2,
} from '@mui/icons-material';

// --- Replicated Styled Components ---
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

interface Order {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; phone: string };
  product: {
    id: string;
    name: string;
    productNumber: string;
    productCode: string;
  };
  quantity: number;
  status: string;
  priority: string;
  paymentStatus: string;
  generatedUnitIds: string[] | null;
  quote: { id: string; quoteNumber: string } | null;
  invoice: { id: string; invoiceNumber: string; status: string } | null;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING_PLANNING: { bg: '#f3f4f6', text: '#6b7280' },
  IN_PRODUCTION: { bg: '#dbeafe', text: '#1e40af' },
  QC_TESTING: { bg: '#fef3c7', text: '#92400e' },
  PACKAGING: { bg: '#e0e7ff', text: '#4338ca' },
  READY_FOR_DISPATCH: { bg: '#d1fae5', text: '#065f46' },
  DISPATCHED: { bg: '#e0e7ff', text: '#4338ca' },
  DELIVERED: { bg: '#dcfce7', text: '#166534' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f3f4f6', text: '#6b7280' },
  NORMAL: { bg: '#dbeafe', text: '#1e40af' },
  HIGH: { bg: '#fef3c7', text: '#92400e' },
  URGENT: { bg: '#fee2e2', text: '#991b1b' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    order: Order,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            Orders
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Manage production orders and tracking
          </Typography>
        </Box>
        <Button
          variant="contained"
          // startIcon={<Add />}
          onClick={() => router.push('/sales/orders/new')}
          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Create Order
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
            placeholder="Search orders, customers..."
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

      {/* Table Container */}

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
            Loading orders...
          </Typography>
        </Paper>
      ) : orders.length === 0 ? (
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
              <Receipt sx={{ fontSize: 28, color: 'action.active' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              No Orders yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Add your first order to get started with sales management
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: '#0F172A',
                '&:hover': { bgcolor: '#1e293b' },
              }}
              startIcon={<AddIcon />}
              onClick={() => router.push('/sales/orders/new')}
            >
              Add Order
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
                  <StyledTableCell>Order #</StyledTableCell>
                  <StyledTableCell>Customer</StyledTableCell>
                  <StyledTableCell>Product</StyledTableCell>
                  <StyledTableCell>Qty & Units</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Priority</StyledTableCell>
                  <StyledTableCell>Links</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <StyledTableRow
                    key={order.id}
                    onClick={() => router.push(`/sales/orders/${order.id}`)}
                  >
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: '#0F172A' }}
                      >
                        {order.orderNumber}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {order.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer.phone}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {order.product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.product.productCode}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {order.quantity}
                        </Typography>
                        {order.generatedUnitIds && (
                          <Tooltip
                            title={`${order.generatedUnitIds.length} Unit IDs generated`}
                          >
                            <Chip
                              icon={<QrCode2 style={{ fontSize: 14 }} />}
                              label={order.generatedUnitIds.length}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                bgcolor: '#f1f5f9',
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={order.status.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor: statusColors[order.status]?.bg || '#f3f4f6',
                          color: statusColors[order.status]?.text || '#6b7280',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={order.priority}
                        size="small"
                        sx={{
                          bgcolor:
                            priorityColors[order.priority]?.bg || '#f3f4f6',
                          color:
                            priorityColors[order.priority]?.text || '#6b7280',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {order.quote && (
                          <Tooltip title={`Quote: ${order.quote.quoteNumber}`}>
                            <IconButton
                              size="small"
                              sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }}
                            >
                              <Description sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.invoice && (
                          <Tooltip
                            title={`Invoice: ${order.invoice.invoiceNumber}`}
                          >
                            <IconButton
                              size="small"
                              sx={{ bgcolor: '#ecfdf5', color: '#059669' }}
                            >
                              <Receipt sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        {formatDate(order.createdAt)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order)}
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
            router.push(`/sales/orders/${selectedOrder?.id}`);
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
