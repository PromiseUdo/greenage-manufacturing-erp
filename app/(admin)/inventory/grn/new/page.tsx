// src/app/dashboard/inventory/grn/new/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import GRNForm from "@/components/inventory/grn-form";
import { GRNFormData, GRNItemInput } from "@/types/inventory";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

function CreateGRNContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("supplierId") || "";
  const poId = searchParams.get("poId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Prefill state from PO
  const [prefillReady, setPrefillReady] = useState(!poId); // ready immediately if no poId
  const [defaultItems, setDefaultItems] = useState<GRNItemInput[]>([]);
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    if (!poId) return;

    const fetchPO = async () => {
      try {
        const res = await fetch(`/api/inventory/purchase-orders/${poId}`);
        if (!res.ok) throw new Error("Failed to fetch purchase order");
        const po = await res.json();

        // Check sessionStorage for specific received items (partial receiving)
        const prefillKey = `grn-prefill-${poId}`;
        const storedPrefill = sessionStorage.getItem(prefillKey);

        let grnItems: GRNItemInput[];

        if (storedPrefill) {
          // Use the specific items that were selected during partial receiving
          const selectedItems = JSON.parse(storedPrefill) as {
            materialId: string;
            quantity: number;
          }[];
          grnItems = selectedItems.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            batchNumber: "",
            expiryDate: undefined,
            supplierBatchNo: "",
          }));
          // Clean up sessionStorage
          sessionStorage.removeItem(prefillKey);
        } else {
          // Fall back to using receivedItems from PO, or full PO items
          const receivedItemsArr = Array.isArray(po.receivedItems)
            ? po.receivedItems
            : [];
          if (receivedItemsArr.length > 0) {
            // Aggregate received quantities by materialId
            const receivedMap: Record<string, number> = {};
            receivedItemsArr.forEach((r: any) => {
              receivedMap[r.materialId] =
                (receivedMap[r.materialId] || 0) + (r.receivedQty || 0);
            });
            grnItems = Object.entries(receivedMap).map(
              ([materialId, quantity]) => ({
                materialId,
                quantity,
                batchNumber: "",
                expiryDate: undefined,
                supplierBatchNo: "",
              }),
            );
          } else {
            // No receiving data — use full PO items
            const poItems = Array.isArray(po.items) ? po.items : [];
            grnItems = poItems.map((item: any) => ({
              materialId: item.materialId || "",
              quantity: item.quantity || 0,
              batchNumber: "",
              expiryDate: undefined,
              supplierBatchNo: "",
            }));
          }
        }

        if (grnItems.length > 0) {
          setDefaultItems(grnItems);
        }
        if (po.poNumber) {
          setPoNumber(po.poNumber);
        }
      } catch (err: any) {
        console.error("Error fetching PO for prefill:", err);
      } finally {
        setPrefillReady(true);
      }
    };

    fetchPO();
  }, [poId]);

  const handleSubmit = async (data: GRNFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inventory/grn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create GRN");
      }

      // If we came from a PO, link the GRN to it
      if (poId && responseData.id) {
        await fetch(`/api/inventory/purchase-orders/${poId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grnId: responseData.id }),
        }).catch(() => {
          console.error("Failed to link GRN to PO");
        });
      }

      setSuccess(true);
      setTimeout(() => {
        if (poId && supplierId) {
          router.push(`/inventory/suppliers/${supplierId}/sourcing/${poId}`);
        } else {
          router.push("/inventory/grn");
        }
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

  if (!prefillReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600}>
        Create Goods Received Note (GRN)
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: 14 }}
      >
        Record receipt of materials from suppliers and update inventory stock
        {poNumber && (
          <>
            {" "}
            — Pre-filled from <strong>{poNumber}</strong>
          </>
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          GRN created successfully! Inventory updated. Redirecting...
        </Alert>
      )}

      <GRNForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        defaultSupplierId={supplierId}
        defaultItems={defaultItems.length > 0 ? defaultItems : undefined}
      />
    </Box>
  );
}

export default function CreateGRNPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <CreateGRNContent />
    </Suspense>
  );
}
