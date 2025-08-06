import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Puzzle, Position, DragState } from '../../types/game';
import { GAME_CONFIG, CANVAS_CONFIG } from '../../constants/config';
import { PathValidator } from '../../utils/pathValidator';
import './Grid.css';

interface GridProps {
  puzzle: Puzzle;
  currentPath: Position[];
  onPathUpdate: (path: Position[]) => void;
  onComplete: () => void;
  disabled?: boolean;
}

const Grid: React.FC<GridProps> = ({
  puzzle,
  currentPath,
  onPathUpdate,
  onComplete,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: null,
    currentPosition: null,
    path: [],
  });
  const [validator, setValidator] = useState(() => new PathValidator(puzzle));

  const getCanvasSize = useCallback(() => {
    const totalSize =
      puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2;
    return { width: totalSize, height: totalSize };
  }, [puzzle.gridSize]);

  const getGridPosition = useCallback(
    (x: number, y: number): Position | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const canvasX = x - rect.left;
      const canvasY = y - rect.top;

      // Adjust for padding
      const gridX = canvasX - CANVAS_CONFIG.padding;
      const gridY = canvasY - CANVAS_CONFIG.padding;

      // Convert to grid coordinates
      const cellX = Math.round(gridX / GAME_CONFIG.cellSize);
      const cellY = Math.round(gridY / GAME_CONFIG.cellSize);

      // Check bounds
      if (
        cellX < 0 ||
        cellX >= puzzle.gridSize ||
        cellY < 0 ||
        cellY >= puzzle.gridSize
      ) {
        return null;
      }

      return { x: cellX, y: cellY };
    },
    [puzzle.gridSize]
  );

  const getCanvasPosition = useCallback((gridPos: Position): Position => {
    return {
      x: gridPos.x * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding,
      y: gridPos.y * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding,
    };
  }, []);

  const isValidMove = useCallback(
    (from: Position, to: Position): boolean => {
      return validator.isValidMove(from, to);
    },
    [validator]
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = getCanvasSize();

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set grid style
      ctx.strokeStyle = GAME_CONFIG.colors.grid;
      ctx.lineWidth = CANVAS_CONFIG.gridLineWidth;

      // Draw vertical lines
      for (let i = 0; i <= puzzle.gridSize; i++) {
        const x = i * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding;
        ctx.beginPath();
        ctx.moveTo(x, CANVAS_CONFIG.padding);
        ctx.lineTo(x, height - CANVAS_CONFIG.padding);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = 0; i <= puzzle.gridSize; i++) {
        const y = i * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding;
        ctx.beginPath();
        ctx.moveTo(CANVAS_CONFIG.padding, y);
        ctx.lineTo(width - CANVAS_CONFIG.padding, y);
        ctx.stroke();
      }
    },
    [puzzle.gridSize, getCanvasSize]
  );

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D, path: Position[]) => {
      if (path.length < 2) return;

      ctx.strokeStyle = GAME_CONFIG.colors.pipe;
      ctx.lineWidth = GAME_CONFIG.pipeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const startPos = getCanvasPosition(path[0]);
      ctx.moveTo(startPos.x, startPos.y);

      for (let i = 1; i < path.length; i++) {
        const pos = getCanvasPosition(path[i]);
        ctx.lineTo(pos.x, pos.y);
      }

      ctx.stroke();
    },
    [getCanvasPosition]
  );

  const drawDots = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      puzzle.dots.forEach(dot => {
        const pos = getCanvasPosition(dot.position);

        // Draw dot circle
        ctx.fillStyle = GAME_CONFIG.colors.dot;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, GAME_CONFIG.dotRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw dot border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = CANVAS_CONFIG.dotBorderWidth;
        ctx.stroke();

        // Draw dot number
        ctx.fillStyle = GAME_CONFIG.colors.dotText;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dot.number.toString(), pos.x, pos.y);
      });
    },
    [puzzle.dots, getCanvasPosition]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx);
    drawPath(ctx, currentPath);
    drawDots(ctx);
  }, [drawGrid, drawPath, drawDots, currentPath]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;

      const position = getGridPosition(event.clientX, event.clientY);
      if (!position) return;

      // Check if starting from a dot
      const startDot = puzzle.dots.find(
        dot => dot.position.x === position.x && dot.position.y === position.y
      );

      if (startDot && startDot.number === 1) {
        setDragState({
          isDragging: true,
          startPosition: position,
          currentPosition: position,
          path: [position],
        });
        onPathUpdate([position]);
      }
    },
    [disabled, getGridPosition, puzzle.dots, onPathUpdate]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragState.isDragging || disabled) return;

      const position = getGridPosition(event.clientX, event.clientY);
      if (!position) return;

      // Check if this is a new position
      const lastPosition = dragState.path[dragState.path.length - 1];
      if (position.x === lastPosition.x && position.y === lastPosition.y)
        return;

      // Check if it's a valid move
      if (!isValidMove(lastPosition, position)) return;

      // Check if we're going backwards (allow undo)
      const pathIndex = dragState.path.findIndex(
        p => p.x === position.x && p.y === position.y
      );
      if (pathIndex !== -1) {
        // Going backwards - trim path
        const newPath = dragState.path.slice(0, pathIndex + 1);
        setDragState(prev => ({
          ...prev,
          currentPosition: position,
          path: newPath,
        }));
        onPathUpdate(newPath);
      } else {
        // Going forward - add to path
        const newPath = [...dragState.path, position];
        setDragState(prev => ({
          ...prev,
          currentPosition: position,
          path: newPath,
        }));
        onPathUpdate(newPath);
      }
    },
    [dragState, disabled, getGridPosition, isValidMove, onPathUpdate]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;

    setDragState({
      isDragging: false,
      startPosition: null,
      currentPosition: null,
      path: [],
    });

    // Check for completion using validator
    const validation = validator.validateSolution(currentPath);
    if (validation.isValid && validation.isComplete) {
      onComplete();
    }
  }, [dragState.isDragging, currentPath, validator, onComplete]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent);
    },
    [handleMouseDown]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent);
    },
    [handleMouseMove]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      handleMouseUp();
    },
    [handleMouseUp]
  );

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    setValidator(new PathValidator(puzzle));
  }, [puzzle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;

    // Set up high DPI display support
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }

    render();
  }, [getCanvasSize, render]);

  const { width, height } = getCanvasSize();

  return (
    <div className="grid-container">
      <canvas
        ref={canvasRef}
        className={`game-canvas ${disabled ? 'disabled' : ''}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default Grid;
