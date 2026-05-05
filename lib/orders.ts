import "server-only";

import { ObjectId, type Filter } from "mongodb";

import { COLLECTIONS, getDb } from "@/lib/db";
import type { MongoOrder, OrderStatus } from "@/lib/types";

/** Server-only orders helpers for the dashboard.
 *
 *  The storefront writes to this collection via its own /api/orders.
 *  The dashboard reads, lists, and updates status. */

/** Mirrors `ORDER_TTL_DAYS` in the storefront's `lib/orders.ts`. Keep both
 *  in sync — the storefront stamps `expiresAt` at write time using this
 *  value, and the dashboard's backfill below also relies on it. */
export const ORDER_TTL_DAYS = 395;
const TTL_INDEX_NAME = "orders_ttl_expiresAt";

let indexesEnsured = false;

/** Idempotent: creates the TTL index and backfills `expiresAt` on any
 *  order missing it. Safe to call from any read path — Mongo handles
 *  duplicate index creation gracefully and the backfill becomes a no-op
 *  once every order has the field. */
async function ensureOrdersIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const db = await getDb();
  const orders = db.collection(COLLECTIONS.orders);

  await orders.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: TTL_INDEX_NAME, background: true },
  );

  await orders.updateMany(
    { expiresAt: { $exists: false } },
    [
      {
        $set: {
          expiresAt: {
            $dateAdd: {
              startDate: {
                $cond: [
                  { $eq: [{ $type: "$createdAt" }, "string"] },
                  { $dateFromString: { dateString: "$createdAt" } },
                  "$createdAt",
                ],
              },
              unit: "day",
              amount: ORDER_TTL_DAYS,
            },
          },
        },
      },
    ],
  );

  indexesEnsured = true;
}

interface ListOrdersOptions {
  status?: OrderStatus;
  /** Inclusive ISO date — orders with createdAt >= from. */
  from?: string;
  /** Exclusive ISO date — orders with createdAt < to. */
  to?: string;
  /** Substring match on reference / customer name / phone. */
  search?: string;
  limit?: number;
}

export async function fetchOrders(
  opts: ListOrdersOptions = {},
): Promise<MongoOrder[]> {
  const db = await getDb();
  await ensureOrdersIndexes();
  const filter: Filter<MongoOrder> = {};

  if (opts.status) filter.status = opts.status;

  if (opts.from || opts.to) {
    filter.createdAt = {};
    if (opts.from) filter.createdAt.$gte = opts.from;
    if (opts.to) filter.createdAt.$lt = opts.to;
  }

  if (opts.search) {
    const escaped = opts.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    filter.$or = [
      { reference: rx },
      { "customer.fullName": rx },
      { "customer.phone": rx },
    ];
  }

  const docs = await db
    .collection<MongoOrder>(COLLECTIONS.orders)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 500)
    .toArray();

  return docs.map((d) => ({ ...d, _id: String(d._id) }));
}

export async function fetchOrder(id: string): Promise<MongoOrder | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<MongoOrder>(COLLECTIONS.orders)
    .findOne({ _id: new ObjectId(id) as unknown as MongoOrder["_id"] });
  if (!doc) return null;
  return { ...doc, _id: String(doc._id) };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const res = await db.collection(COLLECTIONS.orders).updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date().toISOString() } },
  );
  return res.matchedCount === 1;
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const res = await db
    .collection(COLLECTIONS.orders)
    .deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

/* ─────────────────────────────────────────────────────────────────
   Analytics aggregates.
   Cancelled orders are excluded from revenue / units / best-seller.
   ───────────────────────────────────────────────────────────────── */

export interface AnalyticsBucket {
  /** ISO date (YYYY-MM-DD) for daily, YYYY-Www for weekly, YYYY-MM for monthly. */
  bucket: string;
  revenueTND: number;
  orderCount: number;
}

export interface BestSeller {
  productId: string;
  name: string;
  unitsSold: number;
  revenueTND: number;
}

export interface AnalyticsSummary {
  totalRevenueTND: number;
  totalOrders: number;
  totalUnitsSold: number;
  pendingOrders: number;
  /** Revenue earned in the trailing 24h. */
  revenueToday: number;
  revenue7d: number;
  revenue30d: number;
  daily: AnalyticsBucket[];   // last 30 days
  weekly: AnalyticsBucket[];  // last 12 weeks (ISO weeks)
  monthly: AnalyticsBucket[]; // last 12 months
  bestSellers: BestSeller[];
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ym(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function isoWeek(d: Date): string {
  // ISO 8601 week. Reference: https://weeknumber.com/how-to/javascript
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function computeAnalytics(): Promise<AnalyticsSummary> {
  const db = await getDb();
  await ensureOrdersIndexes();

  // Pull every non-cancelled order. At ~10K orders this stays sub-second
  // and lets us do all aggregates in one pass without server-side $group.
  const orders = await db
    .collection<MongoOrder>(COLLECTIONS.orders)
    .find({ status: { $ne: "cancelled" } })
    .project({
      reference: 1,
      totalTND: 1,
      items: 1,
      status: 1,
      createdAt: 1,
    })
    .toArray();

  const pendingPromise = db
    .collection<MongoOrder>(COLLECTIONS.orders)
    .countDocuments({ status: "pending" });

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const ms24h = 24 * 60 * 60 * 1000;

  let totalRevenueTND = 0;
  let totalUnitsSold = 0;
  let revenueToday = 0;
  let revenue7d = 0;
  let revenue30d = 0;

  // Build date-bucket maps incrementally.
  const dailyMap = new Map<string, AnalyticsBucket>();
  const weeklyMap = new Map<string, AnalyticsBucket>();
  const monthlyMap = new Map<string, AnalyticsBucket>();

  // Best-seller accumulator keyed by productId.
  const productAgg = new Map<string, BestSeller>();

  for (const o of orders) {
    const total = Number(o.totalTND ?? 0);
    if (!Number.isFinite(total)) continue;
    const created = new Date(o.createdAt);
    if (Number.isNaN(created.getTime())) continue;

    totalRevenueTND += total;

    const ageMs = now.getTime() - created.getTime();
    if (ageMs <= ms24h) revenueToday += total;
    if (ageMs <= 7 * ms24h) revenue7d += total;
    if (ageMs <= 30 * ms24h) revenue30d += total;

    const dKey = ymd(created);
    const wKey = isoWeek(created);
    const mKey = ym(created);
    const bumpBucket = (
      map: Map<string, AnalyticsBucket>,
      key: string,
    ) => {
      const cur = map.get(key);
      if (cur) {
        cur.revenueTND += total;
        cur.orderCount += 1;
      } else {
        map.set(key, { bucket: key, revenueTND: total, orderCount: 1 });
      }
    };
    bumpBucket(dailyMap, dKey);
    bumpBucket(weeklyMap, wKey);
    bumpBucket(monthlyMap, mKey);

    for (const it of o.items ?? []) {
      const qty = Number(it.qty ?? 0);
      const lineTotal = Number(
        it.lineTotalTND ?? Number(it.unitPriceTND) * qty,
      );
      if (!Number.isFinite(qty) || qty <= 0) continue;
      totalUnitsSold += qty;
      const cur = productAgg.get(it.productId);
      if (cur) {
        cur.unitsSold += qty;
        cur.revenueTND += Number.isFinite(lineTotal) ? lineTotal : 0;
      } else {
        productAgg.set(it.productId, {
          productId: it.productId,
          name: it.name,
          unitsSold: qty,
          revenueTND: Number.isFinite(lineTotal) ? lineTotal : 0,
        });
      }
    }
  }

  // Sort buckets chronologically and trim to recent windows.
  const sortByBucket = (arr: AnalyticsBucket[]) =>
    arr.sort((a, b) => a.bucket.localeCompare(b.bucket));

  const daily = sortByBucket([...dailyMap.values()]).slice(-30);
  const weekly = sortByBucket([...weeklyMap.values()]).slice(-12);
  const monthly = sortByBucket([...monthlyMap.values()]).slice(-12);

  const bestSellers = [...productAgg.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueTND - a.revenueTND)
    .slice(0, 10);

  return {
    totalRevenueTND: round2(totalRevenueTND),
    totalOrders: orders.length,
    totalUnitsSold,
    pendingOrders: await pendingPromise,
    revenueToday: round2(revenueToday),
    revenue7d: round2(revenue7d),
    revenue30d: round2(revenue30d),
    daily: daily.map((b) => ({ ...b, revenueTND: round2(b.revenueTND) })),
    weekly: weekly.map((b) => ({ ...b, revenueTND: round2(b.revenueTND) })),
    monthly: monthly.map((b) => ({ ...b, revenueTND: round2(b.revenueTND) })),
    bestSellers: bestSellers.map((b) => ({ ...b, revenueTND: round2(b.revenueTND) })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
