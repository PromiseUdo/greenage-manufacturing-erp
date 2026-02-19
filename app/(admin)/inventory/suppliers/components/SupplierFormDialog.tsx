import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Payment as PaymentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { SupplierFormData } from "@/types/inventory";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  paymentTerms: string | null;
}

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SupplierFormData) => Promise<void>;
  supplier?: Supplier | null;
  fullScreen?: boolean;
}

export default function SupplierFormDialog({
  open,
  onClose,
  onSave,
  supplier,
  fullScreen,
}: SupplierFormDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>();

  useEffect(() => {
    if (open) {
      if (supplier) {
        reset({
          name: supplier.name,
          contactPerson: supplier.contactPerson || "",
          email: supplier.email || "",
          phone: supplier.phone,
          address: supplier.address || "",
          paymentTerms: supplier.paymentTerms || "",
        });
      } else {
        reset({
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          paymentTerms: "",
        });
      }
    }
  }, [open, supplier, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullScreen={fullScreen}>
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
            {supplier
              ? "Update supplier information below"
              : "Enter supplier details to add to your system"}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Supplier name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Supplier Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Person"
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                rules={{ required: "Phone is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    fullWidth
                    required
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    fullWidth
                    multiline
                    rows={2.5}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{ alignSelf: "flex-start", mt: 1.5 }}
                        >
                          <LocationOnIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="paymentTerms"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Payment Terms"
                    fullWidth
                    placeholder="e.g. Net 30, 50% Advance"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PaymentIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              bgcolor: "#0F172A",
              color: "#fff",
              px: 4,
              "&:hover": {
                bgcolor: "#1E293B",
              },
            }}
          >
            {isSubmitting ? "Saving..." : "Save Supplier"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
