import { ensureD3, type D3Global } from "../vendor/d3";

export type PieDatum = {
  label: string;
  value: number;
  enabled?: boolean;
};

export type RenderPieChart = (
  dataset: PieDatum[],
  dom_element_to_append_to: string | Element,
  colorScheme: string[]
) => void;

function sumValues(data: PieDatum[]): number {
  return data.reduce((acc, d) => acc + (d.enabled === false ? 0 : d.value || 0), 0);
}

function getContainer(target: string | Element): Element | null {
  if (typeof target === 'string') return document.querySelector(target);
  return target ?? null;
}

const renderPieChart: RenderPieChart = (dataset, dom_element_to_append_to, colorScheme) => {
  const container = getContainer(dom_element_to_append_to);
  if (!container) return;

  ensureD3()
    .then((d3: D3Global) => {
      try {
        const margin = { top: 50, bottom: 50, left: 50, right: 50 } as const;
        const width = 450 - margin.left - margin.right;
        const height = width;
        const radius = Math.min(width, height) / 2;
        const donutWidth = 75;
        dataset.forEach((item) => { if (typeof item.enabled === 'undefined') item.enabled = true; });

        // color scale (support d3 v3 via ordinal, fallback to category10)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colorScale: any = d3.scale?.ordinal ? (d3.scale as any).ordinal() : (d3.scale as any).category10();
        const color = (label: string): string => colorScale.range(colorScheme).domain(dataset.map(d => d.label))(label);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d3container = (d3.select as any)(container);

        const svg = d3container
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arc = (d3.svg && (d3.svg as any).arc ? (d3.svg as any).arc() : (d3 as any).arc())
          .outerRadius(radius - 10)
          .innerRadius(radius - donutWidth);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pie = (d3.layout?.pie ? (d3.layout as any).pie() : (d3 as any).pie())
          .sort(null)
          .value((d: PieDatum) => d.value);

        // tooltip
        const tooltip = d3container
          .append('div')
          .attr('class', 'tooltip');

        tooltip.append('div').attr('class', 'swatch');
        tooltip.append('div').attr('class', 'label');
        tooltip.append('div').attr('class', 'percent');

        const path = svg.selectAll('path')
          .data(pie(dataset))
          .enter()
          .append('path')
          .attr('d', arc)
          .style('stroke', 'white')
          .style('stroke-width', 4)
          .attr('class', (_d: unknown, i: number) => 'arc-' + i)
          .attr('fill', (d: { data: PieDatum }) => color(d.data.label));

        path.on('mouseover', function (d: { data: PieDatum }) {
          const enabledTotal = sumValues(dataset);
          const percent = enabledTotal ? Math.round(1000 * d.data.value / enabledTotal) / 10 : 0;
          tooltip.select('.label').html(d.data.label.toUpperCase() + ': ');
          tooltip.select('.swatch').style('background', color(d.data.label));
          tooltip.select('.percent').html(percent + '%');
          tooltip.style('display', 'flex');
          tooltip.style('opacity', 1);
        });

        path.on('mousemove', function () {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const evtRaw: any = (d3 as any).event ?? (window as unknown as { event?: MouseEvent }).event;
          const evt = evtRaw as MouseEvent & { layerX?: number; layerY?: number; offsetX?: number; offsetY?: number };
          const x = (evt.layerX ?? evt.offsetX ?? 0) - 25;
          const y = (evt.layerY ?? evt.offsetY ?? 0) + 10;
          tooltip.style('top', y + 'rem').style('left', x + 'rem');
        });

        path.on('mouseout', function () {
          tooltip.style('display', 'none');
          tooltip.style('opacity', 0);
        });

        const legend5 = d3.select('.legend5');
        const entries = legend5.selectAll('div.legend')
          .data(dataset.map(d => d.label))
          .enter()
          .append('div')
          .attr('class', 'legend');

        entries.append('div')
          .style('background', (label: string) => color(label))
          .style('width', '12rem')
          .style('height', '12rem')
          .style('border-radius', '30rem')
          .style('display', 'inline-block')
          .style('margin-right', '8rem');

        entries.append('span').html((label: string) => label);
      } catch (err) {
        console.error(err);
      }
    })
    .catch((err) => console.error(err));
};

export default renderPieChart;
