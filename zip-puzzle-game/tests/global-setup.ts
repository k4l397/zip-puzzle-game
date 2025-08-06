import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup for Zip Puzzle Game tests...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app and wait for it to load
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:4173');

    // Wait for the app to be ready
    await page.waitForSelector('.game-container', { timeout: 30000 });

    // Check if the app loads without JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait a bit to catch any initial errors
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.error('JavaScript errors detected during setup:', errors);
      throw new Error(`App failed to load properly: ${errors.join(', ')}`);
    }

    console.log('✓ App loaded successfully');
    console.log('✓ No JavaScript errors detected');

    // Test basic game functionality
    const gameTitle = await page.textContent('h1');
    if (gameTitle !== 'Zip Puzzle') {
      throw new Error(`Expected title "Zip Puzzle", got "${gameTitle}"`);
    }

    console.log('✓ Game title verified');

    // Check for required UI elements
    await page.waitForSelector('.new-puzzle-btn');
    await page.waitForSelector('.grid-size-selector');
    console.log('✓ Core UI elements present');

  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('Global setup completed successfully!');
}

export default globalSetup;
