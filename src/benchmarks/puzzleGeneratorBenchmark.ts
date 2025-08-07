import type { Puzzle, Position } from '../types/game';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import { DEFAULT_DOTS_PER_GRID_SIZE } from '../constants/config';

interface BenchmarkResult {
  gridSize: number;
  algorithm: string;
  attempts: number;
  successful: number;
  failed: number;
  averageTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  successRate: number;
  puzzleVariety: number; // Measure of path diversity
  totalTimeMs: number;
}

interface BenchmarkConfig {
  gridSizes: number[];
  attemptsPerSize: number;
  timeout: number;
  algorithms: string[];
}

export class PuzzleGeneratorBenchmark {
  private results: BenchmarkResult[] = [];
  private config: BenchmarkConfig;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = {
      gridSizes: [3, 4, 5, 6, 7, 8],
      attemptsPerSize: 20,
      timeout: 10000, // 10 seconds max per attempt
      algorithms: ['current'],
      ...config
    };
  }

  /**
   * Run complete benchmark suite
   */
  public async runBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Puzzle Generation Benchmarks...');
    console.log(`Grid sizes: ${this.config.gridSizes.join(', ')}`);
    console.log(`Attempts per size: ${this.config.attemptsPerSize}`);
    console.log(`Timeout: ${this.config.timeout}ms`);
    console.log('');

    this.results = [];

    for (const algorithm of this.config.algorithms) {
      console.log(`📊 Testing algorithm: ${algorithm}`);

      for (const gridSize of this.config.gridSizes) {
        const result = await this.benchmarkGridSize(gridSize, algorithm);
        this.results.push(result);
        this.printResult(result);
      }
      console.log('');
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Benchmark a specific grid size with an algorithm
   */
  private async benchmarkGridSize(gridSize: number, algorithm: string): Promise<BenchmarkResult> {
    const times: number[] = [];
    const puzzles: Puzzle[] = [];
    let successful = 0;
    let failed = 0;

    console.log(`  Testing ${gridSize}x${gridSize} grid...`);

    for (let i = 0; i < this.config.attemptsPerSize; i++) {
      const startTime = performance.now();

      try {
        const generator = new PuzzleGenerator({
          gridSize,
          timeout: this.config.timeout
        });

        const result = await generator.generatePuzzle({
          gridSize,
          dotCount: DEFAULT_DOTS_PER_GRID_SIZE[gridSize] || Math.floor(gridSize * 1.5),
          maxAttempts: 1, // Single attempt for consistent timing
          timeout: this.config.timeout
        });

        const endTime = performance.now();
        const duration = endTime - startTime;

        if (result.success && result.puzzle) {
          successful++;
          times.push(duration);
          puzzles.push(result.puzzle);
        } else {
          failed++;
          times.push(this.config.timeout); // Count timeouts as max time
        }
      } catch (error) {
        failed++;
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Progress indicator
      if ((i + 1) % 5 === 0) {
        console.log(`    Progress: ${i + 1}/${this.config.attemptsPerSize}`);
      }
    }

    const successfulTimes = times.slice(0, successful);
    const averageTime = successfulTimes.length > 0
      ? successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length
      : this.config.timeout;

    const minTime = successfulTimes.length > 0 ? Math.min(...successfulTimes) : this.config.timeout;
    const maxTime = successfulTimes.length > 0 ? Math.max(...successfulTimes) : this.config.timeout;

    return {
      gridSize,
      algorithm,
      attempts: this.config.attemptsPerSize,
      successful,
      failed,
      averageTimeMs: averageTime,
      minTimeMs: minTime,
      maxTimeMs: maxTime,
      successRate: (successful / this.config.attemptsPerSize) * 100,
      puzzleVariety: this.calculatePuzzleVariety(puzzles),
      totalTimeMs: times.reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Calculate puzzle variety score based on path diversity
   */
  private calculatePuzzleVariety(puzzles: Puzzle[]): number {
    if (puzzles.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    // Compare each puzzle with every other puzzle
    for (let i = 0; i < puzzles.length - 1; i++) {
      for (let j = i + 1; j < puzzles.length; j++) {
        totalSimilarity += this.calculatePathSimilarity(
          puzzles[i].solutionPath,
          puzzles[j].solutionPath
        );
        comparisons++;
      }
    }

    const averageSimilarity = totalSimilarity / comparisons;
    // Convert similarity to variety (lower similarity = higher variety)
    return Math.max(0, 100 - (averageSimilarity * 100));
  }

  /**
   * Calculate similarity between two paths (0 = identical, 1 = completely different)
   */
  private calculatePathSimilarity(path1: Position[], path2: Position[]): number {
    if (path1.length !== path2.length) return 1;

    let differences = 0;
    for (let i = 0; i < path1.length; i++) {
      if (path1[i].x !== path2[i].x || path1[i].y !== path2[i].y) {
        differences++;
      }
    }

    return differences / path1.length;
  }

  /**
   * Print individual benchmark result
   */
  private printResult(result: BenchmarkResult): void {
    const { gridSize, algorithm, successful, failed, averageTimeMs, successRate, puzzleVariety } = result;

    console.log(`    ${gridSize}x${gridSize} Results:`);
    console.log(`      Success Rate: ${successRate.toFixed(1)}% (${successful}/${successful + failed})`);
    console.log(`      Average Time: ${averageTimeMs.toFixed(1)}ms`);
    console.log(`      Min Time: ${result.minTimeMs.toFixed(1)}ms`);
    console.log(`      Max Time: ${result.maxTimeMs.toFixed(1)}ms`);
    console.log(`      Puzzle Variety: ${puzzleVariety.toFixed(1)}%`);

    // Performance classification
    if (averageTimeMs < 100) {
      console.log(`      ⚡ FAST`);
    } else if (averageTimeMs < 1000) {
      console.log(`      🐌 SLOW`);
    } else {
      console.log(`      🔥 VERY SLOW`);
    }
    console.log('');
  }

  /**
   * Print comprehensive summary
   */
  private printSummary(): void {
    console.log('📈 BENCHMARK SUMMARY');
    console.log('='.repeat(50));

    // Group results by algorithm
    const algorithmGroups = this.groupBy(this.results, 'algorithm');

    Object.entries(algorithmGroups).forEach(([algorithm, results]) => {
      console.log(`\n🔍 Algorithm: ${algorithm.toUpperCase()}`);
      console.log('-'.repeat(30));

      results.forEach(result => {
        const status = result.successRate >= 80 ? '✅' : result.successRate >= 50 ? '⚠️' : '❌';
        console.log(
          `${status} ${result.gridSize}x${result.gridSize}: ` +
          `${result.averageTimeMs.toFixed(0)}ms avg, ` +
          `${result.successRate.toFixed(0)}% success, ` +
          `${result.puzzleVariety.toFixed(0)}% variety`
        );
      });

      // Algorithm performance summary
      const avgTime = results.reduce((sum, r) => sum + r.averageTimeMs, 0) / results.length;
      const avgSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
      const avgVariety = results.reduce((sum, r) => sum + r.puzzleVariety, 0) / results.length;

      console.log(`\n📊 ${algorithm} Overall:`);
      console.log(`   Average Time: ${avgTime.toFixed(1)}ms`);
      console.log(`   Average Success Rate: ${avgSuccess.toFixed(1)}%`);
      console.log(`   Average Variety: ${avgVariety.toFixed(1)}%`);
    });

    // Performance recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));

    const problematicSizes = this.results.filter(r => r.averageTimeMs > 2000 || r.successRate < 50);
    if (problematicSizes.length > 0) {
      console.log('⚠️  Problematic grid sizes:');
      problematicSizes.forEach(result => {
        console.log(`   ${result.gridSize}x${result.gridSize}: ${result.averageTimeMs.toFixed(0)}ms, ${result.successRate.toFixed(0)}% success`);
      });
      console.log('   → Consider algorithm optimization or alternative strategies');
    } else {
      console.log('✅ All grid sizes perform adequately');
    }

    const lowVariety = this.results.filter(r => r.puzzleVariety < 30);
    if (lowVariety.length > 0) {
      console.log('\n🎲 Low puzzle variety detected:');
      lowVariety.forEach(result => {
        console.log(`   ${result.gridSize}x${result.gridSize}: ${result.puzzleVariety.toFixed(0)}% variety`);
      });
      console.log('   → Consider adding more randomization');
    }
  }

  /**
   * Export results to JSON for external analysis
   */
  public exportResults(): string {
    return JSON.stringify({
      config: this.config,
      results: this.results,
      summary: this.generateSummaryStats(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Generate summary statistics
   */
  private generateSummaryStats() {
    return {
      totalTests: this.results.length,
      totalAttempts: this.results.reduce((sum, r) => sum + r.attempts, 0),
      totalSuccessful: this.results.reduce((sum, r) => sum + r.successful, 0),
      overallSuccessRate: (this.results.reduce((sum, r) => sum + r.successful, 0) /
                          this.results.reduce((sum, r) => sum + r.attempts, 0)) * 100,
      averageTime: this.results.reduce((sum, r) => sum + r.averageTimeMs, 0) / this.results.length,
      averageVariety: this.results.reduce((sum, r) => sum + r.puzzleVariety, 0) / this.results.length
    };
  }

  /**
   * Utility function to group array by property
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Compare two algorithms
   */
  public compareAlgorithms(algorithm1: string, algorithm2: string): void {
    const results1 = this.results.filter(r => r.algorithm === algorithm1);
    const results2 = this.results.filter(r => r.algorithm === algorithm2);

    if (results1.length === 0 || results2.length === 0) {
      console.log('❌ Cannot compare - missing results for one or both algorithms');
      return;
    }

    console.log(`\n🥊 ALGORITHM COMPARISON: ${algorithm1} vs ${algorithm2}`);
    console.log('='.repeat(60));

    results1.forEach(r1 => {
      const r2 = results2.find(r => r.gridSize === r1.gridSize);
      if (!r2) return;

      const timeImprovement = ((r1.averageTimeMs - r2.averageTimeMs) / r1.averageTimeMs) * 100;
      const successImprovement = r2.successRate - r1.successRate;
      const varietyChange = r2.puzzleVariety - r1.puzzleVariety;

      console.log(`\n📏 ${r1.gridSize}x${r1.gridSize} Grid:`);
      console.log(`   Time: ${r1.averageTimeMs.toFixed(0)}ms → ${r2.averageTimeMs.toFixed(0)}ms (${timeImprovement > 0 ? '+' : ''}${timeImprovement.toFixed(1)}%)`);
      console.log(`   Success: ${r1.successRate.toFixed(0)}% → ${r2.successRate.toFixed(0)}% (${successImprovement > 0 ? '+' : ''}${successImprovement.toFixed(1)}%)`);
      console.log(`   Variety: ${r1.puzzleVariety.toFixed(0)}% → ${r2.puzzleVariety.toFixed(0)}% (${varietyChange > 0 ? '+' : ''}${varietyChange.toFixed(1)}%)`);

      // Overall verdict
      if (timeImprovement > 50 && successImprovement > -10 && varietyChange > -20) {
        console.log(`   🎉 MAJOR IMPROVEMENT`);
      } else if (timeImprovement > 20 && successImprovement > -5) {
        console.log(`   ✅ GOOD IMPROVEMENT`);
      } else if (timeImprovement > 0) {
        console.log(`   🔄 MINOR IMPROVEMENT`);
      } else {
        console.log(`   📉 REGRESSION`);
      }
    });
  }
}

/**
 * Quick benchmark function for development use
 */
export async function quickBenchmark(gridSizes: number[] = [4, 5, 6]): Promise<BenchmarkResult[]> {
  const benchmark = new PuzzleGeneratorBenchmark({
    gridSizes,
    attemptsPerSize: 5, // Quick test
    timeout: 5000
  });

  return benchmark.runBenchmarks();
}

/**
 * Full benchmark for comprehensive testing
 */
export async function fullBenchmark(): Promise<BenchmarkResult[]> {
  const benchmark = new PuzzleGeneratorBenchmark({
    gridSizes: [3, 4, 5, 6, 7, 8],
    attemptsPerSize: 20,
    timeout: 15000
  });

  return benchmark.runBenchmarks();
}
