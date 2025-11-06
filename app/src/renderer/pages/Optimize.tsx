import { useCallback, useEffect, useRef, useState } from "react";
import { electronAPI } from "../lib/electronAPI";
import type { Asset } from "../../types/asset";

export default function OptimizePage() {
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonActive, setButtonActive] = useState(false);
  const [optimizationReady, setOptimizationReady] = useState<boolean | null>(null);
  const optimizeBtnRef = useRef<HTMLButtonElement | null>(null);

  const setBodyCursor = useCallback((cursor: "wait" | "default" | "") => {
    try {
      document.body.style.cursor = cursor;
      if (optimizeBtnRef.current) {
        optimizeBtnRef.current.style.cursor = cursor;
      }
    } catch {
      void 0;
    }
  }, []);

  const setNextPageDisabled = useCallback((disabled: boolean) => {
    try {
      document.querySelectorAll(".next-page").forEach((el) => {
        if (disabled) el.classList.add("disabled");
        else el.classList.remove("disabled");
      });
    } catch {
      void 0;
    }
  }, []);

  const computeAssetsHash = (assets: Asset[] | null | undefined): string => {
    if (!Array.isArray(assets)) return "len:0";
    const parts = assets
      .map((a) => `${a.symbol}:${a.quantity ?? 0}`)
      .sort();
    return `len:${assets.length}|${parts.join("|")}`;
  };

  const runOptimization = useCallback(async (assetsForRun: Asset[], opts?: { assetsHash?: string }) => {
    let cancelled = false;

    try {

      await electronAPI.store.set<boolean>("optimizationReady", false);
      setOptimizationReady(false);
      setNextPageDisabled(true);
      setBodyCursor("wait");

      const exchange = (await electronAPI.store.get<string>("investment")) || "US";

      const regionMap: Record<string, string> = {
        AU: ".AX",
        BR: ".SA",
        CA: ".TO",
        CH: ".SZ",
        DE: ".DE",
        IN: ".BO",
        JP: ".T",
        KSA: ".SR",
        UK: ".L",
      };
      const extension = regionMap[exchange] ?? "";
      const symbols = assetsForRun.map((a) => a.symbol + extension);

      const { optimal_weights } = await electronAPI.runAI<{ optimal_weights?: number[] }>([
        exchange,
        ...symbols,
      ]);

      await electronAPI.store.set("weights", optimal_weights);
      if (optimal_weights && optimal_weights.length) {

        document.querySelectorAll(".steps-close-button, .next-page").forEach((el) => el.classList.remove("disabled"));
        setButtonDisabled(false);
        await electronAPI.store.set<boolean>("optimizationReady", true);
        setOptimizationReady(true);
        setBodyCursor("");
        setNextPageDisabled(false);

        if (opts?.assetsHash) {
          await electronAPI.store.set<string>("lastOptimizationAssetsHash", opts.assetsHash);
        }
      }
    } catch {
      cancelled = true;

    } finally {
      if (cancelled) setBodyCursor("");
    }
  }, [setBodyCursor, setNextPageDisabled]);

  useEffect(() => {
    let cancelled = false;

    (async () => {

      const currentOptimization = await electronAPI.store.get<boolean>("optimizationReady");
      if (!cancelled) {
        setOptimizationReady(currentOptimization === true ? true : currentOptimization === false ? false : null);
        setBodyCursor(currentOptimization === false ? "wait" : "");
      }

      if (!cancelled && currentOptimization === false) setNextPageDisabled(true);

      const weights = await electronAPI.store.get<number[] | unknown>("weights");
      const hasWeights = Array.isArray(weights) && weights.length > 0;
      setButtonDisabled(!hasWeights);
      document.querySelectorAll(".steps-close-button, .next-page").forEach((el) => {
        if (hasWeights) el.classList.remove("disabled");
        else el.classList.add("disabled");
      });

      let portfolioValue = 0;
      let assets: Asset[] = (await electronAPI.store.get<Asset[]>("assets")) ?? [];
      const assetsHash = computeAssetsHash(assets);
      const lastHash = (await electronAPI.store.get<string>("lastOptimizationAssetsHash")) || null;

      if (!Array.isArray(assets)) assets = [];

      let commonDates: string[] = [];
      if (assets.length > 0) {
        commonDates = [...assets[0].dates];
        for (let i = 1; i < assets.length; i++) {
          const dates = assets[i].dates;
          commonDates = commonDates.filter((d) => dates.includes(d));
        }
      }

      const commonIndexesPerAsset: number[][] = assets.map((asset: Asset) =>
        commonDates.map((date: string) => asset.dates.indexOf(date))
      );

      const validIndexes: number[] = commonDates
        .map((_, idx: number) => idx)
        .filter((idx: number) =>
          assets.every((asset: Asset, assetIdx: number) => {
            const val = asset.dailyChange[commonIndexesPerAsset[assetIdx][idx]];
            return val !== undefined && !isNaN(val as number);
          })
        );

      assets = assets.map((asset: Asset, assetIdx: number) => {
        const indexes = validIndexes.map((idx: number) => commonIndexesPerAsset[assetIdx][idx]);
        return {
          ...asset,
          dates: indexes.map((i) => asset.dates[i]),
          closePrices: indexes.map((i) => asset.closePrices[i]),
          dailyChange: indexes.map((i) => asset.dailyChange[i]),
        };
      });

      assets = assets.map((asset: Asset) => {
        asset.quantity = asset.quantity ? asset.quantity : 0;
        asset.currentPrice = asset.closePrices[asset.closePrices.length - 1];
        asset.marketValue = asset.quantity * asset.currentPrice;
        portfolioValue += asset.quantity * asset.currentPrice;
        return asset;
      });

      for (const asset of assets as Asset[]) {
        asset.weight = portfolioValue > 0 ? asset.marketValue! / portfolioValue : 0;
        const returns: number[] = [];
        const prices: number[] = asset.closePrices;
        for (let i = 1; i < prices.length; i++) {
          const r = Math.log(prices[i] / prices[i - 1]);
          returns.push(r);
        }
        const meanLogReturn =
          returns.length > 0 ? returns.reduce((a: number, b: number) => a + b, 0) / returns.length : 0;
        asset.averageChange = meanLogReturn;
      }

      try {

        const shouldAutoOptimize = Array.isArray(assets) && assets.length > 0 && assetsHash !== lastHash;
        if (shouldAutoOptimize) {
          await runOptimization(assets, { assetsHash });
        }
      } catch {
        void 0;
      }
    })();

    return () => {
      cancelled = true;

      setBodyCursor("");
    };
  }, [runOptimization, setBodyCursor, setNextPageDisabled]);

  const onOptimizeClick = async () => {
    setButtonActive(true);
    setBodyCursor("wait");

    setNextPageDisabled(true);

    const currentValue = optimizationReady ?? (await electronAPI.store.get<boolean>("optimizationReady"));
    if (currentValue !== true) {
      const assetsNow = (await electronAPI.store.get<Asset[]>("assets")) ?? [];
      const assetsHashNow = computeAssetsHash(assetsNow);
      await runOptimization(Array.isArray(assetsNow) ? assetsNow : [], { assetsHash: assetsHashNow });
    } else {
      setBodyCursor("");
      setNextPageDisabled(false);
    }
  };

  useEffect(() => {
    if (buttonActive && optimizationReady === true) {
      setBodyCursor("");
      setNextPageDisabled(false);
    }
  }, [buttonActive, optimizationReady, setBodyCursor, setNextPageDisabled]);

  return (
    <>
      <div className="feedback-wrapper">
        <div className="flex items-center justify-center">
          <div className="my-[70rem] text-center">
            <img className="mb-[30rem] m-auto" src="../common/icons/step-3/error.svg" width="550" alt="Image" />
            <div className="w-[525rem] m-auto">
              <span className="text-style-19">
                You did it! You created your portfolio. With the right allocation, it can
                become <span className="text-style-20">less risky</span> and <span className="text-style-20">more profitable</span>!
              </span>
            </div>
            <div
              className={`optimize-button p-[1rem] rounded-[40rem] bg-gradient-to-r from-[#fdd368] via-[#495dc6] to-[#fdd368] transition-transform duration-300 inline-block mt-[50rem]${buttonActive ? " active gradient-border" : ""
                }`}
            >
              <button
                className="flex items-center gap-[8rem] px-[24rem] py-[12rem] bg-white rounded-[40rem] text-gray-800 font-medium"
                onClick={onOptimizeClick}
                disabled={buttonDisabled}
                ref={optimizeBtnRef}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[20rem] h-[20rem] sparkle">
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  <path d="M16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <span className="text-[16rem]">Optimize</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
