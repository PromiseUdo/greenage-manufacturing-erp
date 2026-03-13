"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

interface Activity {
  id: string;
  type: string;
  comment: string | null;
  attachments:
    | { name: string; mimeType: string; base64: string; sizeBytes: number }[]
    | null;
  author: { id: string; name: string; email: string };
  createdAt: string;
}

interface Props {
  orderId: string;
  stageId: string;
  actionId: string;
  stepId: string;
  onActivityAdded?: () => void;
}

const relativeTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarColor = (name: string) => {
  const colors = [
    "#6366F1",
    "#2563EB",
    "#16A34A",
    "#D97706",
    "#DC2626",
    "#7C3AED",
    "#0891B2",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export default function ActivitiesPanel({
  orderId,
  stageId,
  actionId,
  stepId,
  onActivityAdded,
}: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; mimeType: string; base64: string; sizeBytes: number }[]
  >([]);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/stages/${stageId}/actions/${actionId}/activities`,
      );
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId, stageId, actionId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: typeof attachments = [];
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      newAttachments.push({
        name: file.name,
        mimeType: file.type,
        base64,
        sizeBytes: file.size,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!comment.trim() && attachments.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/production/orders/${orderId}/stages/${stageId}/actions/${actionId}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: comment.trim() || null,
            attachments: attachments.length > 0 ? attachments : null,
          }),
        },
      );
      if (res.ok) {
        setComment("");
        setAttachments([]);
        await fetchActivities();
        if (onActivityAdded) {
          onActivityAdded();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Image Preview Modal */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <img
            src={`data:image/jpeg;base64,${previewImg}`}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              borderRadius: 12,
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* Activity Feed */}
      <div style={{ marginBottom: 12 }}>
        {loading ? (
          <div style={{ padding: "12px 0", color: "#9CA3AF", fontSize: 13 }}>
            Loading activity…
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: "8px 0", color: "#9CA3AF", fontSize: 13 }}>
            No comments yet. Be the first to add one.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 14,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: avatarColor(act.author.name),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials(act.author.name)}
              </div>

              {/* Bubble */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}
                  >
                    {act.author.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {relativeTime(act.createdAt)}
                  </span>
                </div>

                {act.comment && (
                  <div
                    style={{
                      background: "#F9FAFB",
                      border: "1px solid #E5E7EB",
                      borderRadius: "0 12px 12px 12px",
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {act.comment}
                  </div>
                )}

                {/* Attachments */}
                {act.attachments && act.attachments.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {act.attachments.map((att, i) => {
                      const isImage = att.mimeType.startsWith("image/");
                      return (
                        <div
                          key={i}
                          onClick={() => isImage && setPreviewImg(att.base64)}
                          style={{
                            width: isImage ? 80 : "auto",
                            height: isImage ? 80 : "auto",
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: isImage ? "pointer" : "default",
                            background: "#F3F4F6",
                            display: "flex",
                            alignItems: isImage ? "stretch" : "center",
                            justifyContent: isImage ? "stretch" : "flex-start",
                            padding: isImage ? 0 : "6px 10px",
                            gap: 6,
                            maxWidth: isImage ? 80 : 220,
                          }}
                        >
                          {isImage ? (
                            <img
                              src={`data:${att.mimeType};base64,${att.base64}`}
                              alt={att.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <>
                              <InsertDriveFileIcon
                                sx={{ fontSize: 18, color: "#6B7280" }}
                              />
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#374151",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {att.name}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#9CA3AF",
                                  flexShrink: 0,
                                }}
                              >
                                {formatFileSize(att.sizeBytes)}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Attachment Previews (before submit) */}
      {attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {attachments.map((att, i) => {
            const isImage = att.mimeType.startsWith("image/");
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  width: isImage ? 60 : "auto",
                  height: isImage ? 60 : 36,
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  padding: isImage ? 0 : "4px 8px",
                  gap: 4,
                  maxWidth: 180,
                }}
              >
                {isImage ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.base64}`}
                    alt={att.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#1E40AF",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <InsertDriveFileIcon
                      sx={{
                        fontSize: 13,
                        mr: 0.5,
                        verticalAlign: "text-bottom",
                      }}
                    />
                    {att.name}
                  </span>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 10,
        }}
      >
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder={`Add a comment on ${stepId}…`}
          rows={2}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            outline: "none",
            resize: "none",
            fontSize: 13,
            color: "#111827",
            fontFamily: "inherit",
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {/* File attach button */}
            <label
              style={{
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                background: "#EFF6FF",
                color: "#2563EB",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                border: "1px solid #BFDBFE",
              }}
            >
              <AttachFileIcon sx={{ fontSize: 20 }} />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            {/* Camera button (mobile) */}
            <label
              style={{
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                background: "#F0FDF4",
                color: "#16A34A",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                border: "1px solid #BBF7D0",
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 20 }} />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              submitting || (!comment.trim() && attachments.length === 0)
            }
            style={{
              background:
                submitting || (!comment.trim() && attachments.length === 0)
                  ? "#E5E7EB"
                  : "#2563EB",
              color:
                submitting || (!comment.trim() && attachments.length === 0)
                  ? "#9CA3AF"
                  : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor:
                submitting || (!comment.trim() && attachments.length === 0)
                  ? "not-allowed"
                  : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
