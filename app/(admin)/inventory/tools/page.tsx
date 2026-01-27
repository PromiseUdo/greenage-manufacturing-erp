// // src/app/dashboard/inventory/tools/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   TextField,
//   MenuItem,
//   InputAdornment,
//   Paper,
//   CircularProgress,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
// import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
// import { useRouter } from 'next/navigation';
// import GroupedToolsTable from '@/components/inventory/grouped-tools-table';

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

// interface Tool {
//   id: string;
//   toolId: string;
//   name: string;
//   category: string;
//   status: string;
//   condition: string;
//   currentHolder?: string;
//   location?: string;
//   manufacturer?: string;
//   toolGroupId?: string;
// }

// interface ToolGroup {
//   id: string;
//   name: string;
//   groupNumber: string;
//   category: string;
//   totalQuantity: number;
//   availableQuantity: number;
//   manufacturer?: string;
//   tools: Tool[];
// }

// export default function ToolsPage() {
//   const router = useRouter();
//   const [toolGroups, setToolGroups] = useState<ToolGroup[]>([]);
//   const [standaloneTools, setStandaloneTools] = useState<Tool[]>([]);
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

//       console.log('====================================');
//       console.log(data);
//       console.log('====================================');

//       setToolGroups(data?.toolGroups || []);
//       setStandaloneTools(data?.standaloneTools || []);
//       setTotal(data?.pagination?.total || 0);
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

//   const handleSearchKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       handleSearch();
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
//           <Typography
//             variant="body1"
//             color="text.secondary"
//             sx={{ fontSize: 14 }}
//           >
//             Manage returnable tools and equipment
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5 }}>
//           <Button
//             variant="contained"
//             sx={{
//               textTransform: 'uppercase',
//               bgcolor: '#0F172A',
//               color: '#ffffff',
//               fontWeight: 'bold',
//               fontSize: 14,
//             }}
//             onClick={() => router.push('/inventory/tools/new')}
//           >
//             Add Tool
//           </Button>
//         </Box>
//       </Box>

//       {/* Filters */}
//       <Paper
//         elevation={0}
//         sx={{
//           p: 2,
//           mb: 3,
//           borderRadius: 2,
//           border: '1px solid',
//           borderColor: 'divider',
//           bgcolor: 'background.paper',
//         }}
//       >
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={4}>
//             <TextField
//               fullWidth
//               size="small"
//               placeholder="Search by name, tool number, or serial"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               onKeyPress={handleSearchKeyPress}
//               sx={{
//                 '& .MuiOutlinedInput-root': {
//                   '&.Mui-focused fieldset': {
//                     borderColor: '#0F172A',
//                     borderWidth: 1,
//                   },
//                 },
//               }}
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
//               size="small"
//               value={category}
//               sx={{
//                 '& .MuiInputLabel-root': {
//                   color: '#475569',
//                 },
//                 '& .MuiInputLabel-root.Mui-focused': {
//                   color: '#0F172A',
//                 },
//                 '& .MuiOutlinedInput-root': {
//                   '&.Mui-focused fieldset': {
//                     borderColor: '#0F172A',
//                     borderWidth: 1,
//                   },
//                 },
//               }}
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
//               size="small"
//               value={status}
//               sx={{
//                 '& .MuiInputLabel-root': {
//                   color: '#475569',
//                 },
//                 '& .MuiInputLabel-root.Mui-focused': {
//                   color: '#0F172A',
//                 },
//                 '& .MuiOutlinedInput-root': {
//                   '&.Mui-focused fieldset': {
//                     borderColor: '#0F172A',
//                     borderWidth: 1,
//                   },
//                 },
//               }}
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
//       </Paper>

//       {/* Tools Table */}
//       {loading ? (
//         <Paper
//           elevation={0}
//           sx={{
//             p: 6,
//             textAlign: 'center',
//             border: '1px solid',
//             borderColor: 'divider',
//             borderRadius: 2,
//           }}
//         >
//           <CircularProgress />
//           <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
//             Loading tools...
//           </Typography>
//         </Paper>
//       ) : (
//         <GroupedToolsTable
//           toolGroups={toolGroups}
//           standaloneTools={standaloneTools}
//           total={total}
//           page={page}
//           limit={limit}
//           onPageChange={setPage}
//           onLimitChange={setLimit}
//         />
//       )}
//     </Box>
//   );
// }

// src/app/dashboard/inventory/tools/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import GroupedToolsTable from '@/components/inventory/grouped-tools-table';

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

export default function ToolsPage() {
  const router = useRouter();
  const [toolGroups, setToolGroups] = useState<ToolGroup[]>([]);
  const [standaloneTools, setStandaloneTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchTools = useCallback(async () => {
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

      console.log('====================================');
      console.log(data);
      console.log('====================================');

      setToolGroups(data?.toolGroups || []);
      setStandaloneTools(data?.standaloneTools || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, status]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools, refreshTrigger]);

  const handleSearch = () => {
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
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
        <GroupedToolsTable
          toolGroups={toolGroups}
          standaloneTools={standaloneTools}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  );
}
