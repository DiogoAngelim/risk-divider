import { useState, useEffect } from "react";
import getFormattedPrice from "../lib/getFormattedPrice";
import gaussianSmooth from "../lib/gaussianSmooth";
import { electronAPI } from "../lib/electronAPI";
import type { Asset } from "../../types/asset";
import { useRef } from "react";
import { ensureRickshaw } from "../lib/vendor/rickshaw";

interface AssetProps {
  suggestion: Asset & { name: string; image: string };
  country: string;
  onRemove: (symbol: string) => void;
}

export default function Asset({ suggestion, country, onRemove }: AssetProps) {
  const { name, symbol, quantity = 0, closePrices, dailyChange } = suggestion;
  const [inputValue, setInputValue] = useState<number>(quantity);
  const [showQuantityInput, setShowQuantityInput] = useState<boolean>(!!quantity);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const countryMap: Record<string, string> = {
    B3: 'BR',
  };
  const displayCountry = countryMap[country] || country;
  const openPrice = closePrices.at(-2) ?? 0;
  const closePrice = closePrices.at(-1) ?? 0;
  const changeValue = closePrice - openPrice;
  const variation = ((dailyChange.at(-1) ?? 0) * 100).toFixed(2);
  const isPositive = changeValue >= 0;
  const color = isPositive ? "#37c171" : "#ed0123";
  const formattedChange = `${isPositive ? '+' : ''}${getFormattedPrice(Math.abs(changeValue), displayCountry)} (${variation}%)`;
  const formattedClose = getFormattedPrice(closePrice, displayCountry);
  console.log('Asset country:', country, 'displayCountry:', displayCountry, 'closePrice:', closePrice, 'formattedClose:', formattedClose);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !closePrices?.length) return;

    (async () => {
      try {
        await ensureRickshaw();
        const Rmaybe = (window as unknown as { Rickshaw?: unknown }).Rickshaw;
        if (!Rmaybe || !(Rmaybe as { Graph?: unknown }).Graph) return;

        const rawPrices = closePrices.map(Number);
        const smoothed = gaussianSmooth(rawPrices, 20, 14);

        const densified: number[] = [];
        for (let i = 0; i < smoothed.length - 1; i++) {
          const a = smoothed[i];
          const b = smoothed[i + 1];
          for (let s = 0; s < 20; s++) {
            const t = s / 20;
            densified.push(a + (b - a) * t);
          }
        }
        densified.push(smoothed[smoothed.length - 1]);

        const min = Math.min(...densified);
        const max = Math.max(...densified);
        const isDecreasing = densified[0] > densified[densified.length - 1];
        const data = densified.map((price, index) => {
          const y = isDecreasing ? 1 - (price - min) / (max - min) : (price - min) / (max - min);
          return { x: index, y };
        });

        Array.from(element.querySelectorAll(':scope > svg')).forEach(svg => svg.remove());

        const GraphCtor = (Rmaybe as { Graph: new (args: { element: Element; renderer: string; interpolation: string; width: number; height: number; series: Array<Record<string, unknown>> }) => { render(): void } }).Graph;
        const graph = new GraphCtor({
          element,
          renderer: 'area',
          interpolation: 'basis',
          width: 275,
          height: 240,
          series: [{
            color: 'url(#diagonal-stripe-1)',
            className: 'chart2-current',
            name: 'Portfolio atual',
            data,
          }]
        });

        graph.render();

        const svg = element.querySelector('svg');
        if (svg) {
          let defs = svg.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild);
          }
          let pattern = svg.querySelector('#diagonal-stripe-1');
          if (!pattern) {
            pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', 'diagonal-stripe-1');
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            pattern.setAttribute('width', '6');
            pattern.setAttribute('height', '6');
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('fill', '#e1e7eb');
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('width', '100%');
            bg.setAttribute('height', '100%');
            bg.setAttribute('fill', '#eff4fe');
            g.appendChild(bg);
            const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            p1.setAttribute('points', '5 0 6 0 0 6 0 5');
            g.appendChild(p1);
            const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            p2.setAttribute('points', '6 5 6 6 5 6');
            g.appendChild(p2);
            defs.appendChild(pattern);
            pattern.appendChild(g);
          }
        }
      } catch (err) {
        console.error('Rickshaw render failed', err);
      }
    })();

  }, [closePrices]);

  useEffect(() => {
    if (!electronAPI?.store) return;
    let cancelled = false;

    (async () => {
      const stored: (Asset & { name?: string })[] = ((await electronAPI.store.get("assets")) as (Asset & { name?: string })[]) || [];
      if (cancelled) return;

      const updated = stored.map((a) =>
        a.symbol === symbol ? { ...a, quantity: inputValue } : a
      );
      await electronAPI.store.set("assets", updated);
      if (cancelled) return;

      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0];
      await electronAPI.store.set('creationDate', formattedDate);
    })();

    return () => {
      cancelled = true;
    };
  }, [inputValue, symbol]);

  useEffect(() => {
    if (showQuantityInput) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [showQuantityInput]);

  const handleRevealQuantity = () => {
    setShowQuantityInput(true);
  };

  const handleQuantityBlur = () => {
    if (!inputValue || Number(inputValue) === 0) {
      setShowQuantityInput(false);
    }
  };

  return (
    <div>
      <div
        id={`chart-${symbol}`}
        ref={containerRef}
        className="flex flex-col justify-between h-[240rem] w-[275rem] border-solid border-b-pale-grey-two border-[1px] rounded-[16rem] bg-white pt-[20rem] pl-[24rem] pr-[12rem] pb-[16rem]"
        tabIndex={1}
      >
        <div>
          <svg
            height="14"
            width="14"
            viewBox="0 0 14 14"
            onClick={() => onRemove?.(symbol)}
          >
            <path
              d="m13.3.71a.996.996 0 0 0 -1.41 0l-4.89 4.88-4.89-4.89a.996.996 0 1 0 -1.41 1.41l4.89 4.89-4.89 4.89a.996.996 0 1 0 1.41 1.41l4.89-4.89 4.89 4.89a.996.996 0 1 0 1.41-1.41l-4.89-4.89 4.89-4.89c.38-.38.38-1.02 0-1.4z"
              fill="#b8c4ce"
            />
          </svg>
          <div className="text-style-12 uppercase mb-[6rem] overflow-hidden truncate">{symbol}</div>
          <div className="text-custom-sm text-bluey-grey-three capitalize">{name}</div>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-style-15 uppercase">1 year view</div>
          <div className="text-right">
            <div className="text-style-23">{formattedClose}</div>
            <div className="text-custom-sm" style={{ color }}>
              {formattedChange}
            </div>
          </div>
        </div>
      </div>

      <div className="add-asset">
        <input
          name={symbol}
          ref={inputRef}
          value={inputValue}
          data-quantity={inputValue}
          data-value={name?.toLowerCase?.() || ''}
          className="text-style-20 bg-transparent text-center w-[112rem] text-black absolute left-[65rem] top-0 h-[34rem] z-[1] cursor-pointer"
          style={{ opacity: showQuantityInput ? 1 : 0, pointerEvents: showQuantityInput ? 'auto' : 'none' }}
          placeholder="0"
          type="number"
          min={0}
          onChange={(e) => setInputValue(Number(e.target.value))}
          onBlur={handleQuantityBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <span
          onClick={handleRevealQuantity}
          className={`text-style-15 absolute left-[50%] -translate-x-[50%] ${showQuantityInput || inputValue > 0 ? 'top-[34rem] z-10' : 'top-[30rem] z-[1] h-[0]'} flex items-center justify-center cursor-pointer transition-all duration-[400ms] ease-in-out`}
        >
          {showQuantityInput || inputValue > 0
            ? inputValue === 1
              ? 'SHARE'
              : 'SHARES'
            : 'ADD THE QUANTITY'}
        </span>
      </div>
    </div>
  );
}
