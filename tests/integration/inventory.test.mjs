import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("IOMS ACID Boundary Tests", async (t) => {
  let supplier;
  let productA; // For exact stock test
  let productB; // For exceeded stock test
  let productC; // For cancellation test

  await t.test("Setup test fixtures", async () => {
    // Create dedicated test supplier
    supplier = await prisma.supplier.create({
      data: {
        name: "Test Boundary Supplier Inc",
        contactPerson: "QA Tester",
        email: `qa-test-${Date.now()}@example.com`,
        phone: "+1-555-TEST",
      },
    });
    assert.ok(supplier.id, "Supplier created");

    // Product A: initial stock = 10 (will order exactly 10)
    productA = await prisma.product.create({
      data: {
        sku: `TEST-EXACT-${Date.now()}`,
        name: "Exact Stock Boundary Widget",
        category: "Testing",
        unitPrice: 50.0,
        costPrice: 20.0,
        stockQuantity: 10,
        reorderLevel: 5,
        supplierId: supplier.id,
      },
    });

    // Product B: initial stock = 5 (will attempt to order 8)
    productB = await prisma.product.create({
      data: {
        sku: `TEST-EXCEED-${Date.now()}`,
        name: "Exceeded Stock Boundary Widget",
        category: "Testing",
        unitPrice: 30.0,
        costPrice: 15.0,
        stockQuantity: 5,
        reorderLevel: 2,
        supplierId: supplier.id,
      },
    });

    // Product C: initial stock = 15 (will order 5, complete, then cancel to test reversal)
    productC = await prisma.product.create({
      data: {
        sku: `TEST-CANCEL-${Date.now()}`,
        name: "Cancellation Reversal Widget",
        category: "Testing",
        unitPrice: 40.0,
        costPrice: 18.0,
        stockQuantity: 15,
        reorderLevel: 5,
        supplierId: supplier.id,
      },
    });
  });

  await t.test("Boundary Test 1: Completing outbound order with exact remaining stock (stock reaches 0)", async () => {
    // Create outbound sale order for exact stock quantity (10)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-EXACT-${Date.now()}`,
        orderType: "OUTBOUND_SALE",
        status: "PENDING",
        customerOrSupplierName: "Exact Stock Customer",
        totalAmount: 500.0,
        orderItems: {
          create: [
            {
              productId: productA.id,
              quantity: 10, // Exact stock quantity
              unitPrice: 50.0,
              subtotal: 500.0,
            },
          ],
        },
      },
      include: { orderItems: true },
    });

    // Execute completion transaction
    await prisma.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: true },
      });
      assert.equal(ord.status, "PENDING");

      for (const item of ord.orderItems) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        assert.ok(prod.stockQuantity >= item.quantity, "Sufficient stock for exact deduction");

        await tx.product.update({
          where: { id: prod.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: prod.id,
            changeAmount: -item.quantity,
            reason: "ORDER",
            referenceId: ord.orderNumber,
          },
        });
      }

      await tx.order.update({
        where: { id: ord.id },
        data: { status: "COMPLETED" },
      });
    });

    // Verification 1: stock_quantity reaches EXACTLY 0
    const updatedProdA = await prisma.product.findUnique({ where: { id: productA.id } });
    assert.equal(updatedProdA.stockQuantity, 0, "Stock quantity must be exactly 0");

    // Verification 2: order marked COMPLETED
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert.equal(updatedOrder.status, "COMPLETED", "Order status must be COMPLETED");

    // Verification 3: stock movement logged with -10
    const movement = await prisma.stockMovement.findFirst({
      where: { referenceId: order.orderNumber },
    });
    assert.ok(movement, "Stock movement must exist");
    assert.equal(movement.changeAmount, -10, "Change amount must be -10");
  });

  await t.test("Boundary Test 2: Attempting outbound order exceeding available stock (rollback & unchanged stock)", async () => {
    // productB has stock = 5; order requests quantity = 8
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-EXCEED-${Date.now()}`,
        orderType: "OUTBOUND_SALE",
        status: "PENDING",
        customerOrSupplierName: "Overdrawing Customer",
        totalAmount: 240.0,
        orderItems: {
          create: [
            {
              productId: productB.id,
              quantity: 8, // Exceeds available 5
              unitPrice: 30.0,
              subtotal: 240.0,
            },
          ],
        },
      },
      include: { orderItems: true },
    });

    // Execute transaction expecting failure and rollback
    let transactionFailed = false;
    try {
      await prisma.$transaction(async (tx) => {
        const ord = await tx.order.findUnique({
          where: { id: order.id },
          include: { orderItems: true },
        });

        for (const item of ord.orderItems) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod.stockQuantity < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK: Available ${prod.stockQuantity}, Required ${item.quantity}`);
          }

          await tx.product.update({
            where: { id: prod.id },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: ord.id },
          data: { status: "COMPLETED" },
        });
      });
    } catch (err) {
      transactionFailed = true;
      assert.match(err.message, /INSUFFICIENT_STOCK/);
    }

    assert.equal(transactionFailed, true, "Transaction must fail and throw");

    // Verification 1: stock_quantity remains strictly UNCHANGED at 5
    const unchangedProdB = await prisma.product.findUnique({ where: { id: productB.id } });
    assert.equal(unchangedProdB.stockQuantity, 5, "Stock quantity must remain unchanged at 5");

    // Verification 2: order status remains PENDING
    const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert.equal(unchangedOrder.status, "PENDING", "Order status must remain PENDING");

    // Verification 3: NO stock movements were logged for this order
    const movement = await prisma.stockMovement.findFirst({
      where: { referenceId: order.orderNumber },
    });
    assert.equal(movement, null, "No stock movement must be logged on rollback");
  });

  await t.test("Boundary Test 3: Cancelling completed order (stock restoration & reversal audit entry)", async () => {
    // 1. First, create and complete an order of quantity = 5 for productC (initial stock 15 -> 10)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-CANCEL-${Date.now()}`,
        orderType: "OUTBOUND_SALE",
        status: "PENDING",
        customerOrSupplierName: "Returning Customer",
        totalAmount: 200.0,
        orderItems: {
          create: [
            {
              productId: productC.id,
              quantity: 5,
              unitPrice: 40.0,
              subtotal: 200.0,
            },
          ],
        },
      },
      include: { orderItems: true },
    });

    // Complete order
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productC.id },
        data: { stockQuantity: { decrement: 5 } },
      });
      await tx.stockMovement.create({
        data: {
          productId: productC.id,
          changeAmount: -5,
          reason: "ORDER",
          referenceId: order.orderNumber,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      });
    });

    // Verify stock is now 10
    const intermediateProdC = await prisma.product.findUnique({ where: { id: productC.id } });
    assert.equal(intermediateProdC.stockQuantity, 10, "Stock should be decremented to 10");

    // 2. Now execute Cancellation Transaction
    await prisma.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: true },
      });
      assert.equal(ord.status, "COMPLETED");

      for (const item of ord.orderItems) {
        // Outbound sale reversal: restore stock (+5)
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            changeAmount: item.quantity,
            reason: "ORDER",
            referenceId: `CANCEL_${ord.orderNumber}`,
          },
        });
      }

      await tx.order.update({
        where: { id: ord.id },
        data: { status: "CANCELLED" },
      });
    });

    // Verification 1: stock restored back to 15
    const restoredProdC = await prisma.product.findUnique({ where: { id: productC.id } });
    assert.equal(restoredProdC.stockQuantity, 15, "Stock must be fully restored to 15");

    // Verification 2: order status is CANCELLED
    const cancelledOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert.equal(cancelledOrder.status, "CANCELLED", "Order status must be CANCELLED");

    // Verification 3: reversal entry logged with positive change
    const reversalMovement = await prisma.stockMovement.findFirst({
      where: { referenceId: `CANCEL_${order.orderNumber}` },
    });
    assert.ok(reversalMovement, "Reversal movement entry must exist");
    assert.equal(reversalMovement.changeAmount, 5, "Reversal movement must have +5 change");
  });

  await t.test("Teardown test fixtures", async () => {
    await prisma.stockMovement.deleteMany({
      where: {
        productId: { in: [productA.id, productB.id, productC.id] },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        productId: { in: [productA.id, productB.id, productC.id] },
      },
    });
    await prisma.order.deleteMany({
      where: {
        customerOrSupplierName: {
          in: ["Exact Stock Customer", "Overdrawing Customer", "Returning Customer"],
        },
      },
    });
    await prisma.product.deleteMany({
      where: {
        id: { in: [productA.id, productB.id, productC.id] },
      },
    });
    await prisma.supplier.delete({
      where: { id: supplier.id },
    });
  });
});
