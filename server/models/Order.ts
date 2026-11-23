import mongoose, { Schema } from 'mongoose';
import type { OrderRecord } from '../types.ts';

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    variantName: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CARD', 'COD'], required: true },
    status: {
      type: String,
      enum: ['Confirmed', 'Preparing Shipment', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Confirmed',
    },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

export const OrderModel =
  mongoose.models.Order || mongoose.model<OrderRecord>('Order', OrderSchema);
