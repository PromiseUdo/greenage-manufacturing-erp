"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  BusinessCenter as BusinessCenterIcon,
  Inventory2 as InventoryIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as SourcingIcon,
} from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import { useRouter } from "next/navigation";
import SupplierFormDialog from "../components/SupplierFormDialog";
import { SupplierFormData } from "@/types/inventory";
import SupplierMaterials from "./components/SupplierMaterials";
import SupplierGRNs from "./components/SupplierGRNs";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SupplierDetailsPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = use(params);
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  useEffect(() => {
    fetchSupplierDetails();
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Failed to fetch supplier");
      const data = await res.json();
      setSupplier(data);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditSupplier = async (data: SupplierFormData) => {
    try {
      const res = await fetch(`/api/inventory/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update supplier");

      const updatedSupplier = await res.json();
      setSupplier((prev: any) => ({ ...prev, ...updatedSupplier }));
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Error updating supplier:", error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!supplier) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Supplier not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          Back to Suppliers
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            {/* <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 2,
              }}
            >
              <BusinessCenterIcon fontSize="large" />
            </Box> */}
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                {supplier.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PhoneIcon fontSize="small" sx={{ fontSize: 18 }} />
                  {supplier.phone}
                </Typography>
                {supplier.email && (
                  <Typography
                    variant="body1"
                    color="primary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <EmailIcon fontSize="small" sx={{ fontSize: 18 }} />
                    {supplier.email}
                  </Typography>
                )}
                {!supplier.isActive && (
                  <Chip
                    label="Inactive"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<SourcingIcon />}
              onClick={() =>
                router.push(`/inventory/suppliers/${supplierId}/sourcing`)
              }
              disableElevation
              sx={{
                bgcolor: "#0F172A",
                fontWeight: 600,
                "&:hover": { bgcolor: "#1E293B" },
              }}
            >
              Material Sourcing
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setOpenEditDialog(true)}
              sx={{
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "divider",
                },
              }}
            >
              Edit Profile
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Total Materials
            </Typography>
            <InventoryIcon sx={{ color: "primary.main", opacity: 0.8 }} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {supplier._count?.materials || 0}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Total GRNs
            </Typography>
            <ReceiptIcon sx={{ color: "secondary.main", opacity: 0.8 }} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {supplier._count?.grns || 0}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Contact Person
            </Typography>
            <PersonIcon sx={{ color: "text.secondary", opacity: 0.8 }} />
          </Box>
          <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
            {supplier.contactPerson || "—"}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Location
            </Typography>
            <LocationOnIcon sx={{ color: "text.secondary", opacity: 0.8 }} />
          </Box>
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {supplier.address || "—"}
          </Typography>
        </Paper>
      </Box>

      {/* Tabs & Content */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Materials Supplied" />
            <Tab label="Goods Received Notes (GRN)" />
          </Tabs>
        </Box>

        <Box sx={{ p: 0 }}>
          <CustomTabPanel value={tabValue} index={0}>
            <SupplierMaterials supplierId={supplierId} />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
            <SupplierGRNs supplierId={supplierId} />
          </CustomTabPanel>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <SupplierFormDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onSave={handleEditSupplier}
        supplier={supplier}
      />
    </Box>
  );
}
