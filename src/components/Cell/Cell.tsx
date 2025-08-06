import React from "react";
import "./Cell.css";

interface Position {
  x: number;
  y: number;
}

interface CellProps {
  position: Position;
  hasDot?: boolean;
}

const Cell: React.FC<CellProps> = ({ position, hasDot = false }) => {
  const cellClass = ["cell", hasDot && "cell--has-dot"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClass} data-x={position.x} data-y={position.y}></div>
  );
};

export default Cell;
