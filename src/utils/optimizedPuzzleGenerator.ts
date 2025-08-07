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
  algorithm?: 'probabilistic' | 'temperature' | 'smart-fallback';
}

/**
 * Optimized puzzle generator using probabilistic Warnsdorff's rule
 * and other advanced heuristics to dramatically improve performance
 */
export class OptimizedPuzzleGenerator {
  private gridSize: number;
  private grid: boolean[][];
  private path: Position[];
  private visited: Set<string>;
  private startTime: number;
  private timeout: number;
  private algorithm: string;

  constructor(options: GenerationOptions) {
    this.gridSize = options.gridSize;
    this.timeout = options.timeout || TIMING_CONFIG.generationTimeout;
    this.algorithm = options.algorithm || 'probabilistic';
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(false));
    this.path = [];
    this.visited = new Set();
    this.startTime = 0;
  }

  /**
   * Main optimized generation function
   */
  public async generatePuzzle(
    options: GenerationOptions
  ): Promise<PuzzleGenerationResult> {
    const maxAttempts = options.maxAttempts || 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const puzzle = await this.attemptGeneration(options);
        if (puzzle) {
          return { success: true, puzzle };
        }
      } catch (error) {
        console.warn(
          `Optimized puzzle generation attempt ${attempt} failed:`,
          error
        );
      }
    }

    return {
      success: false,
      puzzle: null,
      error: `Failed to generate valid puzzle after ${maxAttempts} attempts`,
    };
  }

  /**
   * Single optimized generation attempt
   */
  private async attemptGeneration(
    options: GenerationOptions
  ): Promise<Puzzle | null> {
    this.reset();
    this.startTime = Date.now();

    // Use optimized starting position selection
    const startPosition = this.getOptimalStartPosition();

    if (this.generateOptimizedHamiltonianPath(startPosition)) {
      const dotCount =
        options.dotCount ||
        DEFAULT_DOTS_PER_GRID_SIZE[this.gridSize] ||
        Math.floor(this.gridSize * 1.5);
      const dots = this.selectDotPositions(dotCount);

      if (this.validatePuzzle(dots)) {
        return {
          id: `optimized-puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
   * Optimized starting position selection
   * Prefer positions that are statistically more likely to succeed
   */
  private getOptimalStartPosition(): Position {
    const positions: { pos: Position; weight: number }[] = [];

    // Corner positions have higher success rate for Hamiltonian paths
    const corners = [
      { x: 0, y: 0 },
      { x: 0, y: this.gridSize - 1 },
      { x: this.gridSize - 1, y: 0 },
      { x: this.gridSize - 1, y: this.gridSize - 1 },
    ];

    corners.forEach(pos => {
      positions.push({ pos, weight: 3.0 }); // Higher weight for corners
    });

    // Edge positions (not corners)
    for (let i = 1; i < this.gridSize - 1; i++) {
      const edgePositions = [
        { x: 0, y: i },
        { x: this.gridSize - 1, y: i },
        { x: i, y: 0 },
        { x: i, y: this.gridSize - 1 },
      ];
      edgePositions.forEach(pos => {
        positions.push({ pos, weight: 1.5 }); // Medium weight for edges
      });
    }

    // Add a few center positions for variety
    if (this.gridSize >= 5) {
      const centerX = Math.floor(this.gridSize / 2);
      const centerY = Math.floor(this.gridSize / 2);
      positions.push({ pos: { x: centerX, y: centerY }, weight: 0.5 });
    }

    return this.weightedRandomSelect(positions);
  }

  /**
   * Optimized Hamiltonian path generation using probabilistic Warnsdorff's rule
   */
  private generateOptimizedHamiltonianPath(start: Position): boolean {
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

    // Get optimized next moves based on selected algorithm
    let neighbors: Position[];

    switch (this.algorithm) {
      case 'temperature':
        neighbors = this.getNeighborsWithTemperature(start);
        break;
      case 'smart-fallback':
        neighbors = this.getSmartFallbackNeighbors(start);
        break;
      default:
        neighbors = this.getProbabilisticWarnsdorffNeighbors(start);
    }

    // Try each neighbor
    for (const neighbor of neighbors) {
      if (this.generateOptimizedHamiltonianPath(neighbor)) {
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
   * Probabilistic Warnsdorff's rule implementation
   * Instead of always choosing the lowest accessibility, use weighted probability
   */
  private getProbabilisticWarnsdorffNeighbors(pos: Position): Position[] {
    const candidates = this.getUnvisitedNeighbors(pos);
    if (candidates.length === 0) return [];

    // Calculate accessibility scores for each candidate
    const scored = candidates.map(candidate => ({
      position: candidate,
      accessibility: this.countUnvisitedNeighbors(candidate),
      weight: 0,
    }));

    // Convert accessibility to probability weights
    // Lower accessibility = higher weight (Warnsdorff's principle)
    // But maintain some randomness by not making it absolute
    scored.forEach(item => {
      // Exponential weighting: positions with fewer moves get exponentially higher weight
      // +0.2 ensures even the most accessible position has some chance
      item.weight = Math.pow(0.4, item.accessibility) + 0.2;

      // Add small random factor for variety
      item.weight *= 0.8 + Math.random() * 0.4; // ±20% randomization
    });

    // Weighted random selection
    return this.weightedRandomSort(scored);
  }

  /**
   * Temperature-based approach: start random, gradually become more structured
   */
  private getNeighborsWithTemperature(pos: Position): Position[] {
    const pathProgress = this.path.length / (this.gridSize * this.gridSize);

    // Temperature decreases as path gets longer (0.9 → 0.2)
    const temperature = 0.9 - pathProgress * 0.7;

    if (Math.random() < temperature) {
      // High temperature: use random selection (early in path)
      return this.getRandomNeighbors(pos);
    } else {
      // Low temperature: use Warnsdorff's rule (when getting constrained)
      return this.getProbabilisticWarnsdorffNeighbors(pos);
    }
  }

  /**
   * Smart fallback: try random first, use Warnsdorff's when stuck
   */
  private getSmartFallbackNeighbors(pos: Position): Position[] {
    const candidates = this.getUnvisitedNeighbors(pos);
    if (candidates.length === 0) return [];

    // If we have many options, be random for variety
    if (candidates.length >= 3) {
      return this.shuffleArray([...candidates]);
    }

    // If constrained (few options), use Warnsdorff's rule
    return this.getProbabilisticWarnsdorffNeighbors(pos);
  }

  /**
   * Get unvisited orthogonal neighbors
   */
  private getUnvisitedNeighbors(pos: Position): Position[] {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 }, // Right
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
    ];

    return directions
      .map(dir => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter(
        p => this.isValidPosition(p) && !this.visited.has(this.positionToKey(p))
      );
  }

  /**
   * Random neighbor selection (for comparison and temperature algorithm)
   */
  private getRandomNeighbors(pos: Position): Position[] {
    const neighbors = this.getUnvisitedNeighbors(pos);
    return this.shuffleArray([...neighbors]);
  }

  /**
   * Count unvisited neighbors for Warnsdorff's rule
   */
  private countUnvisitedNeighbors(pos: Position): number {
    return this.getUnvisitedNeighbors(pos).length;
  }

  /**
   * Weighted random selection from scored positions
   */
  private weightedRandomSelect(
    items: { pos: Position; weight: number }[]
  ): Position {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.pos;
      }
    }

    return items[items.length - 1].pos; // Fallback
  }

  /**
   * Weighted random sorting for neighbor selection
   */
  private weightedRandomSort(
    scored: { position: Position; accessibility: number; weight: number }[]
  ): Position[] {
    const result: Position[] = [];
    const remaining = [...scored];

    while (remaining.length > 0) {
      const currentTotalWeight = remaining.reduce(
        (sum, item) => sum + item.weight,
        0
      );
      let random = Math.random() * currentTotalWeight;

      for (let i = 0; i < remaining.length; i++) {
        random -= remaining[i].weight;
        if (random <= 0) {
          result.push(remaining[i].position);
          remaining.splice(i, 1);
          break;
        }
      }

      // Fallback if rounding errors occur
      if (
        remaining.length > 0 &&
        result.length === scored.length - remaining.length - 1
      ) {
        result.push(remaining.pop()!.position);
      }
    }

    return result;
  }

  /**
   * Check if position is within grid bounds
   */
  private isValidPosition(pos: Position): boolean {
    return (
      pos.x >= 0 && pos.x < this.gridSize && pos.y >= 0 && pos.y < this.gridSize
    );
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
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Check if generation has exceeded timeout
   */
  private isTimedOut(): boolean {
    return Date.now() - this.startTime > this.timeout;
  }

  /**
   * Select positions along the path for numbered dots
   * Same logic as original but optimized for readability
   */
  private selectDotPositions(dotCount: number): Dot[] {
    if (dotCount < 2 || dotCount > this.path.length) {
      throw new Error(
        `Invalid dot count: ${dotCount}. Must be between 2 and ${this.path.length}`
      );
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

    // Add controlled randomization for variety
    this.optimizedRandomizeDotPositions(dots);

    return dots.sort((a, b) => a.number - b.number);
  }

  /**
   * Optimized dot position randomization
   */
  private optimizedRandomizeDotPositions(dots: Dot[]): void {
    // Skip first and last dots (start/end should remain fixed)
    for (let i = 1; i < dots.length - 1; i++) {
      const currentPathIndex = this.path.findIndex(
        p => p.x === dots[i].position.x && p.y === dots[i].position.y
      );

      const minIndex =
        i === 1
          ? 1
          : this.path.findIndex(
              p =>
                p.x === dots[i - 1].position.x && p.y === dots[i - 1].position.y
            ) + 1;

      const maxIndex =
        i === dots.length - 2
          ? this.path.length - 2
          : this.path.findIndex(
              p =>
                p.x === dots[i + 1].position.x && p.y === dots[i + 1].position.y
            ) - 1;

      if (maxIndex > minIndex) {
        // Smaller random offset for more controlled variety
        const maxOffset = Math.min(2, Math.floor((maxIndex - minIndex) / 3));
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
        const newIndex = Math.min(currentPathIndex + randomOffset, maxIndex);
        dots[i].position = this.path[newIndex];
      }
    }
  }

  /**
   * Puzzle validation (same as original)
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
    const positions = new Set(
      dots.map(dot => this.positionToKey(dot.position))
    );
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
 * Convenience function for optimized puzzle generation
 */
export async function generateOptimizedZipPuzzle(
  gridSize: number,
  algorithm:
    | 'probabilistic'
    | 'temperature'
    | 'smart-fallback' = 'probabilistic'
): Promise<PuzzleGenerationResult> {
  const generator = new OptimizedPuzzleGenerator({
    gridSize,
    algorithm,
  });
  return generator.generatePuzzle({
    gridSize,
    algorithm,
    dotCount:
      DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || Math.floor(gridSize * 1.5),
    maxAttempts: 5, // Fewer attempts needed due to higher success rate
    timeout: TIMING_CONFIG.generationTimeout,
  });
}

/**
 * Multi-algorithm puzzle generator that tries different strategies
 */
export async function generateAdaptiveZipPuzzle(
  gridSize: number
): Promise<PuzzleGenerationResult> {
  const strategies: Array<{
    algorithm: 'probabilistic' | 'temperature' | 'smart-fallback';
    weight: number;
  }> = [
    { algorithm: 'probabilistic', weight: 0.5 },
    { algorithm: 'temperature', weight: 0.3 },
    { algorithm: 'smart-fallback', weight: 0.2 },
  ];

  // For larger grids, prefer more structured approaches
  if (gridSize >= 7) {
    strategies[0].weight = 0.7; // More probabilistic
    strategies[1].weight = 0.2;
    strategies[2].weight = 0.1;
  }

  // Weighted random selection of strategy
  const totalWeight = strategies.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  let selectedAlgorithm: 'probabilistic' | 'temperature' | 'smart-fallback' =
    'probabilistic';
  for (const strategy of strategies) {
    random -= strategy.weight;
    if (random <= 0) {
      selectedAlgorithm = strategy.algorithm;
      break;
    }
  }

  return generateOptimizedZipPuzzle(gridSize, selectedAlgorithm);
}
