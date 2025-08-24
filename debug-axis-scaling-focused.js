import { chromium } from 'playwright';

async function debugAxisScalingIssue() {
    console.log('🔍 Debugging VBD Y-axis scaling during player selection...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    // Track Y-axis changes
    let axisHistory = [];
    
    try {
        console.log('📱 Loading validation page...');
        await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
        
        // Wait for widget to load and stabilize
        console.log('⏳ Waiting for VBD widget...');
        await page.waitForTimeout(5000); // Allow renders to stabilize
        
        // Inject monitoring script
        await page.evaluate(() => {
            window.axisMonitor = {
                history: [],
                captureAxis: function(event) {
                    const svg = document.querySelector('svg');
                    if (!svg) return null;
                    
                    // Get Y-axis ticks
                    const yTicks = Array.from(svg.querySelectorAll('.tick text')).map(t => ({
                        value: parseFloat(t.textContent),
                        y: t.getAttribute('y')
                    })).filter(t => !isNaN(t.value));
                    
                    // Get Y-scale domain if available from React component
                    let yDomain = null;
                    const chartContainer = document.querySelector('[data-testid="vbd-scatter-chart"], .vbd-scatter-chart');
                    if (chartContainer && chartContainer._reactInternalFiber) {
                        // Try to access React component state
                        try {
                            const fiber = chartContainer._reactInternalFiber || chartContainer._reactInternalInstance;
                            if (fiber && fiber.memoizedState) {
                                // Look for scale information in component state
                                console.log('React component found, checking state...');
                            }
                        } catch (e) {
                            console.log('Could not access React component state');
                        }
                    }
                    
                    const snapshot = {
                        timestamp: Date.now(),
                        event: event,
                        yTicks: yTicks,
                        yDomain: yDomain,
                        tickCount: yTicks.length,
                        minTick: yTicks.length > 0 ? Math.min(...yTicks.map(t => t.value)) : null,
                        maxTick: yTicks.length > 0 ? Math.max(...yTicks.map(t => t.value)) : null
                    };
                    
                    this.history.push(snapshot);
                    console.log(`📊 Y-axis snapshot (${event}):`, {
                        range: snapshot.minTick !== null ? `${snapshot.minTick} to ${snapshot.maxTick}` : 'No ticks',
                        ticks: snapshot.tickCount
                    });
                    
                    return snapshot;
                }
            };
            
            // Monitor for DOM changes that might indicate re-renders
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.tagName === 'svg' || mutation.target.closest('svg')) {
                        window.axisMonitor.captureAxis('DOM_CHANGE');
                    }
                });
            });
            
            const svg = document.querySelector('svg');
            if (svg) {
                observer.observe(svg, { 
                    childList: true, 
                    subtree: true, 
                    attributes: true 
                });
            }
        });
        
        // Capture initial state
        console.log('\n📸 Capturing initial axis state...');
        await page.evaluate(() => window.axisMonitor.captureAxis('INITIAL'));
        
        // Look for player dots/circles to click
        await page.waitForSelector('svg circle', { timeout: 10000 });
        const playerDots = await page.$$('svg circle');
        console.log(`🎯 Found ${playerDots.length} player dots`);
        
        // Click on several player dots and monitor axis changes
        for (let i = 0; i < Math.min(5, playerDots.length); i++) {
            console.log(`\n🖱️  Clicking player dot ${i + 1}...`);
            
            await playerDots[i].click();
            await page.waitForTimeout(1500); // Wait for any animations/updates
            
            // Capture axis state after click
            await page.evaluate((clickNum) => {
                window.axisMonitor.captureAxis(`PLAYER_${clickNum}_SELECTED`);
            }, i + 1);
        }
        
        // Get the complete history
        const history = await page.evaluate(() => window.axisMonitor.history);
        
        console.log('\n📊 Y-Axis Scaling Analysis:');
        console.log('================================');
        
        for (let i = 0; i < history.length; i++) {
            const snapshot = history[i];
            console.log(`\n${snapshot.event}:`);
            console.log(`   Range: ${snapshot.minTick} to ${snapshot.maxTick}`);
            console.log(`   Ticks: ${snapshot.tickCount}`);
            
            if (i > 0) {
                const prev = history[i-1];
                const rangeChanged = snapshot.maxTick !== prev.maxTick || snapshot.minTick !== prev.minTick;
                const scaleIncreased = snapshot.maxTick > prev.maxTick;
                
                if (rangeChanged) {
                    console.log(`   🔴 SCALE CHANGED! ${prev.minTick}-${prev.maxTick} → ${snapshot.minTick}-${snapshot.maxTick}`);
                    if (scaleIncreased) {
                        console.log(`   📈 SCALE INCREASED by ${snapshot.maxTick - prev.maxTick}`);
                    }
                }
            }
        }
        
        console.log('\n✅ Analysis complete. Browser left open for manual inspection.');
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
    
    // Leave browser open for manual inspection
}

debugAxisScalingIssue().catch(console.error);