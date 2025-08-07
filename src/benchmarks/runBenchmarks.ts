import { PuzzleGeneratorBenchmark, quickBenchmark, fullBenchmark } from './puzzleGeneratorBenchmark';

/**
 * Main benchmark runner - can be called from console or tests
 */
async function main() {
  console.log('🎯 Puzzle Generator Benchmark Suite');
  console.log('=====================================\n');

  // Parse command line arguments if running in Node
  const args = typeof process !== 'undefined' ? process.argv.slice(2) : [];
  const mode = args[0] || 'quick';

  try {
    let results;

    switch (mode) {
      case 'quick':
        console.log('🚀 Running quick benchmark (5 attempts per grid size)...\n');
        results = await quickBenchmark([4, 5, 6]);
        break;

      case 'full':
        console.log('🚀 Running full benchmark (20 attempts per grid size)...\n');
        results = await fullBenchmark();
        break;

      case 'custom':
        console.log('🚀 Running custom benchmark...\n');
        const customBenchmark = new PuzzleGeneratorBenchmark({
          gridSizes: [3, 4, 5, 6, 7, 8],
          attemptsPerSize: 10,
          timeout: 10000,
          algorithms: ['current']
        });
        results = await customBenchmark.runBenchmarks();
        break;

      case 'problematic':
        console.log('🚀 Testing problematic grid sizes (6x6, 7x7, 8x8)...\n');
        results = await quickBenchmark([6, 7, 8]);
        break;

      default:
        console.log('❌ Unknown mode. Available modes: quick, full, custom, problematic');
        return;
    }

    // Export results for analysis
    const benchmark = new PuzzleGeneratorBenchmark();
    const exportData = JSON.stringify({
      mode,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests: results.length,
        averageTime: results.reduce((sum, r) => sum + r.averageTimeMs, 0) / results.length,
        averageSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
        averageVariety: results.reduce((sum, r) => sum + r.puzzleVariety, 0) / results.length
      }
    }, null, 2);

    console.log('\n💾 Benchmark Results:');
    console.log(exportData);

    // Store results in browser localStorage if available
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`puzzle-benchmark-${mode}-${Date.now()}`, exportData);
      console.log('\n✅ Results saved to localStorage');
    }

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  }
}

/**
 * Browser-friendly benchmark runner
 */
export async function runBrowserBenchmark(mode: 'quick' | 'full' | 'problematic' = 'quick') {
  console.log('🌐 Running browser benchmark...');

  try {
    let results;

    switch (mode) {
      case 'quick':
        results = await quickBenchmark([4, 5, 6]);
        break;
      case 'full':
        results = await fullBenchmark();
        break;
      case 'problematic':
        results = await quickBenchmark([6, 7, 8]);
        break;
    }

    return results;
  } catch (error) {
    console.error('Benchmark error:', error);
    throw error;
  }
}

/**
 * Compare current algorithm with a future optimized version
 */
export async function runComparisonBenchmark() {
  console.log('🥊 Running comparison benchmark...');

  const benchmark = new PuzzleGeneratorBenchmark({
    gridSizes: [4, 5, 6, 7],
    attemptsPerSize: 10,
    timeout: 8000,
    algorithms: ['current'] // Will add 'optimized' later
  });

  const results = await benchmark.runBenchmarks();

  // Store baseline results for future comparison
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('puzzle-benchmark-baseline', JSON.stringify({
      timestamp: new Date().toISOString(),
      results
    }));
    console.log('✅ Baseline results saved for future comparison');
  }

  return results;
}

/**
 * Development helper - test single grid size
 */
export async function testSingleGridSize(gridSize: number, attempts: number = 5) {
  console.log(`🎯 Testing ${gridSize}x${gridSize} grid with ${attempts} attempts...`);

  const benchmark = new PuzzleGeneratorBenchmark({
    gridSizes: [gridSize],
    attemptsPerSize: attempts,
    timeout: 10000
  });

  return benchmark.runBenchmarks();
}

// Auto-run if called directly
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  // Node.js environment
  main().catch(console.error);
}

// Export for browser use
export { main as runBenchmarks };
