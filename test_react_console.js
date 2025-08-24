import { chromium } from 'playwright';

async function testReactConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleMessages = [];
  const pageErrors = [];
  
  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  const testPages = [
    'http://localhost:5173/',
    'http://localhost:5173/demos/ui/T-039_player_search_react.html',
    'http://localhost:5173/demos/ui/T-040_budget_widget_react_validation.html',
    'http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html'
  ];
  
  for (const url of testPages) {
    console.log(`\n=== Testing: ${url} ===`);
    
    try {
      await page.goto(url, { timeout: 10000 });
      await page.waitForTimeout(3000); // Wait for React to mount
      
      // Try to interact with the page
      try {
        const buttons = await page.locator('button').count();
        const inputs = await page.locator('input').count();
        console.log(`Found ${buttons} buttons and ${inputs} inputs`);
        
        if (inputs > 0) {
          await page.locator('input').first().click();
          await page.type('input:first-of-type', 'test', { delay: 100 });
        }
        
        if (buttons > 0) {
          await page.locator('button').first().click();
          await page.waitForTimeout(1000);
        }
        
      } catch (interactionError) {
        console.log(`Interaction failed: ${interactionError.message}`);
      }
      
      // Filter messages for this URL
      const urlMessages = consoleMessages.filter(msg => 
        msg.location && msg.location.url.includes(url.split('/').pop() || 'localhost:5173')
      );
      
      const errors = consoleMessages.filter(msg => msg.type === 'error');
      const warnings = consoleMessages.filter(msg => msg.type === 'warning');
      
      console.log(`Console messages: ${consoleMessages.length}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Warnings: ${warnings.length}`);
      console.log(`Page errors: ${pageErrors.length}`);
      
      if (errors.length > 0) {
        console.log('\nERRORS:');
        errors.forEach((error, i) => {
          console.log(`${i + 1}. ${error.text}`);
          if (error.location) {
            console.log(`   At: ${error.location.url}:${error.location.lineNumber}`);
          }
        });
      }
      
      if (warnings.length > 0) {
        console.log('\nWARNINGS:');
        warnings.slice(-5).forEach((warning, i) => { // Show last 5 warnings
          console.log(`${i + 1}. ${warning.text}`);
        });
      }
      
      if (pageErrors.length > 0) {
        console.log('\nPAGE ERRORS:');
        pageErrors.forEach((error, i) => {
          console.log(`${i + 1}. ${error.message}`);
          if (error.stack) console.log(`   Stack: ${error.stack.split('\n')[0]}`);
        });
      }
      
    } catch (error) {
      console.log(`Failed to load ${url}: ${error.message}`);
    }
    
    // Clear messages for next page
    consoleMessages.length = 0;
    pageErrors.length = 0;
  }
  
  await browser.close();
}

// Start dev server and test
testReactConsoleErrors().catch(console.error);