import { chromium } from 'playwright';

async function testAxisValuesOnSelection() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });
  
  try {
    console.log('=== Debug Axis Scale Values During Player Selection ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data first
    console.log('\n1. Loading test data...');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Inject code to monitor the actual axis scale values
    await page.evaluate(() => {
      window.axisMonitor = {
        scales: [],
        selectedPlayers: [],
        chartDataChanges: []
      };
      
      // Try to access React component internals
      // This is a bit hacky but necessary for debugging
      const findReactComponent = (element) => {
        const keys = Object.keys(element);
        const reactKey = keys.find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalInstance'));
        if (reactKey) return element[reactKey];
        
        // Try alternative React Fiber approach
        const fiberKey = keys.find(key => key.startsWith('__reactFiber'));
        if (fiberKey) return element[fiberKey];
        
        return null;
      };
      
      // Monitor React state changes
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const reactInstance = findReactComponent(canvas);
        
        // Hook into canvas context to capture axis drawing
        const originalFillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
          // Capture Y-axis labels (they typically contain numbers)
          if (typeof text === 'string' && /^[\+\-]?\d+$/.test(text.trim()) && x < 100) {
            const axisValue = parseFloat(text.replace('+', ''));
            if (!isNaN(axisValue)) {
              window.axisMonitor.scales.push({
                value: axisValue,
                x: x,
                y: y,
                timestamp: Date.now(),
                type: 'y_axis_label'
              });
            }
          }
          
          // Call original function
          return originalFillText.call(this, text, x, y, maxWidth);
        };
        
        // Monitor player selection events
        canvas.addEventListener('click', (e) => {
          const selection = {
            x: e.offsetX,
            y: e.offsetY,
            timestamp: Date.now()
          };
          
          window.axisMonitor.selectedPlayers.push(selection);
          console.log(`🎯 Player selected at (${selection.x}, ${selection.y})`);
          
          // Capture axis state immediately after selection
          setTimeout(() => {
            const currentScales = window.axisMonitor.scales.filter(s => 
              s.timestamp > selection.timestamp - 100 && s.timestamp < selection.timestamp + 2000
            );
            
            if (currentScales.length > 0) {
              const yValues = currentScales.filter(s => s.type === 'y_axis_label').map(s => s.value);
              const minY = Math.min(...yValues);
              const maxY = Math.max(...yValues);
              
              console.log(`📊 Axis range after selection: ${minY} to ${maxY} (range: ${maxY - minY})`);
              
              // Check if this selection caused axis expansion
              const previousScales = window.axisMonitor.scales.filter(s => 
                s.timestamp < selection.timestamp - 100 && s.type === 'y_axis_label'
              );
              
              if (previousScales.length > 0) {
                const prevYValues = previousScales.slice(-10).map(s => s.value);
                const prevMinY = Math.min(...prevYValues);
                const prevMaxY = Math.max(...prevYValues);
                const prevRange = prevMaxY - prevMinY;
                const currentRange = maxY - minY;
                
                if (currentRange > prevRange * 1.1) { // 10% increase threshold
                  console.log(`🚨 AXIS SCALING DETECTED! Range increased from ${prevRange} to ${currentRange}`);
                  console.log(`   Previous range: ${prevMinY} to ${prevMaxY}`);
                  console.log(`   Current range: ${minY} to ${maxY}`);
                  
                  window.axisMonitor.chartDataChanges.push({
                    selectionIndex: window.axisMonitor.selectedPlayers.length,
                    previousRange: { min: prevMinY, max: prevMaxY, range: prevRange },
                    currentRange: { min: minY, max: maxY, range: currentRange },
                    increase: ((currentRange - prevRange) / prevRange * 100).toFixed(1) + '%',
                    timestamp: Date.now()
                  });
                }
              }
            }
          }, 500);
        });
        
        // Monitor for any chart redraws
        const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function(x, y, width, height) {
          // Only log full canvas clears (indicating a complete redraw)
          if (x === 0 && y === 0) {
            console.log(`🖼️ Full canvas redraw at ${Date.now()}`);
          }
          return originalClearRect.call(this, x, y, width, height);
        };
      }
    });
    
    console.log('\n2. Performing Player Selections to Monitor Axis Changes...');
    
    const canvas = page.locator('canvas');
    
    // Perform strategic selections at different data points
    const testSelections = [
      { x: 150, y: 250, label: 'Low-rank player' },
      { x: 300, y: 200, label: 'Mid-rank player' }, 
      { x: 450, y: 300, label: 'High-rank player' },
      { x: 200, y: 150, label: 'High VBD player' },
      { x: 400, y: 350, label: 'Low VBD player' }
    ];
    
    for (let i = 0; i < testSelections.length; i++) {
      const test = testSelections[i];
      
      console.log(`\n--- Selection ${i + 1}: ${test.label} ---`);
      
      // Wait between selections
      await page.waitForTimeout(1000);
      
      // Capture axis state before selection
      const preAxisState = await page.evaluate(() => {
        const recentScales = window.axisMonitor.scales.slice(-20).filter(s => s.type === 'y_axis_label');
        if (recentScales.length > 0) {
          const yValues = recentScales.map(s => s.value);
          return {
            min: Math.min(...yValues),
            max: Math.max(...yValues),
            range: Math.max(...yValues) - Math.min(...yValues),
            scaleCount: recentScales.length
          };
        }
        return { min: 0, max: 0, range: 0, scaleCount: 0 };
      });
      
      console.log(`Before selection - Axis range: ${preAxisState.min} to ${preAxisState.max} (range: ${preAxisState.range})`);
      
      // Perform the selection
      await canvas.click({ position: { x: test.x, y: test.y } });
      await page.waitForTimeout(1500); // Wait for any axis redraws
      
      // Capture axis state after selection
      const postAxisState = await page.evaluate(() => {
        const recentScales = window.axisMonitor.scales.slice(-20).filter(s => s.type === 'y_axis_label');
        if (recentScales.length > 0) {
          const yValues = recentScales.map(s => s.value);
          return {
            min: Math.min(...yValues),
            max: Math.max(...yValues),
            range: Math.max(...yValues) - Math.min(...yValues),
            scaleCount: recentScales.length
          };
        }
        return { min: 0, max: 0, range: 0, scaleCount: 0 };
      });
      
      console.log(`After selection - Axis range: ${postAxisState.min} to ${postAxisState.max} (range: ${postAxisState.range})`);
      
      // Check for scaling issues
      if (postAxisState.range > preAxisState.range * 1.1) {
        console.log(`🚨 AXIS SCALING DETECTED! Range increased by ${((postAxisState.range - preAxisState.range) / preAxisState.range * 100).toFixed(1)}%`);
      } else if (Math.abs(postAxisState.range - preAxisState.range) < 0.1) {
        console.log(`✅ No axis scaling detected`);
      } else {
        console.log(`📏 Minor axis adjustment: ${preAxisState.range} → ${postAxisState.range}`);
      }
    }
    
    // Final analysis
    console.log('\n3. Final Axis Scaling Analysis...');
    
    const finalAnalysis = await page.evaluate(() => {
      return {
        totalSelections: window.axisMonitor.selectedPlayers.length,
        totalScaleCaptures: window.axisMonitor.scales.length,
        axisChanges: window.axisMonitor.chartDataChanges.length,
        axisChangeDetails: window.axisMonitor.chartDataChanges,
        recentAxisValues: window.axisMonitor.scales.slice(-20).filter(s => s.type === 'y_axis_label').map(s => s.value)
      };
    });
    
    console.log('\n=== AXIS SCALING ANALYSIS SUMMARY ===');
    console.log(`Total player selections: ${finalAnalysis.totalSelections}`);
    console.log(`Total axis scale captures: ${finalAnalysis.totalScaleCaptures}`);
    console.log(`Axis scaling incidents: ${finalAnalysis.axisChanges}`);
    
    if (finalAnalysis.axisChanges > 0) {
      console.log('\n🚨 AXIS SCALING ISSUES DETECTED:');
      finalAnalysis.axisChangeDetails.forEach((change, i) => {
        console.log(`  Issue ${i + 1} (Selection ${change.selectionIndex}):`);
        console.log(`    Previous range: ${change.previousRange.min} to ${change.previousRange.max} (${change.previousRange.range})`);
        console.log(`    New range: ${change.currentRange.min} to ${change.currentRange.max} (${change.currentRange.range})`);
        console.log(`    Increase: ${change.increase}`);
      });
    } else {
      console.log('\n✅ NO AXIS SCALING ISSUES DETECTED');
    }
    
    if (finalAnalysis.recentAxisValues.length > 0) {
      const uniqueValues = [...new Set(finalAnalysis.recentAxisValues)];
      console.log(`\nFinal axis values: [${uniqueValues.sort((a,b) => a-b).join(', ')}]`);
    }
    
    return finalAnalysis;
    
  } catch (error) {
    console.error('Axis debug failed:', error);
    return { error: error.message };
  }
  
  await browser.close();
}

testAxisValuesOnSelection().catch(console.error);