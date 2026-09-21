import { useState } from "react";
import { LineChart } from "./LineChart";

const BUTTONS_HEIGHT = 50;

export const data = [
    { x: 1, melanie: 90, yan: 34 },
    { x: 2, melanie: 12, yan: 24 },
    { x: 3, melanie: 34, yan: 14 },
    { x: 4, melanie: 53, yan: 45 },
    { x: 5, melanie: 52, yan: 45 },
    { x: 6, melanie: 9, yan: 67 },
    { x: 7, melanie: 18, yan: 67 },
    { x: 8, melanie: 78, yan: 87 },
    { x: 9, melanie: 28, yan: 87 },
    { x: 10, melanie: 34, yan: 45 },
]

type LineChartDatasetTransitionProps = {
  width: number;
  height: number;
};

const buttonStyle = {
  border: "1px solid #9a6fb0",
  borderRadius: "3px",
  padding: "4px 8px",
  margin: "10px 2px",
  fontSize: 14,
  color: "#9a6fb0",
  opacity: 0.7,
};

export const LineChartDatasetTransition = ({
  width,
  height,
}: LineChartDatasetTransitionProps) => {
  const [selectedGroup, setSelectedGroup] = useState<"melanie" | "yan">(
    "melanie"
  );

  return (
    <div>
      <div style={{ height: BUTTONS_HEIGHT }}>
        <button style={buttonStyle} onClick={() => setSelectedGroup("melanie")}>
          Melanie
        </button>
        <button style={buttonStyle} onClick={() => setSelectedGroup("yan")}>
          Yan
        </button>
      </div>
      <LineChart
        width={width}
        height={height - BUTTONS_HEIGHT}
        data={data}
        selectedGroup={selectedGroup}
      />
    </div>
  );
};