import { NextResponse, type NextRequest } from "next/server";
import { deleteOrder, fetchOrder, updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const order = await fetchOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const status = (body as { status?: unknown })?.status;
  if (!status || !(ORDER_STATUSES as string[]).includes(status as string)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await updateOrderStatus(id, status as OrderStatus);
  if (!ok) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const ok = await deleteOrder(id);
  if (!ok) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
