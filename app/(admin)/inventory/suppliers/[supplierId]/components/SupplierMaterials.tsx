"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  styled,
  tableCellClasses,
} from "@mui/material";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#0F172A",
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    padding: "8px 16px",
    borderBottom: "none",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: "14px 16px",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    transition: "background-color 0.2s ease",
  },
  "&:last-child td": {
    borderBottom: 0,
  },
}));

interface AggregatedMaterial {
  materialId: string;
  name: string;
  partNumber: string;
  unit: string;
  totalReceived: number;
  batchCount: number;
  lastReceivedDate: string;
}

export default function SupplierMaterials({
  supplierId,
}: {
  supplierId: string;
}) {
  const [materials, setMaterials] = useState<AggregatedMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all GRNs for this supplier with batches
      const params = new URLSearchParams({
        supplierId,
        limit: "1000",
      });

      const res = await fetch(`/api/inventory/grn?${params}`);
      const data = await res.json();
      const grns = data?.grns || [];

      // Aggregate materials from batches across all GRNs
      const materialMap = new Map<string, AggregatedMaterial>();

      for (const grn of grns) {
        const batches = grn.batches || [];
        for (const batch of batches) {
          if (!batch.material) continue;
          const mid = batch.materialId || batch.material?.id;
          if (!mid) continue;

          const existing = materialMap.get(mid);
          if (existing) {
            existing.totalReceived += batch.quantity || 0;
            existing.batchCount += 1;
            // Track latest received date
            const batchDate = batch.receivedDate || grn.receivedDate;
            if (
              batchDate &&
              new Date(batchDate) > new Date(existing.lastReceivedDate)
            ) {
              existing.lastReceivedDate = batchDate;
            }
          } else {
            materialMap.set(mid, {
              materialId: mid,
              name: batch.material.name,
              partNumber: batch.material.partNumber || "—",
              unit: batch.material.unit || "—",
              totalReceived: batch.quantity || 0,
              batchCount: 1,
              lastReceivedDate: batch.receivedDate || grn.receivedDate,
            });
          }
        }
      }

      setMaterials(
        Array.from(materialMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } catch (error) {
      console.error("Error fetching supplier materials:", error);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (materials.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No materials received from this supplier yet.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Materials will appear here once a GRN has been created for this
          supplier.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 0,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Material</StyledTableCell>
                <StyledTableCell>Part Number</StyledTableCell>
                <StyledTableCell>Unit</StyledTableCell>
                <StyledTableCell align="right">Total Received</StyledTableCell>
                <StyledTableCell align="center">Batches</StyledTableCell>
                <StyledTableCell>Last Received</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((mat) => (
                <StyledTableRow key={mat.materialId}>
                  <StyledTableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {mat.name}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={mat.partNumber}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>{mat.unit}</StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: "#16a34a" }}
                    >
                      {mat.totalReceived.toLocaleString()}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={mat.batchCount}
                      size="small"
                      sx={{
                        minWidth: 36,
                        bgcolor: "#e3f2fd",
                        color: "#1976d2",
                        fontWeight: 600,
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" color="text.secondary">
                      {mat.lastReceivedDate
                        ? new Date(mat.lastReceivedDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
