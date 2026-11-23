import { isMongoConnected, readLocalStore, writeLocalStore } from '../config/db.ts';
import { OrderModel } from '../models/Order.ts';
import { ProductModel } from '../models/Product.ts';
import { UserModel } from '../models/User.ts';
import type {
  OrderRecord,
  OrderStatus,
  ProductCategory,
  ProductRecord,
  ProductReview,
  UserRecord,
} from '../types.ts';

export async function listProducts(filters?: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<ProductRecord[]> {
  let products: ProductRecord[];

  if (isMongoConnected()) {
    products = await ProductModel.find({}).lean<ProductRecord[]>();
  } else {
    products = [...readLocalStore().products];
  }

  if (filters?.category && filters.category !== 'All') {
    products = products.filter((p) => p.category === filters.category);
  }

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
  }

  switch (filters?.sort) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    default:
      products.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }

  return products;
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  if (isMongoConnected()) {
    return await ProductModel.findOne({ id }).lean<ProductRecord | null>();
  }
  const store = readLocalStore();
  return store.products.find((p) => p.id === id) ?? null;
}

export async function createProduct(product: ProductRecord): Promise<ProductRecord> {
  if (isMongoConnected()) {
    const created = await ProductModel.create(product);
    return created.toObject() as ProductRecord;
  }
  const store = readLocalStore();
  store.products.unshift(product);
  writeLocalStore(store);
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<
    Pick<
      ProductRecord,
      'title' | 'category' | 'price' | 'compareAtPrice' | 'description' | 'materials' | 'dimensions' | 'image' | 'accentHex' | 'tag' | 'featured' | 'variants'
    >
  >,
): Promise<ProductRecord | null> {
  if (isMongoConnected()) {
    return await ProductModel.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true },
    ).lean<ProductRecord | null>();
  }
  const store = readLocalStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.products[idx] = { ...store.products[idx], ...patch };
  writeLocalStore(store);
  return store.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await ProductModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const store = readLocalStore();
  const prevLen = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);
  if (store.products.length === prevLen) return false;
  writeLocalStore(store);
  return true;
}

export async function addProductReview(
  productId: string,
  review: ProductReview,
): Promise<ProductRecord | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const updatedReviews = [review, ...product.reviews];
  const avg =
    updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
  const roundedRating = Math.round(avg * 10) / 10;

  if (isMongoConnected()) {
    return await ProductModel.findOneAndUpdate(
      { id: productId },
      {
        $set: {
          reviews: updatedReviews,
          rating: roundedRating,
          reviewCount: updatedReviews.length,
        },
      },
      { new: true },
    ).lean<ProductRecord | null>();
  }

  const store = readLocalStore();
  const idx = store.products.findIndex((p) => p.id === productId);
  if (idx === -1) return null;
  store.products[idx] = {
    ...store.products[idx],
    reviews: updatedReviews,
    rating: roundedRating,
    reviewCount: updatedReviews.length,
  };
  writeLocalStore(store);
  return store.products[idx];
}

export async function decrementVariantStock(
  items: Array<{ productId: string; variantId: string; quantity: number }>,
): Promise<void> {
  if (isMongoConnected()) {
    for (const item of items) {
      await ProductModel.updateOne(
        { id: item.productId, 'variants.id': item.variantId },
        { $inc: { 'variants.$.stock': -item.quantity } },
      );
    }
    return;
  }

  const store = readLocalStore();
  for (const item of items) {
    const prod = store.products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);
    if (variant) {
      variant.stock = Math.max(0, variant.stock - item.quantity);
    }
  }
  writeLocalStore(store);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  if (isMongoConnected()) {
    return await UserModel.findOne({ email: normalized }).lean<UserRecord | null>();
  }
  const store = readLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function findAdminUser(): Promise<UserRecord | null> {
  if (isMongoConnected()) {
    return await UserModel.findOne({ role: 'admin' }).lean<UserRecord | null>();
  }
  const store = readLocalStore();
  return store.users.find((u) => u.role === 'admin') ?? null;
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  if (isMongoConnected()) {
    const created = await UserModel.create(user);
    return created.toObject() as UserRecord;
  }
  const store = readLocalStore();
  store.users.push(user);
  writeLocalStore(store);
  return user;
}

export async function getNextOrderNumber(): Promise<string> {
  if (isMongoConnected()) {
    const count = await OrderModel.countDocuments();
    return `NK-${1042 + count}`;
  }
  const store = readLocalStore();
  const seq = store.nextOrderSeq || 1042;
  store.nextOrderSeq = seq + 1;
  writeLocalStore(store);
  return `NK-${seq}`;
}

export async function createOrder(order: OrderRecord): Promise<OrderRecord> {
  if (isMongoConnected()) {
    const created = await OrderModel.create(order);
    return created.toObject() as OrderRecord;
  }
  const store = readLocalStore();
  store.orders.unshift(order);
  writeLocalStore(store);
  return order;
}

export async function listOrders(): Promise<OrderRecord[]> {
  if (isMongoConnected()) {
    return await OrderModel.find({}).sort({ createdAt: -1 }).lean<OrderRecord[]>();
  }
  const store = readLocalStore();
  return [...store.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listOrdersByUser(userId: string): Promise<OrderRecord[]> {
  if (isMongoConnected()) {
    return await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean<OrderRecord[]>();
  }
  const store = readLocalStore();
  return store.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function findOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
  const normalized = orderNumber.trim().toUpperCase();
  if (isMongoConnected()) {
    return await OrderModel.findOne({ orderNumber: normalized }).lean<OrderRecord | null>();
  }
  const store = readLocalStore();
  return store.orders.find((o) => o.orderNumber.toUpperCase() === normalized) ?? null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderRecord | null> {
  const updatedAt = new Date().toISOString();
  if (isMongoConnected()) {
    return await OrderModel.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt } },
      { new: true },
    ).lean<OrderRecord | null>();
  }
  const store = readLocalStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  store.orders[idx] = { ...store.orders[idx], status, updatedAt };
  writeLocalStore(store);
  return store.orders[idx];
}

export const VALID_CATEGORIES: ProductCategory[] = [
  'Dresses',
  'Fruits',
  'Vegetables',
  'Groceries',
  'Shoes',
  'Cosmetics',
];
