// src/app/dashboard/customers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  VpnKey,
  VpnKeyOff,
  Phone,
  Email,
  Person,
} from '@mui/icons-material';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string;
  contactPerson: string | null;
  userId: string | null;
  user: {
    id: string;
    email: string;
    isActive: boolean;
  } | null;
  _count: {
    orders: number;
  };
  createdAt: string;
}

import { styled, tableCellClasses } from '@mui/material';

/* ---------- Shared Table Styles ---------- */
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#0F172A',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.5px',
    padding: '12px 16px',
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

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, search, portalFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(portalFilter && { hasPortalAccess: portalFilter }),
      });

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();

      if (res.ok) {
        setCustomers(data.customers);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handlePortalAccess = (customerId: string, hasAccess: boolean) => {
    router.push(`/customers/${customerId}?tab=portal`);
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
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer accounts and portal access
          </Typography>
        </Box>
        <Button
          variant="contained"
          // startIcon={<Add />}
          onClick={() => router.push('/customers/new')}
          sx={{
            fontWeight: 'bold',
            bgcolor: '#0F172A',
            textTransform: 'uppercase',
            '&:hover': { bgcolor: '#1e293b' },
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search customers..."
            value={search}
            onChange={handleSearchChange}
            sx={{ minWidth: 300 }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Portal Access"
            value={portalFilter}
            onChange={(e) => {
              setPortalFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">With Portal</MenuItem>
            <MenuItem value="false">Without Portal</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
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
            Loading customers...
          </Typography>
        </Paper>
      ) : customers.length === 0 ? (
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
              <Person sx={{ fontSize: 28, color: 'action.active' }} />
            </Box>

            <Typography variant="h6" fontWeight={600}>
              No customers yet
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Add your first customer to start managing orders and portal access
            </Typography>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/customers/new')}
              sx={{
                mt: 2,
                bgcolor: '#0F172A',
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              Add Customer
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
                  <StyledTableCell>Customer Name</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
                  <StyledTableCell>Portal Access</StyledTableCell>
                  <StyledTableCell>Orders</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {customers.map((customer) => (
                  <StyledTableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleEdit(customer.id)}
                  >
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {customer.name}
                      </Typography>
                      {customer.contactPerson && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {customer.contactPerson}
                        </Typography>
                      )}
                    </StyledTableCell>

                    <StyledTableCell>
                      <Typography variant="body2">{customer.phone}</Typography>
                      {customer.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {customer.email}
                        </Typography>
                      )}
                    </StyledTableCell>

                    <StyledTableCell>
                      {/* {customer.userId ? (
                        <Chip
                          label="Enabled"
                          size="small"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#166534',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Disabled"
                          size="small"
                          sx={{
                            bgcolor: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      )} */}

                      {customer.userId ? (
                        <Chip
                          label="Enabled"
                          size="small"
                          color="success"
                          icon={<VpnKey />}
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#166534',
                            fontWeight: 500,
                            fontSize: 11,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Disabled"
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                          icon={<VpnKeyOff />}
                        />
                      )}
                    </StyledTableCell>

                    <StyledTableCell>
                      <Chip
                        label={customer._count.orders}
                        size="small"
                        sx={{
                          bgcolor: '#f0f9ff',
                          color: '#0369a1',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(customer.id)}
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title={
                          customer.userId
                            ? 'Manage Portal'
                            : 'Grant Portal Access'
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handlePortalAccess(customer.id, !!customer.userId)
                          }
                          color={customer.userId ? 'primary' : 'default'}
                        >
                          {customer.userId ? (
                            <VpnKey fontSize="small" />
                          ) : (
                            <VpnKeyOff fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#F8FAFC',
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
