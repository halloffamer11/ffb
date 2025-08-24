import { chromium } from 'playwright';

async function debugVBDAxisScaling() {
    console.log('🔍 VBD Axis Scaling Debug - Robust Version');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 800,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    // Enable detailed console logging
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warn' || msg.text().includes('Perf') || msg.text().includes('VBD')) {
            console.log(`[${type.toUpperCase()}] ${msg.text()}`);
        }
    });
    
    try {
        console.log('📱 Navigating to validation page...');
        await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        
        // Wait for initial page load and basic rendering
        console.log('⏳ Allowing page to stabilize...');
        await page.waitForTimeout(3000);
        
        // Inject axis monitoring without waiting for specific elements
        console.log('📊 Injecting axis monitoring...');
        await page.evaluate(() => {
            window.vbdAxisDebug = {
                snapshots: [],
                renderCount: 0,
                
                captureSnapshot(event) {
                    try {
                        const svg = document.querySelector('svg');
                        if (!svg) {
                            console.log(`No SVG found for event: ${event}`);
                            return null;
                        }
                        
                        // Get all text elements that might be Y-axis labels
                        const allTexts = Array.from(svg.querySelectorAll('text'));
                        const numericTexts = allTexts
                            .map(t => ({ 
                                text: t.textContent.trim(), 
                                value: parseFloat(t.textContent),
                                x: t.getAttribute('x'),
                                y: t.getAttribute('y')
                            }))
                            .filter(t => !isNaN(t.value));
                        
                        // Find Y-axis values (usually have low x coordinates)
                        const yAxisTexts = numericTexts.filter(t => parseFloat(t.x) < 100);
                        
                        const snapshot = {
                            timestamp: Date.now(),
                            event: event,
                            renderCount: ++this.renderCount,
                            svgDimensions: {
                                width: svg.getAttribute('width') || svg.clientWidth,
                                height: svg.getAttribute('height') || svg.clientHeight
                            },
                            allTextCount: allTexts.length,
                            numericTextCount: numericTexts.length,
                            yAxisTexts: yAxisTexts,
                            yRange: yAxisTexts.length > 0 ? {
                                min: Math.min(...yAxisTexts.map(t => t.value)),
                                max: Math.max(...yAxisTexts.map(t => t.value))
                            } : null,
                            circleCount: svg.querySelectorAll('circle').length
                        };
                        
                        this.snapshots.push(snapshot);
                        
                        console.log(`📊 [${event}] Y-range: ${snapshot.yRange ? 
                            `${snapshot.yRange.min} to ${snapshot.yRange.max}` : 'None'}, Circles: ${snapshot.circleCount}`);
                        
                        return snapshot;
                    } catch (error) {
                        console.error(`Error capturing snapshot for ${event}:`, error);
                        return null;
                    }
                }
            };
        });
        
        // Take initial snapshot
        console.log('\n📸 Initial snapshot...');
        await page.evaluate(() => window.vbdAxisDebug.captureSnapshot('INITIAL_LOAD'));
        
        // Wait a bit more for any async rendering
        await page.waitForTimeout(2000);
        
        // Take snapshot after stabilization
        console.log('📸 Post-stabilization snapshot...');
        await page.evaluate(() => window.vbdAxisDebug.captureSnapshot('POST_STABILIZATION'));
        
        // Try to find and click on circles (player dots)
        console.log('\n🎯 Looking for clickable player elements...');
        
        const clickableElements = await page.evaluate(() => {
            const circles = Array.from(document.querySelectorAll('svg circle'));
            const buttons = Array.from(document.querySelectorAll('button, .player-item, [data-player]'));
            
            return {
                circles: circles.length,
                buttons: buttons.length,
                totalClickable: circles.length + buttons.length
            };
        });
        
        console.log(`Found ${clickableElements.circles} circles, ${clickableElements.buttons} buttons`);
        
        if (clickableElements.circles > 0) {
            // Click on first few circles
            for (let i = 0; i < Math.min(5, clickableElements.circles); i++) {
                console.log(`\n🖱️  Clicking circle ${i + 1}...`);
                
                try {
                    await page.evaluate((index) => {
                        const circles = document.querySelectorAll('svg circle');
                        if (circles[index]) {
                            circles[index].click();
                            window.vbdAxisDebug.captureSnapshot(`CIRCLE_${index + 1}_CLICKED`);
                        }
                    }, i);
                    
                    await page.waitForTimeout(1500); // Allow for any animations/updates
                    
                } catch (error) {
                    console.log(`Failed to click circle ${i + 1}: ${error.message}`);
                }
            }
        } else {
            console.log('⚠️  No circles found, trying generic click events...');
            
            // Try clicking in the chart area
            const svgBox = await page.evaluate(() => {
                const svg = document.querySelector('svg');
                if (svg) {
                    const rect = svg.getBoundingClientRect();
                    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
                }
                return null;
            });
            
            if (svgBox) {
                for (let i = 0; i < 3; i++) {
                    const x = svgBox.x + (svgBox.width / 4) * (i + 1);
                    const y = svgBox.y + svgBox.height / 2;
                    
                    console.log(`🖱️  Clicking chart area at (${Math.round(x)}, ${Math.round(y)})...`);
                    await page.mouse.click(x, y);
                    await page.evaluate((index) => {
                        window.vbdAxisDebug.captureSnapshot(`AREA_CLICK_${index + 1}`);
                    }, i);
                    await page.waitForTimeout(1000);
                }
            }
        }
        
        // Get final analysis
        console.log('\n📊 Analysis Results:');
        console.log('==================');
        
        const analysis = await page.evaluate(() => {
            const snapshots = window.vbdAxisDebug.snapshots;
            let analysis = {
                totalSnapshots: snapshots.length,
                scaleChanges: [],
                renderInfo: {
                    totalRenders: window.vbdAxisDebug.renderCount,
                    avgCircles: 0
                }
            };
            
            // Calculate average circles
            const circlesCounts = snapshots.map(s => s.circleCount).filter(c => c > 0);
            if (circlesCounts.length > 0) {
                analysis.renderInfo.avgCircles = Math.round(circlesCounts.reduce((a,b) => a+b, 0) / circlesCounts.length);
            }
            
            // Compare Y-ranges between snapshots
            for (let i = 1; i < snapshots.length; i++) {
                const current = snapshots[i];
                const previous = snapshots[i-1];
                
                if (current.yRange && previous.yRange) {
                    const rangeChanged = current.yRange.max !== previous.yRange.max || 
                                       current.yRange.min !== previous.yRange.min;
                    
                    if (rangeChanged) {
                        analysis.scaleChanges.push({
                            from: previous.event,
                            to: current.event,
                            prevRange: `${previous.yRange.min} to ${previous.yRange.max}`,
                            newRange: `${current.yRange.min} to ${current.yRange.max}`,
                            maxIncrease: current.yRange.max - previous.yRange.max,
                            minChange: current.yRange.min - previous.yRange.min
                        });
                    }
                }
            }
            
            return analysis;
        });
        
        console.log(`Total snapshots: ${analysis.totalSnapshots}`);
        console.log(`Total renders: ${analysis.renderInfo.totalRenders}`);
        console.log(`Average circles: ${analysis.renderInfo.avgCircles}`);
        console.log(`Scale changes detected: ${analysis.scaleChanges.length}`);
        
        if (analysis.scaleChanges.length > 0) {
            console.log('\n🔴 Y-AXIS SCALE CHANGES DETECTED:');
            analysis.scaleChanges.forEach((change, index) => {
                console.log(`${index + 1}. ${change.from} → ${change.to}`);
                console.log(`   Range: ${change.prevRange} → ${change.newRange}`);
                console.log(`   Max increase: ${change.maxIncrease}`);
                console.log(`   Min change: ${change.minChange}`);
            });
        } else {
            console.log('\n✅ No Y-axis scale changes detected');
        }
        
        console.log('\n🔍 Debug complete. Browser left open for manual inspection.');
        console.log('Close browser window when done.');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.log('🔍 Browser left open for manual troubleshooting.');
    }
}

// Auto-run the debug
debugVBDAxisScaling().catch(console.error);