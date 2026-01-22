// // src/app/dashboard/inventory/page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import { Box, Typography, Button, Paper, Tab, Tabs } from '@mui/material';
// import {
//   Add as AddIcon,
//   Inventory as InventoryIcon,
//   SwapHoriz as IssuanceIcon,
//   LocalShipping as GRNIcon,
// } from '@mui/icons-material';
// import Grid from '@mui/material/GridLegacy';
// import { useRouter } from 'next/navigation';

// import { InventoryStats as Stats } from '@/types/inventory';
// import LowStockAlert from '@/components/inventory/low-stock-alert';
// import InventoryStats from '@/components/inventory/inventory-stats';

// export default function InventoryDashboardClient() {
//   const router = useRouter();
//   const [stats, setStats] = useState<Stats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [tabValue, setTabValue] = useState(0);

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   const fetchStats = async () => {
//     try {
//       const res = await fetch('/api/inventory/stats');
//       const data = await res.json();
//       setStats(data);
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const quickActions = [
//     {
//       title: 'Add Material',
//       icon: InventoryIcon,
//       path: '/inventory/materials/new',
//       color: 'primary',
//     },
//     {
//       title: 'Issue Material',
//       icon: IssuanceIcon,
//       path: '/inventory/issuance/new',
//       color: 'secondary',
//     },
//     {
//       title: 'Create GRN',
//       icon: GRNIcon,
//       path: '/inventory/grn/new',
//       color: 'success',
//     },
//   ];

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
//           <Typography variant="h4" fontWeight={600}>
//             Inventory Management
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Track and manage your materials, stock levels, and suppliers
//           </Typography>
//         </Box>
//       </Box>

//       {/* Low Stock Alerts */}
//       {stats && stats.lowStockAlerts.length > 0 && (
//         <LowStockAlert alerts={stats.lowStockAlerts} />
//       )}

//       {/* Statistics */}
//       {stats && <InventoryStats stats={stats} loading={loading} />}

//       {/* Navigation Tabs */}
//       <Paper sx={{ mt: 3 }}>
//         <Tabs
//           value={tabValue}
//           onChange={(_, newValue) => setTabValue(newValue)}
//           variant="fullWidth"
//         >
//           <Tab
//             label="Materials"
//             onClick={() => router.push('/inventory/materials')}
//           />
//           <Tab
//             label="Suppliers"
//             onClick={() => router.push('/inventory/suppliers')}
//           />
//           <Tab
//             label="Issuances"
//             onClick={() => router.push('/inventory/issuance')}
//           />
//           <Tab label="GRN" onClick={() => router.push('/inventory/grn')} />
//         </Tabs>
//       </Paper>

//       {/* Quick Actions */}
//       <Paper sx={{ p: 3, mt: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Quick Actions
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           {quickActions.map((action) => {
//             const Icon = action.icon;
//             return (
//               <Grid item xs={12} sm={4} key={action.title}>
//                 <Button
//                   variant="outlined"
//                   fullWidth
//                   size="large"
//                   startIcon={<Icon />}
//                   onClick={() => router.push(action.path)}
//                   sx={{ py: 2 }}
//                 >
//                   {action.title}
//                 </Button>
//               </Grid>
//             );
//           })}
//         </Grid>
//       </Paper>

//       {/* Category Breakdown */}
//       {stats && stats?.categories?.length > 0 && (
//         <Paper sx={{ p: 3, mt: 3 }}>
//           <Typography variant="h6" gutterBottom>
//             Inventory by Category
//           </Typography>
//           <Box sx={{ mt: 2 }}>
//             {stats.categories.map((cat) => (
//               <Box
//                 key={cat.category}
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   py: 1.5,
//                   borderBottom: '1px solid',
//                   borderColor: 'divider',
//                   '&:last-child': { borderBottom: 'none' },
//                 }}
//               >
//                 <Typography variant="body1">
//                   {cat.category.replace(/_/g, ' ')}
//                 </Typography>
//                 <Box sx={{ textAlign: 'right' }}>
//                   <Typography variant="body2" fontWeight={600}>
//                     {cat.count} items
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {new Intl.NumberFormat('en-NG', {
//                       style: 'currency',
//                       currency: 'NGN',
//                       minimumFractionDigits: 0,
//                     }).format(cat.value)}
//                   </Typography>
//                 </Box>
//               </Box>
//             ))}
//           </Box>
//         </Paper>
//       )}
//     </Box>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Divider,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  SwapHoriz as IssuanceIcon,
  LocalShipping as GRNIcon,
} from '@mui/icons-material';
import HandymanIcon from '@mui/icons-material/Handyman';

// import Grid from '@mui/material/Unstable_Grid2'; // ← better responsive grid

import { Grid } from '@mui/material'; // ← this is now the new Grid v2

import { useRouter } from 'next/navigation';

import { InventoryStats as Stats } from '@/types/inventory';
import LowStockAlert from '@/components/inventory/low-stock-alert';
import InventoryStats from '@/components/inventory/inventory-stats';

const quickActions = [
  {
    title: 'Add Material',
    description: 'Create new raw material or item',
    icon: InventoryIcon,
    path: '/inventory/materials/new',
    color: '#1976d2',
    bgColor: '#e3f2fd',
  },
  {
    title: 'Issue Material',
    description: 'Record material issuance to production',
    icon: IssuanceIcon,
    path: '/inventory/issuance/new',
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  {
    title: 'Create GRN',
    description: 'Register goods received from supplier',
    icon: GRNIcon,
    path: '/inventory/grn/new',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
  },

  {
    title: 'Add Tool',
    description: 'Create new tool or work item',
    icon: HandymanIcon,
    path: '/inventory/tools/new',
    color: '#1976d2',
    bgColor: '#e3f2fd',
  },

  {
    title: 'Issue Tool',
    description: 'Record tool issuance to production',
    icon: IssuanceIcon,
    path: '/inventory/tools/lending/new',
    color: '#1976d2',
    bgColor: '#e3f2fd',
  },

  // {
  //   title: 'Receive Tool',
  //   description: 'Register return tools or work items',
  //   icon: InventoryIcon,
  //   path: '/inventory/materials/new',
  //   color: '#1976d2',
  //   bgColor: '#e3f2fd',
  // },
];

export default function InventoryDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/inventory/stats');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
    } catch {
      console.error('Failed to load inventory stats');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header + CTA */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h6" component="h1" fontWeight={700}>
            Inventory Dashboard
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
            }}
            variant="body1"
            color="text.secondary"
          >
            Manage materials, track stock levels and handle transactions
          </Typography>
        </Box>

        <Button
          variant="outlined"
          // startIcon={<AddIcon />}
          // size="small"
          sx={{
            textTransform: 'uppercase',
            borderColor: '#0F172A',
            color: '#0F172A',
            fontWeight: 'bold',
            fontSize: '14',
          }}
          onClick={() => router.push('/inventory/materials/new')}
          // sx={{ minWidth: 180 }}
        >
          ADD MATERIAL
        </Button>
      </Box>

      {/* Alerts */}
      {loading ? (
        <Skeleton
          variant="rectangular"
          height={120}
          sx={{ borderRadius: 2, mb: 3 }}
        />
      ) : (
        stats &&
        stats.lowStockAlerts.length > 0 && (
          <LowStockAlert alerts={stats.lowStockAlerts} />
        )
      )}

      {/* Key Statistics */}

      {stats && <InventoryStats stats={stats} loading={loading} />}

      {/* <Typography
        variant="h6"
        sx={{
          mt: 5,
          mb: 1,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Inventory Sections
      </Typography>

      <Paper
        elevation={0}
        sx={{
          mt: 1, // ← reduced from 4
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          //   indicatorColor="primary"
          //   textColor="primary"
          //   sx={{
          //     minHeight: 48, // ← the biggest space saver (was 64)
          //     '& .MuiTabs-indicator': {
          //       height: 3, // slightly thinner
          //       borderRadius: '3px 3px 0 0',
          //     },
          //     '& .MuiTab-root': {
          //       py: 1.5, // ← reduced from 3 (big impact)
          //       px: 2.5, // slightly tighter horizontally too
          //       minHeight: 48,
          //       fontSize: '0.95rem', // ← very subtle reduction
          //       fontWeight: 600,
          //       textTransform: 'none',
          //       color: 'text.primary',
          //       transition: 'all 0.2s ease',

          //       '&:hover': {
          //         bgcolor: 'action.hover',
          //         color: 'primary.main',
          //         cursor: 'pointer',
          //         '&::after': {
          //           content: '""',
          //           position: 'absolute',
          //           bottom: 0,
          //           left: '10%',
          //           right: '10%',
          //           height: 3,
          //           bgcolor: 'primary.main',
          //           opacity: 0.25,
          //         },
          //       },

          //       '&.Mui-selected': {
          //         color: 'primary.main',
          //         fontWeight: 700,
          //         bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          //       },

          //       '& .MuiTouchRipple-root': {
          //         color: 'primary.main',
          //       },
          //     },
          //   }}
        >
          <Tab
            label="Materials"
            sx={{
              fontSize: 13,
            }}
            onClick={() => router.push('/inventory/materials')}
          />
          <Tab
            sx={{
              fontSize: 13,
            }}
            label="Suppliers"
            onClick={() => router.push('/inventory/suppliers')}
          />
          <Tab
            sx={{
              fontSize: 13,
            }}
            label="Issuances"
            onClick={() => router.push('/inventory/issuance')}
          />
          <Tab
            sx={{
              fontSize: 13,
            }}
            label="GRN"
            onClick={() => router.push('/inventory/grn')}
          />
        </Tabs>
      </Paper> */}

      {/* Quick Actions - Card style */}
      <Typography
        variant="h6"
        sx={{ mt: 5, mb: 2, fontWeight: 600, fontSize: 15 }}
      >
        Quick Actions
      </Typography>

      <Grid container spacing={2.5}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          const color = action.color as 'primary' | 'secondary' | 'success';

          return (
            <Grid
              size={{ xs: 12, sm: 6, md: 4 }} // ← this is the key change
              key={action.title}
            >
              {' '}
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: 'none',
                  transition: 'all 0.22s',
                  '&:hover': {
                    borderColor: `${color}.main`,
                    backgroundColor: '#D4F1F9',
                    // transform: 'translateY(-4px)',
                    // boxShadow: (theme) =>
                    //   `0 0px 0px 0px ${alpha(theme.palette[color].main, 0.18)}`,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(action.path)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 3,
                    textAlign: 'left',
                  }}
                >
                  <Box
                    // sx={{ color: `${color}.main`, mb: 1 }}
                    sx={{
                      backgroundColor: action.bgColor,
                      borderRadius: 2,
                      p: 1,
                      mb: 1,
                      color: action.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon fontSize="large" />
                  </Box>

                  {/* <Box
                    sx={{
                      backgroundColor: stat.bgColor,
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ color: stat.color, fontSize: 16 }} />
                  </Box> */}

                  <CardContent sx={{ p: 0, pt: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 15,
                      }}
                      variant="h6"
                      component="div"
                      gutterBottom
                    >
                      {action.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                      }}
                      variant="body2"
                      color="text.secondary"
                    >
                      {action.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* {loading ? (
        <Box sx={{ mt: 5 }}>
          <Skeleton variant="text" width="40%" height={40} />
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={64}
              sx={{ mt: 1.5, borderRadius: 1 }}
            />
          ))}
        </Box>
      ) : stats?.categories?.length ? (
        <>
          <Divider sx={{ my: 3, mt: 4 }} />

          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, fontSize: 15 }}
          >
            Inventory by Category
          </Typography>

          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: 'hidden' }}
          >
            {stats.categories.map((cat, index) => (
              <Box
                key={cat.category}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2.5,
                  bgcolor: index % 2 ? 'action.hover' : 'background.paper',
                  borderBottom:
                    index < stats.categories.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    sx={{
                      fontSize: 12,
                    }}
                    label={cat.category.replace(/_/g, ' ')}
                    size="small"
                    color={
                      index % 3 === 0
                        ? 'primary'
                        : index % 3 === 1
                        ? 'secondary'
                        : 'default'
                    }
                  />
                </Box>

                <Box textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {cat.count} items
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 0,
                    }).format(cat.value)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </>
      ) : null} */}
    </Box>
  );
}
