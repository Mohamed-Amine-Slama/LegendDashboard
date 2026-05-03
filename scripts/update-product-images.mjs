// Script to bulk update product images in the database based on their SKU or name.
//
// Usage (from legend-vape-store-dashboard/ directory):
//   node --env-file=.env.local scripts/update-product-images.mjs

import { MongoClient } from "mongodb";

// Fill in this array with your products
// You can use 'sku' or 'name' to identify the product to update.
const UPDATES = [
  { name: "Barakko Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsGH4nUbIPwr4LosLUgbouFZQfWFIXZhlN3w&s" },
  { name: "Shigiri Fuel Fighter 50ml", imageUrl: "https://smokevapeshop.fr/2852-large_default/e-liquide-shigeri-100-ml-fighter-fuel.jpg" },
  { name: "Shaken Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRccuEBAMX1DrLtRsvLlHhSguJfNq1F--74SQ&s" },
  { name: "Minasawa Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkkFZmQAe16RRPPg57z9CGdBofX2gh-23XwQ&s" },
  { name: "Toshimura Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz80aLoo-ShihFwQQxkol0ZvhQYqrVsQVdBw&s" },
  { name: "Zakary Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvPTIjiHJgejld2oMxK8s3V1E6HOLzgu1WdA&s" },
  { name: "Kansets Fuel Fighter", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT9_gegMTV82jxyi0qG9-Irw3k0LvzghkKSQ&s" },
  { name: "Uraken Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxApzMfWUKrZMMkg-otIDiDdP5lv-Lmondpw&s" },
  { name: "Bloody Shigiri Fuel Fighter 50ml", imageUrl: "https://assets.aromes-et-liquides.fr/53504-thickbox_default/bloody-shigeri-100ml.jpg" },
  { name: "Ushiro Fuel Fighter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvEq3Q-Yr0OV8X0wKelpK86D7A-6xsQXtuZQ&s" },
  { name: "Fruity Fuel Blue Oil 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqBp0FJ3vIIq2gqfKM9q_iNcikEMzC68Fl3Q&s" },
  { name: "Fruity Fuel Red Oil 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVg8D3mBHz1AkfVu-5qiIdqFESHNBAGjoh5Q&s" },
  { name: "A&L Ultimate Ragnarok 10ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFYCHubDH1CWB5Cmls3kWSoAzDjE68JYzbMQ&s" },
  { name: "A&L Ultimate Ragnarok X 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSd2JbAOddD8pymtf6S7R0GyF-ooMg11-X2qw&s" },
  { name: "A&L Ultimate Phoenix 10ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoXiImcNNS7WmjaIviDKYvrp0GxOmmaXAYtw&s" },
  { name: "A&L Ultimate Oni 10ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJEAGHwkPFE269_rwwDlQ0WpXiYsE-h4kh8A&s" },
  { name: "A&L Ultimate Kami 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGsjf10iLjN-N8axJdpxF4rU95DfCQWojo2Q&s" },
  { name: "A&L Ultimate Luna 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzSx_uqm4za6i8ghPzYigiMKhTxPhTdJ9qvg&s" },
  { name: "A&L Ultimate Fury 10ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyUPFq3lejmy21vyorTUX4hDmwtLRYDWkE-Q&s" },
  { name: "A&L Ultimate Succube V2 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQt3xFGZplfE5aMVpXBt1d5QFwt5IHCJixiJQ&s" },
  { name: "A&L Ultimate Shiva 10ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrovR931zFZspgPceiegw54VBDlPUp4W1wnA&s" },
  { name: "King Winter 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyv7GEOeDyHkuNCTEN_Vc7Um8loDllDw-RLw&s" },
  { name: "King Koba 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQpS1e3We0XDXLOY1XS-LliFG2LwNs1BSbCA&s" },
  { name: "Lycan Pink Legend", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ2skBD1alt_Hak6xD3iPCUUpZ2bIuCYJIkA&s" },
  { name: "Lycan Original Legend", imageUrl: "https://assets.aromes-et-liquides.fr/56372-thickbox_default/concentre-lycan-original.jpg" },
  { name: "Lycan Red Legend", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsVvXJxTTMeEV-cKJVHTSOuoWKBseHYpo5mA&s" },
  { name: "Lycan Green Legend", imageUrl: "https://assets.aromes-et-liquides.fr/51108-thickbox_default/concentre-lycan-green.jpg" },
  { name: "Full Moon Blue 50ml", imageUrl: "https://assets.aromes-et-liquides.fr/27039-thickbox_default/concentre-blue-par-full-moon-.jpg" },
  { name: "Full Moon Green 50ml", imageUrl: "https://assets.aromes-et-liquides.fr/27036-thickbox_default/concentre-green-par-full-moon-.jpg" },
  { name: "Full Moon Hypnose 50ml", imageUrl: "https://assets.aromes-et-liquides.fr/33339-thickbox_default/concentre-hypnose-par-full-moon.jpg" },
  { name: "Full Moon Purple 50ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKYNqpoaA1JiG01hsY-by8rmZuuYs5B5oJJQ&s" },
  { name: "Medusa Purple Vodka 50ml", imageUrl: "https://volcano-steam.com/444-home_default/purple-vodka-concentre-30ml-the-medusa-juice.jpg" },
  { name: "Medusa Red Wedding 50ml", imageUrl: "https://volcano-steam.com/444-home_default/purple-vodka-concentre-30ml-the-medusa-juice.jpg" },
  { name: "Feral GO-RILLA 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSWJ3cEcucsMBD2XsiR9IdWfTLTAxUPuZs5w&s" },
  { name: "Rugged GO-RILLA 30ml", imageUrl: "https://www.vapotestyle.fr/11022-large_default/arome-concentre-bestial-go-rilla-temple-30ml.jpg" },
  { name: "Petit Beurre 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmIPfcEAwz_VOKsBwePIb-EPhMxlqTjSifZQ&s" },
  { name: "Eclaire Au Café", imageUrl: "https://assets.aromes-et-liquides.fr/36870-thickbox_default/concentre-l-eclair-au-cafe.jpg" },
  { name: "Le Tiramisu", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnSXI7A7oQiYzq93gal6Dz_YmJt1n8bdM9-A&s" },
  { name: "Le Mille Feuille", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjNisarZ8luk3iptRpYBr90Hb3LJ3nLsTYIA&s" },
  { name: "Paris Brest", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnjszj6NfmTDMhvLbjhOZxylBbnptO1tEq4w&s" },
  { name: "MilfsMilk Blackcurrant 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1YR4pu4t_UZGVbMs0u1wUgcOJ_xIoeZXoPw&s" },
  { name: "MilfsMilk Almond 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQha_WGzHLpmjnvaVUnP5KK6skAaTGckuChXA&s" },
  { name: "MilfsMan 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQha_WGzHLpmjnvaVUnP5KK6skAaTGckuChXA&s" },
  { name: "MilfsMilk Original 30ml", imageUrl: "https://www.smokertech-grossiste-cigarette-electronique.fr/6855-large_default/milfsmilk-v2-30ml-de-eco-vape-psycho-bunny-concentre.jpg" },
  { name: "Strawberry Milkshake", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9qV315iSGSyNIvNgrZA504ffxTYrgQfuCcw&s" },
  { name: "Banana Milkshake", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRd6lCzhormJpR_QhnNrIu5kwyR6zkotEXMQ&s" },
  { name: "Crunch Nom Nomz 30ml", imageUrl: "https://volcano-steam.com/318-home_default/concentre-strawberry-crunch-nom-nomz.jpg" },
  { name: "Nana's Treat Nomz 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmBf3-75bKe8dyrPfWT2fxl6J1QkpqHzYjfA&s" },
  { name: "Monkey Brek Nomz 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhq9SPsiAjnN2wzolqhNy7iTPIP4s2ifcvOw&s" },
  { name: "Cookie Milk Nomz 30ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRC5qse2hmWjajGCPJ51rls8pfQZIqXr_pBzQ&s" },
  { name: "Cookies & Cream A&L", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeVbxJxm__ow0GURv-sE8z0MY9uuaYcy4Sww&s" },
  { name: "Dinner Lady Lemon Tart", imageUrl: "https://assets.aromes-et-liquides.fr/38208-thickbox_default/concentre-lemon-tart.jpg" },
  { name: "Dinner Lady Strawberry Macaroon", imageUrl: "https://volcano-steam.com/1436-home_default/concentre-strawberry-macaroon-dinner-lady.jpg" },
  { name: "Projet Vape Or Diy", imageUrl: "https://www.vapor-cloud-tunisia.com/449-home_default/projet-lenny-vape-or-diy-30ml-concentre-revolute.jpg" },
  { name: "Creme Kong Vanilla 200ml", imageUrl: "https://assets.aromes-et-liquides.fr/38082-thickbox_default/concentre-creme-kong.jpg" },
  { name: "Creme Kong Caramel 200ml", imageUrl: "https://volcano-steam.com/742-home_default/caramel-creme-kong-concentre-30ml-joe-s-juice.jpg" },
  { name: "Creme Kong Banana 200ml", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqHtn35Kg9F6ZOGvQjazyyvicbF_-Y8Jl4zw&s" },
  { name: "Perfect Cream", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvOWCht1slnyvw6tN77knTPq4GNh-STwCYlA&s" },
  { name: "Banana Nutter Butter", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo-9EUlyuQIxhCa1s3Adqn5i0eL2uHJY34VQ&s" },
  { name: "Psycho Bunny Yellow Mirage", imageUrl: "https://www.smokertech-grossiste-cigarette-electronique.fr/6886-large_default/yellow-mirage-30ml-de-eco-vape-psycho-bunny-concentre.jpg" },
  { name: "Chou Chou Pistache", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc9fobRNyED4BJ5wSGyVlKAb9g3a8FdHBPWw&s" },
  { name: "JAX Peanut Butter", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc9fobRNyED4BJ5wSGyVlKAb9g3a8FdHBPWw&s" },
  { name: "JAX Banana", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwnJGnIvGZYxRmKR_w2M4Bz_CqGcNiaA_SIQ&s" },
  { name: "JAX Cereal", imageUrl: "https://media.taklope.com/35423-large_default/concentre-cereal.jpg" },
  { name: "Custard Cream", imageUrl: "https://media.taklope.com/35423-large_default/concentre-cereal.jpg" },
  { name: "NexPod", imageUrl: "" },
  { name: "NexPod Capsule 5K", imageUrl: "https://cdn.youcan.shop/stores/fdb409a17b48c52c88a09bf1518a01a9/products/brrPpuuXoGvraFNExoD5BaLbXNtZwipLjo0Qaqav.webp" },
  { name: "NexPod Capsule 15K", imageUrl: "https://cdn.shopify.com/s/files/1/0038/8032/1113/files/nexPOD_15K_20mg_Prefilled_Pod_Forest_Berries.jpg?v=1761719206" },
  { name: "Coil 0.18ohm", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgIPCDZfp4-19iPSUDQ0nC8XPuiwP21lPH8w&s" },
  { name: "Coil 0.28ohm", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9XwksYt5RZY8kCHGzoNxcy4hchAOWdxxkGA&s" },
  { name: "Coil 0.32ohm", imageUrl: "" },
  { name: "Coil 0.62ohm", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMHks6Ex2H5PZBvv3xMxa2kS_6rrM0MWavDA&s" },
  { name: "GeekVape Z", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAZFDCiz_JnUla4LexCcSZl0qM5NNrMtAieg&s" },
  { name: "Vaporesso GTI", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2vKNTERHNBWCh-x3x1VzpHAPG_cpToxb91Q&s" },
  { name: "Voopoo PNP-TW30", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd_iHL-qNZxd_t9SncXDrjs5LCl_t0PAYAEA&s" },
  { name: "Vaporesso GTX", imageUrl: "https://vape.co.uk/wp-content/uploads/2022/06/Vaporesso-GTX-Mesh-Replacement-Coils.png" },
  { name: "Vaporesso GT Cores", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3y41EVPDJzlH9LWPnawnQoV1ZrwiGX3JEjA&s" },
  { name: "PNP Screw", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQc-pPxuNn5XV6xXoGM6IqniPzdQyIqpUKIRg&s" }
];

const DB_NAME = process.env.MONGODB_DB ?? "legend-vape-store";
const COLLECTION = "products";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not set. Add it to .env.local before running this script.");
    process.exit(1);
  }

  // Allow the script to run even if URLs are empty for now
  if (UPDATES.length === 0) {
      console.warn("⚠️ Please fill in the UPDATES array with real names and imageUrls before running.");
      process.exit(0);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);
    
    let updatedCount = 0;
    let notFoundCount = 0;

    console.log(`Connected to database: ${DB_NAME}`);
    console.log(`Starting image updates...\n`);

    for (const update of UPDATES) {
      const query = {};
      if (update.sku) query.sku = update.sku;
      else if (update.name) query.name = update.name;
      else {
        console.warn("⚠️ Ignoring update object missing 'sku' or 'name':", update);
        continue;
      }

      const result = await collection.updateOne(
        query,
        { 
          $set: { 
            imageUrl: update.imageUrl,
            updatedAt: new Date().toISOString()
          } 
        }
      );

      if (result.matchedCount === 0) {
        console.log(`❌ No product found matching ${JSON.stringify(query)}`);
        notFoundCount++;
      } else {
        console.log(`✅ Updated product ${JSON.stringify(query)} with new image: ${update.imageUrl}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Finished! Successfully updated ${updatedCount} products. (${notFoundCount} not found)`);

  } catch (error) {
    console.error("❌ Database operation failed:", error);
  } finally {
    await client.close();
  }
}

main();