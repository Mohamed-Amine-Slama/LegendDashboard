import { NextResponse, type NextRequest } from "next/server";
import { fetchOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && (VALID_STATUSES as string[]).includes(statusParam)
      ? (statusParam as OrderStatus)
      : undefined;

  try {
    const orders = await fetchOrders({
      status,
      search: url.searchParams.get("search") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
