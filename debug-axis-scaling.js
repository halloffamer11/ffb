import { chromium } from 'playwright';

async function debugAxisScaling() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages including our debugging
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });
  
  try {
    console.log('=== Debug VBD Axis Scaling Issue ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data first
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Inject debugging code to monitor scale changes
    await page.evaluate(() => {
      // Override console.log to capture scale information
      let hoverCount = 0;
      let lastScales = null;
      
      // Try to hook into the React component's scale calculations
      // This is a hack to monitor when scales change
      const originalLog = console.log;
      
      window.debugScales = {
        hoverCount: 0,
        scaleChanges: []
      };
      
      // Create a mutation observer to watch for canvas changes
      const canvas = document.querySelector('canvas');
      if (canvas) {
        let lastImageData = null;
        
        const checkCanvasChanges = () => {
          try {
            const ctx = canvas.getContext('2d');
            const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            if (lastImageData) {
              // Compare image data to detect redraws
              let pixelsDifferent = 0;
              for (let i = 0; i < currentImageData.data.length; i += 4) {
                if (currentImageData.data[i] !== lastImageData.data[i] ||
                    currentImageData.data[i+1] !== lastImageData.data[i+1] ||
                    currentImageData.data[i+2] !== lastImageData.data[i+2] ||
                    currentImageData.data[i+3] !== lastImageData.data[i+3]) {
                  pixelsDifferent++;
                }
              }
              
              if (pixelsDifferent > 100) { // Threshold for significant change
                window.debugScales.scaleChanges.push({
                  timestamp: Date.now(),
                  pixelsDifferent,
                  type: 'redraw'
                });
                console.log(`🔄 Canvas redraw detected: ${pixelsDifferent} pixels changed`);
              }
            }
            
            lastImageData = currentImageData;
          } catch (e) {
            // Canvas might be in use, skip this check
          }
        };
        
        // Monitor canvas changes
        setInterval(checkCanvasChanges, 200);
        
        // Add hover event listeners
        canvas.addEventListener('mousemove', (e) => {
          window.debugScales.hoverCount++;
          console.log(`🎯 Hover event #${window.debugScales.hoverCount} at (${e.offsetX}, ${e.offsetY})`);
        });
      }
    });
    
    console.log('\n📊 Starting hover test with scale monitoring...');
    
    // Test multiple hovers and watch for scale changes
    const canvas = page.locator('canvas');
    
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- Hover Test ${i + 1} ---`);
      
      // Move to different positions
      const x = 200 + (i * 50);
      const y = 200 + (Math.sin(i) * 30);
      
      await canvas.hover({ position: { x, y } });
      await page.waitForTimeout(1000);
      
      // Check debug information
      const debugInfo = await page.evaluate(() => {
        return {
          hoverCount: window.debugScales?.hoverCount || 0,
          scaleChanges: window.debugScales?.scaleChanges || [],
          timestamp: Date.now()
        };
      });
      
      console.log(`Debug info:`, debugInfo);
      
      // Move away to clear hover
      await page.mouse.move(50, 50);
      await page.waitForTimeout(500);
    }
    
    // Final summary
    const finalDebugInfo = await page.evaluate(() => {
      return window.debugScales || { error: 'Debug not available' };
    });
    
    console.log('\n=== Final Debug Summary ===');
    console.log('Debug info:', JSON.stringify(finalDebugInfo, null, 2));
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
  
  await browser.close();
}

debugAxisScaling().catch(console.error);