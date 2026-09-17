import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export default function BubbleChart({ data, selectedYear, viewMode, geoLevel, onHoverItem }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const metaRef = useRef({});

  const width = 1100;
  const height = 750;
  const margin = { top: 70, right: 50, bottom: 90, left: 80 };

  const MIN_RADIUS_FOR_LABEL = 32;

  const applyLayoutForces = useCallback((mode, restart = true) => {
    if (!simulationRef.current || !metaRef.current.width) return;
    const {
      xPriceScale,
      xChangeScale,
      yChangeScale,
      radiusScale,
      width,
      height,
      margin,
    } = metaRef.current;

    const simulation = simulationRef.current;
    const svg = d3.select(svgRef.current);
    const gridGroup = svg.select('.grid-layer');
    const axisGroup = svg.select('.axis-layer');

    const centerY = height / 2 + 20;

    gridGroup.selectAll('*').remove();
    axisGroup.selectAll('*').remove();

    // Release any previously pinned X coordinates
    simulation.nodes().forEach((d) => {
      d.fx = null;
      d.fy = null;
    });

    if (mode === 'all') {
      simulation
        .force('charge', d3.forceManyBody().strength((d) => -Math.pow(radiusScale(d.Count), 1.5) * (geoLevel === 'hscp' ? 0.35 : 0.12)))
        .force('collision', d3.forceCollide().radius((d) => radiusScale(d.Count) + (geoLevel === 'hscp' ? 2 : 0.8)).iterations(3))
        .force('x', d3.forceX((d) => {
          const change = d.PctChange1Yr ?? 0;
          const normalizedOffset = Math.max(-1, Math.min(1, change / 25));
          return width / 2 + normalizedOffset * 140;
        }).strength(0.14))
        .force('y', d3.forceY(centerY).strength(0.12));
    } else if (mode === 'scatter') {
      // 2D view: Pin directly to exact mathematical (x, y) coordinates
      simulation
        .force('charge', null)
        .force('collision', null)
        .force('x', d3.forceX((d) => (d.Mean != null ? xPriceScale(d.Mean) : width / 2)).strength(1.0))
        .force('y', d3.forceY((d) => (d.PctChange1Yr != null ? yChangeScale(d.PctChange1Yr) : centerY)).strength(1.0));

      const xFormat = (d) => `£${d >= 1000000 ? `${(d / 1000000).toFixed(1)}M` : `${Math.round(d / 1000)}k`}`;
      const yFormat = (d) => `${d > 0 ? '+' : ''}${Math.round(d)}%`;

      const xAxis = d3.axisBottom(xPriceScale).ticks(7).tickFormat(xFormat);
      const yAxis = d3.axisLeft(yChangeScale).ticks(8).tickFormat(yFormat);

      const xGrid = d3.axisBottom(xPriceScale)
        .ticks(7)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat('');

      const yGrid = d3.axisLeft(yChangeScale)
        .ticks(8)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat('');

      gridGroup.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xGrid)
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3'));

      gridGroup.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yGrid)
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3'));

      if (yChangeScale.domain()[0] <= 0 && yChangeScale.domain()[1] >= 0) {
        gridGroup.append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', yChangeScale(0))
          .attr('y2', yChangeScale(0))
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.2);
      }

      axisGroup.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
        .call((g) => g.selectAll('.tick text')
          .attr('fill', '#475569')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('dy', '14px')
        );

      axisGroup.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yAxis)
        .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
        .call((g) => g.selectAll('.tick text')
          .attr('fill', '#475569')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('dx', '-6px')
        );

      axisGroup.append('text')
        .attr('x', width - margin.right)
        .attr('y', height - margin.bottom - 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', '#64748b')
        .text('Mean Property Price (£) →');

      axisGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -margin.top)
        .attr('y', margin.left + 20)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', '#64748b')
        .text('1-Yr Price Growth (%) →');
    } else {
      // 1D Axis Modes ('price' or 'change'): Lock X to exact value, allow only vertical displacement
      const activeScale = mode === 'change' ? xChangeScale : xPriceScale;
      const tickFormat = mode === 'change'
        ? (d) => `${d > 0 ? '+' : ''}${Math.round(d)}%`
        : (d) => `£${d >= 1000000 ? `${(d / 1000000).toFixed(1)}M` : `${Math.round(d / 1000)}k`}`;

      const tickCount = mode === 'change' ? 8 : 6;

      const axis = d3.axisBottom(activeScale).ticks(tickCount).tickFormat(tickFormat);
      const gridAxis = d3.axisBottom(activeScale)
        .ticks(tickCount)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat('');

      gridGroup.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(gridAxis)
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3'));

      axisGroup.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(axis)
        .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
        .call((g) => g.selectAll('.tick text')
          .attr('fill', '#475569')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('dy', '14px')
        );

      simulation.nodes().forEach((d) => {
        const val = mode === 'change' ? d.PctChange1Yr : d.Mean;
        d.fx = val != null ? activeScale(val) : width / 2;
      });

      simulation
        .force('charge', null)
        .force('x', null)
        .force('collision', d3.forceCollide().radius((d) => radiusScale(d.Count) + 0.8).iterations(6))
        .force('y', d3.forceY(centerY).strength(0.12));
    }

    if (restart) {
      simulation.alpha(0.85).restart();
    }
  }, [geoLevel]);

  useEffect(() => {
    applyLayoutForces(viewMode, true);
  }, [viewMode, applyLayoutForces]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const yearData = JSON.parse(
      JSON.stringify(data.filter((d) => d.DateCode === selectedYear && d.Count > 0))
    ).sort((a, b) => (b.Count || 0) - (a.Count || 0));

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto');

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');

    const isSingleArea = geoLevel === 'zone' && yearData.length < 150;

    const maxCount = d3.max(yearData, (d) => d.Count) || 100;
    const radiusRange = geoLevel === 'hscp'
      ? [10, 42]
      : (isSingleArea ? [3.5, 18] : (viewMode === 'scatter' ? [0.8, 8] : [0.8, 8]));

    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCount])
      .range(radiusRange);

    const colorScale = d3.scaleDiverging()
      .domain([-20, 0, 25])
      .interpolator(d3.interpolateRdBu);

    const validChanges = yearData
      .map((d) => d.PctChange1Yr)
      .filter((v) => v != null && !isNaN(v));

    const minChange = d3.min(validChanges) ?? -20;
    const maxChange = d3.max(validChanges) ?? 25;

    const xChangeScale = d3.scaleLinear()
      .domain([
        Math.min(-5, Math.floor(minChange / 5) * 5),
        Math.max(5, Math.ceil(maxChange / 5) * 5),
      ])
      .range([margin.left + 30, width - margin.right - 20])
      .nice();

    const yChangeScale = d3.scaleLinear()
      .domain([
        Math.min(-5, Math.floor(minChange / 5) * 5),
        Math.max(5, Math.ceil(maxChange / 5) * 5),
      ])
      .range([height - margin.bottom, margin.top + 20])
      .nice();

    const validPrices = yearData
      .map((d) => d.Mean)
      .filter((v) => v != null && !isNaN(v) && v > 0);

    const minPrice = d3.min(validPrices) || 30000;
    const maxPrice = d3.max(validPrices) || 600000;

    const priceDomainMin = Math.max(0, Math.floor(minPrice / 50000) * 50000);
    const priceDomainMax = Math.ceil((maxPrice * 1.05) / 50000) * 50000;

    const xPriceScale = d3.scaleLinear()
      .domain([priceDomainMin, priceDomainMax])
      .range([margin.left + 30, width - margin.right - 20])
      .nice();

    metaRef.current = {
      xPriceScale,
      xChangeScale,
      yChangeScale,
      radiusScale,
      colorScale,
      width,
      height,
      margin,
      geoLevel,
    };

    linearGradient.selectAll('stop')
      .data([
        { offset: '0%', color: colorScale(-20) },
        { offset: '50%', color: colorScale(0) },
        { offset: '100%', color: colorScale(25) },
      ])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    const gridGroup = svg.append('g').attr('class', 'grid-layer');
    const nodeGroup = svg.append('g').attr('class', 'nodes-layer');
    const axisGroup = svg.append('g').attr('class', 'axis-layer');
    const legendGroup = svg.append('g').attr('class', 'legends-layer');

    // Color Legend
    const colorLegend = legendGroup.append('g').attr('transform', `translate(${margin.left}, 25)`);
    colorLegend.append('rect')
      .attr('width', 160).attr('height', 10).attr('rx', 3)
      .style('fill', 'url(#legend-gradient)');
    colorLegend.append('text')
      .attr('x', 0).attr('y', -6).attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#475569')
      .text('1-Yr Price Change');
    colorLegend.append('text').attr('x', 0).attr('y', 22).attr('font-size', '10px').attr('fill', '#64748b').text('-20%');
    colorLegend.append('text').attr('x', 80).attr('y', 22).attr('font-size', '10px').attr('text-anchor', 'middle').attr('fill', '#64748b').text('0%');
    colorLegend.append('text').attr('x', 160).attr('y', 22).attr('font-size', '10px').attr('text-anchor', 'end').attr('fill', '#64748b').text('+25%');

    // Size Legend
    const sizeLegend = legendGroup.append('g').attr('transform', `translate(${width - margin.right - 180}, 22)`);
    sizeLegend.append('text')
      .attr('x', 0).attr('y', -3).attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#475569')
      .text('Sales Volume');

    const sampleCounts = [
      Math.round(maxCount * 0.1),
      Math.round(maxCount * 0.5),
      Math.round(maxCount),
    ];

    let xOffset = 0;
    sampleCounts.forEach((count) => {
      const r = radiusScale(count);
      sizeLegend.append('circle')
        .attr('cx', xOffset + r).attr('cy', 14).attr('r', r)
        .attr('fill', '#cbd5e1').attr('stroke', '#64748b').attr('stroke-width', 0.8);
      sizeLegend.append('text')
        .attr('x', xOffset + r).attr('y', 33).attr('text-anchor', 'middle')
        .attr('font-size', '10px').attr('fill', '#64748b')
        .text(count >= 1000 ? `${(count / 1000).toFixed(0)}k` : count);
      xOffset += r * 2 + 18;
    });

    const simulation = d3.forceSimulation(yearData)
      .alphaDecay(0.025);

    simulationRef.current = simulation;

    // Bubbles (hover visual highlighting removed; tooltip inspection preserved)
    const defaultStroke = '#334155';
    const defaultStrokeWidth = geoLevel === 'hscp' ? 1.2 : 0.6;

    const node = nodeGroup.selectAll('circle')
      .data(yearData, (d) => d.GeographyCode)
      .join('circle')
      .attr('r', (d) => radiusScale(d.Count))
      .attr('fill', (d) => (d.PctChange1Yr != null ? colorScale(d.PctChange1Yr) : '#94a3b8'))
      .attr('fill-opacity', 0.78)
      .attr('stroke', defaultStroke)
      .attr('stroke-width', defaultStrokeWidth)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        onHoverItem(d);
      })
      .on('mouseleave', () => {
        onHoverItem(null);
      });

    // Labels
    const labels = nodeGroup.selectAll('text.macro-label')
      .data(geoLevel === 'hscp' ? yearData : [])
      .join('text')
      .attr('class', 'macro-label pointer-events-none text-center')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('fill', '#1e293b')
      .attr('font-size', (d) => (radiusScale(d.Count) >= 40 ? '11px' : '9.5px'))
      .attr('font-weight', '700')
      .text((d) => {
        const r = radiusScale(d.Count);
        if (r < MIN_RADIUS_FOR_LABEL) return '';
        const name = d.GeographyName;
        return name.length > 16 && r < 40 ? '' : name;
      });

    simulation.on('tick', () => {
      node.attr('cx', (d) => (d.fx != null ? d.fx : d.x)).attr('cy', (d) => d.y);
      labels.attr('x', (d) => (d.fx != null ? d.fx : d.x)).attr('y', (d) => d.y);
    });

    applyLayoutForces(viewMode, false);

    return () => simulation.stop();
  }, [data, selectedYear, geoLevel, applyLayoutForces]);

  return (
    <div className="relative w-full border rounded-xl bg-white shadow-sm overflow-hidden min-h-[750px]">
      <svg
        ref={svgRef}
        className="w-full block select-none"
        style={{ minHeight: `${height}px` }}
      />
    </div>
  );
}