import React, { useState, useCallback, useEffect } from "react";
import Cell from "../Cell/Cell";
import Dot from "../Dot/Dot";
import "./Grid.css";

export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  position: Position;
  hasPipe: boolean;
  isPath: boolean;
  dot?: number; // Dot number if this cell contains a dot
}

interface GridProps {
  size: number;
  onGameStart: () => void;
  onGameComplete: () => void;
  isComplete: boolean;
}

const Grid: React.FC<GridProps> = ({
  size,
  onGameStart,
  onGameComplete,
  isComplete,
}) => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize grid with sample puzzle for now
  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = Array(size)
      .fill(null)
      .map((_, y) =>
        Array(size)
          .fill(null)
          .map((_, x) => ({
            position: { x, y },
            hasPipe: false,
            isPath: false,
          })),
      );

    // Add sample dots for testing - this will be replaced by puzzle generation later
    if (size >= 6) {
      // 6x6 puzzle with 6 dots
      newGrid[0][1].dot = 1;
      newGrid[2][0].dot = 2;
      newGrid[1][3].dot = 3;
      newGrid[4][2].dot = 4;
      newGrid[3][5].dot = 5;
      newGrid[5][4].dot = 6;
    } else if (size === 5) {
      // 5x5 puzzle with 5 dots
      newGrid[0][0].dot = 1;
      newGrid[2][1].dot = 2;
      newGrid[1][4].dot = 3;
      newGrid[4][3].dot = 4;
      newGrid[3][2].dot = 5;
    } else if (size === 4) {
      // 4x4 puzzle with 4 dots
      newGrid[0][1].dot = 1;
      newGrid[1][3].dot = 2;
      newGrid[3][2].dot = 3;
      newGrid[2][0].dot = 4;
    } else if (size === 3) {
      // 3x3 puzzle with 3 dots
      newGrid[0][0].dot = 1;
      newGrid[1][2].dot = 2;
      newGrid[2][1].dot = 3;
    }

    setGrid(newGrid);
    setCurrentPath([]);
    setGameStarted(false);
  }, [size]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleMouseDown = useCallback(
    (position: Position) => {
      if (isComplete) return;

      if (!gameStarted) {
        onGameStart();
        setGameStarted(true);
      }

      setIsDragging(true);

      // Start path from dot 1
      const cell = grid[position.y][position.x];
      if (cell.dot === 1) {
        setCurrentPath([position]);
      } else if (currentPath.length > 0) {
        // Check if clicking on existing path to potentially reverse
        const pathIndex = currentPath.findIndex(
          (pathPos) => pathPos.x === position.x && pathPos.y === position.y,
        );
        if (pathIndex !== -1) {
          // Reverse path to this point
          setCurrentPath(currentPath.slice(0, pathIndex + 1));
        }
      }
    },
    [grid, currentPath, isComplete, gameStarted, onGameStart],
  );

  const handleMouseEnter = useCallback(
    (position: Position) => {
      if (!isDragging || isComplete || currentPath.length === 0) return;

      const lastPosition = currentPath[currentPath.length - 1];
      if (lastPosition) {
        // Check if adjacent (orthogonal movement only)
        const deltaX = Math.abs(position.x - lastPosition.x);
        const deltaY = Math.abs(position.y - lastPosition.y);
        const isAdjacent =
          (deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1);

        if (isAdjacent) {
          // Check if this position is already in the path
          const existingIndex = currentPath.findIndex(
            (pathPos) => pathPos.x === position.x && pathPos.y === position.y,
          );

          if (existingIndex === -1) {
            // New position, add to path
            setCurrentPath((prev) => [...prev, position]);
          } else if (existingIndex === currentPath.length - 2) {
            // Moving back to previous position, reverse one step
            setCurrentPath((prev) => prev.slice(0, -1));
          }
        }
      }
    },
    [isDragging, currentPath, isComplete],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Check win condition
    if (currentPath.length > 0) {
      // Get all dots from the grid
      const dots: { position: Position; number: number }[] = [];
      grid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.dot) {
            dots.push({ position: cell.position, number: cell.dot });
          }
        });
      });

      // Sort dots by number
      dots.sort((a, b) => a.number - b.number);

      // Check if path visits all dots in correct order
      let isValidPath = true;
      let currentDotIndex = 0;

      for (const pathPos of currentPath) {
        const dotAtPosition = dots.find(
          (dot) => dot.position.x === pathPos.x && dot.position.y === pathPos.y,
        );

        if (dotAtPosition) {
          if (dotAtPosition.number !== currentDotIndex + 1) {
            isValidPath = false;
            break;
          }
          currentDotIndex++;
        }
      }

      // Check if all dots are visited and grid is fully covered
      const allDotsVisited = currentDotIndex === dots.length;
      const gridFullyCovered = currentPath.length === size * size;

      if (isValidPath && allDotsVisited && gridFullyCovered) {
        onGameComplete();
      }
    }
  }, [currentPath, grid, size, onGameComplete]);

  // Update grid with current path
  useEffect(() => {
    // Only update if grid is not empty (avoids overriding initialization)
    if (grid.length > 0) {
      const newGrid = grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isPath: currentPath.some(
            (pos) => pos.x === cell.position.x && pos.y === cell.position.y,
          ),
        })),
      );
      setGrid(newGrid);
    }
  }, [currentPath]); // Don't include grid in deps to avoid infinite loop

  return (
    <div className="grid-container">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="grid-cell-wrapper"
              onMouseDown={() => handleMouseDown(cell.position)}
              onMouseEnter={() => handleMouseEnter(cell.position)}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => {
                e.preventDefault();
                handleMouseDown(cell.position);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(
                  touch.clientX,
                  touch.clientY,
                );
                const wrapper = element?.closest(".grid-cell-wrapper");
                if (wrapper) {
                  const x = parseInt(wrapper.getAttribute("data-x") || "0");
                  const y = parseInt(wrapper.getAttribute("data-y") || "0");
                  handleMouseEnter({ x, y });
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleMouseUp();
              }}
              data-x={x}
              data-y={y}
            >
              <Cell
                position={cell.position}
                hasPipe={cell.hasPipe}
                isPath={cell.isPath}
                isStart={
                  currentPath.length > 0 &&
                  currentPath[0].x === cell.position.x &&
                  currentPath[0].y === cell.position.y
                }
                isEnd={
                  currentPath.length > 0 &&
                  currentPath[currentPath.length - 1].x === cell.position.x &&
                  currentPath[currentPath.length - 1].y === cell.position.y
                }
                pathIndex={currentPath.findIndex(
                  (pos) =>
                    pos.x === cell.position.x && pos.y === cell.position.y,
                )}
              />
              {cell.dot && (
                <Dot
                  number={cell.dot}
                  position={cell.position}
                  isConnected={currentPath.some(
                    (pos) =>
                      pos.x === cell.position.x && pos.y === cell.position.y,
                  )}
                  isActive={
                    currentPath.length > 0 &&
                    currentPath[currentPath.length - 1].x === cell.position.x &&
                    currentPath[currentPath.length - 1].y === cell.position.y &&
                    isDragging
                  }
                  isNext={(() => {
                    // Find all dots and sort by number
                    const dots: { position: Position; number: number }[] = [];
                    grid.forEach((row) => {
                      row.forEach((gridCell) => {
                        if (gridCell.dot) {
                          dots.push({
                            position: gridCell.position,
                            number: gridCell.dot,
                          });
                        }
                      });
                    });
                    dots.sort((a, b) => a.number - b.number);

                    // Find which dots are already connected
                    let connectedDots = 0;
                    for (const pathPos of currentPath) {
                      const dotAtPath = dots.find(
                        (dot) =>
                          dot.position.x === pathPos.x &&
                          dot.position.y === pathPos.y,
                      );
                      if (dotAtPath) {
                        connectedDots = Math.max(
                          connectedDots,
                          dotAtPath.number,
                        );
                      }
                    }

                    // This dot is next if it's the next number after connected dots
                    return cell.dot === connectedDots + 1;
                  })()}
                />
              )}
            </div>
          )),
        )}
      </div>
    </div>
  );
};

export default Grid;
