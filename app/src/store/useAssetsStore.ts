import { useEffect, useState, useCallback } from "react";
import getFormattedPrice from "../pages/utils/getFormattedPrice";
import type { Asset } from "../types/asset";

interface FormattedAsset extends Asset {
  market: string;
  image: string;
  quantity: number;
  color: string;
  change: string;
}

interface AssetsStore {
  assets: FormattedAsset[];
  addAsset: (suggestion: Asset, removeWeights?: boolean) => Promise<void>;
  removeAsset: (symbol: string) => void;
  updateQuantity: (symbol: string, quantity: number) => void;
}

export function useAssetsStore(country: string): AssetsStore {
  const [assets, setAssets] = useState<FormattedAsset[]>([]);

  useEffect(() => {
    (async () => {
      let stored: FormattedAsset[] = [];

      if (window.electronAPI?.store) {
        const result = await window.electronAPI.store.get("assets");
        const rawAssets = (result as Partial<FormattedAsset>[] || []);
        stored = rawAssets.map(asset => ({
          name: asset.name || "",
          symbol: asset.symbol || "",
          market: asset.market || "",
          image: asset.image || "",
          closePrices: asset.closePrices || [],
          dailyChange: asset.dailyChange || [],
          dates: asset.dates || [],
          quantity: asset.quantity || 0,
          color: asset.color || "#ed0123",
          change: asset.change || "0%"
        }));
      } else {
        const storedJson = localStorage.getItem("assets") || "[]";
        const rawAssets = JSON.parse(storedJson) as Partial<FormattedAsset>[];
        stored = rawAssets.map(asset => ({
          name: asset.name || "",
          symbol: asset.symbol || "",
          market: asset.market || "",
          image: asset.image || "",
          closePrices: asset.closePrices || [],
          dailyChange: asset.dailyChange || [],
          dates: asset.dates || [],
          quantity: asset.quantity || 0,
          color: asset.color || "#ed0123",
          change: asset.change || "0%"
        }));
      }

      if (Array.isArray(stored)) setAssets(stored);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (window.electronAPI?.store) {
        await window.electronAPI.store.set("assets", assets);
      } else {
        localStorage.setItem("assets", JSON.stringify(assets));
      }
    })();
  }, [assets]);

  const addAsset = useCallback(
    async (suggestion: Asset, removeWeights = false) => {
      const formatted = formatAsset(suggestion, country);
      setAssets((prev) => {
        const exists = prev.some((a) => a.symbol === formatted.symbol);
        return exists ? prev : [...prev, formatted];
      });

      if (removeWeights) {
        if (window.electronAPI?.store) {
          await window.electronAPI.store.delete("weights");
        } else {
          localStorage.removeItem("weights");
        }
      }
    },
    [country]
  );

  const removeAsset = useCallback((symbol: string) => {
    setAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const updateQuantity = useCallback((symbol: string, quantity: number) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.symbol === symbol ? { ...a, quantity } : a
      )
    );
  }, []);

  return { assets, addAsset, removeAsset, updateQuantity };
}

function formatAsset(suggestion: Asset, country: string): FormattedAsset {
  const { closePrices, dailyChange } = suggestion;
  const name = (suggestion.name || "").toLowerCase();
  const quantity = suggestion.quantity || 0;

  const lastTwo = closePrices.slice(-2);
  const openPrice = Math.round((lastTwo[0] || 0) * 100) / 100;
  const closePrice = Math.round((lastTwo[1] || 0) * 100) / 100;
  const absoluteChange = closePrice - openPrice;
  const variation = ((dailyChange.at(-1) || 0) * 100).toFixed(2);
  const signal = openPrice > closePrice ? "" : "+";
  const color = signal === "+" ? "#37c171" : "#ed0123";

  const change = `${signal}${getFormattedPrice(Math.abs(absoluteChange), country)} (${variation}%)`;

  return {
    ...suggestion,
    name,
    quantity,
    color,
    change,
    market: suggestion.market || "",
    image: suggestion.image || "",
  };
}
