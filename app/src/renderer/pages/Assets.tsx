import { useEffect, useState, useRef } from "react";
import { electronAPI } from "../lib/electronAPI";
import init from "../../assets-api-wasm/pkg/stock_fetcher.js";
import fetchAssets from "../lib/fetchAssets.ts";
import { updateRecommendedIcon } from "../lib/chart/updateRecommendedIcon";
import type { Asset as AssetTypeBase } from "../../types/asset";
import AssetSearch from "../components/AssetSearch";
import AssetsGrid from "../components/AssetsGrid";

interface AssetType extends AssetTypeBase {
  name: string;
  market: string;
  image: string;
  quantity: number;
}

globalThis.getFileTimestamp = (relPath: string) => electronAPI.getFileTimestamp(relPath);
globalThis.readLocalFile = (relPath: string) => electronAPI.readLocalFile(relPath);
globalThis.writeLocalFile = (relPath: string, data: string) => electronAPI.writeLocalFile(relPath, data);
globalThis.fetchRemoteText = (url: string) => electronAPI.fetchRemoteText(url);

(async () => {
  try {
    await init();
    console.log("✅ WASM initialized");
  } catch (err) {
    console.error("❌ WASM failed to initialize", err);
  }
})();

export default function AssetsPage() {
  const [country, setCountry] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetType[]>([]);
  const hasMountedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const raw = (await electronAPI.store.get("investment")) as unknown;
      const storedCountry = typeof raw === 'string' && raw.trim() ? raw : null;
      setCountry(storedCountry);

      const storedAssets = ((await electronAPI.store.get("assets")) as AssetType[]) || [];
      setAssets(storedAssets);
    })();
  }, []);


  useEffect(() => {

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const deduped = assets.filter(
      (v, i, a) => i === a.findIndex((t) => t.symbol === v.symbol)
    );

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await electronAPI.store.set("assets", deduped);
      } catch (err) {
        console.error("Failed to persist assets", err);
      }
    }, 250);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [assets]);

  useEffect(() => {
    const onRecommendedAdd = async (evt: Event) => {
      if (!country) return;
      const e = evt as CustomEvent<{ names: string[]; exchange: string }>;
      const names = e.detail?.names || [];

      for (const name of names) {
        try {
          const results = await fetchAssets(name, country);
          const first = results?.[0];
          if (!first) continue;

          const assetItem: AssetType = {
            ...first,
            name: first.name || "",
            market: first.market || country || "",
            image: first.image || "",
            quantity: 0,
          };

          setAssets((prev) => {
            const next = [...prev, assetItem];
            return next.filter((v, i, a) => i === a.findIndex((t) => t.symbol === v.symbol));
          });
        } catch (err) {
          console.error("Failed adding recommended asset", name, err);
        }
      }
    };

    window.addEventListener("recommended:add", onRecommendedAdd as EventListener);
    return () => window.removeEventListener("recommended:add", onRecommendedAdd as EventListener);
  }, [country]);

  useEffect(() => {
    updateRecommendedIcon(assets);
  }, [assets]);

  const handleSelect = async (item: AssetTypeBase) => {

    const assetItem: AssetType = {
      ...item,
      name: item.name || "",
      market: item.market || country || "",
      image: item.image || "",
      quantity: 0
    };


    setAssets((prev) => {
      const next = [...prev, assetItem];
      return next.filter((v, i, a) => i === a.findIndex((t) => t.symbol === v.symbol));
    });
  };

  const handleRemove = async (symbol: string) => {
    const updated = assets.filter((a) => a.symbol !== symbol);

    setAssets(updated);
  };

  return (
    <>
      <AssetSearch country={country} onSelect={handleSelect} />
      <AssetsGrid country={country} assets={assets} onRemove={handleRemove} />
    </>
  );
}
