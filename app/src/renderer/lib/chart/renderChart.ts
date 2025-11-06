import { ensureD3, type D3Global } from "../vendor/d3";
import { updateRecommendedIcon } from "./updateRecommendedIcon";

interface PortfolioData {
  symbols: string[];
  weights: number[];
  sharpe?: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

type D3Selection = ReturnType<D3Global['select']>;

export default async function renderChart(exchange: string = 'US'): Promise<void> {
  try {
    const res = await fetch(`https://financial-data-omega.vercel.app/api/portfolio?exchange=${exchange}`);
    const apiData = await res.json() as PortfolioData;

    const colors = [
      "#6a3f75", "#ffdd8e", "#68a6d3", "#f6ad83", "#74caa8",
      "#ec8795", "#8ac86f", "#b594d2", "#ced787", "#cfded1"
    ];

    const data = apiData?.symbols?.map((symbol, i) => ({
      name: symbol.includes('.') ? symbol.substring(0, symbol.lastIndexOf('.')) : symbol,
      value: apiData.weights[i],
      color: colors[i % colors.length]
    } as ChartDataPoint))
      .filter((d): d is ChartDataPoint => d.value > 0);

    if (data) {
      const d3 = await ensureD3();
      const svg = d3.select("#recommended") as D3Selection;
      const width = 568;
      const margin = { top: 32, left: 40, right: 40, bottom: 40 };
      const innerPadding = 5;
      const total = 1;
      const totalBarHeight = 36;
      const innerBarHeight = totalBarHeight - innerPadding * 2;
      const outerRadius = totalBarHeight / 2 - 5;
      const innerRadius = outerRadius - innerPadding;
      const innerGap = 4;
      const legendPadding = 40;
      const lineHeight = 24;

      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;

      ctx.font = "14px Figtree";
      let x = legendPadding;
      let rows = 1;

      const legendAvailableWidth = width - 2 * legendPadding;
      data.forEach(d => {
        const labelWidth = ctx.measureText(d.name).width * 1.7 + 36;
        if (x + labelWidth > legendAvailableWidth) {
          x = legendPadding;
          rows++;
        }
        x += labelWidth;
      });

      const legendHeight = rows * lineHeight + 20;
      const chartHeight = Math.max(130 + totalBarHeight + legendHeight + 20, 280);
      svg.attr("height", chartHeight);

      svg.attr("data-recommended", data.map(d => d.name).join(","));

      svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", chartHeight)
        .attr("rx", 16)
        .attr("ry", 16)
        .attr("fill", "#f3f4f6")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);

      const drawChart = (chartData: ChartDataPoint[]): void => {
        const defs = svg.append("defs");
        const pattern = defs.append("pattern")
          .attr("id", "stripes")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 10)
          .attr("height", 10);

        pattern.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", "white");

        pattern.append("path")
          .attr("d", "M0,10 l10,-10 M-2,2 l4,-4 M8,12 l4,-4")
          .attr("stroke", "rgba(0,0,0,0.06)")
          .attr("stroke-width", 2);

        const contentPadding = 24;
        const barWidthWithPadding = width - margin.left - margin.right - contentPadding;
        const barX = (width - barWidthWithPadding - 30) / 2;
        const barY = 150;

        svg.append("rect")
          .attr("x", barX)
          .attr("y", barY - totalBarHeight / 2)
          .attr("width", barWidthWithPadding + 10)
          .attr("height", totalBarHeight)
          .attr("rx", outerRadius)
          .attr("fill", "#ebeef5");

        let barX1 = barX + innerPadding;
        chartData.forEach((d) => {
          const w = (d.value / total) * (barWidthWithPadding - innerGap * (chartData.length - 1));
          svg.append("rect")
            .attr("x", barX1)
            .attr("y", barY - innerBarHeight / 2)
            .attr("width", w)
            .attr("height", innerBarHeight)
            .attr("rx", innerRadius)
            .attr("fill", d.color);
          svg.append("rect")
            .attr("x", barX1)
            .attr("y", barY - innerBarHeight / 2)
            .attr("width", w)
            .attr("height", innerBarHeight)
            .attr("rx", innerRadius)
            .attr("fill", "url(#stripes)")
            .attr("opacity", 0.2);
          barX1 += w + innerGap;
        });

        svg.append("text")
          .attr("x", margin.left)
          .attr("y", 60)
          .attr("fill", "#8895a7")
          .attr("font-size", "14px")
          .text("Top weekly performers");

        svg.append("text")
          .attr("x", margin.left)
          .attr("y", 94)
          .attr("font-size", "28px")
          .attr("font-weight", "600")
          .attr("fill", "#000")
          .text(`${apiData.sharpe?.toFixed(1)}% Excess return`);
      };

      const drawLegend = (chartData: ChartDataPoint[], startY: number): void => {
        let legendX = legendPadding;
        let y = startY;

        chartData.forEach(d => {
          const textWidth = ctx.measureText(d.name).width;
          const labelWidth = textWidth + 36;

          if (legendX + labelWidth > legendAvailableWidth) {
            legendX = legendPadding;
            y += lineHeight;
          }

          svg.append("circle")
            .attr("cx", legendX + 8)
            .attr("cy", y)
            .attr("r", 6)
            .attr("fill", d.color);

          svg.append("text")
            .attr("x", legendX + 20)
            .attr("y", y + 4)
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .text(d.name);

          legendX += labelWidth;
        });
      };

      const iconGroup = svg.append("g")
        .attr("class", "icon")
        .attr("transform", "translate(480, 30) scale(1.2)")
        .style("cursor", "pointer");

      iconGroup.append("circle")
        .attr("cx", 12)
        .attr("cy", 15)
        .attr("r", 20)
        .attr("fill", "#ebeef5")
        .attr("stroke", "transparent");

      const padding = 10;
      iconGroup.insert("rect", ":first-child")
        .attr("x", 12 - 20 - padding)
        .attr("y", 15 - 20 - padding)
        .attr("width", 2 * 20 + 2 * padding)
        .attr("height", 2 * 20 + 2 * padding)
        .attr("fill", "transparent")
        .attr("stroke", "transparent")
        .style("pointer-events", "all");

      updateRecommendedIcon();

      iconGroup.on("click", () => {
        const names = (data || []).map(d => d.name);
        const ev = new CustomEvent("recommended:add", { detail: { names, exchange } });
        window.dispatchEvent(ev);
      });

      drawChart(data);
      drawLegend(data, chartHeight - legendHeight);
    }
  } catch (err) {
    console.error(err);
  }
}
