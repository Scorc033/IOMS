"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

interface Supplier {
  id: number;
  name: string;
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}>
      <EditProductContent />
    </Suspense>
  );
}

function EditProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    unitPrice: "",
    costPrice: "",
    stockQuantity: "",
    reorderLevel: "",
    supplierId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setServerError("Product not found");
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, supRes] = await Promise.all([
          apiFetch(`/api/products/${id}`),
          apiFetch("/api/suppliers"),
        ]);

        if (!prodRes.ok) throw new Error("Product not found");
        const prod = await prodRes.json();
        const sups = await supRes.json();

        setSuppliers(sups);
        setFormData({
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          unitPrice: String(prod.unitPrice),
          costPrice: String(prod.costPrice),
          stockQuantity: String(prod.stockQuantity),
          reorderLevel: String(prod.reorderLevel),
          supplierId: String(prod.supplierId),
        });
      } catch (err: unknown) {
        setServerError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setServerError("Product not found");
      return;
    }
    setErrors({});
    setServerError(null);

    const errs: Record<string, string> = {};
    if (!formData.sku.trim()) errs.sku = "SKU is required";
    if (!formData.name.trim()) errs.name = "Product name is required";
    if (!formData.category.trim()) errs.category = "Category is required";
    if (!formData.unitPrice || isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0) {
      errs.unitPrice = "Valid unit price required";
    }
    if (!formData.costPrice || isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0) {
      errs.costPrice = "Valid cost price required";
    }
    if (isNaN(Number(formData.stockQuantity)) || Number(formData.stockQuantity) < 0) {
      errs.stockQuantity = "Stock quantity must be ≥ 0";
    }
    if (isNaN(Number(formData.reorderLevel)) || Number(formData.reorderLevel) < 0) {
      errs.reorderLevel = "Reorder level must be ≥ 0";
    }
    if (!formData.supplierId) errs.supplierId = "Supplier is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: formData.sku.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category.trim(),
          unitPrice: parseFloat(formData.unitPrice),
          costPrice: parseFloat(formData.costPrice),
          stockQuantity: parseInt(formData.stockQuantity, 10),
          reorderLevel: parseInt(formData.reorderLevel, 10),
          supplierId: parseInt(formData.supplierId, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      router.push(`/products/detail/?id=${id}`);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/products/detail/?id=${id}`}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Product</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update product specifications, prices, or inventory levels.</p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-5 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="SKU" error={errors.sku} required>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="Category" error={errors.category} required>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>
        </div>

        <FormField label="Product Name" error={errors.name} required>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </FormField>

        <FormField label="Primary Supplier" error={errors.supplierId} required>
          <select
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Cost Price (USD)" error={errors.costPrice} required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="Unit Selling Price (USD)" error={errors.unitPrice} required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Stock Quantity (Manual Adjustment will be logged)" error={errors.stockQuantity} required>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="Reorder Level Threshold" error={errors.reorderLevel} required>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
          <Link
            href={`/products/detail/?id=${id}`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
