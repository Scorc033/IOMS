"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

export default function EditSupplierPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}>
      <EditSupplierContent />
    </Suspense>
  );
}

function EditSupplierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setServerError("Supplier not found");
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const res = await apiFetch(`/api/suppliers/${id}`);
        if (!res.ok) throw new Error("Supplier not found");
        const data = await res.json();
        setFormData({
          name: data.name,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
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
      setServerError("Supplier not found");
      return;
    }
    setErrors({});
    setServerError(null);

    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Supplier name is required";
    if (!formData.contactPerson.trim()) errs.contactPerson = "Contact person is required";
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Invalid email format";
    }
    if (!formData.phone.trim()) errs.phone = "Phone number is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update supplier");
      }

      router.push(`/suppliers/detail/?id=${id}`);
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
          href={`/suppliers/detail/?id=${id}`}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Supplier</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update supplier profile and contact credentials.</p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-5 transition-colors">
        <FormField label="Supplier / Company Name" error={errors.name} required>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </FormField>

        <FormField label="Contact Person" error={errors.contactPerson} required>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Email Address" error={errors.email} required>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="Phone Number" error={errors.phone} required>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
          <Link
            href={`/suppliers/detail/?id=${id}`}
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
            {submitting ? "Updating..." : "Update Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
