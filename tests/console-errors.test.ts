import { test, expect } from '@playwright/test';

test.describe('Console Error Detection', () => {
  let consoleErrors: string[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error arrays
    consoleErrors = [];
    pageErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon') &&
          !text.includes('404') &&
          !text.toLowerCase().includes('warning')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    // Listen for page errors (JavaScript errors)
    page.on('pageerror', error => {
      const message = error.message;
      if (
        !message.includes('favicon') &&
        !message.includes('404') &&
        !message.toLowerCase().includes('warning')
      ) {
        pageErrors.push(message);
      }
    });

    await page.goto('/');
  });

  test('should load app without console errors', async ({ page }) => {
    // Wait for the app to load
    await page.waitForSelector('.game-container', { timeout: 10000 });

    // Wait a bit more to catch any async errors
    await page.waitForTimeout(2000);

    // Assert no critical errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should start game without errors', async ({ page }) => {
    await page.waitForSelector('.game-container');

    // Click start playing
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    // Wait for puzzle generation
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Wait for any async errors
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('Console Errors during game start:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during game start:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should interact with canvas without errors', async ({ page }) => {
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

    if (consoleErrors.length > 0) {
      console.log('Console Errors during interaction:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during interaction:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should handle new puzzle generation without errors', async ({
    page,
  }) => {
    await page.waitForSelector('.game-container');

    // Start initial game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Generate new puzzle
    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await newPuzzleBtn.click();

    // Wait for new puzzle to generate
    await page.waitForTimeout(5000);

    if (consoleErrors.length > 0) {
      console.log('Console Errors during new puzzle:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during new puzzle:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should handle responsive design changes without errors', async ({
    page,
  }) => {
    await page.waitForSelector('.game-container');

    // Start game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log('Console Errors during viewport changes:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during viewport changes:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should enforce win condition requiring end on final dot', async ({
    page,
  }) => {
    await page.waitForSelector('.game-container');

    // Start game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();
    await page.waitForSelector('.game-canvas', { timeout: 15000 });

    // Try to simulate completing path but not ending on final dot
    const canvas = page.locator('.game-canvas');
    const canvasBounds = await canvas.boundingBox();

    if (canvasBounds) {
      // Start from dot 1 and draw a path
      await page.mouse.click(canvasBounds.x + 50, canvasBounds.y + 50);
      await page.mouse.down();

      // Draw path through multiple cells but don't end on final dot
      await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 50);
      await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 50);
      await page.mouse.move(canvasBounds.x + 200, canvasBounds.y + 50);
      await page.mouse.up();

      // Wait for any validation
      await page.waitForTimeout(1000);

      // Should not show completion message since we didn't end on final dot
      const completionMessage = page.locator('.completion-message');
      await expect(completionMessage).not.toBeVisible();
    }

    if (consoleErrors.length > 0) {
      console.log('Console Errors during win condition test:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors during win condition test:', pageErrors);
    }

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
