import { test, expect } from '@playwright/test';
import { PathValidator } from '../src/utils/pathValidator';
import type { Puzzle, Position, Dot } from '../src/types/game';

// Helper function to create a test puzzle
function createTestPuzzle(): Puzzle {
  const dots: Dot[] = [
    { position: { x: 0, y: 0 }, number: 1, isConnected: false },
    { position: { x: 2, y: 1 }, number: 2, isConnected: false },
    { position: { x: 1, y: 3 }, number: 3, isConnected: false },
    { position: { x: 3, y: 3 }, number: 4, isConnected: false },
  ];

  return {
    id: 'test-puzzle',
    gridSize: 4,
    dots,
    solutionPath: [], // Not needed for these tests
  };
}

test.describe('Enhanced Backtracking Logic', () => {
  let validator: PathValidator;
  let puzzle: Puzzle;

  test.beforeEach(() => {
    puzzle = createTestPuzzle();
    validator = new PathValidator(puzzle);
  });

  test('should allow backtracking to any position when no dots visited', () => {
    const path: Position[] = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];

    // Should be able to backtrack to any position in the path
    expect(validator.canBacktrackToPosition(path, { x: 0, y: 1 })).toBe(true);
    expect(validator.canBacktrackToPosition(path, { x: 1, y: 1 })).toBe(true);
  });

  test('should only allow backtracking after last dot when not at a numbered dot', () => {
    // Path: Start -> A -> B -> Dot1 -> C -> D -> E (currently at E)
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 1, y: 1 }, // A
      { x: 0, y: 0 }, // Dot 1
      { x: 0, y: 2 }, // C (after dot 1)
      { x: 1, y: 2 }, // D (after dot 1)
      { x: 2, y: 2 }, // E (current position)
    ];

    const currentPos = { x: 2, y: 2 }; // E

    // Should NOT be able to backtrack to positions before dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 1 }, currentPos)
    ).toBe(false); // Start
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 1 }, currentPos)
    ).toBe(false); // A

    // Should be able to backtrack to dot 1 and positions after it
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 0 }, currentPos)
    ).toBe(true); // Dot 1 itself should be allowed
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 2 }, currentPos)
    ).toBe(true); // C
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 2 }, currentPos)
    ).toBe(true); // D
  });

  test('should allow backtracking to previous dot when currently at a numbered dot', () => {
    // Path: Start -> A -> Dot1 -> B -> C -> Dot2 (currently at Dot2)
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 1, y: 1 }, // A
      { x: 0, y: 0 }, // Dot 1
      { x: 1, y: 0 }, // B
      { x: 2, y: 0 }, // C
      { x: 2, y: 1 }, // Dot 2 (current position)
    ];

    const currentPos = { x: 2, y: 1 }; // Dot 2

    // Should be able to backtrack to Dot 1 and everything after it
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 0 }, currentPos)
    ).toBe(true); // Dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 0 }, currentPos)
    ).toBe(true); // B
    expect(
      validator.canBacktrackToPosition(path, { x: 2, y: 0 }, currentPos)
    ).toBe(true); // C

    // Should NOT be able to backtrack to positions before Dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 1 }, currentPos)
    ).toBe(false); // Start
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 1 }, currentPos)
    ).toBe(false); // A
  });

  test('should allow backtracking to beginning when at dot 1', () => {
    // Path: Start -> A -> B -> Dot1 (currently at Dot1)
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 1, y: 1 }, // A
      { x: 1, y: 0 }, // B
      { x: 0, y: 0 }, // Dot 1 (current position)
    ];

    const currentPos = { x: 0, y: 0 }; // Dot 1

    // Should be able to backtrack to any position (no previous dot)
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 1 }, currentPos)
    ).toBe(true); // Start
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 1 }, currentPos)
    ).toBe(true); // A
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 0 }, currentPos)
    ).toBe(true); // B
  });

  test('should handle multiple dots correctly', () => {
    // Path: Start -> Dot1 -> A -> B -> Dot2 -> C -> Dot3 -> D (currently at D)
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 0, y: 0 }, // Dot 1
      { x: 1, y: 0 }, // A
      { x: 2, y: 0 }, // B
      { x: 2, y: 1 }, // Dot 2
      { x: 2, y: 2 }, // C
      { x: 1, y: 3 }, // Dot 3
      { x: 2, y: 3 }, // D (current position)
    ];

    const currentPos = { x: 2, y: 3 }; // D

    // Should NOT be able to backtrack to positions before Dot 3
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 1 }, currentPos)
    ).toBe(false); // Start
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 0 }, currentPos)
    ).toBe(false); // Dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 0 }, currentPos)
    ).toBe(false); // A
    expect(
      validator.canBacktrackToPosition(path, { x: 2, y: 0 }, currentPos)
    ).toBe(false); // B
    expect(
      validator.canBacktrackToPosition(path, { x: 2, y: 1 }, currentPos)
    ).toBe(false); // Dot 2
    expect(
      validator.canBacktrackToPosition(path, { x: 2, y: 2 }, currentPos)
    ).toBe(false); // C

    // Should be able to backtrack to Dot 3 and after
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 3 }, currentPos)
    ).toBe(true); // Dot 3
  });

  test('should handle context change when moving to a numbered dot', () => {
    // Path: Start -> A -> B -> Dot1 -> C -> D -> Dot2 (now at Dot2)
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 1, y: 1 }, // A
      { x: 1, y: 0 }, // B
      { x: 0, y: 0 }, // Dot 1
      { x: 0, y: 2 }, // C
      { x: 1, y: 2 }, // D
      { x: 2, y: 1 }, // Dot 2 (current position)
    ];

    const currentPos = { x: 2, y: 1 }; // Dot 2

    // Now at Dot 2, should be able to backtrack to Dot 1 and everything after
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 0 }, currentPos)
    ).toBe(true); // Dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 2 }, currentPos)
    ).toBe(true); // C
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 2 }, currentPos)
    ).toBe(true); // D

    // Should NOT be able to backtrack before Dot 1
    expect(
      validator.canBacktrackToPosition(path, { x: 0, y: 1 }, currentPos)
    ).toBe(false); // Start
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 1 }, currentPos)
    ).toBe(false); // A
    expect(
      validator.canBacktrackToPosition(path, { x: 1, y: 0 }, currentPos)
    ).toBe(false); // B
  });

  test('should correctly identify last visited dot', () => {
    // Path with multiple dots
    const path: Position[] = [
      { x: 0, y: 1 }, // Start
      { x: 0, y: 0 }, // Dot 1
      { x: 1, y: 0 }, // A
      { x: 2, y: 1 }, // Dot 2
      { x: 3, y: 1 }, // B
    ];

    const result = validator.getLastVisitedDot(path);

    expect(result.dot).not.toBeNull();
    expect(result.dot!.number).toBe(2);
    expect(result.index).toBe(3); // Index where Dot 2 is found
  });

  test('should return null for last visited dot when no dots in path', () => {
    const path: Position[] = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];

    const result = validator.getLastVisitedDot(path);

    expect(result.dot).toBeNull();
    expect(result.index).toBe(-1);
  });
});
