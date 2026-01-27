// src/components/inventory/grouped-tools-table.tsx

'use client';

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  TablePagination,
  Box,
  Typography,
  Button,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import SubdirectoryArrowLeftIcon from '@mui/icons-material/SubdirectoryArrowLeft';
// Styled components
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

interface Tool {
  id: string;
  toolId: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  currentHolder?: string;
  location?: string;
  manufacturer?: string;
  toolGroupId?: string;
}

interface ToolGroup {
  id: string;
  name: string;
  groupNumber: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  manufacturer?: string;
  tools: Tool[];
}

interface GroupedToolsTableProps {
  toolGroups: ToolGroup[];
  standaloneTools: Tool[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onRefresh?: () => void;
}

export default function GroupedToolsTable({
  toolGroups,
  standaloneTools,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRefresh,
}: GroupedToolsTableProps) {
  const router = useRouter();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'tool' | 'group' | null;
    id: string | null;
    name: string;
  }>({
    open: false,
    type: null,
    id: null,
    name: '',
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  const handleToggleExpand = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const handleOpenDeleteDialog = (
    type: 'tool' | 'group',
    id: string,
    name: string,
  ) => {
    setDeleteDialog({
      open: true,
      type,
      id,
      name,
    });
    setDeleteError(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      type: null,
      id: null,
      name: '',
    });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const endpoint =
        deleteDialog.type === 'group'
          ? `/api/inventory/tools/groups/${deleteDialog.id}`
          : `/api/inventory/tools/${deleteDialog.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete');
        setIsDeleting(false);
        return;
      }

      // Success - close dialog and refresh
      handleCloseDeleteDialog();
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback: reload the page
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setDeleteError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
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

  if (toolGroups?.length === 0 && standaloneTools?.length === 0) {
    return (
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
            <BuildOutlinedIcon sx={{ fontSize: 28, color: 'action.active' }} />
          </Box>

          <Typography variant="h6" fontWeight={600}>
            No tools yet
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            You haven't added any tools. Create your first tool to start
            tracking your equipment.
          </Typography>

          <Button
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: '#0F172A',
              '&:hover': { bgcolor: '#1e293b' },
            }}
            startIcon={<AddIcon />}
            onClick={() => router.push('/inventory/tools/new')}
          >
            Add Tool
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <>
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
                <StyledTableCell width={50}></StyledTableCell>
                <StyledTableCell>Tool Name</StyledTableCell>
                <StyledTableCell>Category</StyledTableCell>
                <StyledTableCell align="center">Quantity</StyledTableCell>
                <StyledTableCell align="center">Available</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Location</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Render Tool Groups */}
              {toolGroups?.map((group) => (
                <React.Fragment key={group.id}>
                  <StyledTableRow>
                    <StyledTableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(group.id)}
                        sx={{
                          color: '#64748B',
                          '&:hover': {
                            backgroundColor: '#F1F5F9',
                            color: '#0F172A',
                          },
                        }}
                      >
                        {expandedGroup === group.id ? (
                          <CollapseIcon fontSize="small" />
                        ) : (
                          <ExpandIcon fontSize="small" />
                        )}
                      </IconButton>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {group.name}
                      </Typography>
                      {group.manufacturer && (
                        <Typography variant="caption" color="text.secondary">
                          {group.manufacturer}
                        </Typography>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={group.category.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: '11px',
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Chip
                        label={group.totalQuantity}
                        size="small"
                        sx={{
                          minWidth: 40,
                          bgcolor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 600,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Chip
                        label={group.availableQuantity}
                        size="small"
                        sx={{
                          minWidth: 40,
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          fontWeight: 600,
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
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
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {group.tools[0]?.location || '-'}
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
                        <Tooltip title="View Group">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(`/inventory/tools/groups/${group.id}`)
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

                        <Tooltip title="Delete Group">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenDeleteDialog(
                                'group',
                                group.id,
                                group.name,
                              )
                            }
                            sx={{
                              color: '#64748B',
                              '&:hover': {
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>

                  {/* Expanded Group - Individual Tools */}
                  {expandedGroup === group.id && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ py: 0, backgroundColor: 'transparent' }}
                      >
                        <Collapse
                          in={expandedGroup === group.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box
                            sx={{
                              p: 3,
                              backgroundColor: '#f8fafc',
                              marginTop: 1,
                              borderRadius: 2,
                              marginBottom: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              gutterBottom
                              sx={{ mb: 2 }}
                            >
                              Individual Tools in Group
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Tool ID
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Status
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Condition
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Current Holder
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Location
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.tools.map((tool) => {
                                  console.log(tool, 'tool');

                                  const statusStyle = getStatusColor(
                                    tool.status,
                                  );
                                  return (
                                    <TableRow
                                      key={tool.id}
                                      sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                      }}
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
                                            color: getConditionColor(
                                              tool.condition,
                                            ),
                                            fontWeight: 500,
                                          }}
                                        >
                                          {tool.condition.replace(/_/g, ' ')}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {tool.currentHolder || '-'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {tool.location || '-'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        {tool.status === 'AVAILABLE' && (
                                          <Tooltip title="Issue">
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                router.push(
                                                  `/inventory/tools/lending/new?toolId=${tool.toolGroupId}&g=${tool.id}`,
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
                                              <SubdirectoryArrowRightIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}

                                        {tool.status === 'IN_USE' && (
                                          <Tooltip title="Receive">
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                router.push(
                                                  `/inventory/tools/lending/return?toolId=${tool.id}`,
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
                                              <SubdirectoryArrowLeftIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}

                                        <Tooltip title="View Details">
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              router.push(
                                                `/inventory/tools/${tool.id}`,
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
                                            <ViewIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Delete Tool">
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleOpenDeleteDialog(
                                                'tool',
                                                tool.id,
                                                tool.name,
                                              )
                                            }
                                            sx={{
                                              color: '#64748B',
                                              '&:hover': {
                                                backgroundColor: '#FEE2E2',
                                                color: '#DC2626',
                                              },
                                            }}
                                            disabled={tool.status === 'IN_USE'}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}

              {/* Render Standalone Tools */}
              {standaloneTools?.map((tool) => {
                const statusStyle = getStatusColor(tool.status);
                return (
                  <StyledTableRow key={tool.id}>
                    <StyledTableCell></StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {tool.name}
                      </Typography>
                      {tool.manufacturer && (
                        <Typography variant="caption" color="text.secondary">
                          {tool.manufacturer}
                        </Typography>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={tool.category.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: '11px' }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        1
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {tool.status === 'AVAILABLE' ? '1' : '0'}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip
                        label={tool.status.replace(/_/g, ' ')}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 11, ...statusStyle }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tool.location || '-'}
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
                        {tool.status === 'AVAILABLE' && (
                          <Tooltip title="Issue">
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(
                                  `/inventory/tools/lending/new?toolId=${tool.id}`,
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
                              <SubdirectoryArrowRightIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {tool.status === 'IN_USE' && (
                          <Tooltip title="Receive">
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(
                                  `/inventory/tools/lending/return?toolId=${tool.id}`,
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
                              <SubdirectoryArrowLeftIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

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
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(`/inventory/tools/${tool.id}/edit`)
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
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenDeleteDialog('tool', tool.id, tool.name)
                            }
                            sx={{
                              color: '#64748B',
                              '&:hover': {
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                              },
                            }}
                            disabled={tool.status === 'IN_USE'}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={limit}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#F8FAFC',
          }}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {deleteDialog.type === 'group' ? 'Delete Tool Group' : 'Delete Tool'}
        </DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>
            ?
            {/* {deleteDialog.type === 'group' && (
              <>
                <br />
                <br />
                This will delete the tool group and all tools within it. This
                action can only be performed if all tools in the group are
                AVAILABLE.
              </>
            )}
            {deleteDialog.type === 'tool' && (
              <>
                <br />
                <br />
                This action cannot be undone. The tool must not be currently in
                use.
              </>
            )} */}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={isDeleting}
            sx={{ color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            sx={{
              bgcolor: '#DC2626',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
