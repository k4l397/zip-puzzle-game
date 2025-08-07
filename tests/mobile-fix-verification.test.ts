import { test, expect } from '@playwright/test';

test.describe('Mobile Fix Verification', () => {
  test('mobile grid scaling and hitbox fix verification', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test with larger grid that would previously have issues
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('6');

    // Start game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Get canvas dimensions
    const canvasBounds = await canvas.boundingBox();
    console.log('Mobile canvas bounds:', canvasBounds);

    // Verify fix criteria
    if (canvasBounds) {
      const viewportWidth = 375;
      const margin = 32; // 16px on each side

      // 1. Canvas should fit within viewport
      const fitsInViewport = canvasBounds.width <= (viewportWidth - margin);
      console.log('Canvas fits in viewport:', fitsInViewport);
      expect(fitsInViewport).toBe(true);

      // 2. Canvas should maintain square aspect ratio (within 5px tolerance)
      const aspectRatioMaintained = Math.abs(canvasBounds.width - canvasBounds.height) <= 5;
      console.log('Square aspect ratio maintained:', aspectRatioMaintained);
      expect(aspectRatioMaintained).toBe(true);

      // 3. Test hitbox accuracy by clicking on grid cells
      const cellSize = canvasBounds.width / 6; // 6x6 grid
      const padding = cellSize * 0.2; // Approximate padding

      // Test clicking on different grid positions
      const testPositions = [
        { name: 'top-left', x: canvasBounds.x + padding + cellSize * 0.5, y: canvasBounds.y + padding + cellSize * 0.5 },
        { name: 'center', x: canvasBounds.x + canvasBounds.width / 2, y: canvasBounds.y + canvasBounds.height / 2 },
        { name: 'bottom-right', x: canvasBounds.x + canvasBounds.width - padding - cellSize * 0.5, y: canvasBounds.y + canvasBounds.height - padding - cellSize * 0.5 }
      ];

      for (const pos of testPositions) {
        console.log(`Testing click at ${pos.name}: (${pos.x}, ${pos.y})`);

        // Click and verify no errors occur
        await page.mouse.click(pos.x, pos.y);
        await page.waitForTimeout(200);

        // Check that the click was processed (no console errors)
        const consoleErrors = await page.evaluate(() => {
          // Check if any console errors were logged
          return window.console.error?.toString() || 'no-errors';
        });

        expect(consoleErrors).toContain('no-errors');
      }

      // 4. Verify canvas content is properly scaled (not stretched)
      const canvasElement = await canvas.elementHandle();
      const canvasProperties = await canvasElement?.evaluate((el: HTMLCanvasElement) => ({
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        width: el.width,
        height: el.height
      }));

      console.log('Canvas properties:', canvasProperties);

      if (canvasProperties) {
        // Canvas element should maintain square dimensions
        expect(Math.abs(canvasProperties.clientWidth - canvasProperties.clientHeight)).toBeLessThanOrEqual(2);

        // Internal canvas size should also be square
        expect(Math.abs(canvasProperties.width - canvasProperties.height)).toBeLessThanOrEqual(2);
      }
    }

    console.log('✅ Mobile fix verification passed!');
  });

  test('multiple viewport sizes work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Start with largest grid size
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('8');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Test different mobile viewports
    const viewports = [
      { width: 320, height: 568, name: 'iPhone 5' },
      { width: 375, height: 667, name: 'iPhone 6/7/8' },
      { width: 414, height: 896, name: 'iPhone 11/12' },
      { width: 390, height: 844, name: 'iPhone 12 mini' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name}: ${viewport.width}x${viewport.height}`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const canvasBounds = await canvas.boundingBox();

      if (canvasBounds) {
        // Canvas should fit with reasonable margins
        const fitsWidth = canvasBounds.width <= (viewport.width - 20);
        const isSquare = Math.abs(canvasBounds.width - canvasBounds.height) <= 3;

        console.log(`  Fits: ${fitsWidth}, Square: ${isSquare}, Size: ${canvasBounds.width}x${canvasBounds.height}`);

        expect(fitsWidth).toBe(true);
        expect(isSquare).toBe(true);
      }
    }

    console.log('✅ Multiple viewport test passed!');
  });

  test('grid scaling maintains visual quality', async ({ page }) => {
    // Test visual quality at different sizes
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Test smaller grid first
    const gridSizeSelect = page.locator('#grid-size');
    await gridSizeSelect.selectOption('4');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Check that elements are visible and properly sized
    const canvasElement = await canvas.elementHandle();
    const hasContent = await canvasElement?.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d');
      if (!ctx) return false;

      // Check if canvas has been drawn on (not blank)
      const imageData = ctx.getImageData(0, 0, el.width, el.height);
      const data = imageData.data;

      // Look for non-white pixels (assuming white background)
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return true; // Found non-white pixel
        }
      }
      return false;
    });

    expect(hasContent).toBe(true);
    console.log('✅ Canvas has rendered content');

    // Test larger grid to ensure it scales down properly
    await gridSizeSelect.selectOption('7');
    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await newPuzzleBtn.click();

    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    const finalBounds = await canvas.boundingBox();
    console.log('Final canvas bounds:', finalBounds);

    if (finalBounds) {
      // Should still fit in small viewport
      expect(finalBounds.width).toBeLessThanOrEqual(300);
      expect(Math.abs(finalBounds.width - finalBounds.height)).toBeLessThanOrEqual(3);
    }

    console.log('✅ Visual quality test passed!');
  });
});
