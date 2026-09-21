import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 40, bottom: 50, left: 70 };

type Point = { x: number; y: number | null };
type ChartDataset = {
  years: number[];
  seriesMap: { [key: string]: Point[] };
  zones: string[];
  regionName: string;
};

type MultiLineChartProps = {
  width: number;
  height: number;
  data: ChartDataset;
  selectedZones: string[];
  onToggleZone: (zoneName: string) => void;
  onClearZones: () => void;
};

const HIGHLIGHT_COLORS = [
  "#d97706", // Amber
  "#9333ea", // Purple
  "#0d9488", // Teal
  "#e11d48", // Rose
  "#4f46e5", // Indigo
  "#2563eb", // Blue
  "#db2777", // Pink
];

export const MultiLineChart = ({
  width,
  height,
  data,
  selectedZones,
  onToggleZone,
  onClearZones,
}: MultiLineChartProps) => {
  const axesRef = useRef<SVGGElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const { years, seriesMap, zones, regionName } = data;

  const filteredZones = useMemo(() => {
    return zones.filter((z) =>
      z.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zones, searchQuery]);

  const yScale = useMemo(() => {
    if (!seriesMap || Object.keys(seriesMap).length === 0) {
      return d3.scaleLinear().domain([0, 500000]).range([boundsHeight, 0]);
    }
    const allValues = Object.values(seriesMap)
      .flat()
      .map((d) => d.y)
      .filter((v): v is number => v !== null && !isNaN(v));

    const maxVal = d3.max(allValues) || 400000;
    return d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([boundsHeight, 0])
      .nice();
  }, [seriesMap, boundsHeight]);

  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(years) || 2004, d3.max(years) || 2023])
      .range([0, boundsWidth]);
  }, [years, boundsWidth]);

  useEffect(() => {
    if (!axesRef.current) return;
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();

    const xAxisGenerator = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    svgElement
      .append("g")
      .attr("transform", `translate(0, ${boundsHeight})`)
      .call(xAxisGenerator)
      .selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "11px");

    const yAxisGenerator = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => `£${Number(d) / 1000}k`);
    svgElement
      .append("g")
      .call(yAxisGenerator)
      .selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "11px");

    svgElement
      .append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yScale.ticks(6))
      .join("line")
      .attr("x1", 0)
      .attr("x2", boundsWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#f1f5f9")
      .attr("stroke-width", 1);
  }, [xScale, yScale, boundsHeight, boundsWidth]);

  const lineGenerator = d3
    .line<Point>()
    .defined((d) => d.y !== null)
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y!));

  const scotlandKey = "Scotland Average";
  const regionalKey = `${regionName} Average`;

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-800">
            Intermediate Zones & Averages: {regionName}
          </h3>
          <p className="text-xs text-gray-500">
            Click lines on the chart or use the selector list below to compare specific zones.
          </p>
        </div>

        {/* Dropdown Selector Button Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border flex items-center gap-2 transition"
          >
            <span>Select Zones ({selectedZones.length}/{zones.length})</span>
            <span className="text-slate-400">▼</span>
          </button>

          {/* Searchable Checkbox Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-2xl p-3 z-30">
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search zones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {filteredZones.map((zone) => {
                  const isChecked = selectedZones.includes(zone);
                  return (
                    <label
                      key={zone}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleZone(zone)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{zone}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between items-center text-xs">
                <button
                  onClick={onClearZones}
                  className="text-rose-600 font-semibold hover:underline"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Zones Active Pills / Chips */}
      {selectedZones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-50 p-2.5 rounded-lg border">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Highlights:</span>
          {selectedZones.map((zone, idx) => {
            const color = HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length];
            return (
              <span
                key={zone}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {zone}
                <button
                  onClick={() => onToggleZone(zone)}
                  className="hover:bg-black/20 rounded-full w-4 h-4 inline-flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}>
          {/* 1. Unselected zones */}
          {zones
            .filter((z) => !selectedZones.includes(z))
            .map((zoneName) => {
              const points = seriesMap[zoneName] || [];
              return (
                <path
                  key={zoneName}
                  d={lineGenerator(points) || ""}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  onClick={() => onToggleZone(zoneName)}
                  className="hover:stroke-blue-500 hover:stroke-2 hover:opacity-100 transition-all cursor-pointer"
                >
                  <title>{zoneName} (Click to select)</title>
                </path>
              );
            })}

          {/* 2. Selected zones */}
          {selectedZones.map((zoneName, idx) => {
            const points = seriesMap[zoneName] || [];
            const color = HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length];
            return (
              <path
                key={`selected-${zoneName}`}
                d={lineGenerator(points) || ""}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeOpacity={0.95}
                onClick={() => onToggleZone(zoneName)}
                className="cursor-pointer filter drop-shadow-sm transition-all"
              >
                <title>{zoneName} (Click to deselect)</title>
              </path>
            );
          })}

          {/* 3. Scotland National Average */}
          {seriesMap[scotlandKey] && (
            <path
              d={lineGenerator(seriesMap[scotlandKey]) || ""}
              fill="none"
              stroke="#334155"
              strokeWidth={2}
              strokeDasharray="5,5"
              pointerEvents="none"
            />
          )}

          {/* 4. Regional HSCP Average */}
          {seriesMap[regionalKey] && (
            <path
              d={lineGenerator(seriesMap[regionalKey]) || ""}
              fill="none"
              stroke="#2563eb"
              strokeWidth={3}
              pointerEvents="none"
            />
          )}
        </g>
        <g
          ref={axesRef}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        />
      </svg>
    </div>
  );
};