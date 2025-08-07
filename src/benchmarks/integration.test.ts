import { describe, it, expect } from 'vitest'
import { generateZipPuzzle, generateFastZipPuzzle, generateLegacyZipPuzzle } from '../utils/puzzleGenerator'

describe('Puzzle Generator Integration', () => {
  it('should generate puzzles using optimized algorithm by default', async () => {
    const result = await generateZipPuzzle(4)

    expect(result.success).toBe(true)
    expect(result.puzzle).toBeDefined()
    expect(result.puzzle?.id).toContain('optimized-puzzle')
    expect(result.puzzle?.gridSize).toBe(4)
    expect(result.puzzle?.solutionPath).toHaveLength(16) // 4x4 = 16 cells
  })

  it('should generate fast puzzles for better UX', async () => {
    const startTime = performance.now()
    const result = await generateFastZipPuzzle(5)
    const endTime = performance.now()

    expect(result.success).toBe(true)
    expect(result.puzzle).toBeDefined()
    expect(endTime - startTime).toBeLessThan(100) // Should be very fast
  })

  it('should support legacy generation as fallback', async () => {
    const result = await generateLegacyZipPuzzle(3)

    expect(result.success).toBe(true)
    expect(result.puzzle).toBeDefined()
    expect(result.puzzle?.id).toContain('legacy-puzzle')
  })

  it('should handle larger grids efficiently', async () => {
    const startTime = performance.now()
    const result = await generateZipPuzzle(6)
    const endTime = performance.now()

    expect(result.success).toBe(true)
    expect(result.puzzle).toBeDefined()
    expect(result.puzzle?.solutionPath).toHaveLength(36) // 6x6 = 36 cells
    expect(endTime - startTime).toBeLessThan(500) // Should complete quickly
  })

  it('should generate valid puzzle structure', async () => {
    const result = await generateZipPuzzle(4)

    expect(result.success).toBe(true)

    const puzzle = result.puzzle!
    expect(puzzle.dots).toBeDefined()
    expect(puzzle.dots.length).toBeGreaterThanOrEqual(2)
    expect(puzzle.solutionPath).toBeDefined()
    expect(puzzle.solutionPath.length).toBe(16)

    // Check dots are numbered correctly
    const sortedDots = puzzle.dots.sort((a, b) => a.number - b.number)
    for (let i = 0; i < sortedDots.length; i++) {
      expect(sortedDots[i].number).toBe(i + 1)
    }

    // Check path continuity
    for (let i = 1; i < puzzle.solutionPath.length; i++) {
      const prev = puzzle.solutionPath[i - 1]
      const curr = puzzle.solutionPath[i]
      const dx = Math.abs(curr.x - prev.x)
      const dy = Math.abs(curr.y - prev.y)

      // Each step should be orthogonal and adjacent
      expect((dx === 1 && dy === 0) || (dx === 0 && dy === 1)).toBe(true)
    }
  })

  it('should handle edge cases gracefully', async () => {
    // Test minimum grid size
    const result3x3 = await generateZipPuzzle(3)
    expect(result3x3.success).toBe(true)

    // Test larger grid size
    const result7x7 = await generateZipPuzzle(7)
    expect(result7x7.success).toBe(true)

    // Test maximum supported size
    const result8x8 = await generateZipPuzzle(8)
    expect(result8x8.success).toBe(true)
  })

  it('should maintain puzzle variety', async () => {
    const puzzles = []

    // Generate multiple puzzles
    for (let i = 0; i < 5; i++) {
      const result = await generateZipPuzzle(4)
      expect(result.success).toBe(true)
      puzzles.push(result.puzzle!)
    }

    // Check that we get different starting positions (variety indicator)
    const startPositions = new Set(
      puzzles.map(p => `${p.solutionPath[0].x},${p.solutionPath[0].y}`)
    )

    // Should have some variety (at least 2 different starts out of 5 puzzles)
    expect(startPositions.size).toBeGreaterThanOrEqual(2)
  })

  it('should complete stress test without performance degradation', async () => {
    const results = []
    const times = []

    // Generate multiple puzzles rapidly
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now()
      const result = await generateFastZipPuzzle(5)
      const endTime = performance.now()

      results.push(result.success)
      times.push(endTime - startTime)
    }

    // All should succeed
    expect(results.every(success => success)).toBe(true)

    // Performance should remain consistent (no significant degradation)
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    expect(avgTime).toBeLessThan(50) // Average should be very fast

    // No individual generation should be too slow
    expect(Math.max(...times)).toBeLessThan(200)
  })
})
