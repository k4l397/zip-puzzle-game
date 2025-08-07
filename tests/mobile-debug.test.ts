import { test, expect } from '@playwright/test';

test.describe('Mobile Grid Debugging', () => {
  test('debug mobile grid scaling issues', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test different grid sizes on mobile to identify scaling issues
    const gridSizes = [4, 6, 8];

    for (const size of gridSizes) {
      console.log(`Testing ${size}x${size} grid on mobile`);

      // Set grid size
      const gridSizeSelect = page.locator('#grid-size');
      await gridSizeSelect.selectOption(size.toString());

      // Start new game
      const startBtn = page.locator('.start-btn');
      if (await startBtn.isVisible()) {
        await startBtn.click();
      } else {
        const newPuzzleBtn = page.locator('.new-puzzle-btn');
        await newPuzzleBtn.click();
      }

      const canvas = page.locator('.game-canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1000);

      // Get canvas dimensions and position
      const canvasBounds = await canvas.boundingBox();
      console.log(`Canvas bounds for ${size}x${size}:`, canvasBounds);

      // Check if canvas overflows viewport
      if (canvasBounds) {
        const viewportWidth = 375;
        const isOverflowing = canvasBounds.width > viewportWidth - 32; // Account for padding
        console.log(`Grid ${size}x${size} overflowing: ${isOverflowing}`);

        // Test clicking on grid corners to check hitbox alignment
        const corners = [
          { name: 'top-left', x: canvasBounds.x + 50, y: canvasBounds.y + 50 },
          { name: 'top-right', x: canvasBounds.x + canvasBounds.width - 50, y: canvasBounds.y + 50 },
          { name: 'bottom-left', x: canvasBounds.x + 50, y: canvasBounds.y + canvasBounds.height - 50 },
          { name: 'bottom-right', x: canvasBounds.x + canvasBounds.width - 50, y: canvasBounds.y + canvasBounds.height - 50 }
        ];

        for (const corner of corners) {
          console.log(`Testing ${corner.name} corner at (${corner.x}, ${corner.y})`);

          // Move mouse to position and check if it's within bounds
          await page.mouse.move(corner.x, corner.y);
          await page.waitForTimeout(100);

          // Try to click and see if it registers
          await page.mouse.click(corner.x, corner.y);
          await page.waitForTimeout(200);
        }
      }

      // Take screenshot of current state
      await expect(page).toHaveScreenshot(`mobile-grid-${size}x${size}.png`, {
        fullPage: true,
      });

      // Take focused canvas screenshot
      await expect(canvas).toHaveScreenshot(`mobile-canvas-${size}x${size}.png`);
    }
  });

  test('test canvas responsiveness with viewport changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Start with a larger grid
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('6');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Test different mobile viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'small-mobile' },
      { width: 375, height: 667, name: 'medium-mobile' },
      { width: 414, height: 896, name: 'large-mobile' },
    ];

    for (const viewport of viewports) {
      console.log(`Testing viewport: ${viewport.width}x${viewport.height}`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const canvasBounds = await canvas.boundingBox();
      console.log(`Canvas bounds at ${viewport.name}:`, canvasBounds);

      // Check if canvas fits within viewport with reasonable margins
      if (canvasBounds) {
        const fitsWidth = canvasBounds.width <= viewport.width - 32; // 16px margin each side
        const aspectRatioMaintained = Math.abs(canvasBounds.width - canvasBounds.height) < 5;

        console.log(`Fits width: ${fitsWidth}, Aspect ratio maintained: ${aspectRatioMaintained}`);
      }

      await expect(page).toHaveScreenshot(`viewport-${viewport.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('test touch interaction accuracy', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Start with medium grid
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('5');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      console.log('Canvas bounds:', canvasBounds);

      // Calculate grid cell size based on current implementation
      // From constants: cellSize = 60, padding = 40
      const expectedCellSize = 60;
      const expectedPadding = 40;
      const expectedTotalSize = 5 * expectedCellSize + 2 * expectedPadding; // 380px

      console.log(`Expected canvas size: ${expectedTotalSize}px`);
      console.log(`Actual canvas size: ${canvasBounds.width}px x ${canvasBounds.height}px`);

      // Test clicking on specific grid positions
      const testPositions = [
        { name: 'cell-0-0', gridX: 0, gridY: 0 },
        { name: 'cell-2-2', gridX: 2, gridY: 2 },
        { name: 'cell-4-4', gridX: 4, gridY: 4 },
      ];

      for (const pos of testPositions) {
        // Calculate expected click position based on grid logic
        const expectedX = canvasBounds.x + expectedPadding + pos.gridX * expectedCellSize + expectedCellSize / 2;
        const expectedY = canvasBounds.y + expectedPadding + pos.gridY * expectedCellSize + expectedCellSize / 2;

        console.log(`Testing ${pos.name} at expected position (${expectedX}, ${expectedY})`);

        // First, start drawing from cell 0,0 if this is the first move
        if (pos.name === 'cell-0-0') {
          await page.mouse.click(expectedX, expectedY);
          await page.waitForTimeout(300);
        } else {
          // Try to continue the path
          await page.mouse.click(expectedX, expectedY);
          await page.waitForTimeout(300);
        }

        // Take screenshot after each interaction
        await expect(canvas).toHaveScreenshot(`touch-test-${pos.name}.png`);
      }
    }
  });
});
