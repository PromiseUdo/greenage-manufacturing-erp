// app/(admin)/sales/store/dispatches/new/page.tsx

"use client";

import { useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import StoreDispatchForm from "@/components/store/store-dispatch-form";
import { StoreDispatchFormData } from "@/types/store";

export default function CreateStoreDispatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: StoreDispatchFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create dispatch");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/sales/store/dispatches");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Create Store Dispatch
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: 14 }}
      >
        Dispatch finished goods from the store to a customer
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Dispatch created successfully! Stock updated. Redirecting...
        </Alert>
      )}

      <StoreDispatchForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </Box>
  );
}
