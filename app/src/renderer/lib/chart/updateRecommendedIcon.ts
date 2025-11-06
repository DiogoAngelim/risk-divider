import { ensureD3 } from "../vendor/d3";
import type { Asset } from "../../../types/asset";

function normalizeSymbol(sym?: string): string {
  if (!sym) return "";

  return sym.replace(/\.[^.]*$/, "").toUpperCase();
}

export function updateRecommendedIcon(assets?: Asset[]): void {

  ensureD3()
    .then((d3) => {
      const svg = d3.select("#recommended");
      const recAttr = ((svg.attr("data-recommended") || "") as string)
        .split(",")
        .map((s: string) => s.trim())
        .filter((s): s is string => !!s);
      const recommended = recAttr.map((s: string) => s.toUpperCase());

      const have = (assets ?? []).map(a => ({
        symbol: normalizeSymbol(a.symbol),
        name: (a.name || "").toUpperCase()
      }));

      const allAdded = recommended.length > 0 && recommended.every((rec: string) =>
        have.some(h => h.symbol === rec || h.name === rec)
      );

      d3.selectAll(".icon path").remove();

      const pathD = allAdded
        ? "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        : "M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75";

      d3.selectAll(".icon")
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-width", "1.5")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("transform", "translate(0, 2)")
        .attr("d", pathD);
    })
    .catch((err) => {

      console.error("Failed to update recommended icon:", err);
    });
}
