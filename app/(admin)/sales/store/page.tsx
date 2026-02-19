// app/(admin)/sales/store/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  Menu,
  alpha,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Search as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";

import { useRouter } from "next/navigation";
import { StoreItemWithRelations } from "@/types/store";
import StoreTable from "@/components/store/store-table";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "INVERTER", label: "Inverter" },
  { value: "UPS", label: "UPS" },
  { value: "BATTERY", label: "Battery" },
  { value: "SOLAR_PANEL", label: "Solar Panel" },
  { value: "CHARGE_CONTROLLER", label: "Charge Controller" },
  { value: "SOLAR_GENERATOR", label: "Solar Generator" },
  { value: "ACCESSORY", label: "Accessory" },
  { value: "PACKAGE", label: "Package" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "", label: "All Conditions" },
  { value: "NEW", label: "New" },
  { value: "REFURBISHED", label: "Refurbished" },
  { value: "RETURNED", label: "Returned" },
  { value: "DAMAGED", label: "Damaged" },
];

export default function StorePage() {
  const router = useRouter();
  const [storeItems, setStoreItems] = useState<StoreItemWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    fetchStoreItems();
  }, [page, limit, category, condition]);

  const fetchStoreItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(condition && { condition }),
      });

      const res = await fetch(`/api/store?${params}`);
      const data = await res.json();
      setStoreItems(data.storeItems);
      setTotal(data?.pagination?.total);
    } catch (error) {
      console.error("Error fetching store items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchStoreItems();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Store
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: 14,
            }}
          >
            Manage finished products in the store
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            sx={{
              textTransform: "uppercase",
              bgcolor: "#0F172A",
              color: "#ffffff",
              fontWeight: "bold",
            }}
            onClick={() => router.push("/sales/store/new")}
          >
            Add Store Item
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
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, item number, or batch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#0F172A",
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
                "& .MuiInputLabel-root": {
                  color: "#475569",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#0F172A",
                },
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#0F172A",
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((option) => (
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
              label="Condition"
              size="small"
              value={condition}
              sx={{
                "& .MuiInputLabel-root": {
                  color: "#475569",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#0F172A",
                },
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#0F172A",
                    borderWidth: 1,
                  },
                },
              }}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              {CONDITIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Store Table */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading store items...
          </Typography>
        </Paper>
      ) : (
        <StoreTable
          storeItems={storeItems}
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
