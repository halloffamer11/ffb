import { chromium } from 'playwright';

async function testBudgetConstraints() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('Testing Budget Constraint Behavior...');
    await page.goto('http://localhost:5173/demos/ui/T-040_budget_widget_react_validation.html');
    await page.waitForTimeout(3000);
    
    // Set up fresh draft
    console.log('\n=== Setting Up Fresh Draft ($200 budget) ===');
    await page.click('button[onclick="test1_loadFreshDraft()"]');
    await page.waitForTimeout(500);
    
    // Check initial state
    const initialState = await page.evaluate(() => {
      const state = window.testStore.getState();
      return {
        budget: state.settings?.budget || 0,
        picks: state.draft?.picks?.length || 0,
        remaining: 200 // starts with full budget
      };
    });
    console.log('Initial state:', initialState);
    
    // Draft expensive players to approach budget limit
    console.log('\n=== Drafting Expensive Players ===');
    
    // Player 1: $45
    await page.click('button[onclick="test2_draftPlayer1()"]');
    await page.waitForTimeout(500);
    
    // Player 2: $28  
    await page.click('button[onclick="test2_draftPlayer2()"]');
    await page.waitForTimeout(500);
    
    // Player 3: $12
    await page.click('button[onclick="test2_draftPlayer3()"]');
    await page.waitForTimeout(500);
    
    const afterExpensiveState = await page.evaluate(() => {
      const state = window.testStore.getState();
      const picks = state.draft?.picks || [];
      const totalSpent = picks.reduce((sum, pick) => sum + (pick.price || 0), 0);
      return {
        picks: picks.length,
        totalSpent,
        remaining: (state.settings?.budget || 200) - totalSpent,
        lastThreePicks: picks.slice(-3).map(p => ({ player: p.player?.name, price: p.price }))
      };
    });
    
    console.log('After expensive picks:', afterExpensiveState);
    
    // Try to draft more expensive players that would exceed budget
    console.log('\n=== Testing Budget Constraint Violation ===');
    
    // Attempt to manually add picks that would exceed remaining budget
    const overBudgetTest = await page.evaluate(async () => {
      const state = window.testStore.getState();
      const picks = state.draft?.picks || [];
      const totalSpent = picks.reduce((sum, pick) => sum + (pick.price || 0), 0);
      const remaining = (state.settings?.budget || 200) - totalSpent;
      
      console.log(`Current spent: $${totalSpent}, remaining: $${remaining}`);
      
      // Try to draft a player for more than remaining budget
      const excessivePricePlayer = {
        playerId: 999,
        teamId: 1,
        price: remaining + 50, // Way over budget
        player: { id: 999, name: 'Over Budget Player', position: 'RB' }
      };
      
      try {
        // This should ideally fail but currently won't due to no validation
        window.testStore.dispatch({
          type: 'DRAFT_PICK_ADD',
          payload: excessivePricePlayer
        });
        
        // Check if the pick was added
        const newState = window.testStore.getState();
        const newPicks = newState.draft?.picks || [];
        const newTotalSpent = newPicks.reduce((sum, pick) => sum + (pick.price || 0), 0);
        const wasAdded = newPicks.length > picks.length;
        
        return {
          attemptedPrice: excessivePricePlayer.price,
          wasAdded,
          newTotalSpent,
          budgetExceeded: newTotalSpent > (state.settings?.budget || 200),
          newRemaining: (state.settings?.budget || 200) - newTotalSpent
        };
        
      } catch (error) {
        return {
          attemptedPrice: excessivePricePlayer.price,
          wasAdded: false,
          error: error.message,
          validationWorking: true
        };
      }
    });
    
    console.log('Over-budget test result:', overBudgetTest);
    
    // Check final widget state
    const finalWidgetState = await page.evaluate(() => {
      const widget = document.getElementById('widget-root');
      if (widget) {
        const text = widget.textContent;
        const remainingMatch = text.match(/\$(\d+).*?Remaining Budget/);
        const spentMatch = text.match(/(\d+) players drafted for \$(\d+) total/);
        
        return {
          remainingBudget: remainingMatch ? parseInt(remainingMatch[1]) : 'not found',
          playersCount: spentMatch ? parseInt(spentMatch[1]) : 'not found',
          totalSpent: spentMatch ? parseInt(spentMatch[2]) : 'not found',
          isNegative: remainingMatch && parseInt(remainingMatch[1]) < 0
        };
      }
      return { error: 'Widget not found' };
    });
    
    console.log('Final widget state:', finalWidgetState);
    
    // Conclusion
    console.log('\n=== BUDGET VALIDATION ANALYSIS ===');
    if (overBudgetTest.wasAdded && overBudgetTest.budgetExceeded) {
      console.log('❌ ISSUE CONFIRMED: Draft picks can exceed budget without validation');
      console.log(`  - Attempted to draft for $${overBudgetTest.attemptedPrice}`);
      console.log(`  - Pick was added successfully`);
      console.log(`  - Total spent: $${overBudgetTest.newTotalSpent}`);
      console.log(`  - Budget exceeded by: $${overBudgetTest.newTotalSpent - 200}`);
    } else if (overBudgetTest.validationWorking) {
      console.log('✅ Budget validation is working - over-budget picks rejected');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testBudgetConstraints().catch(console.error);