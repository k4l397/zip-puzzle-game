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
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);

  const getCanvasSize = useCallback(() => {
    const baseTotalSize =
      puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2;

    // Calculate maximum size that fits in viewport with margins
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = Math.min(viewportWidth - 32, baseTotalSize); // 16px margin on each side
    const maxHeight = Math.min(viewportHeight - 200, baseTotalSize); // Reserve space for header/controls

    // Use the smaller dimension to maintain square aspect ratio
    const actualSize = Math.min(maxWidth, maxHeight, baseTotalSize);

    return { width: actualSize, height: actualSize };
  }, [puzzle.gridSize]);

  const getGridPosition = useCallback(
    (x: number, y: number): Position | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const { width: actualSize } = getCanvasSize();

      // Calculate the scale factor between displayed size and actual canvas size
      const scaleX = actualSize / rect.width;
      const scaleY = actualSize / rect.height;

      const canvasX = (x - rect.left) * scaleX;
      const canvasY = (y - rect.top) * scaleY;

      // Calculate scaled padding and cell size
      const scaledPadding =
        (CANVAS_CONFIG.padding * actualSize) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);
      const scaledCellSize =
        (GAME_CONFIG.cellSize * actualSize) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);

      // Adjust for padding
      const gridX = canvasX - scaledPadding;
      const gridY = canvasY - scaledPadding;

      // Convert to grid coordinates
      const cellX = Math.floor(gridX / scaledCellSize);
      const cellY = Math.floor(gridY / scaledCellSize);

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
    [puzzle.gridSize, getCanvasSize]
  );

  const getCanvasPosition = useCallback(
    (gridPos: Position): Position => {
      const { width: actualSize } = getCanvasSize();

      // Calculate scaled padding and cell size based on actual canvas dimensions
      const scaledPadding =
        (CANVAS_CONFIG.padding * actualSize) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);
      const scaledCellSize =
        (GAME_CONFIG.cellSize * actualSize) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);

      return {
        x: gridPos.x * scaledCellSize + scaledPadding + scaledCellSize / 2,
        y: gridPos.y * scaledCellSize + scaledPadding + scaledCellSize / 2,
      };
    },
    [getCanvasSize, puzzle.gridSize]
  );

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

      // Calculate scaled dimensions
      const scaledPadding =
        (CANVAS_CONFIG.padding * width) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);
      const scaledCellSize =
        (GAME_CONFIG.cellSize * width) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);
      const scaledLineWidth = Math.max(
        1,
        CANVAS_CONFIG.gridLineWidth *
          (width /
            (puzzle.gridSize * GAME_CONFIG.cellSize +
              CANVAS_CONFIG.padding * 2))
      );

      ctx.lineWidth = scaledLineWidth;

      // Draw vertical lines
      for (let i = 0; i <= puzzle.gridSize; i++) {
        const x = i * scaledCellSize + scaledPadding;
        ctx.beginPath();
        ctx.moveTo(x, scaledPadding);
        ctx.lineTo(x, height - scaledPadding);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = 0; i <= puzzle.gridSize; i++) {
        const y = i * scaledCellSize + scaledPadding;
        ctx.beginPath();
        ctx.moveTo(scaledPadding, y);
        ctx.lineTo(width - scaledPadding, y);
        ctx.stroke();
      }
    },
    [puzzle.gridSize, getCanvasSize]
  );

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D, path: Position[]) => {
      if (path.length < 1) return;

      const { width: canvasWidth } = getCanvasSize();
      const scaledPipeWidth =
        (GAME_CONFIG.pipeWidth * canvasWidth) /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);

      // Enhanced backtracking visualization will be handled per-segment

      ctx.lineWidth = scaledPipeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw path segments
      if (path.length > 1) {
        ctx.strokeStyle = GAME_CONFIG.colors.pipe;

        for (let i = 1; i < path.length; i++) {
          const fromPos = getCanvasPosition(path[i - 1]);
          const toPos = getCanvasPosition(path[i]);

          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.stroke();
        }
      }

      // Draw filled circles at each path position for better visibility and interaction
      for (let i = 0; i < path.length; i++) {
        const position = path[i];
        const pos = getCanvasPosition(position);

        // Regular path circle
        ctx.fillStyle = GAME_CONFIG.colors.pipe;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, scaledPipeWidth / 6, 0, 2 * Math.PI);
        ctx.fill();

        // Add hover highlight for backtrackable positions
        const currentPos = path[path.length - 1];
        const canBacktrack = validator.canBacktrackToPosition(
          path,
          position,
          currentPos
        );

        if (
          hoveredPosition &&
          hoveredPosition.x === position.x &&
          hoveredPosition.y === position.y &&
          canBacktrack
        ) {
          ctx.strokeStyle = GAME_CONFIG.colors.success;
          ctx.lineWidth = Math.max(2, scaledPipeWidth / 8);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, scaledPipeWidth / 2 + 2, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    },
    [
      getCanvasPosition,
      hoveredPosition,
      getCanvasSize,
      puzzle.gridSize,
      validator,
    ]
  );

  const drawDots = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width: canvasWidth } = getCanvasSize();
      const scaleFactor =
        canvasWidth /
        (puzzle.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2);
      const scaledDotRadius = GAME_CONFIG.dotRadius * scaleFactor;
      const scaledFontSize = Math.max(12, 18 * scaleFactor);

      puzzle.dots.forEach(dot => {
        const pos = getCanvasPosition(dot.position);

        // Draw outer white circle for better contrast
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
          pos.x,
          pos.y,
          scaledDotRadius + 2 * scaleFactor,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Draw main dot circle
        ctx.fillStyle = GAME_CONFIG.colors.dot;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, scaledDotRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw dot number with better contrast
        ctx.fillStyle = GAME_CONFIG.colors.dotText;
        ctx.font = `bold ${scaledFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2 * scaleFactor;
        ctx.shadowOffsetX = 1 * scaleFactor;
        ctx.shadowOffsetY = 1 * scaleFactor;

        ctx.fillText(dot.number.toString(), pos.x, pos.y);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
    },
    [puzzle.dots, getCanvasPosition, getCanvasSize, puzzle.gridSize]
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

      // Check if starting from dot 1 (initial start)
      const startDot = puzzle.dots.find(
        dot => dot.position.x === position.x && dot.position.y === position.y
      );

      if (startDot && startDot.number === 1 && currentPath.length === 0) {
        // Starting new path from dot 1
        setDragState({
          isDragging: true,
          startPosition: position,
          currentPosition: position,
          path: [position],
        });
        onPathUpdate([position]);
      } else {
        // Check if clicking on existing path to resume
        const pathIndex = currentPath.findIndex(
          pathPos => pathPos.x === position.x && pathPos.y === position.y
        );

        if (pathIndex !== -1) {
          // Check if we can resume from this position using enhanced rules
          const currentPos = currentPath[currentPath.length - 1];
          if (
            validator.canBacktrackToPosition(currentPath, position, currentPos)
          ) {
            // Resume from this point in the path (allowed)
            const resumePath = currentPath.slice(0, pathIndex + 1);
            setDragState({
              isDragging: true,
              startPosition: position,
              currentPosition: position,
              path: resumePath,
            });
            onPathUpdate(resumePath);
          }
          // If resuming not allowed, ignore the click
        }
      }
    },
    [
      disabled,
      getGridPosition,
      puzzle.dots,
      currentPath,
      onPathUpdate,
      validator,
    ]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = getGridPosition(event.clientX, event.clientY);

      if (!dragState.isDragging) {
        // Update hover state for resumable positions (respecting enhanced backtracking)
        if (position && currentPath.length > 0) {
          const isOnPath = currentPath.some(
            pathPos => pathPos.x === position.x && pathPos.y === position.y
          );
          const currentPos = currentPath[currentPath.length - 1];
          const canBacktrack =
            isOnPath &&
            validator.canBacktrackToPosition(currentPath, position, currentPos);
          setHoveredPosition(canBacktrack ? position : null);
        } else {
          setHoveredPosition(null);
        }
        return;
      }

      if (disabled || !position) return;

      // Check if this is a new position
      const lastPosition = dragState.path[dragState.path.length - 1];
      if (position.x === lastPosition.x && position.y === lastPosition.y)
        return;

      // Check if it's a valid move (adjacent cells only)
      if (!isValidMove(lastPosition, position)) return;

      // Check if we're going backwards (enhanced backtracking)
      const pathIndex = dragState.path.findIndex(
        p => p.x === position.x && p.y === position.y
      );
      if (pathIndex !== -1) {
        // Check if we can backtrack to this position using enhanced rules
        if (
          validator.canBacktrackToPosition(
            dragState.path,
            position,
            lastPosition
          )
        ) {
          // Going backwards - trim path (allowed)
          const newPath = dragState.path.slice(0, pathIndex + 1);
          setDragState(prev => ({
            ...prev,
            currentPosition: position,
            path: newPath,
          }));
          onPathUpdate(newPath);
        }
        // If backtracking not allowed, ignore the move (don't update path)
        return;
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
    [
      dragState,
      disabled,
      getGridPosition,
      isValidMove,
      onPathUpdate,
      currentPath,
      validator,
    ]
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
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredPosition(null);
          handleMouseUp();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default Grid;
