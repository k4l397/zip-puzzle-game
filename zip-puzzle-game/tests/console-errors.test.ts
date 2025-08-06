import { test, expect } from '@playwright/test';

test.describe('Console Error Detection', () => {
  test('should load without console errors', async ({ page }) => {
    // Collect all console errors
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors (JavaScript errors)
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await page.waitForSelector('.game-container', { timeout: 10000 });

    // Wait a bit more to catch any async errors
    await page.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalConsoleErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    const criticalPageErrors = pageErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    // Log any errors for debugging
    if (criticalConsoleErrors.length > 0) {
      console.log('Console Errors:', criticalConsoleErrors);
    }
    if (criticalPageErrors.length > 0) {
      console.log('Page Errors:', criticalPageErrors);
    }

    // Assert no critical errors
    expect(criticalConsoleErrors).toHaveLength(0);
    expect(criticalPageErrors).toHaveLength(0);
  });

  test('should start game without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('.game-container');

    // Click start playing
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    // Wait for puzzle generation
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Wait for any async errors
    await page.waitForTimeout(2000);

    const criticalConsoleErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    const criticalPageErrors = pageErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    if (criticalConsoleErrors.length > 0) {
      console.log('Console Errors during game start:', criticalConsoleErrors);
    }
    if (criticalPageErrors.length > 0) {
      console.log('Page Errors during game start:', criticalPageErrors);
    }

    expect(criticalConsoleErrors).toHaveLength(0);
    expect(criticalPageErrors).toHaveLength(0);
  });

  test('should interact with canvas without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('.game-container');

    // Start game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Try to interact with canvas
    const canvas = page.locator('.game-canvas');
    const canvasBounds = await canvas.boundingBox();

    if (canvasBounds) {
      // Click on canvas
      await page.mouse.click(canvasBounds.x + 50, canvasBounds.y + 50);

      // Try dragging
      await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 50);
      await page.mouse.down();
      await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 100);
      await page.mouse.up();
    }

    // Wait for any interaction errors
    await page.waitForTimeout(1000);

    const criticalConsoleErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    const criticalPageErrors = pageErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );

    if (criticalConsoleErrors.length > 0) {
      console.log('Console Errors during interaction:', criticalConsoleErrors);
    }
    if (criticalPageErrors.length > 0) {
      console.log('Page Errors during interaction:', criticalPageErrors);
    }

    expect(criticalConsoleErrors).toHaveLength(0);
    expect(criticalPageErrors).toHaveLength(0);
  });
});
