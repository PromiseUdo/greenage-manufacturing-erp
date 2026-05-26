'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  ButtonGroup,
  TextField,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Tooltip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  ArrowBack,
  FileDownload,
  Email,
  Refresh,
  Save,
  Close,
  Add,
  TrendingUp,
  Inventory2,
  AttachMoney,
  Factory,
  InfoOutlined,
  CheckCircle,
} from '@mui/icons-material';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period =
  | 'daily'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'yearly'
  | 'alltime';

interface LiveData {
  revenue: number;
  profit: number;
  profitMargin: number;
  collectionRate: number;
  productionVolume: number;
  inventoryValue: number;
  yieldRate: number;
  reworkRate: number;
  lowStockCount: number;
  outOfStockCount: number;
  receivablesAging: { bucket: string; amount: number }[];
  topCustomers: { name: string; revenue: number }[];
  topProducts: { name: string; revenue: number; units: number }[];
}

interface DraftFields {
  revenue: string;
  profit: string;
  productionVolume: string;
  inventoryValue: string;
  executiveSummary: string;
  financialNarrative: string;
  operationalNarrative: string;
  salesGrowthNarrative: string;
  strategyPipeline: string;
  marketOpportunity: string;
  riskMitigation: string;
  outlookForecast: string;
}

interface EmailState {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = '#003D34';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'biannual', label: 'Bi-Annual' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'alltime', label: 'All Time' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_DRAFT: DraftFields = {
  revenue: '',
  profit: '',
  productionVolume: '',
  inventoryValue: '',
  executiveSummary: '',
  financialNarrative: '',
  operationalNarrative: '',
  salesGrowthNarrative: '',
  strategyPipeline: '',
  marketOpportunity: '',
  riskMitigation: '',
  outlookForecast: '',
};

// ─── Styled Components ────────────────────────────────────────────────────────

const SectionCard = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  marginBottom: theme.spacing(2.5),
}));

const SectionHeader = styled(Box)(() => ({
  background: BRAND,
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}));

// ─── Multi-email chip input ───────────────────────────────────────────────────

function EmailChipInput({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
}: {
  label: string;
  value: string[];
  onChange: (emails: string[]) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}) {
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');

  function addEmail(raw: string) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;
    if (!EMAIL_RE.test(trimmed)) {
      setInputError(`"${trimmed}" is not a valid email`);
      return;
    }
    if (value.includes(trimmed)) {
      setInputError('Already added');
      return;
    }
    onChange([...value, trimmed]);
    setInputVal('');
    setInputError('');
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputVal);
    }
    if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (inputVal.trim()) addEmail(inputVal);
  }

  function removeEmail(email: string) {
    onChange(value.filter((e) => e !== email));
  }

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={600}
        color="text.secondary"
        mb={0.5}
        display="block"
      >
        {label}
        {required && <span style={{ color: '#F44336' }}> *</span>}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          p: '8px 12px',
          minHeight: 44,
          border: '1px solid',
          borderColor: error || inputError ? 'error.main' : 'divider',
          borderRadius: 1,
          alignItems: 'center',
          '&:focus-within': {
            borderColor: BRAND,
            boxShadow: `0 0 0 2px ${alpha(BRAND, 0.12)}`,
          },
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {value.map((email) => (
          <Chip
            key={email}
            label={email}
            size="small"
            onDelete={() => removeEmail(email)}
            sx={{ fontSize: '0.72rem', height: 24 }}
          />
        ))}
        <Box
          component="input"
          value={inputVal}
          onChange={(e: any) => {
            setInputVal(e.target.value);
            setInputError('');
          }}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder={
            value.length === 0
              ? 'Type email and press Enter or comma'
              : 'Add another…'
          }
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: 160,
            fontSize: 14,
            fontFamily: 'inherit',
            background: 'transparent',
            padding: '0 4px',
          }}
        />
      </Box>
      {(inputError || helperText) && (
        <Typography
          variant="caption"
          color={inputError ? 'error' : 'text.secondary'}
          mt={0.5}
          display="block"
        >
          {inputError || helperText}
        </Typography>
      )}
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function periodLabel(key: Period): string {
  return PERIODS.find((p) => p.key === key)?.label ?? key;
}

// ─── KPI Input Card ───────────────────────────────────────────────────────────

function KpiInputCard({
  label,
  fieldKey,
  liveValue,
  value,
  onChange,
  icon,
  color,
  prefix,
  helperText,
}: {
  label: string;
  fieldKey: keyof DraftFields;
  liveValue: number;
  value: string;
  onChange: (key: keyof DraftFields, val: string) => void;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  helperText?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        height: '100%',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.12),
            color,
            '& svg': { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography variant="body2" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Live:{' '}
            <strong style={{ color }}>{helperText ?? fmt(liveValue)}</strong>
          </Typography>
        </Box>
        <Tooltip
          title="Auto-populated from live data. Edit to override for this report."
          placement="top"
        >
          <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Tooltip>
      </Stack>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        type="number"
        slotProps={{
          input: {
            startAdornment: prefix ? (
              <InputAdornment position="start">{prefix}</InputAdornment>
            ) : undefined,
          },
        }}
        sx={{ '& input': { fontWeight: 700 } }}
      />
    </Paper>
  );
}

// ─── Narrative Section ────────────────────────────────────────────────────────

function NarrativeSection({
  title,
  fieldKey,
  value,
  onChange,
  placeholder,
  rows = 5,
  sublabel,
}: {
  title: string;
  fieldKey: keyof DraftFields;
  value: string;
  onChange: (key: keyof DraftFields, val: string) => void;
  placeholder: string;
  rows?: number;
  sublabel?: string;
}) {
  return (
    <SectionCard elevation={0}>
      <SectionHeader>
        <Typography
          variant="body2"
          fontWeight={700}
          color="#fff"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.75rem',
          }}
        >
          {title}
        </Typography>
      </SectionHeader>
      <Box sx={{ p: 2.5 }}>
        {sublabel && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1.5}
          >
            {sublabel}
          </Typography>
        )}
        <TextField
          fullWidth
          multiline
          rows={rows}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={placeholder}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            },
          }}
        />
        <Typography
          variant="caption"
          color="text.disabled"
          mt={0.75}
          display="block"
          textAlign="right"
        >
          {value.length} characters
        </Typography>
      </Box>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorReportPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [period, setPeriod] = useState<Period>('quarterly');
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [draft, setDraft] = useState<DraftFields>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailState, setEmailState] = useState<EmailState>({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    message: '',
  });
  const [emailValidation, setEmailValidation] = useState({ to: '' });

  const role = (session?.user as any)?.role;
  const permissions: string[] = (session?.user as any)?.permissions ?? [];
  const hasAccess =
    role === 'SUPERADMIN' || permissions.includes('reports:investor');

  // ── Load data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/reports/investor?period=${p}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const json = await res.json();

      setLiveData(json.liveData);

      // Merge draft from DB (if exists) on top of live defaults
      const dbDraft = json.draft;
      setDraft({
        revenue:
          dbDraft?.revenue != null
            ? String(dbDraft.revenue)
            : String(Math.round(json.liveData.revenue)),
        profit:
          dbDraft?.profit != null
            ? String(dbDraft.profit)
            : String(Math.round(json.liveData.profit)),
        productionVolume:
          dbDraft?.productionVolume != null
            ? String(dbDraft.productionVolume)
            : String(Math.round(json.liveData.productionVolume)),
        inventoryValue:
          dbDraft?.inventoryValue != null
            ? String(dbDraft.inventoryValue)
            : String(Math.round(json.liveData.inventoryValue)),
        executiveSummary: dbDraft?.executiveSummary ?? '',
        financialNarrative: dbDraft?.financialNarrative ?? '',
        operationalNarrative: dbDraft?.operationalNarrative ?? '',
        salesGrowthNarrative: dbDraft?.salesGrowthNarrative ?? '',
        strategyPipeline: dbDraft?.strategyPipeline ?? '',
        marketOpportunity: dbDraft?.marketOpportunity ?? '',
        riskMitigation: dbDraft?.riskMitigation ?? '',
        outlookForecast: dbDraft?.outlookForecast ?? '',
      });

      if (dbDraft?.updatedAt) {
        setLastSaved(
          new Date(dbDraft.updatedAt).toLocaleString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      } else {
        setLastSaved(null);
      }
      setIsDirty(false);
    } catch (e: any) {
      setLoadError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  // Update default email subject when period changes
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setEmailState((prev) => ({
      ...prev,
      subject: `Greenage Technologies — Investor Report (${periodLabel(period)} ${year})`,
    }));
  }, [period]);

  // ── Field change handler ───────────────────────────────────────────────────
  function handleFieldChange(key: keyof DraftFields, val: string) {
    setDraft((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  }

  // ── Save draft ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/reports/investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          revenue: Number(draft.revenue) || 0,
          profit: Number(draft.profit) || 0,
          productionVolume: Number(draft.productionVolume) || 0,
          inventoryValue: Number(draft.inventoryValue) || 0,
          executiveSummary: draft.executiveSummary || null,
          financialNarrative: draft.financialNarrative || null,
          operationalNarrative: draft.operationalNarrative || null,
          salesGrowthNarrative: draft.salesGrowthNarrative || null,
          strategyPipeline: draft.strategyPipeline || null,
          marketOpportunity: draft.marketOpportunity || null,
          riskMitigation: draft.riskMitigation || null,
          outlookForecast: draft.outlookForecast || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      const json = await res.json();
      setLastSaved(
        new Date(json.draft.updatedAt).toLocaleString('en-NG', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
      setIsDirty(false);
      setSnack({
        open: true,
        message: 'Draft saved successfully',
        severity: 'success',
      });
    } catch (e: any) {
      setSnack({
        open: true,
        message: e.message || 'Failed to save',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Build report data payload ──────────────────────────────────────────────
  function buildReportPayload() {
    const now = new Date().toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return {
      period,
      periodLabel: periodLabel(period),
      generatedAt: now,
      revenue: Number(draft.revenue) || 0,
      profit: Number(draft.profit) || 0,
      productionVolume: Number(draft.productionVolume) || 0,
      inventoryValue: Number(draft.inventoryValue) || 0,
      profitMargin: liveData?.profitMargin,
      collectionRate: liveData?.collectionRate,
      yieldRate: liveData?.yieldRate,
      reworkRate: liveData?.reworkRate,
      lowStockCount: liveData?.lowStockCount,
      outOfStockCount: liveData?.outOfStockCount,
      receivablesAging: liveData?.receivablesAging,
      topCustomers: liveData?.topCustomers,
      topProducts: liveData?.topProducts,
      executiveSummary: draft.executiveSummary || undefined,
      financialNarrative: draft.financialNarrative || undefined,
      operationalNarrative: draft.operationalNarrative || undefined,
      salesGrowthNarrative: draft.salesGrowthNarrative || undefined,
      strategyPipeline: draft.strategyPipeline || undefined,
      marketOpportunity: draft.marketOpportunity || undefined,
      riskMitigation: draft.riskMitigation || undefined,
      outlookForecast: draft.outlookForecast || undefined,
    };
  }

  // ── Download PDF ───────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const res = await fetch('/api/reports/investor/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildReportPayload()),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || 'PDF generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Greenage-Investor-Report-${periodLabel(period).replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setSnack({
        open: true,
        message: e.message || 'PDF download failed',
        severity: 'error',
      });
    } finally {
      setDownloading(false);
    }
  }

  // ── Send email ─────────────────────────────────────────────────────────────
  function validateEmail(): boolean {
    const errors = { to: '' };
    if (emailState.to.length === 0)
      errors.to = 'At least one recipient is required';
    setEmailValidation(errors);
    return !errors.to;
  }

  async function handleSendEmail() {
    if (!validateEmail()) return;
    setEmailSending(true);
    setEmailError('');
    try {
      const res = await fetch('/api/reports/investor/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: buildReportPayload(),
          to: emailState.to,
          cc: emailState.cc.length > 0 ? emailState.cc : undefined,
          bcc: emailState.bcc.length > 0 ? emailState.bcc : undefined,
          subject: emailState.subject,
          message: emailState.message || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Email delivery failed');

      setEmailOpen(false);
      setSnack({
        open: true,
        message: 'Report sent successfully',
        severity: 'success',
      });
      // Reset email form recipients but keep subject/message as convenience
      setEmailState((prev) => ({ ...prev, to: [], cc: [], bcc: [] }));
    } catch (e: any) {
      setEmailError(e.message || 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  }

  // ── Access guard ───────────────────────────────────────────────────────────
  if (session && !hasAccess) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You do not have permission to access the Investor Report.
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/reports')}>
          Back to Reports
        </Button>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', pb: 8 }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/reports')}
            sx={{ minWidth: 0, px: 1 }}
          >
            Reports
          </Button>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
              Investor Report
            </Typography>
            {lastSaved && (
              <Typography variant="caption" color="text.secondary">
                Last saved: {lastSaved}
                {isDirty && (
                  <Chip
                    label="Unsaved changes"
                    size="small"
                    color="warning"
                    sx={{ ml: 1, height: 18, fontSize: '0.68rem' }}
                  />
                )}
              </Typography>
            )}
            {!lastSaved && !loading && (
              <Typography variant="caption" color="text.disabled">
                No saved draft for this period yet
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchData(period)}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={saving ? <CircularProgress size={14} /> : <Save />}
            onClick={handleSave}
            disabled={saving || loading}
            size="small"
            sx={{
              borderColor: BRAND,
              color: BRAND,
              '&:hover': { bgcolor: alpha(BRAND, 0.05) },
            }}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            variant="outlined"
            startIcon={
              downloading ? <CircularProgress size={14} /> : <FileDownload />
            }
            onClick={handleDownloadPDF}
            disabled={downloading || loading}
            size="small"
          >
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Email />}
            onClick={() => setEmailOpen(true)}
            disabled={loading}
            size="small"
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#004D40' } }}
          >
            Send Report
          </Button>
        </Stack>
      </Stack>

      {/* ── Period selector ────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Period:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              onClick={() => {
                if (!loading) setPeriod(p.key);
              }}
              variant={period === p.key ? 'contained' : 'outlined'}
              sx={
                period === p.key
                  ? {
                      bgcolor: BRAND,
                      borderColor: BRAND,
                      '&:hover': { bgcolor: BRAND },
                    }
                  : { borderColor: 'divider' }
              }
            >
              {p.label}
            </Button>
          ))}
        </ButtonGroup>
      </Paper>

      {/* ── Loading / error states ─────────────────────────────────────────── */}
      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => fetchData(period)}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {!loading && liveData && (
        <>
          {/* ── 1. Executive Summary ──────────────────────────────────────── */}
          <NarrativeSection
            title="Executive Summary"
            fieldKey="executiveSummary"
            value={draft.executiveSummary}
            onChange={handleFieldChange}
            placeholder="Provide a high-level overview of company performance, growth trajectory, and strategic direction for this period…"
            rows={5}
            sublabel=""
          />

          {/* ── 2. KPI Summary ────────────────────────────────────────────── */}
          <SectionCard elevation={0}>
            <SectionHeader>
              <Typography
                variant="body2"
                fontWeight={700}
                color="#fff"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '0.75rem',
                }}
              >
                KPI Summary
              </Typography>
            </SectionHeader>
            <Box sx={{ p: 2.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={2}
              >
                Edit any field to override for this report.
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <KpiInputCard
                    label="Revenue"
                    fieldKey="revenue"
                    liveValue={liveData.revenue}
                    value={draft.revenue}
                    onChange={handleFieldChange}
                    icon={<AttachMoney />}
                    color="#4CAF50"
                    prefix="₦"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <KpiInputCard
                    label="Profit"
                    fieldKey="profit"
                    liveValue={liveData.profit}
                    value={draft.profit}
                    onChange={handleFieldChange}
                    icon={<TrendingUp />}
                    color="#2196F3"
                    prefix="₦"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <KpiInputCard
                    label="Production Volume"
                    fieldKey="productionVolume"
                    liveValue={liveData.productionVolume}
                    value={draft.productionVolume}
                    onChange={handleFieldChange}
                    icon={<Factory />}
                    color="#FF9800"
                    helperText={`${liveData.productionVolume.toLocaleString()} units`}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <KpiInputCard
                    label="Inventory Value"
                    fieldKey="inventoryValue"
                    liveValue={liveData.inventoryValue}
                    value={draft.inventoryValue}
                    onChange={handleFieldChange}
                    icon={<Inventory2 />}
                    color="#9C27B0"
                    prefix="₦"
                  />
                </Grid>
              </Grid>

              {/* Supporting live metrics */}
              {/* <Box mt={2.5}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  SUPPORTING LIVE METRICS (read-only — reflected in the PDF)
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {[
                    {
                      label: 'Profit Margin',
                      value: fmtPct(liveData.profitMargin),
                    },
                    {
                      label: 'Collection Rate',
                      value: fmtPct(liveData.collectionRate),
                    },
                    { label: 'Yield Rate', value: fmtPct(liveData.yieldRate) },
                    {
                      label: 'Rework Rate',
                      value: fmtPct(liveData.reworkRate),
                    },
                    {
                      label: 'Low Stock Items',
                      value: String(liveData.lowStockCount),
                    },
                    {
                      label: 'Out of Stock',
                      value: String(liveData.outOfStockCount),
                    },
                  ].map((m) => (
                    <Chip
                      key={m.label}
                      label={`${m.label}: ${m.value}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.72rem' }}
                    />
                  ))}
                </Stack>
              </Box> */}
            </Box>
          </SectionCard>

          {/* ── Supporting data tables ────────────────────────────────────── */}
          {(liveData.topProducts.length > 0 ||
            liveData.topCustomers.length > 0) && (
            <SectionCard elevation={0}>
              <SectionHeader>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="#fff"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: '0.75rem',
                  }}
                >
                  Auto-Generated Supporting Data
                </Typography>
              </SectionHeader>
              <Box sx={{ p: 2.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={2}
                >
                  This data is automatically included in the PDF. No editing
                  required.
                </Typography>
                <Grid container spacing={3}>
                  {liveData.topProducts.length > 0 && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" fontWeight={700} mb={1}>
                        Top Products by Revenue
                      </Typography>
                      {liveData.topProducts.slice(0, 5).map((p, i) => (
                        <Stack
                          key={i}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            py: 0.75,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                            {i + 1}. {p.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="success.main"
                          >
                            {fmt(p.revenue)}
                          </Typography>
                        </Stack>
                      ))}
                    </Grid>
                  )}
                  {liveData.topCustomers.length > 0 && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" fontWeight={700} mb={1}>
                        Top Customers by Revenue
                      </Typography>
                      {liveData.topCustomers.slice(0, 5).map((c, i) => (
                        <Stack
                          key={i}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            py: 0.75,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                            {i + 1}. {c.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="success.main"
                          >
                            {fmt(c.revenue)}
                          </Typography>
                        </Stack>
                      ))}
                    </Grid>
                  )}
                </Grid>
              </Box>
            </SectionCard>
          )}

          {/* ── 3–8. Narrative Sections ───────────────────────────────────── */}
          <NarrativeSection
            title="Financial Performance"
            fieldKey="financialNarrative"
            value={draft.financialNarrative}
            onChange={handleFieldChange}
            placeholder="Describe revenue growth trends, profitability performance, cost structure breakdown, and any notable financial developments during this period…"
            rows={6}
            sublabel="Revenue growth, profitability trends, and cost structure overview."
          />

          <NarrativeSection
            title="Operational Performance"
            fieldKey="operationalNarrative"
            value={draft.operationalNarrative}
            onChange={handleFieldChange}
            placeholder="Outline production efficiency, capacity utilisation, identified bottlenecks, and any process improvements implemented or planned…"
            rows={6}
            sublabel="Production efficiency, capacity utilisation, and bottlenecks."
          />

          <NarrativeSection
            title="Sales & Growth Drivers"
            fieldKey="salesGrowthNarrative"
            value={draft.salesGrowthNarrative}
            onChange={handleFieldChange}
            placeholder="Highlight top-performing products, key customer segments, revenue channels, and the drivers behind sales growth or decline during this period…"
            rows={6}
            sublabel="Top-performing products, customer segments, and revenue channels."
          />

          <NarrativeSection
            title="Strategic Projects Pipeline"
            fieldKey="strategyPipeline"
            value={draft.strategyPipeline}
            onChange={handleFieldChange}
            placeholder="Summarise ongoing and upcoming strategic projects, including expected ROI, key milestones, timelines, and current status…"
            rows={7}
            sublabel="Overview of ongoing and upcoming projects with expected ROI and timelines."
          />

          <NarrativeSection
            title="Market Opportunity"
            fieldKey="marketOpportunity"
            value={draft.marketOpportunity}
            onChange={handleFieldChange}
            placeholder="Describe expansion opportunities, addressable market size, competitive positioning, and any new market segments being targeted…"
            rows={6}
            sublabel="Expansion opportunities, market size, and positioning."
          />

          <NarrativeSection
            title="Risk & Mitigation"
            fieldKey="riskMitigation"
            value={draft.riskMitigation}
            onChange={handleFieldChange}
            placeholder="Identify key operational and financial risks. For each risk, outline the mitigation strategy in place or planned to address it…"
            rows={7}
            sublabel="Key operational and financial risks with mitigation strategies."
          />

          <NarrativeSection
            title="Outlook & Forecast"
            fieldKey="outlookForecast"
            value={draft.outlookForecast}
            onChange={handleFieldChange}
            placeholder="Provide future projections including expected revenue, production targets, and strategic priorities. Include key assumptions and risk factors in the forecast…"
            rows={6}
            sublabel="Future projections and expected company performance."
          />

          {/* ── Bottom action bar ──────────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={1}>
            <Button
              variant="outlined"
              startIcon={saving ? <CircularProgress size={14} /> : <Save />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderColor: BRAND, color: BRAND }}
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                downloading ? <CircularProgress size={14} /> : <FileDownload />
              }
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Email />}
              onClick={() => setEmailOpen(true)}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#004D40' } }}
            >
              Send Report
            </Button>
          </Stack>
        </>
      )}

      {/* ── Email Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={emailOpen}
        onClose={() => {
          if (!emailSending) setEmailOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(BRAND, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Email sx={{ color: BRAND, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Send Investor Report
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PDF will be generated and attached automatically
              </Typography>
            </Box>
          </Stack>
          {!emailSending && (
            <IconButton
              size="small"
              onClick={() => setEmailOpen(false)}
              aria-label="Close"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          {emailError && (
            <Alert severity="error" onClose={() => setEmailError('')}>
              {emailError}
            </Alert>
          )}

          <EmailChipInput
            label="To"
            value={emailState.to}
            onChange={(emails) => {
              setEmailState((p) => ({ ...p, to: emails }));
              setEmailValidation({ to: '' });
            }}
            error={!!emailValidation.to}
            helperText={
              emailValidation.to || 'Press Enter or comma to add each address'
            }
            required
          />

          <EmailChipInput
            label="CC"
            value={emailState.cc}
            onChange={(emails) => setEmailState((p) => ({ ...p, cc: emails }))}
            helperText="Optional"
          />

          <EmailChipInput
            label="BCC"
            value={emailState.bcc}
            onChange={(emails) => setEmailState((p) => ({ ...p, bcc: emails }))}
            helperText="Optional"
          />

          <TextField
            label="Subject"
            fullWidth
            size="small"
            value={emailState.subject}
            onChange={(e) =>
              setEmailState((p) => ({ ...p, subject: e.target.value }))
            }
            error={emailState.subject.trim() === ''}
            helperText={
              emailState.subject.trim() === ''
                ? 'Subject is required'
                : undefined
            }
          />

          <TextField
            label="Message (optional)"
            fullWidth
            multiline
            rows={4}
            size="small"
            value={emailState.message}
            onChange={(e) =>
              setEmailState((p) => ({ ...p, message: e.target.value }))
            }
            placeholder="Add a personal note to accompany the report…"
          />

          <Alert severity="info" icon={<InfoOutlined />} sx={{ py: 0.75 }}>
            The report will be generated as a PDF for the{' '}
            <strong>{periodLabel(period)}</strong> period and attached to this
            email. KPI figures used will be your current saved/edited values.
          </Alert>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setEmailOpen(false)}
            disabled={emailSending}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendEmail}
            disabled={
              emailSending ||
              emailState.to.length === 0 ||
              !emailState.subject.trim()
            }
            startIcon={
              emailSending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Email />
              )
            }
            sx={{
              bgcolor: BRAND,
              '&:hover': { bgcolor: '#004D40' },
              minWidth: 130,
            }}
          >
            {emailSending ? 'Sending…' : 'Send Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
          iconMapping={{ success: <CheckCircle fontSize="inherit" /> }}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
