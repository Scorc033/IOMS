"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  History,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface StockMovement {
  id: number;
  changeAmount: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

interface ProductDetail {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplier: { id: number; name: string; contactPerson: string; email: string };
  stockMovements: StockMovement[];
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProduct = async () => {
    if (!id) {
      setError("Product not found");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      setProduct(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    } else {
      setError("Product not found");
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      router.push("/products");
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <p className="text-red-700 dark:text-red-300 font-medium mb-3">{error || "Product not found"}</p>
        <Link href="/products" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity, product.reorderLevel);
  const margin = product.unitPrice > 0 ? ((product.unitPrice - product.costPrice) / product.unitPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
              <StatusBadge label={stockStatus.label} color={stockStatus.color} bgColor={stockStatus.bgColor} />
            </div>
            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">SKU: {product.sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/orders/new?restock=${product.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Restock
          </Link>
          <Link
            href={`/products/edit/?id=${product.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 shadow-sm transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
        </div>
      )}

      {/* Product Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Current Stock</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{product.stockQuantity}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reorder threshold: {product.reorderLevel} units</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Selling Price</p>
          <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{formatCurrency(product.unitPrice)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Margin: {Math.round(margin)}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cost Price</p>
          <p className="text-3xl font-extrabold text-gray-700 dark:text-gray-300 mt-1">{formatCurrency(product.costPrice)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inventory value: {formatCurrency(product.stockQuantity * product.costPrice)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Primary Supplier</p>
          <Link
            href={`/suppliers/detail/?id=${product.supplier.id}`}
            className="text-base font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block mt-1 underline"
          >
            {product.supplier.name}
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.supplier.contactPerson}</p>
        </div>
      </div>

      {/* Stock Movement Audit Log */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Movement Audit History</h2>
        </div>

        {product.stockMovements.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No stock movements recorded for this item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-center">Change</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {product.stockMovements.map((m) => {
                  const isPositive = m.changeAmount > 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(m.createdAt)}</td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded text-xs ${
                            isPositive
                              ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                              : "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isPositive ? `+${m.changeAmount}` : m.changeAmount}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                          {m.reason}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{m.referenceId || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${product.name}? If it appears in past orders, the deletion will be restricted.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Product"}
        variant="danger"
      />
    </div>
  );
}
