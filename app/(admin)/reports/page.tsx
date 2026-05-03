'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import {
  ShoppingCart,
  PrecisionManufacturing,
  Inventory2,
  AccountBalance,
  VerifiedUser,
  LocalShipping,
  RequestQuote,
  ArrowForward,
  BarChart,
} from '@mui/icons-material';

// ─── Department config ────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    id: 'sales',
    label: 'Sales',
    description:
      'Orders, quotes, invoices, revenue, customer rankings and payment status breakdowns.',
    icon: ShoppingCart,
    color: '#2196F3',
    bg: 'rgba(33,150,243,0.08)',
    metrics: ['Total Orders', 'Revenue', 'Quotes', 'Conversion Rate'],
  },
  {
    id: 'production',
    label: 'Production',
    description:
      'Production orders, units started vs packaged, yield rates and rework statistics.',
    icon: PrecisionManufacturing,
    color: '#FF9800',
    bg: 'rgba(255,152,0,0.08)',
    metrics: ['Production Orders', 'Units', 'Yield Rate', 'Reworks'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    description:
      'Material stock levels, low-stock alerts, purchase order spend and category breakdown.',
    icon: Inventory2,
    color: '#4CAF50',
    bg: 'rgba(76,175,80,0.08)',
    metrics: ['Total Materials', 'Low Stock', 'PO Spend', 'Issuances'],
  },
  {
    id: 'finance',
    label: 'Finance',
    description:
      'Invoiced amounts, collections, outstanding receivables, purchase expenditure and payment methods.',
    icon: AccountBalance,
    color: '#9C27B0',
    bg: 'rgba(156,39,176,0.08)',
    metrics: ['Total Invoiced', 'Collected', 'Outstanding', 'Collection Rate'],
  },
  {
    id: 'quality-control',
    label: 'Quality Control',
    description:
      'QC pass / fail rates, NCR counts, test-type distribution and defect category analysis.',
    icon: VerifiedUser,
    color: '#00BCD4',
    bg: 'rgba(0,188,212,0.08)',
    metrics: ['QC Tests', 'Pass Rate', 'NCRs', 'Fail Categories'],
  },
  {
    id: 'dispatch',
    label: 'Dispatch & Logistics',
    description:
      'Dispatch statuses, store dispatches, delivery rate and product return summaries.',
    icon: LocalShipping,
    color: '#F44336',
    bg: 'rgba(244,67,54,0.08)',
    metrics: ['Dispatches', 'Delivery Rate', 'Store Dispatches', 'Returns'],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    description:
      'Purchase order spend, supplier performance, average lead times, on-time delivery rates and cost variance analysis.',
    icon: RequestQuote,
    color: '#5C6BC0',
    bg: 'rgba(92,107,192,0.08)',
    metrics: ['PO Value', 'Avg Lead Time', 'On-Time %', 'Cost Variance'],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsHubPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;
  const permissions: string[] = (session?.user as any)?.permissions ?? [];
  const isSuperUser = role === 'SUPERADMIN';

  const visibleDepts = DEPARTMENTS.filter(
    (d) => isSuperUser || permissions.includes(`reports:${d.id}`),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <BarChart sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Department-level analytics with flexible time filtering and PDF export
          </Typography>
        </Box>
      </Stack>

      <Box mb={4} />

      {/* Department cards */}
      <Grid container spacing={3}>
        {visibleDepts.map((dept) => {
          const Icon = dept.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={dept.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    boxShadow: `0 4px 24px rgba(0,0,0,0.12)`,
                    borderColor: dept.color,
                  },
                }}
              >
                {/* Icon + title */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: dept.bg,
                    }}
                  >
                    <Icon sx={{ color: dept.color, fontSize: 26 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {dept.label}
                  </Typography>
                </Stack>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexGrow: 1 }}
                >
                  {dept.description}
                </Typography>

                {/* Metric chips */}
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {dept.metrics.map((m) => (
                    <Chip
                      key={m}
                      label={m}
                      size="small"
                      sx={{
                        bgcolor: dept.bg,
                        color: dept.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  ))}
                </Stack>

                {/* CTA */}
                <Button
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  onClick={() => router.push(`/reports/${dept.id}`)}
                  sx={{
                    mt: 0.5,
                    borderColor: dept.color,
                    color: dept.color,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: dept.bg,
                      borderColor: dept.color,
                    },
                  }}
                >
                  View Report
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
