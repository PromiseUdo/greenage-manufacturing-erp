// src/components/inventory/file-upload.tsx

'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as FileIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface FileUploadProps {
  files: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
}

export default function FileUpload({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = '.pdf,.jpg,.jpeg,.png',
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError(null);

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > maxSizeBytes,
    );

    if (oversizedFiles.length > 0) {
      setError(`Files must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const newFiles: FileAttachment[] = await Promise.all(
        selectedFiles.map(async (file) => {
          // Convert to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            name: file.name,
            url: base64,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          };
        }),
      );

      onChange([...files, ...newFiles]);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <PdfIcon sx={{ color: '#d32f2f' }} />;
    }
    if (type.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#1976d2' }} />;
    }
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading || files.length >= maxFiles}
      />

      {/* Upload Button */}
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading || files.length >= maxFiles}
        sx={{
          mb: 2,
          borderStyle: 'dashed',
          borderWidth: 2,
          py: 1.5,
          '&:hover': {
            borderWidth: 2,
            borderStyle: 'dashed',
          },
        }}
        fullWidth
      >
        {uploading
          ? 'Uploading...'
          : files.length >= maxFiles
            ? 'Maximum files reached'
            : 'Upload Evidence (Invoice, Receipt, etc.)'}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
        Accepted formats: PDF, JPG, PNG • Max size: {maxSizeMB}MB per file • Max
        files: {maxFiles}
      </Typography>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Attached Files ({files.length}/{maxFiles})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {files.map((file, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                {getFileIcon(file.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)} •{' '}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Chip
                  label={file.type.split('/')[1].toUpperCase()}
                  size="small"
                  sx={{ fontSize: 10, height: 20 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled}
                  sx={{
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.light', color: 'white' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
