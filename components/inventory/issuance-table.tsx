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
  Button,
} from '@mui/material';
import { format } from 'date-fns';
import { IssuanceWithMaterial } from '@/types/inventory';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

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

interface IssuancesTableProps {
  issuances: IssuanceWithMaterial[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function IssuancesTable({
  issuances,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: IssuancesTableProps) {
  const router = useRouter();

  if (issuances.length === 0) {
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
            <ReceiptLongOutlinedIcon color="action" />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            No issuances yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            You haven’t issued any materials yet. Record your first issuance to
            start tracking usage.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => router.push('/inventory/issuance/new')}
          >
            Issue Material
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
      <TableContainer sx={{ maxHeight: 640 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Date & Time</StyledTableCell>
              <StyledTableCell>Material</StyledTableCell>
              <StyledTableCell>Part Number</StyledTableCell>
              <StyledTableCell align="right">Quantity</StyledTableCell>
              <StyledTableCell>Batch</StyledTableCell>
              <StyledTableCell>Issued To</StyledTableCell>
              <StyledTableCell>Purpose</StyledTableCell>
              <StyledTableCell>Order</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issuances.map((issuance) => (
              <StyledTableRow key={issuance.id}>
                <StyledTableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: '#0F172A' }}
                    >
                      {format(new Date(issuance.issuedAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(issuance.issuedAt), 'hh:mm a')}
                    </Typography>
                  </Box>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {issuance.material.name}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Chip
                    label={issuance.material.partNumber}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: '4px',
                      fontWeight: 500,
                      fontSize: '11px',
                    }}
                  />
                </StyledTableCell>
                <StyledTableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: '#DC2626' }}
                  >
                    -{issuance.quantity} {issuance.material.unit}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" color="text.secondary">
                    {issuance.batchNumber}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {issuance.issuedTo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      By: {issuance.issuedBy}
                    </Typography>
                  </Box>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 180,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {issuance.purpose || '-'}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  {issuance.orderId ? (
                    <Chip
                      label={issuance.orderId}
                      size="small"
                      color="primary"
                      sx={{
                        bgcolor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  ) : (
                    '-'
                  )}
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
        rowsPerPage={limit}
        page={page - 1}
        onPageChange={(_, p) => onPageChange(p + 1)}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#F8FAFC',
        }}
      />
    </Paper>
  );
}
