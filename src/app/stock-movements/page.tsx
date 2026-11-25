"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw, ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StockMovement {
  id: number;
  changeAmount: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
  product: {
    id: number;
    sku: string;
    name: string;
    category: string;
  };
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState("");

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reasonFilter) params.set("reason", reasonFilter);

      const res = await apiFetch(`/api/stock-movements?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load stock movements");
      const data = await res.json();
      setMovements(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [reasonFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Stock Movements Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Immutable transaction log of all inbound purchases, outbound sales, and stock adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Movement Types</option>
            <option value="ORDER">Orders (Sales & Inbound)</option>
            <option value="RESTOCK">Restock / Initial</option>
            <option value="ADJUSTMENT">Manual Adjustments</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Loading audit feed...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 dark:text-gray-200">No stock movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-center">Change Amount</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Reference / Order #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {movements.map((m) => {
                  const isPositive = m.changeAmount > 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                        <Link href={`/products/detail/?id=${m.product.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                          {m.product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {m.product.sku}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {m.product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded text-xs ${
                            isPositive
                              ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                              : "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${m.changeAmount}` : m.changeAmount} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded">
                          {m.reason}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-600 dark:text-gray-400">
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
