import { bench, describe } from 'vitest'
import { PuzzleGenerator } from '../utils/puzzleGenerator'
import { OptimizedPuzzleGenerator, generateOptimizedZipPuzzle } from '../utils/optimizedPuzzleGenerator'

describe('Focused Performance Analysis', () => {
  // Test success rates with short timeouts to isolate algorithm efficiency
  bench('5x5 Current - Quick Success', async () => {
    const generator = new PuzzleGenerator({ gridSize: 5 })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 1000 // Very short timeout
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 20 })

  bench('5x5 Optimized - Quick Success', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 5,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 5,
      maxAttempts: 1,
      timeout: 1000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 20 })

  bench('6x6 Current - Quick Success', async () => {
    const generator = new PuzzleGenerator({ gridSize: 6 })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 2000 // Short timeout
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 15 })

  bench('6x6 Optimized - Quick Success', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 6,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 6,
      maxAttempts: 1,
      timeout: 2000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 15 })

  bench('7x7 Current - Quick Success', async () => {
    const generator = new PuzzleGenerator({ gridSize: 7 })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 3000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 10 })

  bench('7x7 Optimized - Quick Success', async () => {
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 7,
      algorithm: 'probabilistic'
    })
    const result = await generator.generatePuzzle({
      gridSize: 7,
      maxAttempts: 1,
      timeout: 3000
    })
    return result.success ? 'success' : 'fail'
  }, { iterations: 10 })
})

describe('Raw Speed - Successful Generations Only', () => {
  // Only measure time for successful generations
  bench('5x5 Current - Success Only', async () => {
    let attempts = 0
    let success = false
    const generator = new PuzzleGenerator({ gridSize: 5 })

    while (!success && attempts < 5) {
      attempts++
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 5000
      })
      if (result.success) {
        success = true
        return { attempts, success: true }
      }
    }

    return { attempts, success: false }
  }, { iterations: 10 })

  bench('5x5 Optimized - Success Only', async () => {
    let attempts = 0
    let success = false

    while (!success && attempts < 5) {
      attempts++
      const result = await generateOptimizedZipPuzzle(5, 'probabilistic')
      if (result.success) {
        success = true
        return { attempts, success: true }
      }
    }

    return { attempts, success: false }
  }, { iterations: 10 })

  bench('6x6 Current - Success Only', async () => {
    let attempts = 0
    let success = false
    const generator = new PuzzleGenerator({ gridSize: 6 })

    while (!success && attempts < 3) {
      attempts++
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 1,
        timeout: 8000
      })
      if (result.success) {
        success = true
        return { attempts, success: true }
      }
    }

    return { attempts, success: false }
  }, { iterations: 8 })

  bench('6x6 Optimized - Success Only', async () => {
    let attempts = 0
    let success = false

    while (!success && attempts < 3) {
      attempts++
      const result = await generateOptimizedZipPuzzle(6, 'probabilistic')
      if (result.success) {
        success = true
        return { attempts, success: true }
      }
    }

    return { attempts, success: false }
  }, { iterations: 8 })
})

describe('Browser Freeze Test', () => {
  // Simulate the exact user experience - multiple rapid generations
  bench('User Experience - Current 6x6', async () => {
    // Simulate user clicking "New Game" 3 times rapidly
    const results = []
    for (let i = 0; i < 3; i++) {
      const generator = new PuzzleGenerator({ gridSize: 6 })
      const result = await generator.generatePuzzle({
        gridSize: 6,
        maxAttempts: 5, // Default attempts
        timeout: 5000 // Default timeout
      })
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 3, rate: (successCount / 3) * 100 }
  }, { iterations: 3 })

  bench('User Experience - Optimized 6x6', async () => {
    const results = []
    for (let i = 0; i < 3; i++) {
      const result = await generateOptimizedZipPuzzle(6, 'probabilistic')
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 3, rate: (successCount / 3) * 100 }
  }, { iterations: 3 })

  bench('User Experience - Current 7x7', async () => {
    const results = []
    for (let i = 0; i < 2; i++) {
      const generator = new PuzzleGenerator({ gridSize: 7 })
      const result = await generator.generatePuzzle({
        gridSize: 7,
        maxAttempts: 3,
        timeout: 8000
      })
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 2, rate: (successCount / 2) * 100 }
  }, { iterations: 2 })

  bench('User Experience - Optimized 7x7', async () => {
    const results = []
    for (let i = 0; i < 2; i++) {
      const result = await generateOptimizedZipPuzzle(7, 'probabilistic')
      results.push(result.success)
    }

    const successCount = results.filter(Boolean).length
    return { successCount, total: 2, rate: (successCount / 2) * 100 }
  }, { iterations: 2 })
})

describe('Algorithm Consistency', () => {
  // Test consistency of generation times
  bench('5x5 Current - Consistency Test', async () => {
    const times = []

    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      const generator = new PuzzleGenerator({ gridSize: 5 })
      const result = await generator.generatePuzzle({
        gridSize: 5,
        maxAttempts: 1,
        timeout: 3000
      })
      const end = performance.now()
      times.push(end - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
    const stdDev = Math.sqrt(variance)

    return { avg, stdDev, consistency: stdDev / avg }
  }, { iterations: 5 })

  bench('5x5 Optimized - Consistency Test', async () => {
    const times = []

    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      const result = await generateOptimizedZipPuzzle(5, 'probabilistic')
      const end = performance.now()
      times.push(end - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
    const stdDev = Math.sqrt(variance)

    return { avg, stdDev, consistency: stdDev / avg }
  }, { iterations: 5 })
})

describe('Memory Usage Simulation', () => {
  // Test for potential memory leaks or excessive allocations
  bench('Current Algorithm - Memory Test', async () => {
    const results = []

    // Generate 10 puzzles rapidly to test memory usage
    for (let i = 0; i < 10; i++) {
      const generator = new PuzzleGenerator({ gridSize: 4 })
      const result = await generator.generatePuzzle({
        gridSize: 4,
        maxAttempts: 1,
        timeout: 2000
      })
      results.push(result.success)

      // Simulate some processing delay
      await new Promise(resolve => setTimeout(resolve, 1))
    }

    return { successes: results.filter(Boolean).length, total: 10 }
  }, { iterations: 5 })

  bench('Optimized Algorithm - Memory Test', async () => {
    const results = []

    for (let i = 0; i < 10; i++) {
      const result = await generateOptimizedZipPuzzle(4, 'probabilistic')
      results.push(result.success)
      await new Promise(resolve => setTimeout(resolve, 1))
    }

    return { successes: results.filter(Boolean).length, total: 10 }
  }, { iterations: 5 })
})
