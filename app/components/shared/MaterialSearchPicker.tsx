"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export function MaterialSearchPicker({
  onAdd,
  alreadyAdded,
}: {
  onAdd: (material: any) => void;
  alreadyAdded: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/inventory/materials?search=${encodeURIComponent(query)}&limit=10`,
        );
        const data = await res.json();
        setResults(data.materials || []);
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = (mat: any) => {
    onAdd(mat);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search material name or part #…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searching ? <CircularProgress size={14} /> : <SearchIcon />}
            </InputAdornment>
          ),
        }}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
      {open && results.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            zIndex: 1000,
            width: "100%",
            mt: 0.5,
            borderRadius: 2,
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          <List dense disablePadding>
            {results.map((mat) => {
              const isAdded = alreadyAdded.includes(mat.id);
              return (
                <ListItem
                  key={mat.id}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input onblur from firing before selection
                    if (!isAdded) handleSelect(mat);
                  }}
                  sx={{
                    cursor: isAdded ? "not-allowed" : "pointer",
                    opacity: isAdded ? 0.5 : 1,
                    "&:hover": {
                      bgcolor: isAdded ? "transparent" : "action.hover",
                    },
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    px: 2,
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {mat.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: mat.currentStock > 0 ? "#16A34A" : "#DC2626",
                              fontWeight: 600,
                            }}
                          >
                            {mat.currentStock} {mat.unit} in stock
                          </Typography>
                          {isAdded && (
                            <Chip
                              label="Added"
                              size="small"
                              sx={{ height: 16, fontSize: "0.6rem" }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={`${mat.partNumber} · ${mat.category?.replace(/_/g, " ")} · ${mat.unit}`}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
