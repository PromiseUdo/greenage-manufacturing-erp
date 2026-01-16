// // src/app/dashboard/inventory/materials/[id]/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
//   Chip,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Alert,
//   CircularProgress,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
// import {
//   Edit as EditIcon,
//   ArrowBack as BackIcon,
//   Warning as WarningIcon,
// } from '@mui/icons-material';
// import { useRouter } from 'next/navigation';
// import { MaterialWithRelations } from '@/types/inventory';
// import { format } from 'date-fns';

// export default function MaterialDetailsPage({
//   params,
// }: {
//   params: { id: string } | Promise<{ id: string }>;
// }) {
//   const router = useRouter();
//   const [material, setMaterial] = useState<MaterialWithRelations | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [id, setId] = useState<string | null>(null);

//   //   useEffect(() => {
//   //     fetchMaterial();
//   //   }, [params.id]);

//   useEffect(() => {
//     (async () => {
//       const resolvedParams = await params; // ✅ unwrap the promise
//       setId(resolvedParams.id);
//     })();
//   }, [params]);

//   useEffect(() => {
//     if (!id) return;
//     fetchMaterial();
//   }, [id]);

//   const fetchMaterial = async () => {
//     try {
//       const res = await fetch(`/api/inventory/materials/${id}`);
//       if (!res.ok) {
//         throw new Error('Material not found');
//       }
//       const data = await res.json();
//       setMaterial(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const getStockStatus = () => {
//     if (!material) return null;
//     if (material.currentStock === 0) {
//       return { label: 'Out of Stock', color: 'error' as const };
//     }
//     if (material.currentStock <= material.reorderLevel) {
//       return { label: 'Low Stock', color: 'warning' as const };
//     }
//     return { label: 'In Stock', color: 'success' as const };
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error || !material) {
//     return (
//       <Box>
//         <Alert severity="error">{error || 'Material not found'}</Alert>
//         <Button
//           startIcon={<BackIcon />}
//           onClick={() => router.back()}
//           sx={{ mt: 2 }}
//         >
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   const status = getStockStatus();
//   const totalValue = material.currentStock * (material.unitCost || 0);
//   const showAlert = material.currentStock <= material.reorderLevel;

//   return (
//     <Box
//       sx={{
//         pb: 3,
//       }}
//     >
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Button
//           startIcon={<BackIcon />}
//           onClick={() => router.back()}
//           sx={{ mb: 2 }}
//         >
//           Back to Materials
//         </Button>
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <Box>
//             <Typography variant="h4" fontWeight={600} gutterBottom>
//               {material.name}
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//               <Chip label={material.partNumber} size="small" />
//               <Chip
//                 label={material.category.replace(/_/g, ' ')}
//                 size="small"
//                 color="primary"
//               />
//               {status && (
//                 <Chip label={status.label} size="small" color={status.color} />
//               )}
//             </Box>
//           </Box>
//           <Button
//             variant="contained"
//             startIcon={<EditIcon />}
//             onClick={() =>
//               router.push(`/inventory/materials/${material.id}/edit`)
//             }
//           >
//             Edit Material
//           </Button>
//         </Box>
//       </Box>

//       {/* Alert */}
//       {showAlert && (
//         <Alert
//           severity={material.currentStock === 0 ? 'error' : 'warning'}
//           sx={{ mb: 3 }}
//         >
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <strong>
//               {material.currentStock === 0
//                 ? 'Out of Stock!'
//                 : 'Low Stock Alert!'}
//             </strong>
//             {material.currentStock > 0 && (
//               <span>
//                 Current stock ({material.currentStock} {material.unit}) is at or
//                 below reorder level ({material.reorderLevel} {material.unit})
//               </span>
//             )}
//           </Box>
//         </Alert>
//       )}

//       <Grid container spacing={3}>
//         {/* Basic Information */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Basic Information
//             </Typography>
//             <Box sx={{ mt: 2 }}>
//               <InfoRow label="Part Number" value={material.partNumber} />
//               <InfoRow label="Material Name" value={material.name} />
//               <InfoRow
//                 label="Category"
//                 value={material.category.replace(/_/g, ' ')}
//               />
//               <InfoRow label="Unit" value={material.unit} />
//               <InfoRow
//                 label="Supplier"
//                 value={material.supplier?.name || 'Not assigned'}
//               />
//             </Box>
//           </Paper>
//         </Grid>

//         {/* Stock Information */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Stock Information
//             </Typography>
//             <Box sx={{ mt: 2 }}>
//               <InfoRow
//                 label="Current Stock"
//                 value={`${material.currentStock} ${material.unit}`}
//                 highlight={showAlert}
//               />
//               <InfoRow
//                 label="Reorder Level"
//                 value={`${material.reorderLevel} ${material.unit}`}
//               />
//               <InfoRow
//                 label="Max Stock Level"
//                 value={
//                   material.maxStockLevel
//                     ? `${material.maxStockLevel} ${material.unit}`
//                     : 'Not set'
//                 }
//               />
//               <InfoRow
//                 label="Unit Cost"
//                 value={
//                   material.unitCost
//                     ? formatCurrency(material.unitCost)
//                     : 'Not set'
//                 }
//               />
//               <InfoRow
//                 label="Total Value"
//                 value={formatCurrency(totalValue)}
//                 highlight
//               />
//             </Box>
//           </Paper>
//         </Grid>

//         {/* Recent Batches */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Recent Batches
//             </Typography>
//             {material.batches && material.batches.length > 0 ? (
//               <TableContainer sx={{ mt: 2 }}>
//                 <Table size="small">
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>
//                         <strong>Batch Number</strong>
//                       </TableCell>
//                       <TableCell align="right">
//                         <strong>Quantity</strong>
//                       </TableCell>
//                       <TableCell>
//                         <strong>Received</strong>
//                       </TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {material.batches.map((batch) => (
//                       <TableRow key={batch.id}>
//                         <TableCell>{batch.batchNumber}</TableCell>
//                         <TableCell align="right">
//                           {batch.quantity} {material.unit}
//                         </TableCell>
//                         <TableCell>
//                           {format(new Date(batch.receivedDate), 'MMM dd, yyyy')}
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             ) : (
//               <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
//                 No batches recorded yet
//               </Typography>
//             )}
//           </Paper>
//         </Grid>

//         {/* Recent Issuances */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Recent Issuances
//             </Typography>
//             {material.issuances && material.issuances.length > 0 ? (
//               <TableContainer sx={{ mt: 2 }}>
//                 <Table size="small">
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>
//                         <strong>Issued To</strong>
//                       </TableCell>
//                       <TableCell align="right">
//                         <strong>Quantity</strong>
//                       </TableCell>
//                       <TableCell>
//                         <strong>Date</strong>
//                       </TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {material.issuances.map((issuance) => (
//                       <TableRow key={issuance.id}>
//                         <TableCell>{issuance.issuedTo}</TableCell>
//                         <TableCell align="right">
//                           {issuance.quantity} {material.unit}
//                         </TableCell>
//                         <TableCell>
//                           {format(new Date(issuance.issuedAt), 'MMM dd, yyyy')}
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             ) : (
//               <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
//                 No issuances recorded yet
//               </Typography>
//             )}
//           </Paper>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

// function InfoRow({
//   label,
//   value,
//   highlight,
// }: {
//   label: string;
//   value: string;
//   highlight?: boolean;
// }) {
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         py: 1.5,
//         borderBottom: '1px solid',
//         borderColor: 'divider',
//         '&:last-child': { borderBottom: 'none' },
//       }}
//     >
//       <Typography variant="body2" color="text.secondary">
//         {label}
//       </Typography>
//       <Typography
//         variant="body2"
//         fontWeight={highlight ? 600 : 400}
//         color={highlight ? 'primary' : 'text.primary'}
//       >
//         {value}
//       </Typography>
//     </Box>
//   );
// }

// src/app/dashboard/inventory/materials/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { MaterialWithRelations } from '@/types/inventory';
import { format } from 'date-fns';

export default function MaterialDetailsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetchMaterial();
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/inventory/materials/${id}`);
      if (!res.ok) {
        throw new Error('Material not found');
      }
      const data = await res.json();
      setMaterial(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      PCB: 'primary',
      ELECTRONIC_COMPONENT: 'secondary',
      CONNECTOR: 'info',
      WIRE_CABLE: 'warning',
      ENCLOSURE: 'success',
      PACKAGING_MATERIAL: 'default',
      CONSUMABLE: 'default',
      OTHER: 'default',
    };
    return colors[category] || 'default';
  };

  // const getStockStatus = () => {
  //   if (!material) return null;
  //   if (material.currentStock === 0) {
  //     return { label: 'Out of Stock', color: 'error' as const };
  //   }
  //   if (material.currentStock <= material.reorderLevel) {
  //     return { label: 'Low Stock', color: 'warning' as const };
  //   }
  //   return { label: 'In Stock', color: 'success' as const };
  // };

  const getStockStatus = () => {
    if (!material) return null;

    if (material.currentStock === 0) {
      // Out of Stock → light red background
      return {
        label: 'Out of Stock',
        sx: {
          bgcolor: '#ffebee', // very light red
          color: '#d32f2f', // dark red text
        },
      };
    }

    if (material.currentStock <= material.reorderLevel) {
      // Low Stock → light orange / amber background
      return {
        label: 'Low Stock',
        sx: {
          bgcolor: '#fff3e0', // very light orange
          color: '#ed6c02', // darker orange text
        },
      };
    }

    // In Stock → light green
    return {
      label: 'In Stock',
      sx: {
        bgcolor: '#e8f5e9', // light green
        color: '#2e7d32', // darker green text
      },
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !material) {
    return (
      <Box>
        <Alert severity="error">{error || 'Material not found'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const status = getStockStatus();
  const totalValue = material.currentStock * (material.unitCost || 0);
  const showAlert = material.currentStock <= material.reorderLevel;

  return (
    <Box
      sx={{
        pb: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/inventory/materials')}
          sx={{ mb: 2 }}
        >
          Back to Materials
        </Button>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {material.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={material.partNumber} size="small" />
              <Chip
                label={material.category.replace(/_/g, ' ')}
                size="small"
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                }}
              />
              {status && (
                // <Chip label={status.label} size="small" color={status.color} />
                <Chip
                  label={status.label}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    ...status.sx,
                  }}
                />
              )}
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() =>
              router.push(`/inventory/materials/${material.id}/edit`)
            }
          >
            Edit Material
          </Button>
        </Box>
      </Box>

      {/* Alert */}
      {showAlert && (
        <Alert
          severity={material.currentStock === 0 ? 'error' : 'warning'}
          sx={{ mb: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <strong>
              {material.currentStock === 0
                ? 'Out of Stock!'
                : 'Low Stock Alert!'}
            </strong>
            {material.currentStock > 0 && (
              <span>
                Current stock ({material.currentStock} {material.unit}) is at or
                below reorder level ({material.reorderLevel} {material.unit})
              </span>
            )}
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Basic Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <InfoRow label="Part Number" value={material.partNumber} bold />
              <InfoRow label="Material Name" value={material.name} />
              <InfoRow
                label="Category"
                value={material.category.replace(/_/g, ' ')}
                chip
                chipColor="#1976d2" // text color
                chipBgColor="#e3f2fd"

                // chipColor={getCategoryColor(material.category)}
              />
              <InfoRow label="Unit" value={material.unit} />
              <InfoRow
                label="Supplier"
                value={material.supplier?.name || 'Not assigned'}
                valueColor={
                  material.supplier?.name ? 'text.primary' : 'text.secondary'
                }
              />
            </Box>
          </Paper>
        </Grid>

        {/* Stock Information */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Stock Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Current Stock"
                value={`${material.currentStock} ${material.unit}`}
                highlight={showAlert}
              />
              <InfoRow
                label="Reorder Level"
                value={`${material.reorderLevel} ${material.unit}`}
              />
              <InfoRow
                label="Max Stock Level"
                value={
                  material.maxStockLevel
                    ? `${material.maxStockLevel} ${material.unit}`
                    : 'Not set'
                }
              />
              <InfoRow
                label="Unit Cost"
                value={
                  material.unitCost
                    ? formatCurrency(material.unitCost)
                    : 'Not set'
                }
              />
              <InfoRow
                label="Total Value"
                value={formatCurrency(totalValue)}
                bold
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Batches */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Recent Batches
            </Typography>
            {material.batches && material.batches.length > 0 ? (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Batch Number</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Quantity</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Received</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {material.batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.batchNumber}</TableCell>
                        <TableCell align="right">
                          {batch.quantity} {material.unit}
                        </TableCell>
                        <TableCell>
                          {format(new Date(batch.receivedDate), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No batches recorded yet
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Issuances */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Recent Issuances
            </Typography>
            {material.issuances && material.issuances.length > 0 ? (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Issued To</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Quantity</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Date</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {material.issuances.map((issuance) => (
                      <TableRow key={issuance.id}>
                        <TableCell>{issuance.issuedTo}</TableCell>
                        <TableCell align="right">
                          {issuance.quantity} {material.unit}
                        </TableCell>
                        <TableCell>
                          {format(new Date(issuance.issuedAt), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No issuances recorded yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// interface InfoRowProps {
//   label: string;
//   value: string;
//   highlight?: boolean;
//   bold?: boolean;
//   chip?: boolean;
//   chipColor?: any;
//   valueColor?: string;
// }

// function InfoRow({
//   label,
//   value,
//   highlight,
//   bold,
//   chip,
//   chipColor,
//   valueColor,
// }: InfoRowProps) {
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         mb: 2,
//       }}
//     >
//       <Typography
//         variant="body2"
//         color="text.secondary"
//         sx={{ fontWeight: 500 }}
//       >
//         {label}:
//       </Typography>
//       {chip ? (
//         <Chip
//           label={value}
//           color={chipColor}
//           size="small"
//           sx={{ fontWeight: 500 }}
//         />
//       ) : (
//         <Typography
//           variant="body2"
//           sx={{
//             fontWeight: bold || highlight ? 600 : 400,
//             color: valueColor || (highlight ? 'error.main' : 'text.primary'),
//           }}
//         >
//           {value}
//         </Typography>
//       )}
//     </Box>
//   );
// }

interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string; // text color
  chipBgColor?: string; // background color
  valueColor?: string;
}

function InfoRow({
  label,
  value,
  highlight,
  bold,
  chip,
  chipColor,
  chipBgColor,
  valueColor,
}: InfoRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {label}:
      </Typography>
      {chip ? (
        <Chip
          label={value}
          size="small"
          sx={{
            fontWeight: 500,
            color: chipColor || 'inherit',
            backgroundColor: chipBgColor || 'inherit',
          }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            fontWeight: bold || highlight ? 600 : 400,
            color: valueColor || (highlight ? 'error.main' : 'text.primary'),
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}
