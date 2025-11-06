import { useEffect, useMemo, useRef } from 'react';
import { ensureRickshaw } from '../lib/vendor/rickshaw';
import type { Asset } from '../../types/asset';

type StatsBlock = {
  risk: string;
  annualReturn: string;
  drawdown: string;
};

interface Props {
  assets: Asset[];
  optimalWeights: number[];
}

function annualizedReturn(portfolioReturn: number, periods = 498, periodsPerYear = 252) {
  return (1 + portfolioReturn) ** (periodsPerYear / periods) - 1;
}

export default function PastPerformance({ assets, optimalWeights }: Props) {
  type GraphLike = {
    series?: Array<{ data?: Array<{ x: number; y: number }>;[k: string]: unknown }>;
    render?: () => void;
    y?: (n: number) => number;
    configure?: (opts: { width?: number; height?: number }) => void;
    [k: string]: unknown;
  };
  const graphRef = useRef<GraphLike | null>(null);
  const xAxisRef = useRef<{ render: () => void } | null>(null);
  const portfolioValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const quantity = asset.quantity || 0;
      const currentPrice = asset.closePrices?.at?.(-1) ?? 0;
      return sum + quantity * currentPrice;
    }, 0);
  }, [assets]);

  const computed = useMemo(() => {
    if (!assets.length || !optimalWeights.length) return null;

    const commonDates = assets.map(asset => asset.dates)?.reduce((a, b) => a.filter((d: string) => b.includes(d)));
    if (!commonDates?.length) return null;

    const commonIndexesPerAsset = assets.map((asset) =>
      commonDates.map((date: string) => asset.dates.indexOf(date))
    );

    const validIndexes = commonDates
      .map((_, idx) => idx)
      .filter((idx) => assets.every((asset, assetIdx) => {
        const val = asset.dailyChange[commonIndexesPerAsset[assetIdx][idx]];
        return typeof val === 'number' && !Number.isNaN(val);
      }));

    const dailyChanges: number[][] = assets.map((asset, assetIdx) =>
      validIndexes.map((idx) => asset.dailyChange[commonIndexesPerAsset[assetIdx][idx]])
    );

    const currentWeights = assets.map((asset) => {
      const qty = asset.quantity || 0;
      const price = asset.closePrices?.at?.(-1) ?? 0;
      const val = qty * price;
      return portfolioValue > 0 ? val / portfolioValue : 0;
    });

    function portfolioReturns(sourceAssets: Asset[], optimal = false) {
      const weights = sourceAssets.map((_, index) => (optimal ? (optimalWeights[index] ?? 0) : (currentWeights[index] ?? 0)));
      const periods = dailyChanges[0]?.length ?? 0;
      let portfolioGrowth = 1;
      for (let t = 0; t < periods; t++) {
        let periodReturn = 0;
        for (let i = 0; i < dailyChanges.length; i++) {
          periodReturn += dailyChanges[i][t] * (weights[i] ?? 0);
        }
        portfolioGrowth *= 1 + periodReturn;
      }
      return portfolioGrowth - 1;
    }

    function max_drawdown(cumReturns: number[]) {
      if (!cumReturns.length) return 0;
      const minVal = Math.min(...cumReturns);
      const offset = minVal <= 0 ? 1 - minVal : 0;
      const shifted = cumReturns.map(v => v + offset);
      let peak = shifted[0];
      let maxDD = 0;
      for (const value of shifted) {
        if (value > peak) peak = value;
        const drawdown = (peak - value) / peak;
        if (drawdown > maxDD) maxDD = drawdown;
      }
      return maxDD;
    }

    const aligned: Asset[] = assets.map((asset, assetIdx) => {
      const indexes = validIndexes.map((idx: number) => commonIndexesPerAsset[assetIdx][idx]);
      return {
        ...asset,
        dates: indexes.map((i: number) => asset.dates[i]),
        closePrices: indexes.map((i: number) => (asset.closePrices ?? [])[i] ?? 0),
        dailyChange: indexes.map((i: number) => asset.dailyChange[i]),
      };
    });

    const days = Math.min(...aligned.map((a: Asset) => a.dailyChange?.length ?? Infinity));
    const weights = currentWeights;
    const currentPortfolioDailyReturns = new Array(days).fill(0);
    const optimalPortfolioDailyReturns = new Array(days).fill(0);
    for (let d = 0; d < days; d++) {
      let dailyCurr = 0, dailyOpt = 0;
      for (let j = 0; j < aligned.length; j++) {
        const asset = aligned[j];
        const dc = asset.dailyChange?.[d] ? Number(asset.dailyChange[d]) : 0;
        const w = weights[j] ?? 0;
        const ow = optimalWeights[j] ?? 0;
        dailyCurr += dc * w;
        dailyOpt += dc * ow;
      }
      currentPortfolioDailyReturns[d] = dailyCurr;
      optimalPortfolioDailyReturns[d] = dailyOpt;
    }

    const currentPortfolioAccumulatedReturns: number[] = [];
    const optimalPortfolioAccumulatedReturns: number[] = [];
    let cumCurrent = 1, cumOptimal = 1;
    for (let d = 0; d < days; d++) {
      const dailyCurrent = Math.max(currentPortfolioDailyReturns[d], -0.9999);
      const dailyOptimal = Math.max(optimalPortfolioDailyReturns[d], -0.9999);
      cumCurrent *= 1 + dailyCurrent;
      cumOptimal *= 1 + dailyOptimal;
      currentPortfolioAccumulatedReturns.push(cumCurrent - 1);
      optimalPortfolioAccumulatedReturns.push(cumOptimal - 1);
    }

    const annualized = [
      annualizedReturn(portfolioReturns(aligned, true), dailyChanges[0]?.length ?? 0),
      annualizedReturn(portfolioReturns(aligned, false), dailyChanges[0]?.length ?? 0),
    ];
    const dd = [
      max_drawdown(optimalPortfolioAccumulatedReturns),
      max_drawdown(currentPortfolioAccumulatedReturns),
    ];

    const noHoldings = assets.every(a => (a.quantity || 0) <= 0);

    const statsOut = {
      optimal: {
        risk: dd[0] < .15 ? 'Low' : (dd[0] >= .15 && dd[0] < .30) ? 'Average' : 'High',
        annualReturn: `${(annualized[0] * 100).toFixed(2)}%`,
        drawdown: `${(dd[0] * 100).toFixed(2)}%`,
      },
      current: noHoldings
        ? { risk: '–', annualReturn: '–', drawdown: '–' }
        : {
          risk: dd[1] < .05 ? 'Low' : (dd[1] >= .05 && dd[1] < .15) ? 'Average' : 'High',
          annualReturn: `${(annualized[1] * 100).toFixed(2)}%`,
          drawdown: `${(dd[1] * 100).toFixed(2)}%`,
        }
    } as { optimal: StatsBlock; current: StatsBlock } | null;

    const daysArr = Array.from({ length: currentPortfolioAccumulatedReturns.length }, (_, d) => d);
    const seriesA = daysArr.map(d => ({ x: d, y: currentPortfolioAccumulatedReturns[d] ?? 1, change: currentPortfolioDailyReturns[d] ?? 0, daily: currentPortfolioAccumulatedReturns[d] ?? 1 }));
    const seriesB = daysArr.map(d => ({ x: d, y: optimalPortfolioAccumulatedReturns[d] ?? 1, change: optimalPortfolioDailyReturns[d] ?? 0, daily: optimalPortfolioAccumulatedReturns[d] ?? 1 }));

    function normalizePair<T extends { y: number }>(a: T[], b: T[]) {
      const allY = [...a, ...b].map(p => p.y);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      const range = maxY - minY || 1;
      const normalize = (p: T): T => ({ ...(p as object), y: (p.y - minY) / range } as T);
      return [a.map(normalize), b.map(normalize)] as const;
    }

    const [normalizedA, normalizedB] = normalizePair(seriesA, seriesB);

    return {
      stats: statsOut,
      normalizedA,
      normalizedB,
      length: currentPortfolioAccumulatedReturns.length,
    } as { stats: { optimal: StatsBlock; current: StatsBlock } | null; normalizedA: Array<{ x: number; y: number }>; normalizedB: Array<{ x: number; y: number }>; length: number };
  }, [assets, optimalWeights, portfolioValue]);

  useEffect(() => {
    let cancelled = false;
    if (graphRef.current || !computed) return;
    const chartEl = document.getElementById('chart1');
    if (!chartEl) return;
    ensureRickshaw().then(() => {
      if (cancelled) return;
      const Rmaybe = ((window as unknown as { Rickshaw?: unknown }).Rickshaw) as unknown;
      if (!Rmaybe || !(Rmaybe as { Graph?: unknown }).Graph) return;

      const GraphCtor = (Rmaybe as { Graph: new (args: { element: Element | null; renderer: string; interpolation: string; unstack: boolean; series: Array<Record<string, unknown>> }) => GraphLike }).Graph;
      const graph = new GraphCtor({
        element: chartEl,
        renderer: 'area',
        interpolation: 'basis',
        unstack: true,
        series: [
          { color: '#fdd368', data: computed.normalizedA ?? [], className: 'chart1-current', name: 'Current portfolio' },
          { color: '#495dc6', data: computed.normalizedB ?? [], className: 'chart1-optimal', name: 'Optimal portfolio' },
        ],
      });
      graphRef.current = graph;
      if (graph.render) graph.render();

      const RGraph = (Rmaybe as { Graph: unknown }).Graph as unknown as {
        HoverDetail?: unknown;
        Axis?: { X?: new (args: { graph: GraphLike; element: Element | null; tickFormat: (x: number) => string }) => { render(): void } };
        Legend?: new (args: { graph: GraphLike; element: Element | null }) => unknown;
      };
      if ((Rmaybe as { Class?: { create: (base: unknown, mixin: Record<string, unknown>) => unknown } }).Class && RGraph?.HoverDetail) {
        const HoverCtor = ((Rmaybe as { Class: { create: (base: unknown, mixin: Record<string, unknown>) => unknown } }).Class)
          .create(RGraph.HoverDetail as unknown, {
            render: function (this: unknown, args: unknown) {
              const self = this as { element: HTMLElement; lastEvent: { clientX: number; clientY: number } };
              const a = args as { detail: Array<{ order: number; series: { className: string; color: string }; value: { change: number; daily: number; y0: number; y: number } }> };
              const details = document.createElement('table');
              const boundingRect = (self.element.parentNode as Element | null)?.getBoundingClientRect();
              details.style.top = `${self.lastEvent.clientY - 200}px`;
              self.element.appendChild(details);
              details.className = 'details-table';
              details.innerHTML = `    
                <thead>
                  <tr class="labels">
                    <th></th>
                    <th class="label-s1 light caps ">day (%)</th>
                    <th class="label-s1 light caps ">cummulative (%)</th>
                  </tr>
                </thead>`;
              if (boundingRect && self.lastEvent.clientX > (boundingRect.width * 2 / 3)) {
                self.element.classList.remove('left');
                self.element.classList.add('right');
              } else {
                self.element.classList.remove('right');
                self.element.classList.add('left');
              }
              const tbody = document.createElement('tbody');
              a.detail.sort((a1, b1) => a1.order - b1.order).forEach(function (this: unknown, d) {
                const line = document.createElement('tr');
                const swatch = document.createElement('td');
                const div = document.createElement('div');
                const ePercent = document.createElement('td');
                const eValue = document.createElement('td');
                const dot = document.createElement('div');
                swatch.className = `swatch ${d.series.className}`;
                ePercent.className = 'expected-change';
                ePercent.innerHTML = `${(d.value.change * 100).toFixed(2)}%`;
                eValue.className = 'expected-value';
                eValue.innerHTML = `${(d.value.daily * 100).toFixed(2)}%`;
                swatch.appendChild(div);
                line.appendChild(swatch);
                line.appendChild(ePercent);
                line.appendChild(eValue);
                tbody.appendChild(line);
                dot.className = `dot ${d.series.className}`;
                const yScale = (graph as GraphLike).y;
                if (typeof yScale === 'function') {
                  dot.style.top = `${yScale(d.value.y0 + d.value.y)}px`;
                }
                dot.style.borderColor = d.series.color;
                self.element.appendChild(dot);
                dot.className = `dot active ${d.series.className}`;
                (this as { show: () => void }).show();
              }, this as unknown);
              details.appendChild(tbody);
            }
          }) as unknown as { new(args: { graph: unknown }): unknown };
        new HoverCtor({ graph });
      }

      if (RGraph?.Axis?.X) {
        const AxisX = RGraph.Axis.X;
        const xAxis = new AxisX({
          graph,
          tickFormat: (x: number) => {
            const len = computed.length ?? 0;
            const date = new Date(Date.parse(new Date().toString()) - (len) * 86_400_000 + (x * 86_400_000));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substr(-2, 2)}`;
          },
          element: document.getElementById('chart1X'),
        });
        xAxisRef.current = xAxis;
        const syncAxisSize = () => {
          const axisEl = document.getElementById('chart1X');
          const chart = chartEl as HTMLElement;
          if (!axisEl || !chart) return;
          const svg = chart.querySelector('svg');
          const svgRect = svg ? (svg as SVGElement).getBoundingClientRect() : null;
          const width = svgRect?.width ?? chart.clientWidth;
          axisEl.style.width = `${width}px`;
        };
        syncAxisSize();
        xAxis.render();
      }

      if (RGraph?.Legend) {
        const LegendCtor = RGraph.Legend;
        new LegendCtor({ graph, element: document.getElementById('chart1Legend') });
        const legendRoot = document.getElementById('chart1Legend');
        if (legendRoot) {
          legendRoot.addEventListener('click', (ev) => {
            const target = ev.target as Element;
            const label = target.closest('.label');
            if (!label) return;
            const line = label.closest('.line') || label.closest('li');
            if (!line) return;
            const swatch = (line as Element).querySelector('.swatch');
            if (!swatch) return;
            legendRoot.querySelectorAll('.swatch.active').forEach((el) => el.classList.remove('active'));
            swatch.classList.add('active');

            const isOptimal = (line as Element).classList.contains('chart1-optimal');
            document.querySelectorAll('.stats-current').forEach((el) => {
              el.classList.toggle('hidden', isOptimal);
            });
            document.querySelectorAll('.stats-optimal').forEach((el) => {
              el.classList.toggle('hidden', !isOptimal);
            });
          });
          requestAnimationFrame(() => {
            const optimal = legendRoot.querySelector('.chart1-optimal .swatch');
            if (optimal) {
              legendRoot.querySelectorAll('.swatch.active').forEach((el) => el.classList.remove('active'));
              optimal.classList.add('active');
              document.querySelectorAll('.stats-current').forEach((el) => el.classList.add('hidden'));
              document.querySelectorAll('.stats-optimal').forEach((el) => el.classList.remove('hidden'));
            }
          });
        }
      }

      type D3Sel = { empty: () => boolean; select: (sel: string) => D3Sel; append: (arg: string) => D3Sel; attr: (name: string, value?: unknown) => D3Sel; style: (name: string, value?: unknown) => D3Sel; node: () => SVGElement | null };
      const applyOptimalHatch = () => {
        const d3g = (window as unknown as { d3?: { select: (sel: string | Element) => D3Sel } }).d3;
        if (!d3g?.select) return;
        const svg = d3g.select('#chart1 svg');
        if (!svg || svg.empty()) return;
        let defs = svg.select('defs');
        if (!defs || defs.empty()) defs = svg.append('defs');
        let pattern = defs.select('#diagonalHatch');
        if (!pattern || pattern.empty()) {
          pattern = defs.append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 8)
            .attr('height', 8);
          pattern.append('path')
            .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
            .attr('stroke', '#495dc6')
            .attr('stroke-width', 1)
            .attr('opacity', 0.3);
        }
        const optimalArea = svg.select('.chart1-optimal path.area');
        if (!optimalArea || optimalArea.empty()) return;
        const dAttrSel = optimalArea.attr('d') as unknown as string | undefined;
        const areaNode = optimalArea.node();
        if (!dAttrSel || !areaNode) return;
        const parent = areaNode.parentNode as Element | null;
        if (!parent) return;
        let hatch = d3g.select(parent).select('path.optimal-hatch');
        if (!hatch || hatch.empty()) {
          hatch = d3g.select(parent)
            .append('path')
            .attr('class', 'optimal-hatch')
            .attr('fill', 'url(#diagonalHatch)')
            .attr('opacity', 0.4)
            .style('pointer-events', 'none');
        }
        hatch.attr('d', dAttrSel);
      };

      applyOptimalHatch();

      const ro = new ResizeObserver(() => {
        const width = (chartEl as HTMLElement).clientWidth;
        const height = (chartEl as HTMLElement).clientHeight;
        if (graph.configure) graph.configure({ width, height });
        const axisEl = document.getElementById('chart1X');
        if (axisEl) {
          const chart = chartEl as HTMLElement;
          const svg = chart.querySelector('svg');
          const svgRect = svg ? (svg as SVGElement).getBoundingClientRect() : null;
          const newWidth = svgRect?.width ?? width;
          axisEl.style.width = `${newWidth}px`;
        }
        if (xAxisRef.current?.render) xAxisRef.current.render();
        if (graph.render) graph.render();
        applyOptimalHatch();
      });
      ro.observe(chartEl);
    });
    return () => { cancelled = true; };
  }, [computed]);

  useEffect(() => {
    if (!graphRef.current || !computed) return;
    try {
      const graph = graphRef.current as GraphLike;
      if (graph.series?.[0]) graph.series[0].data = computed.normalizedA ?? [];
      if (graph.series?.[1]) graph.series[1].data = computed.normalizedB ?? [];
      if (xAxisRef.current?.render) {
        xAxisRef.current.render();
      }
      if (graph.render) graph.render();
      try {
        const d3g = (window as unknown as { d3?: unknown }).d3;
        if (d3g) {
          Promise.resolve().then(() => {
            const apply = () => {
              type D3SelLocal = { empty: () => boolean; select: (sel: string | Element) => D3SelLocal; append: (arg: string) => D3SelLocal; attr: (name: string, value?: unknown) => D3SelLocal; style: (name: string, value?: unknown) => D3SelLocal; node: () => SVGElement | null };
              const d3gx = (window as unknown as { d3?: { select: (sel: string | Element) => D3SelLocal } }).d3;
              if (!d3gx?.select) return;
              const svgx = d3gx.select('#chart1 svg');
              if (!svgx || svgx.empty()) return;
              let defs = svgx.select('defs');
              if (!defs || defs.empty()) defs = svgx.append('defs');
              let pattern = defs.select('#diagonalHatch');
              if (!pattern || pattern.empty()) {
                pattern = defs.append('pattern')
                  .attr('id', 'diagonalHatch')
                  .attr('patternUnits', 'userSpaceOnUse')
                  .attr('width', 8)
                  .attr('height', 8);
                pattern.append('path')
                  .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
                  .attr('stroke', '#495dc6')
                  .attr('stroke-width', 1)
                  .attr('opacity', 0.3);
              }
              const optimalArea = svgx.select('.chart1-optimal path.area');
              if (!optimalArea || optimalArea.empty()) return;
              const dAttrSel = optimalArea.attr('d') as unknown as string | undefined;
              const areaNode = (optimalArea as unknown as { node: () => SVGElement | null }).node();
              if (!dAttrSel || !areaNode) return;
              const parent = areaNode.parentNode as Element | null;
              if (!parent) return;
              let hatch = d3gx.select(parent).select('path.optimal-hatch');
              if (!hatch || hatch.empty()) {
                hatch = d3gx.select(parent)
                  .append('path')
                  .attr('class', 'optimal-hatch')
                  .attr('fill', 'url(#diagonalHatch)')
                  .attr('opacity', 0.4)
                  .style('pointer-events', 'none');
              }
              hatch.attr('d', dAttrSel);
            };
            apply();
          });
        }
      } catch { void 0; }
    } catch { void 0; }
  }, [computed]);

  const stats = computed?.stats;

  return (
    <div className="border-cloudy-blue border-[1rem] border-solid max-w-[1224rem] bg-white rounded-[8rem] m-auto my-[120rem] overflow-hidden">
      <h2 className="pt-[60rem] text-style-3 pl-[40rem] mb-[48rem]">Past performance</h2>

      <div className="h-[512rem] w-full border-t-[1rem] border-t-pale-grey-two border-t-solid border-b-0 border-b-pale-grey-two border-b-solid">
        <div className="flex h-full">
          <div className="assets-stats min-w-[184rem] border-r-[1rem] border-r-pale-grey-two border-r-solid">
            <div className="stats-current hidden border-b-[1rem] border-b-pale-grey-two border-b-solid pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase">Risk</div>
              <div className="text-style-10 ">{stats?.current.risk}</div>
            </div>
            <div className="stats-current hidden border-b-[1rem] border-b-pale-grey-two border-b-solid pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase">Drawdown</div>
              <div className="text-style-10 uppercase">{stats?.current.drawdown}</div>
            </div>
            <div className="stats-current hidden pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase whitespace-nowrap">annual return</div>
              <div className="text-style-10 uppercase">{stats?.current.annualReturn}</div>
            </div>
            <div className="stats-optimal border-b-[1rem] border-b-pale-grey-two border-b-solid pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase">Risk</div>
              <div className="text-style-10 ">{stats?.optimal.risk}</div>
            </div>
            <div className="stats-optimal border-b-[1rem] border-b-pale-grey-two border-b-solid pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase">Drawdown</div>
              <div className="text-style-10 uppercase">{stats?.optimal.drawdown}</div>
            </div>
            <div className="stats-optimal pt-[32rem] pb-[32rem] pl-[32rem] pr-[50rem]">
              <div className="text-style-8 mb-[4rem] uppercase whitespace-nowrap">annual return</div>
              <div className="text-style-10 uppercase">{stats?.optimal.annualReturn}</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <div id="chart1Legend" />
            <div id="chart1" />
            <div id="chart1X" />
          </div>
        </div>
      </div>
    </div>
  );
}
