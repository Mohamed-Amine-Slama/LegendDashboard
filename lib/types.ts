/**
 * Shared product / category / flavor shapes. MUST stay aligned with the
 * storefront's `vape-store-vitrine/types/mongo.ts` — keep both in sync
 * whenever a field is added/removed.
 */

export type ShopCategory = "PODS" | "PUFFS" | "CAPSULES" | "LIQUID" | "COILS";

export type FlavorFamily =
  | "Fruity"
  | "Minty"
  | "Creamy"
  | "Tobacco"
  | "Sweet"
  | "Icy";

export type Brand =
  | "LEGEND VAPE STORE Original"
  | "LEGEND VAPE STORE MAX"
  | "LEGEND VAPE STORE PRO"
  | "LEGEND VAPE STORE LITE"
  | "Vozol"
  | "Wotofo";

export type NicotineMg = 0 | 10 | 20 | 50;

export type Volume = 1 | 2 | 4 | 10 | 30;

/** LIQUID-only sub-classification. Fruities lean fresh/fruit-forward,
 *  Gourmands lean dessert/creamy/indulgent. Undefined for non-LIQUID rows. */
export type LiquidType = "Fruity" | "Gourmand";

export type ProductBadge = "NEW" | "HOT" | "MAX";

/** Mongo document shape for the `products` collection. */
export interface MongoProduct {
  _id?: string; // stringified ObjectId at the API boundary
  name: string;
  category: ShopCategory;
  description: string;
  priceTND: number;
  nicotineMg: NicotineMg;
  mlSize?: Volume;
  puffCount?: number;
  /** LIQUID-only sub-bucket. Undefined for non-LIQUID rows. */
  liquidType?: LiquidType;
  caffeinated: boolean;
  brand: Brand;
  flavorFamily: FlavorFamily;
  flavorColor: string; // hex
  imageUrl?: string;
  propImageUrl?: string;
  /** Flavor variants — shown in the storefront's product detail modal (PUFFS/PODS/CAPSULES). */
  flavors?: string[];
  badge?: ProductBadge;
  releaseOrder: number;
  featuredOrder: number;
  inStock: boolean;
  /** Admin-toggled promotion. When true and `promoPriceTND` is set,
   *  storefront renders the discounted price + a PROMO badge. */
  onPromo?: boolean;
  /** Discounted price in TND. Must be < priceTND when onPromo is true. */
  promoPriceTND?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Form-level shape — same as MongoProduct but every field is optional
 *  except validation fields. Used by the create/edit form. */
export type ProductDraft = Partial<MongoProduct> & {
  name: string;
  category: ShopCategory;
  priceTND: number;
};
