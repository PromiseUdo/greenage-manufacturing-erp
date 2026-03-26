"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

function getStatusColor(s: string) {
  switch (s) {
    case "RECEIVED":      return { bg: "#FEF3C7", text: "#92400E" };
    case "INSPECTING":
    case "PENDING_APPROVAL": return { bg: "#E0E7FF", text: "#4338CA" };
    case "IN_REPAIR":     return { bg: "#DBEAFE", text: "#1E40AF" };
    case "REPAIR_COMPLETED":
    case "READY_FOR_DISPATCH": return { bg: "#ECFCCB", text: "#3F6212" };
    case "DISPATCHED":    return { bg: "#DCFCE7", text: "#166534" };
    case "SCRAPPED":      return { bg: "#FEE2E2", text: "#991B1B" };
    default:              return { bg: "#F3F4F6", text: "#4B5563" };
  }
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Received — Awaiting Inspection",
  INSPECTING: "Under Inspection",
  PENDING_APPROVAL: "Pending Manager Approval",
  IN_REPAIR: "In Repair",
  REPAIR_COMPLETED: "Repair Complete — Awaiting Store Receipt",
  READY_FOR_DISPATCH: "In Store — Ready for Dispatch",
  DISPATCHED: "Dispatched",
  SCRAPPED: "Scrapped",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReturnDetailClient({
  initialData,
}: {
  initialData: any;
  currentUser?: any;
}) {
  const router = useRouter();
  const data = initialData;
  const sColor = getStatusColor(data.status);
  const tasks: any[] = Array.isArray(data.repairTasks) ? data.repairTasks : [];

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/inventory/returns")}
          sx={{ color: "text.secondary" }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800} sx={{ flex: 1 }}>
          Return #{data.returnNumber}
        </Typography>
        <Chip
          label={STATUS_LABEL[data.status] ?? data.status.replace(/_/g, " ")}
          sx={{ bgcolor: sColor.bg, color: sColor.text, fontWeight: 700 }}
        />
      </Box>

      {data.status === "REPAIR_COMPLETED" && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          All repair tasks are complete. This unit will appear in{" "}
          <strong>Pending Store Receipt</strong> for the store keeper to receive into inventory.
        </Alert>
      )}

      {/* Info card */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="overline" color="text.secondary">Customer</Typography>
            <Typography variant="h6">{data.customer?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.customer?.phone}
            </Typography>
            {data.customer?.email && (
              <Typography variant="body2" color="text.secondary">
                {data.customer.email}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="overline" color="text.secondary">Product</Typography>
            <Typography variant="h6">{data.product?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.product?.productNumber}
            </Typography>
            {data.unitId && (
              <Typography variant="body2" color="text.secondary">
                Unit ID: <strong>{data.unitId}</strong>
              </Typography>
            )}
            {data.serialNumber && (
              <Typography variant="body2" color="text.secondary">
                Serial: {data.serialNumber}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="overline" color="text.secondary">Received</Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatDate(data.dateReceived)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              by {data.receivedBy?.name}
            </Typography>
            {data.order && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Order: {data.order.orderNumber}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="overline" color="text.secondary">Issue Reported</Typography>
            <Typography variant="body1" sx={{ mt: 0.5, p: 2, bgcolor: "#F9FAFB", borderRadius: 2 }}>
              {data.issueReported}
            </Typography>
            {data.condition && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Condition on arrival:</strong> {data.condition}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Inspection findings (read-only) */}
      {data.evaluationNotes && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>
            Inspection Findings
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {data.evaluationNotes}
          </Typography>
          {data.handledBy && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              by {data.handledBy.name}
            </Typography>
          )}
        </Paper>
      )}

      {/* Manager recommendation (read-only) */}
      {data.recommendedAction && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", bgcolor: "#F0F9FF", mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#0369A1" mb={1}>
            Manager Recommendation
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {data.recommendedAction}
          </Typography>
          {data.recommendedBy && (
            <Typography variant="caption" color="#0284C7" sx={{ mt: 1, display: "block" }}>
              by {data.recommendedBy.name} · {formatDate(data.recommendationDate)}
            </Typography>
          )}
        </Paper>
      )}

      {/* Repair tasks (read-only) */}
      {tasks.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E5E7EB", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <BuildIcon sx={{ color: "#D97706" }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Repair Tasks
            </Typography>
            <Chip
              label={`${tasks.filter((t) => t.status === "COMPLETED").length} / ${tasks.length} done`}
              size="small"
              sx={{ bgcolor: "#FEF3C7", color: "#92400E", fontWeight: 700 }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tasks.map((task: any, idx: number) => {
              const done = task.status === "COMPLETED";
              return (
                <Box
                  key={task.id}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1.5, borderRadius: 2,
                    bgcolor: done ? "#F0FDF4" : "#FAFAFA",
                    border: "1px solid", borderColor: done ? "#BBF7D0" : "divider",
                  }}
                >
                  {done ? (
                    <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 20, flexShrink: 0 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: "text.disabled", fontSize: 20, flexShrink: 0 }} />
                  )}
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ textDecoration: done ? "line-through" : "none", color: done ? "text.secondary" : "text.primary" }}
                    >
                      {idx + 1}. {task.name}
                    </Typography>
                    {done && task.completedBy && (
                      <Typography variant="caption" color="text.secondary">
                        {task.completedBy.name} · {formatDate(task.completedAt)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Scrapped notice */}
      {data.status === "SCRAPPED" && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This unit has been assessed as non-repairable and scrapped.
        </Alert>
      )}
    </Box>
  );
}
