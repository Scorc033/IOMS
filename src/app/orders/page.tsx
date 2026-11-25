"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, ShoppingCart, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate, getOrderStatusStyle } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Order {
  id: number;
  orderNumber: string;
  orderType: string;
  status: string;
  customerOrSupplierName: string;
  totalAmount: number;
  createdAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    product: { name: string; sku: string };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiFetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [typeFilter, statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerOrSupplierName.toLowerCase().includes(term) ||
      o.orderItems.some((item) => item.product.name.toLowerCase().includes(term) || item.product.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Orders Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Process Inbound Purchases (restocking) and Outbound Sales (dispatch) with transactional stock safety.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, party name, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="INBOUND_PURCHASE">Inbound Purchases</option>
            <option value="OUTBOUND_SALE">Outbound Sales</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 dark:text-gray-200">No orders found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create an inbound or outbound order to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Customer / Supplier</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredOrders.map((o) => {
                  const statusStyle = getOrderStatusStyle(o.status);
                  const isInbound = o.orderType === "INBOUND_PURCHASE";
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                        <Link href={`/orders/detail/?id=${o.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isInbound
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          }`}
                        >
                          {isInbound ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isInbound ? "Purchase" : "Sale"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                        {o.customerOrSupplierName}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {o.orderItems.length} item(s) (
                        {o.orderItems.reduce((acc, i) => acc + i.quantity, 0)} units)
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge
                          label={o.status}
                          color={statusStyle.color}
                          bgColor={statusStyle.bgColor}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/orders/detail/?id=${o.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition"
                        >
                          Manage &rarr;
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
    </div>
  );
}
