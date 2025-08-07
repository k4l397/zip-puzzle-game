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
 * Simple, aggressive Warnsdorff's rule implementation
 * Always chooses the move with fewest onward options (with small random tiebreaker)
 */
export class SimpleOptimizedGenerator {
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
   * Generate puzzle using aggressive Warnsdorff's rule
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
        console.warn(`Simple optimized generation attempt ${attempt} failed:`, error);
      }
    }

    return {
      success: false,
      puzzle: null,
      error: `Failed to generate valid puzzle after ${maxAttempts} attempts`,
    };
  }

  /**
   * Single generation attempt
   */
  private async attemptGeneration(options: GenerationOptions): Promise<Puzzle | null> {
    this.reset();
    this.startTime = Date.now();

    // Always start from a corner - statistically better for Hamiltonian paths
    const startPosition = this.getBestStartPosition();

    if (this.generateHamiltonianPath(startPosition)) {
      const dotCount =
        options.dotCount ||
        DEFAULT_DOTS_PER_GRID_SIZE[this.gridSize] ||
        Math.floor(this.gridSize * 1.5);
      const dots = this.selectDotPositions(dotCount);

      if (this.validatePuzzle(dots)) {
        return {
          id: `simple-optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          gridSize: this.gridSize,
          dots,
          solutionPath: [...this.path],
        };
      }
    }

    return null;
  }

  /**
   * Reset for new attempt
   */
  private reset(): void {
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(false));
    this.path = [];
    this.visited = new Set();
  }

  /**
   * Choose best starting position - prefer corners
   */
  private getBestStartPosition(): Position {
    const corners = [
      { x: 0, y: 0 },
      { x: 0, y: this.gridSize - 1 },
      { x: this.gridSize - 1, y: 0 },
      { x: this.gridSize - 1, y: this.gridSize - 1 }
    ];

    // Add small randomness to avoid identical puzzles
    return corners[Math.floor(Math.random() * corners.length)];
  }

  /**
   * Aggressive Warnsdorff's Hamiltonian path generation
   */
  private generateHamiltonianPath(start: Position): boolean {
    if (this.isTimedOut()) return false;

    const key = this.positionToKey(start);
    if (this.visited.has(key)) return false;

    // Mark as visited
    this.visited.add(key);
    this.path.push(start);
    this.grid[start.y][start.x] = true;

    // Success - visited all cells
    if (this.path.length === this.gridSize * this.gridSize) {
      return true;
    }

    // Get neighbors sorted by Warnsdorff's rule (fewest options first)
    const neighbors = this.getWarnsdorffSortedNeighbors(start);

    // Try each neighbor in order of constraint
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
   * Get neighbors sorted by Warnsdorff's rule
   * Most constrained positions first
   */
  private getWarnsdorffSortedNeighbors(pos: Position): Position[] {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];

    // Get all valid unvisited neighbors
    const candidates = directions
      .map(dir => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter(p => this.isValidPosition(p) && !this.visited.has(this.positionToKey(p)));

    if (candidates.length === 0) return [];

    // Calculate accessibility (number of unvisited neighbors) for each candidate
    const scored = candidates.map(candidate => ({
      position: candidate,
      accessibility: this.countUnvisitedNeighbors(candidate),
      tiebreaker: Math.random() // Small random factor for variety
    }));

    // Sort by accessibility (lowest first), then by tiebreaker
    scored.sort((a, b) => {
      if (a.accessibility !== b.accessibility) {
        return a.accessibility - b.accessibility; // Warnsdorff's rule
      }
      return a.tiebreaker - b.tiebreaker; // Random tiebreaker
    });

    return scored.map(item => item.position);
  }

  /**
   * Count unvisited neighbors for a position
   */
  private countUnvisitedNeighbors(pos: Position): number {
    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 }
    ];

    return directions
      .map(dir => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter(p => this.isValidPosition(p) && !this.visited.has(this.positionToKey(p)))
      .length;
  }

  /**
   * Check if position is within grid bounds
   */
  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.gridSize && pos.y >= 0 && pos.y < this.gridSize;
  }

  /**
   * Convert position to string key
   */
  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Check if generation has timed out
   */
  private isTimedOut(): boolean {
    return Date.now() - this.startTime > this.timeout;
  }

  /**
   * Select dot positions along the path
   */
  private selectDotPositions(dotCount: number): Dot[] {
    if (dotCount < 2 || dotCount > this.path.length) {
      throw new Error(`Invalid dot count: ${dotCount}. Must be between 2 and ${this.path.length}`);
    }

    const dots: Dot[] = [];
    const pathLength = this.path.length;

    // Always include start position
    dots.push({
      position: this.path[0],
      number: 1,
      isConnected: false,
    });

    if (dotCount > 2) {
      // Distribute remaining dots evenly along the path
      const step = (pathLength - 1) / (dotCount - 1);

      for (let i = 1; i < dotCount - 1; i++) {
        const pathIndex = Math.round(i * step);
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

    return dots.sort((a, b) => a.number - b.number);
  }

  /**
   * Validate the generated puzzle
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

    // Check path continuity
    for (let i = 1; i < this.path.length; i++) {
      const prev = this.path[i - 1];
      const curr = this.path[i];
      const dx = Math.abs(curr.x - prev.x);
      const dy = Math.abs(curr.y - prev.y);

      if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Convenience function for simple optimized puzzle generation
 */
export async function generateSimpleOptimizedPuzzle(gridSize: number): Promise<PuzzleGenerationResult> {
  const generator = new SimpleOptimizedGenerator({ gridSize });
  return generator.generatePuzzle({
    gridSize,
    dotCount: DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || Math.floor(gridSize * 1.5),
    maxAttempts: 10,
    timeout: TIMING_CONFIG.generationTimeout,
  });
}

/**
 * Fast generation with reduced attempts for better performance
 */
export async function generateFastOptimizedPuzzle(gridSize: number): Promise<PuzzleGenerationResult> {
  const generator = new SimpleOptimizedGenerator({
    gridSize,
    timeout: Math.min(TIMING_CONFIG.generationTimeout, 3000) // Max 3 seconds
  });

  return generator.generatePuzzle({
    gridSize,
    dotCount: DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || Math.floor(gridSize * 1.5),
    maxAttempts: 5, // Fewer attempts for speed
    timeout: Math.min(TIMING_CONFIG.generationTimeout, 3000),
  });
}
