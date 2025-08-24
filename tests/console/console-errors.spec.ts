import { test, expect, Page } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
}

test.describe('Console Error Monitoring', () => {
  test('should have no styled-components prop warnings', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    
    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url
      });
    });

    // Navigate to the application
    await page.goto('/');
    
    // Wait for the React app to fully render
    await page.waitForSelector('#root');
    await page.waitForTimeout(3000);

    // Filter styled-components warnings
    const styledComponentsWarnings = consoleMessages.filter(msg =>
      msg.type === 'warning' && 
      msg.text.includes('styled-components: it looks like an unknown prop')
    );

    // Filter React prop warnings  
    const reactPropWarnings = consoleMessages.filter(msg =>
      msg.type === 'warning' && 
      msg.text.includes('Received') && 
      msg.text.includes('for a non-boolean attribute')
    );

    // Filter critical errors
    const criticalErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('favicon.ico') && // Ignore favicon 404
      !msg.text.includes('Source map error') // Ignore source map errors
    );

    // Report findings
    console.log('=== Console Messages Summary ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Styled-components warnings: ${styledComponentsWarnings.length}`);
    console.log(`React prop warnings: ${reactPropWarnings.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);

    if (styledComponentsWarnings.length > 0) {
      console.log('\n=== Styled-components Warnings ===');
      styledComponentsWarnings.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (reactPropWarnings.length > 0) {
      console.log('\n=== React Prop Warnings ===');
      reactPropWarnings.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (criticalErrors.length > 0) {
      console.log('\n=== Critical Errors ===');
      criticalErrors.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    // Assertions
    expect(styledComponentsWarnings.length).toBe(0);
    expect(reactPropWarnings.length).toBe(0);
    expect(criticalErrors.length).toBe(0);
  });

  test('should render React application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React root
    await expect(page.locator('#root')).toBeVisible();
    
    // Check if main components are loaded
    await expect(page.locator('[data-testid="top-app-bar"], .top-app-bar, header')).toBeVisible({ timeout: 10000 });
    
    // Verify the page title
    await expect(page).toHaveTitle(/FFB Draft Helper/);
  });

  test('should load widgets without errors', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()?.url
        });
      }
    });

    await page.goto('/');
    
    // Wait for widgets to load
    await page.waitForTimeout(5000);
    
    // Check for widget-specific errors
    const widgetErrors = consoleMessages.filter(msg =>
      msg.text.includes('Widget') ||
      msg.text.includes('PlayerSearch') ||
      msg.text.includes('BudgetTracker') ||
      msg.text.includes('VBDScatter')
    );

    if (widgetErrors.length > 0) {
      console.log('\n=== Widget Errors ===');
      widgetErrors.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    expect(widgetErrors.length).toBe(0);
  });

  test('should allow widget drag and resize without errors', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Try to find a draggable widget
    const widgets = page.locator('.react-grid-item');
    const widgetCount = await widgets.count();

    if (widgetCount > 0) {
      const firstWidget = widgets.first();
      
      // Try to drag the widget
      const box = await firstWidget.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.up();
        
        // Wait for any drag-related errors
        await page.waitForTimeout(1000);
      }
    }

    // Filter out expected messages
    const unexpectedMessages = consoleMessages.filter(msg =>
      !msg.text.includes('cdn.tailwindcss.com') &&
      !msg.text.includes('favicon.ico') &&
      !msg.text.includes('Source map error')
    );

    if (unexpectedMessages.length > 0) {
      console.log('\n=== Drag/Resize Errors ===');
      unexpectedMessages.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    expect(unexpectedMessages.length).toBe(0);
  });
});