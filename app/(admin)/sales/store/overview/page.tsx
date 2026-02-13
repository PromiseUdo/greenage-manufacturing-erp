"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Storefront as StoreIcon,
  Add as AddIcon,
  LocalShipping as DispatchIcon,
  Receipt as ReceiptIcon,
  Inventory as StockIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import StoreStats, { StoreStatsData } from "@/components/store/store-stats";

const quickActions = [
  {
    title: "New Receipt",
    description: "Receive finished goods into store",
    icon: ReceiptIcon,
    path: "/sales/store/receipts/new",
    color: "#9c27b0",
    bgColor: "#f3e5f5",
  },
  {
    title: "New Dispatch",
    description: "Dispatch items to customers",
    icon: DispatchIcon,
    path: "/sales/store/dispatches/new",
    color: "#2e7d32",
    bgColor: "#e8f5e9",
  },
  {
    title: "View Stock",
    description: "Browse current inventory levels",
    icon: StockIcon,
    path: "/sales/store",
    color: "#1976d2",
    bgColor: "#e3f2fd",
  },
];

export default function StoreOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StoreStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/sales/store/stats");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
    } catch {
      console.error("Failed to load store stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h6" component="h1" fontWeight={700}>
            Store Overview
          </Typography>
          <Typography
            sx={{ fontSize: 14 }}
            variant="body1"
            color="text.secondary"
          >
            Manage finished goods, track disposals, and handle store operations
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/sales/store/receipts/new")}
            sx={{
              textTransform: "uppercase",
              borderColor: "#0F172A",
              color: "#0F172A",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            New Receipt
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push("/sales/store/dispatches/new")}
            sx={{
              textTransform: "uppercase",
              bgcolor: "#0F172A",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "13px",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            New Dispatch
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {loading ? (
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 2, mb: 3 }}
        />
      ) : (
        stats && <StoreStats stats={stats} />
      )}

      {/* Quick Actions */}
      <Typography
        variant="h6"
        sx={{ mt: 5, mb: 2, fontWeight: 600, fontSize: 15 }}
      >
        Quick Actions
      </Typography>

      <Grid container spacing={2.5}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={action.title}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  boxShadow: "none",
                  transition: "all 0.22s",
                  "&:hover": {
                    borderColor: `${action.color}`,
                    backgroundColor: "#f8fafc",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(action.path)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    p: 3,
                    textAlign: "left",
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: action.bgColor,
                      borderRadius: 2,
                      p: 1.5,
                      mb: 2,
                      color: action.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon fontSize="medium" />
                  </Box>

                  <CardContent sx={{ p: 0 }}>
                    <Typography
                      variant="h6"
                      component="div"
                      gutterBottom
                      sx={{ fontSize: 16, fontWeight: 600 }}
                    >
                      {action.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 14 }}
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
    </Box>
  );
}
