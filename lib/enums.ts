import type {
  Brand,
  FlavorFamily,
  LiquidType,
  NicotineMg,
  ProductBadge,
  ShopCategory,
  Volume,
} from "./types";

/** Single source of truth for select-list options across the dashboard. */

export const CATEGORIES: ShopCategory[] = ["PODS", "PUFFS", "CAPSULES", "LIQUID", "COILS"];

export const NICOTINE_OPTIONS: { value: NicotineMg; label: string }[] = [
  { value: 0, label: "0mg — Nicotine Free" },
  { value: 10, label: "10mg — Light" },
  { value: 20, label: "20mg — Standard" },
  { value: 50, label: "50mg — Strong (MAX)" },
];

export const VOLUME_OPTIONS: Volume[] = [1, 2, 4, 10, 30];

/** LIQUID sub-categories — only shown when category === "LIQUID". */
export const LIQUID_TYPES: { value: LiquidType; label: string }[] = [
  { value: "Fruity",   label: "Fruity" },
  { value: "Gourmand", label: "Gourmand" },
];

export const FLAVOR_FAMILIES: { value: FlavorFamily; color: string }[] = [
  { value: "Fruity", color: "#E8463A" },
  { value: "Minty", color: "#4AC9A0" },
  { value: "Creamy", color: "#F5D6A0" },
  { value: "Tobacco", color: "#7B4F2E" },
  { value: "Sweet", color: "#E07BBF" },
  { value: "Icy", color: "#A8D4E6" },
];

export const BRANDS: Brand[] = [
  "La Maison Des Vapes Original",
  "La Maison Des Vapes MAX",
  "La Maison Des Vapes PRO",
  "La Maison Des Vapes LITE",
  "Vozol",
  "Wotofo",
];

export const BADGES: { value: ProductBadge | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "NEW", label: "NEW" },
  { value: "HOT", label: "HOT" },
  { value: "MAX", label: "MAX" },
];
