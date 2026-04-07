'use client';

import { useState } from 'react';
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
  Chip,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  People,
  Security,
  Inventory2,
  PrecisionManufacturing,
  ShoppingCart,
  Storefront,
  LocalShipping,
  BarChart,
  Build,
  Group,
  Receipt,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// ─── Permission data ──────────────────────────────────────────────────────────

export const AVAILABLE_PERMISSIONS = [
  {
    module: 'Users & Employees',
    permissions: [
      { value: 'users:read', label: 'View Users/Employees' },
      { value: 'users:write', label: 'Create/Edit Users' },
      { value: 'users:delete', label: 'Delete Users' },
    ],
  },
  {
    module: 'Roles & Permissions',
    permissions: [
      { value: 'roles:read', label: 'View Roles' },
      { value: 'roles:write', label: 'Manage Roles' },
    ],
  },
  {
    module: 'Products',
    permissions: [
      { value: 'products:read', label: 'View Products' },
      { value: 'products:write', label: 'Manage Products' },
      { value: 'products:delete', label: 'Delete Products' },
    ],
  },
  {
    module: 'Production Orders',
    permissions: [
      { value: 'production_orders:read', label: 'View Production Orders' },
      { value: 'production_orders:create', label: 'Create Production Orders' },
      { value: 'production_orders:update', label: 'Edit Production Orders' },
      { value: 'production_orders:delete', label: 'Delete Production Orders' },
    ],
  },
  {
    module: 'Production Activities',
    permissions: [
      { value: 'production_activities:read', label: 'View Activities' },
      {
        value: 'production_activities:update',
        label: 'Update Production Progress',
      },
    ],
  },
  {
    module: 'Inventory & Store',
    permissions: [
      { value: 'inventory:read', label: 'View Inventory' },
      { value: 'inventory:write', label: 'Manage Inventory' },
    ],
  },
  {
    module: 'Procurement',
    permissions: [
      {
        value: 'procurement:read',
        label: 'View Suppliers, PO Groups & Purchase Orders',
      },
      {
        value: 'procurement:write',
        label: 'Manage Procurement (create/edit POs)',
      },
      { value: 'procurement:delete', label: 'Delete Procurement Records' },
    ],
  },
  {
    module: 'Sales (Quotes & Invoices)',
    permissions: [
      { value: 'sales:read', label: 'View Sales Documents' },
      { value: 'sales:write', label: 'Manage Sales Documents' },
      { value: 'sales:delete', label: 'Delete Sales Orders' },
    ],
  },
  {
    module: 'Store & Dispatch',
    permissions: [
      {
        value: 'store:read',
        label: 'View Store (Stock, Receipts, Dispatches)',
      },
      { value: 'store:write', label: 'Manage Store Operations' },
    ],
  },
  {
    module: 'Customers',
    permissions: [
      { value: 'customers:read', label: 'View Customers' },
      { value: 'customers:write', label: 'Manage Customers' },
    ],
  },
  {
    module: 'Reports',
    permissions: [
      { value: 'reports:sales', label: 'View Sales Report' },
      { value: 'reports:production', label: 'View Production Report' },
      { value: 'reports:inventory', label: 'View Inventory Report' },
      { value: 'reports:finance', label: 'View Finance Report' },
      {
        value: 'reports:quality-control',
        label: 'View Quality Control Report',
      },
      { value: 'reports:dispatch', label: 'View Dispatch Report' },
    ],
  },
];

// ─── Section groupings ────────────────────────────────────────────────────────

const ACCENT = '#3B82F6'; // single consistent accent colour

const SECTIONS: {
  label: string;
  icon: React.ReactNode;
  modules: string[];
}[] = [
  {
    label: 'Administration',
    icon: <Security fontSize="small" />,
    modules: ['Users & Employees', 'Roles & Permissions', 'Customers'],
  },
  {
    label: 'Production',
    icon: <PrecisionManufacturing fontSize="small" />,
    modules: ['Products', 'Production Orders', 'Production Activities'],
  },
  {
    label: 'Inventory & Procurement',
    icon: <Inventory2 fontSize="small" />,
    modules: ['Inventory & Store', 'Procurement'],
  },
  {
    label: 'Sales & Distribution',
    icon: <ShoppingCart fontSize="small" />,
    modules: ['Sales (Quotes & Invoices)', 'Store & Dispatch'],
  },
  {
    label: 'Reports',
    icon: <BarChart fontSize="small" />,
    modules: ['Reports'],
  },
];

// Icon per module
const MODULE_ICON: Record<string, React.ReactNode> = {
  'Users & Employees': <People sx={{ fontSize: 16 }} />,
  'Roles & Permissions': <Security sx={{ fontSize: 16 }} />,
  Customers: <Group sx={{ fontSize: 16 }} />,
  Products: <Inventory2 sx={{ fontSize: 16 }} />,
  'Production Orders': <PrecisionManufacturing sx={{ fontSize: 16 }} />,
  'Production Activities': <Build sx={{ fontSize: 16 }} />,
  'Inventory & Store': <Storefront sx={{ fontSize: 16 }} />,
  Procurement: <LocalShipping sx={{ fontSize: 16 }} />,
  'Sales (Quotes & Invoices)': <Receipt sx={{ fontSize: 16 }} />,
  'Store & Dispatch': <LocalShipping sx={{ fontSize: 16 }} />,
  Reports: <BarChart sx={{ fontSize: 16 }} />,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    permissions: string[];
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleForm({ initialData }: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || [],
  });

  const isEdit = !!initialData?.id;

  const toggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(value)
        ? prev.permissions.filter((p) => p !== value)
        : [...prev.permissions, value],
    }));
  };

  const toggleModule = (values: string[]) => {
    setFormData((prev) => {
      const allSelected = values.every((v) => prev.permissions.includes(v));
      return {
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter((p) => !values.includes(p))
          : Array.from(new Set([...prev.permissions, ...values])),
      };
    });
  };

  const toggleSection = (sectionModuleNames: string[]) => {
    const sectionPerms = AVAILABLE_PERMISSIONS.filter((m) =>
      sectionModuleNames.includes(m.module),
    ).flatMap((m) => m.permissions.map((p) => p.value));

    setFormData((prev) => {
      const allSelected = sectionPerms.every((v) =>
        prev.permissions.includes(v),
      );
      return {
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter((p) => !sectionPerms.includes(p))
          : Array.from(new Set([...prev.permissions, ...sectionPerms])),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Role Name is required');
      return;
    }
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/settings/roles/${initialData.id}`
        : '/api/settings/roles';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/settings/roles');
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save role');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = formData.permissions.length;
  const totalAvailable = AVAILABLE_PERMISSIONS.flatMap(
    (m) => m.permissions,
  ).length;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      {/* ── Role details ──────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={3}>
          {isEdit ? 'Edit Role Details' : 'New Role Details'}
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

      {/* ── Permissions ───────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header row */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              Select the specific actions users with this role can perform.
            </Typography>
          </Box>
          <Chip
            label={`${totalSelected} / ${totalAvailable} selected`}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(ACCENT, 0.1),
              color: ACCENT,
              fontSize: '0.75rem',
            }}
          />
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* Sections */}
        <Stack spacing={5}>
          {SECTIONS.map((section) => {
            const sectionModules = AVAILABLE_PERMISSIONS.filter((m) =>
              section.modules.includes(m.module),
            );
            const sectionPerms = sectionModules.flatMap((m) =>
              m.permissions.map((p) => p.value),
            );
            const sectionAllSelected = sectionPerms.every((v) =>
              formData.permissions.includes(v),
            );
            const sectionSomeSelected =
              sectionPerms.some((v) => formData.permissions.includes(v)) &&
              !sectionAllSelected;
            const sectionCount = sectionPerms.filter((v) =>
              formData.permissions.includes(v),
            ).length;

            return (
              <Box key={section.label}>
                {/* Section header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha(ACCENT, 0.07),
                    border: `1px solid ${alpha(ACCENT, 0.18)}`,
                    mb: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1.5,
                        bgcolor: alpha(ACCENT, 0.15),
                        color: ACCENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Typography
                      fontWeight={700}
                      fontSize="0.9rem"
                      // color={ACCENT}
                    >
                      {section.label}
                    </Typography>
                    {sectionCount > 0 && (
                      <Chip
                        label={`${sectionCount} / ${sectionPerms.length}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: alpha(ACCENT, 0.15),
                          color: ACCENT,
                        }}
                      />
                    )}
                  </Stack>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sectionAllSelected}
                        indeterminate={sectionSomeSelected}
                        onChange={() => toggleSection(section.modules)}
                        size="small"
                        // sx={{
                        //   color: ACCENT,
                        //   '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                        //     color: ACCENT,
                        //   },
                        // }}
                      />
                    }
                    label={
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        // color={ACCENT}
                      >
                        Select all
                      </Typography>
                    }
                    sx={{ mr: 0 }}
                  />
                </Stack>

                {/* Module cards grid */}
                <Grid container spacing={2}>
                  {sectionModules.map((mod) => {
                    const modValues = mod.permissions.map((p) => p.value);
                    const modAllSelected = modValues.every((v) =>
                      formData.permissions.includes(v),
                    );
                    const modSomeSelected =
                      modValues.some((v) => formData.permissions.includes(v)) &&
                      !modAllSelected;

                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={mod.module}>
                        <Box
                          sx={{
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor:
                              modSomeSelected || modAllSelected
                                ? alpha(ACCENT, 0.35)
                                : 'divider',
                            bgcolor: modAllSelected
                              ? alpha(ACCENT, 0.04)
                              : 'background.paper',

                            // borderLeft: `4px solid ${
                            //   modAllSelected
                            //     ? ACCENT
                            //     : modSomeSelected
                            //       ? alpha(ACCENT, 0.5)
                            //       : '#e2e8f0'
                            // }`,
                            overflow: 'hidden',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          {/* Module header */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              px: 2,
                              py: 1.25,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              bgcolor: alpha('#000', 0.015),
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              {/* <Box sx={{ color: ACCENT, display: 'flex' }}>
                                {MODULE_ICON[mod.module]}
                              </Box> */}
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontSize="0.8rem"
                              >
                                {mod.module}
                              </Typography>
                            </Stack>
                            <Checkbox
                              checked={modAllSelected}
                              indeterminate={modSomeSelected}
                              onChange={() => toggleModule(modValues)}
                              size="small"
                              // sx={{
                              //   p: 0.5,
                              //   color: alpha(ACCENT, 0.4),
                              //   '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                              //     color: ACCENT,
                              //   },
                              // }}
                            />
                          </Stack>

                          {/* Permission rows */}
                          <Box sx={{ px: 2, py: 1 }}>
                            {mod.permissions.map((perm, idx) => {
                              const checked = formData.permissions.includes(
                                perm.value,
                              );
                              return (
                                <Box key={perm.value}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    onClick={() => toggle(perm.value)}
                                    sx={{
                                      py: 0.75,
                                      px: 1,
                                      borderRadius: 1.5,
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      // bgcolor: checked
                                      //   ? alpha(ACCENT, 0.07)
                                      //   : 'transparent',
                                      '&:hover': {
                                        bgcolor: checked
                                          ? alpha(ACCENT, 0.1)
                                          : alpha('#000', 0.03),
                                      },
                                      transition: 'background 0.12s',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontSize="0.78rem"
                                      color={
                                        checked
                                          ? 'text.primary'
                                          : 'text.secondary'
                                      }
                                      fontWeight={checked ? 500 : 400}
                                    >
                                      {perm.label}
                                    </Typography>
                                    <Checkbox
                                      checked={checked}
                                      onChange={() => toggle(perm.value)}
                                      size="small"
                                      onClick={(e) => e.stopPropagation()}
                                      sx={{
                                        p: 0.25,
                                        // color: alpha(ACCENT, 0.35),
                                        // '&.Mui-checked': { color: ACCENT },
                                      }}
                                    />
                                  </Stack>
                                  {idx < mod.permissions.length - 1 && (
                                    <Divider sx={{ opacity: 0.4 }} />
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 2, px: 4 }}
        >
          {isEdit ? 'Save Changes' : 'Create Role'}
        </Button>
      </Box>
    </Box>
  );
}
