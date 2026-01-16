// src/components/inventory/InventoryStats.tsx

'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  LocalShipping as SupplierIcon,
  SwapHoriz as IssuanceIcon,
} from '@mui/icons-material';
import { InventoryStats as Stats } from '@/types/inventory';

interface InventoryStatsProps {
  stats: Stats;
  loading?: boolean;
}

export default function InventoryStats({
  stats,
  loading,
}: InventoryStatsProps) {
  const statCards = [
    {
      title: 'Total Materials',
      value: stats.totalMaterials,
      icon: InventoryIcon,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Total Inventory',
      value: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(stats.totalValue),
      icon: MoneyIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Low Stock',
      value: stats.lowStockItems,
      icon: WarningIcon,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      alert: stats.lowStockItems > 0,
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockItems,
      icon: ErrorIcon,
      color: '#d32f2f',
      bgColor: '#ffebee',
      alert: stats.outOfStockItems > 0,
    },
    {
      title: 'Active Suppliers',
      value: stats.totalSuppliers,
      icon: SupplierIcon,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Issuances',
      value: stats.recentIssuances,
      icon: IssuanceIcon,
      color: '#0288d1',
      bgColor: '#e1f5fe',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
            <Card
              sx={{
                borderRadius: 1,
                height: '85%',
                boxShadow: ` 0 0 0 1px ${stat.color}33`,
                position: 'relative',
                overflow: 'visible',
                ...(stat.alert && {
                  boxShadow: `0 0 0 1px ${stat.color}`,
                }),
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'items-start',
                    gap: '8px',
                    mb: 2,
                  }}
                >
                  <Box
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
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                    variant="body2"
                    color="text.secondary"
                  >
                    {stat.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    fontSize: 18,
                  }}
                  color={stat.alert ? stat.color : 'text.primary'}
                  gutterBottom
                >
                  {stat.value}
                </Typography>
                {/* <Typography
                  sx={{
                    fontSize: 12,
                  }}
                  variant="body2"
                  color="text.secondary"
                >
                  {stat.title}
                </Typography> */}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
