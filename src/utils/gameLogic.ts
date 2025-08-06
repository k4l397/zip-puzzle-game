interface Position {
  x: number;
  y: number;
}

interface Dot {
  position: Position;
  number: number;
}

/**
 * Check if two positions are adjacent (orthogonally connected)
 */
export function arePositionsAdjacent(pos1: Position, pos2: Position): boolean {
  const deltaX = Math.abs(pos1.x - pos2.x);
  const deltaY = Math.abs(pos1.y - pos2.y);
  return (deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1);
}

/**
 * Check if a position exists in a path
 */
export function isPositionInPath(
  position: Position,
  path: Position[],
): boolean {
  return path.some((pos) => pos.x === position.x && pos.y === position.y);
}

/**
 * Get the index of a position in a path, or -1 if not found
 */
export function getPositionIndex(position: Position, path: Position[]): number {
  return path.findIndex((pos) => pos.x === position.x && pos.y === position.y);
}

/**
 * Validate that a path connects dots in the correct numerical order
 */
export function validateDotOrder(path: Position[], dots: Dot[]): boolean {
  const sortedDots = [...dots].sort((a, b) => a.number - b.number);
  let currentDotIndex = 0;

  for (const pathPos of path) {
    const dotAtPosition = dots.find(
      (dot) => dot.position.x === pathPos.x && dot.position.y === pathPos.y,
    );

    if (dotAtPosition) {
      // Check if this is the expected next dot
      if (
        currentDotIndex >= sortedDots.length ||
        dotAtPosition.number !== sortedDots[currentDotIndex].number
      ) {
        return false;
      }
      currentDotIndex++;
    }
  }

  return true;
}

/**
 * Check if all dots are visited in the path
 */
export function areAllDotsVisited(path: Position[], dots: Dot[]): boolean {
  const visitedDots = new Set<number>();

  for (const pathPos of path) {
    const dotAtPosition = dots.find(
      (dot) => dot.position.x === pathPos.x && dot.position.y === pathPos.y,
    );
    if (dotAtPosition) {
      visitedDots.add(dotAtPosition.number);
    }
  }

  return visitedDots.size === dots.length;
}

/**
 * Check if the path covers the entire grid
 */
export function isGridFullyCovered(
  path: Position[],
  gridSize: number,
): boolean {
  return path.length === gridSize * gridSize;
}

/**
 * Validate if the puzzle is complete
 */
export function isPuzzleComplete(
  path: Position[],
  dots: Dot[],
  gridSize: number,
): boolean {
  return (
    validateDotOrder(path, dots) &&
    areAllDotsVisited(path, dots) &&
    isGridFullyCovered(path, gridSize)
  );
}

/**
 * Get the next expected dot number based on the current path
 */
export function getNextExpectedDot(path: Position[], dots: Dot[]): number {
  let connectedDots = 0;

  for (const pathPos of path) {
    const dotAtPath = dots.find(
      (dot) => dot.position.x === pathPos.x && dot.position.y === pathPos.y,
    );
    if (dotAtPath) {
      connectedDots = Math.max(connectedDots, dotAtPath.number);
    }
  }

  return connectedDots + 1;
}

/**
 * Check if a path segment is valid (no crossing, proper adjacency)
 */
export function isValidPathSegment(
  currentPath: Position[],
  newPosition: Position,
  gridSize: number,
): boolean {
  // Check bounds
  if (
    newPosition.x < 0 ||
    newPosition.x >= gridSize ||
    newPosition.y < 0 ||
    newPosition.y >= gridSize
  ) {
    return false;
  }

  // Check if position is already in path
  if (isPositionInPath(newPosition, currentPath)) {
    // Allow if it's the previous position (for backing up)
    const lastIndex = currentPath.length - 1;
    const secondLastIndex = lastIndex - 1;
    return (
      secondLastIndex >= 0 &&
      currentPath[secondLastIndex].x === newPosition.x &&
      currentPath[secondLastIndex].y === newPosition.y
    );
  }

  // Check adjacency to last position
  if (currentPath.length > 0) {
    const lastPosition = currentPath[currentPath.length - 1];
    return arePositionsAdjacent(lastPosition, newPosition);
  }

  return true;
}

/**
 * Generate sample puzzle dots for testing
 */
export function generateSampleDots(gridSize: number): Dot[] {
  const dots: Dot[] = [];

  switch (gridSize) {
    case 3:
      dots.push(
        { position: { x: 0, y: 0 }, number: 1 },
        { position: { x: 1, y: 2 }, number: 2 },
        { position: { x: 2, y: 1 }, number: 3 },
      );
      break;
    case 4:
      dots.push(
        { position: { x: 0, y: 1 }, number: 1 },
        { position: { x: 1, y: 3 }, number: 2 },
        { position: { x: 3, y: 2 }, number: 3 },
        { position: { x: 2, y: 0 }, number: 4 },
      );
      break;
    case 5:
      dots.push(
        { position: { x: 0, y: 0 }, number: 1 },
        { position: { x: 2, y: 1 }, number: 2 },
        { position: { x: 1, y: 4 }, number: 3 },
        { position: { x: 4, y: 3 }, number: 4 },
        { position: { x: 3, y: 2 }, number: 5 },
      );
      break;
    case 6:
      dots.push(
        { position: { x: 0, y: 1 }, number: 1 },
        { position: { x: 2, y: 0 }, number: 2 },
        { position: { x: 1, y: 3 }, number: 3 },
        { position: { x: 4, y: 2 }, number: 4 },
        { position: { x: 3, y: 5 }, number: 5 },
        { position: { x: 5, y: 4 }, number: 6 },
      );
      break;
    default:
      // Fallback for other sizes
      dots.push(
        { position: { x: 0, y: 0 }, number: 1 },
        { position: { x: gridSize - 1, y: gridSize - 1 }, number: 2 },
      );
  }

  return dots;
}
