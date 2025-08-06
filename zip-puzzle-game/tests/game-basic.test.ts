import { test, expect } from '@playwright/test';

test.describe('Zip Puzzle Game - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForSelector('.game-container');

    // Check for any console errors during load
    await page.waitForTimeout(1000);
    if (errors.length > 0) {
      const criticalErrors = errors.filter(
        error =>
          !error.includes('favicon') &&
          !error.includes('404') &&
          !error.includes('Warning')
      );
      if (criticalErrors.length > 0) {
        throw new Error(
          `Console errors detected: ${criticalErrors.join(', ')}`
        );
      }
    }
  });

  test('should display the game title and welcome message', async ({
    page,
  }) => {
    // Check game title
    const title = await page.textContent('h1');
    expect(title).toBe('Zip Puzzle');

    // Check welcome message is visible
    const welcomeMessage = page.locator('.welcome-message');
    await expect(welcomeMessage).toBeVisible();

    const welcomeText = await welcomeMessage.textContent();
    expect(welcomeText).toContain('Welcome to Zip Puzzle!');
    expect(welcomeText).toContain('Connect the numbered dots in order');
  });

  test('should have functional grid size selector', async ({ page }) => {
    const gridSizeSelect = page.locator('#grid-size');
    await expect(gridSizeSelect).toBeVisible();

    // Check default value
    const defaultValue = await gridSizeSelect.inputValue();
    expect(defaultValue).toBe('4');

    // Test changing grid size
    await gridSizeSelect.selectOption('5');
    const newValue = await gridSizeSelect.inputValue();
    expect(newValue).toBe('5');
  });

  test('should have functional new puzzle button', async ({ page }) => {
    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await expect(newPuzzleBtn).toBeVisible();
    await expect(newPuzzleBtn).toBeEnabled();

    const buttonText = await newPuzzleBtn.textContent();
    expect(buttonText).toBe('New Puzzle');
  });

  test('should display timer component', async ({ page }) => {
    const timer = page.locator('.timer-container');
    await expect(timer).toBeVisible();

    const timerDisplay = page.locator('.timer-display');
    await expect(timerDisplay).toBeVisible();

    const initialTime = await timerDisplay.textContent();
    expect(initialTime).toMatch(/0\.00s/);
  });

  test('should show start playing button in idle state', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();

    const buttonText = await startBtn.textContent();
    expect(buttonText).toBe('Start Playing');
  });

  test('should generate puzzle when start playing is clicked', async ({
    page,
  }) => {
    // Track console errors during puzzle generation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    // Should show loading state
    const loadingOverlay = page.locator('.loading-overlay');
    await expect(loadingOverlay).toBeVisible();

    const loadingText = await page.locator('.loading-overlay p').textContent();
    expect(loadingText).toBe('Generating puzzle...');

    // Wait for puzzle to generate and canvas to appear
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Loading overlay should disappear
    await expect(loadingOverlay).not.toBeVisible();

    // Welcome message should be hidden
    const welcomeMessage = page.locator('.welcome-message');
    await expect(welcomeMessage).not.toBeVisible();

    // Check for console errors during generation
    const criticalErrors = errors.filter(
      error =>
        !error.includes('favicon') &&
        !error.includes('404') &&
        !error.includes('Warning')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should disable controls while generating puzzle', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    const gridSizeSelect = page.locator('#grid-size');
    const newPuzzleBtn = page.locator('.new-puzzle-btn');

    await startBtn.click();

    // During generation, controls should be disabled
    await expect(gridSizeSelect).toBeDisabled();
    await expect(newPuzzleBtn).toBeDisabled();

    // Wait for generation to complete
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Controls should be enabled again (except grid size during play)
    await expect(newPuzzleBtn).toBeEnabled();
    await expect(gridSizeSelect).toBeDisabled(); // Still disabled during play
  });

  test('should show canvas with proper dimensions', async ({ page }) => {
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Check canvas has proper attributes
    const canvasElement = await canvas.elementHandle();
    const width = await canvasElement?.getAttribute('style');
    expect(width).toContain('width:');
    expect(width).toContain('height:');

    // Canvas should be interactive
    await expect(canvas).not.toHaveClass(/disabled/);

    // Should have proper cursor style
    const cursor = await canvas.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('crosshair');
  });

  test('should handle different grid sizes', async ({ page }) => {
    const gridSizeSelect = page.locator('#grid-size');

    // Test 3x3 grid
    await gridSizeSelect.selectOption('3');
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    let canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Generate new puzzle with different size
    const newPuzzleBtn = page.locator('.new-puzzle-btn');
    await newPuzzleBtn.click();

    // Change to 6x6 while generating
    await expect(gridSizeSelect).toBeEnabled();
    await gridSizeSelect.selectOption('6');

    await newPuzzleBtn.click();
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 }); // Larger grids take longer
  });

  test('should have responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Check that game header adapts to mobile
    const gameHeader = page.locator('.game-header');
    await expect(gameHeader).toBeVisible();

    // Controls should stack on mobile
    const gameControls = page.locator('.game-controls');
    await expect(gameControls).toBeVisible();

    // Start game and check canvas responsiveness
    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should fit within viewport
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds?.width).toBeLessThanOrEqual(375);
  });

  test('should handle rapid button clicks gracefully', async ({ page }) => {
    const startBtn = page.locator('.start-btn');

    // Click start button multiple times rapidly
    await startBtn.click();
    await startBtn.click();
    await startBtn.click();

    // Should still only generate one puzzle
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Only one canvas should exist
    const canvasCount = await page.locator('.game-canvas').count();
    expect(canvasCount).toBe(1);
  });

  test('should maintain game state when switching grid sizes before starting', async ({
    page,
  }) => {
    const gridSizeSelect = page.locator('#grid-size');

    // Change grid size multiple times
    await gridSizeSelect.selectOption('3');
    await gridSizeSelect.selectOption('5');
    await gridSizeSelect.selectOption('4');

    const startBtn = page.locator('.start-btn');
    await startBtn.click();

    // Should generate puzzle with final selected size
    const canvas = page.locator('.game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Grid size should still show 4
    const finalValue = await gridSizeSelect.inputValue();
    expect(finalValue).toBe('4');
  });
});
