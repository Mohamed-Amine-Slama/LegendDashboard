import { type NextRequest } from "next/server";
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

/**
 * CSV export of orders. Excel + Google Sheets + Numbers all open this
 * natively. UTF-8 BOM is prefixed so Excel-on-Windows shows Arabic and
 * accented French correctly without manual encoding fix.
 *
 * One row per line item (so a 3-product order produces 3 rows that share
 * the same reference + customer columns). This makes pivot tables and
 * per-product analysis straightforward.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && (VALID_STATUSES as string[]).includes(statusParam)
      ? (statusParam as OrderStatus)
      : undefined;

  const orders = await fetchOrders({
    status,
    search: url.searchParams.get("search") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: 10_000,
  });

  const headers = [
    "Reference",
    "Status",
    "Placed",
    "Customer",
    "Phone",
    "Email",
    "Address",
    "City",
    "Governorate",
    "Postal code",
    "Notes",
    "Locale",
    "Payment",
    "Product ID",
    "Product",
    "Category",
    "Qty",
    "Unit price (TND)",
    "List price (TND)",
    "Line total (TND)",
    "Order subtotal (TND)",
    "Shipping (TND)",
    "Order total (TND)",
  ];

  const rows: string[][] = [headers];
  for (const o of orders) {
    const placedAt = (() => {
      try {
        return new Date(o.createdAt).toISOString();
      } catch {
        return o.createdAt;
      }
    })();

    if (o.items.length === 0) {
      rows.push([
        o.reference,
        o.status,
        placedAt,
        o.customer.fullName,
        o.customer.phone,
        o.customer.email ?? "",
        o.delivery.address,
        o.delivery.city,
        o.delivery.governorate,
        o.delivery.postalCode ?? "",
        o.delivery.notes ?? "",
        o.locale,
        o.paymentMethod,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        o.subtotalTND.toFixed(2),
        o.shippingTND.toFixed(2),
        o.totalTND.toFixed(2),
      ]);
      continue;
    }

    for (const it of o.items) {
      rows.push([
        o.reference,
        o.status,
        placedAt,
        o.customer.fullName,
        o.customer.phone,
        o.customer.email ?? "",
        o.delivery.address,
        o.delivery.city,
        o.delivery.governorate,
        o.delivery.postalCode ?? "",
        o.delivery.notes ?? "",
        o.locale,
        o.paymentMethod,
        it.productId,
        it.name,
        it.category,
        String(it.qty),
        it.unitPriceTND.toFixed(2),
        it.listPriceTND.toFixed(2),
        it.lineTotalTND.toFixed(2),
        o.subtotalTND.toFixed(2),
        o.shippingTND.toFixed(2),
        o.totalTND.toFixed(2),
      ]);
    }
  }

  const csv =
    "﻿" + // UTF-8 BOM so Excel reads Arabic/accents correctly
    rows
      .map((r) => r.map(escapeCsvCell).join(","))
      .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `orders-${stamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCsvCell(value: string): string {
  // RFC 4180: quote if cell contains comma, quote, CR, or LF; double up internal quotes.
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
