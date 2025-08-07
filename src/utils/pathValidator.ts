import type { Position, Puzzle, Dot } from '../types/game';

/**
 * Utility class for validating puzzle solutions and paths
 */
export class PathValidator {
  private puzzle: Puzzle;

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
  }

  /**
   * Validates if the current path is a complete and correct solution
   */
  public validateSolution(path: Position[]): {
    isValid: boolean;
    isComplete: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if path covers all cells
    const totalCells = this.puzzle.gridSize * this.puzzle.gridSize;
    const isComplete = path.length === totalCells;

    if (!isComplete) {
      errors.push(`Path incomplete: ${path.length}/${totalCells} cells filled`);
    }

    // Check path continuity
    if (!this.isPathContinuous(path)) {
      errors.push('Path contains gaps or invalid moves');
    }

    // Check if all dots are visited in correct order
    if (!this.areDotsConnectedInOrder(path)) {
      errors.push('Dots are not connected in ascending numerical order');
    }

    // Check if path ends on the final numbered dot
    if (!this.doesPathEndOnFinalDot(path)) {
      errors.push('Path must end on the highest numbered dot');
    }

    // Check for path overlaps (same cell visited twice)
    if (!this.isPathUnique(path)) {
      errors.push('Path contains overlapping cells');
    }

    // Check if path stays within grid bounds
    if (!this.isPathWithinBounds(path)) {
      errors.push('Path goes outside grid boundaries');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      isComplete,
      errors,
    };
  }

  /**
   * Validates if a single move from one position to another is valid
   */
  public isValidMove(from: Position, to: Position): boolean {
    // Must be orthogonal (no diagonals)
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
      return false;
    }

    // Must be within grid bounds
    if (!this.isWithinBounds(to)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the path forms a continuous line with no gaps
   */
  private isPathContinuous(path: Position[]): boolean {
    if (path.length < 2) return true;

    for (let i = 1; i < path.length; i++) {
      if (!this.isValidMove(path[i - 1], path[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if all dots are visited in ascending numerical order
   */
  private areDotsConnectedInOrder(path: Position[]): boolean {
    const sortedDots = [...this.puzzle.dots].sort(
      (a, b) => a.number - b.number
    );
    let lastFoundIndex = -1;

    for (const dot of sortedDots) {
      const dotIndex = path.findIndex(
        pos => pos.x === dot.position.x && pos.y === dot.position.y
      );

      if (dotIndex === -1) {
        // Dot not found in path
        return false;
      }

      if (dotIndex <= lastFoundIndex) {
        // Dot found before previous dot in sequence
        return false;
      }

      lastFoundIndex = dotIndex;
    }

    return true;
  }

  /**
   * Checks if the path ends on the highest numbered dot
   */
  private doesPathEndOnFinalDot(path: Position[]): boolean {
    if (path.length === 0 || this.puzzle.dots.length === 0) {
      return false;
    }

    // Find the highest numbered dot
    const finalDot = this.puzzle.dots.reduce((max, dot) =>
      dot.number > max.number ? dot : max
    );

    // Check if path ends on this dot
    const lastPosition = path[path.length - 1];
    return (
      lastPosition.x === finalDot.position.x &&
      lastPosition.y === finalDot.position.y
    );
  }

  /**
   * Checks if path visits each cell only once
   */
  private isPathUnique(path: Position[]): boolean {
    const visited = new Set<string>();

    for (const pos of path) {
      const key = `${pos.x},${pos.y}`;
      if (visited.has(key)) {
        return false;
      }
      visited.add(key);
    }

    return true;
  }

  /**
   * Checks if all positions in path are within grid boundaries
   */
  private isPathWithinBounds(path: Position[]): boolean {
    return path.every(pos => this.isWithinBounds(pos));
  }

  /**
   * Checks if a single position is within grid boundaries
   */
  private isWithinBounds(pos: Position): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.puzzle.gridSize &&
      pos.y >= 0 &&
      pos.y < this.puzzle.gridSize
    );
  }

  /**
   * Gets the next expected dot based on current path
   */
  public getNextExpectedDot(path: Position[]): Dot | null {
    if (path.length === 0) {
      // First dot should be number 1
      return this.puzzle.dots.find(dot => dot.number === 1) || null;
    }

    const connectedDots = this.getConnectedDots(path);
    const nextDotNumber = connectedDots.length + 1;

    return this.puzzle.dots.find(dot => dot.number === nextDotNumber) || null;
  }

  /**
   * Gets all dots that are currently connected by the path in correct order
   */
  public getConnectedDots(path: Position[]): Dot[] {
    const connectedDots: Dot[] = [];
    const sortedDots = [...this.puzzle.dots].sort(
      (a, b) => a.number - b.number
    );

    let lastFoundIndex = -1;

    for (const dot of sortedDots) {
      const dotIndex = path.findIndex(
        pos => pos.x === dot.position.x && pos.y === dot.position.y
      );

      if (dotIndex === -1 || dotIndex <= lastFoundIndex) {
        // Dot not found or out of order - stop here
        break;
      }

      connectedDots.push(dot);
      lastFoundIndex = dotIndex;
    }

    return connectedDots;
  }

  /**
   * Calculates completion percentage
   */
  public getCompletionPercentage(path: Position[]): number {
    const totalCells = this.puzzle.gridSize * this.puzzle.gridSize;
    return Math.floor((path.length / totalCells) * 100);
  }

  /**
   * Gets validation hints for the current path state
   */
  public getHints(path: Position[]): string[] {
    const hints: string[] = [];

    if (path.length === 0) {
      const firstDot = this.puzzle.dots.find(dot => dot.number === 1);
      if (firstDot) {
        hints.push(
          `Start by clicking on dot ${firstDot.number} at position (${firstDot.position.x}, ${firstDot.position.y})`
        );
      }
      return hints;
    }

    const nextDot = this.getNextExpectedDot(path);
    if (nextDot) {
      hints.push(
        `Next: Connect to dot ${nextDot.number} at position (${nextDot.position.x}, ${nextDot.position.y})`
      );
    }

    const completion = this.getCompletionPercentage(path);
    hints.push(
      `Progress: ${completion}% complete (${path.length}/${this.puzzle.gridSize * this.puzzle.gridSize} cells)`
    );

    if (!this.isPathContinuous(path)) {
      hints.push(
        'Warning: Path contains invalid moves (only orthogonal moves allowed)'
      );
    }

    return hints;
  }

  /**
   * Checks if the current path can potentially lead to a valid solution
   */
  public isPathViable(path: Position[]): boolean {
    if (path.length === 0) return true;

    // Check basic validity
    if (
      !this.isPathContinuous(path) ||
      !this.isPathUnique(path) ||
      !this.isPathWithinBounds(path)
    ) {
      return false;
    }

    // Check if dots connected so far are in correct order
    const connectedDots = this.getConnectedDots(path);
    const expectedConnectedCount = this.getExpectedConnectedDotsCount(path);

    return connectedDots.length >= expectedConnectedCount;
  }

  /**
   * Helper to determine how many dots should be connected for a given path length
   */
  private getExpectedConnectedDotsCount(path: Position[]): number {
    if (path.length === 0) return 0;

    // Count how many dots should be reachable by now
    let count = 0;
    for (const dot of this.puzzle.dots) {
      const dotIndex = path.findIndex(
        pos => pos.x === dot.position.x && pos.y === dot.position.y
      );
      if (dotIndex !== -1) {
        count++;
      } else {
        // Stop at first unreached dot
        break;
      }
    }

    return count;
  }

  /**
   * Finds the last numbered dot that was visited in the given path
   * Returns both the dot and the index where it was reached
   */
  public getLastVisitedDot(path: Position[]): {
    dot: Dot | null;
    index: number;
  } {
    if (path.length === 0) {
      return { dot: null, index: -1 };
    }

    const sortedDots = [...this.puzzle.dots].sort(
      (a, b) => a.number - b.number
    );
    let lastDot: Dot | null = null;
    let lastIndex = -1;

    for (const dot of sortedDots) {
      const dotIndex = path.findIndex(
        pos => pos.x === dot.position.x && pos.y === dot.position.y
      );

      if (dotIndex !== -1 && dotIndex > lastIndex) {
        lastDot = dot;
        lastIndex = dotIndex;
      } else if (dotIndex === -1) {
        // Stop at first unreached dot in sequence
        break;
      }
    }

    return { dot: lastDot, index: lastIndex };
  }

  /**
   * Determines if a position can be backtracked to based on enhanced backtracking rules
   * - If currently at a numbered dot: can backtrack to previous numbered dot (inclusive)
   * - If not at a numbered dot: can only backtrack to positions after last numbered dot
   */
  public canBacktrackToPosition(
    path: Position[],
    targetPosition: Position,
    currentPosition?: Position
  ): boolean {
    const targetIndex = path.findIndex(
      pos => pos.x === targetPosition.x && pos.y === targetPosition.y
    );

    if (targetIndex === -1) {
      // Position not in path, no backtracking possible
      return false;
    }

    // Use the last position in path if no current position specified
    const currentPos = currentPosition || path[path.length - 1];

    // Check if current position is on a numbered dot
    const currentDot = this.puzzle.dots.find(
      dot => dot.position.x === currentPos.x && dot.position.y === currentPos.y
    );

    if (currentDot) {
      // Currently at a numbered dot - can backtrack to previous numbered dot
      const previousDot = this.getPreviousNumberedDot(currentDot.number);
      if (previousDot) {
        const previousDotIndex = path.findIndex(
          pos =>
            pos.x === previousDot.position.x && pos.y === previousDot.position.y
        );
        // Allow backtracking to any position from previous dot onwards
        return targetIndex >= previousDotIndex;
      } else {
        // At dot 1, can backtrack to beginning
        return true;
      }
    } else {
      // Not at a numbered dot - use original logic
      const { index: lastDotIndex } = this.getLastVisitedDot(path);

      // If no numbered dots have been reached yet, allow backtracking to any position
      if (lastDotIndex === -1) {
        return true;
      }

      // Only allow backtracking to positions that came after the last numbered dot (inclusive)
      return targetIndex >= lastDotIndex;
    }
  }

  /**
   * Gets the previous numbered dot in sequence
   */
  private getPreviousNumberedDot(currentDotNumber: number): Dot | null {
    if (currentDotNumber <= 1) {
      return null; // No previous dot for dot 1
    }

    return (
      this.puzzle.dots.find(dot => dot.number === currentDotNumber - 1) || null
    );
  }
}

/**
 * Convenience function to quickly validate a solution
 */
export function validatePuzzleSolution(
  puzzle: Puzzle,
  path: Position[]
): boolean {
  const validator = new PathValidator(puzzle);
  const result = validator.validateSolution(path);
  return result.isValid && result.isComplete;
}

/**
 * Quick check if a move is valid
 */
export function isValidPuzzleMove(
  puzzle: Puzzle,
  from: Position,
  to: Position
): boolean {
  const validator = new PathValidator(puzzle);
  return validator.isValidMove(from, to);
}
