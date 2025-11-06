/* eslint-disable @typescript-eslint/no-explicit-any */
import { ensureD3 } from "../vendor/d3";

export type Margin = { top: number; right: number; bottom: number; left: number };
export interface RadarDatum { axis: string; value: number; name?: string }
export type RadarSeries = RadarDatum[];
export interface RadarChartOptions {
  w: number;
  h: number;
  margin: Margin;
  levels: number;
  maxValue: number;
  labelFactor: number;
  wrapWidth: number;
  opacityArea: number;
  dotRadius: number;
  opacityCircles: number;
  strokeWidth: number;
  roundStrokes: boolean;
  color: (i: number) => string;
  opacity: (i: number) => number; // optional in practice, but kept for typing parity with usage
}

export default function RadarChart(id: string, data: RadarSeries[], options?: Partial<RadarChartOptions>) {
  ensureD3().then((d3: any) => {

    const cfg: any = {
      w: 600,
      h: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      levels: 5,
      maxValue: 0,
      labelFactor: 1.2,
      wrapWidth: 60,
      opacityArea: 0.2,
      dotRadius: 6,
      opacityCircles: 0.1,
      strokeWidth: 1,
      roundStrokes: false,
      color: d3.scale.category10()
    };


    if (typeof options !== 'undefined') {
      for (const k in options) {
        if (typeof (options as any)[k] !== 'undefined') {
          (cfg as any)[k] = (options as any)[k];
        }
      }
    }


    const maxValue = Math.max(
      cfg.maxValue,
      d3.max(data, function (i: RadarSeries) { return d3.max(i.map(function (o: RadarDatum) { return o.value; })); })
    );

    const allAxis = (data[0].map(function (i: RadarDatum) { return i.axis; }));
    const total = allAxis.length;
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const Format = d3.format('%');
    const angleSlice = Math.PI * 2 / total;


    const rScale = d3.scale.linear()
      .range([0, radius])
      .domain([0, maxValue]);


    d3.select(id).select('svg').remove();


    const div = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('display', 'none');


    const svg = d3.select(id).append('svg')
      .attr('width', cfg.w + cfg.margin.left + cfg.margin.right)
      .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
      .attr('class', 'radar' + id);


    const g = svg.append('g')
      .attr('transform', 'translate(' + (cfg.w / 2 + cfg.margin.left) + ',' + (cfg.h / 2 + cfg.margin.top) + ')');


    const filter = g.append('defs').append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');


    const axisGrid = g.append('g').attr('class', 'axisWrapper');


    axisGrid.selectAll('.levels')
      .data(d3.range(1, (cfg.levels + 1)).reverse())
      .enter()
      .append('circle')
      .attr('class', 'gridCircle')
      .attr('r', function (d: number) { return radius / cfg.levels * d; })
      .style('fill', '#ffffff')
      .style('stroke', '#CDCDCD');


    axisGrid.selectAll('.axisLabel')
      .data(d3.range(1, (cfg.levels + 1)).reverse())
      .enter().append('text')
      .attr('class', 'axisLabel')
      .attr('x', 4)
      .attr('y', function (d: number) { return -d * radius / cfg.levels; })
      .attr('dy', '0.4em')
      .style('font-size', '18px')
      .attr('fill', '#737373');


    const axis = axisGrid.selectAll('.axis')
      .data(allAxis)
      .enter()
      .append('g')
      .attr('class', 'axis');


    axis.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', function (_d: unknown, i: number) { return rScale(maxValue * 1) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr('y2', function (_d: unknown, i: number) { return rScale(maxValue * 1) * Math.sin(angleSlice * i - Math.PI / 2); })
      .attr('class', 'line')
      .style('stroke', '#e1e7eb')
      .style('stroke-width', '1px');


    axis.append('text')
      .attr('class', 'legend')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', function (_d: string, i: number) { return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr('y', function (_d: string, i: number) { return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2); })
      .text(function (d: string) { return d; })
      .call(wrap as any, cfg.wrapWidth);


    axis.append('circle')
      .attr('r', '8px')
      .style('fill', 'white')
      .style('stroke', '#e1e7eb')
      .style('stroke-width', '1px');


    const radarLine = d3.svg.line.radial()
      .interpolate('linear-closed')
      .radius(function (d: RadarDatum) { return rScale(d.value); })
      .angle(function (_d: RadarDatum, i: number) { return i * angleSlice; });

    if (cfg.roundStrokes) {
      radarLine.interpolate('cardinal-closed');
    }


    const blobWrapper = g.selectAll('.radarWrapper')
      .data(data)
      .enter().append('g')
      .attr('class', 'radarWrapper');


    blobWrapper
      .append('path')
      .attr('class', 'radarArea')
      .attr('d', function (d: RadarSeries) { return radarLine(d as any); })
      .style('fill', function (_d: RadarSeries, i: number) { return cfg.color(i) === '#fdd368' ? 'url("#diagonal-stripe-1")' : cfg.color(i); })
      .style('fill-opacity', function (_d: RadarSeries, i: number) { return cfg.opacity(i); });


    blobWrapper.append('path')
      .attr('class', 'radarStroke')
      .attr('d', function (d: RadarSeries) { return radarLine(d as any); })
      .style('stroke-width', cfg.strokeWidth + 'px')
      .style('stroke', function (_d: RadarSeries, i: number) { return cfg.color(i); })
      .style('fill', 'none')
      .style('filter', 'url(#glow)');


    blobWrapper.selectAll('.radarCircle')
      .data(function (d: RadarSeries) { return d; })
      .enter().append('circle')
      .attr('class', 'radarCircle')
      .attr('r', cfg.dotRadius)
      .attr('cx', function (d: RadarDatum, i: number) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr('cy', function (d: RadarDatum, i: number) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
      .style('fill', function (_d: RadarDatum, _i: number, j: number) { return cfg.color(j); })
      .style('stroke', 'white')
      .style('stroke-width', '2px');


    const blobCircleWrapper = g.selectAll('.radarCircleWrapper')
      .data(data)
      .enter().append('g')
      .attr('class', 'radarCircleWrapper');

    blobCircleWrapper.selectAll('.radarInvisibleCircle')
      .data(function (d: RadarSeries) { return d; })
      .enter().append('circle')
      .attr('class', 'radarInvisibleCircle')
      .attr('r', cfg.dotRadius * 1.5)
      .attr('cx', function (d: RadarDatum, i: number) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr('cy', function (d: RadarDatum, i: number) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', function (d: RadarDatum, _i: number, j: number) {
        div.transition()
          .duration(200)
          .style('opacity', 1)
          .style('display', 'block');
        div.html(
          '<div class="align-left"><span class="label-m1 caps dark bold">' + d.axis + '</span> - <span class="label-m1 dark">' +
          Format(d.value) +
          '</span></div><span class="tooltip-swatch mr-[5rem]" style="background: ' + cfg.color(j) + '"></span><span class="label-s1 light caps">' +
          (d.name || '') + '</div>'
        )
          .style('left', (d3.event.pageX) + 10 + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      })
      .on('mouseout', function () {
        div.transition()
          .duration(500)
          .style('opacity', 0)
          .style('display', 'none');
      });


    function wrap(text: any, width: number) {
      text.each(function (this: any) {
        const textSel = d3.select(this);
        const words = textSel.text().split(/\s+/).reverse();
        let word: string | undefined;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.4; // ems
        const y = textSel.attr('y');
        const x = textSel.attr('x');
        const dy = parseFloat(textSel.attr('dy'));
        let tspan = textSel.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');

        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(' '));
          if ((tspan.node() as SVGTextContentElement).getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = textSel.append('tspan').attr('x', x).attr('y', y).attr('dy', (++lineNumber * lineHeight + dy) + 'em').text(word);
          }
        }
      });
    }
  }).catch((err) => {
    console.error('Failed to load D3 for RadarChart:', err);
  });
}

// Types are exported above; no duplicate re-exports
