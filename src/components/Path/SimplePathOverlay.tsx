import React, { useEffect, useState, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface SimplePathOverlayProps {
  path: Position[];
  gridSize: number;
}

interface CellInfo {
  gridX: number;
  gridY: number;
  centerX: number;
  centerY: number;
}

const SimplePathOverlay: React.FC<SimplePathOverlayProps> = ({
  path,
  gridSize,
}) => {
  const [cellPositions, setCellPositions] = useState<CellInfo[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Measure actual cell positions from the DOM
  useEffect(() => {
    const measureCells = () => {
      const cells = document.querySelectorAll(".grid-cell-wrapper");
      const positions: CellInfo[] = [];

      cells.forEach((cell) => {
        const rect = cell.getBoundingClientRect();
        const dataX = parseInt(cell.getAttribute("data-x") || "0");
        const dataY = parseInt(cell.getAttribute("data-y") || "0");

        // Get the grid container position for relative positioning
        const gridContainer = document.querySelector(".grid");
        const gridRect = gridContainer?.getBoundingClientRect();

        if (gridRect) {
          // Calculate position relative to grid container
          const centerX = rect.left + rect.width / 2 - gridRect.left;
          const centerY = rect.top + rect.height / 2 - gridRect.top;

          positions.push({
            gridX: dataX,
            gridY: dataY,
            centerX,
            centerY,
          });
        }
      });

      setCellPositions(positions);
    };

    // Measure cells after a short delay to ensure DOM is rendered
    const timeout = setTimeout(measureCells, 100);

    // Re-measure on window resize
    const handleResize = () => {
      setTimeout(measureCells, 100);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [gridSize, path.length]); // Re-measure when grid size changes

  // Find cell center position by grid coordinates
  const getCellCenter = (gridX: number, gridY: number) => {
    const cell = cellPositions.find(
      (c) => c.gridX === gridX && c.gridY === gridY,
    );
    return cell ? { x: cell.centerX, y: cell.centerY } : { x: 0, y: 0 };
  };

  // Generate path segments
  const renderPathSegments = () => {
    if (path.length < 2 || cellPositions.length === 0) return null;

    const segments = [];

    for (let i = 0; i < path.length - 1; i++) {
      const current = getCellCenter(path[i].x, path[i].y);
      const next = getCellCenter(path[i + 1].x, path[i + 1].y);

      // Calculate segment position and dimensions
      const deltaX = next.x - current.x;
      const deltaY = next.y - current.y;
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      segments.push(
        <div
          key={`segment-${i}`}
          className="path-segment"
          style={{
            position: "absolute",
            left: current.x - 6,
            top: current.y - 6,
            width: length + 12,
            height: 12,
            background: "linear-gradient(135deg, #e53e3e, #c53030)",
            borderRadius: "6px",
            transformOrigin: "6px 6px",
            transform: `rotate(${angle}deg)`,
            boxShadow: "0 2px 8px rgba(229, 62, 62, 0.3)",
            zIndex: 1,
          }}
        />,
      );
    }

    return segments;
  };

  // Render start cap
  const renderStartCap = () => {
    if (path.length === 0 || cellPositions.length === 0) return null;

    const startPos = getCellCenter(path[0].x, path[0].y);

    return (
      <div
        key="start-cap"
        className="path-start-cap"
        style={{
          position: "absolute",
          left: startPos.x - 8,
          top: startPos.y - 8,
          width: 16,
          height: 16,
          background: "linear-gradient(135deg, #48bb78, #38a169)",
          borderRadius: "50%",
          border: "2px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 2px 8px rgba(72, 187, 120, 0.4)",
          zIndex: 2,
        }}
      />
    );
  };

  // Render end cap
  const renderEndCap = () => {
    if (path.length < 2 || cellPositions.length === 0) return null;

    const endPos = getCellCenter(
      path[path.length - 1].x,
      path[path.length - 1].y,
    );

    return (
      <div
        key="end-cap"
        className="path-end-cap"
        style={{
          position: "absolute",
          left: endPos.x - 8,
          top: endPos.y - 8,
          width: 16,
          height: 16,
          background: "linear-gradient(135deg, #ed8936, #dd6b20)",
          borderRadius: "50%",
          border: "2px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 2px 8px rgba(237, 137, 54, 0.4)",
          animation: "endCapPulse 2s ease-in-out infinite",
          zIndex: 2,
        }}
      />
    );
  };

  if (path.length === 0) return null;

  return (
    <div
      ref={overlayRef}
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

export default SimplePathOverlay;
