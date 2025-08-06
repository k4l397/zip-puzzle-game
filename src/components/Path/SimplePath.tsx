import React from "react";
import "./Path.css";

interface Position {
  x: number;
  y: number;
}

interface SimplePathProps {
  path: Position[];
  gridSize: number;
}

const SimplePath: React.FC<SimplePathProps> = ({ path, gridSize }) => {
  if (path.length < 1) return null;

  // Calculate percentage-based positions for perfect grid alignment
  const getPositionPercent = (gridPos: number, gridSize: number): number => {
    // Each cell occupies (100 / gridSize)% of the grid
    // Cell center is at position + (cellWidth / 2)
    const cellWidth = 100 / gridSize;
    return gridPos * cellWidth + cellWidth / 2;
  };

  const renderStartCap = () => {
    if (path.length === 0) return null;

    const x = getPositionPercent(path[0].x, gridSize);
    const y = getPositionPercent(path[0].y, gridSize);

    return (
      <div
        key="start-cap"
        className="simple-path-cap simple-path-start"
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  };

  const renderEndCap = () => {
    if (path.length < 1) return null;

    const lastPos = path[path.length - 1];
    const x = getPositionPercent(lastPos.x, gridSize);
    const y = getPositionPercent(lastPos.y, gridSize);

    return (
      <div
        key="end-cap"
        className="simple-path-cap simple-path-end"
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  };

  const renderPathSegments = () => {
    if (path.length < 2) return null;

    const segments = [];

    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      const currentX = getPositionPercent(current.x, gridSize);
      const currentY = getPositionPercent(current.y, gridSize);
      const nextX = getPositionPercent(next.x, gridSize);
      const nextY = getPositionPercent(next.y, gridSize);

      // Calculate segment position and dimensions
      const isHorizontal = current.y === next.y;
      const isVertical = current.x === next.x;

      if (isHorizontal) {
        // Horizontal line
        const left = Math.min(currentX, nextX);
        const width = Math.abs(nextX - currentX);

        segments.push(
          <div
            key={`segment-${i}`}
            className="simple-path-segment simple-path-horizontal"
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${currentY}%`,
              width: `${width}%`,
              height: "12px",
              transform: "translateY(-50%)",
            }}
          />
        );
      } else if (isVertical) {
        // Vertical line
        const top = Math.min(currentY, nextY);
        const height = Math.abs(nextY - currentY);

        segments.push(
          <div
            key={`segment-${i}`}
            className="simple-path-segment simple-path-vertical"
            style={{
              position: "absolute",
              left: `${currentX}%`,
              top: `${top}%`,
              width: "12px",
              height: `${height}%`,
              transform: "translateX(-50%)",
            }}
          />
        );
      }
    }

    return segments;
  };

  return (
    <div
      className="simple-path-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {renderPathSegments()}
      {renderStartCap()}
      {renderEndCap()}
    </div>
  );
};

export default SimplePath;
