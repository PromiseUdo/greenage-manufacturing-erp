"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useOrderContext } from "../layout";
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Avatar,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import RefreshIcon from "@mui/icons-material/Refresh";
import FactoryIcon from "@mui/icons-material/Factory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GavelIcon from "@mui/icons-material/Gavel";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const getActionIcon = (action: string) => {
  if (action.includes("Created"))
    return <FactoryIcon fontSize="small" sx={{ color: "#6366F1" }} />;
  if (action.includes("Completed") || action.includes("Complete"))
    return <CheckCircleIcon fontSize="small" sx={{ color: "#16A34A" }} />;
  if (action.includes("QC Decision") || action.includes("Recorded QC"))
    return <GavelIcon fontSize="small" sx={{ color: "#F59E0B" }} />;
  if (action.includes("Start") || action.includes("IN_PROGRESS"))
    return <PlayArrowIcon fontSize="small" sx={{ color: "#2563EB" }} />;
  if (action.includes("Hold") || action.includes("ON_HOLD"))
    return <PauseIcon fontSize="small" sx={{ color: "#D97706" }} />;
  if (action.includes("Deleted"))
    return <DeleteIcon fontSize="small" sx={{ color: "#DC2626" }} />;
  return <EditIcon fontSize="small" sx={{ color: "#6B7280" }} />;
};

const getActionColor = (action: string) => {
  if (action.includes("Created")) return "#EEF2FF";
  if (action.includes("Completed")) return "#F0FDF4";
  if (action.includes("QC Decision") || action.includes("Recorded QC"))
    return "#FFFBEB";
  if (action.includes("Start") || action.includes("IN_PROGRESS"))
    return "#EFF6FF";
  if (action.includes("Deleted")) return "#FEF2F2";
  return "#F9FAFB";
};

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

export default function ProductionTimelinePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order } = useOrderContext();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production/orders/${orderId}/timeline`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Activity Timeline
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchTimeline}
          sx={{ textTransform: "none" }}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box
              key={i}
              sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </Box>
            </Box>
          ))}
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <TimelineIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            No activity recorded yet.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Activities appear as production progresses.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: "relative" }}>
          {/* Vertical line */}
          <Box
            sx={{
              position: "absolute",
              left: 19,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: "divider",
              zIndex: 0,
            }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {activities.map((activity, index) => (
              <Box
                key={activity.id}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 1,
                  mb: 2,
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: getActionColor(activity.action),
                    border: "2px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(activity.action)}
                </Box>

                {/* Content */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.62rem",
                          bgcolor: "#6366F1",
                          fontWeight: 700,
                        }}
                      >
                        {initials(activity.user.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700}>
                        {activity.action}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(activity.createdAt)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    by {activity.user.name}
                  </Typography>

                  {/* Show relevant details */}
                  {activity.details && (
                    <Box
                      sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}
                    >
                      {activity.details.outcome && (
                        <Chip
                          label={`Outcome: ${activity.details.outcome}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            bgcolor:
                              activity.details.outcome === "PASS"
                                ? "#DCFCE7"
                                : activity.details.outcome === "FAIL"
                                  ? "#FEE2E2"
                                  : "#FEF3C7",
                            color:
                              activity.details.outcome === "PASS"
                                ? "#166534"
                                : activity.details.outcome === "FAIL"
                                  ? "#991B1B"
                                  : "#92400E",
                          }}
                        />
                      )}
                      {activity.details.quantityPassed !== undefined && (
                        <Chip
                          label={`Passed: ${activity.details.quantityPassed}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            bgcolor: "#DCFCE7",
                            color: "#166534",
                          }}
                        />
                      )}
                      {activity.details.quantityFailed !== undefined &&
                        activity.details.quantityFailed > 0 && (
                          <Chip
                            label={`Failed: ${activity.details.quantityFailed}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              bgcolor: "#FEE2E2",
                              color: "#991B1B",
                            }}
                          />
                        )}
                      {activity.details.stepId && (
                        <Chip
                          label={activity.details.stepId}
                          size="small"
                          sx={{ height: 18, fontSize: "0.62rem" }}
                        />
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
