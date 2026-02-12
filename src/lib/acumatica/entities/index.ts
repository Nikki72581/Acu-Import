import type { EntityType } from "@/types/entities";
import type { EntityAdapter } from "./types";
import { StockItemAdapter } from "./stock-item-adapter";
import { CustomerAdapter } from "./customer-adapter";
import { VendorAdapter } from "./vendor-adapter";

const adapterCache = new Map<EntityType, EntityAdapter>();

/**
 * Factory function to get the appropriate entity adapter.
 * Adapters are cached for reuse.
 */
export function getEntityAdapter(type: EntityType): EntityAdapter {
  const cached = adapterCache.get(type);
  if (cached) return cached;

  let adapter: EntityAdapter;
  switch (type) {
    case "StockItem":
      adapter = new StockItemAdapter();
      break;
    case "Customer":
      adapter = new CustomerAdapter();
      break;
    case "Vendor":
      adapter = new VendorAdapter();
      break;
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }

  adapterCache.set(type, adapter);
  return adapter;
}

export { StockItemAdapter } from "./stock-item-adapter";
export { CustomerAdapter } from "./customer-adapter";
export { VendorAdapter } from "./vendor-adapter";
export type { EntityAdapter } from "./types";
