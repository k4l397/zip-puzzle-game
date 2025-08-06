import { test, expect } from "@playwright/test";

test.describe("Visual Path Debug", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5175");
    await page.waitForTimeout(1000);
  });

  test("visual debug - path center alignment with cell centers", async ({ page }) => {
    // Set to 3x3 for simpler debugging
    await page.locator("select#grid-size").selectOption("3");
    await page.waitForTimeout(500);

    // Take initial screenshot
    await page.screenshot({ path: "debug-visual-initial.png", fullPage: true });

    console.log("=== ANALYZING GRID AND CELL POSITIONS ===");

    // Get grid container position
    const gridContainer = page.locator(".grid-container");
    const gridContainerBox = await gridContainer.boundingBox();
    console.log("Grid container:", gridContainerBox);

    // Get actual grid position (inner grid with padding)
    const grid = page.locator(".grid");
    const gridBox = await grid.boundingBox();
    console.log("Inner grid:", gridBox);

    // Get all cell positions and their exact centers
    const cells = page.locator(".grid-cell-wrapper");
    const cellCount = await cells.count();
    console.log(`Found ${cellCount} cells`);

    const cellCenters = [];
    for (let i = 0; i < cellCount; i++) {
      const cell = cells.nth(i);
      const cellBox = await cell.boundingBox();
      const dataX = await cell.getAttribute("data-x");
      const dataY = await cell.getAttribute("data-y");

      if (cellBox) {
        const centerX = cellBox.x + cellBox.width / 2;
        const centerY = cellBox.y + cellBox.height / 2;
        cellCenters.push({
          gridX: parseInt(dataX),
          gridY: parseInt(dataY),
          centerX,
          centerY,
          box: cellBox
        });
        console.log(`Cell[${dataX},${dataY}]: center(${centerX.toFixed(1)}, ${centerY.toFixed(1)}) size(${cellBox.width}x${cellBox.height})`);
      }
    }

    // Start drawing a path and measure alignment
    console.log("\n=== STARTING PATH FROM DOT 1 ===");

    // Click dot 1 to start
    await page.locator('.dot[data-number="1"]').click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: "debug-visual-step1.png", fullPage: true });

    // Get SVG path elements
    const svgPath = page.locator(".path-svg");
    const svgBox = await svgPath.boundingBox();
    console.log("SVG container:", svgBox);

    // Get start cap position
    const startCap = page.locator(".path-start-cap");
    if (await startCap.count() > 0) {
      const startCapBounds = await page.evaluate(() => {
        const cap = document.querySelector('.path-start-cap');
        if (cap) {
          const rect = cap.getBoundingClientRect();
          const cx = parseFloat(cap.getAttribute('cx')) || 0;
          const cy = parseFloat(cap.getAttribute('cy')) || 0;
          return {
            bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            svgCx: cx,
            svgCy: cy,
            centerX: rect.x + rect.width / 2,
            centerY: rect.y + rect.height / 2
          };
        }
        return null;
      });

      if (startCapBounds) {
        console.log("Start cap SVG coords:", `(${startCapBounds.svgCx}, ${startCapBounds.svgCy})`);
        console.log("Start cap screen center:", `(${startCapBounds.centerX.toFixed(1)}, ${startCapBounds.centerY.toFixed(1)})`);

        // Find which cell this should align with
        const expectedCell = cellCenters.find(cell => cell.gridX === 0 && cell.gridY === 0);
        if (expectedCell) {
          const deltaX = Math.abs(startCapBounds.centerX - expectedCell.centerX);
          const deltaY = Math.abs(startCapBounds.centerY - expectedCell.centerY);
          console.log("Expected cell[0,0] center:", `(${expectedCell.centerX.toFixed(1)}, ${expectedCell.centerY.toFixed(1)})`);
          console.log("ALIGNMENT ERROR:", `ΔX=${deltaX.toFixed(1)}px, ΔY=${deltaY.toFixed(1)}px`);
        }
      }
    }

    // Now try to draw a path by dragging to adjacent cell
    console.log("\n=== EXTENDING PATH TO ADJACENT CELL ===");

    // Find cell [1,0] and drag to it
    const targetCell = cellCenters.find(cell => cell.gridX === 1 && cell.gridY === 0);
    if (targetCell) {
      console.log(`Dragging to cell[1,0] center: (${targetCell.centerX}, ${targetCell.centerY})`);

      // Drag from dot 1 to target cell center
      const dot1 = page.locator('.dot[data-number="1"]');
      const dot1Box = await dot1.boundingBox();

      if (dot1Box) {
        await page.mouse.move(dot1Box.x + dot1Box.width/2, dot1Box.y + dot1Box.height/2);
        await page.mouse.down();
        await page.mouse.move(targetCell.centerX, targetCell.centerY);
        await page.mouse.up();
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({ path: "debug-visual-step2.png", fullPage: true });

    // Analyze the path line alignment
    const pathLine = page.locator(".svg-path-line");
    if (await pathLine.count() > 0) {
      const pathData = await page.evaluate(() => {
        const line = document.querySelector('.svg-path-line');
        if (line) {
          const d = line.getAttribute('d');
          const rect = line.getBoundingClientRect();
          return { pathData: d, bounds: rect };
        }
        return null;
      });

      if (pathData) {
        console.log("\n=== PATH LINE ANALYSIS ===");
        console.log("Path data:", pathData.pathData);
        console.log("Path bounds:", pathData.bounds);

        // Parse path data to get actual coordinates
        const pathCoords = pathData.pathData.match(/[\d.]+/g);
        if (pathCoords && pathCoords.length >= 4) {
          console.log("Path start point (SVG):", `(${pathCoords[0]}, ${pathCoords[1]})`);
          console.log("Path end point (SVG):", `(${pathCoords[2]}, ${pathCoords[3]})`);

          // Convert SVG coordinates to screen coordinates
          const svgElement = await page.evaluate(() => {
            const svg = document.querySelector('.path-svg');
            if (svg) {
              const rect = svg.getBoundingClientRect();
              const viewBox = svg.getAttribute('viewBox');
              return { bounds: rect, viewBox };
            }
            return null;
          });

          if (svgElement) {
            console.log("SVG element bounds:", svgElement.bounds);
            console.log("SVG viewBox:", svgElement.viewBox);

            // Calculate scaling factors
            const [vbX, vbY, vbWidth, vbHeight] = svgElement.viewBox.split(' ').map(Number);
            const scaleX = svgElement.bounds.width / vbWidth;
            const scaleY = svgElement.bounds.height / vbHeight;

            const screenStartX = svgElement.bounds.x + (parseFloat(pathCoords[0]) - vbX) * scaleX;
            const screenStartY = svgElement.bounds.y + (parseFloat(pathCoords[1]) - vbY) * scaleY;
            const screenEndX = svgElement.bounds.x + (parseFloat(pathCoords[2]) - vbX) * scaleX;
            const screenEndY = svgElement.bounds.y + (parseFloat(pathCoords[3]) - vbY) * scaleY;

            console.log("Path start point (screen):", `(${screenStartX.toFixed(1)}, ${screenStartY.toFixed(1)})`);
            console.log("Path end point (screen):", `(${screenEndX.toFixed(1)}, ${screenEndY.toFixed(1)})`);

            // Compare with expected cell centers
            const startCell = cellCenters.find(cell => cell.gridX === 0 && cell.gridY === 0);
            const endCell = cellCenters.find(cell => cell.gridX === 1 && cell.gridY === 0);

            if (startCell && endCell) {
              const startDeltaX = Math.abs(screenStartX - startCell.centerX);
              const startDeltaY = Math.abs(screenStartY - startCell.centerY);
              const endDeltaX = Math.abs(screenEndX - endCell.centerX);
              const endDeltaY = Math.abs(screenEndY - endCell.centerY);

              console.log("\n=== ALIGNMENT ANALYSIS ===");
              console.log(`Start alignment error: ΔX=${startDeltaX.toFixed(1)}px, ΔY=${startDeltaY.toFixed(1)}px`);
              console.log(`End alignment error: ΔX=${endDeltaX.toFixed(1)}px, ΔY=${endDeltaY.toFixed(1)}px`);

              const tolerance = 2; // pixels
              const startAligned = startDeltaX <= tolerance && startDeltaY <= tolerance;
              const endAligned = endDeltaX <= tolerance && endDeltaY <= tolerance;

              console.log(`Start aligned: ${startAligned ? '✅' : '❌'}`);
              console.log(`End aligned: ${endAligned ? '✅' : '❌'}`);
            }
          }
        }
      }
    }

    // Final comparison screenshot
    await page.screenshot({ path: "debug-visual-final.png", fullPage: true });

    console.log("\n=== SUMMARY ===");
    console.log("Screenshots saved:");
    console.log("- debug-visual-initial.png");
    console.log("- debug-visual-step1.png");
    console.log("- debug-visual-step2.png");
    console.log("- debug-visual-final.png");

    // Add visual overlay to highlight centers for debugging
    await page.evaluate((cellCenters) => {
      // Add visual markers at cell centers
      cellCenters.forEach(cell => {
        const marker = document.createElement('div');
        marker.style.position = 'fixed';
        marker.style.left = (cell.centerX - 3) + 'px';
        marker.style.top = (cell.centerY - 3) + 'px';
        marker.style.width = '6px';
        marker.style.height = '6px';
        marker.style.backgroundColor = 'lime';
        marker.style.borderRadius = '50%';
        marker.style.zIndex = '9999';
        marker.style.pointerEvents = 'none';
        marker.setAttribute('data-debug-marker', `cell-${cell.gridX}-${cell.gridY}`);
        document.body.appendChild(marker);
      });
    }, cellCenters);

    await page.screenshot({ path: "debug-visual-with-markers.png", fullPage: true });
    console.log("- debug-visual-with-markers.png (with lime markers at cell centers)");
  });

  test("analyze SVG coordinate system", async ({ page }) => {
    // Set to 4x4 for different grid size analysis
    await page.locator("select#grid-size").selectOption("4");
    await page.waitForTimeout(500);

    console.log("\n=== SVG COORDINATE SYSTEM ANALYSIS ===");

    // Get SVG details
    const svgAnalysis = await page.evaluate(() => {
      const svg = document.querySelector('.path-svg');
      if (!svg) return null;

      const rect = svg.getBoundingClientRect();
      const viewBox = svg.getAttribute('viewBox');
      const style = window.getComputedStyle(svg);

      return {
        bounds: rect,
        viewBox,
        styles: {
          position: style.position,
          top: style.top,
          left: style.left,
          width: style.width,
          height: style.height
        }
      };
    });

    if (svgAnalysis) {
      console.log("SVG Analysis:", svgAnalysis);

      const [vbX, vbY, vbWidth, vbHeight] = svgAnalysis.viewBox.split(' ').map(Number);
      console.log("ViewBox dimensions:", { vbX, vbY, vbWidth, vbHeight });
      console.log("Screen dimensions:", { width: svgAnalysis.bounds.width, height: svgAnalysis.bounds.height });
      console.log("Scale factors:", {
        x: svgAnalysis.bounds.width / vbWidth,
        y: svgAnalysis.bounds.height / vbHeight
      });
    }

    // Get grid dimensions for comparison
    const gridAnalysis = await page.evaluate(() => {
      const grid = document.querySelector('.grid');
      if (!grid) return null;

      const rect = grid.getBoundingClientRect();
      const style = window.getComputedStyle(grid);

      return {
        bounds: rect,
        styles: {
          padding: style.padding,
          gap: style.gap,
          gridTemplateColumns: style.gridTemplateColumns,
          gridTemplateRows: style.gridTemplateRows
        }
      };
    });

    if (gridAnalysis) {
      console.log("Grid Analysis:", gridAnalysis);
    }
  });
});
