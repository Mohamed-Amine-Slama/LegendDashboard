// Read-only: list every LIQUID product so we can decide Fruity vs Gourmand
// mapping before backfilling. Run from legend-vape-store-dashboard/:
//   node --env-file=.env.local scripts/list-liquids.mjs

import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("products");

    const liquids = await col
      .find({ category: "LIQUID" })
      .project({
        _id: 1,
        name: 1,
        flavorFamily: 1,
        liquidType: 1,
        description: 1,
        flavors: 1,
      })
      .sort({ name: 1 })
      .toArray();

    console.log(`\n=== ${liquids.length} LIQUID product(s) ===\n`);
    for (const p of liquids) {
      const flavors = Array.isArray(p.flavors) && p.flavors.length
        ? `\n     flavors: ${p.flavors.join(", ")}`
        : "";
      console.log(
        `[${p._id}] ${p.name}` +
        `\n     flavorFamily: ${p.flavorFamily}` +
        `\n     liquidType:   ${p.liquidType ?? "<unset>"}` +
        (p.description ? `\n     desc: ${p.description}` : "") +
        flavors +
        "\n",
      );
    }

    const totals = await col
      .aggregate([
        { $match: { category: "LIQUID" } },
        { $group: { _id: "$liquidType", n: { $sum: 1 } } },
      ])
      .toArray();
    console.log("=== current liquidType distribution ===");
    for (const row of totals) {
      console.log(`  ${row._id ?? "<unset>"}: ${row.n}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
