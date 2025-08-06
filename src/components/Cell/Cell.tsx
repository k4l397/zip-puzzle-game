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
  isStart?: boolean;
  isEnd?: boolean;
  pathIndex?: number;
}

const Cell: React.FC<CellProps> = ({
  position,
  hasPipe,
  isPath,
  isStart = false,
  isEnd = false,
  pathIndex,
}) => {
  const cellClass = [
    "cell",
    hasPipe && "cell--has-pipe",
    isPath && "cell--path",
    isStart && "cell--start",
    isEnd && "cell--end",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClass} data-x={position.x} data-y={position.y}>
      {isPath && (
        <div className="cell-path-indicator">
          {pathIndex !== undefined && pathIndex < 10 && (
            <span className="path-number">{pathIndex + 1}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Cell;
