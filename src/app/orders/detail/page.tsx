"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate, getOrderStatusStyle, getOrderTypeLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: number;
    sku: string;
    name: string;
    supplier?: { id: number; name: string };
  };
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  orderType: string;
  status: string;
  customerOrSupplierName: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}>
      <OrderDetailContent />
    </Suspense>
  );
}

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrder = async () => {
    if (!id) {
      setActionError("Order not found");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    } else {
      setActionError("Order not found");
      setLoading(false);
    }
  }, [id]);

  const handleCompleteOrder = async () => {
    if (!id) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiFetch(`/api/orders/${id}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete order");
      }
      setActionSuccess(data.message || "Order completed and stock updated successfully.");
      setCompleteModalOpen(false);
      fetchOrder();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
      setCompleteModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiFetch(`/api/orders/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      setActionSuccess(data.message || "Order cancelled and stock movements reversed successfully.");
      setCancelModalOpen(false);
      fetchOrder();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
      setCancelModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <p className="text-red-700 dark:text-red-300 font-medium mb-3">Order not found</p>
        <Link href="/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const statusStyle = getOrderStatusStyle(order.status);
  const isInbound = order.orderType === "INBOUND_PURCHASE";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <StatusBadge label={order.status} color={statusStyle.color} bgColor={statusStyle.bgColor} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Created {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Transactional Action Buttons */}
        <div className="flex items-center gap-2">
          {order.status === "PENDING" && (
            <button
              onClick={() => {
                setActionError(null);
                setCompleteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Order
            </button>
          )}

          {order.status === "COMPLETED" && (
            <button
              onClick={() => {
                setActionError(null);
                setCancelModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition"
            >
              <XCircle className="w-4 h-4" />
              Cancel Completed Order
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">Transaction Failed & Rolled Back</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">{actionSuccess}</p>
        </div>
      )}

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Order Type</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isInbound
                  ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300"
                  : "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300"
              }`}
            >
              {isInbound ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {getOrderTypeLabel(order.orderType)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isInbound ? "Restocking stock" : "Sales shipment to customer"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {isInbound ? "Supplier" : "Customer"}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{order.customerOrSupplierName}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Amount</p>
          <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{formatCurrency(order.totalAmount)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Items Count</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
            {order.orderItems.reduce((acc, i) => acc + i.quantity, 0)} units
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{order.orderItems.length} unique SKU(s)</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {order.orderItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                    <Link href={`/products/detail/?id=${item.product.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                      {item.product.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {item.product.sku}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 font-semibold">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">
                  Total Order Value:
                </td>
                <td className="px-5 py-3 text-right text-indigo-700 dark:text-indigo-400 text-base">
                  {formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation Modals */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onConfirm={handleCompleteOrder}
        title="Complete Order & Update Inventory"
        message={
          isInbound
            ? "Completing this Inbound Purchase order will increase inventory levels and record RESTOCK audit movements. Proceed?"
            : "Completing this Outbound Sale order will validate sufficient stock, decrement inventory levels, and record ORDER audit movements. If stock is insufficient, the transaction will be rolled back. Proceed?"
        }
        confirmLabel={isProcessing ? "Processing..." : "Confirm & Complete"}
        variant="primary"
      />

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Completed Order"
        message={
          isInbound
            ? "Cancelling this completed Inbound Purchase will decrement inventory back to previous levels. It will fail if stock has already been depleted below the order quantity. Proceed?"
            : "Cancelling this completed Outbound Sale will restore items back to available inventory. Proceed?"
        }
        confirmLabel={isProcessing ? "Reversing..." : "Cancel Order & Reverse Stock"}
        variant="danger"
      />
    </div>
  );
}
