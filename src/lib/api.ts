import {
  createInitialData,
  getLocalDemoData,
  getLocalDemoOwner,
  isDemoData,
  setLocalDemoOwner,
  type DemoOrder,
  type DemoProduct,
  type DemoStockMovement,
  type DemoSupplier,
} from "@/lib/demo-store";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import {
  orderSchema,
  productSchema,
  supplierSchema,
} from "@/lib/validations";

type JsonRecord = Record<string, unknown>;
type DemoState = ReturnType<typeof createInitialData>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, status: number): Response {
  return jsonResponse({ error }, status);
}

function latestId(items: Array<{ id: number }>) {
  return items.reduce((largest, item) => Math.max(largest, item.id), 0);
}

function parseBody(init?: RequestInit): JsonRecord | null {
  if (init?.body === undefined || init.body === null) return {};
  if (typeof init.body !== "string") return null;
  try {
    const body: unknown = JSON.parse(init.body);
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

function supplierView(supplier: DemoSupplier, data: DemoState) {
  const products = data.products.filter((product) => product.supplierId === supplier.id);
  return {
    ...supplier,
    products,
    _count: { products: products.length },
  };
}

function productView(product: DemoProduct, data: DemoState) {
  const supplier = data.suppliers.find((item) => item.id === product.supplierId);
  return {
    ...product,
    supplier: supplier
      ? {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
        }
      : null,
  };
}

function orderView(order: DemoOrder, data: DemoState) {
  return {
    ...order,
    orderItems: order.orderItems.map((item) => {
      const product = data.products.find((candidate) => candidate.id === item.productId);
      return {
        ...item,
        product: product
          ? {
              ...productView(product, data),
            }
          : null,
      };
    }),
  };
}

function movementView(
  movement: DemoStockMovement,
  data: DemoState
) {
  const product = data.products.find((item) => item.id === movement.productId);
  return {
    ...movement,
    product: product
      ? {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
        }
      : null,
  };
}

function sortNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function handleProducts(
  data: DemoState,
  url: URL,
  method: string,
  body: JsonRecord | null
): Response {
  const productMatch = url.pathname.match(/^\/api\/products\/(\d+)$/);
  const productId = productMatch ? Number(productMatch[1]) : null;
  const productSubroute = url.pathname.match(/^\/api\/products\/(\d+)\/([^/]+)$/);

  if (url.pathname === "/api/products/low-stock" && method === "GET") {
    const products = data.products
      .filter((product) => product.stockQuantity <= product.reorderLevel)
      .sort((left, right) => left.stockQuantity - right.stockQuantity)
      .map((product) => productView(product, data));
    return jsonResponse(products);
  }

  if (url.pathname === "/api/products" && method === "GET") {
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const category = url.searchParams.get("category");
    const supplierId = Number(url.searchParams.get("supplierId"));
    const lowStock = url.searchParams.get("lowStock") === "true";
    const products = data.products
      .filter((product) => {
        const matchesSearch =
          !search ||
          [product.name, product.sku, product.category].some((value) =>
            value.toLowerCase().includes(search)
          );
        const matchesCategory = !category || product.category === category;
        const matchesSupplier =
          !url.searchParams.has("supplierId") || product.supplierId === supplierId;
        const matchesStock =
          !lowStock || product.stockQuantity <= product.reorderLevel;
        return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
      })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((product) => productView(product, data));
    return jsonResponse(products);
  }

  if (url.pathname === "/api/products" && method === "POST") {
    if (!body) return errorResponse("Invalid product data", 400);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid product data", 400);
    }
    const {
      sku,
      name,
      category,
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      supplierId,
    } = parsed.data;
    if (data.products.some((product) => product.sku === sku)) {
      return errorResponse(`A product with SKU "${sku}" already exists`, 409);
    }
    if (!data.suppliers.some((supplier) => supplier.id === supplierId)) {
      return errorResponse("Selected supplier does not exist", 400);
    }
    const product: DemoProduct = {
      id: latestId(data.products) + 1,
      sku,
      name,
      category,
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      supplierId,
      createdAt: new Date().toISOString(),
    };
    data.products.push(product);
    if (stockQuantity > 0) {
      data.stockMovements.push({
        id: latestId(data.stockMovements) + 1,
        productId: product.id,
        changeAmount: stockQuantity,
        reason: "RESTOCK",
        referenceId: "INITIAL_STOCK",
        createdAt: new Date().toISOString(),
      });
    }
    return jsonResponse(product, 201);
  }

  if (productSubroute) return errorResponse("Product action not found", 404);
  if (productId === null) return errorResponse("Product not found", 404);
  const product = data.products.find((item) => item.id === productId);
  if (!product) return errorResponse("Product not found", 404);

  if (method === "GET") {
    return jsonResponse({
      ...productView(product, data),
      stockMovements: sortNewest(
        data.stockMovements.filter((item) => item.productId === productId)
      ).slice(0, 20),
    });
  }
  if (method === "PUT") {
    if (!body) return errorResponse("Invalid product data", 400);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid product data", 400);
    }
    const {
      sku,
      name,
      category,
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      supplierId,
    } = parsed.data;
    if (
      data.products.some(
        (candidate) => candidate.id !== productId && candidate.sku === sku
      )
    ) {
      return errorResponse(`Another product with SKU "${sku}" already exists`, 409);
    }
    if (!data.suppliers.some((supplier) => supplier.id === supplierId)) {
      return errorResponse("Selected supplier does not exist", 400);
    }
    const stockDifference = stockQuantity - product.stockQuantity;
    Object.assign(product, {
      sku,
      name,
      category,
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      supplierId,
    });
    if (stockDifference !== 0) {
      data.stockMovements.push({
        id: latestId(data.stockMovements) + 1,
        productId,
        changeAmount: stockDifference,
        reason: "ADJUSTMENT",
        referenceId: "MANUAL_EDIT",
        createdAt: new Date().toISOString(),
      });
    }
    return jsonResponse(product);
  }
  if (method === "DELETE") {
    if (
      data.orders.some((order) =>
        order.orderItems.some((item) => item.productId === productId)
      )
    ) {
      return errorResponse("Cannot delete product because it appears in an order.", 400);
    }
    data.products = data.products.filter((item) => item.id !== productId);
    data.stockMovements = data.stockMovements.filter(
      (item) => item.productId !== productId
    );
    return jsonResponse({ message: "Product deleted successfully" });
  }
  return errorResponse("Method not allowed", 405);
}

function handleSuppliers(
  data: DemoState,
  url: URL,
  method: string,
  body: JsonRecord | null
): Response {
  const supplierMatch = url.pathname.match(/^\/api\/suppliers\/(\d+)$/);
  const supplierId = supplierMatch ? Number(supplierMatch[1]) : null;

  if (url.pathname === "/api/suppliers" && method === "GET") {
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    return jsonResponse(
      data.suppliers
        .filter((supplier) =>
          [supplier.name, supplier.contactPerson, supplier.email, supplier.phone].some(
            (value) => value.toLowerCase().includes(search)
          )
        )
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((supplier) => supplierView(supplier, data))
    );
  }
  if (url.pathname === "/api/suppliers" && method === "POST") {
    if (!body) return errorResponse("Invalid supplier data", 400);
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid supplier data", 400);
    }
    const { name, contactPerson, email, phone } = parsed.data;
    if (data.suppliers.some((supplier) => supplier.email === email)) {
      return errorResponse("A supplier with this email already exists", 409);
    }
    const supplier: DemoSupplier = {
      id: latestId(data.suppliers) + 1,
      name,
      contactPerson,
      email,
      phone,
      createdAt: new Date().toISOString(),
    };
    data.suppliers.push(supplier);
    return jsonResponse(supplier, 201);
  }
  if (supplierId === null) return errorResponse("Supplier not found", 404);
  const supplier = data.suppliers.find((item) => item.id === supplierId);
  if (!supplier) return errorResponse("Supplier not found", 404);
  if (method === "GET") return jsonResponse(supplierView(supplier, data));
  if (method === "PUT") {
    if (!body) return errorResponse("Invalid supplier data", 400);
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid supplier data", 400);
    }
    const { name, contactPerson, email, phone } = parsed.data;
    if (
      data.suppliers.some(
        (candidate) => candidate.id !== supplierId && candidate.email === email
      )
    ) {
      return errorResponse("Another supplier with this email already exists", 409);
    }
    Object.assign(supplier, { name, contactPerson, email, phone });
    return jsonResponse(supplier);
  }
  if (method === "DELETE") {
    if (data.products.some((product) => product.supplierId === supplierId)) {
      return errorResponse(
        "Cannot delete supplier while products are linked to it.",
        400
      );
    }
    data.suppliers = data.suppliers.filter((item) => item.id !== supplierId);
    return jsonResponse({ message: "Supplier deleted successfully" });
  }
  return errorResponse("Method not allowed", 405);
}

function handleOrders(
  data: DemoState,
  url: URL,
  method: string,
  body: JsonRecord | null
): Response {
  const orderMatch = url.pathname.match(/^\/api\/orders\/(\d+)(?:\/(complete|cancel))?$/);
  const orderId = orderMatch ? Number(orderMatch[1]) : null;
  const action = orderMatch?.[2];

  if (url.pathname === "/api/orders" && method === "GET") {
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    return jsonResponse(
      sortNewest(
        data.orders.filter(
          (order) =>
            (!type || order.orderType === type) &&
            (!status || order.status === status)
        )
      ).map((order) => orderView(order, data))
    );
  }
  if (url.pathname === "/api/orders" && method === "POST") {
    if (!body) return errorResponse("Invalid order data", 400);
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid order data", 400);
    }
    const { orderType, customerOrSupplierName, items: requestedItems } = parsed.data;
    if (
      requestedItems.some(
        (item) => !data.products.some((product) => product.id === item.productId)
      )
    ) {
      return errorResponse("Order items must reference existing products.", 400);
    }
    let nextItemId = latestId(data.orders.flatMap((order) => order.orderItems));
    const items: DemoOrder["orderItems"] = requestedItems.map((item) => {
      nextItemId += 1;
      const subtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      return {
        id: nextItemId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      };
    });
    const id = latestId(data.orders) + 1;
    const totalAmount =
      Math.round(items.reduce((total, item) => total + item.subtotal, 0) * 100) /
      100;
    const order: DemoOrder = {
      id,
      orderNumber: `ORD-${String(id).padStart(6, "0")}`,
      orderType,
      status: "PENDING",
      customerOrSupplierName,
      totalAmount,
      createdAt: new Date().toISOString(),
      orderItems: items,
    };
    data.orders.push(order);
    return jsonResponse(orderView(order, data), 201);
  }
  if (orderId === null) return errorResponse("Order not found", 404);
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return errorResponse("Order not found", 404);
  if (method === "GET" && !action) return jsonResponse(orderView(order, data));
  if (method !== "POST" || !action) return errorResponse("Method not allowed", 405);

  if (action === "complete") {
    if (order.status !== "PENDING") {
      return errorResponse("Only pending orders can be completed.", 400);
    }
    if (order.orderItems.length === 0) {
      return errorResponse("Order has no items.", 400);
    }
    for (const item of order.orderItems) {
      const product = data.products.find((candidate) => candidate.id === item.productId);
      if (!product) return errorResponse("An order product no longer exists.", 400);
      if (
        order.orderType === "OUTBOUND_SALE" &&
        product.stockQuantity < item.quantity
      ) {
        return errorResponse(
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, required: ${item.quantity}.`,
          400
        );
      }
    }
    for (const item of order.orderItems) {
      const product = data.products.find((candidate) => candidate.id === item.productId);
      if (!product) continue;
      const changeAmount =
        order.orderType === "OUTBOUND_SALE" ? -item.quantity : item.quantity;
      product.stockQuantity += changeAmount;
      data.stockMovements.push({
        id: latestId(data.stockMovements) + 1,
        productId: product.id,
        changeAmount,
        reason: "ORDER",
        referenceId: order.orderNumber,
        createdAt: new Date().toISOString(),
      });
    }
    order.status = "COMPLETED";
    return jsonResponse({
      message: `Order ${order.orderNumber} successfully completed`,
      order: orderView(order, data),
    });
  }

  if (order.status === "CANCELLED") {
    return errorResponse("Order is already cancelled", 400);
  }
  if (order.status === "COMPLETED") {
    if (
      order.orderType === "INBOUND_PURCHASE" &&
      order.orderItems.some((item) => {
        const product = data.products.find(
          (candidate) => candidate.id === item.productId
        );
        return !product || product.stockQuantity < item.quantity;
      })
    ) {
      return errorResponse(
        "Cannot cancel purchase order because some stock has already been consumed.",
        400
      );
    }
    for (const item of order.orderItems) {
      const product = data.products.find((candidate) => candidate.id === item.productId);
      if (!product) continue;
      const changeAmount =
        order.orderType === "OUTBOUND_SALE" ? item.quantity : -item.quantity;
      product.stockQuantity += changeAmount;
      data.stockMovements.push({
        id: latestId(data.stockMovements) + 1,
        productId: product.id,
        changeAmount,
        reason: "ORDER",
        referenceId: `CANCEL_${order.orderNumber}`,
        createdAt: new Date().toISOString(),
      });
    }
  }
  order.status = "CANCELLED";
  return jsonResponse({
    message: `Order ${order.orderNumber} successfully cancelled`,
    order: orderView(order, data),
  });
}

function handleRequest(
  data: DemoState,
  url: URL,
  method: string,
  body: JsonRecord | null
): Response {
  if (url.pathname === "/api/backup" && method === "GET") {
    return jsonResponse(data);
  }

  if (url.pathname === "/api/dashboard" && method === "GET") {
    const lowStockProducts = data.products
      .filter((product) => product.stockQuantity <= product.reorderLevel)
      .map((product) => productView(product, data));
    const recentMovements = sortNewest(data.stockMovements)
      .slice(0, 10)
      .map((movement) => movementView(movement, data));
    const totalInventoryValue = data.products.reduce(
      (total, product) => total + product.stockQuantity * product.costPrice,
      0
    );
    return jsonResponse({
      metrics: {
        totalProducts: data.products.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount: lowStockProducts.length,
        pendingOrders: data.orders.filter((order) => order.status === "PENDING")
          .length,
      },
      lowStockProducts,
      recentMovements,
    });
  }

  if (url.pathname === "/api/stock-movements" && method === "GET") {
    const productIdParam = url.searchParams.get("productId");
    const reason = url.searchParams.get("reason");
    const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 0), 100)
      : 50;
    return jsonResponse(
      sortNewest(
        data.stockMovements.filter(
          (movement) =>
            (!productIdParam || movement.productId === Number(productIdParam)) &&
            (!reason || movement.reason === reason)
        )
      )
        .slice(0, limit)
        .map((movement) => movementView(movement, data))
    );
  }

  if (url.pathname.startsWith("/api/products")) {
    return handleProducts(data, url, method, body);
  }
  if (url.pathname.startsWith("/api/suppliers")) {
    return handleSuppliers(data, url, method, body);
  }
  if (url.pathname.startsWith("/api/orders")) {
    return handleOrders(data, url, method, body);
  }
  return errorResponse("Demo endpoint not found", 404);
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (typeof window === "undefined") {
    throw new Error("Demo data requests must run in the browser.");
  }

  const requestUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : input;
  const url = new URL(requestUrl, window.location.origin);
  const method = (init?.method ?? "GET").toUpperCase();
  const body = method === "GET" || method === "HEAD" ? {} : parseBody(init);
  if (!body) return errorResponse("Invalid request data", 400);

  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw new Error("Your session has expired. Sign in again to continue.");
    }

    const db = getFirebaseDb();
    const stateRef = doc(db, "users", user.uid, "inventory", "state");
    const response = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(stateRef);
      const exists = snapshot.exists();
      let data: DemoState;

      if (exists) {
        const storedState: unknown = snapshot.data().state;
        if (!isDemoData(storedState)) {
          throw new Error("The cloud inventory has an unsupported data format.");
        }
        data = storedState;
      } else {
        const ownerUid = getLocalDemoOwner();
        const localData =
          ownerUid === null || ownerUid === user.uid ? getLocalDemoData() : null;
        data = localData ?? createInitialData();
      }

      const result = handleRequest(data, url, method, body);
      const hasMutation = method !== "GET" && method !== "HEAD";
      if (!exists || (hasMutation && result.ok)) {
        transaction.set(stateRef, {
          state: data,
          updatedAt: serverTimestamp(),
        });
      }
      return result;
    });

    setLocalDemoOwner(user.uid);
    return response;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to load or save your cloud inventory."
    );
  }
}
