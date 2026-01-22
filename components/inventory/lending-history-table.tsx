// src/components/inventory/lending-history-table.tsx

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
  Chip,
  TablePagination,
  Box,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

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

interface Lending {
  id: string;
  issuedTo: string;
  department?: string;
  purpose?: string;
  projectName?: string;
  orderId?: string;
  issuedBy: string;
  issuedAt: string;
  expectedReturn?: string;
  returnedAt?: string;
  returnedTo?: string;
  returnCondition?: string;
  returnNotes?: string;
  status: string;
}

interface LendingHistoryTableProps {
  lendings: Lending[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function LendingHistoryTable({
  lendings,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: LendingHistoryTableProps) {
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
      case 'OVERDUE':
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

  if (lendings?.length === 0) {
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
            <HistoryOutlinedIcon
              sx={{ fontSize: 28, color: 'action.active' }}
            />
          </Box>

          <Typography variant="h6" fontWeight={600}>
            No lending history
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            This tool hasn't been issued out yet. Once it's lent out, you'll see
            the history here.
          </Typography>
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
              <StyledTableCell>Issued To</StyledTableCell>
              <StyledTableCell>Department</StyledTableCell>
              <StyledTableCell>Purpose / Project</StyledTableCell>
              <StyledTableCell>Issued By</StyledTableCell>
              <StyledTableCell>Issued Date</StyledTableCell>
              <StyledTableCell>Expected Return</StyledTableCell>
              <StyledTableCell>Returned Date</StyledTableCell>
              <StyledTableCell>Return Condition</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lendings.map((lending) => {
              const statusStyle = getStatusColor(lending.status);

              return (
                <StyledTableRow key={lending.id}>
                  <StyledTableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {lending.issuedTo}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lending.department || '-'}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2">
                      {lending.purpose || lending.projectName || '-'}
                    </Typography>
                    {lending.orderId && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mt: 0.3 }}
                      >
                        Order: {lending.orderId}
                      </Typography>
                    )}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lending.issuedBy}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2">
                      {format(new Date(lending.issuedAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(lending.issuedAt), 'h:mm a')}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lending.expectedReturn
                        ? format(
                            new Date(lending.expectedReturn),
                            'MMM dd, yyyy',
                          )
                        : '-'}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    {lending.returnedAt ? (
                      <>
                        <Typography variant="body2">
                          {format(new Date(lending.returnedAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(lending.returnedAt), 'h:mm a')}
                        </Typography>
                        {lending.returnedTo && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.3 }}
                          >
                            To: {lending.returnedTo}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </StyledTableCell>
                  <StyledTableCell>
                    {lending.returnCondition ? (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            color: getConditionColor(lending.returnCondition),
                            fontWeight: 500,
                          }}
                        >
                          {lending.returnCondition.replace(/_/g, ' ')}
                        </Typography>
                        {lending.returnNotes && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.3 }}
                          >
                            {lending.returnNotes}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={lending.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 11,
                        ...statusStyle,
                      }}
                    />
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
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
