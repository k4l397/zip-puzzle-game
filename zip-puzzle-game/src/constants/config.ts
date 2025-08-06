import type { GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  minGridSize: 3,
  maxGridSize: 8,
  defaultGridSize: 4,
  cellSize: 60,
  dotRadius: 24,
  pipeWidth: 20,
  colors: {
    grid: '#e5e5e5',
    dot: '#000000',
    dotText: '#ffffff',
    pipe: '#22c55e',
    background: '#f8fafc',
    success: '#10b981',
  },
};

export const CANVAS_CONFIG = {
  padding: 40,
  gridLineWidth: 1,
  dotBorderWidth: 4,
  animationDuration: 300,
  touchSensitivity: 10,
};

export const TIMING_CONFIG = {
  updateInterval: 16, // ~60fps
  generationTimeout: 5000, // 5 seconds max for puzzle generation
  celebrationDuration: 2000,
};

export const STORAGE_KEYS = {
  gridSize: 'zip-puzzle-grid-size',
  bestTimes: 'zip-puzzle-best-times',
  preferences: 'zip-puzzle-preferences',
};

export const DEFAULT_DOTS_PER_GRID_SIZE: Record<number, number> = {
  3: 4,
  4: 6,
  5: 8,
  6: 10,
  7: 12,
  8: 15,
};
