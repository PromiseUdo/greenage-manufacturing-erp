"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_MB = 5;

export interface ImageUploadResult {
  url: string;
  publicId: string;
}

interface ImageUploadProps {
  /** Currently saved image URL (from DB) */
  currentUrl?: string | null;
  /** Currently saved Cloudinary public_id (for overwrite) */
  currentPublicId?: string | null;
  /** Called after a successful Cloudinary upload */
  onUpload: (result: ImageUploadResult) => void;
  /** Called when the user removes the image */
  onRemove: () => void;
  /** Cloudinary folder to upload into */
  folder?: string;
  disabled?: boolean;
  label?: string;
}

export default function ImageUpload({
  currentUrl,
  currentPublicId,
  onUpload,
  onRemove,
  folder = "greenage",
  disabled = false,
  label = "Product Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview || currentUrl || null;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    // Reset so the same file can be re-selected after removal
    e.target.value = "";

    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_MB} MB.`);
      return;
    }

    let dataUrl: string;
    try {
      dataUrl = await readFileAsDataUrl(file);
    } catch {
      setError("Could not read the selected file.");
      return;
    }

    setPreview(dataUrl);
    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          folder,
          publicId: currentPublicId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUpload({ url: data.url, publicId: data.publicId });
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove();
  };

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 1 }}
      >
        {label}
      </Typography>

      {/* Drop zone / preview area */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 220,
          borderRadius: 2,
          border: "2px dashed",
          borderColor: displayUrl ? "transparent" : "#CBD5E1",
          bgcolor: displayUrl ? "transparent" : alpha("#10b981", 0.03),
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s",
          "&:hover .image-overlay": displayUrl
            ? { opacity: 1 }
            : {},
        }}
      >
        {displayUrl ? (
          <>
            <Box
              component="img"
              src={displayUrl}
              alt="Product image"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                p: 1,
              }}
            />

            {/* Hover overlay with actions */}
            <Box
              className="image-overlay"
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                opacity: 0,
                transition: "opacity 0.2s",
                borderRadius: 2,
              }}
            >
              <Tooltip title="Change image">
                <IconButton
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || uploading}
                  sx={{
                    bgcolor: "#fff",
                    color: "#0f172a",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    width: 44,
                    height: 44,
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove image">
                <IconButton
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  sx={{
                    bgcolor: "#fff",
                    color: "#ef4444",
                    "&:hover": { bgcolor: "#fee2e2" },
                    width: 44,
                    height: 44,
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Upload progress overlay */}
            {uploading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(255,255,255,0.75)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  borderRadius: 2,
                }}
              >
                <CircularProgress size={32} sx={{ color: "#10b981" }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Uploading…
                </Typography>
              </Box>
            )}
          </>
        ) : (
          /* Empty state */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              cursor: disabled ? "default" : "pointer",
              px: 2,
            }}
            onClick={() => !disabled && !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <CircularProgress size={32} sx={{ color: "#10b981" }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Uploading…
                </Typography>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    bgcolor: alpha("#10b981", 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CloudUploadOutlinedIcon sx={{ color: "#10b981", fontSize: 26 }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>
                    Click to upload image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPEG, PNG, WebP · max {MAX_MB} MB
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={disabled}
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  startIcon={<ImageOutlinedIcon />}
                  sx={{
                    borderColor: "#CBD5E1",
                    color: "#475569",
                    "&:hover": { borderColor: "#10b981", color: "#10b981" },
                    fontSize: 12,
                    mt: 0.5,
                  }}
                >
                  Browse file
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Success indicator when image is present and saved */}
      {displayUrl && !uploading && !error && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600 }}>
            ✓ Image ready
          </Typography>
          <Button
            size="small"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            sx={{ fontSize: 11, color: "#64748b", p: 0.5, minWidth: "auto" }}
          >
            Change
          </Button>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mt: 1, fontSize: 12, py: 0.5 }}
        >
          {error}
        </Alert>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </Box>
  );
}
