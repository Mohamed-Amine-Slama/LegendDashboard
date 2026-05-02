// Seed the `products` collection from products-seed.json.
//
// Usage (from legend-vape-store-dashboard/):
//   npm run seed              # inserts only when products collection is empty
//   npm run seed:reset        # wipes the products collection first, then inserts
//
// Env: requires MONGODB_URI (and optionally MONGODB_DB) in .env.local — loaded
// via Node's built-in `--env-file=.env.local` flag (Node 20.6+). No dotenv.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_FILE = path.join(__dirname, "products-seed.json");
const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";
const COLLECTION = "products";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local before running this script.",
    );
    process.exit(1);
  }

  const reset = process.argv.includes("--reset");

  const raw = await readFile(SEED_FILE, "utf8");
  const products = JSON.parse(raw);
  if (!Array.isArray(products) || products.length === 0) {
    console.error(`Seed file at ${SEED_FILE} is empty or invalid.`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const docs = products.map((p) => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  }));

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const existing = await col.estimatedDocumentCount();

    if (reset) {
      const { deletedCount } = await col.deleteMany({});
      console.log(`[seed] --reset: deleted ${deletedCount} existing documents.`);
    } else if (existing > 0) {
      console.log(
        `[seed] ${existing} products already in collection — skipping insert. ` +
          `Re-run with --reset to wipe and re-seed.`,
      );
      return;
    }

    const result = await col.insertMany(docs);
    console.log(
      `[seed] inserted ${result.insertedCount} products into ${DB_NAME}.${COLLECTION}.`,
    );

    const counts = await col
      .aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }])
      .toArray();
    counts.sort((a, b) => a._id.localeCompare(b._id));
    for (const row of counts) {
      console.log(`  - ${row._id}: ${row.n}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
