import { chromium } from 'playwright';

async function testBudgetValidation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('Testing T-040 Budget Validation...');
    await page.goto('http://localhost:5173/demos/ui/T-040_budget_widget_react_validation.html');
    await page.waitForTimeout(3000);
    
    // Test 1: Load Fresh Draft
    console.log('\n=== Testing Load Fresh Draft ===');
    await page.click('button[onclick="test1_loadFreshDraft()"]');
    await page.waitForTimeout(1000);
    
    // Check the result
    const test1Status = await page.locator('#test1-status').getAttribute('class');
    const test1Result = await page.locator('#test1-results').textContent();
    console.log(`Load Fresh Draft Status: ${test1Status?.includes('pass') ? 'PASS' : 'FAIL'}`);
    console.log(`Result: ${test1Result}`);
    
    // Test 2: Verify Initial Budget
    console.log('\n=== Testing Verify Initial Budget ===');
    await page.click('button[onclick="test1_verifyInitialBudget()"]');
    await page.waitForTimeout(1000);
    
    const test1Status2 = await page.locator('#test1-status').getAttribute('class');
    const test1Result2 = await page.locator('#test1-results').textContent();
    console.log(`Initial Budget Verification Status: ${test1Status2?.includes('pass') ? 'PASS' : 'FAIL'}`);
    console.log(`Result: ${test1Result2}`);
    
    // Check the budget widget display
    console.log('\n=== Checking Budget Widget Display ===');
    const budgetDisplay = await page.evaluate(() => {
      const widget = document.getElementById('widget-root');
      if (widget) {
        const remainingBudget = widget.querySelector('[style*="color: #1e293b"]');
        return {
          hasWidget: true,
          remainingBudgetText: remainingBudget ? remainingBudget.textContent : 'Not found',
          widgetPreview: widget.textContent.substring(0, 200) + '...'
        };
      }
      return { hasWidget: false };
    });
    
    console.log('Budget Widget Status:', budgetDisplay.hasWidget ? 'FOUND' : 'NOT FOUND');
    if (budgetDisplay.hasWidget) {
      console.log('Remaining Budget Display:', budgetDisplay.remainingBudgetText);
      console.log('Widget Preview:', budgetDisplay.widgetPreview);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testBudgetValidation().catch(console.error);