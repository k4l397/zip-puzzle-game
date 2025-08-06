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
    if (size >= 4) {
      newGrid[0][0].dot = 1;
      newGrid[1][2].dot = 2;
      newGrid[2][1].dot = 3;
      newGrid[3][3].dot = 4;
    } else if (size === 3) {
      newGrid[0][0].dot = 1;
      newGrid[1][1].dot = 2;
      newGrid[2][2].dot = 3;
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

      // Start path from dot 1 or continue existing path
      const cell = grid[position.y][position.x];
      if (cell.dot === 1 || currentPath.length > 0) {
        if (currentPath.length === 0 && cell.dot === 1) {
          setCurrentPath([position]);
        }
      }
    },
    [grid, currentPath, isComplete, gameStarted, onGameStart],
  );

  const handleMouseEnter = useCallback(
    (position: Position) => {
      if (!isDragging || isComplete) return;

      // Simple path extension logic - will be enhanced later
      const lastPosition = currentPath[currentPath.length - 1];
      if (lastPosition) {
        const distance =
          Math.abs(position.x - lastPosition.x) +
          Math.abs(position.y - lastPosition.y);
        if (distance === 1) {
          // Adjacent cell
          setCurrentPath((prev) => [...prev, position]);
        }
      }
    },
    [isDragging, currentPath, isComplete],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Check win condition - placeholder logic
    if (currentPath.length >= 4) {
      onGameComplete();
    }
  }, [currentPath.length, onGameComplete]);

  // Update grid with current path
  useEffect(() => {
    const newGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isPath: currentPath.some(
          (pos) => pos.x === cell.position.x && pos.y === cell.position.y,
        ),
      })),
    );
    setGrid(newGrid);
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
            >
              <Cell
                position={cell.position}
                hasPipe={cell.hasPipe}
                isPath={cell.isPath}
              />
              {cell.dot && <Dot number={cell.dot} position={cell.position} />}
            </div>
          )),
        )}
      </div>
    </div>
  );
};

export default Grid;
