// // src/app/dashboard/inventory/tools/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Chip,
//   IconButton,
//   Tooltip,
//   TextField,
//   MenuItem,
//   InputAdornment,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';

// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Visibility as ViewIcon,
//   Search as SearchIcon,
//   Refresh as RefreshIcon,
// } from '@mui/icons-material';
// import { useRouter } from 'next/navigation';
// import { ToolWithLendings } from '@/types/tools';

// const TOOL_CATEGORIES = [
//   { value: '', label: 'All Categories' },
//   { value: 'HAND_TOOL', label: 'Hand Tool' },
//   { value: 'POWER_TOOL', label: 'Power Tool' },
//   { value: 'MEASURING_TOOL', label: 'Measuring Tool' },
//   { value: 'TESTING_EQUIPMENT', label: 'Testing Equipment' },
//   { value: 'SAFETY_EQUIPMENT', label: 'Safety Equipment' },
//   { value: 'WORKSTATION', label: 'Workstation' },
//   { value: 'LIFTING_EQUIPMENT', label: 'Lifting Equipment' },
//   { value: 'OTHER', label: 'Other' },
// ];

// const TOOL_STATUSES = [
//   { value: '', label: 'All Statuses' },
//   { value: 'AVAILABLE', label: 'Available' },
//   { value: 'IN_USE', label: 'In Use' },
//   { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
//   { value: 'RESERVED', label: 'Reserved' },
//   { value: 'DAMAGED', label: 'Damaged' },
// ];

// export default function ToolsPage() {
//   const router = useRouter();
//   const [tools, setTools] = useState<ToolWithLendings[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [category, setCategory] = useState('');
//   const [status, setStatus] = useState('');

//   useEffect(() => {
//     fetchTools();
//   }, [page, limit, category, status]);

//   const fetchTools = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//         ...(search && { search }),
//         ...(category && { category }),
//         ...(status && { status }),
//       });

//       const res = await fetch(`/api/inventory/tools?${params}`);
//       const data = await res.json();
//       setTools(data?.tools);
//       setTotal(data?.pagination?.total);
//     } catch (error) {
//       console.error('Error fetching tools:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     setPage(1);
//     fetchTools();
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'AVAILABLE':
//         return 'success';
//       case 'IN_USE':
//         return 'warning';
//       case 'UNDER_MAINTENANCE':
//         return 'info';
//       case 'RESERVED':
//         return 'secondary';
//       case 'DAMAGED':
//         return 'error';
//       default:
//         return 'default';
//     }
//   };

//   const getConditionColor = (condition: string) => {
//     switch (condition) {
//       case 'EXCELLENT':
//         return 'success';
//       case 'GOOD':
//         return 'success';
//       case 'FAIR':
//         return 'warning';
//       case 'POOR':
//         return 'error';
//       case 'NEEDS_REPAIR':
//         return 'error';
//       default:
//         return 'default';
//     }
//   };

//   return (
//     <Box>
//       {/* Header */}
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           mb: 3,
//         }}
//       >
//         <Box>
//           <Typography variant="h6" fontWeight={600}>
//             Tools & Equipment
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Manage returnable tools and equipment
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 2 }}>
//           {/* <Button
//             variant="outlined"
//             startIcon={<RefreshIcon />}
//             onClick={fetchTools}
//           >
//             Refresh
//           </Button> */}
//           <Button
//             variant="contained"
//             sx={{
//               textTransform: 'uppercase',
//               bgcolor: '#0F172A',
//               color: '#ffffff',
//               fontWeight: 'bold',
//               // fontSize: '14',
//             }}
//             // startIcon={<AddIcon />}
//             onClick={() => router.push('/inventory/tools/new')}
//           >
//             Add Tool
//           </Button>
//         </Box>
//       </Box>

//       {/* Filters */}
//       <Box sx={{ mb: 3 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={4}>
//             <TextField
//               fullWidth
//               placeholder="Search by name, tool number, or serial"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <TextField
//               fullWidth
//               select
//               label="Category"
//               value={category}
//               onChange={(e) => {
//                 setCategory(e.target.value);
//                 setPage(1);
//               }}
//             >
//               {TOOL_CATEGORIES.map((option) => (
//                 <MenuItem key={option.value} value={option.value}>
//                   {option.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <TextField
//               fullWidth
//               select
//               label="Status"
//               value={status}
//               onChange={(e) => {
//                 setStatus(e.target.value);
//                 setPage(1);
//               }}
//             >
//               {TOOL_STATUSES.map((option) => (
//                 <MenuItem key={option.value} value={option.value}>
//                   {option.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>
//         </Grid>
//       </Box>

//       {/* Tools Table */}
//       <Paper>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>
//                   <strong>Tool Number</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Name</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Category</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Status</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Condition</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Current Holder</strong>
//                 </TableCell>
//                 <TableCell>
//                   <strong>Location</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Actions</strong>
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {tools.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body1" color="text.secondary">
//                       No tools found
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{ mt: 1 }}
//                     >
//                       Add your first tool to get started
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 tools.map((tool) => (
//                   <TableRow key={tool.id} hover>
//                     <TableCell>
//                       <Chip
//                         label={tool.toolNumber}
//                         size="small"
//                         variant="outlined"
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" fontWeight={500}>
//                         {tool.name}
//                       </Typography>
//                       {tool.manufacturer && (
//                         <Typography variant="caption" color="text.secondary">
//                           {tool.manufacturer}
//                         </Typography>
//                       )}
//                     </TableCell>
//                     <TableCell>{tool.category.replace(/_/g, ' ')}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={tool.status.replace(/_/g, ' ')}
//                         color={getStatusColor(tool.status) as any}
//                         size="small"
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={tool.condition.replace(/_/g, ' ')}
//                         color={getConditionColor(tool.condition) as any}
//                         size="small"
//                         variant="outlined"
//                       />
//                     </TableCell>
//                     <TableCell>{tool.currentHolder || '-'}</TableCell>
//                     <TableCell>{tool.location || '-'}</TableCell>
//                     <TableCell align="center">
//                       <Tooltip title="View Details">
//                         <IconButton
//                           size="small"
//                           onClick={() =>
//                             router.push(`/inventory/tools/${tool.id}`)
//                           }
//                         >
//                           <ViewIcon fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                       <Tooltip title="Edit">
//                         <IconButton
//                           size="small"
//                           onClick={() =>
//                             router.push(`/inventory/tools/${tool.id}/edit`)
//                           }
//                         >
//                           <EditIcon fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination
//           rowsPerPageOptions={[10, 20, 50, 100]}
//           component="div"
//           count={total}
//           rowsPerPage={limit}
//           page={page - 1}
//           onPageChange={(_, newPage) => setPage(newPage + 1)}
//           onRowsPerPageChange={(e) => {
//             setLimit(parseInt(e.target.value));
//             setPage(1);
//           }}
//         />
//       </Paper>
//     </Box>
//   );
// }

// src/app/dashboard/inventory/tools/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  CircularProgress,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ToolWithLendings } from '@/types/tools';
import ToolsTable from '@/components/inventory/tools-table';

const TOOL_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'HAND_TOOL', label: 'Hand Tool' },
  { value: 'POWER_TOOL', label: 'Power Tool' },
  { value: 'MEASURING_TOOL', label: 'Measuring Tool' },
  { value: 'TESTING_EQUIPMENT', label: 'Testing Equipment' },
  { value: 'SAFETY_EQUIPMENT', label: 'Safety Equipment' },
  { value: 'WORKSTATION', label: 'Workstation' },
  { value: 'LIFTING_EQUIPMENT', label: 'Lifting Equipment' },
  { value: 'OTHER', label: 'Other' },
];

const TOOL_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'DAMAGED', label: 'Damaged' },
];

export default function ToolsPage() {
  const router = useRouter();
  const [tools, setTools] = useState<ToolWithLendings[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchTools();
  }, [page, limit, category, status]);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status }),
      });

      const res = await fetch(`/api/inventory/tools?${params}`);
      const data = await res.json();
      setTools(data?.tools || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTools();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
          <Typography variant="h6" fontWeight={600}>
            Tools & Equipment
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            Manage returnable tools and equipment
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            sx={{
              textTransform: 'uppercase',
              bgcolor: '#0F172A',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 14,
            }}
            onClick={() => router.push('/inventory/tools/new')}
          >
            Add Tool
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, tool number, or serial"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Category"
              size="small"
              value={category}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#475569',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {TOOL_CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              size="small"
              value={status}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#475569',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#0F172A',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F172A',
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {TOOL_STATUSES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tools Table */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading tools...
          </Typography>
        </Paper>
      ) : (
        <ToolsTable
          tools={tools}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}
    </Box>
  );
}
