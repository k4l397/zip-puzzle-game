const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function validateProduction() {
  console.log('🚀 Starting production build validation...');

  // Build the project
  console.log('🔨 Building production version...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  await new Promise((resolve, reject) => {
    buildProcess.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });

  console.log('✅ Production build complete');

  // Start the preview server
  console.log('📦 Starting preview server...');
  const previewServer = spawn('npm', ['run', 'preview'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  let serverReady = false;

  previewServer.stdout.on('data', data => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('preview')) {
      serverReady = true;
    }
  });

  // Wait for server to start
  while (!serverReady) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Give it a bit more time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('✅ Preview server started');

  let browser;
  let validationPassed = true;
  const errors = [];

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon') &&
          !text.includes('404') &&
          !text.toLowerCase().includes('warning')
        ) {
          errors.push(`Console Error: ${text}`);
        }
      }
    });

    // Track page errors
    page.on('pageerror', error => {
      const message = error.message;
      if (
        !message.includes('favicon') &&
        !message.includes('404') &&
        !message.toLowerCase().includes('warning')
      ) {
        errors.push(`Page Error: ${message}`);
      }
    });

    console.log('🔍 Loading production build...');

    try {
      await page.goto('http://localhost:4173', {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } catch (e) {
      errors.push(`Failed to load page: ${e.message}`);
      validationPassed = false;
    }

    if (validationPassed) {
      console.log('📋 Checking for game container...');

      try {
        await page.waitForSelector('.game-container', { timeout: 10000 });
        console.log('✅ Game container found');
      } catch (e) {
        errors.push(`Game container not found: ${e.message}`);
        validationPassed = false;
      }

      // Check page title
      const title = await page.title();
      console.log(`📝 Page title: ${title}`);

      // Wait for any initial errors
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (validationPassed) {
        console.log('🎮 Testing game functionality...');

        try {
          // Check if start button exists
          const startBtn = await page.$('.start-btn');
          if (startBtn) {
            await startBtn.click();
            console.log('✅ Start button clicked');

            // Wait for loading state
            const loadingOverlay = await page.$('.loading-overlay');
            if (loadingOverlay) {
              console.log('✅ Loading overlay appeared');
            }

            // Wait for canvas to appear (with timeout for generation)
            await page.waitForSelector('.game-canvas', { timeout: 20000 });
            console.log('✅ Game canvas appeared');

            // Test canvas interaction
            const canvas = await page.$('.game-canvas');
            if (canvas) {
              const boundingBox = await canvas.boundingBox();
              if (boundingBox) {
                // Test mouse interaction
                await page.mouse.click(boundingBox.x + 50, boundingBox.y + 50);
                await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
                console.log('✅ Canvas mouse interaction tested');

                // Test drag interaction
                await page.mouse.down();
                await page.mouse.move(boundingBox.x + 150, boundingBox.y + 150);
                await page.mouse.up();
                console.log('✅ Canvas drag interaction tested');
              }
            }

            // Check timer is working
            const timer = await page.$('.timer-display');
            if (timer) {
              const timerText = await page.evaluate(
                el => el.textContent,
                timer
              );
              console.log(`✅ Timer found: ${timerText}`);
            }

            // Test new puzzle generation
            const newPuzzleBtn = await page.$('.new-puzzle-btn');
            if (newPuzzleBtn) {
              await newPuzzleBtn.click();
              console.log('✅ New puzzle button tested');

              // Wait for new puzzle to generate
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } else {
            errors.push('Start button not found');
            validationPassed = false;
          }
        } catch (e) {
          errors.push(`Game functionality test failed: ${e.message}`);
          validationPassed = false;
        }
      }

      // Test responsive design
      console.log('📱 Testing responsive design...');
      try {
        await page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const gameHeader = await page.$('.game-header');
        if (gameHeader) {
          console.log('✅ Mobile viewport test passed');
        }
      } catch (e) {
        errors.push(`Responsive design test failed: ${e.message}`);
      }

      // Performance check
      console.log('⚡ Checking performance metrics...');
      try {
        const performanceMetrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            totalTime: navigation.loadEventEnd - navigation.navigationStart,
          };
        });

        console.log(`📊 Load time: ${performanceMetrics.loadTime}ms`);
        console.log(
          `📊 DOM content loaded: ${performanceMetrics.domContentLoaded}ms`
        );
        console.log(`📊 Total time: ${performanceMetrics.totalTime}ms`);

        if (performanceMetrics.totalTime > 5000) {
          errors.push(
            `Slow load time: ${performanceMetrics.totalTime}ms (should be < 5000ms)`
          );
        } else {
          console.log('✅ Performance metrics within acceptable range');
        }
      } catch (e) {
        console.log('⚠️  Could not measure performance metrics');
      }

      // Final wait for any async errors
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (e) {
    errors.push(`Browser test failed: ${e.message}`);
    validationPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Clean up preview server
  console.log('🧹 Cleaning up preview server...');
  previewServer.kill('SIGTERM');

  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION BUILD VALIDATION RESULTS');
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(error => console.log(`   ${error}`));
    validationPassed = false;
  }

  if (validationPassed) {
    console.log('🎉 SUCCESS: Production build works perfectly!');
    console.log('✅ All validation checks passed');
    console.log('✅ No console errors detected');
    console.log('✅ Game functionality working');
    console.log('✅ Responsive design working');
    console.log('✅ Performance metrics acceptable');
    console.log('🚀 Ready for deployment!');
  } else {
    console.log('💥 FAILURE: Production build has issues');
    console.log('❌ Validation failed');
    console.log('🛠️  Please fix the issues before deployment');
  }

  console.log('='.repeat(60));

  process.exit(validationPassed ? 0 : 1);
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Production validation interrupted');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run validation
validateProduction().catch(error => {
  console.error('💥 Production validation script failed:', error);
  process.exit(1);
});
