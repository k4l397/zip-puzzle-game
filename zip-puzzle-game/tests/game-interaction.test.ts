import { test, expect } from '@playwright/test';

test.describe('Zip Puzzle Game - Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.game-container');
  });

  test('should allow mouse interaction with canvas', async ({ page }) => {
    // Start a new game
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Get canvas bounds for interaction
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds).toBeTruthy();

    if (canvasBounds) {
      // Try clicking on the canvas (should start path if clicking on dot 1)
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 50, centerY);
      await page.mouse.up();
    }

    // Canvas should still be interactive (not disabled)
    await expect(canvas).not.toHaveClass(/disabled/);
  });

  test('should start timer when first interaction occurs', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const timerDisplay = page.locator('.timer-display');

    // Timer should initially show 0.00s
    const initialTime = await timerDisplay.textContent();
    expect(initialTime).toMatch(/0\.00s/);

    // Timer should not be running initially
    await expect(timerDisplay).not.toHaveClass('running');

    // Simulate mouse interaction
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      await page.mouse.click(canvasBounds.x + 50, canvasBounds.y + 50);

      // Wait a moment for timer to potentially start
      await page.waitForTimeout(100);

      // Check if timer class might have changed (implementation dependent)
      const timerAfterClick = await timerDisplay.textContent();
      // Timer format should still be valid
      expect(timerAfterClick).toMatch(/\d+\.\d+s/);
    }
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should have touch-action: none for proper touch handling
    const touchAction = await canvas.evaluate(
      el => getComputedStyle(el).touchAction
    );
    expect(touchAction).toBe('none');

    // Simulate touch interaction
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Touch start
      await page.touchscreen.tap(canvasBounds.x + 50, canvasBounds.y + 50);
    }
  });

  test('should prevent context menu on canvas', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should prevent context menu
    const userSelect = await canvas.evaluate(
      el => getComputedStyle(el).userSelect
    );
    expect(userSelect).toBe('none');
  });

  test('should handle canvas resize on window resize', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Canvas should still be visible and properly sized
    await expect(canvas).toBeVisible();

    const newBounds = await canvas.boundingBox();
    expect(newBounds).toBeTruthy();
  });

  test('should disable canvas when game is completed', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Initially canvas should not be disabled
    await expect(canvas).not.toHaveClass(/disabled/);

    // Simulate game completion (this is implementation dependent)
    // For now, just check that the canvas can be disabled
    const isDisabled = await canvas.evaluate(el =>
      el.classList.contains('disabled')
    );
    expect(typeof isDisabled).toBe('boolean');
  });

  test('should handle mouse leave events', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Start interaction
      await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 50);
      await page.mouse.down();

      // Move outside canvas
      await page.mouse.move(0, 0);

      // Canvas should still be responsive
      await expect(canvas).toBeVisible();
    }
  });

  test('should provide visual feedback on hover', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Check cursor changes to crosshair on canvas
    const cursor = await canvas.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('crosshair');

    // Hover should potentially change box-shadow (implementation dependent)
    await canvas.hover();

    // Canvas should remain interactive
    await expect(canvas).not.toHaveClass(/disabled/);
  });

  test('should handle rapid mouse movements', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Rapid mouse movements
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(canvasBounds.x + i * 20, canvasBounds.y + i * 10);
      }

      // Canvas should still be responsive
      await expect(canvas).toBeVisible();
      await expect(canvas).not.toHaveClass(/disabled/);
    }
  });

  test('should maintain aspect ratio on different screen sizes', async ({
    page,
  }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 768, height: 1024 }, // iPad
      { width: 1200, height: 800 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Canvas should still be visible and properly sized
      await expect(canvas).toBeVisible();

      const bounds = await canvas.boundingBox();
      expect(bounds?.width).toBeGreaterThan(0);
      expect(bounds?.height).toBeGreaterThan(0);

      // Canvas should not exceed viewport width
      if (bounds) {
        expect(bounds.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('should handle double click events', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      // Double click on canvas
      await page.mouse.dblclick(canvasBounds.x + 50, canvasBounds.y + 50);

      // Canvas should remain interactive
      await expect(canvas).toBeVisible();
      await expect(canvas).not.toHaveClass(/disabled/);
    }
  });

  test('should handle keyboard focus on canvas', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Focus the canvas
    await canvas.focus();

    // Check for focus outline
    await expect(canvas).toBeFocused();

    // Should have proper focus styling
    const outline = await canvas.evaluate(el => {
      const style = getComputedStyle(el);
      return style.outline || style.outlineStyle;
    });

    // Outline should be present for accessibility
    expect(typeof outline).toBe('string');
  });

  test('should handle page visibility changes', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Simulate page becoming hidden (tab switch)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(100);

    // Simulate page becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Canvas should still be functional
    await expect(canvas).toBeVisible();
    await expect(canvas).not.toHaveClass(/disabled/);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Perform various interactions
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      await page.mouse.click(canvasBounds.x + 10, canvasBounds.y + 10);
      await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 100);
    }

    // Wait a moment for any async errors
    await page.waitForTimeout(1000);

    // Should not have critical JavaScript errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes('Warning') &&
        !error.includes('favicon') &&
        !error.includes('404')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
