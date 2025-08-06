export interface Position {
  x: number;
  y: number;
}

export interface Dot {
  position: Position;
  number: number;
  isConnected: boolean;
}

export interface Cell {
  position: Position;
  hasPipe: boolean;
  pipeDirection?: PipeDirection;
  isVisited: boolean;
}

export type PipeDirection =
  | 'horizontal'
  | 'vertical'
  | 'corner-top-right'
  | 'corner-top-left'
  | 'corner-bottom-right'
  | 'corner-bottom-left';

export interface Puzzle {
  gridSize: number;
  dots: Dot[];
  solutionPath: Position[];
  id: string;
}

export interface GameState {
  puzzle: Puzzle | null;
  currentPath: Position[];
  isCompleted: boolean;
  isGenerating: boolean;
  startTime: number | null;
  endTime: number | null;
  gridSize: number;
}

export type GameMode = 'playing' | 'completed' | 'generating' | 'idle';

export interface GameConfig {
  minGridSize: number;
  maxGridSize: number;
  defaultGridSize: number;
  cellSize: number;
  dotRadius: number;
  pipeWidth: number;
  colors: {
    grid: string;
    dot: string;
    dotText: string;
    pipe: string;
    background: string;
    success: string;
  };
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
  path: Position[];
}
