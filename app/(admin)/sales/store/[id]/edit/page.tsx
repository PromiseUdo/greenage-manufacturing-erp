// app/(admin)/sales/store/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { StoreItemFormData, StoreItemWithRelations } from "@/types/store";
import StoreForm from "@/components/store/store-form";
import { format } from "date-fns";

export default function EditStoreItemPage() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [storeItem, setStoreItem] = useState<StoreItemWithRelations | null>(
    null,
  );
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; productNumber: string }>
  >([]);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [itemRes, productsRes] = await Promise.all([
        fetch(`/api/store/${params.id}`),
        fetch("/api/products?limit=1000"),
      ]);

      if (!itemRes.ok) {
        throw new Error("Store item not found");
      }

      const [itemData, productsData] = await Promise.all([
        itemRes.json(),
        productsRes.json(),
      ]);

      setStoreItem(itemData);
      setProducts(productsData.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: StoreItemFormData) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/store/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update store item");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/sales/store/${params.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/sales/store/${params.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !storeItem) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Format dates for form inputs (YYYY-MM-DD format)
  const formatDateForInput = (date: string | Date | null | undefined) => {
    if (!date) return "";
    try {
      return format(new Date(date), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Edit Store Item
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: "14px" }}
      >
        Update store item information - Item Number:{" "}
        <strong>{storeItem?.itemNumber}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Store item updated successfully! Redirecting...
        </Alert>
      )}

      {storeItem && (
        <StoreForm
          initialData={{
            itemNumber: storeItem.itemNumber,
            name: storeItem.name,
            productId: storeItem.productId ?? undefined,
            category: storeItem.category,
            quantity: storeItem.quantity,
            unit: storeItem.unit,
            location: storeItem.location || "",
            condition: storeItem.condition,
            unitPrice: storeItem.unitPrice || undefined,
            batchNumber: storeItem.batchNumber || "",
            productionDate: formatDateForInput(storeItem.productionDate),
            warrantyExpiry: formatDateForInput(storeItem.warrantyExpiry),
            notes: storeItem.notes || "",
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
          products={products}
        />
      )}
    </Box>
  );
}
