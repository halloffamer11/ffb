const { test, expect } = require('@playwright/test');

test.describe('Beer Sheet Widget Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Switch to custom layout (keyboard shortcut '4')
    await page.keyboard.press('4');
    await page.waitForTimeout(1000);
  });

  test('should display all column headers without truncation', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    await expect(beerSheetWidget).toBeVisible();
    
    // Check all headers are visible in position tables
    const positionTables = beerSheetWidget.locator('table').first();
    
    // Verify all headers exist and are visible
    const headers = ['Name', 'TM', 'BYE', 'VBD', 'VAL%', '$', 'L', 'H'];
    for (const header of headers) {
      const headerElement = positionTables.locator(`thead th:has-text("${header}")`);
      await expect(headerElement).toBeVisible();
      
      // Verify header is not truncated by checking if it's fully visible
      const boundingBox = await headerElement.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(10); // Should be at least 10px wide
    }
  });

  test('should highlight all rows on hover', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    const positionTable = beerSheetWidget.locator('table').first();
    
    // Get all data rows (exclude header)
    const dataRows = positionTable.locator('tbody tr');
    const rowCount = await dataRows.count();
    
    // Test hover on first 5 rows (or all if fewer than 5)
    const testCount = Math.min(5, rowCount);
    
    for (let i = 0; i < testCount; i++) {
      const row = dataRows.nth(i);
      
      // Get initial background color
      const initialBackground = await row.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Hover over the row
      await row.hover();
      
      // Get background color after hover
      const hoverBackground = await row.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Background should change on hover
      expect(hoverBackground).not.toBe(initialBackground);
    }
  });

  test('should focus players when clicked', async ({ page }) => {
    // First, ensure we can access the unified store
    await page.addScriptTag({
      content: `
        window.testStore = {
          getSelectedPlayer: () => window.store?.ui?.selectedPlayer || null
        };
      `
    });
    
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    const positionTable = beerSheetWidget.locator('table').first();
    
    // Click on the first available (non-drafted) player
    const firstRow = positionTable.locator('tbody tr').first();
    await firstRow.click();
    
    // Wait for state to update
    await page.waitForTimeout(500);
    
    // Check that a player is now selected
    const selectedPlayer = await page.evaluate(() => {
      return window.testStore?.getSelectedPlayer?.() || 
             window.store?.ui?.selectedPlayer ||
             null;
    });
    
    expect(selectedPlayer).toBeTruthy();
    expect(selectedPlayer.name).toBeTruthy();
  });

  test('should show all columns without truncation in overall table', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    
    // Find the overall table (should be the rightmost column)
    const overallTable = beerSheetWidget.locator('table').last();
    
    // Check that overall table headers are visible
    const overallHeaders = ['Ovr', 'Name', 'Pos', 'VBD'];
    for (const header of overallHeaders) {
      const headerElement = overallTable.locator(`thead th:has-text("${header}")`);
      await expect(headerElement).toBeVisible();
    }
    
    // Check that we can see at least 10 players in overall ranking
    const overallRows = overallTable.locator('tbody tr');
    const overallCount = await overallRows.count();
    expect(overallCount).toBeGreaterThanOrEqual(10);
  });

  test('should sync focus across widgets', async ({ page }) => {
    // Open player search widget as well
    await page.keyboard.press('n'); // Toggle navigation to access more widgets
    await page.waitForTimeout(1000);
    
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    const playerSearchWidget = page.locator('[data-widget="player-search"]').first();
    
    // If player search widget exists, test cross-widget sync
    if (await playerSearchWidget.isVisible()) {
      // Click a player in beer sheet
      const beerSheetTable = beerSheetWidget.locator('table').first();
      const firstPlayer = beerSheetTable.locator('tbody tr').first();
      const playerName = await firstPlayer.locator('td').first().textContent();
      
      await firstPlayer.click();
      await page.waitForTimeout(500);
      
      // Check if the same player is highlighted in search widget
      const highlightedInSearch = playerSearchWidget.locator(`tr[aria-selected="true"]`);
      if (await highlightedInSearch.count() > 0) {
        const selectedName = await highlightedInSearch.locator('td').first().textContent();
        expect(selectedName).toContain(playerName.trim());
      }
    }
  });

  test('should not show draft dialogs on click', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    const positionTable = beerSheetWidget.locator('table').first();
    
    // Click on first player
    const firstRow = positionTable.locator('tbody tr').first();
    await firstRow.click();
    
    // Wait a moment for any potential dialog
    await page.waitForTimeout(1000);
    
    // Check that no draft dialog is visible
    const draftDialog = page.locator('[data-testid="draft-dialog"], .dialog, .modal').first();
    await expect(draftDialog).not.toBeVisible();
    
    // Check that no overlay is visible
    const overlay = page.locator('.overlay').first();
    await expect(overlay).not.toBeVisible();
  });

  test('should show proper tooltips', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    const positionTable = beerSheetWidget.locator('table').first();
    
    // Hover over first row to see tooltip
    const firstRow = positionTable.locator('tbody tr').first();
    await firstRow.hover();
    
    // Check tooltip content (this might require specific setup depending on tooltip implementation)
    const tooltip = await firstRow.getAttribute('title');
    expect(tooltip).toMatch(/Click to focus/);
    expect(tooltip).not.toMatch(/Click to draft/);
  });

  test('should handle dropdown limit changes', async ({ page }) => {
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    
    // Find QB dropdown (should be in first position header)
    const qbHeader = beerSheetWidget.locator('thead th, .position-header').first();
    const qbDropdown = qbHeader.locator('select').first();
    
    if (await qbDropdown.isVisible()) {
      // Change QB limit from 30 to 20
      await qbDropdown.selectOption('20');
      await page.waitForTimeout(1000);
      
      // Count QB rows (should be 20 or fewer)
      const qbTable = beerSheetWidget.locator('table').first();
      const qbRows = qbTable.locator('tbody tr');
      const qbCount = await qbRows.count();
      
      expect(qbCount).toBeLessThanOrEqual(20);
      expect(qbCount).toBeGreaterThan(15); // Should be close to 20
    }
  });
});

test.describe('Console Error Validation', () => {
  test('should have no console errors during interaction', async ({ page }) => {
    const errors = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform typical user interactions
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Switch layout
    await page.keyboard.press('4');
    await page.waitForTimeout(1000);
    
    // Interact with beer sheet
    const beerSheetWidget = page.locator('[data-widget="beer-sheet"]').first();
    if (await beerSheetWidget.isVisible()) {
      const firstRow = beerSheetWidget.locator('tbody tr').first();
      await firstRow.hover();
      await firstRow.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Source map') && // Ignore source map errors
      !error.includes('installHook.js') // Ignore dev tool errors
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});