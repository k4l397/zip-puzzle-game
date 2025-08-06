import type { Puzzle, Position, Dot } from '../types/game';
import { DEFAULT_DOTS_PER_GRID_SIZE, TIMING_CONFIG } from '../constants/config';

interface PuzzleGenerationResult {
  success: boolean;
  puzzle: Puzzle | null;
  error?: string;
}

interface GenerationOptions {
  gridSize: number;
  dotCount?: number;
  maxAttempts?: number;
  timeout?: number;
}

/**
 * Generates a valid Zip puzzle using backtracking algorithm
 * Creates a Hamiltonian path that visits every cell exactly once
 */
export class PuzzleGenerator {
  private gridSize: number;
  private grid: boolean[][];
  private path: Position[];
  private visited: Set<string>;
  private startTime: number;
  private timeout: number;

  constructor(options: GenerationOptions) {
    this.gridSize = options.gridSize;
    this.timeout = options.timeout || TIMING_CONFIG.generationTimeout;
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(false));
    this.path = [];
    this.visited = new Set();
    this.startTime = 0;
  }

  /**
   * Main generation function - attempts to create a valid puzzle
   */
  public async generatePuzzle(options: GenerationOptions): Promise<PuzzleGenerationResult> {
    const maxAttempts = options.maxAttempts || 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const puzzle = await this.attemptGeneration(options);
        if (puzzle) {
          return { success: true, puzzle };
        }
      } catch (error) {
        console.warn(`Puzzle generation attempt ${attempt} failed:`, error);
      }
    }

    return {
      success: false,
      puzzle: null,
      error: `Failed to generate valid puzzle after ${maxAttempts} attempts`,
    };
  }

  /**
   * Single attempt at puzzle generation
   */
  private async attemptGeneration(options: GenerationOptions): Promise<Puzzle | null> {
    this.reset();
    this.startTime = Date.now();

    // Start from a random corner or edge position for variety
    const startPosition = this.getRandomStartPosition();

    if (this.generateHamiltonianPath(startPosition)) {
      const dotCount = options.dotCount || DEFAULT_DOTS_PER_GRID_SIZE[this.gridSize] || Math.floor(this.gridSize * 1.5);
      const dots = this.selectDotPositions(dotCount);

      if (this.validatePuzzle(dots)) {
        return {
          id: `puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          gridSize: this.gridSize,
          dots,
          solutionPath: [...this.path],
        };
      }
    }

    return null;
  }

  /**
   * Reset internal state for new generation attempt
   */
  private reset(): void {
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(false));
    this.path = [];
    this.visited = new Set();
  }

  /**
   * Get a random starting position (prefer corners and edges for interesting puzzles)
   */
  private getRandomStartPosition(): Position {
    const positions: Position[] = [];

    // Add corners
    positions.push(
      { x: 0, y: 0 },
      { x: 0, y: this.gridSize - 1 },
      { x: this.gridSize - 1, y: 0 },
      { x: this.gridSize - 1, y: this.gridSize - 1 }
    );

    // Add some edge positions
    for (let i = 1; i < this.gridSize - 1; i++) {
      positions.push(
        { x: 0, y: i },
        { x: this.gridSize - 1, y: i },
        { x: i, y: 0 },
        { x: i, y: this.gridSize - 1 }
      );
    }

    return positions[Math.floor(Math.random() * positions.length)];
  }

  /**
   * Generate a Hamiltonian path using backtracking DFS
   */
  private generateHamiltonianPath(start: Position): boolean {
    if (this.isTimedOut()) return false;

    const key = this.positionToKey(start);
    if (this.visited.has(key)) return false;

    // Mark as visited
    this.visited.add(key);
    this.path.push(start);
    this.grid[start.y][start.x] = true;

    // If we've visited all cells, we have a complete Hamiltonian path
    if (this.path.length === this.gridSize * this.gridSize) {
      return true;
    }

    // Get possible next moves (orthogonal neighbors only)
    const neighbors = this.getValidNeighbors(start);

    // Shuffle neighbors for randomness
    this.shuffleArray(neighbors);

    // Try each neighbor
    for (const neighbor of neighbors) {
      if (this.generateHamiltonianPath(neighbor)) {
        return true;
      }
    }

    // Backtrack
    this.visited.delete(key);
    this.path.pop();
    this.grid[start.y][start.x] = false;

    return false;
  }

  /**
   * Get valid neighboring positions (orthogonal only, within bounds, unvisited)
   */
  private getValidNeighbors(pos: Position): Position[] {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
    ];

    return directions
      .map(dir => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter(p => this.isValidPosition(p) && !this.visited.has(this.positionToKey(p)))
      .sort(() => {
        // Add some heuristics to prefer positions that don't create dead ends
        // This improves generation success rate
        return Math.random() - 0.5;
      });
  }

  /**
   * Check if position is within grid bounds
   */
  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.gridSize && pos.y >= 0 && pos.y < this.gridSize;
  }

  /**
   * Convert position to string key for Set operations
   */
  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Check if generation has exceeded timeout
   */
  private isTimedOut(): boolean {
    return Date.now() - this.startTime > this.timeout;
  }

  /**
   * Select positions along the path for numbered dots
   * Ensures dots are well-distributed and create interesting puzzles
   */
  private selectDotPositions(dotCount: number): Dot[] {
    if (dotCount < 2 || dotCount > this.path.length) {
      throw new Error(`Invalid dot count: ${dotCount}. Must be between 2 and ${this.path.length}`);
    }

    const dots: Dot[] = [];
    const pathLength = this.path.length;

    // Always include start and end positions
    dots.push({
      position: this.path[0],
      number: 1,
      isConnected: false,
    });

    if (dotCount > 2) {
      // Distribute remaining dots evenly along the path
      const step = Math.floor(pathLength / (dotCount - 1));

      for (let i = 1; i < dotCount - 1; i++) {
        const pathIndex = Math.min(i * step, pathLength - 2);
        dots.push({
          position: this.path[pathIndex],
          number: i + 1,
          isConnected: false,
        });
      }
    }

    // Always include the end position as the last dot
    dots.push({
      position: this.path[pathLength - 1],
      number: dotCount,
      isConnected: false,
    });

    // Add some randomization to make dots less predictable
    this.randomizeDotPositions(dots);

    return dots.sort((a, b) => a.number - b.number);
  }

  /**
   * Add some randomization to dot positions while maintaining order
   */
  private randomizeDotPositions(dots: Dot[]): void {
    // Skip first and last dots (start/end should remain fixed)
    for (let i = 1; i < dots.length - 1; i++) {
      const currentPathIndex = this.path.findIndex(
        p => p.x === dots[i].position.x && p.y === dots[i].position.y
      );

      // Allow small random adjustments within bounds
      const minIndex = i === 1 ? 1 : this.path.findIndex(
        p => p.x === dots[i - 1].position.x && p.y === dots[i - 1].position.y
      ) + 1;

      const maxIndex = i === dots.length - 2 ? this.path.length - 2 : this.path.findIndex(
        p => p.x === dots[i + 1].position.x && p.y === dots[i + 1].position.y
      ) - 1;

      if (maxIndex > minIndex) {
        const randomOffset = Math.floor(Math.random() * Math.min(3, maxIndex - minIndex));
        const newIndex = Math.min(currentPathIndex + randomOffset, maxIndex);
        dots[i].position = this.path[newIndex];
      }
    }
  }

  /**
   * Validate that the generated puzzle is solvable and meets requirements
   */
  private validatePuzzle(dots: Dot[]): boolean {
    // Check that dots are in ascending order along the path
    let lastPathIndex = -1;
    for (const dot of dots.sort((a, b) => a.number - b.number)) {
      const pathIndex = this.path.findIndex(
        p => p.x === dot.position.x && p.y === dot.position.y
      );

      if (pathIndex <= lastPathIndex) {
        return false;
      }

      lastPathIndex = pathIndex;
    }

    // Check that no two dots share the same position
    const positions = new Set(dots.map(dot => this.positionToKey(dot.position)));
    if (positions.size !== dots.length) {
      return false;
    }

    // Check that path covers all grid cells
    if (this.path.length !== this.gridSize * this.gridSize) {
      return false;
    }

    // Check path continuity (each step is orthogonal and adjacent)
    for (let i = 1; i < this.path.length; i++) {
      const prev = this.path[i - 1];
      const curr = this.path[i];
      const dx = Math.abs(curr.x - prev.x);
      const dy = Math.abs(curr.y - prev.y);

      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  }
}

/**
 * Convenience function to generate a puzzle with default options
 */
export async function generateZipPuzzle(gridSize: number): Promise<PuzzleGenerationResult> {
  const generator = new PuzzleGenerator({ gridSize });
  return generator.generatePuzzle({
    gridSize,
    dotCount: DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || Math.floor(gridSize * 1.5),
    maxAttempts: 10,
    timeout: TIMING_CONFIG.generationTimeout,
  });
}

/**
 * Quick puzzle generation for testing with simpler constraints
 */
export function generateSimplePuzzle(gridSize: number): Puzzle {
  const solutionPath: Position[] = [];

  // Generate a simple spiral pattern for reliable testing
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;

  const visited = new Set<string>();

  while (solutionPath.length < gridSize * gridSize) {
    const key = `${x},${y}`;
    if (!visited.has(key) && x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      solutionPath.push({ x, y });
      visited.add(key);
    }

    // Try to continue in current direction
    const nextX = x + dx;
    const nextY = y + dy;
    const nextKey = `${nextX},${nextY}`;

    // Change direction if we hit boundary or visited cell
    if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize || visited.has(nextKey)) {
      // Rotate 90 degrees clockwise
      const newDx = -dy;
      const newDy = dx;
      dx = newDx;
      dy = newDy;
    }

    x += dx;
    y += dy;
  }

  const dotCount = DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || 4;
  const dots: Dot[] = [];

  // Evenly distribute dots
  for (let i = 0; i < dotCount; i++) {
    const pathIndex = Math.floor((i * (solutionPath.length - 1)) / (dotCount - 1));
    dots.push({
      position: solutionPath[pathIndex],
      number: i + 1,
      isConnected: false,
    });
  }

  return {
    id: `simple-puzzle-${Date.now()}`,
    gridSize,
    dots,
    solutionPath,
  };
}
