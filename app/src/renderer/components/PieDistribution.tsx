import { useEffect, useMemo } from 'react';
import renderPieChart from '../lib/chart/pieChartStandalone.ts';
import type { Asset } from '../../types/asset';

interface Props {
  assets: Asset[];
}

export default function PieDistribution({ assets }: Props) {
  const selectedAssets = useMemo(() => {
    return assets.map((item) => ({
      label: item.symbol,
      quantity: item.quantity,
      shares: item.quantity,
      price: item.closePrices?.at?.(-1) ?? 0,
    }));
  }, [assets]);

  const sharesGreaterThanZero = useMemo(() => selectedAssets.filter(i => (i.quantity ?? 0) > 0), [selectedAssets]);

  useEffect(() => {
    if (!assets.length) return;
    const container = document.getElementById('portfolio-distribution');
    if (container) {
      container.innerHTML = '';
      container.classList.remove('disabled');
    }
    const legend = document.querySelector('.legend5');
    if (legend) (legend as HTMLElement).innerHTML = '';

    const colorScheme = [
      '#6a3f75',
      '#ffdd8e',
      '#68a6d3',
      '#f6ad83',
      '#74caa8',
      '#ec8795',
      '#8ac86f',
      '#b594d2',
      '#ced787',
      '#cfded1',
    ];
    if (sharesGreaterThanZero.length === 0) {
      renderPieChart(
        selectedAssets.map((asset) => ({ ...asset, value: 100 })),
        '#portfolio-distribution',
        colorScheme,
      );
      const el = document.getElementById('portfolio-distribution');
      if (el) el.classList.add('disabled');
    } else {
      renderPieChart(
        selectedAssets.map((asset) => ({ ...asset, value: (asset.quantity || 0) * (asset.price || 0) })),
        '#portfolio-distribution',
        colorScheme,
      );
    }
  }, [assets, selectedAssets, sharesGreaterThanZero.length]);

  return (
    <div>
      <div id="portfolio-distribution" />
      <div className="legend5" />
    </div>
  );
}
