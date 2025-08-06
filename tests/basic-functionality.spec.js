import { test, expect } from "@playwright/test";

test.describe("Zip Puzzle Game - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5175");
    await page.waitForTimeout(1000); // Allow React to render
  });

  test("should load game with all UI elements visible", async ({ page }) => {
    // Check header elements
    await expect(page.locator("h1")).toHaveText("Zip Puzzle");
    await expect(page.locator("select#grid-size")).toBeVisible();
    await expect(page.locator(".new-game-button")).toBeVisible();
    await expect(page.locator(".timer")).toBeVisible();

    // Check grid is visible
    await expect(page.locator(".grid-container")).toBeVisible();
    await expect(page.locator(".grid")).toBeVisible();
  });

  test("should display correct number of cells and dots for each grid size", async ({
    page,
  }) => {
    const gridSizes = [
      { size: "3", expectedCells: 9, expectedDots: 3 },
      { size: "4", expectedCells: 16, expectedDots: 4 },
      { size: "5", expectedCells: 25, expectedDots: 5 },
      { size: "6", expectedCells: 36, expectedDots: 6 },
    ];

    for (const { size, expectedCells, expectedDots } of gridSizes) {
      await page.locator("select#grid-size").selectOption(size);
      await page.waitForTimeout(500);

      const cells = page.locator(".grid-cell-wrapper");
      const dots = page.locator(".dot");

      await expect(cells).toHaveCount(expectedCells);
      await expect(dots).toHaveCount(expectedDots);

      // Check that dots are numbered correctly (1, 2, 3, ...)
      for (let i = 1; i <= expectedDots; i++) {
        await expect(page.locator(`.dot[data-number="${i}"]`)).toBeVisible();
      }
    }
  });

  test("should start timer when first interaction begins", async ({ page }) => {
    // Initially timer should show 0.00s
    await expect(page.locator(".timer-display")).toContainText("0.00s");

    // Click on dot 1 to start game
    await page.locator('.dot[data-number="1"]').click();
    await page.waitForTimeout(100);

    // Timer should now be running (not exactly 0.00s anymore)
    const timerText = await page.locator(".timer-display").textContent();
    expect(timerText).not.toBe("0.00s");
  });

  test("should allow path drawing from dot 1", async ({ page }) => {
    // Start from dot 1
    const dot1 = page.locator('.dot[data-number="1"]');
    await dot1.click();

    // Check that a path cell is created
    const pathCells = page.locator(".cell--path");
    await expect(pathCells).toHaveCount(1);

    // Check that dot 1 becomes connected
    await expect(
      page.locator('.dot[data-number="1"].dot--connected'),
    ).toBeVisible();
  });

  test("should not allow starting from wrong dot", async ({ page }) => {
    // Try to start from dot 2 (should not work)
    const dot2 = page.locator('.dot[data-number="2"]');
    await dot2.click();

    // Should have no path cells
    const pathCells = page.locator(".cell--path");
    await expect(pathCells).toHaveCount(0);
  });

  test("should highlight next expected dot", async ({ page }) => {
    // Initially dot 1 should be highlighted as next
    await expect(page.locator('.dot[data-number="1"].dot--next')).toBeVisible();

    // After clicking dot 1, dot 2 should be highlighted as next
    await page.locator('.dot[data-number="1"]').click();
    await page.waitForTimeout(100);
    await expect(page.locator('.dot[data-number="2"].dot--next')).toBeVisible();
  });

  test("should reset game when New Puzzle is clicked", async ({ page }) => {
    // Start a game by clicking dot 1
    await page.locator('.dot[data-number="1"]').click();

    // Verify path exists
    await expect(page.locator(".cell--path")).toHaveCount(1);

    // Click New Puzzle
    await page.locator(".new-game-button").click();
    await page.waitForTimeout(500);

    // Path should be cleared
    await expect(page.locator(".cell--path")).toHaveCount(0);

    // Timer should reset to 0.00s
    await expect(page.locator(".timer-display")).toContainText("0.00s");

    // Dot 1 should be highlighted as next again
    await expect(page.locator('.dot[data-number="1"].dot--next')).toBeVisible();
  });

  test("should prevent diagonal movement", async ({ page }) => {
    // Set to 3x3 for simpler testing
    await page.locator("select#grid-size").selectOption("3");
    await page.waitForTimeout(500);

    // Start from dot 1 (should be at 0,0 for 3x3)
    await page.locator('.dot[data-number="1"]').click();

    // Try to move diagonally by clicking on a diagonal cell wrapper
    const diagonalCell = page.locator(
      '.grid-cell-wrapper[data-x="1"][data-y="1"]',
    );
    await diagonalCell.click();

    // Should still only have 1 path cell (the starting position)
    await expect(page.locator(".cell--path")).toHaveCount(1);
  });

  test("should maintain grid state after size changes", async ({ page }) => {
    // Change to different grid sizes and verify they maintain their grids
    await page.locator("select#grid-size").selectOption("3");
    await page.waitForTimeout(500);
    await expect(page.locator(".grid-cell-wrapper")).toHaveCount(9);

    await page.locator("select#grid-size").selectOption("6");
    await page.waitForTimeout(500);
    await expect(page.locator(".grid-cell-wrapper")).toHaveCount(36);

    // Go back to 4x4
    await page.locator("select#grid-size").selectOption("4");
    await page.waitForTimeout(500);
    await expect(page.locator(".grid-cell-wrapper")).toHaveCount(16);
    await expect(page.locator(".dot")).toHaveCount(4);
  });

  test("should show proper visual feedback for different cell states", async ({
    page,
  }) => {
    // Start from dot 1
    await page.locator('.dot[data-number="1"]').click();

    // Check that the cell with dot 1 has proper classes
    const startCell = page.locator(".cell--path").first();
    await expect(startCell).toBeVisible();

    // Check that dots have proper visual states
    await expect(
      page.locator('.dot[data-number="1"].dot--connected'),
    ).toBeVisible();
    await expect(page.locator('.dot[data-number="2"].dot--next')).toBeVisible();
  });

  test("should handle rapid clicking without crashing", async ({ page }) => {
    // Rapid click test
    const dot1 = page.locator('.dot[data-number="1"]');

    // Click multiple times rapidly
    for (let i = 0; i < 10; i++) {
      await dot1.click({ delay: 50 });
    }

    // Should still have only 1 path cell
    await expect(page.locator(".cell--path")).toHaveCount(1);

    // Game should still be functional
    await expect(
      page.locator('.dot[data-number="1"].dot--connected'),
    ).toBeVisible();
    await expect(page.locator('.dot[data-number="2"].dot--next')).toBeVisible();
  });

  test("should not show JavaScript errors in console", async ({ page }) => {
    let hasErrors = false;

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser error:", msg.text());
        hasErrors = true;
      }
    });

    // Perform basic interactions
    await page.locator("select#grid-size").selectOption("3");
    await page.waitForTimeout(500);
    await page.locator('.dot[data-number="1"]').click();
    await page.locator(".new-game-button").click();
    await page.waitForTimeout(500);

    expect(hasErrors).toBe(false);
  });
});
