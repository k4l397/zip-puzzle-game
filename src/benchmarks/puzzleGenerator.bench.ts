import { bench, describe } from 'vitest'
import { PuzzleGenerator, generateZipPuzzle } from '../utils/puzzleGenerator'
import { DEFAULT_DOTS_PER_GRID_SIZE } from '../constants/config'

describe('Puzzle Generation Performance', () => {
  // Test smaller grids (should be fast)
  bench('3x3 puzzle generation', async () => {
    const result = await generateZipPuzzle(3)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 20 })

  bench('4x4 puzzle generation', async () => {
    const result = await generateZipPuzzle(4)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 15 })

  bench('5x5 puzzle generation', async () => {
    const result = await generateZipPuzzle(5)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 10 })

  // Test problematic larger grids
  bench('6x6 puzzle generation (problematic)', async () => {
    const result = await generateZipPuzzle(6)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 5, time: 30000 }) // 30 second timeout

  bench('7x7 puzzle generation (very slow)', async () => {
    const result = await generateZipPuzzle(7)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 3, time: 60000 }) // 60 second timeout

  bench('8x8 puzzle generation (extremely slow)', async () => {
    const result = await generateZipPuzzle(8)
    if (!result.success) {
      throw new Error('Puzzle generation failed')
    }
  }, { iterations: 2, time: 120000 }) // 2 minute timeout
})

describe('Puzzle Generation Success Rate', () => {
  bench('4x4 single attempt success rate', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1, // Single attempt only
      timeout: 5000
    })
    // Don't throw on failure - we're measuring success rate
  }, { iterations: 50 })

  bench('5x5 single attempt success rate', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 30 })

  bench('6x6 single attempt success rate', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 10000
    })
  }, { iterations: 20 })
})

describe('Algorithm Comparison Setup', () => {
  // This will be our baseline - we'll add optimized versions later
  bench('current algorithm - 4x4', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      dotCount: DEFAULT_DOTS_PER_GRID_SIZE[4],
      maxAttempts: 1,
      timeout: 5000
    })
    if (!result.success) {
      throw new Error('Generation failed')
    }
  }, { iterations: 20 })

  bench('current algorithm - 5x5', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      dotCount: DEFAULT_DOTS_PER_GRID_SIZE[5],
      maxAttempts: 1,
      timeout: 8000
    })
    if (!result.success) {
      throw new Error('Generation failed')
    }
  }, { iterations: 15 })

  bench('current algorithm - 6x6', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      dotCount: DEFAULT_DOTS_PER_GRID_SIZE[6],
      maxAttempts: 1,
      timeout: 15000
    })
    if (!result.success) {
      throw new Error('Generation failed')
    }
  }, { iterations: 8 })
})

describe('Stress Tests', () => {
  bench('rapid 3x3 generation', async () => {
    // Generate 10 puzzles in rapid succession
    for (let i = 0; i < 10; i++) {
      const result = await generateZipPuzzle(3)
      if (!result.success) {
        throw new Error(`Puzzle ${i + 1} generation failed`)
      }
    }
  }, { iterations: 5 })

  bench('rapid 4x4 generation', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await generateZipPuzzle(4)
      if (!result.success) {
        throw new Error(`Puzzle ${i + 1} generation failed`)
      }
    }
  }, { iterations: 5 })
})

// Helper to measure puzzle variety
describe('Puzzle Quality Metrics', () => {
  bench('puzzle path diversity - 4x4', async () => {
    const puzzles = []

    // Generate 10 puzzles
    for (let i = 0; i < 10; i++) {
      const result = await generateZipPuzzle(4)
      if (result.success && result.puzzle) {
        puzzles.push(result.puzzle)
      }
    }

    // Quick diversity check - ensure we got different puzzles
    if (puzzles.length < 5) {
      throw new Error('Not enough successful generations')
    }

    // Simple diversity metric - count unique starting positions
    const startPositions = new Set(
      puzzles.map(p => `${p.solutionPath[0].x},${p.solutionPath[0].y}`)
    )

    if (startPositions.size < 2) {
      console.warn('Low puzzle diversity detected')
    }
  }, { iterations: 5, time: 30000 })
})
