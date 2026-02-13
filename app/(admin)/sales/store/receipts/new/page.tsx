// app/(admin)/sales/store/receipts/new/page.tsx

"use client";

import { useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import StoreReceiptForm from "@/components/store/store-receipt-form";
import { StoreReceiptFormData } from "@/types/store";

export default function CreateStoreReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: StoreReceiptFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create store receipt");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/sales/store/receipts");
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
        Create Store Receipt (SRN)
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: 14 }}
      >
        Record receipt of finished products from production and update store
        stock
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Store receipt created successfully! Stock updated. Redirecting...
        </Alert>
      )}

      <StoreReceiptForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </Box>
  );
}
