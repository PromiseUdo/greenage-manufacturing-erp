// src/app/dashboard/staff/employees/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  styled,
  tableCellClasses,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Styled components
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

interface Employee {
  id: string;
  employeeNumber: string;
  phone: string;
  department: string;
  position?: string;
  isActive: boolean;
  dateHired: string;
  user?: {
    role: string;
    isActive: boolean;
    name: string;
    email: string;
  };
}

const DEPARTMENTS = [
  { value: '', label: 'All Departments' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'STORE', label: 'Store' },
  { value: 'MANAGEMENT', label: 'Management' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(department && { department }),
        ...(status && { isActive: status }),
      });

      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();

      setEmployees(data?.employees || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, department, status]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, refreshTrigger]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      OPERATIONS: '#10b981',
      PRODUCTION: '#3b82f6',
      STORE: '#f59e0b',
      MANAGEMENT: '#8b5cf6',
    };
    return colors[dept] || '#64748b';
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
            Employees
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Manage staff members and their access
          </Typography>
        </Box>
        <Button
          variant="contained"
          //   startIcon={<AddIcon />}
          onClick={() => router.push('/staff/employees/new')}
          sx={{
            textTransform: 'uppercase',
            bgcolor: '#0F172A',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          Add Employee
        </Button>
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Department"
              size="small"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              sx={{
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A',
                },
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#0F172A',
                  borderWidth: 1,
                },
              }}
            >
              {DEPARTMENTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              size="small"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              sx={{
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A',
                },
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#0F172A',
                  borderWidth: 1,
                },
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
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
            Loading employees...
          </Typography>
        </Paper>
      ) : employees.length === 0 ? (
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
              <PeopleIcon sx={{ fontSize: 28, color: 'action.active' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              No employees yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Add your first employee to get started with staff management
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: '#0F172A',
                '&:hover': { bgcolor: '#1e293b' },
              }}
              startIcon={<AddIcon />}
              onClick={() => router.push('/staff/employees/new')}
            >
              Add Employee
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
                  <StyledTableCell>Employee #</StyledTableCell>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Email</StyledTableCell>
                  <StyledTableCell>Phone</StyledTableCell>
                  <StyledTableCell>Department</StyledTableCell>
                  {/* <StyledTableCell>Position</StyledTableCell> */}
                  <StyledTableCell>Role</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Date Hired</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <StyledTableRow key={employee.id}>
                    <StyledTableCell>
                      <Chip
                        label={employee.employeeNumber}
                        size="small"
                        sx={{
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {employee.user?.name}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {employee.user?.email}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {employee.phone}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={employee.department.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${getDepartmentColor(employee.department)}15`,
                          color: getDepartmentColor(employee.department),
                          fontWeight: 500,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    {/* <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position || '—'}
                      </Typography>
                    </StyledTableCell> */}
                    <StyledTableCell>
                      <Chip
                        label={employee.user?.role.replace(/_/g, ' ') || '—'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: employee.isActive ? '#dcfce7' : '#fee2e2',
                          color: employee.isActive ? '#166534' : '#991b1b',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(employee.dateHired), 'MMM dd, yyyy')}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          justifyContent: 'center',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/staff/employees/${employee.id}`)
                          }
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {/* <IconButton
                          size="small"
                          onClick={() =>
                            router.push(
                              `/staff/employees/${employee.id}/reset-password`,
                            )
                          }
                          sx={{
                            color: '#64748B',
                            '&:hover': {
                              backgroundColor: '#F1F5F9',
                              color: '#0F172A',
                            },
                          }}
                        >
                          <LockIcon fontSize="small" />
                        </IconButton> */}
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
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
    </Box>
  );
}
