export type ProductCategory =
  | 'Dresses'
  | 'Fruits'
  | 'Vegetables'
  | 'Groceries'
  | 'Shoes'
  | 'Cosmetics';

export type OrderStatus =
  | 'Confirmed'
  | 'Preparing Shipment'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'CARD' | 'COD';

export interface ProductVariant {
  id: string;
  name: string;
  hex: string;
  stock: number;
}

export interface ProductReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  description: string;
  materials: string;
  dimensions: string;
  image: string;
  accentHex: string;
  tag?: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  variants: ProductVariant[];
  reviews: ProductReview[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  variantName: string;
  variantHex: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  variantName: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}
