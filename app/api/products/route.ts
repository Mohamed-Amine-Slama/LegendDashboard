import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, getDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { MongoProduct } from "@/lib/types";

/**
 * GET /api/products  → list all
 * POST /api/products → create new
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const docs = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .find({})
    .sort({ featuredOrder: 1, releaseOrder: -1 })
    .toArray();
  return NextResponse.json({
    products: docs.map((d) => ({ ...d, _id: String(d._id) })),
  });
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<MongoProduct>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const validation = validateProduct(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const doc: MongoProduct = {
    ...(body as MongoProduct),
    inStock: body.inStock ?? true,
    caffeinated: body.caffeinated ?? false,
    releaseOrder: body.releaseOrder ?? Math.floor(Date.now() / 1000),
    featuredOrder: body.featuredOrder ?? 100,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { _id?: unknown })._id;

  const db = await getDb();
  const result = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .insertOne(doc);

  return NextResponse.json(
    {
      product: { ...doc, _id: String(result.insertedId) },
    },
    { status: 201 },
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

export function validateProduct(
  body: Partial<MongoProduct>,
): { ok: true } | { ok: false; error: string } {
  if (!body.name || typeof body.name !== "string") {
    return { ok: false, error: "name is required" };
  }
  if (!body.category) return { ok: false, error: "category is required" };
  if (typeof body.priceTND !== "number" || body.priceTND < 0) {
    return { ok: false, error: "priceTND must be a non-negative number" };
  }
  return { ok: true };
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}
