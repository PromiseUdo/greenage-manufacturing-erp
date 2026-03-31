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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  _count: { users: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/settings/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (roleId: string, usersCount: number) => {
    if (usersCount > 0) {
      alert("Cannot delete role assigned to users.");
      return;
    }
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        const res = await fetch(`/api/settings/roles/${roleId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchRoles();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete role");
        }
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Roles & Permissions
        </Typography>
        {isSuperAdmin && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => router.push("/settings/roles/new")}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
          >
            Add Role
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: "12px" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Role Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Permissions Count</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Users Assigned</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{role.name}</Typography>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${role.permissions.length} permissions`}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={role._count.users > 0 ? "primary" : "default"}
                      label={`${role._count.users} users`}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {isSuperAdmin && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/settings/roles/${role.id}`)}
                          sx={{ mr: 1 }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(role.id, role._count.users)}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
