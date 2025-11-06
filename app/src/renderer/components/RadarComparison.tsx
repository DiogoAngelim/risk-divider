import { useEffect, useMemo, useRef } from 'react';
import RadarChart from '../lib/chart/radarChart.ts';
import type { RadarChartOptions, RadarDatum, RadarSeries, Margin as RadarMargin } from '../lib/chart/radarChart.ts';
import type { Asset } from '../../types/asset';

interface Props {
  assets: Asset[];
  optimalWeights: number[];
  showShares: boolean;
  portfolioValue: number;
}

export default function RadarComparison({ assets, optimalWeights, showShares, portfolioValue }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const radarData = useMemo(() => {
    const data: RadarSeries[] = [[], []];
    assets.forEach((asset, index: number) => {
      const price = asset.closePrices?.at?.(-1) ?? 0;
      const qty = asset.quantity ?? 0;
      const currentWeight = portfolioValue > 0 ? (qty * price) / portfolioValue : 0;
      const optimalWeight = Number.isFinite(Number(optimalWeights[index])) ? Number(optimalWeights[index]) : 0;
      const axis = asset.symbol ?? 'N/A';
      (data[1] as RadarDatum[]).push({ name: 'Current portfolio', axis, value: currentWeight });
      (data[0] as RadarDatum[]).push({ name: 'Optimal portfolio', axis, value: optimalWeight });
    });
    return data;
  }, [assets, optimalWeights, portfolioValue]);

  useEffect(() => {
    const cEl = containerRef.current;
    const parent = cEl?.parentElement;
    const baseW = Math.max(260, (parent?.clientWidth ?? cEl?.clientWidth ?? 800) * 0.6);
    const margin: RadarMargin = { top: 50, right: 70, bottom: 50, left: 70 };
    if (innerWidth < 768) { margin.top = 20; margin.bottom = 20; margin.left = 50; margin.right = 50; }
    const colorFn = (i: number) => (['#495dc6', '#fdd368'][i] ?? '#495dc6');
    const opacityFn = (i: number) => ([0.3, 1][i] ?? 1);
    const radarChartOptions: Partial<RadarChartOptions> = {
      w: baseW - margin.left - margin.right,
      h: Math.max(260, (parent?.clientWidth ?? cEl?.clientWidth ?? 800) * 0.6),
      margin,
      maxValue: 1,
      levels: 6,
      roundStrokes: true,
      color: colorFn,
      opacity: opacityFn,
    };
    RadarChart('.radarChart', radarData, radarChartOptions);
  }, [radarData]);

  return (
    <>
      <div ref={containerRef} className="radarChart" />
      <div className="comparison-table">
        <ul className="current-portfolio">
          <li className="title text-style-22 uppercase">Optimal portfolio <br />
            <b>allocation</b>
          </li>
          {assets.map((asset, idx) => {
            const price = asset.closePrices?.at?.(-1) ?? 0;
            const ow = optimalWeights[idx] ?? 0;
            const optimalPercent = Math.max(ow * 100, 0);
            const optimalShares = price > 0 ? Math.floor((ow * portfolioValue) / price) : 0;
            const displayValue = showShares ? optimalShares : `${optimalPercent.toFixed(0)}%`;
            return (
              <li key={`opt-${asset.symbol}-${idx}`} className="data">{displayValue}</li>
            );
          })}
        </ul>
        <ul className="assets">
          <li></li>
          {assets.map((asset, idx) => (
            <li key={`axis-${asset.symbol}-${idx}`}>{asset.symbol ?? 'N/A'}</li>
          ))}
        </ul>
        <ul className="optimal-portfolio">
          <li className="title text-style-22 uppercase">Current portfolio <br />
            <b>allocation</b>
          </li>
          {assets.map((asset, idx) => {
            const price = asset.closePrices?.at?.(-1) ?? 0;
            const qty = asset.quantity ?? 0;
            const cw = portfolioValue > 0 ? (qty * price) / portfolioValue : 0;
            const currentPercent = Math.max(cw * 100, 0);
            const currentShares = Math.max(Math.floor(qty), 0);
            const displayValue = showShares ? currentShares : `${currentPercent.toFixed(0)}%`;
            return (
              <li key={`cur-${asset.symbol}-${idx}`} className="data">{displayValue}</li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
