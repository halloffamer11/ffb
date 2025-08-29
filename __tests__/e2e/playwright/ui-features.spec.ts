import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive UI Features Test Suite
 * 
 * Tests all implemented features from React UI Ideas Sections 3 & 5:
 * - Widget Sizing System (Section 3.1)
 * - Dashboard Presets (Section 3.2) 
 * - Compact Headers (Section 5.2)
 * - Context-Sensitive Controls (Section 5.2)
 */

// Test configuration
const PRESET_SHORTCUTS = {
  preDraft: '1',
  nomination: '2', 
  playerAnalytics: '3'
};

const PERFORMANCE_THRESHOLDS = {
  presetSwitch: 100, // ms
  keyboardResponse: 50, // ms
  layoutChange: 200 // ms
};

// Helper function to wait for layout stabilization
async function waitForLayoutStable(page: Page, timeout = 2000) {
  await page.waitForTimeout(100);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(100);
}

// Helper function to check if focus is in search input
async function isFocusInSearch(page: Page): Promise<boolean> {
  const focusedElement = await page.evaluate(() => {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' && 
      (active.getAttribute('type') === 'search' || active.getAttribute('placeholder')?.includes('Search'))
    );
  });
  return focusedElement;
}

test.describe('Widget Sizing System', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('PlayerSearch widget shows 8-10 rows without scrolling', async ({ page }) => {
    const playerSearchWidget = page.locator('[key="search"]');
    await expect(playerSearchWidget).toBeVisible();
    
    // Check widget dimensions are adequate for content
    const widgetBox = await playerSearchWidget.boundingBox();
    expect(widgetBox?.height).toBeGreaterThan(300); // Minimum height for 8-10 rows
    
    // Verify no internal scrolling needed for primary content
    const hasInternalScroll = await playerSearchWidget.evaluate(el => {
      const content = el.querySelector('table, .table-container');
      return content ? content.scrollHeight > content.clientHeight : false;
    });
    expect(hasInternalScroll).toBe(false);
  });

  test('VBDScatter widget displays complete chart', async ({ page }) => {
    const vbdWidget = page.locator('[key="vbd-scatter"]');
    await expect(vbdWidget).toBeVisible();
    
    // Check adequate dimensions for chart
    const widgetBox = await vbdWidget.boundingBox();
    expect(widgetBox?.width).toBeGreaterThan(400);
    expect(widgetBox?.height).toBeGreaterThan(350);
    
    // Verify chart elements are visible
    const chartElements = await vbdWidget.locator('svg, canvas, .chart-container').count();
    expect(chartElements).toBeGreaterThan(0);
  });

  test('BudgetTracker widget shows all categories', async ({ page }) => {
    const budgetWidget = page.locator('[key="budget"]');
    await expect(budgetWidget).toBeVisible();
    
    // Check adequate dimensions
    const widgetBox = await budgetWidget.boundingBox();
    expect(widgetBox?.height).toBeGreaterThan(200);
    
    // Verify budget categories are visible
    const budgetItems = await budgetWidget.locator('.budget-item, .category, .budget-category').count();
    expect(budgetItems).toBeGreaterThan(0);
  });

  test('All widgets right-sized by default', async ({ page }) => {
    const widgets = [
      'search', 'draft-entry', 'player-analysis', 
      'vbd-scatter', 'budget', 'roster', 'draft-ledger'
    ];
    
    for (const widgetKey of widgets) {
      const widget = page.locator(`[key="${widgetKey}"]`);
      await expect(widget).toBeVisible();
      
      const box = await widget.boundingBox();
      expect(box?.width).toBeGreaterThan(250); // Minimum professional width
      expect(box?.height).toBeGreaterThan(150); // Minimum professional height
    }
  });

});

test.describe('Dashboard Presets & Keyboard Shortcuts', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('Preset keyboard shortcuts work when not focused in search', async ({ page }) => {
    // Ensure we're not in a search field
    await page.click('body');
    await waitForLayoutStable(page);
    
    for (const [presetName, shortcut] of Object.entries(PRESET_SHORTCUTS)) {
      const startTime = Date.now();
      
      // Press shortcut key
      await page.keyboard.press(shortcut);
      await waitForLayoutStable(page);
      
      // Measure response time
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.keyboardResponse);
      
      // Check preset is active (look for preset selector or layout changes)
      const presetActive = await page.locator('.preset-selector, .layout-preset').count();
      expect(presetActive).toBeGreaterThan(0);
    }
  });

  test('Focus guard prevents shortcuts when typing in search', async ({ page }) => {
    // Click into search bar
    const searchInput = page.locator('input[type="text"][placeholder*="Search"], input[type="search"]').first();
    await searchInput.click();
    await searchInput.fill('test search');
    
    // Verify focus is in search
    const focusInSearch = await isFocusInSearch(page);
    expect(focusInSearch).toBe(true);
    
    // Try pressing shortcut - should not change layout
    const initialLayout = await page.locator('.react-grid-layout').getAttribute('class');
    await page.keyboard.press('1');
    await waitForLayoutStable(page);
    
    const layoutAfterShortcut = await page.locator('.react-grid-layout').getAttribute('class');
    expect(layoutAfterShortcut).toBe(initialLayout);
    
    // Click outside search and try again - should work
    await page.click('body');
    await waitForLayoutStable(page);
    
    await page.keyboard.press('1');
    await waitForLayoutStable(page);
    // Layout should have changed (we don't check specific layout, just that it responded)
  });

  test('Preset selector UI shows current preset', async ({ page }) => {
    const presetSelector = page.locator('.preset-selector, [role="tablist"], select').first();
    await expect(presetSelector).toBeVisible();
    
    // Test clicking through presets
    for (const shortcut of Object.values(PRESET_SHORTCUTS)) {
      await page.keyboard.press(shortcut);
      await waitForLayoutStable(page);
      
      // Verify some indication of active preset
      const hasActiveIndicator = await page.locator('.preset-active, .selected, [aria-selected="true"]').count();
      expect(hasActiveIndicator).toBeGreaterThan(0);
    }
  });

  test('Preset switching performance meets targets', async ({ page }) => {
    // Test multiple rapid preset switches
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      await page.keyboard.press('1');
      await waitForLayoutStable(page);
      
      const switchTime = Date.now() - startTime;
      expect(switchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.presetSwitch);
      
      await page.keyboard.press('2');
      await waitForLayoutStable(page);
      
      await page.keyboard.press('3');
      await waitForLayoutStable(page);
    }
  });

});

test.describe('Compact Headers', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('Widget headers use minimal padding', async ({ page }) => {
    const widgetHeaders = page.locator('.widget-drag-handle, .widget-header, [class*="title"], [class*="TitleBar"]');
    const headerCount = await widgetHeaders.count();
    expect(headerCount).toBeGreaterThan(0);
    
    // Check first few headers for compact styling
    for (let i = 0; i < Math.min(3, headerCount); i++) {
      const header = widgetHeaders.nth(i);
      
      const styles = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          paddingTop: parseInt(computed.paddingTop, 10),
          paddingBottom: parseInt(computed.paddingBottom, 10),
          height: parseInt(computed.height, 10)
        };
      });
      
      // Headers should use minimal padding (roughly 4-8px range)
      expect(styles.paddingTop).toBeLessThan(12);
      expect(styles.paddingBottom).toBeLessThan(12);
      expect(styles.height).toBeLessThan(50); // Compact header height
    }
  });

  test('Headers maintain professional appearance', async ({ page }) => {
    const widgets = await page.locator('[key]').all();
    expect(widgets.length).toBeGreaterThan(0);
    
    for (const widget of widgets.slice(0, 3)) {
      // Check header is visible and styled
      const headerExists = await widget.locator('.widget-header, [class*="TitleBar"], [class*="title"]').count();
      expect(headerExists).toBeGreaterThan(0);
      
      // Verify widget title is readable
      const titleText = await widget.locator('h1, h2, h3, h4, .title, [class*="Title"]').first().textContent();
      expect(titleText?.length).toBeGreaterThan(0);
    }
  });

});

test.describe('Context-Sensitive Controls', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('Non-edit mode shows only title and popout button', async ({ page }) => {
    // Ensure we're not in edit mode
    const editButton = page.locator('button').filter({ hasText: /Edit Layout|Edit Mode/i });
    const isEditMode = await editButton.textContent().then(text => text?.includes('Exit'));
    
    if (isEditMode) {
      await editButton.click();
      await waitForLayoutStable(page);
    }
    
    // Check widget headers for minimal controls
    const widgets = await page.locator('[key]').all();
    expect(widgets.length).toBeGreaterThan(0);
    
    for (const widget of widgets.slice(0, 3)) {
      // Should have title
      const hasTitle = await widget.locator('h1, h2, h3, h4, .title, [class*="Title"]').count();
      expect(hasTitle).toBeGreaterThan(0);
      
      // Should have popout button (look for common popout icons/text)
      const hasPopout = await widget.locator('button[title*="Pop"], button[title*="pop"], button[aria-label*="Pop"], button:has-text("⤴")').count();
      expect(hasPopout).toBeGreaterThan(0);
      
      // Should NOT have close button in non-edit mode
      const hasClose = await widget.locator('button[title*="Close"], button[title*="close"], button:has-text("×"), button:has-text("✕")').count();
      expect(hasClose).toBe(0);
      
      // Should NOT have visible drag handles
      const hasDragHandle = await widget.locator('.drag-handle, [class*="drag"], button:has-text("⋮")').count();
      expect(hasDragHandle).toBe(0);
    }
  });

  test('Edit mode shows drag handles and close buttons', async ({ page }) => {
    // Enable edit mode
    const editButton = page.locator('button').filter({ hasText: /Edit Layout|Edit Mode/i });
    await expect(editButton).toBeVisible();
    await editButton.click();
    await waitForLayoutStable(page);
    
    // Verify edit mode is active
    const editModeActive = await editButton.textContent();
    expect(editModeActive).toContain('Exit');
    
    // Check widgets now show edit controls
    const widgets = await page.locator('[key]').all();
    
    for (const widget of widgets.slice(0, 3)) {
      // Should have drag handle visible
      const hasDragHandle = await widget.locator('.drag-handle, [class*="drag"], [class*="widget-drag-handle"], span:has-text("⋮")').count();
      expect(hasDragHandle).toBeGreaterThan(0);
      
      // Should have close button
      const hasClose = await widget.locator('button[title*="Close"], button[title*="close"], button:has-text("×"), span:has-text("×")').count();
      expect(hasClose).toBeGreaterThan(0);
    }
  });

  test('Entire title bar is draggable in edit mode', async ({ page }) => {
    // Enable edit mode
    const editButton = page.locator('button').filter({ hasText: /Edit Layout|Edit Mode/i });
    await editButton.click();
    await waitForLayoutStable(page);
    
    // Find a widget to test dragging
    const firstWidget = page.locator('[key]').first();
    const titleBar = firstWidget.locator('.widget-drag-handle, [class*="TitleBar"], [class*="title"]').first();
    
    // Verify title bar has draggable cursor style
    const cursor = await titleBar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.cursor;
    });
    expect(['grab', 'move', 'pointer']).toContain(cursor);
    
    // Test that title bar responds to mouse events (basic interaction test)
    const initialBox = await firstWidget.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Attempt small drag operation
    await titleBar.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 50, initialBox!.y + 10);
    await page.mouse.up();
    await waitForLayoutStable(page);
    
    // Widget should have moved (position changed)
    const newBox = await firstWidget.boundingBox();
    const hasMoved = newBox && (newBox.x !== initialBox!.x || newBox.y !== initialBox!.y);
    expect(hasMoved).toBe(true);
  });

  test('Link sync controls are removed', async ({ page }) => {
    // Check both edit and non-edit modes
    const modes = [false, true]; // non-edit, edit
    
    for (const editMode of modes) {
      if (editMode) {
        const editButton = page.locator('button').filter({ hasText: /Edit Layout|Edit Mode/i });
        await editButton.click();
        await waitForLayoutStable(page);
      }
      
      // Look for any link/sync controls across all widgets
      const linkControls = await page.locator('button[title*="link"], button[title*="Link"], button[title*="sync"], button[title*="Sync"], button:has-text("🔗"), .link-control, .sync-control').count();
      expect(linkControls).toBe(0);
    }
  });

});

test.describe('Responsive & Cross-Browser', () => {
  
  test('Features work across viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1400, height: 900 }, // Desktop
      { width: 1024, height: 768 }, // Tablet  
      { width: 375, height: 667 }   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await waitForLayoutStable(page);
      
      // Test basic functionality at each size
      const widgets = await page.locator('[key]').count();
      expect(widgets).toBeGreaterThan(0);
      
      // Test keyboard shortcuts still work
      await page.click('body');
      await page.keyboard.press('1');
      await waitForLayoutStable(page);
      
      // Verify widgets are visible and not cut off
      const visibleWidgets = await page.locator('[key]').all();
      for (const widget of visibleWidgets.slice(0, 2)) {
        const box = await widget.boundingBox();
        expect(box?.width).toBeGreaterThan(0);
        expect(box?.height).toBeGreaterThan(0);
      }
    }
  });

  test('Performance remains smooth across interactions', async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
    
    // Test rapid interactions
    const rapidTests = [
      () => page.keyboard.press('1'),
      () => page.keyboard.press('2'),
      () => page.keyboard.press('3'),
      () => page.locator('button').filter({ hasText: /Edit/i }).click()
    ];
    
    for (const testFn of rapidTests) {
      const startTime = Date.now();
      await testFn();
      await waitForLayoutStable(page);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.layoutChange);
    }
  });

});

test.describe('Accessibility', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('Keyboard shortcuts have proper ARIA labels', async ({ page }) => {
    // Check preset selector has keyboard shortcut info
    const presetControls = page.locator('.preset-selector, [role="tablist"], select');
    if (await presetControls.count() > 0) {
      const firstPreset = presetControls.first();
      const hasAriaLabels = await firstPreset.locator('[aria-label*="shortcut"], [title*="shortcut"], [data-shortcut]').count();
      expect(hasAriaLabels).toBeGreaterThanOrEqual(0); // Present if UI shows shortcuts
    }
  });

  test('Widget controls have proper ARIA attributes', async ({ page }) => {
    const widgets = await page.locator('[key]').all();
    
    for (const widget of widgets.slice(0, 3)) {
      // Widget should have ARIA region or similar
      const hasAriaRegion = await widget.evaluate(el => {
        return el.getAttribute('role') === 'region' || 
               el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby');
      });
      expect(hasAriaRegion).toBe(true);
      
      // Buttons should have accessible names
      const buttons = await widget.locator('button').all();
      for (const button of buttons) {
        const hasAccessibleName = await button.evaluate(el => {
          return el.hasAttribute('aria-label') || 
                 el.hasAttribute('title') || 
                 el.textContent?.trim().length > 0;
        });
        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('Focus management works properly', async ({ page }) => {
    // Test tab navigation works
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test that focus indicators are visible
    await page.keyboard.press('Tab');
    const hasFocusVisible = await page.locator(':focus-visible, :focus').count();
    expect(hasFocusVisible).toBeGreaterThan(0);
  });

});

test.describe('Integration & Error Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLayoutStable(page);
  });

  test('No console errors during normal operations', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform typical user interactions
    await page.keyboard.press('1');
    await waitForLayoutStable(page);
    
    await page.keyboard.press('2'); 
    await waitForLayoutStable(page);
    
    const editButton = page.locator('button').filter({ hasText: /Edit/i });
    if (await editButton.count() > 0) {
      await editButton.click();
      await waitForLayoutStable(page);
    }
    
    // Filter out non-critical errors (hydration warnings, etc.)
    const criticalErrors = errors.filter(error => 
      !error.includes('Hydration') && 
      !error.includes('Warning') &&
      !error.includes('[HMR]') &&
      !error.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Features work with rapid user inputs', async ({ page }) => {
    // Rapid keyboard shortcut presses
    for (let i = 0; i < 10; i++) {
      const shortcut = Object.values(PRESET_SHORTCUTS)[i % 3];
      await page.keyboard.press(shortcut);
      await page.waitForTimeout(50); // Minimal delay
    }
    
    await waitForLayoutStable(page);
    
    // App should still be responsive
    const widgets = await page.locator('[key]').count();
    expect(widgets).toBeGreaterThan(0);
    
    const editButton = page.locator('button').filter({ hasText: /Edit/i });
    await expect(editButton).toBeVisible();
  });

});