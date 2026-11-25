import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database...");
  await prisma.stockMovement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});

  console.log("Seeding suppliers...");
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Apex Electronics Ltd",
        contactPerson: "Sarah Jenkins",
        email: "sarah.jenkins@apexelectronics.com",
        phone: "+1-555-0101",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Global Components Inc",
        contactPerson: "David Chen",
        email: "d.chen@globalcomponents.com",
        phone: "+1-555-0102",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "OmniTech Distribution",
        contactPerson: "Elena Rostova",
        email: "elena@omnitechdist.com",
        phone: "+1-555-0103",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Pinnacle Office Solutions",
        contactPerson: "Marcus Vance",
        email: "marcus@pinnacleoffice.com",
        phone: "+1-555-0104",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Quantum Logistics & Goods",
        contactPerson: "Amina Al-Mansoor",
        email: "amina@quantumgoods.com",
        phone: "+1-555-0105",
      },
    }),
  ]);

  const [s1, s2, s3, s4, s5] = suppliers;

  console.log("Seeding products...");
  // 15 products across 3 categories (Electronics, Office Supplies, Computer Hardware)
  // Include some low stock products to test alerts
  const products = await Promise.all([
    // Category 1: Electronics (5 products)
    prisma.product.create({
      data: {
        sku: "ELEC-USBC-001",
        name: "Braided USB-C Cable (2m)",
        category: "Electronics",
        unitPrice: 19.99,
        costPrice: 6.50,
        stockQuantity: 120,
        reorderLevel: 25,
        supplierId: s1.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-WCHG-002",
        name: "Fast Wireless Charging Pad 15W",
        category: "Electronics",
        unitPrice: 34.99,
        costPrice: 14.20,
        stockQuantity: 45,
        reorderLevel: 20,
        supplierId: s1.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-BTAD-003",
        name: "Bluetooth 5.3 Audio Receiver",
        category: "Electronics",
        unitPrice: 24.50,
        costPrice: 9.80,
        stockQuantity: 8, // LOW STOCK (reorderLevel = 15)
        reorderLevel: 15,
        supplierId: s2.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-HDMC-004",
        name: "Ultra High Speed HDMI 2.1 Cable",
        category: "Electronics",
        unitPrice: 22.00,
        costPrice: 8.00,
        stockQuantity: 65,
        reorderLevel: 20,
        supplierId: s2.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ELEC-PWBNK-005",
        name: "20,000mAh Power Bank PD 65W",
        category: "Electronics",
        unitPrice: 59.99,
        costPrice: 28.50,
        stockQuantity: 4, // LOW STOCK (reorderLevel = 10)
        reorderLevel: 10,
        supplierId: s1.id,
      },
    }),

    // Category 2: Office Supplies (5 products)
    prisma.product.create({
      data: {
        sku: "OFFC-ERGC-101",
        name: "Ergonomic Lumbar Cushion",
        category: "Office Supplies",
        unitPrice: 42.00,
        costPrice: 18.00,
        stockQuantity: 30,
        reorderLevel: 10,
        supplierId: s4.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFFC-DSKM-102",
        name: "Waterproof Extended Desk Mat",
        category: "Office Supplies",
        unitPrice: 29.50,
        costPrice: 11.20,
        stockQuantity: 50,
        reorderLevel: 15,
        supplierId: s4.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFFC-MONA-103",
        name: "Adjustable Single Monitor Arm",
        category: "Office Supplies",
        unitPrice: 79.99,
        costPrice: 38.00,
        stockQuantity: 5, // LOW STOCK (reorderLevel = 12)
        reorderLevel: 12,
        supplierId: s4.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFFC-WHTB-104",
        name: "Magnetic Desktop Whiteboard 30x40cm",
        category: "Office Supplies",
        unitPrice: 35.00,
        costPrice: 14.50,
        stockQuantity: 22,
        reorderLevel: 8,
        supplierId: s5.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "OFFC-CABM-105",
        name: "Under-Desk Cable Management Tray",
        category: "Office Supplies",
        unitPrice: 25.00,
        costPrice: 9.00,
        stockQuantity: 40,
        reorderLevel: 15,
        supplierId: s5.id,
      },
    }),

    // Category 3: Computer Hardware (5 products)
    prisma.product.create({
      data: {
        sku: "COMP-MECK-201",
        name: "RGB Mechanical Keyboard (Brown Switches)",
        category: "Computer Hardware",
        unitPrice: 89.99,
        costPrice: 42.00,
        stockQuantity: 28,
        reorderLevel: 10,
        supplierId: s3.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "COMP-PROW-202",
        name: "Wireless Precision Gaming Mouse",
        category: "Computer Hardware",
        unitPrice: 69.99,
        costPrice: 31.00,
        stockQuantity: 35,
        reorderLevel: 12,
        supplierId: s3.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "COMP-NVME-203",
        name: "1TB PCIe Gen4 NVMe M.2 SSD",
        category: "Computer Hardware",
        unitPrice: 109.99,
        costPrice: 62.00,
        stockQuantity: 18,
        reorderLevel: 8,
        supplierId: s2.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "COMP-RAMD-204",
        name: "32GB (2x16GB) DDR5 6000MHz RAM Kit",
        category: "Computer Hardware",
        unitPrice: 139.99,
        costPrice: 85.00,
        stockQuantity: 2, // CRITICAL LOW STOCK (reorderLevel = 10)
        reorderLevel: 10,
        supplierId: s3.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: "COMP-USBD-205",
        name: "10-in-1 Aluminum USB-C Hub Dock",
        category: "Computer Hardware",
        unitPrice: 75.00,
        costPrice: 33.50,
        stockQuantity: 55,
        reorderLevel: 15,
        supplierId: s1.id,
      },
    }),
  ]);

  console.log("Logging initial stock movements...");
  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        changeAmount: p.stockQuantity,
        reason: "RESTOCK",
        referenceId: "INITIAL_SEED",
      },
    });
  }

  console.log("Seeding 10 orders (inbound & outbound with varied statuses)...");
  const pMap = new Map(products.map((p) => [p.sku, p]));

  // Helper to calculate total
  const orderData = [
    {
      orderNumber: "ORD-000001",
      orderType: "INBOUND_PURCHASE",
      status: "COMPLETED",
      customerOrSupplierName: s1.name,
      items: [
        { sku: "ELEC-USBC-001", quantity: 50, unitPrice: 6.50 },
        { sku: "ELEC-WCHG-002", quantity: 30, unitPrice: 14.20 },
      ],
    },
    {
      orderNumber: "ORD-000002",
      orderType: "OUTBOUND_SALE",
      status: "COMPLETED",
      customerOrSupplierName: "Acme Enterprises Corp",
      items: [
        { sku: "ELEC-USBC-001", quantity: 10, unitPrice: 19.99 },
        { sku: "COMP-MECK-201", quantity: 5, unitPrice: 89.99 },
      ],
    },
    {
      orderNumber: "ORD-000003",
      orderType: "INBOUND_PURCHASE",
      status: "COMPLETED",
      customerOrSupplierName: s3.name,
      items: [
        { sku: "COMP-MECK-201", quantity: 20, unitPrice: 42.00 },
        { sku: "COMP-PROW-202", quantity: 25, unitPrice: 31.00 },
      ],
    },
    {
      orderNumber: "ORD-000004",
      orderType: "OUTBOUND_SALE",
      status: "COMPLETED",
      customerOrSupplierName: "Zenith Tech Studios",
      items: [
        { sku: "COMP-NVME-203", quantity: 4, unitPrice: 109.99 },
        { sku: "OFFC-MONA-103", quantity: 3, unitPrice: 79.99 },
      ],
    },
    {
      orderNumber: "ORD-000005",
      orderType: "OUTBOUND_SALE",
      status: "PENDING",
      customerOrSupplierName: "Hyperion Digital Agency",
      items: [
        { sku: "ELEC-PWBNK-005", quantity: 2, unitPrice: 59.99 },
        { sku: "OFFC-DSKM-102", quantity: 5, unitPrice: 29.50 },
      ],
    },
    {
      orderNumber: "ORD-000006",
      orderType: "INBOUND_PURCHASE",
      status: "PENDING",
      customerOrSupplierName: s4.name,
      items: [
        { sku: "OFFC-ERGC-101", quantity: 20, unitPrice: 18.00 },
        { sku: "OFFC-MONA-103", quantity: 15, unitPrice: 38.00 },
      ],
    },
    {
      orderNumber: "ORD-000007",
      orderType: "OUTBOUND_SALE",
      status: "COMPLETED",
      customerOrSupplierName: "Nexus Coworking Hub",
      items: [
        { sku: "OFFC-WHTB-104", quantity: 6, unitPrice: 35.00 },
        { sku: "OFFC-CABM-105", quantity: 10, unitPrice: 25.00 },
      ],
    },
    {
      orderNumber: "ORD-000008",
      orderType: "OUTBOUND_SALE",
      status: "CANCELLED",
      customerOrSupplierName: "Vortex Software Inc",
      items: [
        { sku: "COMP-RAMD-204", quantity: 4, unitPrice: 139.99 },
      ],
    },
    {
      orderNumber: "ORD-000009",
      orderType: "INBOUND_PURCHASE",
      status: "COMPLETED",
      customerOrSupplierName: s2.name,
      items: [
        { sku: "COMP-NVME-203", quantity: 15, unitPrice: 62.00 },
        { sku: "ELEC-HDMC-004", quantity: 40, unitPrice: 8.00 },
      ],
    },
    {
      orderNumber: "ORD-000010",
      orderType: "OUTBOUND_SALE",
      status: "PENDING",
      customerOrSupplierName: "Solaria Creative Labs",
      items: [
        { sku: "COMP-USBD-205", quantity: 8, unitPrice: 75.00 },
        { sku: "ELEC-WCHG-002", quantity: 5, unitPrice: 34.99 },
      ],
    },
  ];

  for (const o of orderData) {
    let total = 0;
    const itemsCreate = o.items.map((item) => {
      const prod = pMap.get(item.sku)!;
      const subtotal = item.quantity * item.unitPrice;
      total += subtotal;
      return {
        productId: prod.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        orderType: o.orderType,
        status: o.status,
        customerOrSupplierName: o.customerOrSupplierName,
        totalAmount: Math.round(total * 100) / 100,
        orderItems: {
          create: itemsCreate,
        },
      },
    });

    // If order was COMPLETED, record movements
    if (o.status === "COMPLETED") {
      for (const it of itemsCreate) {
        const change = o.orderType === "INBOUND_PURCHASE" ? it.quantity : -it.quantity;
        await prisma.stockMovement.create({
          data: {
            productId: it.productId,
            changeAmount: change,
            reason: "ORDER",
            referenceId: createdOrder.orderNumber,
          },
        });
      }
    }
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
