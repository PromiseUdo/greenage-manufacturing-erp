"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Inventory as ItemIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  LocalShipping as DispatchIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";

export interface StoreStatsData {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentReceipts: any[];
  recentDispatches: any[];
}

interface StoreStatsProps {
  stats: StoreStatsData;
  loading?: boolean;
}

export default function StoreStats({ stats, loading }: StoreStatsProps) {
  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: ItemIcon,
      color: "#1976d2",
      bgColor: "#e3f2fd",
    },
    {
      title: "Total Value",
      value: new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(stats.totalValue),
      icon: MoneyIcon,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: WarningIcon,
      color: "#ed6c02",
      bgColor: "#fff3e0",
      alert: stats.lowStockCount > 0,
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount,
      icon: ErrorIcon,
      color: "#d32f2f",
      bgColor: "#ffebee",
      alert: stats.outOfStockCount > 0,
    },
    {
      title: "Recent Receipts",
      value: stats.recentReceipts.length,
      icon: ReceiptIcon,
      color: "#9c27b0",
      bgColor: "#f3e5f5",
    },
    {
      title: "Recent Dispatches",
      value: stats.recentDispatches.length,
      icon: DispatchIcon,
      color: "#0288d1",
      bgColor: "#e1f5fe",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: "100%", mb: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={4} lg={4} key={stat.title}>
            <Card
              // elevation={0}
              // sx={{
              //   borderRadius: 2,
              //   height: "100%",
              //   border: "1px solid",
              //   borderColor: stat.alert ? stat.color : "divider",
              //   position: "relative",
              //   overflow: "hidden",
              //   transition: "all 0.2s",
              //   "&:hover": {
              //     borderColor: stat.color,
              //     boxShadow: `0 4px 12px ${stat.color}15`,
              //   },
              // }}'
              sx={{
                borderRadius: 2,
                height: "85%",
                boxShadow: ` 0 0 0 1px ${stat.color}33`,
                position: "relative",

                overflow: "visible",
                ...(stat.alert && {
                  boxShadow: `0 0 0 1px ${stat.color}`,
                }),
                "&:hover": {
                  borderColor: stat.color,
                  // boxShadow: `0 4px 12px ${stat.color}15`,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: stat.bgColor,
                      borderRadius: 2,
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon sx={{ color: stat.color, fontSize: 20 }} />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {stat.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={stat.alert ? stat.color : "text.primary"}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
