"use client";

import { getErrorMessage } from "@/lib/errors";
import { apiFetch } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, RefreshCw, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  sku: string;
  name: string;
  costPrice: number;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplier: { id: number; name: string };
}

interface LineItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restockProductId = searchParams.get("restock");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [orderType, setOrderType] = useState<"INBOUND_PURCHASE" | "OUTBOUND_SALE">("OUTBOUND_SALE");
  const [customerOrSupplierName, setCustomerOrSupplierName] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data: Product[] = await res.json();
        setProducts(data);

        if (restockProductId) {
          const target = data.find((p) => p.id === parseInt(restockProductId, 10));
          if (target) {
            setOrderType("INBOUND_PURCHASE");
            setCustomerOrSupplierName(target.supplier.name);
            const neededQty = Math.max(target.reorderLevel * 2 - target.stockQuantity, 10);
            setItems([
              {
                productId: target.id,
                quantity: neededQty,
                unitPrice: target.costPrice,
              },
            ]);
            return;
          }
        }

        if (data.length > 0) {
          setItems([
            {
              productId: data[0].id,
              quantity: 1,
              unitPrice: data[0].unitPrice,
            },
          ]);
        }
      } catch (err: unknown) {
        setServerError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [restockProductId]);

  const handleTypeChange = (newType: "INBOUND_PURCHASE" | "OUTBOUND_SALE") => {
    setOrderType(newType);
    setItems((prev) =>
      prev.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        return {
          ...item,
          unitPrice: newType === "INBOUND_PURCHASE" ? prod.costPrice : prod.unitPrice,
        };
      })
    );
  };

  const handleProductSelect = (index: number, newProductId: number) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: newProductId,
        unitPrice: orderType === "INBOUND_PURCHASE" ? prod.costPrice : prod.unitPrice,
      };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: Math.max(1, qty) };
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unitPrice: Math.max(0, price) };
      return copy;
    });
  };

  const addItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        quantity: 1,
        unitPrice: orderType === "INBOUND_PURCHASE" ? defaultProd.costPrice : defaultProd.unitPrice,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const errs: Record<string, string> = {};
    if (!customerOrSupplierName.trim()) {
      errs.name = orderType === "INBOUND_PURCHASE" ? "Supplier name is required" : "Customer name is required";
    }
    if (items.length === 0) {
      errs.items = "At least one line item is required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          customerOrSupplierName: customerOrSupplierName.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      router.push(`/orders/detail/?id=${data.id}`);
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

  const grandTotal = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Order</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create an inbound restocking order from a vendor or an outbound sales dispatch order.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type Toggle Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 transition-colors">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">Select Order Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange("OUTBOUND_SALE")}
              className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                orderType === "OUTBOUND_SALE"
                  ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-lg">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Outbound Sale</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ship items to customers. Decreases stock upon completion.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("INBOUND_PURCHASE")}
              className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                orderType === "INBOUND_PURCHASE"
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Inbound Purchase (Restock)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Receive items from suppliers. Increases stock upon completion.
                </p>
              </div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {orderType === "INBOUND_PURCHASE" ? "Supplier / Vendor Name *" : "Customer / Client Name *"}
            </label>
            <input
              type="text"
              value={customerOrSupplierName}
              onChange={(e) => setCustomerOrSupplierName(e.target.value)}
              placeholder={
                orderType === "INBOUND_PURCHASE"
                  ? "e.g., Apex Electronics Ltd"
                  : "e.g., Acme Corp / Jane Doe"
              }
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Order Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          {items.map((item, idx) => {
            const subtotal = item.quantity * item.unitPrice;
            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-center p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Available: {p.stockQuantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2 text-right">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subtotal</label>
                  <p className="text-sm font-bold text-gray-900 dark:text-white py-1">{formatCurrency(subtotal)}</p>
                </div>

                <div className="col-span-1 text-right">
                  <label className="block text-xs font-medium text-transparent mb-1">_</label>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Grand Total Bar */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Order Grand Total:</span>
            <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/orders"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Creating Order..." : "Create Order (Pending)"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" /></div>}>
      <OrderForm />
    </Suspense>
  );
}
