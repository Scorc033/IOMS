export interface DemoSupplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface DemoProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplierId: number;
  createdAt: string;
}

export interface DemoOrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DemoOrder {
  id: number;
  orderNumber: string;
  orderType: "INBOUND_PURCHASE" | "OUTBOUND_SALE";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerOrSupplierName: string;
  totalAmount: number;
  createdAt: string;
  orderItems: DemoOrderItem[];
}

export interface DemoStockMovement {
  id: number;
  productId: number;
  changeAmount: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

export interface DemoData {
  suppliers: DemoSupplier[];
  products: DemoProduct[];
  orders: DemoOrder[];
  stockMovements: DemoStockMovement[];
}

const STORAGE_KEY = "ioms-demo-data-v1";
const OWNER_KEY = "ioms-demo-owner-v1";

export function isDemoData(value: unknown): value is DemoData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.suppliers) &&
    Array.isArray(data.products) &&
    Array.isArray(data.orders) &&
    Array.isArray(data.stockMovements)
  );
}

export function createInitialData(): DemoData {
  const now = new Date();
  const createdAt = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  const suppliers: DemoSupplier[] = [
    {
      id: 1,
      name: "Apex Electronics Ltd",
      contactPerson: "Sarah Jenkins",
      email: "sarah.jenkins@apexelectronics.com",
      phone: "+1-555-0101",
      createdAt: createdAt(20_000),
    },
    {
      id: 2,
      name: "Global Components Inc",
      contactPerson: "David Chen",
      email: "d.chen@globalcomponents.com",
      phone: "+1-555-0102",
      createdAt: createdAt(18_000),
    },
    {
      id: 3,
      name: "Pinnacle Office Solutions",
      contactPerson: "Marcus Vance",
      email: "marcus@pinnacleoffice.com",
      phone: "+1-555-0104",
      createdAt: createdAt(16_000),
    },
  ];

  const products: DemoProduct[] = [
    {
      id: 1,
      sku: "ELEC-USBC-001",
      name: "Braided USB-C Cable (2m)",
      category: "Electronics",
      unitPrice: 19.99,
      costPrice: 6.5,
      stockQuantity: 110,
      reorderLevel: 25,
      supplierId: 1,
      createdAt: createdAt(12_000),
    },
    {
      id: 2,
      sku: "ELEC-WCHG-002",
      name: "Fast Wireless Charging Pad 15W",
      category: "Electronics",
      unitPrice: 34.99,
      costPrice: 14.2,
      stockQuantity: 45,
      reorderLevel: 20,
      supplierId: 1,
      createdAt: createdAt(11_000),
    },
    {
      id: 3,
      sku: "ELEC-BTAD-003",
      name: "Bluetooth 5.3 Audio Receiver",
      category: "Electronics",
      unitPrice: 24.5,
      costPrice: 9.8,
      stockQuantity: 8,
      reorderLevel: 15,
      supplierId: 2,
      createdAt: createdAt(10_000),
    },
    {
      id: 4,
      sku: "ELEC-PWBNK-005",
      name: "20,000mAh Power Bank PD 65W",
      category: "Electronics",
      unitPrice: 59.99,
      costPrice: 28.5,
      stockQuantity: 4,
      reorderLevel: 10,
      supplierId: 1,
      createdAt: createdAt(9_000),
    },
    {
      id: 5,
      sku: "OFFC-DSKM-102",
      name: "Waterproof Extended Desk Mat",
      category: "Office Supplies",
      unitPrice: 29.5,
      costPrice: 11.2,
      stockQuantity: 50,
      reorderLevel: 15,
      supplierId: 3,
      createdAt: createdAt(8_000),
    },
    {
      id: 6,
      sku: "OFFC-MONA-103",
      name: "Adjustable Single Monitor Arm",
      category: "Office Supplies",
      unitPrice: 79.99,
      costPrice: 38,
      stockQuantity: 5,
      reorderLevel: 12,
      supplierId: 3,
      createdAt: createdAt(7_000),
    },
    {
      id: 7,
      sku: "COMP-MECK-201",
      name: "RGB Mechanical Keyboard",
      category: "Computer Hardware",
      unitPrice: 89.99,
      costPrice: 42,
      stockQuantity: 28,
      reorderLevel: 10,
      supplierId: 2,
      createdAt: createdAt(6_000),
    },
    {
      id: 8,
      sku: "COMP-RAMD-204",
      name: "32GB DDR5 6000MHz RAM Kit",
      category: "Computer Hardware",
      unitPrice: 139.99,
      costPrice: 85,
      stockQuantity: 2,
      reorderLevel: 10,
      supplierId: 2,
      createdAt: createdAt(5_000),
    },
  ];

  const orders: DemoOrder[] = [
    {
      id: 1,
      orderNumber: "ORD-000001",
      orderType: "OUTBOUND_SALE",
      status: "COMPLETED",
      customerOrSupplierName: "Acme Enterprises Corp",
      totalAmount: 199.9,
      createdAt: createdAt(30),
      orderItems: [
        {
          id: 1,
          productId: 1,
          quantity: 10,
          unitPrice: 19.99,
          subtotal: 199.9,
        },
      ],
    },
    {
      id: 2,
      orderNumber: "ORD-000002",
      orderType: "INBOUND_PURCHASE",
      status: "PENDING",
      customerOrSupplierName: "Apex Electronics Ltd",
      totalAmount: 570,
      createdAt: createdAt(15),
      orderItems: [
        {
          id: 2,
          productId: 4,
          quantity: 20,
          unitPrice: 28.5,
          subtotal: 570,
        },
      ],
    },
    {
      id: 3,
      orderNumber: "ORD-000003",
      orderType: "OUTBOUND_SALE",
      status: "PENDING",
      customerOrSupplierName: "Solaria Creative Labs",
      totalAmount: 104.97,
      createdAt: createdAt(5),
      orderItems: [
        {
          id: 3,
          productId: 2,
          quantity: 3,
          unitPrice: 34.99,
          subtotal: 104.97,
        },
      ],
    },
  ];

  const stockMovements: DemoStockMovement[] = products.map((product) => ({
    id: product.id,
    productId: product.id,
    changeAmount: product.id === 1 ? 120 : product.stockQuantity,
    reason: "RESTOCK",
    referenceId: "INITIAL_DEMO",
    createdAt: createdAt(200 - product.id),
  }));
  stockMovements.push({
    id: products.length + 1,
    productId: 1,
    changeAmount: -10,
    reason: "ORDER",
    referenceId: orders[0].orderNumber,
    createdAt: orders[0].createdAt,
  });

  return { suppliers, products, orders, stockMovements };
}

export function getLocalDemoData(): DemoData | null {
  if (typeof window === "undefined") {
    throw new Error("Saved demo data is available only in the browser.");
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error("Saved demo data is invalid. Clear this site's local storage to reset it.");
  }
  if (!isDemoData(parsed)) {
    throw new Error("Saved demo data has an unsupported format. Clear this site's local storage to reset it.");
  }
  return parsed;
}

export function getLocalDemoOwner(): string | null {
  if (typeof window === "undefined") {
    throw new Error("Saved demo data is available only in the browser.");
  }
  return window.localStorage.getItem(OWNER_KEY);
}

export function setLocalDemoOwner(ownerUid: string) {
  window.localStorage.setItem(OWNER_KEY, ownerUid);
}

export function downloadDemoBackup(data: DemoData) {
  const backup = {
    metadata: {
      version: "1.0",
      system: "Inventory Management Browser Demo",
      exportedAt: new Date().toISOString(),
      storage: "This backup contains data from this browser only.",
    },
    data,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `ioms_demo_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
