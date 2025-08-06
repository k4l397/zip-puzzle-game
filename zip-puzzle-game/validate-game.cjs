const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function validateGame() {
  console.log('🚀 Starting game validation...');

  // Start the development server
  console.log('📦 Starting dev server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  let serverReady = false;

  devServer.stdout.on('data', data => {
    const output = data.toString();
    if (output.includes('Local:')) {
      serverReady = true;
    }
  });

  // Wait for server to start
  while (!serverReady) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Give it a bit more time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Dev server started');

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

    console.log('🔍 Loading game page...');

    try {
      await page.goto('http://localhost:5173', {
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

      // Wait for any initial errors
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (validationPassed) {
        console.log('🎮 Testing game start...');

        try {
          const startBtn = await page.$('.start-btn');
          if (startBtn) {
            await startBtn.click();
            console.log('✅ Start button clicked');

            // Wait for canvas to appear (with timeout for generation)
            await page.waitForSelector('.game-canvas', { timeout: 15000 });
            console.log('✅ Game canvas appeared');

            // Test canvas interaction
            const canvas = await page.$('.game-canvas');
            if (canvas) {
              const boundingBox = await canvas.boundingBox();
              if (boundingBox) {
                await page.mouse.click(boundingBox.x + 50, boundingBox.y + 50);
                await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
                console.log('✅ Canvas interaction tested');
              }
            }
          } else {
            errors.push('Start button not found');
            validationPassed = false;
          }
        } catch (e) {
          errors.push(`Game start failed: ${e.message}`);
          validationPassed = false;
        }
      }

      // Final wait for any async errors
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {
    errors.push(`Browser test failed: ${e.message}`);
    validationPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Clean up dev server
  console.log('🧹 Cleaning up dev server...');
  devServer.kill('SIGTERM');

  // Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(50));

  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(error => console.log(`   ${error}`));
    validationPassed = false;
  }

  if (validationPassed) {
    console.log('🎉 SUCCESS: Game loads and runs without console errors!');
    console.log('✅ All validation checks passed');
  } else {
    console.log('💥 FAILURE: Game has console errors or loading issues');
    console.log('❌ Validation failed');
  }

  console.log('='.repeat(50));

  process.exit(validationPassed ? 0 : 1);
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Validation interrupted');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run validation
validateGame().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});
