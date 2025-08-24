import { test, expect } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
  timestamp: number;
}

test.describe('React Dashboard Console Errors', () => {
  let consoleMessages: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    
    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
        timestamp: Date.now()
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        location: error.stack?.split('\n')[1] || 'unknown',
        timestamp: Date.now()
      });
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      consoleMessages.push({
        type: 'requestfailed',
        text: `Failed to load: ${request.url()} - ${request.failure()?.errorText}`,
        timestamp: Date.now()
      });
    });
  });

  test('should capture console errors during React dashboard load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount and render
    await page.waitForTimeout(3000);
    
    // Try to interact with key React components
    try {
      // Look for React components
      await page.waitForSelector('[data-testid="react-dashboard"], .dashboard, #app', { timeout: 5000 });
      
      // Try to interact with search if it exists
      const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }
      
      // Try to click buttons/widgets
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        await buttons.first().click();
        await page.waitForTimeout(500);
      }
      
    } catch (error) {
      console.log('Error during interaction:', error);
    }

    // Additional wait to capture any async errors
    await page.waitForTimeout(2000);

    // Filter and categorize console messages
    const errors = consoleMessages.filter(msg => 
      msg.type === 'error' || msg.type === 'pageerror'
    );
    
    const warnings = consoleMessages.filter(msg => 
      msg.type === 'warning' || msg.type === 'warn'
    );
    
    const requestFailures = consoleMessages.filter(msg => 
      msg.type === 'requestfailed'
    );

    // Log all console messages for analysis
    console.log('\n=== CONSOLE ANALYSIS REPORT ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Request failures: ${requestFailures.length}`);
    
    if (errors.length > 0) {
      console.log('\n--- ERRORS ---');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
        if (error.location) console.log(`   Location: ${error.location}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n--- WARNINGS ---');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.type}] ${warning.text}`);
        if (warning.location) console.log(`   Location: ${warning.location}`);
      });
    }
    
    if (requestFailures.length > 0) {
      console.log('\n--- REQUEST FAILURES ---');
      requestFailures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.text}`);
      });
    }

    console.log('\n--- ALL MESSAGES ---');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location) console.log(`   Location: ${msg.location}`);
    });

    // Create a summary object for further analysis
    const summary = {
      totalMessages: consoleMessages.length,
      errors: errors.map(e => ({ type: e.type, message: e.text, location: e.location })),
      warnings: warnings.map(w => ({ type: w.type, message: w.text, location: w.location })),
      requestFailures: requestFailures.map(r => ({ message: r.text })),
      allMessages: consoleMessages.map(m => ({ 
        type: m.type, 
        message: m.text, 
        location: m.location,
        timestamp: m.timestamp 
      }))
    };

    // Store results for analysis
    await page.evaluate((data) => {
      window.consoleErrorAnalysis = data;
    }, summary);
    
    console.log('\n=== END REPORT ===\n');
  });

  test('should test React component functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount
    await page.waitForTimeout(2000);
    
    console.log('\n=== REACT FUNCTIONALITY TEST ===');
    
    // Test if React has mounted
    const reactRoot = await page.locator('#app, #root, [data-reactroot]').count();
    console.log(`React root elements found: ${reactRoot}`);
    
    // Test for React DevTools
    const hasReactDevTools = await page.evaluate(() => {
      return typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    });
    console.log(`React DevTools detected: ${hasReactDevTools}`);
    
    // Test basic interactivity
    try {
      const interactiveElements = await page.locator('button, input, select, [onClick]').count();
      console.log(`Interactive elements found: ${interactiveElements}`);
      
      if (interactiveElements > 0) {
        console.log('Testing interaction with first button/input...');
        await page.locator('button, input').first().click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log(`Interaction test failed: ${error}`);
    }
    
    console.log('=== END FUNCTIONALITY TEST ===\n');
  });
});