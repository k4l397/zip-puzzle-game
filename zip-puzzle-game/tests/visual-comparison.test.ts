import { test, expect } from '@playwright/test';

test.describe('Visual Comparison Tests', () => {
  test('should take screenshot of improved game styling', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Start a game to generate a puzzle
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    // Wait for the canvas to appear with generated puzzle
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Wait a moment for full rendering
    await page.waitForTimeout(1000);

    // Take a screenshot of the initial puzzle state
    await expect(canvas).toHaveScreenshot('puzzle-initial-state.png');

    // Draw a partial path to show the pipe styling
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Start drawing from what should be dot 1
      await page.mouse.click(canvasBounds.x + 90, canvasBounds.y + 90);
      await page.mouse.down();

      // Draw a path through several cells
      await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 90);
      await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 150);
      await page.mouse.move(canvasBounds.x + 210, canvasBounds.y + 150);
      await page.mouse.up();

      // Wait for rendering
      await page.waitForTimeout(500);

      // Take screenshot showing the path and dots
      await expect(canvas).toHaveScreenshot('puzzle-with-path.png');

      // Test hover state by moving mouse over existing path
      await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 90);
      await page.waitForTimeout(200);

      // Take screenshot of hover state
      await expect(canvas).toHaveScreenshot('puzzle-with-hover.png');
    }
  });

  test('should compare different grid sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test 3x3 grid
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('3');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(canvas).toHaveScreenshot('puzzle-3x3-grid.png');

    // Generate new puzzle with 5x5 grid
    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await newPuzzleBtn.click();

    await gridSizeSelect.selectOption('5');
    await newPuzzleBtn.click();

    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(canvas).toHaveScreenshot('puzzle-5x5-grid.png');
  });

  test('should show visual styling on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Start a game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Take full page screenshot on mobile
    await expect(page).toHaveScreenshot('mobile-game-view.png', {
      fullPage: true,
    });

    // Draw a path on mobile
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      await page.mouse.click(canvasBounds.x + 50, canvasBounds.y + 50);
      await page.mouse.down();
      await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 50);
      await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 100);
      await page.mouse.up();

      await page.waitForTimeout(500);
      await expect(canvas).toHaveScreenshot('mobile-with-path.png');
    }
  });

  test('should capture completion state styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Use a small grid for easier completion testing
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('3');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Try to draw a complete path (this likely won't actually win, but shows the visual state)
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Draw an extensive path
      await page.mouse.click(canvasBounds.x + 70, canvasBounds.y + 70);
      await page.mouse.down();

      // Create a path that visits multiple cells
      const moves = [
        { x: 130, y: 70 },
        { x: 190, y: 70 },
        { x: 190, y: 130 },
        { x: 130, y: 130 },
        { x: 70, y: 130 },
        { x: 70, y: 190 },
        { x: 130, y: 190 },
        { x: 190, y: 190 },
      ];

      for (const move of moves) {
        await page.mouse.move(canvasBounds.x + move.x, canvasBounds.y + move.y);
        await page.waitForTimeout(100);
      }

      await page.mouse.up();
      await page.waitForTimeout(1000);

      await expect(canvas).toHaveScreenshot('puzzle-complex-path.png');
    }

    // Check if completion message appears and screenshot it
    const completionMessage = page.locator('.completion-message');
    if (await completionMessage.isVisible()) {
      await expect(page).toHaveScreenshot('puzzle-completed.png', {
        fullPage: true,
      });
    }
  });
});
