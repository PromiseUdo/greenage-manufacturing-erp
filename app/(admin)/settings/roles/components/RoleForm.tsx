"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";

export const AVAILABLE_PERMISSIONS = [
  {
    module: "Users & Employees",
    permissions: [
      { value: "users:read", label: "View Users/Employees" },
      { value: "users:write", label: "Create/Edit Users" },
      { value: "users:delete", label: "Delete Users" },
    ],
  },
  {
    module: "Roles & Permissions",
    permissions: [
      { value: "roles:read", label: "View Roles" },
      { value: "roles:write", label: "Manage Roles" },
    ],
  },
  {
    module: "Products",
    permissions: [
      { value: "products:read", label: "View Products" },
      { value: "products:write", label: "Manage Products" },
      { value: "products:delete", label: "Delete Products" },
    ],
  },
  {
    module: "Production Orders",
    permissions: [
      { value: "production_orders:read", label: "View Production Orders" },
      { value: "production_orders:write", label: "Manage Production Orders" },
      { value: "production_orders:delete", label: "Delete Production Orders" },
    ],
  },
  {
    module: "Inventory & Store",
    permissions: [
      { value: "inventory:read", label: "View Inventory" },
      { value: "inventory:write", label: "Manage Inventory" },
    ],
  },
  {
    module: "Sales (Quotes & Invoices)",
    permissions: [
      { value: "sales:read", label: "View Sales Documents" },
      { value: "sales:write", label: "Manage Sales Documents" },
      { value: "sales:delete", label: "Delete Sales Orders" },
    ],
  },
];

interface RoleFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    permissions: string[];
  };
}

export default function RoleForm({ initialData }: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    permissions: initialData?.permissions || [],
  });

  const isEdit = !!initialData?.id;

  const handlePermissionToggle = (value: string) => {
    setFormData((prev) => {
      const isSelected = prev.permissions.includes(value);
      if (isSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => p !== value),
        };
      } else {
        return { ...prev, permissions: [...prev.permissions, value] };
      }
    });
  };

  const handleSelectAllModule = (modulePermissions: string[]) => {
    setFormData((prev) => {
      const allSelected = modulePermissions.every((p) =>
        prev.permissions.includes(p),
      );
      if (allSelected) {
        // Deselect all
        const newPermissions = prev.permissions.filter(
          (p) => !modulePermissions.includes(p),
        );
        return { ...prev, permissions: newPermissions };
      } else {
        // Select all
        const newPermissions = Array.from(
          new Set([...prev.permissions, ...modulePermissions]),
        );
        return { ...prev, permissions: newPermissions };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Role Name is required");
      return;
    }
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/settings/roles/${initialData.id}`
        : "/api/settings/roles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/settings/roles");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save role");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0" }}
      >
        <Typography variant="h6" fontWeight="bold" mb={3}>
          {isEdit ? "Edit Role Details" : "New Role Details"}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0" }}
      >
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Select the specific actions users with this role can perform.
        </Typography>

        <Grid container spacing={4}>
          {AVAILABLE_PERMISSIONS.map((mod) => {
            const modPermValues = mod.permissions.map((p) => p.value);
            const allSelected = modPermValues.every((val) =>
              formData.permissions.includes(val),
            );
            const someSelected =
              modPermValues.some((val) => formData.permissions.includes(val)) &&
              !allSelected;

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={mod.module}>
                <Box
                  sx={{
                    border: "1px solid #f1f5f9",
                    borderRadius: "8px",
                    p: 2,
                    bgcolor: "#fafafa",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={() => handleSelectAllModule(modPermValues)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={600}>{mod.module}</Typography>
                    }
                  />
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", flexDirection: "column", pl: 3 }}>
                    {mod.permissions.map((perm) => (
                      <FormControlLabel
                        key={perm.value}
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(perm.value)}
                            onChange={() => handlePermissionToggle(perm.value)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">{perm.label}</Typography>
                        }
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={loading}
          sx={{ borderRadius: "8px" }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: "8px", px: 4 }}
        >
          {isEdit ? "Save Changes" : "Create Role"}
        </Button>
      </Box>
    </Box>
  );
}
