// src/components/inventory/tools-table.tsx

'use client';

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
} from '@mui/material';
import { Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { ToolWithLendings } from '@/types/tools';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import SubdirectoryArrowLeftIcon from '@mui/icons-material/SubdirectoryArrowLeft';

// Styled components for professional table appearance
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

interface ToolsTableProps {
  tools: ToolWithLendings[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function ToolsTable({
  tools,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ToolsTableProps) {
  const router = useRouter();

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(1);
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

  if (tools?.length === 0) {
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
          {/* Icon */}
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

          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            No tools yet
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            You haven't added any tools. Create your first tool to start
            tracking your equipment.
          </Typography>

          {/* CTA */}
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
              <StyledTableCell>Tool Number</StyledTableCell>
              <StyledTableCell>Tool Name</StyledTableCell>
              <StyledTableCell>Category</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Condition</StyledTableCell>
              <StyledTableCell>Current Holder</StyledTableCell>
              <StyledTableCell>Location</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tools?.map((tool) => {
              const statusStyle = getStatusColor(tool.status);

              return (
                <StyledTableRow key={tool.id}>
                  <StyledTableCell>
                    <Chip
                      label={tool.toolNumber}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        fontSize: '11px',
                      }}
                    />
                  </StyledTableCell>
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
                      sx={{
                        fontWeight: 500,
                        fontSize: '11px',
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={tool.status.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 11,
                        ...statusStyle,
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getConditionColor(tool.condition),
                        fontWeight: 500,
                      }}
                    >
                      {tool.condition.replace(/_/g, ' ')}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {tool.currentHolder || '-'}
                    </Typography>
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

                      {tool.status === 'AVAILABLE' && (
                        <Tooltip title="Issue">
                          <IconButton
                            size="small"
                            onClick={() =>
                              // router.push(`/inventory/tools/lending/new`)
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
                            // onClick={() =>
                            //   router.push(`/inventory/tools/lending/${activeLending.id}/return`)
                            // }

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
  );
}
