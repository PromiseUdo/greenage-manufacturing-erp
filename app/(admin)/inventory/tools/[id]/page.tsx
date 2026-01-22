// // src/app/dashboard/inventory/tools/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import {
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  KeyboardReturn as ReturnIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

// Styled table components for recent history section
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontWeight: 600,
    fontSize: 12,
    padding: '10px 16px',
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    padding: '12px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

interface Tool {
  id: string;
  name: string;
  toolNumber: string;
  category: string;
  status: string;
  condition: string;
  description?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  location?: string;
  currentHolder?: string;
  createdAt: string;
  updatedAt: string;
}

interface Lending {
  id: string;
  issuedTo: string;
  department?: string;
  purpose?: string;
  projectName?: string;
  issuedBy: string;
  issuedAt: string;
  expectedReturn?: string;
  returnedAt?: string;
  returnedTo?: string;
  status: string;
}

export default function ToolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchToolDetails();
  }, [toolId]);

  const activeLending = lendings.find((l) => l.status === 'ISSUED');

  const fetchToolDetails = async () => {
    try {
      const [toolRes, lendingsRes] = await Promise.all([
        fetch(`/api/inventory/tools/${toolId}`),
        fetch(`/api/inventory/tools/lending?toolId=${toolId}&limit=5`),
      ]);

      if (!toolRes.ok) {
        throw new Error('Failed to fetch tool');
      }

      const toolData = await toolRes.json();
      const lendingsData = await lendingsRes.json();

      setTool(toolData);
      setLendings(lendingsData.lendings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tool details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bgcolor: '#e8f5e9',
          color: '#2e7d32',
        };
      case 'IN_USE':
        return {
          bgcolor: '#fff3e0',
          color: '#ed6c02',
        };
      case 'UNDER_MAINTENANCE':
        return {
          bgcolor: '#e3f2fd',
          color: '#1976d2',
        };
      case 'RESERVED':
        return {
          bgcolor: '#f3e5f5',
          color: '#9c27b0',
        };
      case 'DAMAGED':
        return {
          bgcolor: '#ffebee',
          color: '#d32f2f',
        };
      default:
        return {
          bgcolor: '#f5f5f5',
          color: '#757575',
        };
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
      case 'GOOD':
        return '#2e7d32';
      case 'FAIR':
        return '#ed6c02';
      case 'POOR':
      case 'NEEDS_REPAIR':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const getLendingStatusStyle = (status: string) => {
    switch (status) {
      case 'RETURNED':
        return {
          bgcolor: '#e8f5e9',
          color: '#2e7d32',
        };
      case 'ISSUED':
        return {
          bgcolor: '#fff3e0',
          color: '#ed6c02',
        };
      default:
        return {
          bgcolor: '#f5f5f5',
          color: '#757575',
        };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tool) {
    return <Alert severity="error">{error || 'Tool not found'}</Alert>;
  }

  const statusStyle = getStatusColor(tool.status);

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
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {tool.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tool Number: <strong>{tool.toolNumber}</strong>
            </Typography>
            <Chip
              label={tool?.status?.replace(/_/g, ' ')}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                ...statusStyle,
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {tool.status === 'IN_USE' && (
            <Button
              disabled={!activeLending}
              variant="contained"
              sx={{
                bgcolor: '#2e7d32',
                '&:hover': { bgcolor: '#1b5e20' },
              }}
              startIcon={<ReturnIcon />}
              // onClick={() =>
              //   router.push(`/inventory/tools/lending/${toolId}/return`)
              // }

              onClick={() => {
                if (!activeLending) return;
                router.push(
                  `/inventory/tools/lending/${activeLending.id}/return`,
                );
              }}
            >
              Return Tool
            </Button>
          )}
          {tool.status === 'AVAILABLE' && (
            <Button
              variant="contained"
              // sx={{
              //   bgcolor: '#1976d2',
              //   '&:hover': { bgcolor: '#1565c0' },
              // }}

              sx={{
                textTransform: 'uppercase',
                bgcolor: '#0F172A',
                color: '#ffffff',
                fontWeight: 'bold',
                // fontSize: '14',
              }}
              // startIcon={<AssignmentIcon />}
              onClick={() => router.push(`/inventory/tools/lending/new`)}
            >
              Issue Tool
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{
              borderColor: '#0F172A',
              color: '#0F172A',
              '&:hover': {
                borderColor: '#0F172A',
                bgcolor: '#F1F5F9',
              },
            }}
            onClick={() => router.push(`/inventory/tools/${toolId}/edit`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Tool Information */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Tool Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                  {tool?.category?.replace(/_/g, ' ')}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Condition
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    mt: 0.5,
                    color: getConditionColor(tool.condition),
                  }}
                >
                  {tool?.condition?.replace(/_/g, ' ')}
                </Typography>
              </Grid>

              {tool.currentHolder && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Current Holder
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                    {tool?.currentHolder}
                  </Typography>
                </Grid>
              )}

              {tool.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {tool?.description}
                  </Typography>
                </Grid>
              )}

              {tool.serialNumber && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {tool?.serialNumber}
                  </Typography>
                </Grid>
              )}

              {tool.manufacturer && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {tool?.manufacturer}
                  </Typography>
                </Grid>
              )}

              {tool.location && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Storage Location
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {tool?.location}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Purchase Information */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Purchase Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Purchase Date
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {tool?.purchaseDate
                  ? format(new Date(tool?.purchaseDate), 'MMM dd, yyyy')
                  : 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Purchase Cost
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                {tool?.purchaseCost
                  ? `₦${tool?.purchaseCost.toLocaleString()}`
                  : 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(tool?.createdAt), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(tool?.updatedAt), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Lending History */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Recent Lending History
              </Typography>
              <Button
                size="small"
                startIcon={<HistoryIcon />}
                sx={{
                  color: '#64748B',
                  '&:hover': {
                    bgcolor: '#F1F5F9',
                    color: '#0F172A',
                  },
                }}
                onClick={() =>
                  router.push(`/inventory/tools/${toolId}/history`)
                }
              >
                View Full History
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {lendings.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  bgcolor: '#F8FAFC',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No lending history yet
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Issued To</StyledTableCell>
                      <StyledTableCell>Purpose</StyledTableCell>
                      <StyledTableCell>Issued Date</StyledTableCell>
                      <StyledTableCell>Return Date</StyledTableCell>
                      <StyledTableCell>Status</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lendings.map((lending) => {
                      const lendingStatusStyle = getLendingStatusStyle(
                        lending.status,
                      );

                      return (
                        <StyledTableRow key={lending.id}>
                          <StyledTableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {lending.issuedTo}
                            </Typography>
                            {lending.department && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lending.department}
                              </Typography>
                            )}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2">
                              {lending.purpose || lending.projectName || '-'}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2">
                              {format(
                                new Date(lending.issuedAt),
                                'MMM dd, yyyy',
                              )}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2" color="text.secondary">
                              {lending.returnedAt
                                ? format(
                                    new Date(lending.returnedAt),
                                    'MMM dd, yyyy',
                                  )
                                : lending.expectedReturn
                                  ? format(
                                      new Date(lending.expectedReturn),
                                      'MMM dd, yyyy',
                                    )
                                  : '-'}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>
                            <Chip
                              label={lending.status}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: 11,
                                ...lendingStatusStyle,
                              }}
                            />
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
