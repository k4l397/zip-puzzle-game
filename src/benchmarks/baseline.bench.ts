import { bench, describe } from 'vitest'
import { PuzzleGenerator } from '../utils/puzzleGenerator'

describe('Baseline Performance - Current Algorithm', () => {
  // Quick tests for small grids
  bench('3x3 current algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 3 })
    const result = await generator.generatePuzzle({
      gridSize: 3,
      maxAttempts: 1,
      timeout: 2000
    })
    // Don't throw - we want to measure including failures
  }, { iterations: 10 })

  bench('4x4 current algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 3000
    })
  }, { iterations: 8 })

  bench('5x5 current algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 5 })

  bench('6x6 current algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 10000
    })
  }, { iterations: 3 })
})

describe('Success Rate Analysis', () => {
  bench('4x4 success rate test', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    let successes = 0

    // Try 5 quick attempts
    for (let i = 0; i < 5; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 4,
        maxAttempts: 1,
        timeout: 1000
      })
      if (result.success) successes++
    }

    // Just measuring time, not asserting success
    return { successes, total: 5 }
  }, { iterations: 3 })

  bench('5x5 success rate test', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    let successes = 0

    for (let i = 0; i < 3; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 2000
      })
      if (result.success) successes++
    }

    return { successes, total: 3 }
  }, { iterations: 3 })
})
