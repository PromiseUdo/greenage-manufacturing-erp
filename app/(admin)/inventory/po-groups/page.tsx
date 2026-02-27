"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  styled,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  FolderCopy as GroupIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  Add as AddIcon,
  Layers as LayersIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import IconButton from "@mui/material/IconButton";

// === Types ===
interface GroupStats {
  totalPOs: number;
  completedPOs: number;
  cancelledPOs: number;
  activePOs: number;
  totalAmount: number;
  totalPaid: number;
  completionPct: number;
  overallStatus: string;
  startDate: string | null;
  endDate: string | null;
}

interface POGroup {
  id: string;
  groupNumber: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  _stats: GroupStats;
}

// === Styled Components ===
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    padding: "14px 16px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: "12px 16px",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  cursor: "pointer",
  transition: "all 0.15s ease-in-out",
  "&:nth-of-type(odd)": { backgroundColor: "#FAFBFC" },
  "&:hover": {
    backgroundColor: "#EEF2FF",
    transform: "scale(1.001)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
}));

const STATUS_COLORS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EMPTY: { label: "Empty", color: "#64748b", bg: "#f1f5f9" },
  DRAFT: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
  IN_PROGRESS: { label: "In Progress", color: "#0369a1", bg: "#e0f2fe" },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
};

// === Stat Card ===
function StatCard({
  title,
  value,
  color,
  bg,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        flex: "1 1 180px",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: bg,
        transition: "transform 0.15s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: color,
          color: "#fff",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} color={color}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

// === Main Page ===
export default function POGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<POGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<POGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/inventory/po-groups?${params}`);
      const data = await res.json();
      setGroups(data.groups || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch PO groups:", err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/inventory/po-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
        }),
      });
      if (res.ok) {
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inventory/po-groups/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Compute page-level stats
  const stats = {
    total,
    active: groups.filter((g) => g._stats.overallStatus === "IN_PROGRESS")
      .length,
    completed: groups.filter((g) => g._stats.overallStatus === "COMPLETED")
      .length,
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0F172A">
            PO Groups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track purchase orders as a group
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{
            bgcolor: "#0F172A",
            fontWeight: 600,
            textTransform: "none",
            px: 3,
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          New Group
        </Button>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
        <StatCard
          title="Total Groups"
          value={stats.total}
          color="#0F172A"
          bg="#f8fafc"
          icon={<GroupIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Active"
          value={stats.active}
          color="#0369a1"
          bg="#e0f2fe"
          icon={<ClockIcon sx={{ fontSize: 22 }} />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          color="#16a34a"
          bg="#dcfce7"
          icon={<CheckIcon sx={{ fontSize: 22 }} />}
        />
      </Box>

      {/* Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search group name or number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ width: "100%", maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {loading && <LinearProgress sx={{ height: 3 }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Group Number</StyledTableCell>
                <StyledTableCell>Name</StyledTableCell>
                <StyledTableCell align="center">POs</StyledTableCell>
                <StyledTableCell align="center">Completion</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="right">Total Amount</StyledTableCell>
                <StyledTableCell>Start Date</StyledTableCell>
                <StyledTableCell>End Date</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Loading PO groups...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <LayersIcon
                      sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No PO groups found. Create one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => {
                  const statusConf =
                    STATUS_COLORS[group._stats.overallStatus] ||
                    STATUS_COLORS.EMPTY;
                  const pct = group._stats.completionPct;

                  return (
                    <StyledTableRow
                      key={group.id}
                      onClick={() =>
                        router.push(`/inventory/po-groups/${group.id}`)
                      }
                    >
                      <StyledTableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#0F172A"
                        >
                          {group.groupNumber}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {group.name}
                        </Typography>
                        {group.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              maxWidth: 250,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {group.description}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {group._stats.totalPOs}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip
                          title={`${group._stats.completedPOs} of ${group._stats.totalPOs} completed (${pct}%)`}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Box sx={{ width: 70 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: "#e2e8f0",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor:
                                      pct >= 100
                                        ? "#16a34a"
                                        : pct > 0
                                          ? "#f59e0b"
                                          : "#cbd5e1",
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color={
                                pct >= 100
                                  ? "#16a34a"
                                  : pct > 0
                                    ? "#d97706"
                                    : "#64748b"
                              }
                            >
                              {pct}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={statusConf.label}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor: statusConf.bg,
                            color: statusConf.color,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ₦
                          {(group._stats.totalAmount || 0).toLocaleString(
                            "en-NG",
                            { minimumFractionDigits: 2 },
                          )}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {group._stats.startDate
                            ? format(
                                new Date(group._stats.startDate),
                                "dd MMM yyyy",
                              )
                            : "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {group._stats.endDate
                            ? format(
                                new Date(group._stats.endDate),
                                "dd MMM yyyy",
                              )
                            : "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title="Delete group">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(group);
                            }}
                            sx={{
                              color: "#94a3b8",
                              "&:hover": {
                                color: "#dc2626",
                                bgcolor: "#fee2e2",
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#dc2626" }}>
          Delete PO Group
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong> ({deleteTarget?.groupNumber})?
          </Typography>
          {deleteTarget && deleteTarget._stats.totalPOs > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="#b91c1c" fontWeight={600}>
                This will permanently delete all {deleteTarget._stats.totalPOs}{" "}
                purchase order
                {deleteTarget._stats.totalPOs !== 1 ? "s" : ""} within this
                group and their payment records. This action cannot be undone.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteGroup}
            disabled={deleting}
            sx={{
              bgcolor: "#dc2626",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            {deleting ? "Deleting..." : "Delete Group"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create PO Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Group Name"
            placeholder="e.g. Q1 PCB Restock"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description (optional)"
            placeholder="Brief description of this group..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{ color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            sx={{
              bgcolor: "#0F172A",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
