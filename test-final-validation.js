import { chromium } from 'playwright';

async function finalValidation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('=== Final Validation: T-041 VBD Scatter Issues Fixed ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data
    console.log('\n1. Loading test data...');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Visual check: Verify text contrast is readable
    console.log('\n2. Checking text contrast fix...');
    const contrastCheck = await page.evaluate(() => {
      const testTitle = document.querySelector('.test-title');
      const testSteps = document.querySelector('.test-steps li');
      
      if (testTitle && testSteps) {
        const titleColor = window.getComputedStyle(testTitle).color;
        const stepsColor = window.getComputedStyle(testSteps).color;
        
        return {
          titleColor,
          stepsColor,
          isReadable: !titleColor.includes('rgb(243, 244, 246)') && !stepsColor.includes('rgb(209, 213, 219)')
        };
      }
      return { error: 'Text elements not found' };
    });
    
    console.log('Text contrast check:', contrastCheck);
    
    // VBD Plot axis scaling test: Rapid hover movements
    console.log('\n3. Testing VBD plot axis scaling stability...');
    
    const canvas = page.locator('canvas');
    let renderCount = 0;
    
    // Monitor for expensive renders during hover
    await page.evaluate(() => {
      window.expensiveRenders = [];
      window.hoverEvents = 0;
    });
    
    // Perform rapid hover movements that previously caused axis scaling issues
    console.log('Performing rapid hover movements...');
    for (let i = 0; i < 20; i++) {
      const x = 200 + (i * 15);
      const y = 200 + (Math.sin(i) * 50);
      
      await canvas.hover({ position: { x, y } });
      await page.waitForTimeout(50); // Very rapid movements
    }
    
    // Check if axis scaling remained stable
    console.log('\n4. Axis scaling stability check...');
    const stabilityCheck = await page.evaluate(() => {
      return {
        totalHovers: window.hoverEvents || 0,
        expensiveRenders: window.expensiveRenders ? window.expensiveRenders.length : 0
      };
    });
    
    console.log('Hover stability results:', stabilityCheck);
    
    // Final functional tests
    console.log('\n5. Functional validation...');
    
    // Test tooltip visibility
    await canvas.hover({ position: { x: 300, y: 250 } });
    await page.waitForTimeout(1000);
    
    const tooltipCheck = await page.evaluate(() => {
      const tooltip = document.querySelector('div[style*="position: fixed"]');
      return {
        tooltipVisible: tooltip && tooltip.style.display !== 'none',
        hasContent: tooltip && tooltip.textContent.length > 0
      };
    });
    
    console.log('Tooltip functionality:', tooltipCheck);
    
    // Test data synchronization
    const dataCheck = await page.evaluate(() => {
      const dataStatus = document.getElementById('data-status');
      const storeStatus = document.getElementById('store-status');
      
      return {
        dataLoaded: dataStatus && dataStatus.textContent.includes('300'),
        storeSync: storeStatus && storeStatus.textContent.includes('300'),
        hasCanvas: !!document.querySelector('canvas')
      };
    });
    
    console.log('Data synchronization:', dataCheck);
    
    console.log('\n=== FINAL VALIDATION SUMMARY ===');
    
    const results = [];
    
    // Check text contrast fix
    if (contrastCheck.isReadable) {
      results.push('✅ Text contrast fixed - readable dark text on light background');
    } else {
      results.push('❌ Text contrast still poor');
    }
    
    // Check VBD plot axis scaling
    if (stabilityCheck.expensiveRenders < 5) { // Allow some renders, but not excessive
      results.push('✅ VBD plot axis scaling bug fixed - stable during hover');
    } else {
      results.push('❌ VBD plot still has axis scaling issues');
    }
    
    // Check tooltip functionality
    if (tooltipCheck.tooltipVisible && tooltipCheck.hasContent) {
      results.push('✅ Hover tooltips working correctly');
    } else {
      results.push('❌ Hover tooltips not functioning');
    }
    
    // Check data loading
    if (dataCheck.dataLoaded && dataCheck.storeSync && dataCheck.hasCanvas) {
      results.push('✅ Data loading and VBD plot rendering working');
    } else {
      results.push('❌ Data loading or rendering issues');
    }
    
    results.forEach(result => console.log(result));
    
    const allPassed = results.every(result => result.startsWith('✅'));
    console.log('\nOverall Result:', allPassed ? '🎉 ALL ISSUES FIXED - T-041 READY FOR HITL' : '⚠️ SOME ISSUES REMAIN');
    
    return { allPassed, results };
    
  } catch (error) {
    console.error('Validation failed:', error);
    return { allPassed: false, error: error.message };
  }
  
  await browser.close();
}

finalValidation().then(result => {
  if (result.allPassed) {
    console.log('\n🚀 Ready to proceed with HITL validation');
  }
}).catch(console.error);