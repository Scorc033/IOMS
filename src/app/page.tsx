"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Download,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { downloadDemoBackup, isDemoData } from "@/lib/demo-store";

interface DashboardData {
  metrics: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockCount: number;
    pendingOrders: number;
  };
  lowStockProducts: Array<{
    id: number;
    sku: string;
    name: string;
    category: string;
    stockQuantity: number;
    reorderLevel: number;
    costPrice: number;
    supplier: { id: number; name: string };
  }>;
  recentMovements: Array<{
    id: number;
    changeAmount: number;
    reason: string;
    referenceId: string | null;
    createdAt: string;
    product: { id: number; sku: string; name: string };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleBackup = async () => {
    setBackupError(null);
    try {
      const res = await apiFetch("/api/backup");
      if (!res.ok) throw new Error("Could not load a backup of your cloud data.");
      const backupData: unknown = await res.json();
      if (!isDemoData(backupData)) {
        throw new Error("The cloud inventory has an unsupported data format.");
      }
      downloadDemoBackup(backupData);
    } catch (backupRequestError: unknown) {
      setBackupError(getErrorMessage(backupRequestError));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading inventory metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-medium mb-4">{error || "Failed to load dashboard"}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, lowStockProducts, recentMovements } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Inventory & Operations Overview
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time inventory levels, reorder alerts, and audit feed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/orders/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
          <button
            type="button"
            onClick={() => void handleBackup()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm transition"
            title="Download a backup of this browser's demo data"
          >
            <Download className="w-4 h-4" />
            Backup Data
          </button>
        </div>
      </div>
      {backupError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {backupError}
        </p>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Products"
          value={metrics.totalProducts}
          icon={<Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          color="indigo"
        />
        <KPICard
          title="Total Inventory Value"
          value={formatCurrency(metrics.totalInventoryValue)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          color="emerald"
        />
        <KPICard
          title="Low-Stock Alerts"
          value={metrics.lowStockCount}
          icon={<AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          color={metrics.lowStockCount > 0 ? "amber" : "gray"}
          trend={metrics.lowStockCount > 0 ? "Action required" : "Healthy"}
        />
        <KPICard
          title="Pending Orders"
          value={metrics.pendingOrders}
          icon={<Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          color="blue"
        />
      </div>

      {/* Low-Stock Reorder Alerts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Low-Stock Reorder Alerts</h2>
            <span className="text-xs bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full ml-1">
              {lowStockProducts.length} items
            </span>
          </div>
          <Link
            href="/products?lowStock=true"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            View all products &rarr;
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
            <p className="font-medium text-gray-800 dark:text-gray-200">All inventory levels healthy</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">No products are currently at or below their reorder threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-center">Current Stock</th>
                  <th className="px-5 py-3 text-center">Reorder Level</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lowStockProducts.map((p) => {
                  const status = getStockStatus(p.stockQuantity, p.reorderLevel);
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/40 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/products/detail/?id=${p.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.sku}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{p.category}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-semibold text-red-600 dark:text-red-400 text-base">{p.stockQuantity}</span>
                        <div className="mt-0.5">
                          <StatusBadge label={status.label} color={status.color} bgColor={status.bgColor} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-gray-600 dark:text-gray-300">
                        {p.reorderLevel}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        <Link
                          href={`/suppliers/detail/?id=${p.supplier.id}`}
                          className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 underline"
                        >
                          {p.supplier.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/orders/new?restock=${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Create Restock Order
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

      {/* Recent Stock Movements Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Stock Movements (Audit Trail)</h2>
          </div>
          <Link
            href="/stock-movements"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            Full audit log &rarr;
          </Link>
        </div>

        {recentMovements.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No stock movements recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-center">Change</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentMovements.map((m) => {
                  const isPositive = m.changeAmount > 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(m.createdAt)}</td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/products/detail/?id=${m.product.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {m.product.name}
                        </Link>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({m.product.sku})</span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
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
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {m.referenceId || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
