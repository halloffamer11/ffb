import { chromium } from 'playwright';

async function validateAxisFix() {
    console.log('🧪 Validating Y-axis scaling fix...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log('📱 Loading validation page...');
        await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
        
        console.log('⏳ Waiting for widget to stabilize...');
        await page.waitForTimeout(8000);
        
        // Inject Y-axis monitoring
        await page.evaluate(() => {
            window.axisTracker = {
                snapshots: [],
                capture: function(event) {
                    const svg = document.querySelector('svg');
                    if (!svg) return null;
                    
                    // Find Y-axis labels (text elements)
                    const textElements = Array.from(svg.querySelectorAll('text'));
                    const yAxisLabels = textElements
                        .map(t => parseFloat(t.textContent))
                        .filter(n => !isNaN(n) && Math.abs(n) > 0)
                        .sort((a,b) => b - a);
                    
                    if (yAxisLabels.length === 0) return null;
                    
                    const snapshot = {
                        event,
                        timestamp: Date.now(),
                        yMax: yAxisLabels[0],
                        yMin: yAxisLabels[yAxisLabels.length - 1],
                        labelCount: yAxisLabels.length,
                        allLabels: yAxisLabels
                    };
                    
                    this.snapshots.push(snapshot);
                    console.log(`📊 [${event}] Y-axis: ${snapshot.yMin.toFixed(1)} to ${snapshot.yMax.toFixed(1)}`);
                    return snapshot;
                }
            };
        });
        
        // Take initial snapshot
        console.log('\n📸 Initial Y-axis state...');
        await page.evaluate(() => window.axisTracker.capture('INITIAL'));
        
        // Find and click multiple buttons to test player selection
        console.log('\n🎯 Testing player selections...');
        
        for (let i = 0; i < 5; i++) {
            console.log(`\n🖱️  Selection ${i + 1}...`);
            
            await page.evaluate((index) => {
                const buttons = document.querySelectorAll('button');
                // Click position filter buttons or any available buttons
                const targetButton = buttons[index % buttons.length];
                if (targetButton) {
                    targetButton.click();
                    window.axisTracker.capture(`SELECTION_${index + 1}`);
                }
            }, i);
            
            await page.waitForTimeout(1500);
        }
        
        // Get analysis results
        const results = await page.evaluate(() => {
            const snapshots = window.axisTracker.snapshots;
            if (snapshots.length < 2) {
                return { error: 'Insufficient snapshots for analysis' };
            }
            
            const initial = snapshots[0];
            const scaleChanges = [];
            let hasIncreasingScale = false;
            
            for (let i = 1; i < snapshots.length; i++) {
                const current = snapshots[i];
                const rangeChanged = Math.abs(current.yMax - initial.yMax) > 0.1 || 
                                   Math.abs(current.yMin - initial.yMin) > 0.1;
                
                if (rangeChanged) {
                    const increase = current.yMax - initial.yMax;
                    scaleChanges.push({
                        event: current.event,
                        initialRange: `${initial.yMin.toFixed(1)} to ${initial.yMax.toFixed(1)}`,
                        newRange: `${current.yMin.toFixed(1)} to ${current.yMax.toFixed(1)}`,
                        maxIncrease: increase
                    });
                    
                    if (increase > 0) {
                        hasIncreasingScale = true;
                    }
                }
            }
            
            return {
                totalSnapshots: snapshots.length,
                initialRange: `${initial.yMin.toFixed(1)} to ${initial.yMax.toFixed(1)}`,
                scaleChanges: scaleChanges,
                hasIncreasingScale: hasIncreasingScale,
                isFixed: !hasIncreasingScale && scaleChanges.length === 0
            };
        });
        
        console.log('\n📊 Y-AXIS SCALING VALIDATION RESULTS:');
        console.log('=====================================');
        console.log(`Snapshots captured: ${results.totalSnapshots}`);
        console.log(`Initial Y-axis range: ${results.initialRange}`);
        console.log(`Scale changes detected: ${results.scaleChanges.length}`);
        
        if (results.scaleChanges.length > 0) {
            console.log('\n🔴 SCALE CHANGES DETECTED:');
            results.scaleChanges.forEach((change, i) => {
                console.log(`${i + 1}. ${change.event}: ${change.initialRange} → ${change.newRange} (${change.maxIncrease > 0 ? '+' : ''}${change.maxIncrease.toFixed(1)})`);
            });
        }
        
        if (results.isFixed) {
            console.log('\n✅ SUCCESS: Y-axis scaling is now STABLE during player selections!');
        } else if (results.hasIncreasingScale) {
            console.log('\n❌ ISSUE: Y-axis is still INCREASING during interactions');
        } else {
            console.log('\n⚠️  MIXED: Y-axis changed but not consistently increasing');
        }
        
        console.log('\n🔍 Browser left open for manual verification');
        
        return results;
        
    } catch (error) {
        console.error('❌ Validation error:', error.message);
        return { error: error.message };
    }
}

validateAxisFix().catch(console.error);