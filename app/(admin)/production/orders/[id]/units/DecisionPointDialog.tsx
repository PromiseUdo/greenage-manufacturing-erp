'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import type { DecisionPointConfig } from './decision-point-configs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile {
  name: string;
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

export interface DecisionSubmitData {
  decision: 'PASS' | 'FAIL';
  photos: AttachmentFile[];
  notes: string;
  /** Only present when config.hasFailureType is true */
  failureType?: 'REPAIRABLE' | 'SCRAPPED';
}

interface Props {
  open: boolean;
  /** Null while dialog is closed — nothing is rendered. */
  config: DecisionPointConfig | null;
  onClose: () => void;
  /** Called by the dialog; the parent handles all API calls and side-effects. */
  onSubmit: (data: DecisionSubmitData) => Promise<void>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function readFilesAsBase64(files: File[]): Promise<AttachmentFile[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<AttachmentFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              mimeType: file.type || 'image/jpeg',
              base64: (reader.result as string).split(',')[1],
              sizeBytes: file.size,
            });
          reader.readAsDataURL(file);
        }),
    ),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DecisionPointDialog({ open, config, onClose, onSubmit }: Props) {
  const [decision, setDecision] = useState<'PASS' | 'FAIL' | null>(null);
  const [photos, setPhotos] = useState<AttachmentFile[]>([]);
  const [notes, setNotes] = useState('');
  const [failureType, setFailureType] = useState<'REPAIRABLE' | 'SCRAPPED' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset all local state each time the dialog opens for a different step.
  useEffect(() => {
    if (open) {
      setDecision(null);
      setPhotos([]);
      setNotes('');
      setFailureType(null);
      setSubmitting(false);
    }
  }, [open]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const converted = await readFilesAsBase64(files);
    setPhotos((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!config || !decision || photos.length === 0) return;
    if (config.hasFailureType && decision === 'FAIL' && !failureType) return;
    setSubmitting(true);
    try {
      await onSubmit({
        decision,
        photos,
        notes,
        failureType: failureType ?? undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) return null;

  // ── Derived display values ──────────────────────────────────────────────────

  const isDisabled =
    !decision ||
    photos.length === 0 ||
    (config.hasFailureType && decision === 'FAIL' && !failureType) ||
    submitting;

  const submitBgColor = (() => {
    if (decision !== 'FAIL') return '#16A34A';
    if (config.hasFailureType) {
      if (failureType === 'SCRAPPED') return '#DC2626';
      if (failureType === 'REPAIRABLE') return '#F59E0B';
    }
    return '#DC2626';
  })();

  const submitLabel = (() => {
    if (submitting) return 'Submitting…';
    if (!decision) return 'Select PASS or FAIL';
    if (decision === 'PASS') return config.passLabel;
    if (config.hasFailureType) {
      if (!failureType) return 'Select Failure Type';
      return failureType === 'REPAIRABLE' ? 'Confirm FAIL → Rework' : 'Confirm FAIL → Scrap Unit';
    }
    return config.failLabel;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GavelIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
        {config.title}
      </DialogTitle>

      <DialogContent dividers>
        {/* Top info alert */}
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {config.infoText}
        </Alert>

        {/* PASS / FAIL toggle */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {(['PASS', 'FAIL'] as const).map((d) => (
            <Box
              key={d}
              onClick={() => { setDecision(d); setFailureType(null); }}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                cursor: 'pointer',
                textAlign: 'center',
                border: '2px solid',
                borderColor: decision === d ? (d === 'PASS' ? '#16A34A' : '#DC2626') : '#E5E7EB',
                bgcolor: decision === d ? (d === 'PASS' ? '#F0FDF4' : '#FEF2F2') : 'background.paper',
                transition: 'all 0.15s',
              }}
            >
              {d === 'PASS' ? (
                <ThumbUpIcon sx={{ fontSize: 28, color: decision === 'PASS' ? '#16A34A' : '#9CA3AF' }} />
              ) : (
                <ThumbDownIcon sx={{ fontSize: 28, color: decision === 'FAIL' ? '#DC2626' : '#9CA3AF' }} />
              )}
              <Typography
                fontWeight={700}
                sx={{ color: decision === d ? (d === 'PASS' ? '#16A34A' : '#DC2626') : '#6B7280' }}
              >
                {d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* PASS outcome alert */}
        {decision === 'PASS' && config.passAlertText && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {config.passAlertText}
          </Alert>
        )}

        {/* FAIL outcome alert (steps without failure-type picker) */}
        {decision === 'FAIL' && !config.hasFailureType && config.failAlertText && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {config.failAlertText}
          </Alert>
        )}

        {/* Failure-type picker (QC-3 style) */}
        {decision === 'FAIL' && config.hasFailureType && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Failure Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              {(
                [
                  { label: 'Repairable', value: 'REPAIRABLE' as const, color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Non-repairable (Scrap)', value: 'SCRAPPED' as const, color: '#DC2626', bg: '#FEF2F2' },
                ] as const
              ).map(({ label, value, color, bg }) => (
                <Box
                  key={value}
                  onClick={() => setFailureType(value)}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: '2px solid',
                    borderColor: failureType === value ? color : '#E5E7EB',
                    bgcolor: failureType === value ? bg : 'background.paper',
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: failureType === value ? color : '#6B7280' }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
            {failureType === 'REPAIRABLE' && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                You will be prompted to set up a <strong>Rework Process</strong> after submitting.
              </Alert>
            )}
            {failureType === 'SCRAPPED' && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Unit will be <strong>scrapped</strong>. The packaging step will be skipped automatically.
              </Alert>
            )}
          </Box>
        )}

        {/* Photo previews */}
        {photos.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {photos.map((f, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={`data:${f.mimeType};base64,${f.base64}`}
                  sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #E5E7EB' }}
                />
                <IconButton
                  size="small"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    bgcolor: '#DC2626',
                    color: '#fff',
                    width: 18,
                    height: 18,
                    '&:hover': { bgcolor: '#B91C1C' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 11 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* Photo / file capture buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            component="label"
            variant={photos.length === 0 ? 'contained' : 'outlined'}
            size="small"
            startIcon={<PhotoCameraIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            {photos.length === 0 ? 'Take / Upload Photo' : 'Add More'}
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              hidden
              onChange={handlePhotoCapture}
            />
          </Button>
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<AttachFileIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Upload File
            <input type="file" accept="image/*,.pdf" multiple hidden onChange={handlePhotoCapture} />
          </Button>
        </Box>

        {/* Notes */}
        <TextField
          label={config.notesLabel}
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={config.notesPlaceholder}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isDisabled}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : decision === 'FAIL' ? (
              <ThumbDownIcon />
            ) : (
              <ThumbUpIcon />
            )
          }
          sx={{
            bgcolor: submitBgColor,
            '&:hover': { filter: 'brightness(0.88)' },
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            borderRadius: 2,
          }}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
