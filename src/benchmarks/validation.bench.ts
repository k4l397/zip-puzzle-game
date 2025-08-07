import { bench, describe } from 'vitest'
import { PuzzleGenerator } from '../utils/puzzleGenerator'
import { OptimizedPuzzleGenerator } from '../utils/optimizedPuzzleGenerator'

describe('Optimization Validation', () => {
  // Test that the optimization logic is actually working
  bench('Validation - Warnsdorff Logic Test', async () => {
    // Create a simple test to verify Warnsdorff's rule is being applied
    const generator = new OptimizedPuzzleGenerator({
      gridSize: 4,
      algorithm: 'probabilistic'
    })

    // Access private methods for testing (TypeScript hack)
    const testGenerator = generator as any

    // Test position with known neighbors
    const testPos = { x: 1, y: 1 } // Center position with 4 neighbors

    // Mock the visited set to simulate a partially filled grid
    testGenerator.visited = new Set(['0,0', '0,1', '1,0'])
    testGenerator.gridSize = 4

    // Test getUnvisitedNeighbors
    const neighbors = testGenerator.getUnvisitedNeighbors(testPos)

    // Should have 2 unvisited neighbors (right and down)
    if (neighbors.length !== 2) {
      throw new Error(`Expected 2 neighbors, got ${neighbors.length}`)
    }

    // Test countUnvisitedNeighbors
    const count = testGenerator.countUnvisitedNeighbors(testPos)
    if (count !== 2) {
      throw new Error(`Expected count 2, got ${count}`)
    }

    return { neighbors: neighbors.length, count }
  }, { iterations: 10 })

  bench('Validation - Algorithm Comparison', async () => {
    // Generate the same puzzle with both algorithms and compare
    const currentGenerator = new PuzzleGenerator({ gridSize: 4 })
    const optimizedGenerator = new OptimizedPuzzleGenerator({
      gridSize: 4,
      algorithm: 'probabilistic'
    })

    const currentResult = await currentGenerator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 1000
    })

    const optimizedResult = await optimizedGenerator.generatePuzzle({
      gridSize: 4,
      maxAttempts: 1,
      timeout: 1000
    })

    return {
      currentSuccess: currentResult.success,
      optimizedSuccess: optimizedResult.success,
      bothSucceeded: currentResult.success && optimizedResult.success
    }
  }, { iterations: 20 })

  // Test pure deterministic Warnsdorff's (no randomization)
  bench('Validation - Pure Warnsdorff Test', async () => {
    // Create a deterministic version for testing
    class TestWarnsdorffGenerator extends OptimizedPuzzleGenerator {
      public async testDeterministicGeneration(gridSize: number): Promise<boolean> {
        this.gridSize = gridSize
        this.reset()
        this.startTime = Date.now()

        const startPos = { x: 0, y: 0 } // Always start at corner
        return this.testDeterministicPath(startPos)
      }

      private testDeterministicPath(pos: any): boolean {
        const key = this.positionToKey(pos)
        if (this.visited.has(key)) return false

        this.visited.add(key)
        this.path.push(pos)

        if (this.path.length === this.gridSize * this.gridSize) {
          return true // Success!
        }

        // Pure Warnsdorff's: always choose position with lowest accessibility
        const neighbors = (this as any).getUnvisitedNeighbors(pos)
        if (neighbors.length === 0) {
          // Backtrack
          this.visited.delete(key)
          this.path.pop()
          return false
        }

        // Sort by accessibility (lowest first)
        const scored = neighbors.map((neighbor: any) => ({
          position: neighbor,
          accessibility: (this as any).countUnvisitedNeighbors(neighbor)
        }))

        scored.sort((a: any, b: any) => a.accessibility - b.accessibility)

        // Try in order of accessibility
        for (const item of scored) {
          if (this.testDeterministicPath(item.position)) {
            return true
          }
        }

        // Backtrack
        this.visited.delete(key)
        this.path.pop()
        return false
      }

      public positionToKey(pos: any): string {
        return `${pos.x},${pos.y}`
      }

      public reset(): void {
        super['reset']()
      }

      public get visited() {
        return (this as any).visited
      }

      public set visited(value: any) {
        (this as any).visited = value
      }

      public get path() {
        return (this as any).path
      }
    }

    const testGen = new TestWarnsdorffGenerator({ gridSize: 4 })
    const success = await testGen.testDeterministicGeneration(4)

    return { success }
  }, { iterations: 10 })

  // Test if different algorithms produce different paths
  bench('Validation - Path Diversity Test', async () => {
    const results = {
      probabilistic: [] as any[],
      temperature: [] as any[],
      smartFallback: [] as any[]
    }

    const algorithms: ('probabilistic' | 'temperature' | 'smart-fallback')[] =
      ['probabilistic', 'temperature', 'smart-fallback']

    for (const algorithm of algorithms) {
      for (let i = 0; i < 3; i++) {
        const generator = new OptimizedPuzzleGenerator({
          gridSize: 4,
          algorithm
        })

        const result = await generator.generatePuzzle({
          gridSize: 4,
          maxAttempts: 1,
          timeout: 2000
        })

        if (result.success && result.puzzle) {
          results[algorithm].push({
            startPos: result.puzzle.solutionPath[0],
            pathLength: result.puzzle.solutionPath.length,
            firstFew: result.puzzle.solutionPath.slice(0, 3)
          })
        }
      }
    }

    // Check diversity within each algorithm
    const diversity = {
      probabilistic: 0,
      temperature: 0,
      smartFallback: 0
    }

    for (const [alg, paths] of Object.entries(results)) {
      if (paths.length > 1) {
        const uniqueStarts = new Set(
          paths.map((p: any) => `${p.startPos.x},${p.startPos.y}`)
        )
        diversity[alg as keyof typeof diversity] = uniqueStarts.size / paths.length
      }
    }

    return {
      results: {
        probabilistic: results.probabilistic.length,
        temperature: results.temperature.length,
        smartFallback: results.smartFallback.length
      },
      diversity
    }
  }, { iterations: 5 })

  // Simple performance test with very short timeout
  bench('Validation - Quick Success Rate', async () => {
    const results = { current: 0, optimized: 0 }

    // Test current algorithm
    for (let i = 0; i < 5; i++) {
      const generator = new PuzzleGenerator({ gridSize: 4 })
      const result = await generator.generatePuzzle({
        gridSize: 4,
        maxAttempts: 1,
        timeout: 500 // Very short
      })
      if (result.success) results.current++
    }

    // Test optimized algorithm
    for (let i = 0; i < 5; i++) {
      const generator = new OptimizedPuzzleGenerator({
        gridSize: 4,
        algorithm: 'probabilistic'
      })
      const result = await generator.generatePuzzle({
        gridSize: 4,
        maxAttempts: 1,
        timeout: 500
      })
      if (result.success) results.optimized++
    }

    return {
      currentSuccessRate: (results.current / 5) * 100,
      optimizedSuccessRate: (results.optimized / 5) * 100,
      improvement: results.optimized - results.current
    }
  }, { iterations: 5 })

  // Test the different algorithm strategies
  bench('Validation - Strategy Effectiveness', async () => {
    const strategies = ['probabilistic', 'temperature', 'smart-fallback'] as const
    const results: Record<string, { successes: number, totalTime: number }> = {}

    for (const strategy of strategies) {
      results[strategy] = { successes: 0, totalTime: 0 }

      for (let i = 0; i < 3; i++) {
        const start = performance.now()

        const generator = new OptimizedPuzzleGenerator({
          gridSize: 5,
          algorithm: strategy
        })

        const result = await generator.generatePuzzle({
          gridSize: 5,
          maxAttempts: 1,
          timeout: 3000
        })

        const end = performance.now()
        results[strategy].totalTime += (end - start)

        if (result.success) {
          results[strategy].successes++
        }
      }
    }

    // Find best performing strategy
    let bestStrategy = 'none'
    let bestScore = -1

    for (const [strategy, data] of Object.entries(results)) {
      // Score = success rate - normalized time penalty
      const successRate = data.successes / 3
      const avgTime = data.totalTime / 3
      const normalizedTime = Math.min(avgTime / 1000, 1) // Normalize to 0-1
      const score = successRate - (normalizedTime * 0.5) // Weight time less than success

      if (score > bestScore) {
        bestScore = score
        bestStrategy = strategy
      }
    }

    return {
      results,
      bestStrategy,
      bestScore
    }
  }, { iterations: 3 })
})
