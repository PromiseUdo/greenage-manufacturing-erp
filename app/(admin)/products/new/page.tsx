// // src/app/dashboard/products/new/page.tsx

// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   TextField,
//   Button,
//   Alert,
//   MenuItem,
//   Divider,
//   IconButton,
//   Chip,
//   Grid,
// } from '@mui/material';
// import { ArrowBack, Add, Delete, Calculate } from '@mui/icons-material';

// interface Specification {
//   label: string;
//   value: string;
// }

// export default function NewProductPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     category: '',
//     productCode: '',
//     model: '',
//     basePrice: 0,
//     minPrice: 0,
//     warranty: '',
//     leadTime: 0,
//     stockQuantity: 0,
//     lowStockThreshold: 0,
//     notes: '',
//   });

//   const [specifications, setSpecifications] = useState<Specification[]>([
//     { label: '', value: '' },
//   ]);

//   const [features, setFeatures] = useState<string[]>(['']);
//   const [tags, setTags] = useState<string[]>([]);
//   const [tagInput, setTagInput] = useState('');

//   const handleChange = (field: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleAddSpecification = () => {
//     setSpecifications([...specifications, { label: '', value: '' }]);
//   };

//   const handleRemoveSpecification = (index: number) => {
//     if (specifications.length > 1) {
//       setSpecifications(specifications.filter((_, i) => i !== index));
//     }
//   };

//   const handleSpecificationChange = (
//     index: number,
//     field: 'label' | 'value',
//     value: string,
//   ) => {
//     const updated = [...specifications];
//     updated[index][field] = value;
//     setSpecifications(updated);
//   };

//   const handleAddFeature = () => {
//     setFeatures([...features, '']);
//   };

//   const handleRemoveFeature = (index: number) => {
//     if (features.length > 1) {
//       setFeatures(features.filter((_, i) => i !== index));
//     }
//   };

//   const handleFeatureChange = (index: number, value: string) => {
//     const updated = [...features];
//     updated[index] = value;
//     setFeatures(updated);
//   };

//   const handleAddTag = () => {
//     if (tagInput.trim() && !tags.includes(tagInput.trim())) {
//       setTags([...tags, tagInput.trim()]);
//       setTagInput('');
//     }
//   };

//   const handleRemoveTag = (tag: string) => {
//     setTags(tags.filter((t) => t !== tag));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       // Validate specifications
//       const validSpecs = specifications.filter(
//         (spec) => spec.label.trim() && spec.value.trim(),
//       );

//       if (validSpecs.length === 0) {
//         throw new Error('At least one specification is required');
//       }

//       // Validate features
//       const validFeatures = features.filter((f) => f.trim());

//       const payload = {
//         ...formData,
//         specifications: validSpecs,
//         features: validFeatures,
//         tags,
//       };

//       const res = await fetch('/api/products', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to create product');
//       }

//       router.push(`/products/${data.id}`);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
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
//         <Typography variant="h6" fontWeight={600}>
//           Create New Product
//         </Typography>
//         <Typography variant="body2" color="text.secondary">
//           Add a new product to your catalog
//         </Typography>
//       </Box>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {/* Form */}
//       <Paper sx={{ p: 4, borderRadius: 2 }}>
//         <Box component="form" onSubmit={handleSubmit}>
//           <Grid container spacing={3}>
//             {/* Basic Information */}
//             <Grid size={{ xs: 12 }}>
//               <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
//                 Basic Information
//               </Typography>
//             </Grid>

//             <Grid size={{ xs: 12, md: 8 }}>
//               <TextField
//                 fullWidth
//                 label="Product Name"
//                 variant="standard"
//                 required
//                 value={formData.name}
//                 onChange={(e) => handleChange('name', e.target.value)}
//                 disabled={loading}
//                 placeholder="e.g., 5KVA Pure Sine Wave Inverter"
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 4 }}>
//               <TextField
//                 fullWidth
//                 label="Model Number"
//                 variant="standard"
//                 value={formData.model}
//                 onChange={(e) => handleChange('model', e.target.value)}
//                 disabled={loading}
//                 placeholder="e.g., NGI-5000"
//               />
//             </Grid>

//             <Grid size={{ xs: 12 }}>
//               <TextField
//                 fullWidth
//                 label="Description"
//                 variant="standard"
//                 required
//                 multiline
//                 rows={3}
//                 value={formData.description}
//                 onChange={(e) => handleChange('description', e.target.value)}
//                 disabled={loading}
//                 placeholder="Detailed product description"
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <TextField
//                 fullWidth
//                 select
//                 label="Category"
//                 variant="standard"
//                 required
//                 value={formData.category}
//                 onChange={(e) => handleChange('category', e.target.value)}
//                 disabled={loading}
//               >
//                 <MenuItem value="INVERTER">Inverter</MenuItem>
//                 <MenuItem value="UPS">UPS</MenuItem>
//                 <MenuItem value="BATTERY">Battery</MenuItem>
//                 <MenuItem value="SOLAR_PANEL">Solar Panel</MenuItem>
//                 <MenuItem value="CHARGE_CONTROLLER">Charge Controller</MenuItem>
//                 <MenuItem value="ACCESSORY">Accessory</MenuItem>
//                 <MenuItem value="PACKAGE">Complete Package</MenuItem>
//                 <MenuItem value="OTHER">Other</MenuItem>
//               </TextField>
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <TextField
//                 fullWidth
//                 label="Product Code *"
//                 variant="standard"
//                 required
//                 value={formData.productCode}
//                 onChange={(e) => {
//                   // Auto-uppercase and limit to 4 characters
//                   const value = e.target.value.toUpperCase().slice(0, 4);
//                   handleChange('productCode', value);
//                 }}
//                 disabled={loading}
//                 placeholder="e.g., INV5, UPS3, BAT2"
//                 inputProps={{
//                   maxLength: 4,
//                   pattern: '[A-Z0-9]{3,4}',
//                 }}
//                 helperText="3-4 uppercase letters/numbers (used for unit ID generation)"
//                 error={
//                   formData.productCode.length > 0 &&
//                   !/^[A-Z0-9]{3,4}$/.test(formData.productCode)
//                 }
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <TextField
//                 fullWidth
//                 label="Warranty"
//                 variant="standard"
//                 value={formData.warranty}
//                 onChange={(e) => handleChange('warranty', e.target.value)}
//                 disabled={loading}
//                 placeholder="e.g., 24 months"
//               />
//             </Grid>

//             {/* Specifications */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   mb: 2,
//                 }}
//               >
//                 <Typography variant="subtitle1" fontWeight={600}>
//                   Specifications *
//                 </Typography>
//                 <Button
//                   startIcon={<Add />}
//                   onClick={handleAddSpecification}
//                   size="small"
//                 >
//                   Add Specification
//                 </Button>
//               </Box>
//             </Grid>

//             {specifications.map((spec, index) => (
//               <Grid size={{ xs: 12 }} key={index}>
//                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
//                   <TextField
//                     fullWidth
//                     label="Label"
//                     variant="standard"
//                     value={spec.label}
//                     onChange={(e) =>
//                       handleSpecificationChange(index, 'label', e.target.value)
//                     }
//                     disabled={loading}
//                     placeholder="e.g., Power Output"
//                   />
//                   <TextField
//                     fullWidth
//                     label="Value"
//                     variant="standard"
//                     value={spec.value}
//                     onChange={(e) =>
//                       handleSpecificationChange(index, 'value', e.target.value)
//                     }
//                     disabled={loading}
//                     placeholder="e.g., 5000VA / 5000W"
//                   />
//                   <IconButton
//                     onClick={() => handleRemoveSpecification(index)}
//                     disabled={specifications.length === 1 || loading}
//                     color="error"
//                   >
//                     <Delete />
//                   </IconButton>
//                 </Box>
//               </Grid>
//             ))}

//             {/* Features */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   mb: 2,
//                 }}
//               >
//                 <Typography variant="subtitle1" fontWeight={600}>
//                   Features (Optional)
//                 </Typography>
//                 <Button
//                   startIcon={<Add />}
//                   onClick={handleAddFeature}
//                   size="small"
//                 >
//                   Add Feature
//                 </Button>
//               </Box>
//             </Grid>

//             {features.map((feature, index) => (
//               <Grid size={{ xs: 12 }} key={index}>
//                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
//                   <TextField
//                     fullWidth
//                     label={`Feature ${index + 1}`}
//                     variant="standard"
//                     value={feature}
//                     onChange={(e) => handleFeatureChange(index, e.target.value)}
//                     disabled={loading}
//                     placeholder="e.g., Pure Sine Wave Output"
//                   />
//                   <IconButton
//                     onClick={() => handleRemoveFeature(index)}
//                     disabled={features.length === 1 || loading}
//                     color="error"
//                   >
//                     <Delete />
//                   </IconButton>
//                 </Box>
//               </Grid>
//             ))}

//             {/* Pricing */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Box
//                 sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
//               >
//                 <Typography variant="subtitle1" fontWeight={600}>
//                   Pricing
//                 </Typography>
//               </Box>
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <TextField
//                 fullWidth
//                 label="Base Price"
//                 variant="standard"
//                 type="number"
//                 required
//                 value={formData.basePrice}
//                 onChange={(e) =>
//                   handleChange('basePrice', parseFloat(e.target.value) || 0)
//                 }
//                 disabled={loading}
//                 InputProps={{
//                   startAdornment: <span style={{ marginRight: 8 }}>₦</span>,
//                 }}
//                 inputProps={{ min: 0, step: 0.01 }}
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <TextField
//                 fullWidth
//                 label="Minimum Price (for discounts)"
//                 variant="standard"
//                 type="number"
//                 value={formData.minPrice}
//                 onChange={(e) =>
//                   handleChange('minPrice', parseFloat(e.target.value) || 0)
//                 }
//                 disabled={loading}
//                 InputProps={{
//                   startAdornment: <span style={{ marginRight: 8 }}>₦</span>,
//                 }}
//                 inputProps={{ min: 0, step: 0.01 }}
//                 helperText="Optional minimum selling price"
//               />
//             </Grid>

//             {/* Stock & Production */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
//                 Stock & Production
//               </Typography>
//             </Grid>

//             <Grid size={{ xs: 12, md: 4 }}>
//               <TextField
//                 fullWidth
//                 label="Current Stock Quantity"
//                 variant="standard"
//                 type="number"
//                 value={formData.stockQuantity}
//                 onChange={(e) =>
//                   handleChange('stockQuantity', parseInt(e.target.value) || 0)
//                 }
//                 disabled={loading}
//                 inputProps={{ min: 0 }}
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 4 }}>
//               <TextField
//                 fullWidth
//                 label="Low Stock Threshold"
//                 variant="standard"
//                 type="number"
//                 value={formData.lowStockThreshold}
//                 onChange={(e) =>
//                   handleChange(
//                     'lowStockThreshold',
//                     parseInt(e.target.value) || 0,
//                   )
//                 }
//                 disabled={loading}
//                 inputProps={{ min: 0 }}
//                 helperText="Alert when stock falls below"
//               />
//             </Grid>

//             <Grid size={{ xs: 12, md: 4 }}>
//               <TextField
//                 fullWidth
//                 label="Lead Time (days)"
//                 variant="standard"
//                 type="number"
//                 value={formData.leadTime}
//                 onChange={(e) =>
//                   handleChange('leadTime', parseInt(e.target.value) || 0)
//                 }
//                 disabled={loading}
//                 inputProps={{ min: 0 }}
//                 helperText="Production/delivery time"
//               />
//             </Grid>

//             {/* Tags */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
//                 Tags (Optional)
//               </Typography>
//             </Grid>

//             <Grid size={{ xs: 12 }}>
//               <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//                 <TextField
//                   fullWidth
//                   label="Add Tag"
//                   variant="standard"
//                   value={tagInput}
//                   onChange={(e) => setTagInput(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       handleAddTag();
//                     }
//                   }}
//                   disabled={loading}
//                   placeholder="e.g., solar, off-grid"
//                 />
//                 <Button
//                   onClick={handleAddTag}
//                   disabled={!tagInput.trim() || loading}
//                 >
//                   Add
//                 </Button>
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
//                 {tags.map((tag) => (
//                   <Chip
//                     key={tag}
//                     label={tag}
//                     onDelete={() => handleRemoveTag(tag)}
//                     disabled={loading}
//                   />
//                 ))}
//               </Box>
//             </Grid>

//             {/* Notes */}
//             <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
//               <Divider sx={{ mb: 3 }} />
//               <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
//                 Additional Notes
//               </Typography>
//             </Grid>

//             <Grid size={{ xs: 12 }}>
//               <TextField
//                 fullWidth
//                 label="Internal Notes"
//                 variant="standard"
//                 multiline
//                 rows={3}
//                 value={formData.notes}
//                 onChange={(e) => handleChange('notes', e.target.value)}
//                 disabled={loading}
//                 placeholder="Internal notes (not shown to customers)"
//               />
//             </Grid>

//             {/* Actions */}
//             <Grid size={{ xs: 12 }}>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   gap: 2,
//                   justifyContent: 'flex-end',
//                   mt: 2,
//                 }}
//               >
//                 <Button
//                   variant="outlined"
//                   onClick={() => router.back()}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   variant="contained"
//                   disabled={loading}
//                   sx={{
//                     bgcolor: '#0F172A',
//                     fontWeight: 600,
//                     '&:hover': { bgcolor: '#1e293b' },
//                   }}
//                 >
//                   {loading ? 'Creating...' : 'Create Product'}
//                 </Button>
//               </Box>
//             </Grid>
//           </Grid>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  MenuItem,
  IconButton,
  Chip,
  InputAdornment,
  CircularProgress,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Edit,
  Settings,
  FeaturedPlayList,
  AttachMoney,
  LocalShipping,
  Label,
} from '@mui/icons-material';

// --- Design Tokens ---
// const SectionHeader = styled(Typography)(({ theme }) => ({
//   fontSize: 13,
//   fontWeight: 700,
//   color: '#64748B', // Slate 500
//   textTransform: 'uppercase',
//   letterSpacing: '0.8px',
//   marginBottom: theme.spacing(3),
//   display: 'flex',
//   alignItems: 'center',
//   gap: '8px',
//   borderBottom: '1px solid #E2E8F0',
//   paddingBottom: theme.spacing(1),
// }));

const SectionHeader = styled(Typography)(({ theme }) => ({
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

const FormCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: 'none',
  marginBottom: theme.spacing(3),
}));

interface Specification {
  label: string;
  value: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    productCode: '',
    model: '',
    basePrice: 0,
    minPrice: 0,
    warranty: '',
    leadTime: 0,
    stockQuantity: 0,
    lowStockThreshold: 0,
    notes: '',
  });

  const [specifications, setSpecifications] = useState<Specification[]>([
    { label: '', value: '' },
  ]);

  const [features, setFeatures] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Specifications Logic ---
  const handleAddSpecification = () => {
    setSpecifications([...specifications, { label: '', value: '' }]);
  };
  const handleRemoveSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };
  const handleSpecificationChange = (
    index: number,
    field: 'label' | 'value',
    value: string,
  ) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  // --- Features Logic ---
  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };
  const handleRemoveFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };
  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  // --- Tags Logic ---
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validSpecs = specifications.filter(
        (spec) => spec.label.trim() && spec.value.trim(),
      );
      if (validSpecs.length === 0)
        throw new Error('At least one specification is required');

      const validFeatures = features.filter((f) => f.trim());

      const payload = {
        ...formData,
        specifications: validSpecs,
        features: validFeatures,
        tags,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      router.push(`/products/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 5 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{
              mb: 1,
              textTransform: 'none',
              color: 'text.secondary',
              p: 0,
            }}
          >
            Back to Products
          </Button>
          <Typography variant="h5" fontWeight={700} color="#0F172A">
            Create New Product
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new item to your inventory catalog.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* LEFT COLUMN: Main Forms */}
          <Grid item xs={12} md={8}>
            {/* 1. Core Details */}
            <FormCard>
              <SectionHeader>
                {/* <Edit fontSize="small" /> Core Details */}

                <SectionHeader>Core Details</SectionHeader>
              </SectionHeader>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    variant="standard"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={loading}
                    placeholder="e.g. 5KVA Inverter"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    variant="standard"
                    required
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    disabled={loading}
                  >
                    {[
                      'INVERTER',
                      'UPS',
                      'BATTERY',
                      'SOLAR_PANEL',
                      'CHARGE_CONTROLLER',
                      'ACCESSORY',
                      'PACKAGE',
                      'OTHER',
                    ].map((c) => (
                      <MenuItem key={c} value={c}>
                        {c.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    variant="standard"
                    required
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Code"
                    variant="standard"
                    required
                    value={formData.productCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 4);
                      handleChange('productCode', value);
                    }}
                    disabled={loading}
                    placeholder="e.g. INV5"
                    helperText="Unique 3-4 char ID (Auto-Uppercase)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Model Number"
                    variant="standard"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    disabled={loading}
                    placeholder="e.g. NGI-5000"
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* 2. Specifications */}
            <FormCard>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  borderBottom: '1px solid #E2E8F0',
                  pb: 1,
                }}
              >
                <SectionHeader sx={{ mb: 0, borderBottom: 'none', pb: 0 }}>
                  Specifications
                  {/* <Settings fontSize="small" /> Specifications */}
                </SectionHeader>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddSpecification}
                  size="small"
                  variant="outlined"
                >
                  Add Row
                </Button>
              </Box>

              {specifications.map((spec, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ mb: 2, alignItems: 'center' }}
                >
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Label"
                      variant="standard"
                      size="small"
                      placeholder="e.g. Output"
                      value={spec.label}
                      onChange={(e) =>
                        handleSpecificationChange(
                          index,
                          'label',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      variant="standard"
                      size="small"
                      placeholder="e.g. 220V"
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecificationChange(
                          index,
                          'value',
                          e.target.value,
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleRemoveSpecification(index)}
                      disabled={specifications.length === 1}
                      color="error"
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </FormCard>

            {/* 3. Features */}
            <FormCard>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  borderBottom: '1px solid #E2E8F0',
                  pb: 1,
                }}
              >
                <SectionHeader sx={{ mb: 0, borderBottom: 'none', pb: 0 }}>
                  Features
                  {/* <FeaturedPlayList fontSize="small" /> Features */}
                </SectionHeader>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddFeature}
                  size="small"
                  variant="outlined"
                >
                  Add Item
                </Button>
              </Box>

              {features.map((feature, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ mb: 2, alignItems: 'center' }}
                >
                  <Grid item xs={11}>
                    <TextField
                      fullWidth
                      label={`Feature Point ${index + 1}`}
                      variant="standard"
                      placeholder="Key selling point..."
                      value={feature}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleRemoveFeature(index)}
                      disabled={features.length === 1}
                      color="error"
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </FormCard>

            {/* 4. Financials */}
            <FormCard sx={{ mb: 0 }}>
              <SectionHeader>
                Financials & Inventory
                {/* <AttachMoney fontSize="small" /> Financials & Inventory */}
              </SectionHeader>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base Price"
                    variant="standard"
                    type="number"
                    required
                    value={formData.basePrice}
                    onChange={(e) =>
                      handleChange('basePrice', parseFloat(e.target.value) || 0)
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₦</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Min. Allowable Price"
                    variant="standard"
                    type="number"
                    value={formData.minPrice}
                    onChange={(e) =>
                      handleChange('minPrice', parseFloat(e.target.value) || 0)
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₦</InputAdornment>
                      ),
                    }}
                    helperText="Lowest price for discounts"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Initial Stock"
                    variant="standard"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      handleChange(
                        'stockQuantity',
                        parseInt(e.target.value) || 0,
                      )
                    }
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Low Stock Alert"
                    variant="standard"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      handleChange(
                        'lowStockThreshold',
                        parseInt(e.target.value) || 0,
                      )
                    }
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </FormCard>
          </Grid>

          {/* RIGHT COLUMN: Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Logistics Card */}
            <FormCard>
              <SectionHeader>
                Logistics
                {/* <LocalShipping fontSize="small" /> Logistics */}
              </SectionHeader>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Warranty Period"
                    variant="standard"
                    value={formData.warranty}
                    onChange={(e) => handleChange('warranty', e.target.value)}
                    placeholder="e.g. 12 Months"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Standard Lead Time (Days)"
                    variant="standard"
                    type="number"
                    value={formData.leadTime}
                    onChange={(e) =>
                      handleChange('leadTime', parseInt(e.target.value) || 0)
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Internal Notes"
                    variant="standard"
                    multiline
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Private notes..."
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* Tags Card */}
            <FormCard>
              <SectionHeader>
                <Label fontSize="small" /> Tags
              </SectionHeader>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="New tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                  }
                />
                <Button
                  variant="contained"
                  onClick={handleAddTag}
                  sx={{ bgcolor: '#0F172A', minWidth: 'auto' }}
                >
                  <Add fontSize="small" />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', fontWeight: 500 }}
                  />
                ))}
                {tags.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No tags added.
                  </Typography>
                )}
              </Box>
            </FormCard>

            {/* Action Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#0F172A',
                color: 'white',
                position: 'sticky',
                top: 24,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                sx={{ color: '#fff' }}
              >
                Create Product
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
              >
                This item will be immediately available for Orders and Quotes.
              </Typography>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <></>
                    )
                  }
                  sx={{
                    bgcolor: '#fff',
                    color: '#0F172A',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#F1F5F9' },
                  }}
                >
                  {loading ? 'Processing...' : 'Save Product'}
                </Button>
                <Button
                  fullWidth
                  onClick={() => router.back()}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: '#fff' },
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
