import Chart from "./Chart";
import Asset from "./Asset";
import type { Asset as AssetTypeBase } from "../../types/asset";

interface AssetType extends AssetTypeBase {
  name: string;
  market: string;
  image: string;
  quantity: number;
}

interface AssetsGridProps {
  country: string | null;
  assets: AssetType[];
  onRemove: (symbol: string) => void;
}

export default function AssetsGrid({ country, assets, onRemove }: AssetsGridProps) {
  return (
    <div className="max-w-[1200rem] px-[20rem] flex items-end m-auto pt-[160rem] pb-[74rem] w-full">
      <div className="assets-wrapper">
        <form id="assets" className="grid grid-cols-4 gap-spacing-xl gap-y-[70rem]">
          <div className="col-span-2">
            {country && (
              <Chart
                country={country}
                assets={assets.map((a) => ({
                  ...a,
                  image: a.image || "",
                  market: a.market || country || "",
                }))}
              />
            )}
          </div>
          {assets.map((asset) => (
            <Asset key={asset.symbol} suggestion={asset} country={asset.market || ""} onRemove={onRemove} />
          ))}
        </form>
      </div>
    </div>
  );
}
