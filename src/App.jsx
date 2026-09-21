import React, { useState, useEffect, useMemo } from 'react';
import BubbleChart from './components/BubbleChart';

export default function App() {
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2023);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'scatter'
  const [geoLevel, setGeoLevel] = useState('zone'); // 'zone' | 'hscp'
  const [selectedHSCP, setSelectedHSCP] = useState('ALL');
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    fetch('./housing_processed.json')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load dataset:', err));
  }, []);

  const hscpList = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from(new Set(data.map((d) => d.HSCPName).filter(Boolean))).sort();
  }, [data]);

  // Aggregate intermediate zones up to HSCP level
  const aggregatedHSCPData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = {};
    data.forEach((d) => {
      const key = `${d.HSCPName}_${d.DateCode}`;
      if (!grouped[key]) {
        grouped[key] = {
          GeographyCode: d.HSCPName,
          GeographyName: d.HSCPName,
          HSCPName: d.HSCPName,
          DateCode: d.DateCode,
          Count: 0,
          totalVal: 0,
          PrevMean: null,
          PctChange1Yr: null,
        };
      }
      grouped[key].Count += d.Count || 0;
      grouped[key].totalVal += (d.Mean || 0) * (d.Count || 0);
    });

    const list = Object.values(grouped).map((g) => ({
      ...g,
      Mean: g.Count > 0 ? g.totalVal / g.Count : 0,
      Median: g.Count > 0 ? g.totalVal / g.Count : 0,
    }));

    list.sort((a, b) => a.DateCode - b.DateCode);
    const byHSCP = {};
    list.forEach((item) => {
      if (!byHSCP[item.HSCPName]) byHSCP[item.HSCPName] = [];
      byHSCP[item.HSCPName].push(item);
    });

    Object.values(byHSCP).forEach((series) => {
      for (let i = 1; i < series.length; i++) {
        series[i].PrevMean = series[i - 1].Mean;
        if (series[i].PrevMean > 0) {
          series[i].PctChange1Yr =
            ((series[i].Mean - series[i].PrevMean) / series[i].PrevMean) * 100;
        }
      }
    });

    return list;
  }, [data]);

  const activeDataset = useMemo(() => {
    if (geoLevel === 'hscp') return aggregatedHSCPData;
    if (selectedHSCP === 'ALL') return data;
    return data.filter((d) => d.HSCPName === selectedHSCP);
  }, [geoLevel, aggregatedHSCPData, data, selectedHSCP]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans text-gray-900">
      {/* Header */}
      <header className="border-b pb-6 mb-6">
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">
          Scottish Housing Sales & Price Dynamics (2004–2023)
        </h1>
        <p className="text-gray-600 text-lg max-w-3xl">
          An interactive force-directed exploration of Scottish housing volume and values, modeled after the New York Times budget proposal visualisations.
        </p>
      </header>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Data Hierarchy Switch */}
          <div className="inline-flex rounded-lg border bg-slate-100 p-1 shadow-inner text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => setGeoLevel('zone')}
              className={`px-3 py-1.5 rounded-md transition ${
                geoLevel === 'zone' ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intermediate Zones (~1,200)
            </button>
            <button
              onClick={() => setGeoLevel('hscp')}
              className={`px-3 py-1.5 rounded-md transition ${
                geoLevel === 'hscp' ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Larger Area (31 HSCPs)
            </button>
          </div>

          {/* Layout Modes */}
          <div className="inline-flex rounded-lg border bg-white p-1 shadow-sm text-sm font-medium">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-md transition ${
                viewMode === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Sales
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-3.5 py-1.5 rounded-md transition ${
                viewMode === 'scatter' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Price vs Growth (2D)
            </button>
          </div>

          {/* HSCP Dropdown Filter */}
          {geoLevel === 'zone' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">HSCP:</span>
              <select
                value={selectedHSCP}
                onChange={(e) => setSelectedHSCP(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[210px]"
              >
                <option value="ALL">All Scotland ({hscpList.length} Areas)</option>
                {hscpList.map((hscp) => (
                  <option key={hscp} value={hscp}>
                    {hscp}
                  </option>
                ))}
              </select>
              {selectedHSCP !== 'ALL' && (
                <button
                  onClick={() => setSelectedHSCP('ALL')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Year Slider */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Year:</span>
          <input
            type="range"
            min="2004"
            max="2023"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-36 cursor-pointer accent-blue-600"
          />
          <span className="font-mono font-bold text-lg text-blue-600">{selectedYear}</span>
        </div>
      </div>

      {/* Main Canvas Card & Hover Card */}
      <div className="relative">
        <BubbleChart
          data={activeDataset}
          selectedYear={selectedYear}
          viewMode={viewMode}
          geoLevel={geoLevel}
          onHoverItem={setHoveredItem}
        />

        {hoveredItem && (
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur shadow-xl border border-gray-200 rounded-lg p-4 w-72 pointer-events-none transition-all z-20">
            <h4 className="font-bold text-base border-b pb-1 mb-1 text-gray-800">
              {hoveredItem.GeographyName}
            </h4>
            {hoveredItem.HSCPName && geoLevel === 'zone' && (
              <div className="text-xs text-blue-600 font-semibold mb-2">
                HSCP: {hoveredItem.HSCPName}
              </div>
            )}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Annual Sales:</span>
                <span className="font-mono font-semibold">{hoveredItem.Count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mean Price:</span>
                <span className="font-mono font-semibold">£{Math.round(hoveredItem.Mean).toLocaleString()}</span>
              </div>
              {hoveredItem.Median && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Median Price:</span>
                  <span className="font-mono font-semibold">£{Math.round(hoveredItem.Median).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">1-Yr Growth:</span>
                <span
                  className={`font-mono font-semibold ${
                    hoveredItem.PctChange1Yr >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {hoveredItem.PctChange1Yr != null
                    ? `${hoveredItem.PctChange1Yr.toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <BubbleChart
          data={activeDataset}
          selectedYear={selectedYear}
          viewMode={viewMode}
          geoLevel={geoLevel}
          onHoverItem={setHoveredItem}
        />
      </div>
    </div>
  );
}