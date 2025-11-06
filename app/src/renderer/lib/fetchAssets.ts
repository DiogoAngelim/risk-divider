import { handler } from "../../assets-api-wasm/pkg/stock_fetcher.js";
import type { Asset } from "../../types/asset";

export default async function fetchAssets(query: string, country: string): Promise<Asset[]> {
  if (!query) return [];
  try {
    const res = await handler(query, country);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error("fetchAssets error", err);
    return [];
  }
}
