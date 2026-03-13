"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  AccountBalance as BankIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

export default function CompanyDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [details, setDetails] = useState({
    address: "",
    phone: "",
    email: "",
    website: "",
    bankAccountNumber: "",
    bankAccountName: "",
    bankName: "",
  });

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await fetch("/api/settings/company");
      if (!response.ok) throw new Error("Failed to fetch company details");
      const data = await response.json();
      if (data && data.id) {
        setDetails(data);
      }
    } catch (err) {
      setError("Failed to load company details. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update company details");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Company Details
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Manage your company's public information and billing details.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* General Information */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                // bgcolor: "rgba(30, 41, 59, 0.5)",

                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1.5 }}
              >
                {/* <BusinessIcon sx={{ color: "#3B82F6" }} /> */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  General Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Address"
                    name="address"
                    value={details.address}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={2}
                    required
                    // sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={details.phone}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <PhoneIcon
                          sx={{ color: "#64748B", mr: 1, fontSize: 20 }}
                        />
                      ),
                    }}
                    // sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={details.email}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <EmailIcon
                          sx={{ color: "#64748B", mr: 1, fontSize: 20 }}
                        />
                      ),
                    }}
                    // sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={details.website}
                    onChange={handleChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <LanguageIcon
                          sx={{ color: "#64748B", mr: 1, fontSize: 20 }}
                        />
                      ),
                    }}
                    // sx={inputStyles}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Banking Information */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                // bgcolor: "rgba(30, 41, 59, 0.5)",
                borderRadius: "12px",
                border: "1px solid  #e2e8f0",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1.5 }}
              >
                {/* <BankIcon sx={{ color: "#10B981" }} /> */}

                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Banking Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bank Account Name"
                    name="bankAccountName"
                    value={details.bankAccountName}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    // sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bank Account Number"
                    name="bankAccountNumber"
                    value={details.bankAccountNumber}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    // sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    name="bankName"
                    value={details.bankName}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    // sx={inputStyles}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} color="inherit" /> : <></>
              }
              sx={{
                fontWeight: "bold",
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: "12px" }}
        >
          Company details updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
