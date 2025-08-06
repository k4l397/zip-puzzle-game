import React from "react";
import "./Cell.css";

interface Position {
  x: number;
  y: number;
}

interface CellProps {
  position: Position;
  hasPipe: boolean;
  isPath: boolean;
}

const Cell: React.FC<CellProps> = ({ position, hasPipe, isPath }) => {
  const cellClass = [
    "cell",
    hasPipe && "cell--has-pipe",
    isPath && "cell--path",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClass} data-x={position.x} data-y={position.y}>
      {isPath && <div className="cell-path-indicator" />}
    </div>
  );
};

export default Cell;
