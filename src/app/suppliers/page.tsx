"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit, ExternalLink, AlertCircle, RefreshCw, Truck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  _count?: { products: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/suppliers?search=${encodeURIComponent(search)}` : "/api/suppliers";
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/suppliers/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete supplier");
      }
      setDeleteId(null);
      fetchSuppliers();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Suppliers Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage vendor profiles, contact information, and supplied products.</p>
        </div>
        <Link
          href="/suppliers/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </Link>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">{deleteError}</div>
          <button
            onClick={() => setDeleteError(null)}
            className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by supplier name, contact, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Loading suppliers...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 dark:text-gray-200">No suppliers found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or add a new supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Supplier Name</th>
                  <th className="px-5 py-3">Contact Person</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-center">Products</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                      <Link href={`/suppliers/detail/?id=${s.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{s.contactPerson}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{s.email}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{s.phone}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-full">
                        {s._count?.products ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        href={`/suppliers/detail/?id=${s.id}`}
                        className="inline-flex p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="View Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/suppliers/edit/?id=${s.id}`}
                        className="inline-flex p-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                        title="Edit Supplier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteId(s.id);
                        }}
                        className="inline-flex p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? Note: If this supplier has linked products, deletion will be blocked by referential integrity rules."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Supplier"}
        variant="danger"
      />
    </div>
  );
}
