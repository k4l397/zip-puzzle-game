import React from "react";
import "./Path.css";

interface Position {
  x: number;
  y: number;
}

interface PathSVGProps {
  path: Position[];
  gridSize: number;
}

const PathSVG: React.FC<PathSVGProps> = ({ path, gridSize }) => {
  if (path.length < 1) return null;

  // SVG coordinate system: each cell + gap = one unit in our coordinate system
  // For a 4x4 grid, we have 4 cells with gaps, so viewBox should be 4x4
  const cellGap = 2; // Match CSS gap
  const cellSize =
    gridSize === 3 ? 70 : gridSize === 4 ? 60 : gridSize === 5 ? 50 : 45;
  const totalSize = gridSize * cellSize + (gridSize - 1) * cellGap;
  const viewBoxSize = totalSize;

  const generateSVGPath = (): string => {
    if (path.length < 2) return "";

    let pathData = "";
    const startX = path[0].x * (cellSize + cellGap) + cellSize / 2;
    const startY = path[0].y * (cellSize + cellGap) + cellSize / 2;
    pathData += `M ${startX} ${startY}`;

    for (let i = 1; i < path.length; i++) {
      const x = path[i].x * (cellSize + cellGap) + cellSize / 2;
      const y = path[i].y * (cellSize + cellGap) + cellSize / 2;
      pathData += ` L ${x} ${y}`;
    }

    return pathData;
  };

  const renderStartCap = () => {
    if (path.length === 0) return null;

    const x = path[0].x * (cellSize + cellGap) + cellSize / 2;
    const y = path[0].y * (cellSize + cellGap) + cellSize / 2;

    return (
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="url(#startGradient)"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={2}
        className="path-start-cap"
      />
    );
  };

  const renderEndCap = () => {
    if (path.length < 1) return null;

    const lastPos = path[path.length - 1];
    const x = lastPos.x * (cellSize + cellGap) + cellSize / 2;
    const y = lastPos.y * (cellSize + cellGap) + cellSize / 2;

    return (
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="url(#endGradient)"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={2}
        className="path-end-cap"
      >
        <animate
          attributeName="r"
          values="8;10;8"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    );
  };

  return (
    <svg
      className="path-svg"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: "calc(100% - 40px)",
        height: "calc(100% - 40px)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e53e3e" />
          <stop offset="100%" stopColor="#c53030" />
        </linearGradient>
        <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#48bb78" />
          <stop offset="100%" stopColor="#38a169" />
        </linearGradient>
        <linearGradient id="endGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ed8936" />
          <stop offset="100%" stopColor="#dd6b20" />
        </linearGradient>
      </defs>

      {/* Main path line */}
      {path.length >= 2 && (
        <path
          d={generateSVGPath()}
          stroke="url(#pathGradient)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="svg-path-line"
          filter="drop-shadow(0 2px 8px rgba(229, 62, 62, 0.3))"
        />
      )}

      {/* Start cap */}
      {renderStartCap()}

      {/* End cap */}
      {renderEndCap()}
    </svg>
  );
};

export default PathSVG;
