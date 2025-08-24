import { chromium } from 'playwright';

async function testDraftFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('Testing T-040 Draft Player Functionality...');
    await page.goto('http://localhost:5173/demos/ui/T-040_budget_widget_react_validation.html');
    await page.waitForTimeout(3000);
    
    // First, load fresh draft to set initial state
    console.log('\n=== Setting Up Fresh Draft ===');
    await page.click('button[onclick="test1_loadFreshDraft()"]');
    await page.waitForTimeout(500);
    
    // Verify initial state
    const initialState = await page.evaluate(() => {
      const state = window.testStore.getState();
      return {
        picks: state.draft?.picks?.length || 0,
        settings: state.settings || {},
        hasStore: !!window.testStore
      };
    });
    
    console.log('Initial state:', initialState);
    
    // Test Draft Player 1
    console.log('\n=== Testing Draft Player 1 (Christian McCaffrey) ===');
    await page.click('button[onclick="test2_draftPlayer1()"]');
    await page.waitForTimeout(1000);
    
    // Check the results
    const test2Status = await page.locator('#test2-status').getAttribute('class');
    const test2Result = await page.locator('#test2-results').textContent();
    console.log(`Draft Player 1 Status: ${test2Status?.includes('pass') ? 'PASS' : 'FAIL'}`);
    console.log(`Result: ${test2Result}`);
    
    // Check the store state after draft
    const afterDraftState = await page.evaluate(() => {
      const state = window.testStore.getState();
      return {
        picks: state.draft?.picks?.length || 0,
        lastPick: state.draft?.picks?.[state.draft.picks.length - 1] || null,
        settings: state.settings || {}
      };
    });
    
    console.log('After draft state:', afterDraftState);
    
    // Check budget widget display
    console.log('\n=== Checking Budget Widget After Draft ===');
    const budgetAfterDraft = await page.evaluate(() => {
      const widget = document.getElementById('widget-root');
      if (widget) {
        const text = widget.textContent;
        const spentMatch = text.match(/(\d+) players drafted for \$(\d+) total/);
        const remainingMatch = text.match(/\$(\d+).*?Remaining Budget/);
        
        return {
          hasWidget: true,
          fullText: text.substring(0, 300) + '...',
          playersCount: spentMatch ? spentMatch[1] : 'not found',
          totalSpent: spentMatch ? spentMatch[2] : 'not found', 
          remainingBudget: remainingMatch ? remainingMatch[1] : 'not found'
        };
      }
      return { hasWidget: false };
    });
    
    console.log('Budget Widget After Draft:', budgetAfterDraft);
    
    // Test Draft Player 2
    console.log('\n=== Testing Draft Player 2 (Tyreek Hill) ===');
    await page.click('button[onclick="test2_draftPlayer2()"]');
    await page.waitForTimeout(1000);
    
    const test2Status2 = await page.locator('#test2-status').getAttribute('class');
    const test2Result2 = await page.locator('#test2-results').textContent();
    console.log(`Draft Player 2 Status: ${test2Status2?.includes('pass') ? 'PASS' : 'FAIL'}`);
    console.log(`Result: ${test2Result2}`);
    
    // Final state check
    const finalState = await page.evaluate(() => {
      const state = window.testStore.getState();
      return {
        totalPicks: state.draft?.picks?.length || 0,
        picks: state.draft?.picks || []
      };
    });
    
    console.log('Final state:', finalState);
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testDraftFunctionality().catch(console.error);