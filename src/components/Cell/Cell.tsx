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
}

const Cell: React.FC<CellProps> = ({
  position,
  hasPipe,
  isPath,
  isStart = false,
  isEnd = false,
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
      {isPath && <div className="cell-pipe" />}
    </div>
  );
};

export default Cell;
