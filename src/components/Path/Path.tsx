import React from "react";
import "./Path.css";

interface Position {
  x: number;
  y: number;
}

interface PathProps {
  path: Position[];
  gridSize: number;
  cellSize: number;
}

const Path: React.FC<PathProps> = ({ path, cellSize }) => {
  if (path.length < 1) return null;

  const generatePathSegments = () => {
    const segments: React.JSX.Element[] = [];

    if (path.length < 2) return segments;

    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      const prev = i > 0 ? path[i - 1] : null;

      // Calculate positions in pixels relative to grid coordinate system
      // Each cell is cellSize + gap apart, positioned at cell center
      const cellGap = 2;
      const currentX = current.x * (cellSize + cellGap) + cellSize / 2;
      const currentY = current.y * (cellSize + cellGap) + cellSize / 2;
      const nextX = next.x * (cellSize + cellGap) + cellSize / 2;
      const nextY = next.y * (cellSize + cellGap) + cellSize / 2;

      // Determine direction of movement
      const deltaX = next.x - current.x;
      const deltaY = next.y - current.y;

      // Create segment key
      const segmentKey = `segment-${i}-${current.x}-${current.y}-${next.x}-${next.y}`;

      // Determine if this is a straight line or needs curves
      let pathElement: React.JSX.Element;

      if (deltaX !== 0 && deltaY === 0) {
        // Horizontal movement
        pathElement = (
          <div
            key={segmentKey}
            className="path-segment path-horizontal"
            style={{
              left: Math.min(currentX, nextX) - 6,
              top: currentY - 6,
              width: Math.abs(nextX - currentX) + 12,
              height: 12,
            }}
          />
        );
      } else if (deltaX === 0 && deltaY !== 0) {
        // Vertical movement
        pathElement = (
          <div
            key={segmentKey}
            className="path-segment path-vertical"
            style={{
              left: currentX - 6,
              top: Math.min(currentY, nextY) - 6,
              width: 12,
              height: Math.abs(nextY - currentY) + 12,
            }}
          />
        );
      } else {
        // This shouldn't happen in our orthogonal grid, but fallback
        pathElement = (
          <div
            key={segmentKey}
            className="path-segment path-diagonal"
            style={{
              left: currentX - 6,
              top: currentY - 6,
              width: 12,
              height: 12,
            }}
          />
        );
      }

      segments.push(pathElement);

      // Add corner curves when direction changes
      if (i > 0 && i < path.length - 1) {
        const prevDeltaX = current.x - prev!.x;
        const prevDeltaY = current.y - prev!.y;
        const nextDeltaX = next.x - current.x;
        const nextDeltaY = next.y - current.y;

        // Check if we need a corner piece
        if (
          (prevDeltaX !== nextDeltaX && prevDeltaX !== 0) ||
          (prevDeltaY !== nextDeltaY && prevDeltaY !== 0)
        ) {
          // Determine corner type
          let cornerClass = "path-corner";

          if (prevDeltaX > 0 && nextDeltaY > 0)
            cornerClass += " corner-right-down";
          else if (prevDeltaX > 0 && nextDeltaY < 0)
            cornerClass += " corner-right-up";
          else if (prevDeltaX < 0 && nextDeltaY > 0)
            cornerClass += " corner-left-down";
          else if (prevDeltaX < 0 && nextDeltaY < 0)
            cornerClass += " corner-left-up";
          else if (prevDeltaY > 0 && nextDeltaX > 0)
            cornerClass += " corner-down-right";
          else if (prevDeltaY > 0 && nextDeltaX < 0)
            cornerClass += " corner-down-left";
          else if (prevDeltaY < 0 && nextDeltaX > 0)
            cornerClass += " corner-up-right";
          else if (prevDeltaY < 0 && nextDeltaX < 0)
            cornerClass += " corner-up-left";

          const cornerElement = (
            <div
              key={`corner-${i}`}
              className={`path-segment ${cornerClass}`}
              style={{
                left: currentX - 8,
                top: currentY - 8,
                width: 16,
                height: 16,
              }}
            />
          );
          segments.push(cornerElement);
        }
      }
    }

    return segments;
  };

  // Add end caps for start and end of path
  const cellGap = 2;

  const startCap = path.length > 0 && (
    <div
      key="start-cap"
      className="path-segment path-start-cap"
      style={{
        left: path[0].x * (cellSize + cellGap) + cellSize / 2 - 8,
        top: path[0].y * (cellSize + cellGap) + cellSize / 2 - 8,
        width: 16,
        height: 16,
      }}
    />
  );

  const endCap = path.length > 1 && (
    <div
      key="end-cap"
      className="path-segment path-end-cap"
      style={{
        left: path[path.length - 1].x * (cellSize + cellGap) + cellSize / 2 - 8,
        top: path[path.length - 1].y * (cellSize + cellGap) + cellSize / 2 - 8,
        width: 16,
        height: 16,
      }}
    />
  );

  return (
    <div
      className="continuous-path"
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        pointerEvents: "none",
        width: "calc(100% - 40px)",
        height: "calc(100% - 40px)",
      }}
    >
      {generatePathSegments()}
      {startCap}
      {endCap}
    </div>
  );
};

export default Path;
