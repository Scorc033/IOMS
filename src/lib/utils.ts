import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function getStockStatus(stockQuantity: number, reorderLevel: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (stockQuantity === 0) {
    return { label: "Out of Stock", color: "text-red-700", bgColor: "bg-red-100" };
  }
  if (stockQuantity <= reorderLevel) {
    return { label: "Low Stock", color: "text-amber-700", bgColor: "bg-amber-100" };
  }
  return { label: "In Stock", color: "text-emerald-700", bgColor: "bg-emerald-100" };
}

export function getOrderStatusStyle(status: string): {
  color: string;
  bgColor: string;
} {
  switch (status) {
    case "PENDING":
      return { color: "text-amber-700", bgColor: "bg-amber-100" };
    case "COMPLETED":
      return { color: "text-emerald-700", bgColor: "bg-emerald-100" };
    case "CANCELLED":
      return { color: "text-red-700", bgColor: "bg-red-100" };
    default:
      return { color: "text-gray-700", bgColor: "bg-gray-100" };
  }
}

export function getOrderTypeLabel(type: string): string {
  return type === "INBOUND_PURCHASE" ? "Purchase (Inbound)" : "Sale (Outbound)";
}
