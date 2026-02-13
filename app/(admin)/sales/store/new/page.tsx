// app/(admin)/sales/store/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { StoreItemFormData } from "@/types/store";
import StoreForm from "@/components/store/store-form";

export default function CreateStoreItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; productNumber: string }>
  >([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?limit=1000");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (data: StoreItemFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create store item");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/sales/store");
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
        Add New Store Item
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: 14 }}
      >
        Add a finished product to the store
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Store item created successfully! Redirecting...
        </Alert>
      )}

      <StoreForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        products={products}
      />
    </Box>
  );
}
