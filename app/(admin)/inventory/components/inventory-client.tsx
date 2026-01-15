// src/app/dashboard/inventory/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Tab, Tabs } from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  SwapHoriz as IssuanceIcon,
  LocalShipping as GRNIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/GridLegacy';
import { useRouter } from 'next/navigation';

import { InventoryStats as Stats } from '@/types/inventory';
import LowStockAlert from '@/components/inventory/low-stock-alert';
import InventoryStats from '@/components/inventory/inventory-stats';

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
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Material',
      icon: InventoryIcon,
      path: '/inventory/materials/new',
      color: 'primary',
    },
    {
      title: 'Issue Material',
      icon: IssuanceIcon,
      path: '/inventory/issuance/new',
      color: 'secondary',
    },
    {
      title: 'Create GRN',
      icon: GRNIcon,
      path: '/inventory/grn/new',
      color: 'success',
    },
  ];

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
          <Typography variant="h4" fontWeight={600}>
            Inventory Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your materials, stock levels, and suppliers
          </Typography>
        </Box>
      </Box>

      {/* Low Stock Alerts */}
      {stats && stats.lowStockAlerts.length > 0 && (
        <LowStockAlert alerts={stats.lowStockAlerts} />
      )}

      {/* Statistics */}
      {stats && <InventoryStats stats={stats} loading={loading} />}

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Grid item xs={12} sm={4} key={action.title}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<Icon />}
                  onClick={() => router.push(action.path)}
                  sx={{ py: 2 }}
                >
                  {action.title}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Category Breakdown */}
      {stats && stats?.categories?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Inventory by Category
          </Typography>
          <Box sx={{ mt: 2 }}>
            {stats.categories.map((cat) => (
              <Box
                key={cat.category}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Typography variant="body1">
                  {cat.category.replace(/_/g, ' ')}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {cat.count} items
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 0,
                    }).format(cat.value)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab
            label="Materials"
            onClick={() => router.push('/inventory/materials')}
          />
          <Tab
            label="Suppliers"
            onClick={() => router.push('/inventory/suppliers')}
          />
          <Tab
            label="Issuances"
            onClick={() => router.push('/inventory/issuance')}
          />
          <Tab label="GRN" onClick={() => router.push('/inventory/grn')} />
        </Tabs>
      </Paper>
    </Box>
  );
}
