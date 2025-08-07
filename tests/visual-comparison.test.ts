import { test, expect } from '@playwright/test';

test.describe('Visual Comparison Tests', () => {
  test('should display consistent UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test initial welcome state
    const welcomeMessage = page.locator('.welcome-message');
    await expect(welcomeMessage).toBeVisible();
    await expect(page).toHaveScreenshot('welcome-screen.png');

    // Test controls and header
    const gameHeader = page.locator('.game-header');
    await expect(gameHeader).toBeVisible();

    const gridSizeSelect = page.locator('#grid-size');
    await expect(gridSizeSelect).toBeVisible();

    const startBtn = page.locator('.start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('should show proper canvas dimensions for different grid sizes', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test that different grid sizes produce different canvas dimensions
    const gridSizeSelect = page.locator('#grid-size');

    // Test 3x3 grid
    await gridSizeSelect.selectOption('3');
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const smallCanvasBounds = await canvas.boundingBox();
    expect(smallCanvasBounds).not.toBeNull();

    // Reload and test 6x6 grid
    await page.reload();
    await page.waitForSelector('.game-container');

    await gridSizeSelect.selectOption('6');
    await startBtn.click();

    await expect(canvas).toBeVisible({ timeout: 15000 });
    const largeCanvasBounds = await canvas.boundingBox();

    expect(largeCanvasBounds).not.toBeNull();

    // Larger grid should have larger canvas (unless constrained by viewport)
    if (smallCanvasBounds && largeCanvasBounds) {
      // On desktop, larger grids should be larger or same size (if maxed out)
      expect(largeCanvasBounds.width).toBeGreaterThanOrEqual(
        smallCanvasBounds.width
      );
    }
  });

  test('should maintain proper mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test that mobile layout adjusts properly
    const gameHeader = page.locator('.game-header');
    await expect(gameHeader).toBeVisible();

    // Start a game with largest grid to test scaling
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('8');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify canvas fits within mobile viewport
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds).not.toBeNull();

    if (canvasBounds) {
      // Canvas should fit within viewport with reasonable margins
      expect(canvasBounds.width).toBeLessThanOrEqual(375 - 32); // 16px margin each side
      expect(
        Math.abs(canvasBounds.width - canvasBounds.height)
      ).toBeLessThanOrEqual(5); // Square aspect ratio
    }
  });

  test('should show game state transitions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Screenshot welcome state
    await expect(page).toHaveScreenshot('game-state-welcome.png');

    // Start game and screenshot playing state
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify game controls are in correct state
    const gridSizeSelect = page.locator('#grid-size');
    await expect(gridSizeSelect).toBeEnabled(); // Should now be enabled during play for next puzzle

    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await expect(newPuzzleBtn).toBeEnabled(); // Should be enabled during play

    // Reset button should be visible during play
    const resetBtn = page.locator('.reset-btn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toBeEnabled();

    // Screenshot playing state (focusing on UI, not puzzle content)
    const gameInfo = page.locator('.game-info');
    await expect(gameInfo).toHaveScreenshot('game-info-playing.png');
  });
});
