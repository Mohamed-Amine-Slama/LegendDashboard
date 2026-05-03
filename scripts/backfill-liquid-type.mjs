// Backfill `liquidType` on every LIQUID product.
//
// Rule (per user): any liquid that contains a fruit in its description or
// name is Fruity. Everything else is Gourmand. Fruit-keyword detection
// runs against (description + " " + name).
//
// This re-classifies on every run — pass --apply to commit. Manual
// dashboard edits will be overwritten; that's the intent of this script.
//
// Usage (from legend-vape-store-dashboard/):
//   node --env-file=.env.local scripts/backfill-liquid-type.mjs           # dry-run
//   node --env-file=.env.local scripts/backfill-liquid-type.mjs --apply   # commit

import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";

/** French + English fruit keywords found in flavor descriptions. Substring
 *  match (case-insensitive) — `description.toLowerCase().includes(kw)`. */
const FRUIT_KEYWORDS = [
  "fruit",       // catches: fruit, fruits, fruité, fruitée, fruity, "fruit du dragon"
  "fraise",
  "framboise",
  "myrtille",
  "mûre",
  "cassis",
  "cerise",
  "grenade",
  "pomegranate",
  "raisin",
  "baie",        // baies, baie sauvage
  "pomme",       // pomme, pomme verte
  "poire",
  "pêche",
  "peche",
  "abricot",
  "nectarine",
  "prune",
  "mirabelle",
  "figue",
  "datte",
  "citron",      // citron, citron vert
  "lime",
  "orange",
  "pamplemousse",
  "mandarine",
  "clémentine",
  "yuzu",
  "mangue",
  "ananas",
  "banane",
  "kiwi",
  "litchi",
  "papaye",
  "pitaya",
  "melon",
  "pastèque",
  "pasteque",
  "coco",        // noix de coco
  "cranberry",
  "myrtille",
  "berry",
];

function containsFruit(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return FRUIT_KEYWORDS.some((kw) => t.includes(kw));
}

function classify(p) {
  const haystack = `${p.description ?? ""} ${p.name ?? ""}`;
  return containsFruit(haystack) ? "Fruity" : "Gourmand";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("products");

    const rows = await col
      .find({ category: "LIQUID" })
      .project({ _id: 1, name: 1, description: 1, liquidType: 1 })
      .sort({ name: 1 })
      .toArray();

    if (rows.length === 0) {
      console.log("No LIQUID products in catalogue.");
      return;
    }

    const plan = rows.map((p) => {
      const target = classify(p);
      const current = p.liquidType ?? "<unset>";
      return { ...p, target, changed: target !== p.liquidType };
    });

    const buckets = { Fruity: [], Gourmand: [] };
    for (const r of plan) buckets[r.target].push(r);

    console.log(`\n=== Plan: ${plan.length} LIQUID product(s) ===`);
    console.log(`  Fruity:   ${buckets.Fruity.length}`);
    console.log(`  Gourmand: ${buckets.Gourmand.length}`);
    console.log(`  Changes:  ${plan.filter((r) => r.changed).length}\n`);

    for (const t of /** @type {const} */ (["Fruity", "Gourmand"])) {
      console.log(`--- ${t} (${buckets[t].length}) ---`);
      for (const r of buckets[t]) {
        const change = r.changed
          ? ` [${r.liquidType ?? "<unset>"} → ${r.target}]`
          : "";
        console.log(`  ${r.name}${change}`);
      }
      console.log("");
    }

    if (!apply) {
      console.log("Dry-run only. Re-run with --apply to commit.");
      return;
    }

    let modified = 0;
    for (const r of plan) {
      if (!r.changed) continue;
      const result = await col.updateOne(
        { _id: r._id },
        { $set: { liquidType: r.target, updatedAt: new Date().toISOString() } },
      );
      modified += result.modifiedCount;
    }
    console.log(`\nApplied. ${modified} document(s) updated.`);

    const totals = await col
      .aggregate([
        { $match: { category: "LIQUID" } },
        { $group: { _id: "$liquidType", n: { $sum: 1 } } },
      ])
      .toArray();
    console.log("\n=== final liquidType distribution ===");
    for (const row of totals.sort((a, b) => String(a._id).localeCompare(String(b._id)))) {
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
