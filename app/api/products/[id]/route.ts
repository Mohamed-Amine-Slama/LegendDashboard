import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, getDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { MongoProduct } from "@/lib/types";
import { validateProduct } from "../route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function parseId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function GET(_req: Request, ctx: RouteContext) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await ctx.params;
  const oid = parseId(id);
  if (!oid) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const db = await getDb();
  const doc = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .findOne({ _id: oid as unknown as MongoProduct["_id"] });

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ product: { ...doc, _id: String(doc._id) } });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await ctx.params;
  const oid = parseId(id);
  if (!oid) return NextResponse.json({ error: "invalid id" }, { status: 400 });

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

  const update: Partial<MongoProduct> = {
    ...(body as MongoProduct),
    updatedAt: new Date().toISOString(),
  };
  delete (update as { _id?: unknown })._id;
  delete (update as { createdAt?: unknown }).createdAt;

  const db = await getDb();
  const result = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .findOneAndUpdate(
      { _id: oid as unknown as MongoProduct["_id"] },
      { $set: update },
      { returnDocument: "after" },
    );

  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ product: { ...result, _id: String(result._id) } });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await ctx.params;
  const oid = parseId(id);
  if (!oid) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const db = await getDb();
  const result = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .deleteOne({ _id: oid as unknown as MongoProduct["_id"] });

  if (!result.deletedCount) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
