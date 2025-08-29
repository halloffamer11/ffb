import { chromium } from 'playwright';

async function testHumanInteractionPatterns() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });
  
  try {
    console.log('=== Test Human-like Interaction Patterns for Axis Scaling ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Load test data first
    console.log('\n1. Loading test data...');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    // Enhanced monitoring that captures axis value changes more precisely
    await page.evaluate(() => {
      window.axisTracker = {
        axisValues: new Set(),
        interactions: [],
        renderEvents: []
      };
      
      let interactionId = 0;
      
      // Capture all text drawn on canvas (including axis labels)
      const originalFillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
        // Capture Y-axis labels (numbers on the left side)
        if (typeof text === 'string' && x < 100 && /^[\+\-]?\d+$/.test(text.trim())) {
          const value = parseInt(text.replace('+', ''));
          if (!isNaN(value)) {
            window.axisTracker.axisValues.add(value);
          }
        }
        return originalFillText.call(this, text, x, y, maxWidth);
      };
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        
        // Track all mouse interactions
        ['mousemove', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
          canvas.addEventListener(eventType, (e) => {
            interactionId++;
            
            const interaction = {
              id: interactionId,
              type: eventType,
              x: e.offsetX,
              y: e.offsetY,
              timestamp: Date.now(),
              axisValuesBefore: Array.from(window.axisTracker.axisValues).sort((a,b) => a-b)
            };
            
            // Capture axis values after a brief delay to see post-interaction state
            setTimeout(() => {
              interaction.axisValuesAfter = Array.from(window.axisTracker.axisValues).sort((a,b) => a-b);
              
              // Check for axis changes
              const beforeRange = Math.max(...interaction.axisValuesBefore) - Math.min(...interaction.axisValuesBefore);
              const afterRange = Math.max(...interaction.axisValuesAfter) - Math.min(...interaction.axisValuesAfter);
              
              if (Math.abs(afterRange - beforeRange) > 1) {
                interaction.axisChanged = true;
                interaction.rangeChange = { before: beforeRange, after: afterRange };
                console.log(`🚨 Axis range changed on ${eventType}: ${beforeRange} → ${afterRange}`);
              }
              
              window.axisTracker.interactions.push(interaction);
            }, 100);
          });
        });
        
        // Monitor expensive renders
        const originalLog = console.log;
        console.log = function(...args) {
          const message = args.join(' ');
          if (message.includes('VBDScatterWidget render took')) {
            const match = message.match(/render took ([\d.]+)ms/);
            if (match) {
              const duration = parseFloat(match[1]);
              window.axisTracker.renderEvents.push({
                duration,
                timestamp: Date.now(),
                expensive: duration > 1000
              });
              
              if (duration > 1000) {
                originalLog(`⚡ EXPENSIVE RENDER: ${duration}ms`);
              }
            }
          }
          originalLog.apply(console, args);
        };
      }
    });
    
    console.log('\n2. Testing Human-like Interaction Patterns...');
    
    const canvas = page.locator('canvas');
    
    // Pattern 1: Hover then select (common user behavior)
    console.log('\n--- Pattern 1: Hover → Select ---');
    await canvas.hover({ position: { x: 250, y: 200 } });
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 250, y: 200 } });
    await page.waitForTimeout(1000);
    
    // Pattern 2: Multiple rapid selections
    console.log('\n--- Pattern 2: Multiple Rapid Selections ---');
    const positions = [
      { x: 200, y: 180 },
      { x: 300, y: 250 },
      { x: 400, y: 300 },
      { x: 350, y: 200 }
    ];
    
    for (const pos of positions) {
      await canvas.click({ position: pos });
      await page.waitForTimeout(200); // Quick selections
    }
    
    // Pattern 3: Hover around then select (exploration behavior)
    console.log('\n--- Pattern 3: Exploration → Selection ---');
    const explorationPath = [
      { x: 180, y: 160 },
      { x: 220, y: 180 },
      { x: 260, y: 200 },
      { x: 240, y: 190 }
    ];
    
    for (const pos of explorationPath) {
      await canvas.hover({ position: pos });
      await page.waitForTimeout(300);
    }
    await canvas.click({ position: { x: 240, y: 190 } });
    
    // Pattern 4: Position filter changes + selections
    console.log('\n--- Pattern 4: Filter Changes + Selections ---');
    
    // Toggle position filters
    await page.click('button:has-text("QB")'); // Deselect QB
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 300, y: 250 } });
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("QB")'); // Re-select QB  
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // Let all interactions settle
    await page.waitForTimeout(2000);
    
    // Analyze interaction results
    console.log('\n3. Analyzing Interaction Results...');
    
    const results = await page.evaluate(() => {
      const interactions = window.axisTracker.interactions || [];
      const renders = window.axisTracker.renderEvents || [];
      
      const axisChangingInteractions = interactions.filter(i => i.axisChanged);
      const expensiveRenders = renders.filter(r => r.expensive);
      
      // Get final axis state
      const finalAxisValues = Array.from(window.axisTracker.axisValues).sort((a,b) => a-b);
      const finalRange = finalAxisValues.length > 0 ? 
        Math.max(...finalAxisValues) - Math.min(...finalAxisValues) : 0;
      
      return {
        totalInteractions: interactions.length,
        axisChangingInteractions: axisChangingInteractions.length,
        axisChangingDetails: axisChangingInteractions.map(i => ({
          type: i.type,
          position: `(${i.x}, ${i.y})`,
          rangeChange: i.rangeChange
        })),
        totalRenders: renders.length,
        expensiveRenders: expensiveRenders.length,
        finalAxisValues,
        finalRange,
        averageRenderTime: renders.length > 0 ? 
          renders.reduce((sum, r) => sum + r.duration, 0) / renders.length : 0
      };
    });
    
    console.log('\n=== HUMAN INTERACTION ANALYSIS ===');
    console.log(`Total interactions tracked: ${results.totalInteractions}`);
    console.log(`Interactions that changed axis: ${results.axisChangingInteractions}`);
    console.log(`Total render events: ${results.totalRenders}`);
    console.log(`Expensive renders (>1000ms): ${results.expensiveRenders}`);
    console.log(`Average render time: ${results.averageRenderTime.toFixed(2)}ms`);
    console.log(`Final axis range: ${results.finalRange}`);
    console.log(`Final axis values: [${results.finalAxisValues.join(', ')}]`);
    
    if (results.axisChangingInteractions > 0) {
      console.log('\n🚨 AXIS SCALING ISSUES FOUND:');
      results.axisChangingDetails.forEach((detail, i) => {
        console.log(`  ${i + 1}. ${detail.type} at ${detail.position}: range ${detail.rangeChange.before} → ${detail.rangeChange.after}`);
      });
      
      console.log('\n💡 RECOMMENDATION: Investigate the specific interaction patterns that trigger axis changes');
    } else {
      console.log('\n✅ NO AXIS SCALING ISSUES DETECTED');
      console.log('   All human-like interaction patterns maintained stable axis scaling');
    }
    
    if (results.expensiveRenders > 2) {
      console.log('\n⚠️ PERFORMANCE CONCERNS: Multiple expensive renders detected');
    }
    
    return results;
    
  } catch (error) {
    console.error('Human interaction test failed:', error);
    return { error: error.message };
  }
  
  await browser.close();
}

testHumanInteractionPatterns().catch(console.error);