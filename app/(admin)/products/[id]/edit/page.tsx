// // src/app/dashboard/products/[id]/edit/page.tsx

// 'use client';

// import { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   TextField,
//   Button,
//   Alert,
//   MenuItem,
//   IconButton,
//   CircularProgress,
//   Grid,
// } from '@mui/material';
// import { ArrowBack, Save, Add, Delete } from '@mui/icons-material';

// interface Specification {
//   label: string;
//   value: string;
// }

// export default function EditProductPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const resolvedParams = use(params);
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [fetchLoading, setFetchLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

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
//     isActive: true,
//     isAvailable: true,
//   });

//   const [specifications, setSpecifications] = useState<Specification[]>([
//     { label: '', value: '' },
//   ]);

//   const [features, setFeatures] = useState<string[]>(['']);
//   const [tags, setTags] = useState<string[]>([]);
//   const [tagInput, setTagInput] = useState('');

//   useEffect(() => {
//     fetchProduct();
//   }, [resolvedParams.id]);

//   const fetchProduct = async () => {
//     try {
//       setFetchLoading(true);
//       const res = await fetch(`/api/products/${resolvedParams.id}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to fetch product');
//       }

//       // Set form data
//       setFormData({
//         name: data.name || '',
//         description: data.description || '',
//         category: data.category || '',
//         productCode: data.productCode || '',
//         model: data.model || '',
//         basePrice: data.basePrice || 0,
//         minPrice: data.minPrice || 0,
//         warranty: data.warranty || '',
//         leadTime: data.leadTime || 0,
//         stockQuantity: data.stockQuantity || 0,
//         lowStockThreshold: data.lowStockThreshold || 0,
//         notes: data.notes || '',
//         isActive: data.isActive ?? true,
//         isAvailable: data.isAvailable ?? true,
//       });

//       // Set specifications
//       if (data.specifications && Array.isArray(data.specifications)) {
//         setSpecifications(
//           data.specifications.length > 0
//             ? data.specifications
//             : [{ label: '', value: '' }],
//         );
//       }

//       // Set features
//       if (data.features && Array.isArray(data.features)) {
//         setFeatures(data.features.length > 0 ? data.features : ['']);
//       }

//       // Set tags
//       if (data.tags && Array.isArray(data.tags)) {
//         setTags(data.tags);
//       }
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setFetchLoading(false);
//     }
//   };

//   const handleChange = (field: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const addSpecification = () => {
//     setSpecifications([...specifications, { label: '', value: '' }]);
//   };

//   const updateSpecification = (
//     index: number,
//     field: 'label' | 'value',
//     value: string,
//   ) => {
//     const updated = [...specifications];
//     updated[index][field] = value;
//     setSpecifications(updated);
//   };

//   const removeSpecification = (index: number) => {
//     if (specifications.length > 1) {
//       setSpecifications(specifications.filter((_, i) => i !== index));
//     }
//   };

//   const addFeature = () => {
//     setFeatures([...features, '']);
//   };

//   const updateFeature = (index: number, value: string) => {
//     const updated = [...features];
//     updated[index] = value;
//     setFeatures(updated);
//   };

//   const removeFeature = (index: number) => {
//     if (features.length > 1) {
//       setFeatures(features.filter((_, i) => i !== index));
//     }
//   };

//   const addTag = () => {
//     if (tagInput.trim() && !tags.includes(tagInput.trim())) {
//       setTags([...tags, tagInput.trim()]);
//       setTagInput('');
//     }
//   };

//   const removeTag = (tag: string) => {
//     setTags(tags.filter((t) => t !== tag));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       // Validation
//       if (
//         !formData.name ||
//         !formData.description ||
//         !formData.category ||
//         !formData.productCode
//       ) {
//         throw new Error(
//           'Name, description, category, and product code are required',
//         );
//       }

//       if (!/^[A-Z0-9]{3,4}$/.test(formData.productCode)) {
//         throw new Error(
//           'Product code must be 3-4 uppercase alphanumeric characters',
//         );
//       }

//       if (formData.basePrice <= 0) {
//         throw new Error('Base price must be greater than 0');
//       }

//       // Filter out empty specifications
//       const validSpecs = specifications.filter(
//         (spec) => spec.label.trim() !== '' && spec.value.trim() !== '',
//       );

//       if (validSpecs.length === 0) {
//         throw new Error('At least one specification is required');
//       }

//       // Filter out empty features
//       const validFeatures = features.filter((f) => f.trim() !== '');

//       const payload = {
//         ...formData,
//         specifications: validSpecs,
//         features: validFeatures,
//         tags: tags,
//       };

//       const res = await fetch(`/api/products/${resolvedParams.id}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || 'Failed to update product');
//       }

//       setSuccess('Product updated successfully!');
//       setTimeout(() => {
//         router.push(`/products/${resolvedParams.id}`);
//       }, 1500);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetchLoading) {
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

//   return (
//     <Box>
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Button
//           startIcon={<ArrowBack />}
//           onClick={() => router.back()}
//           sx={{ mb: 2, color: 'text.secondary' }}
//         >
//           Back
//         </Button>
//         <Typography variant="h6" fontWeight={600}>
//           Edit Product
//         </Typography>
//         <Typography variant="body2" color="text.secondary">
//           Update product information
//         </Typography>
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

//       <form onSubmit={handleSubmit}>
//         <Grid container spacing={3}>
//           <Grid size={{ xs: 12, md: 8 }}>
//             {/* Basic Information */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 2,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Basic Information
//               </Typography>

//               <Grid container spacing={2} sx={{ mt: 1 }}>
//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Product Name *"
//                     variant="standard"
//                     required
//                     value={formData.name}
//                     onChange={(e) => handleChange('name', e.target.value)}
//                     disabled={loading}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     select
//                     label="Category *"
//                     variant="standard"
//                     required
//                     value={formData.category}
//                     onChange={(e) => handleChange('category', e.target.value)}
//                     disabled={loading}
//                   >
//                     <MenuItem value="INVERTER">Inverter</MenuItem>
//                     <MenuItem value="UPS">UPS</MenuItem>
//                     <MenuItem value="BATTERY">Battery</MenuItem>
//                     <MenuItem value="SOLAR_PANEL">Solar Panel</MenuItem>
//                     <MenuItem value="CHARGE_CONTROLLER">
//                       Charge Controller
//                     </MenuItem>
//                     <MenuItem value="ACCESSORY">Accessory</MenuItem>
//                     <MenuItem value="PACKAGE">Package</MenuItem>
//                     <MenuItem value="OTHER">Other</MenuItem>
//                   </TextField>
//                 </Grid>

//                 <Grid size={{ xs: 12 }}>
//                   <TextField
//                     fullWidth
//                     label="Description *"
//                     variant="standard"
//                     required
//                     multiline
//                     rows={2}
//                     value={formData.description}
//                     onChange={(e) =>
//                       handleChange('description', e.target.value)
//                     }
//                     disabled={loading}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Product Code *"
//                     variant="standard"
//                     required
//                     value={formData.productCode}
//                     onChange={(e) => {
//                       const value = e.target.value.toUpperCase().slice(0, 4);
//                       handleChange('productCode', value);
//                     }}
//                     disabled={true} // Product code should not be editable
//                     helperText="Product code cannot be changed"
//                     inputProps={{
//                       maxLength: 4,
//                     }}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Model"
//                     variant="standard"
//                     value={formData.model}
//                     onChange={(e) => handleChange('model', e.target.value)}
//                     disabled={loading}
//                     placeholder="e.g., NGI-5000"
//                   />
//                 </Grid>
//               </Grid>
//             </Paper>

//             {/* Specifications */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 2,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
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
//                   onClick={addSpecification}
//                   size="small"
//                   disabled={loading}
//                 >
//                   Add Specification
//                 </Button>
//               </Box>

//               {specifications.map((spec, index) => (
//                 <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
//                   <Grid size={{ xs: 12, md: 5 }}>
//                     <TextField
//                       fullWidth
//                       label="Label"
//                       variant="standard"
//                       placeholder="e.g., Power Output"
//                       value={spec.label}
//                       onChange={(e) =>
//                         updateSpecification(index, 'label', e.target.value)
//                       }
//                       disabled={loading}
//                     />
//                   </Grid>
//                   <Grid size={{ xs: 12, md: 6 }}>
//                     <TextField
//                       fullWidth
//                       label="Value"
//                       variant="standard"
//                       placeholder="e.g., 5000VA / 5000W"
//                       value={spec.value}
//                       onChange={(e) =>
//                         updateSpecification(index, 'value', e.target.value)
//                       }
//                       disabled={loading}
//                     />
//                   </Grid>
//                   <Grid size={{ xs: 12, md: 1 }}>
//                     <IconButton
//                       onClick={() => removeSpecification(index)}
//                       disabled={specifications.length === 1 || loading}
//                       color="error"
//                     >
//                       <Delete />
//                     </IconButton>
//                   </Grid>
//                 </Grid>
//               ))}
//             </Paper>

//             {/* Features */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 2,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   mb: 2,
//                 }}
//               >
//                 <Typography variant="subtitle1" fontWeight={600}>
//                   Features
//                 </Typography>
//                 <Button
//                   startIcon={<Add />}
//                   onClick={addFeature}
//                   size="small"
//                   disabled={loading}
//                 >
//                   Add Feature
//                 </Button>
//               </Box>

//               {features.map((feature, index) => (
//                 <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
//                   <Grid size={{ xs: 12, md: 11 }}>
//                     <TextField
//                       fullWidth
//                       label={`Feature ${index + 1}`}
//                       variant="standard"
//                       placeholder="e.g., Pure sine wave output"
//                       value={feature}
//                       onChange={(e) => updateFeature(index, e.target.value)}
//                       disabled={loading}
//                     />
//                   </Grid>
//                   <Grid size={{ xs: 12, md: 1 }}>
//                     <IconButton
//                       onClick={() => removeFeature(index)}
//                       disabled={features.length === 1 || loading}
//                       color="error"
//                     >
//                       <Delete />
//                     </IconButton>
//                   </Grid>
//                 </Grid>
//               ))}
//             </Paper>

//             {/* Pricing & Stock */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 2,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Pricing & Stock
//               </Typography>

//               <Grid container spacing={2} sx={{ mt: 1 }}>
//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Base Price *"
//                     variant="standard"
//                     type="number"
//                     required
//                     value={formData.basePrice}
//                     onChange={(e) =>
//                       handleChange('basePrice', parseFloat(e.target.value) || 0)
//                     }
//                     disabled={loading}
//                     InputProps={{
//                       startAdornment: <span style={{ marginRight: 8 }}>₦</span>,
//                     }}
//                     inputProps={{ min: 0, step: 0.01 }}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Minimum Price"
//                     variant="standard"
//                     type="number"
//                     value={formData.minPrice}
//                     onChange={(e) =>
//                       handleChange('minPrice', parseFloat(e.target.value) || 0)
//                     }
//                     disabled={loading}
//                     InputProps={{
//                       startAdornment: <span style={{ marginRight: 8 }}>₦</span>,
//                     }}
//                     inputProps={{ min: 0, step: 0.01 }}
//                     helperText="For discount limits"
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Stock Quantity"
//                     variant="standard"
//                     type="number"
//                     value={formData.stockQuantity}
//                     onChange={(e) =>
//                       handleChange(
//                         'stockQuantity',
//                         parseInt(e.target.value) || 0,
//                       )
//                     }
//                     disabled={loading}
//                     inputProps={{ min: 0 }}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Low Stock Threshold"
//                     variant="standard"
//                     type="number"
//                     value={formData.lowStockThreshold}
//                     onChange={(e) =>
//                       handleChange(
//                         'lowStockThreshold',
//                         parseInt(e.target.value) || 0,
//                       )
//                     }
//                     disabled={loading}
//                     inputProps={{ min: 0 }}
//                     helperText="Alert when stock reaches this level"
//                   />
//                 </Grid>
//               </Grid>
//             </Paper>

//             {/* Additional Info */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 // mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Additional Information
//               </Typography>

//               <Grid container spacing={2} sx={{ mt: 1 }}>
//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Warranty"
//                     variant="standard"
//                     value={formData.warranty}
//                     onChange={(e) => handleChange('warranty', e.target.value)}
//                     disabled={loading}
//                     placeholder="e.g., 24 months"
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12, md: 6 }}>
//                   <TextField
//                     fullWidth
//                     label="Lead Time (days)"
//                     variant="standard"
//                     type="number"
//                     value={formData.leadTime}
//                     onChange={(e) =>
//                       handleChange('leadTime', parseInt(e.target.value) || 0)
//                     }
//                     disabled={loading}
//                     inputProps={{ min: 0 }}
//                   />
//                 </Grid>

//                 <Grid size={{ xs: 12 }}>
//                   <TextField
//                     fullWidth
//                     label="Internal Notes"
//                     variant="standard"
//                     multiline
//                     rows={2}
//                     value={formData.notes}
//                     onChange={(e) => handleChange('notes', e.target.value)}
//                     disabled={loading}
//                     placeholder="Internal notes (not visible to customers)"
//                   />
//                 </Grid>
//               </Grid>
//             </Paper>
//           </Grid>

//           {/* Sidebar */}
//           <Grid size={{ xs: 12, md: 4 }}>
//             {/* Status */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Status
//               </Typography>

//               <Grid container spacing={2} sx={{ mt: 1 }}>
//                 <Grid size={{ xs: 12 }}>
//                   <TextField
//                     fullWidth
//                     select
//                     label="Active Status"
//                     variant="standard"
//                     value={formData.isActive ? 'active' : 'inactive'}
//                     onChange={(e) =>
//                       handleChange('isActive', e.target.value === 'active')
//                     }
//                     disabled={loading}
//                   >
//                     <MenuItem value="active">Active</MenuItem>
//                     <MenuItem value="inactive">Inactive</MenuItem>
//                   </TextField>
//                 </Grid>

//                 <Grid size={{ xs: 12 }}>
//                   <TextField
//                     fullWidth
//                     select
//                     label="Availability"
//                     variant="standard"
//                     value={formData.isAvailable ? 'available' : 'unavailable'}
//                     onChange={(e) =>
//                       handleChange(
//                         'isAvailable',
//                         e.target.value === 'available',
//                       )
//                     }
//                     disabled={loading}
//                   >
//                     <MenuItem value="available">Available</MenuItem>
//                     <MenuItem value="unavailable">Unavailable</MenuItem>
//                   </TextField>
//                 </Grid>
//               </Grid>
//             </Paper>

//             {/* Tags */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 mb: 3,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600} gutterBottom>
//                 Tags
//               </Typography>

//               <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   placeholder="Add tag"
//                   value={tagInput}
//                   onChange={(e) => setTagInput(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       addTag();
//                     }
//                   }}
//                   disabled={loading}
//                 />
//                 <Button onClick={addTag} disabled={loading}>
//                   Add
//                 </Button>
//               </Box>

//               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//                 {tags.map((tag, index) => (
//                   <Box
//                     key={index}
//                     sx={{
//                       bgcolor: '#e0e7ff',
//                       color: '#4338ca',
//                       px: 2,
//                       py: 0.5,
//                       borderRadius: 2,
//                       fontSize: '0.875rem',
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: 1,
//                     }}
//                   >
//                     {tag}
//                     <IconButton
//                       size="small"
//                       onClick={() => removeTag(tag)}
//                       disabled={loading}
//                       sx={{ p: 0.5 }}
//                     >
//                       <Delete fontSize="small" />
//                     </IconButton>
//                   </Box>
//                 ))}
//               </Box>
//             </Paper>

//             {/* Actions */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 2,
//                 borderRadius: 2,
//                 border: '1px solid',
//                 borderColor: 'divider',
//                 bgcolor: 'background.paper',
//               }}
//             >
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <Button
//                   fullWidth
//                   variant="outlined"
//                   onClick={() => router.back()}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   fullWidth
//                   type="submit"
//                   variant="contained"
//                   startIcon={<Save />}
//                   disabled={loading}
//                   sx={{
//                     bgcolor: '#0F172A',
//                     fontWeight: 600,
//                     '&:hover': { bgcolor: '#1e293b' },
//                   }}
//                 >
//                   {loading ? 'Saving...' : 'Save Changes'}
//                 </Button>
//               </Box>
//             </Paper>
//           </Grid>
//         </Grid>
//       </form>
//     </Box>
//   );
// }

'use client';

import { useState, useEffect, use } from 'react';
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
  CircularProgress,
  InputAdornment,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Inventory,
  Settings,
  AttachMoney,
  LocalShipping,
  Label,
  ToggleOn,
  FeaturedPlayList,
  Edit,
} from '@mui/icons-material';

import Grid from '@mui/material/GridLegacy';
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

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    isActive: true,
    isAvailable: true,
  });

  const [specifications, setSpecifications] = useState<Specification[]>([
    { label: '', value: '' },
  ]);
  const [features, setFeatures] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      setFetchLoading(true);
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch product');

      setFormData({
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        productCode: data.productCode || '',
        model: data.model || '',
        basePrice: data.basePrice || 0,
        minPrice: data.minPrice || 0,
        warranty: data.warranty || '',
        leadTime: data.leadTime || 0,
        stockQuantity: data.stockQuantity || 0,
        lowStockThreshold: data.lowStockThreshold || 0,
        notes: data.notes || '',
        isActive: data.isActive ?? true,
        isAvailable: data.isAvailable ?? true,
      });

      if (data.specifications?.length > 0)
        setSpecifications(data.specifications);
      if (data.features?.length > 0) setFeatures(data.features);
      if (data.tags?.length > 0) setTags(data.tags);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Specifications Logic ---
  const addSpecification = () =>
    setSpecifications([...specifications, { label: '', value: '' }]);
  const updateSpecification = (
    index: number,
    field: 'label' | 'value',
    value: string,
  ) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };
  const removeSpecification = (index: number) => {
    if (specifications.length > 1)
      setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // --- Features Logic ---
  const addFeature = () => setFeatures([...features, '']);
  const updateFeature = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };
  const removeFeature = (index: number) => {
    if (features.length > 1)
      setFeatures(features.filter((_, i) => i !== index));
  };

  // --- Tags Logic ---
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (
        !formData.name ||
        !formData.description ||
        !formData.category ||
        !formData.productCode
      ) {
        throw new Error(
          'Name, description, category, and product code are required',
        );
      }

      const validSpecs = specifications.filter(
        (spec) => spec.label.trim() !== '' && spec.value.trim() !== '',
      );
      if (validSpecs.length === 0)
        throw new Error('At least one specification is required');

      const payload = {
        ...formData,
        specifications: validSpecs,
        features: features.filter((f) => f.trim() !== ''),
        tags: tags,
      };

      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      setSuccess('Product updated successfully!');
      setTimeout(() => {
        router.push(`/products/${resolvedParams.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );

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
            sx={{ mb: 1, textTransform: 'none', color: 'text.secondary', p: 0 }}
          >
            Back to Product
          </Button>
          <Typography variant="h5" fontWeight={700} color="#0F172A">
            Edit Product
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update details for <strong>{formData.productCode}</strong>
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* LEFT COLUMN: Main Forms */}
          <Grid item xs={12} md={8}>
            {/* 1. Basic Info */}
            <FormCard>
              <SectionHeader>
                Core Details
                {/* <Edit fontSize="small" /> Core Details */}
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
                    disabled={true}
                    helperText="Unique identifier (Read-only)"
                    sx={{ bgcolor: '#F8FAFC', borderRadius: 1, px: 1 }}
                    InputProps={{ disableUnderline: true }}
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
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* 2. Specs */}
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
                  onClick={addSpecification}
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
                      placeholder="e.g. Input Voltage"
                      value={spec.label}
                      onChange={(e) =>
                        updateSpecification(index, 'label', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      variant="standard"
                      size="small"
                      placeholder="e.g. 24V DC"
                      value={spec.value}
                      onChange={(e) =>
                        updateSpecification(index, 'value', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => removeSpecification(index)}
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
                  onClick={addFeature}
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
                      onChange={(e) => updateFeature(index, e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => removeFeature(index)}
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

            {/* 4. Pricing & Logistics */}
            <FormCard>
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
                    label="Current Stock"
                    variant="standard"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      handleChange(
                        'stockQuantity',
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Low Stock Alert Level"
                    variant="standard"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      handleChange(
                        'lowStockThreshold',
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </Grid>
              </Grid>
            </FormCard>

            <FormCard sx={{ mb: 0 }}>
              <SectionHeader>
                Logistics
                {/* <LocalShipping fontSize="small" /> Logistics */}
              </SectionHeader>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Warranty Period"
                    variant="standard"
                    value={formData.warranty}
                    onChange={(e) => handleChange('warranty', e.target.value)}
                    placeholder="e.g. 12 Months"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
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
                    placeholder="Private notes regarding this product..."
                  />
                </Grid>
              </Grid>
            </FormCard>
          </Grid>

          {/* RIGHT COLUMN: Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Status Card */}
            <FormCard>
              <SectionHeader>
                Visibility
                {/* <ToggleOn fontSize="small" /> Visibility */}
              </SectionHeader>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  select
                  label="System Status"
                  variant="standard"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    handleChange('isActive', e.target.value === 'active')
                  }
                >
                  <MenuItem value="active">Active (Visible)</MenuItem>
                  <MenuItem value="inactive">Inactive (Hidden)</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Sales Availability"
                  variant="standard"
                  value={formData.isAvailable ? 'available' : 'unavailable'}
                  onChange={(e) =>
                    handleChange('isAvailable', e.target.value === 'available')
                  }
                >
                  <MenuItem value="available">In Stock / Orderable</MenuItem>
                  <MenuItem value="unavailable">Unavailable / Stopped</MenuItem>
                </TextField>
              </Stack>
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
                    e.key === 'Enter' && (e.preventDefault(), addTag())
                  }
                />
                <Button
                  variant="contained"
                  onClick={addTag}
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
                    onDelete={() => removeTag(tag)}
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
                top: 70,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                sx={{ color: '#fff' }}
              >
                Publish Changes
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
              >
                Updates will be reflected immediately across quotes and orders.
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
                  {loading ? 'Saving...' : 'Save Product'}
                </Button>
                <Button
                  fullWidth
                  onClick={() => router.back()}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: '#fff' },
                  }}
                >
                  Discard Changes
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
