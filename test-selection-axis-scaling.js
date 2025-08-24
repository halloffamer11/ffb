import { chromium } from 'playwright';

async function testSelectionAxisScaling() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });
  
  try {
    console.log('=== Debug Player Selection Axis Scaling Issue ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data first
    console.log('\n1. Loading test data...');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Inject monitoring code specifically for selection events
    await page.evaluate(() => {
      window.selectionDebug = {
        selections: 0,
        renders: [],
        scaleChanges: [],
        lastSelectedPlayer: null
      };
      
      // Monitor canvas for selection-triggered changes
      const canvas = document.querySelector('canvas');
      if (canvas) {
        let lastImageData = null;
        let renderCount = 0;
        
        // Override console.log to capture render performance
        const originalLog = console.log;
        console.log = function(...args) {
          const message = args.join(' ');
          if (message.includes('VBDScatterWidget render took')) {
            renderCount++;
            const match = message.match(/render took ([\d.]+)ms.*render #(\d+)/);
            if (match) {
              window.selectionDebug.renders.push({
                duration: parseFloat(match[1]),
                renderNumber: parseInt(match[2]),
                timestamp: Date.now(),
                type: 'performance'
              });
              
              if (parseFloat(match[1]) > 1000) {
                originalLog(`🚨 EXPENSIVE RENDER DETECTED: ${match[1]}ms (render #${match[2]})`);
              }
            }
          }
          originalLog.apply(console, args);
        };
        
        // Monitor canvas changes
        const checkCanvasChanges = () => {
          try {
            const ctx = canvas.getContext('2d');
            const currentImageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
            
            if (lastImageData) {
              let pixelsDifferent = 0;
              for (let i = 0; i < currentImageData.data.length; i += 4) {
                if (currentImageData.data[i] !== lastImageData.data[i] ||
                    currentImageData.data[i+1] !== lastImageData.data[i+1] ||
                    currentImageData.data[i+2] !== lastImageData.data[i+2] ||
                    currentImageData.data[i+3] !== lastImageData.data[i+3]) {
                  pixelsDifferent++;
                }
              }
              
              if (pixelsDifferent > 50) {
                window.selectionDebug.scaleChanges.push({
                  timestamp: Date.now(),
                  pixelsDifferent,
                  type: 'canvas_change',
                  triggerType: 'selection'
                });
                originalLog(`📊 Canvas change detected: ${pixelsDifferent} pixels changed`);
              }
            }
            
            lastImageData = currentImageData;
          } catch (e) {
            // Canvas might be busy, skip this check
          }
        };
        
        // Monitor canvas changes periodically
        setInterval(checkCanvasChanges, 300);
        
        // Add click event listener to monitor selections
        canvas.addEventListener('click', (e) => {
          window.selectionDebug.selections++;
          const selection = {
            selectionNumber: window.selectionDebug.selections,
            x: e.offsetX,
            y: e.offsetY,
            timestamp: Date.now()
          };
          
          originalLog(`🎯 Player selection #${selection.selectionNumber} at (${selection.x}, ${selection.y})`);
          
          // Check for immediate renders after selection
          setTimeout(() => {
            const recentRenders = window.selectionDebug.renders.filter(r => 
              r.timestamp > selection.timestamp - 100 && r.timestamp < selection.timestamp + 2000
            );
            
            if (recentRenders.length > 0) {
              originalLog(`⚡ Selection triggered ${recentRenders.length} renders:`, recentRenders.map(r => `${r.duration}ms`));
            }
          }, 2000);
        });
      }
      
      // Monitor React store changes for selection
      if (window.testStore) {
        let lastState = null;
        const checkStateChanges = () => {
          try {
            const currentState = window.testStore.getState();
            if (lastState && JSON.stringify(currentState) !== JSON.stringify(lastState)) {
              originalLog('🔄 React store state changed');
            }
            lastState = JSON.parse(JSON.stringify(currentState));
          } catch (e) {
            // Skip if state access fails
          }
        };
        
        setInterval(checkStateChanges, 500);
      }
    });
    
    console.log('\n2. Testing Player Selection Impact on Axis Scaling...');
    
    const canvas = page.locator('canvas');
    
    // Perform multiple player selections at different positions
    const selectionTests = [
      { x: 200, y: 200, label: 'Selection 1 - Top Left Area' },
      { x: 400, y: 300, label: 'Selection 2 - Center Area' },
      { x: 300, y: 180, label: 'Selection 3 - Upper Center' },
      { x: 500, y: 350, label: 'Selection 4 - Lower Right' },
      { x: 250, y: 250, label: 'Selection 5 - Mid Left' }
    ];
    
    for (let i = 0; i < selectionTests.length; i++) {
      const test = selectionTests[i];
      
      console.log(`\n--- ${test.label} ---`);
      
      // Clear any previous state by moving away
      await page.mouse.move(50, 50);
      await page.waitForTimeout(500);
      
      // Capture pre-selection debug state
      const preSelectionState = await page.evaluate(() => {
        return {
          renders: window.selectionDebug ? window.selectionDebug.renders.length : 0,
          scaleChanges: window.selectionDebug ? window.selectionDebug.scaleChanges.length : 0,
          selections: window.selectionDebug ? window.selectionDebug.selections : 0
        };
      });
      
      console.log(`Before selection:`, preSelectionState);
      
      // Perform the selection click
      await canvas.click({ position: { x: test.x, y: test.y } });
      await page.waitForTimeout(2000); // Wait for any renders to complete
      
      // Capture post-selection debug state
      const postSelectionState = await page.evaluate(() => {
        return {
          renders: window.selectionDebug ? window.selectionDebug.renders.length : 0,
          scaleChanges: window.selectionDebug ? window.selectionDebug.scaleChanges.length : 0,
          selections: window.selectionDebug ? window.selectionDebug.selections : 0,
          recentRenders: window.selectionDebug ? 
            window.selectionDebug.renders.slice(-3).map(r => ({ duration: r.duration, renderNumber: r.renderNumber })) : [],
          recentScaleChanges: window.selectionDebug ?
            window.selectionDebug.scaleChanges.slice(-2) : []
        };
      });
      
      console.log(`After selection:`, postSelectionState);
      
      // Analyze the impact
      const rendersDiff = postSelectionState.renders - preSelectionState.renders;
      const scaleChangesDiff = postSelectionState.scaleChanges - preSelectionState.scaleChanges;
      
      if (rendersDiff > 0) {
        console.log(`⚠️ Selection triggered ${rendersDiff} new renders:`, postSelectionState.recentRenders);
      }
      
      if (scaleChangesDiff > 0) {
        console.log(`🚨 Selection triggered ${scaleChangesDiff} axis changes:`, postSelectionState.recentScaleChanges);
      }
      
      if (rendersDiff === 0 && scaleChangesDiff === 0) {
        console.log(`✅ No axis scaling issues detected for this selection`);
      }
    }
    
    // Final analysis
    console.log('\n3. Final Analysis of Selection-Triggered Scaling...');
    
    const finalDebugState = await page.evaluate(() => {
      if (!window.selectionDebug) return { error: 'Debug monitoring not available' };
      
      const expensiveRenders = window.selectionDebug.renders.filter(r => r.duration > 1000);
      const totalScaleChanges = window.selectionDebug.scaleChanges.length;
      
      return {
        totalSelections: window.selectionDebug.selections,
        totalRenders: window.selectionDebug.renders.length,
        expensiveRenders: expensiveRenders.length,
        expensiveRenderDetails: expensiveRenders,
        totalScaleChanges,
        scaleChangeDetails: window.selectionDebug.scaleChanges,
        averageRenderTime: window.selectionDebug.renders.length > 0 ? 
          window.selectionDebug.renders.reduce((sum, r) => sum + r.duration, 0) / window.selectionDebug.renders.length : 0
      };
    });
    
    console.log('\n=== SELECTION SCALING DEBUG SUMMARY ===');
    console.log(`Total player selections: ${finalDebugState.totalSelections}`);
    console.log(`Total renders triggered: ${finalDebugState.totalRenders}`);
    console.log(`Expensive renders (>1000ms): ${finalDebugState.expensiveRenders}`);
    console.log(`Axis scale changes: ${finalDebugState.totalScaleChanges}`);
    console.log(`Average render time: ${finalDebugState.averageRenderTime?.toFixed(2)}ms`);
    
    if (finalDebugState.expensiveRenders > 0) {
      console.log('\n🚨 EXPENSIVE RENDERS DETECTED:');
      finalDebugState.expensiveRenderDetails?.forEach(render => {
        console.log(`  - Render #${render.renderNumber}: ${render.duration}ms`);
      });
    }
    
    if (finalDebugState.totalScaleChanges > 0) {
      console.log('\n📊 AXIS SCALE CHANGES DETECTED:');
      finalDebugState.scaleChangeDetails?.forEach((change, i) => {
        console.log(`  - Change ${i + 1}: ${change.pixelsDifferent} pixels, type: ${change.type}`);
      });
    }
    
    // Conclusion
    const hasScalingIssue = finalDebugState.expensiveRenders > 2 || finalDebugState.totalScaleChanges > 3;
    
    if (hasScalingIssue) {
      console.log('\n❌ SELECTION AXIS SCALING ISSUE CONFIRMED');
      console.log('   Player selections are triggering expensive renders and axis changes');
    } else {
      console.log('\n✅ NO SIGNIFICANT SELECTION SCALING ISSUES DETECTED');
      console.log('   Player selections appear to be handled efficiently');
    }
    
    return finalDebugState;
    
  } catch (error) {
    console.error('Debug failed:', error);
    return { error: error.message };
  }
  
  await browser.close();
}

testSelectionAxisScaling().catch(console.error);