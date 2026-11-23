import mongoose, { Schema } from 'mongoose';
import type { ProductRecord } from '../types.ts';

const VariantSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ReviewSchema = new Schema(
  {
    id: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: String, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema<ProductRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Dresses', 'Fruits', 'Vegetables', 'Groceries', 'Shoes', 'Cosmetics'],
    },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    description: { type: String, required: true },
    materials: { type: String, required: true },
    dimensions: { type: String, required: true },
    image: { type: String, required: true },
    accentHex: { type: String, required: true },
    tag: { type: String },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    variants: { type: [VariantSchema], default: [] },
    reviews: { type: [ReviewSchema], default: [] },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

export const ProductModel =
  mongoose.models.Product || mongoose.model<ProductRecord>('Product', ProductSchema);
