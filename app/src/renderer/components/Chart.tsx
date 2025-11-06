import { useEffect, useRef } from "react";
import renderChart from "../lib/chart/renderChart";
import { updateRecommendedIcon } from "../lib/chart/updateRecommendedIcon";
import { ensureD3 } from "../lib/vendor/d3";
import type { Asset } from "../../types/asset";

type ChartProps = {
  country?: string;
  assets?: Asset[];
};

export default function Chart({ country, assets }: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastCountryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!country) return;
    if (lastCountryRef.current === country) return;

    let cancelled = false;

    (async () => {
      if (svgRef.current) {
        const d3 = await ensureD3();
        if (cancelled) return;
        d3.select(svgRef.current).selectAll("*").remove();
      }

      if (cancelled) return;
      await renderChart(country);
      if (cancelled) return;
      lastCountryRef.current = country;
    })();

    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    if (!lastCountryRef.current) return;
    updateRecommendedIcon(assets ?? []);
  }, [assets]);

  return <svg ref={svgRef} id="recommended" width="548" height="280" />;
}
