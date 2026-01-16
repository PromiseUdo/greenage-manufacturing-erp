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
  tableCellClasses,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
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
  BusinessCenter as BusinessCenterIcon,
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
          <Typography variant="h6" fontWeight={600}>
            Suppliers
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: 14,
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
              textTransform: 'uppercase',
              borderColor: '#0F172A',
              color: '#0F172A',
              // fontWeight: 'bold',
              fontSize: 14,
              '&:hover': {
                borderColor: '#0F172A',
                bgcolor: alpha('#0F172A', 0.04),
              },
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>

          <Button
            variant="contained"
            disableElevation
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: 'uppercase',
              bgcolor: '#0F172A',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 14,
            }}
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
            Loading suppliers...
          </Typography>
        </Paper>
      ) : suppliers.length === 0 ? (
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
              <BusinessCenterIcon color="action" />
            </Box>

            <Typography variant="h6" fontWeight={600}>
              {search ? 'No suppliers found' : 'No suppliers yet'}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              {search
                ? 'Try adjusting your search terms'
                : 'Add your first supplier to start managing your vendor relationships'}
            </Typography>

            {!search && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Supplier
              </Button>
            )}
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Supplier</StyledTableCell>
                  <StyledTableCell>Contact Person</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
                  <StyledTableCell>Payment Terms</StyledTableCell>
                  <StyledTableCell align="center">Materials</StyledTableCell>
                  <StyledTableCell align="center">GRNs</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {suppliers.map((supplier) => (
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
                              sx={{ color: 'action.active', opacity: 0.6 }}
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
                              sx={{ color: 'action.active', opacity: 0.6 }}
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
                        sx={{
                          minWidth: 48,
                          bgcolor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 600,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <Chip
                        label={supplier._count?.grns ?? 0}
                        size="small"
                        sx={{
                          minWidth: 48,
                          bgcolor: '#f3e5f5',
                          color: '#9c27b0',
                          fontWeight: 600,
                        }}
                      />
                    </StyledTableCell>

                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(supplier)}
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
              setLimit(Number(e.target.value));
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

      {/* <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullScreen={fullScreen}
      >
        <Box
          sx={{
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
            <Button onClick={handleCloseDialog} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              sx={{
                fontWeight: 'bold',
              }}
              variant="contained"
              disableElevation
            >
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog> */}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            bgcolor: '#0F172A',
            color: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" component="div" fontWeight={600}>
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            {editingSupplier
              ? 'Update the supplier details below'
              : 'Fill in the information to register a new supplier'}
          </Typography>
        </Box>

        {/* Form Content */}
        <form onSubmit={handleSubmit(handleSaveSupplier)}>
          <DialogContent sx={{ px: 4, py: 4 }}>
            <Grid container spacing={3}>
              {/* Required fields - first row */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Supplier name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Supplier Name"
                      fullWidth
                      required
                      variant="standard"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="contactPerson"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contact Person"
                      fullWidth
                      variant="standard"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* Phone & Email */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      required
                      variant="standard"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Address"
                      type="email"
                      fullWidth
                      variant="standard"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* Address - full width */}
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address"
                      fullWidth
                      multiline
                      rows={3}
                      variant="standard"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* Payment Terms */}
              <Grid item xs={12}>
                <Controller
                  name="paymentTerms"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Payment Terms"
                      fullWidth
                      placeholder="e.g. Net 30 days • 50% advance • Cash on delivery"
                      variant="standard"
                      helperText="Common terms: Net 30, Net 60, 2/10 Net 30, etc."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>

          {/* Actions */}
          <DialogActions
            sx={{
              px: 4,
              py: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              color="inherit"
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                minWidth: 140,
                bgcolor: '#0F172A',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#1E293B' },
              }}
            >
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
