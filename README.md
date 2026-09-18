# Scottish Housing Sales & Price Dynamics Visualisation

An interactive D3.js force-directed bubble visualization built with React, Redux Toolkit, and Tailwind CSS. The design and transitions are inspired by the [NYT 2013 Budget Proposal Graphic](https://archive.nytimes.com/www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html).

---

## Features

- **Dynamic Physics Simulation (`d3-force`)**: Smooth animated transitions between unified cluster and split distributions.
- **Multiple Visual Layouts**:
  - **All Sales**: Single packed cluster highlighting volume distribution.
  - **1-Year Price Change**: Bubbles positioned along a linear growth axis from decline to expansion.
  - **Average Price**: Bubbles separated on a logarithmic price scale.
- **Dimensional Visual Encoding**:
  - Bubble **area** is proportional to transaction volume (`Count`).
  - Bubble **color** represents the 1-year price change using a diverging color scale.
- **Interactive Tooltips**: Hover over intermediate zones to inspect mean price, median price, volume, and percentage growth.
- **Timeline Scrubbing**: Explore annual Scottish market trends from 2004 to 2023.

---

## File Structure

```text
├── data/
│   ├── housing_sales_prices.csv      # Raw dataset (~800k rows)
|   └── intermeditate_code.csv        # Mapping intermediate areas to larger areas
├── scripts/
│   └── preprocess.py                 # Aggregates raw CSV into housing_processed.json
├── public/
│   └── housing_processed.json        # Static JSON loaded by the web app
├── src/
│   ├── components/
│   │   └── BubbleChart.jsx           # D3 force simulation component
│   ├── App.jsx                       # Navigation, year slider, layout switcher
│   ├── main.jsx                      # App entry point with Redux Provider
│   └── index.css                     # Tailwind CSS styles
├── package.json
└── README.md