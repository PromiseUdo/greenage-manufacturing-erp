// // src/app/dashboard/products/[id]/page.tsx

// 'use client';

// import { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   Alert,
//   Chip,
//   CircularProgress,
//   Divider,
//   Table,
//   TableBody,
//   TableRow,
//   TableCell,
//   Switch,
//   FormControlLabel,
//   Grid,
// } from '@mui/material';
// import {
//   ArrowBack,
//   Edit,
//   CheckCircle,
//   Cancel,
//   Warning,
// } from '@mui/icons-material';

// export default function ProductDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [product, setProduct] = useState<any>(null);

//   useEffect(() => {
//     fetchProduct();
//   }, [resolvedParams.id]);

//   const fetchProduct = async () => {
//     try {
//       const res = await fetch(`/api/products/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch product');
//       }

//       setProduct(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleActive = async () => {
//     try {
//       const res = await fetch(`/api/products/${resolvedParams.id}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ isActive: !product.isActive }),
//       });

//       if (!res.ok) {
//         throw new Error('Failed to update product status');
//       }

//       setSuccess('Product status updated successfully');
//       fetchProduct();
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//     }).format(amount);
//   };

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const formatCategory = (category: string) => {
//     return category.replace(/_/g, ' ');
//   };

//   if (loading) {
//     return (
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           minHeight: '60vh',
//         }}
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error && !product) {
//     return (
//       <Box>
//         <Alert severity="error">{error}</Alert>
//         <Button
//           startIcon={<ArrowBack />}
//           onClick={() => router.back()}
//           sx={{ mt: 2 }}
//         >
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   const categoryColors: Record<string, { bg: string; text: string }> = {
//     INVERTER: { bg: '#dbeafe', text: '#1e40af' },
//     UPS: { bg: '#fce7f3', text: '#9f1239' },
//     BATTERY: { bg: '#fef3c7', text: '#92400e' },
//     SOLAR_PANEL: { bg: '#d1fae5', text: '#065f46' },
//     CHARGE_CONTROLLER: { bg: '#e0e7ff', text: '#4338ca' },
//     ACCESSORY: { bg: '#f3f4f6', text: '#374151' },
//     PACKAGE: { bg: '#fae8ff', text: '#86198f' },
//     OTHER: { bg: '#f3f4f6', text: '#6b7280' },
//   };

//   return (
//     <Box>
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Button
//           startIcon={<ArrowBack />}
//           onClick={() => router.back()}
//           sx={{ mb: 2, color: 'text.secondary' }}
//         >
//           Back to Products
//         </Button>
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <Box>
//             <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//               <Typography variant="h6" fontWeight={600}>
//                 {product?.name}
//               </Typography>
//               <Chip
//                 label={formatCategory(product?.category)}
//                 size="small"
//                 sx={{
//                   bgcolor: categoryColors[product?.category]?.bg || '#f3f4f6',
//                   color: categoryColors[product?.category]?.text || '#6b7280',
//                   fontWeight: 500,
//                 }}
//               />
//             </Box>
//             <Box
//               sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}
//             >
//               <Typography variant="body2" color="text.secondary">
//                 {product?.productNumber}
//               </Typography>
//               {product?.isActive ? (
//                 <Chip
//                   icon={<CheckCircle />}
//                   label="Active"
//                   size="small"
//                   sx={{
//                     bgcolor: '#dcfce7',
//                     color: '#166534',
//                     fontWeight: 500,
//                   }}
//                 />
//               ) : (
//                 <Chip
//                   icon={<Cancel />}
//                   label="Inactive"
//                   size="small"
//                   sx={{
//                     bgcolor: '#fee2e2',
//                     color: '#991b1b',
//                     fontWeight: 500,
//                   }}
//                 />
//               )}
//             </Box>
//           </Box>
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             <Button
//               variant="outlined"
//               startIcon={<Edit />}
//               onClick={() => router.push(`/products/${product?.id}/edit`)}
//             >
//               Edit
//             </Button>
//           </Box>
//         </Box>
//       </Box>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
//           {success}
//         </Alert>
//       )}

//       {/* Low Stock Alert */}
//       {product?.stockQuantity !== null &&
//         product?.lowStockThreshold &&
//         product.stockQuantity <= product.lowStockThreshold && (
//           <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
//             <strong>Low Stock Alert:</strong> Current stock (
//             {product.stockQuantity}) is at or below the threshold (
//             {product.lowStockThreshold})
//           </Alert>
//         )}

//       <Grid container spacing={3}>
//         {/* Basic Information */}
//         <Grid size={{ xs: 12, md: 8 }}>
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Product Information
//             </Typography>
//             <Typography variant="body2" paragraph sx={{ mt: 2 }}>
//               {product?.description}
//             </Typography>

//             <Table size="small">
//               <TableBody>
//                 {product?.model && (
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600, width: '40%' }}>
//                       Model:
//                     </TableCell>
//                     <TableCell>{product.model}</TableCell>
//                   </TableRow>
//                 )}
//                 {product?.warranty && (
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Warranty:</TableCell>
//                     <TableCell>{product.warranty}</TableCell>
//                   </TableRow>
//                 )}
//                 {product?.leadTime && (
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 600 }}>Lead Time:</TableCell>
//                     <TableCell>{product.leadTime} days</TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </Paper>

//           {/* Specifications */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Technical Specifications
//             </Typography>
//             <Table size="small" sx={{ mt: 2 }}>
//               <TableBody>
//                 {product?.specifications.map((spec: any, index: number) => (
//                   <TableRow key={index}>
//                     <TableCell sx={{ fontWeight: 600, width: '40%' }}>
//                       {spec.label}:
//                     </TableCell>
//                     <TableCell>{spec.value}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </Paper>

//           {/* Features */}
//           {product?.features && product.features.length > 0 && (
//             <Paper sx={{ p: 3, borderRadius: 2 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Features
//               </Typography>
//               <Box component="ul" sx={{ mt: 2, pl: 3 }}>
//                 {product.features.map((feature: string, index: number) => (
//                   <li key={index}>
//                     <Typography variant="body2">{feature}</Typography>
//                   </li>
//                 ))}
//               </Box>
//             </Paper>
//           )}
//         </Grid>

//         {/* Sidebar */}
//         <Grid size={{ xs: 12, md: 4 }}>
//           {/* Pricing */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Pricing
//             </Typography>
//             <Box sx={{ mt: 2 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Base Price:
//               </Typography>
//               <Typography variant="h5" fontWeight={700} color="primary">
//                 {formatCurrency(product?.basePrice)}
//               </Typography>
//               {product?.minPrice > 0 && (
//                 <Box sx={{ mt: 1 }}>
//                   <Typography variant="caption" color="text.secondary">
//                     Min Price: {formatCurrency(product.minPrice)}
//                   </Typography>
//                 </Box>
//               )}
//             </Box>
//           </Paper>

//           {/* Stock */}
//           {product?.stockQuantity !== null && (
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Stock Status
//               </Typography>
//               <Box sx={{ mt: 2 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Current Stock:
//                 </Typography>
//                 <Typography variant="h5" fontWeight={700}>
//                   {product.stockQuantity}
//                 </Typography>
//                 {product.lowStockThreshold && (
//                   <Box sx={{ mt: 1 }}>
//                     <Typography variant="caption" color="text.secondary">
//                       Alert Threshold: {product.lowStockThreshold}
//                     </Typography>
//                   </Box>
//                 )}
//               </Box>
//             </Paper>
//           )}

//           {/* Usage Stats */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Usage Statistics
//             </Typography>
//             <Box sx={{ mt: 2 }}>
//               <Box
//                 sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
//               >
//                 <Typography variant="body2" color="text.secondary">
//                   Quotes:
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {product?._count.quotes}
//                 </Typography>
//               </Box>
//               <Box
//                 sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
//               >
//                 <Typography variant="body2" color="text.secondary">
//                   Orders:
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {product?._count.orders}
//                 </Typography>
//               </Box>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Invoices:
//                 </Typography>
//                 <Typography variant="body2" fontWeight={600}>
//                   {product?._count.invoices}
//                 </Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Tags */}
//           {product?.tags && product.tags.length > 0 && (
//             <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Tags
//               </Typography>
//               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
//                 {product.tags.map((tag: string) => (
//                   <Chip key={tag} label={tag} size="small" />
//                 ))}
//               </Box>
//             </Paper>
//           )}

//           {/* Status Control */}
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Status Control
//             </Typography>
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={product?.isActive}
//                   onChange={handleToggleActive}
//                 />
//               }
//               label={product?.isActive ? 'Active' : 'Inactive'}
//             />
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               display="block"
//               sx={{ mt: 1 }}
//             >
//               Inactive products won't appear in quote creation
//             </Typography>
//           </Paper>

//           {/* Metadata */}
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//               Metadata
//             </Typography>
//             <Box sx={{ mt: 2 }}>
//               <Typography variant="caption" color="text.secondary">
//                 Created By:
//               </Typography>
//               <Typography variant="body2">{product?.createdBy.name}</Typography>
//               <Typography
//                 variant="caption"
//                 color="text.secondary"
//                 sx={{ mt: 1, display: 'block' }}
//               >
//                 Created On:
//               </Typography>
//               <Typography variant="body2">
//                 {formatDate(product?.createdAt)}
//               </Typography>
//             </Box>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

// src/app/dashboard/products/[id]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  styled, // Using Grid v2 (which accepts 'size' prop) as per your target file
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// --- Reusable Component from Materials Page ---
interface InfoRowProps {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  bold?: boolean;
  chip?: boolean;
  chipColor?: string; // text color
  chipBgColor?: string; // background color
  valueColor?: string;
}

const SectionHeader = styled(Typography)(({ theme }) => ({
  // fontSize: 13,
  // fontWeight: 700,
  // color: '#64748B', // Slate 500
  // textTransform: 'uppercase',
  // letterSpacing: '0.8px',
  // marginBottom: theme.spacing(2),
  // display: 'flex',
  // alignItems: 'center',
  // gap: '8px',

  fontSize: 14,
  fontWeight: 700,
  color: '#0F172A',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

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
        borderBottom: '1px dashed',
        borderColor: 'divider',
        pb: 1,
        '&:last-child': {
          borderBottom: 'none',
          mb: 0,
          pb: 0,
        },
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
            height: 24,
          }}
        />
      ) : (
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: bold || highlight ? 600 : 400,
            color: valueColor || (highlight ? 'error.main' : 'text.primary'),
            textAlign: 'right',
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  INVERTER: { bg: '#dbeafe', text: '#1e40af' },
  UPS: { bg: '#fce7f3', text: '#9f1239' },
  BATTERY: { bg: '#fef3c7', text: '#92400e' },
  SOLAR_PANEL: { bg: '#d1fae5', text: '#065f46' },
  CHARGE_CONTROLLER: { bg: '#e0e7ff', text: '#4338ca' },
  ACCESSORY: { bg: '#f3f4f6', text: '#374151' },
  PACKAGE: { bg: '#fae8ff', text: '#86198f' },
  OTHER: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to update product status');
      }

      setSuccess('Product status updated successfully');
      fetchProduct(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCategory = (category: string) => {
    return category?.replace(/_/g, ' ') || '';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? {
          label: 'Active',
          sx: { bgcolor: '#e8f5e9', color: '#2e7d32' },
        }
      : {
          label: 'Inactive',
          sx: { bgcolor: '#ffebee', color: '#d32f2f' },
        };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !product) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
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

  const status = getStatusColor(product.isActive);
  const isLowStock =
    product?.stockQuantity !== null &&
    product?.lowStockThreshold &&
    product.stockQuantity <= product.lowStockThreshold;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/products')} // Adjusted path to typical dashboard route
          sx={{ mb: 2 }}
        >
          Back to Products
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
              {product.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={product.productNumber} size="small" />
              <Chip
                label={formatCategory(product.category)}
                size="small"
                sx={{
                  bgcolor: categoryColors[product.category]?.bg || '#f3f4f6',
                  color: categoryColors[product.category]?.text || '#6b7280',
                  fontWeight: 500,
                }}
              />
              <Chip
                label={status.label}
                size="small"
                sx={{
                  fontWeight: 500,
                  ...status.sx,
                }}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/products/${product.id}/edit`)}
            sx={{
              bgcolor: '#0F172A',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            Edit Product
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {isLowStock && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <strong>Low Stock Alert!</strong>
            <span>
              Current stock ({product.stockQuantity}) is at or below the
              threshold ({product.lowStockThreshold})
            </span>
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Basic Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            {/* <Typography
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
            </Typography> */}

            <SectionHeader> Basic Information</SectionHeader>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, fontStyle: 'italic' }}
              >
                {product.description || 'No description provided.'}
              </Typography>

              <InfoRow
                label="Product Number"
                value={product.productNumber}
                bold
              />
              <InfoRow label="Model" value={product.model || 'N/A'} />
              <InfoRow
                label="Category"
                value={formatCategory(product.category)}
                chip
                chipBgColor={categoryColors[product.category]?.bg}
                chipColor={categoryColors[product.category]?.text}
              />
              <InfoRow label="Warranty" value={product.warranty || 'None'} />
              <InfoRow
                label="Lead Time"
                value={product.leadTime ? `${product.leadTime} days` : 'N/A'}
              />
            </Box>
          </Paper>

          {/* Technical Specifications */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Technical Specifications
            </Typography> */}
            <SectionHeader> Technical Specifications</SectionHeader>

            {product.specifications && product.specifications.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {product.specifications.map((spec: any, index: number) => (
                  <InfoRow key={index} label={spec.label} value={spec.value} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No specifications listed.
              </Typography>
            )}
          </Paper>

          {/* Features */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Features
            </Typography> */}

            <SectionHeader> Features</SectionHeader>
            {product.features && product.features.length > 0 ? (
              <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                {product.features.map((feature: string, index: number) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    <Typography variant="body2">{feature}</Typography>
                  </li>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No features listed.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Pricing Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Pricing
            </Typography> */}
            <SectionHeader>Pricing</SectionHeader>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Base Price"
                value={formatCurrency(product.basePrice)}
                bold
                valueColor="primary.main"
              />
              {product.minPrice > 0 && (
                <InfoRow
                  label="Minimum Price"
                  value={formatCurrency(product.minPrice)}
                />
              )}
            </Box>
          </Paper>

          {/* Stock Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Stock Status
            </Typography> */}

            <SectionHeader>Stock Status</SectionHeader>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Stock Level"
                value={
                  product.stockQuantity !== null
                    ? product.stockQuantity
                    : 'Unlimited/Service'
                }
                highlight={isLowStock}
              />
              {product.lowStockThreshold && (
                <InfoRow
                  label="Alert Threshold"
                  value={product.lowStockThreshold}
                />
              )}
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={product.isActive}
                      onChange={handleToggleActive}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Product is{' '}
                      <strong>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </strong>
                    </Typography>
                  }
                />
              </Box>
            </Box>
          </Paper>

          {/* Usage Statistics */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Usage Statistics
            </Typography> */}

            <SectionHeader>Usage Statistics</SectionHeader>

            <Box sx={{ mt: 2 }}>
              <InfoRow label="Quotes" value={product._count?.quotes || 0} />
              <InfoRow label="Orders" value={product._count?.orders || 0} />
              <InfoRow label="Invoices" value={product._count?.invoices || 0} />
            </Box>
          </Paper>

          {/* Metadata */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                fontSize: 18,
                mb: 3,
              }}
            >
              Metadata
            </Typography> */}

            <SectionHeader>Metadata</SectionHeader>
            <Box sx={{ mt: 2 }}>
              <InfoRow
                label="Created By"
                value={product.createdBy?.name || 'Unknown'}
              />
              <InfoRow
                label="Created On"
                value={formatDate(product.createdAt)}
              />
              {product.tags && product.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {product.tags.map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
