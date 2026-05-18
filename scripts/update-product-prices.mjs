// Bulk update product prices in MongoDB.
//
// Usage (from legend-vape-store-dashboard/):
//   node --env-file=.env.local scripts/update-product-prices.mjs --dry-run
//   node --env-file=.env.local scripts/update-product-prices.mjs
//   node --env-file=.env.local scripts/update-product-prices.mjs --force
//
// Flags:
//   --dry-run   show what would change, write nothing
//   --force     write every entry even if the DB value already matches
//
// How to edit:
//   1. Find the product in the UPDATES array below (grouped by category).
//   2. Change `priceTND` to the new price (whole TND, integer or decimal).
//   3. To put a product on promo:
//        { name: "Vozol Gear 50000", priceTND: 70, onPromo: true, promoPriceTND: 59 }
//      promoPriceTND MUST be strictly less than priceTND.
//   4. To clear an existing promo, add `onPromo: false` to that entry.
//      The script will unset promoPriceTND on the document.
//   5. Run with --dry-run first to preview, then run for real.
//
// The "// current N" comments reflect the seed prices at the time this script
// was generated; if you've already updated prices, the live DB may differ.

import { MongoClient } from "mongodb";

const UPDATES = [
  // ─── CAPSULES ────────────────────────────────────────────
  { name: "NexPod Capsule 5K",                  priceTND: 25 },  // current 18
  { name: "NexPod Capsule 15K",                 priceTND: 40 },  // current 28

  // ─── COILS ───────────────────────────────────────────────
  { name: "Coil 0.18ohm",                       priceTND: 5 },   // current 5
  { name: "Coil 0.28ohm",                       priceTND: 5 },   // current 5
  { name: "Coil 0.32ohm",                       priceTND: 5 },   // current 5
  { name: "Coil 0.62ohm",                       priceTND: 5 },   // current 5
  { name: "GeekVape Z",                         priceTND: 15 },   // current 5
  { name: "PNP Screw",                          priceTND: 15 },   // current 5
  { name: "Vaporesso GT Cores",                 priceTND: 15 },   // current 5
  { name: "Vaporesso GTI",                      priceTND: 15 },   // current 5
  { name: "Vaporesso GTX",                      priceTND: 15 },   // current 5
  { name: "Voopoo PNP-TW30",                    priceTND: 15 },   // current 5

  // ─── LIQUID ──────────────────────────────────────────────
  { name: "A&L Ultimate Fury 10ml",             priceTND: 15 },  // current 15
  { name: "A&L Ultimate Kami 50ml",             priceTND: 15 },  // current 15
  { name: "A&L Ultimate Luna 50ml",             priceTND: 15 },  // current 15
  { name: "A&L Ultimate Oni 10ml",              priceTND: 15 },  // current 15
  { name: "A&L Ultimate Phoenix 10ml",          priceTND: 15 },  // current 15
  { name: "A&L Ultimate Ragnarok 10ml",         priceTND: 15 },  // current 15
  { name: "A&L Ultimate Ragnarok X 50ml",       priceTND: 15 },  // current 15
  { name: "A&L Ultimate Shiva 10ml",            priceTND: 15 },  // current 24
  { name: "A&L Ultimate Succube V2 50ml",       priceTND: 15 },  // current 18
  { name: "Banana Milkshake",                   priceTND: 18 },  // current 18
  { name: "Banana Nutter Butter",               priceTND: 18 },  // current 18
  { name: "Barakko Fuel Fighter 50ml",          priceTND: 15 },  // current 15
  { name: "Bloody Shigiri Fuel Fighter 50ml",   priceTND: 15 },  // current 15
  { name: "Chou Chou Pistache",                 priceTND: 18 },  // current 18
  { name: "Cookie Milk Nomz 30ml",              priceTND: 18 },  // current 18
  { name: "Cookies & Cream A&L",                priceTND: 18 },  // current 18
  { name: "Creme Kong Banana 200ml",            priceTND: 18 },  // current 18
  { name: "Creme Kong Caramel 200ml",           priceTND: 18 },  // current 18
  { name: "Creme Kong Vanilla 200ml",           priceTND: 18 },  // current 18
  { name: "Crunch Nom Nomz 30ml",               priceTND: 18 },  // current 18
  { name: "Custard Cream",                      priceTND: 18 },  // current 18
  { name: "Dinner Lady Lemon Tart",             priceTND: 18 },  // current 18
  { name: "Dinner Lady Strawberry Macaroon",    priceTND: 18 },  // current 18
  { name: "Eclaire Au Café",                    priceTND: 18 },  // current 18
  { name: "Feral GO-RILLA 30ml",                priceTND: 15 },  // current 15
  { name: "Fruity Fuel Blue Oil 30ml",          priceTND: 15 },  // current 15
  { name: "Fruity Fuel Red Oil 30ml",           priceTND: 15 },  // current 15
  { name: "Full Moon Blue 50ml",                priceTND: 15 },  // current 15
  { name: "Full Moon Green 50ml",               priceTND: 15 },  // current 15
  { name: "Full Moon Hypnose 50ml",             priceTND: 15 },  // current 15
  { name: "Full Moon Purple 50ml",              priceTND: 15 },  // current 15
  { name: "JAX Banana",                         priceTND: 18 },  // current 18
  { name: "JAX Cereal",                         priceTND: 18 },  // current 18
  { name: "JAX Peanut Butter",                  priceTND: 18 },  // current 18
  { name: "Kansets Fuel Fighter",               priceTND: 15 },  // current 15
  { name: "King Koba 50ml",                     priceTND: 15 },  // current 15
  { name: "King Winter 50ml",                   priceTND: 15 },  // current 70
  { name: "Le Mille Feuille",                   priceTND: 18 },  // current 18
  { name: "Le Tiramisu",                        priceTND: 18 },  // current 18
  { name: "Lycan Green Legend",                 priceTND: 15 },  // current 15
  { name: "Lycan Original Legend",              priceTND: 15 },  // current 15
  { name: "Lycan Pink Legend",                  priceTND: 15 },  // current 15
  { name: "Lycan Red Legend",                   priceTND: 15 },  // current 15
  { name: "Medusa Purple Vodka 50ml",           priceTND: 15 },  // current 15
  { name: "Medusa Red Wedding 50ml",            priceTND: 15 },  // current 15
  { name: "MilfsMan 30ml",                      priceTND: 18 },  // current 18
  { name: "MilfsMilk Almond 30ml",              priceTND: 18 },  // current 18
  { name: "MilfsMilk Blackcurrant 30ml",        priceTND: 18 },  // current 18
  { name: "MilfsMilk Original 30ml",            priceTND: 18 },  // current 18
  { name: "Minasawa Fuel Fighter 50ml",         priceTND: 15 },  // current 15
  { name: "Monkey Brek Nomz 30ml",              priceTND: 18 },  // current 18
  { name: "Nana's Treat Nomz 30ml",             priceTND: 18 },  // current 18
  { name: "Paris Brest",                        priceTND: 18 },  // current 18
  { name: "Perfect Cream",                      priceTND: 18 },  // current 18
  { name: "Petit Beurre 30ml",                  priceTND: 18 },  // current 18
  { name: "Projet Vape Or Diy",                 priceTND: 18 },  // current 18
  { name: "Psycho Bunny Yellow Mirage",         priceTND: 18 },  // current 15
  { name: "Rugged GO-RILLA 30ml",               priceTND: 15 },  // current 15
  { name: "Shaken Fuel Fighter 50ml",           priceTND: 15 },  // current 15
  { name: "Shigiri Fuel Fighter 50ml",          priceTND: 15 },  // current 15
  { name: "Strawberry Milkshake",               priceTND: 18 },  // current 18
  { name: "Toshimura Fuel Fighter 50ml",        priceTND: 15 },  // current 15
  { name: "Uraken Fuel Fighter 50ml",           priceTND: 15 },  // current 18
  { name: "Ushiro Fuel Fighter 50ml",           priceTND: 15 },  // current 15
  { name: "Zakary Fuel Fighter 50ml",           priceTND: 15 },  // current 15

  // ─── PODS ────────────────────────────────────────────────
  { name: "NexPod",                             priceTND: 55 },  // current 70
  { name: "NexPod Kit 15K",                     priceTND: 65 },  // current 35
  { name: "NexPod Refillo",                     priceTND: 80 },  // current 15

  // ─── PUFFS ───────────────────────────────────────────────
  { name: "Vozol Gear 20000",                   priceTND: 55 },  // current 40
  { name: "Vozol Gear 50000",                   priceTND: 70 },  // current 70
  { name: "Vozol Gear Power 20000",             priceTND: 55 },  // current 40
  { name: "Vozol Rave 40000",                   priceTND: 60 },  // current 60
  { name: "Vozol Star 20000",                   priceTND: 55 },  // current 40
  { name: "Vozol Star 40000",                   priceTND: 60 },  // current 60
  { name: "Vozol Vista 20000",                  priceTND: 55 },  // current 40
  { name: "Vozol Vista 40000",                  priceTND: 60 },  // current 60
  { name: "Wotofo Nexbar 18000",                priceTND: 45 },  // current 38
  { name: "Wotofo Nexbar 20000",                priceTND: 50 },  // current 40
  { name: "Wotofo Nexbar 30000",                priceTND: 55 },  // current 50
  { name: "Wotofo Ultra 20000",                 priceTND: 50 },  // current 40
];

const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";
const COLLECTION = "products";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

function validateUpdates() {
  const seen = new Set();
  const errors = [];
  for (const u of UPDATES) {
    if (!u.name || typeof u.name !== "string") {
      errors.push(`Entry missing 'name': ${JSON.stringify(u)}`);
      continue;
    }
    if (seen.has(u.name)) errors.push(`Duplicate name in UPDATES: "${u.name}"`);
    seen.add(u.name);

    if (typeof u.priceTND !== "number" || !Number.isFinite(u.priceTND) || u.priceTND <= 0) {
      errors.push(`"${u.name}": priceTND must be a positive number, got ${u.priceTND}`);
    }
    if (u.onPromo === true) {
      if (typeof u.promoPriceTND !== "number" || !Number.isFinite(u.promoPriceTND)) {
        errors.push(`"${u.name}": onPromo=true requires a numeric promoPriceTND.`);
      } else if (u.promoPriceTND >= u.priceTND) {
        errors.push(`"${u.name}": promoPriceTND (${u.promoPriceTND}) must be less than priceTND (${u.priceTND}).`);
      }
    }
  }
  return errors;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local before running this script.");
    process.exit(1);
  }

  const errors = validateUpdates();
  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}${FORCE ? " | FORCE" : ""}`);
  console.log(`Database: ${DB_NAME}.${COLLECTION}`);
  console.log(`Entries:  ${UPDATES.length}\n`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  try {
    await client.connect();
    const collection = client.db(DB_NAME).collection(COLLECTION);

    const existing = await collection
      .find({}, { projection: { name: 1, priceTND: 1, onPromo: 1, promoPriceTND: 1 } })
      .toArray();
    const byName = new Map(existing.map((d) => [d.name, d]));

    const now = new Date().toISOString();
    let updated = 0;
    let unchanged = 0;
    let notFound = 0;

    for (const u of UPDATES) {
      const current = byName.get(u.name);
      if (!current) {
        console.log(`  not found  | ${u.name}`);
        notFound++;
        continue;
      }

      const setOps = { priceTND: u.priceTND, updatedAt: now };
      const unsetOps = {};

      if (u.onPromo === true) {
        setOps.onPromo = true;
        setOps.promoPriceTND = u.promoPriceTND;
      } else if (u.onPromo === false) {
        setOps.onPromo = false;
        unsetOps.promoPriceTND = "";
      }

      const priceChanged = current.priceTND !== u.priceTND;
      const promoFlagChanged = u.onPromo !== undefined && current.onPromo !== u.onPromo;
      const promoPriceChanged =
        u.onPromo === true && current.promoPriceTND !== u.promoPriceTND;
      const dirty = priceChanged || promoFlagChanged || promoPriceChanged;

      if (!dirty && !FORCE) {
        unchanged++;
        continue;
      }

      const before = formatPrice(current.priceTND, current.onPromo, current.promoPriceTND);
      const after = formatPrice(u.priceTND, u.onPromo ?? current.onPromo, u.onPromo === true ? u.promoPriceTND : (u.onPromo === false ? undefined : current.promoPriceTND));

      console.log(`  ${dirty ? "update " : "force  "}    | ${u.name.padEnd(40)} ${before}  ->  ${after}`);

      if (!DRY_RUN) {
        const updateDoc = Object.keys(unsetOps).length > 0
          ? { $set: setOps, $unset: unsetOps }
          : { $set: setOps };
        const res = await collection.updateOne({ name: u.name }, updateDoc);
        if (res.matchedCount === 0) {
          notFound++;
          continue;
        }
      }
      updated++;
    }

    console.log("\nSummary");
    console.log(`  ${DRY_RUN ? "would update" : "updated"}: ${updated}`);
    console.log(`  unchanged:    ${unchanged}`);
    console.log(`  not found:    ${notFound}`);

    const dbOnly = existing
      .map((d) => d.name)
      .filter((n) => !UPDATES.some((u) => u.name === n));
    if (dbOnly.length > 0) {
      console.log(`\nProducts in DB but missing from this script (${dbOnly.length}):`);
      for (const n of dbOnly) console.log(`  - ${n}`);
    }
  } catch (err) {
    console.error("Database operation failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

function formatPrice(price, onPromo, promoPrice) {
  if (onPromo && typeof promoPrice === "number") return `${price} (promo ${promoPrice})`;
  return `${price}`;
}

main();
