import { z } from "zod";

// ─── Supplier Schemas ───
export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  contactPerson: z.string().min(1, "Contact person is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(50),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// ─── Product Schemas ───
export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  unitPrice: z.coerce.number().min(0, "Unit price must be ≥ 0"),
  costPrice: z.coerce.number().min(0, "Cost price must be ≥ 0"),
  stockQuantity: z.coerce.number().int().min(0, "Stock quantity must be ≥ 0").default(0),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level must be ≥ 0").default(10),
  supplierId: z.coerce.number().int().positive("Supplier is required"),
});

export type ProductInput = z.infer<typeof productSchema>;

// ─── Order Schemas ───
export const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive("Product is required"),
  quantity: z.coerce.number().int().positive("Quantity must be > 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be ≥ 0"),
});

export const orderSchema = z.object({
  orderType: z.enum(["INBOUND_PURCHASE", "OUTBOUND_SALE"]),
  customerOrSupplierName: z.string().min(1, "Customer/Supplier name is required").max(200),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
