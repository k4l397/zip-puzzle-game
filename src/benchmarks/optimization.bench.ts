import { bench, describe } from 'vitest'
import { PuzzleGenerator } from '../utils/puzzleGenerator'
import { OptimizedPuzzleGenerator, generateOptimizedZipPuzzle, generateAdaptiveZipPuzzle } from '../utils/optimizedPuzzleGenerator'

describe('Algorithm Performance Comparison', () => {
  // 4x4 Grid Comparison
  bench('4x4 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 3000
    })
  }, { iterations: 20 })

  bench('4x4 - Optimized Probabilistic', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 4,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 3000
    })
  }, { iterations: 20 })

  bench('4x4 - Optimized Temperature', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 4,
      algorithm: 'temperature'
    })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 3000
    })
  }, { iterations: 20 })

  // 5x5 Grid Comparison (where problems start)
  bench('5x5 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 10 })

  bench('5x5 - Optimized Probabilistic', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 10 })

  bench('5x5 - Optimized Smart Fallback', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'smart-fallback'
    })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 10 })

  // 6x6 Grid Comparison (major performance cliff)
  bench('6x6 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 10000
    })
  }, { iterations: 5 })

  bench('6x6 - Optimized Probabilistic', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 6,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 10000
    })
  }, { iterations: 5 })

  bench('6x6 - Adaptive Algorithm', async () => {
    const result = await generateAdaptiveZipPuzzle(6)
  }, { iterations: 5 })

  // 7x7 Grid - The real challenge
  bench('7x7 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 7 })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 15000
    })
  }, { iterations: 3 })

  bench('7x7 - Optimized Probabilistic', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 7,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 15000
    })
  }, { iterations: 3 })

  // 8x8 Grid - Ultimate test
  bench('8x8 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 8 })
    const result = await generator.generatePuzzle({
      gridSize: 8,
      maxAttempts: 1,
      timeout: 30000 // 30 seconds
    })
  }, { iterations: 2 })

  bench('8x8 - Optimized Probabilistic', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 8,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 8,
      maxAttempts: 1,
      timeout: 30000
    })
  }, { iterations: 2 })
})

describe('Success Rate Analysis', () => {
  bench('5x5 Current - Success Rate Test', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    let successes = 0
    const total = 5

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 3000 // Shorter timeout to measure quick success rate
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 3 })

  bench('5x5 Optimized - Success Rate Test', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'probabilistic'
    })
    let successes = 0
    const total = 5

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 3000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 3 })

  bench('6x6 Current - Success Rate Test', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    let successes = 0
    const total = 3

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 1,
        timeout: 5000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 3 })

  bench('6x6 Optimized - Success Rate Test', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 6,
      algorithm: 'probabilistic'
    })
    let successes = 0
    const total = 3

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 1,
        timeout: 5000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 3 })
})

describe('Algorithm Variety Tests', () => {
  bench('Temperature Algorithm - 5x5', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'temperature'
    })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 8 })

  bench('Smart Fallback Algorithm - 5x5', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'smart-fallback'
    })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 5000
    })
  }, { iterations: 8 })

  bench('Convenience Function - Optimized 5x5', async () => {
    const result = await generateOptimizedZipPuzzle(5, 'probabilistic')
  }, { iterations: 8 })

  bench('Adaptive Multi-Algorithm - 5x5', async () => {
    const result = await generateAdaptiveZipPuzzle(5)
  }, { iterations: 8 })
})

describe('Stress Tests', () => {
  bench('Rapid 5x5 Current Generation', async () => {
    for (let i = 0; i < 3; i++) {
      const generator = new PuzzleGenerator({ gridSize: 5 })
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 2000
      })
    }
  }, { iterations: 5 })

  bench('Rapid 5x5 Optimized Generation', async () => {
    for (let i = 0; i < 3; i++) {
      const result = await generateOptimizedZipPuzzle(5, 'probabilistic')
    }
  }, { iterations: 5 })

  bench('Mixed Grid Sizes - Current', async () => {
    const sizes = [4, 5, 4, 6, 5]
    for (const size of sizes) {
      const generator = new PuzzleGenerator({ gridSize: size })
      const result = await generator.generatePuzzle({
        gridSize: size,
        maxAttempts: 1,
        timeout: 3000
      })
    }
  }, { iterations: 3 })

  bench('Mixed Grid Sizes - Optimized', async () => {
    const sizes = [4, 5, 4, 6, 5]
    for (const size of sizes) {
      const result = await generateOptimizedZipPuzzle(size, 'probabilistic')
    }
  }, { iterations: 3 })
})
