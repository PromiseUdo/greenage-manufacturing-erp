"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count: { employees: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/settings/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, description: dept.description || "" });
    } else {
      setEditingDept(null);
      setFormData({ name: "", description: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDept(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingDept
        ? `/api/settings/departments/${editingDept.id}`
        : "/api/settings/departments";

      const res = await fetch(url, {
        method: editingDept ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchDepartments();
        handleCloseDialog();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (deptId: string, employeesCount: number) => {
    if (employeesCount > 0) {
      alert("Cannot delete department with active employees.");
      return;
    }
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        const res = await fetch(`/api/settings/departments/${deptId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchDepartments();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete department");
        }
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Departments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
        >
          Add Department
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: "12px" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Department Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading departments...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  No departments found.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{dept.name}</Typography>
                  </TableCell>
                  <TableCell>{dept.description || "—"}</TableCell>
                  <TableCell>
                    {/* <Chip
                      size="small"
                      color={
                        dept._count.employees > 0 ? "#8b5cf6" : "default"
                      }
                      label={`${dept._count.employees} employees`}
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    /> */}

                    <Chip
                      size="small"
                      label={`${dept._count.employees} employees`}
                      sx={{
                        fontWeight: 400,
                        fontSize: "0.75rem",
                        bgcolor:
                          dept._count.employees > 0 ? "#8b5cf615" : "default",
                        color:
                          dept._count.employees > 0 ? "#8b5cf6" : "inherit",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(dept)}
                      sx={{ mr: 1, color: "primary.main" }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDelete(dept.id, dept._count.employees)
                      }
                    >
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingDept ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, py: 1 }}
            >
              <TextField
                label="Department Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. OPERATIONS"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Briefly describe the department's responsibilities"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={handleCloseDialog}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 3,
              }}
            >
              {submitting ? "Saving..." : editingDept ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
