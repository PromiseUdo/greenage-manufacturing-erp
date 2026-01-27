// src/app/dashboard/inventory/tools/groups/[id]/page.tsx

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
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

interface ToolGroup {
  id: string;
  name: string;
  groupNumber: string;
  category: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost?: number;
  createdAt: string;
  updatedAt: string;
  tools: Tool[];
}

interface Tool {
  id: string;
  toolId: string;
  status: string;
  condition: string;
  currentHolder?: string;
  location?: string;
  purchaseDate?: string;
  purchaseCost?: number;
}

export default function ToolGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ToolGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/inventory/tools/groups/${groupId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch tool group');
      }

      const data = await res.json();
      setGroup(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tool group details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bgcolor: '#e8f5e9', color: '#2e7d32' };
      case 'IN_USE':
        return { bgcolor: '#fff3e0', color: '#ed6c02' };
      case 'UNDER_MAINTENANCE':
        return { bgcolor: '#e3f2fd', color: '#1976d2' };
      case 'RESERVED':
        return { bgcolor: '#f3e5f5', color: '#9c27b0' };
      case 'DAMAGED':
        return { bgcolor: '#ffebee', color: '#d32f2f' };
      default:
        return { bgcolor: '#f5f5f5', color: '#757575' };
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !group) {
    return <Alert severity="error">{error || 'Tool group not found'}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{
            mb: 2,
            color: '#64748B',
            '&:hover': {
              bgcolor: '#F1F5F9',
              color: '#0F172A',
            },
          }}
        >
          Back to Tools
        </Button>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {group.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Group Number: <strong>{group.groupNumber}</strong>
              </Typography>
              <Chip
                label="GROUP"
                size="small"
                sx={{
                  bgcolor: '#f3e5f5',
                  color: '#9c27b0',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {group.availableQuantity > 0 && (
              <Button
                variant="contained"
                sx={{
                  textTransform: 'uppercase',
                  bgcolor: '#0F172A',
                  color: '#ffffff',
                  fontWeight: 'bold',

                  // bgcolor: '#1976d2',
                  // '&:hover': { bgcolor: '#1565c0' },
                }}
                // startIcon={<AssignmentIcon />}
                onClick={() =>
                  router.push(`/inventory/tools/lending/new?toolId=${group.id}`)
                }
              >
                Issue Tools
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Group Information */}
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
              Group Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                  {group.category.replace(/_/g, ' ')}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                  {group.totalQuantity} tools
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ mt: 0.5, color: '#2e7d32' }}
                >
                  {group.availableQuantity} available
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  In Use
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ mt: 0.5, color: '#ed6c02' }}
                >
                  {group.totalQuantity - group.availableQuantity} in use
                </Typography>
              </Grid>

              {group.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {group.description}
                  </Typography>
                </Grid>
              )}

              {group.manufacturer && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {group.manufacturer}
                  </Typography>
                </Grid>
              )}

              {group.model && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Model
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {group.model}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Purchase Details */}
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
              Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Unit Cost
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                {group.unitCost ? `₦${group.unitCost.toLocaleString()}` : 'N/A'}
              </Typography>
            </Box>

            {group.unitCost && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                  ₦{(group.unitCost * group.totalQuantity).toLocaleString()}
                </Typography>
              </Box>
            )}

            {/* <Divider sx={{ my: 2 }} /> */}

            {/* <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(group.createdAt), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {format(new Date(group.updatedAt), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Box> */}

            <Box
              sx={{
                display: 'flex',
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Date Created
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {format(new Date(group?.createdAt), 'MMM dd, yyyy h:mm a')}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {format(new Date(group?.updatedAt), 'MMM dd, yyyy h:mm a')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Individual Tools */}
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Individual Tools ({group.tools.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tool ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Current Holder
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.tools.map((tool) => {
                    const statusStyle = getStatusColor(tool.status);
                    return (
                      <TableRow
                        key={tool.id}
                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Chip
                            label={tool.toolId}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tool.status.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              ...statusStyle,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: getConditionColor(tool.condition),
                              fontWeight: 500,
                            }}
                          >
                            {tool.condition.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tool.currentHolder || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tool.location || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(`/inventory/tools/${tool.id}`)
                              }
                              sx={{
                                color: '#64748B',
                                '&:hover': {
                                  backgroundColor: '#F1F5F9',
                                  color: '#0F172A',
                                },
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
