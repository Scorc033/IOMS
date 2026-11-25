"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Mail, Phone, User, Package, Plus, RefreshCw, AlertCircle } from "lucide-react";
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
}

interface SupplierDetail {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
  products: Product[];
}

export default function SupplierDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}>
      <SupplierDetailContent />
    </Suspense>
  );
}

function SupplierDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSupplier = async () => {
    if (!id) {
      setError("Supplier not found");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/suppliers/${id}`);
      if (!res.ok) throw new Error("Supplier not found");
      const data = await res.json();
      setSupplier(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSupplier();
    } else {
      setError("Supplier not found");
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete supplier");
      router.push("/suppliers");
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

  if (error || !supplier) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <p className="text-red-700 dark:text-red-300 font-medium mb-3">{error || "Supplier not found"}</p>
        <Link href="/suppliers" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/suppliers"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{supplier.name}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Supplier ID #{supplier.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/suppliers/edit/?id=${supplier.id}`}
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
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
        </div>
      )}

      {/* Supplier Profile Info Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contact Person</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{supplier.contactPerson}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-lg shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Email Address</p>
            <a href={`mailto:${supplier.email}`} className="text-base font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 block">
              {supplier.email}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-lg shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Phone</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{supplier.phone}</p>
          </div>
        </div>
      </div>

      {/* Products Supplied Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products Supplied ({supplier.products.length})</h2>
          </div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Product for this Supplier
          </Link>
        </div>

        {supplier.products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm">No products currently linked to this supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Cost Price</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-center">Current Stock</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {supplier.products.map((p) => {
                  const status = getStockStatus(p.stockQuantity, p.reorderLevel);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3">
                        <Link href={`/products/detail/?id=${p.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.category}</td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(p.costPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(p.unitPrice)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-semibold text-gray-900 dark:text-white mr-2">{p.stockQuantity}</span>
                        <StatusBadge label={status.label} color={status.color} bgColor={status.bgColor} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/products/detail/?id=${p.id}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          View &rarr;
                        </Link>
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
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${supplier.name}? If there are active products linked, this request will be restricted.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Supplier"}
        variant="danger"
      />
    </div>
  );
}
