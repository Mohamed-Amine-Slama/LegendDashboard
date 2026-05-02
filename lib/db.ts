import "server-only";

import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB connection helper. Mirrors the storefront's `lib/db.ts` —
 * single shared client, cached across hot reloads in dev. Both projects
 * point at the same Atlas cluster + database, so the dashboard's writes
 * show up in the storefront's reads after the storefront's edge cache
 * (Next data cache) refreshes.
 *
 * Connection setup is deferred to first call so `next build` works in CI
 * environments without MONGODB_URI configured.
 */

const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

function ensureClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI ?? "";
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local — see .env.local.example.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5_000,
      }).connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
    }).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await ensureClient();
  return client.db(DB_NAME);
}

export const COLLECTIONS = {
  products: "products",
  categories: "categories",
  flavors: "flavors",
} as const;
