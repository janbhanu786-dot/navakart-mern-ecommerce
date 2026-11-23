import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { SEED_PRODUCTS } from '../data/seed.ts';
import { ProductModel } from '../models/Product.ts';
import type { StoreSchema } from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

let mongoConnected = false;

export function isMongoConnected(): boolean {
  return mongoConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    try {
      await mongoose.connect(uri);
      mongoConnected = true;
      const existingCount = await ProductModel.countDocuments();
      if (existingCount === 0) {
        await ProductModel.insertMany(SEED_PRODUCTS);
      }
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.warn('MongoDB connection unavailable, falling back to local store:', (err as Error).message);
      mongoConnected = false;
    }
  }

  ensureLocalStoreInitialized();
}

export function ensureLocalStoreInitialized(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreSchema = {
      products: SEED_PRODUCTS,
      users: [],
      orders: [],
      adminPasscodeHash: null,
      nextOrderSeq: 1042,
    };
    writeLocalStore(initial);
  }
}

export function readLocalStore(): StoreSchema {
  ensureLocalStoreInitialized();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw) as StoreSchema;
}

export function writeLocalStore(data: StoreSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}
