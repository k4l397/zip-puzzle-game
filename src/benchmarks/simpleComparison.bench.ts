import { bench, describe } from 'vitest'
import { PuzzleGenerator } from '../utils/puzzleGenerator'
import { SimpleOptimizedGenerator, generateSimpleOptimizedPuzzle, generateFastOptimizedPuzzle } from '../utils/simpleOptimizedGenerator'

describe('Simple Optimization Comparison', () => {
  // 4x4 - Should be similar performance
  bench('4x4 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 2000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 15 })

  bench('4x4 - Simple Optimized', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 4 })
    const result = await generator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 2000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 15 })

  // 5x5 - Where problems start showing up
  bench('5x5 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 3000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 12 })

  bench('5x5 - Simple Optimized', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 3000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 12 })

  // 6x6 - Major performance cliff
  bench('6x6 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 5000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 8 })

  bench('6x6 - Simple Optimized', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 5000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 8 })

  // 7x7 - Very slow territory
  bench('7x7 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 7 })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 8000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 5 })

  bench('7x7 - Simple Optimized', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 7 })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 8000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 5 })

  // 8x8 - Ultimate test
  bench('8x8 - Current Algorithm', async () => {
    const generator = new PuzzleGenerator({ gridSize: 8 })
    const result = await generator.generatePuzzle({
      gridSize: 8,
      maxAttempts: 1,
      timeout: 15000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 3 })

  bench('8x8 - Simple Optimized', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 8 })
    const result = await generator.generatePuzzle({
      gridSize: 8,
      maxAttempts: 1,
      timeout: 15000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 3 })
})

describe('Success Rate Analysis', () => {
  // Quick success tests with short timeouts to measure algorithm efficiency
  bench('5x5 Current - Quick Success', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    let successes = 0
    const total = 5

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 1000 // Very short timeout
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 5 })

  bench('5x5 Optimized - Quick Success', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 5 })
    let successes = 0
    const total = 5

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 1000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 5 })

  bench('6x6 Current - Quick Success', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    let successes = 0
    const total = 3

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 1,
        timeout: 2000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 5 })

  bench('6x6 Optimized - Quick Success', async () => {
    const generator = new SimpleOptimizedGenerator({ gridSize: 6 })
    let successes = 0
    const total = 3

    for (let i = 0; i < total; i++) {
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 1,
        timeout: 2000
      })
      if (result.success) successes++
    }

    return { successes, total, rate: (successes / total) * 100 }
  }, { iterations: 5 })
})

describe('Convenience Functions', () => {
  bench('5x5 - Convenience Function', async () => {
    const result = await generateSimpleOptimizedPuzzle(5)
    return result.success ? 'success' : 'fail'
  }, { iterations: 10 })

  bench('5x5 - Fast Generation', async () => {
    const result = await generateFastOptimizedPuzzle(5)
    return result.success ? 'success' : 'fail'
  }, { iterations: 10 })

  bench('6x6 - Convenience Function', async () => {
    const result = await generateSimpleOptimizedPuzzle(6)
    return result.success ? 'success' : 'fail'
  }, { iterations: 8 })

  bench('6x6 - Fast Generation', async () => {
    const result = await generateFastOptimizedPuzzle(6)
    return result.success ? 'success' : 'fail'
  }, { iterations: 8 })
})

describe('User Experience Simulation', () => {
  // Simulate the exact scenario where browser freezes occur
  bench('User Clicks New 6x6 Game - Current', async () => {
    // User clicks "New Game" button
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 10, // Default attempts
      timeout: 5000    // Default timeout
    })

    return {
      success: result.success,
      wouldFreezeBrowser: true // Long generation time blocks UI
    }
  }, { iterations: 5 })

  bench('User Clicks New 6x6 Game - Optimized', async () => {
    const result = await generateFastOptimizedPuzzle(6)

    return {
      success: result.success,
      wouldFreezeBrowser: false // Should be much faster
    }
  }, { iterations: 5 })

  bench('User Clicks New 7x7 Game - Current', async () => {
    const generator = new PuzzleGenerator({ gridSize: 7 })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 10,
      timeout: 5000
    })

    return {
      success: result.success,
      wouldFreezeBrowser: true
    }
  }, { iterations: 3 })

  bench('User Clicks New 7x7 Game - Optimized', async () => {
    const result = await generateFastOptimizedPuzzle(7)

    return {
      success: result.success,
      wouldFreezeBrowser: false
    }
  }, { iterations: 3 })
})

describe('Stress Test', () => {
  // Rapid generation test
  bench('Rapid 5x5 Generation - Current', async () => {
    const results = []
    for (let i = 0; i < 3; i++) {
      const generator = new PuzzleGenerator({ gridSize: 5 })
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 3,
        timeout: 2000
      })
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 3 }
  }, { iterations: 5 })

  bench('Rapid 5x5 Generation - Optimized', async () => {
    const results = []
    for (let i = 0; i < 3; i++) {
      const result = await generateFastOptimizedPuzzle(5)
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 3 }
  }, { iterations: 5 })

  bench('Mixed Sizes - Current', async () => {
    const sizes = [4, 5, 6, 5, 4]
    const results = []

    for (const size of sizes) {
      const generator = new PuzzleGenerator({ gridSize: size })
      const result = await generator.generatePuzzle({
        gridSize: size,
        maxAttempts: 2,
        timeout: 3000
      })
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 5 }
  }, { iterations: 3 })

  bench('Mixed Sizes - Optimized', async () => {
    const sizes = [4, 5, 6, 5, 4]
    const results = []

    for (const size of sizes) {
      const result = await generateFastOptimizedPuzzle(size)
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 5 }
  }, { iterations: 3 })
})

describe('Consistency Test', () => {
  bench('5x5 Current - Timing Consistency', async () => {
    const times = []

    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      const generator = new PuzzleGenerator({ gridSize: 5 })
      await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 2000
      })
      const end = performance.now()
      times.push(end - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length

    return { avg, variance, times }
  }, { iterations: 5 })

  bench('5x5 Optimized - Timing Consistency', async () => {
    const times = []

    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      await generateSimpleOptimizedPuzzle(5)
      const end = performance.now()
      times.push(end - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length

    return { avg, variance, times }
  }, { iterations: 5 })
})
