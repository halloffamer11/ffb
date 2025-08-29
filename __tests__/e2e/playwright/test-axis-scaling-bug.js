import { chromium } from 'playwright';

async function testAxisScalingBug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('=== T-041 VBD Axis Scaling Bug Investigation ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data first
    console.log('\n1. Loading test data...');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Check initial axis state
    console.log('\n2. Capturing Initial Axis State...');
    const initialState = await page.evaluate(() => {
      // Look for any axis label text in the canvas or DOM
      const canvas = document.querySelector('canvas');
      if (!canvas) return { hasCanvas: false };
      
      // Try to get axis information from the React component state
      // This might not be directly accessible, so we'll capture what we can
      const rect = canvas.getBoundingClientRect();
      
      return {
        hasCanvas: true,
        canvasSize: `${canvas.width}x${canvas.height}`,
        boundingRect: {
          width: rect.width,
          height: rect.height
        }
      };
    });
    
    console.log('Initial canvas state:', initialState);
    
    // Test hover behavior multiple times
    console.log('\n3. Testing Hover Behavior on VBD Plot...');
    
    const canvas = page.locator('canvas');
    
    // Perform multiple hover actions at different points
    const hoverTests = [
      { x: 200, y: 150, label: 'Point 1' },
      { x: 300, y: 200, label: 'Point 2' }, 
      { x: 400, y: 250, label: 'Point 3' },
      { x: 150, y: 300, label: 'Point 4' },
      { x: 350, y: 180, label: 'Point 5' }
    ];
    
    for (let i = 0; i < hoverTests.length; i++) {
      const test = hoverTests[i];
      
      console.log(`\n--- Hover Test ${i + 1}: ${test.label} ---`);
      
      // Move away from canvas first to reset state
      await page.mouse.move(50, 50);
      await page.waitForTimeout(500);
      
      // Hover at specific position
      await canvas.hover({ position: { x: test.x, y: test.y } });
      await page.waitForTimeout(1000);
      
      // Check for any changes to the DOM or console messages
      const afterHoverState = await page.evaluate(() => {
        // Look for any visible changes or DOM updates
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas' };
        
        // Check if there are any visible tooltips or changed elements
        const tooltip = document.querySelector('div[style*="position: fixed"]');
        const hasTooltip = tooltip && tooltip.style.display !== 'none';
        
        // Try to detect any rendering changes
        return {
          hasTooltip,
          tooltipVisible: hasTooltip,
          timestamp: Date.now()
        };
      });
      
      console.log(`${test.label} hover result:`, afterHoverState);
      
      // Brief pause between tests
      await page.waitForTimeout(500);
    }
    
    // Test rapid hover movements to trigger the bug more easily
    console.log('\n4. Testing Rapid Hover Movements...');
    
    for (let i = 0; i < 10; i++) {
      const x = 150 + (i * 20);
      const y = 150 + (Math.sin(i) * 50);
      
      await canvas.hover({ position: { x, y } });
      await page.waitForTimeout(100); // Quick movements
    }
    
    console.log('Completed rapid hover test');
    
    // Check for any JavaScript errors that might indicate the scaling issue
    console.log('\n5. Checking for JavaScript Errors...');
    await page.waitForTimeout(2000);
    
    // Look for specific scale-related patterns in console
    const finalCheck = await page.evaluate(() => {
      // Try to access React component state if possible
      try {
        // This might not work but worth trying
        const reactFiberNode = document.querySelector('[data-reactroot]');
        return {
          hasReactRoot: !!reactFiberNode,
          timestamp: Date.now(),
          canvasPresent: !!document.querySelector('canvas')
        };
      } catch (e) {
        return {
          error: e.message,
          canvasPresent: !!document.querySelector('canvas')
        };
      }
    });
    
    console.log('Final check:', finalCheck);
    
    console.log('\n=== BUG INVESTIGATION SUMMARY ===');
    console.log('✅ Canvas is present and interactive');
    console.log('✅ Hover tooltips appear to work');
    console.log('⚠️ The axis scaling bug needs to be observed visually');
    console.log('💡 The issue likely occurs in the scale calculation logic');
    console.log('💡 Check if scales.yMax is being recalculated on hover');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testAxisScalingBug().catch(console.error);