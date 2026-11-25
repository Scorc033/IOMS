"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit, ExternalLink, AlertTriangle, RefreshCw, Package } from "lucide-react";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplier: { id: number; name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lowStock") === "true") {
      setLowStockOnly(true);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (lowStockOnly) params.set("lowStock", "true");

      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, lowStockOnly]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/products/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      setDeleteId(null);
      fetchProducts();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Products Catalog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage SKUs, categories, unit prices, and real-time stock levels.</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">{deleteError}</div>
          <button
            onClick={() => setDeleteError(null)}
            className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, product name, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
              lowStockOnly
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 dark:text-gray-200">No products found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Adjust filters or create your first product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Cost Price</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-center">Stock Level</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map((p) => {
                  const status = getStockStatus(p.stockQuantity, p.reorderLevel);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                        <Link href={`/products/detail/?id=${p.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500 dark:text-gray-400">{formatCurrency(p.costPrice)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(p.unitPrice)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-gray-900 dark:text-white mr-2">{p.stockQuantity}</span>
                        <StatusBadge label={status.label} color={status.color} bgColor={status.bgColor} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        <Link href={`/suppliers/detail/?id=${p.supplier.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">
                          {p.supplier.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <Link
                          href={`/products/detail/?id=${p.id}`}
                          className="inline-flex p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/products/edit/?id=${p.id}`}
                          className="inline-flex p-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteId(p.id);
                          }}
                          className="inline-flex p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? If it is referenced in past order records, deletion will be blocked by referential integrity rules."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Product"}
        variant="danger"
      />
    </div>
  );
}
