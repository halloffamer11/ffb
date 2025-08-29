import { chromium } from 'playwright';

async function debugVBDAxisScaling() {
    console.log('🔍 Starting VBD Axis Scaling Debug...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 // Slow down actions to observe behavior
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.text()}`);
    });
    
    try {
        console.log('📱 Navigating to VBD validation page...');
        await page.goto('http://localhost:5174/demos/ui/T-041_vbd_scatter_react_validation.html', {
            waitUntil: 'networkidle'
        });
        
        // Wait for the scatter plot to load
        console.log('⏳ Waiting for scatter plot to initialize...');
        await page.waitForSelector('.vbd-scatter-chart', { timeout: 10000 });
        await page.waitForTimeout(2000); // Allow chart to fully render
        
        // Function to capture Y-axis information
        const captureYAxisInfo = async (stepName) => {
            console.log(`\n📊 Capturing Y-axis info for: ${stepName}`);
            
            const yAxisInfo = await page.evaluate(() => {
                const svg = document.querySelector('.vbd-scatter-chart svg');
                if (!svg) return { error: 'No SVG found' };
                
                // Find Y-axis elements
                const yAxisGroup = svg.querySelector('.y-axis');
                const yAxisTicks = Array.from(svg.querySelectorAll('.y-axis .tick text'));
                const chartHeight = svg.getAttribute('height') || svg.getBoundingClientRect().height;
                const chartWidth = svg.getAttribute('width') || svg.getBoundingClientRect().width;
                
                const tickValues = yAxisTicks.map(tick => ({
                    text: tick.textContent,
                    y: tick.getAttribute('y') || tick.getBoundingClientRect().y
                }));
                
                // Get the Y-scale domain if available
                let yDomain = null;
                if (window.vbdChart && window.vbdChart.yScale) {
                    yDomain = window.vbdChart.yScale.domain();
                }
                
                return {
                    chartDimensions: { width: chartWidth, height: chartHeight },
                    tickCount: yAxisTicks.length,
                    tickValues: tickValues,
                    yDomain: yDomain,
                    timestamp: new Date().toISOString()
                };
            });
            
            console.log(`   Chart Height: ${yAxisInfo.chartDimensions?.height}`);
            console.log(`   Y-axis Ticks: ${yAxisInfo.tickCount}`);
            console.log(`   Y Domain: ${yAxisInfo.yDomain ? `[${yAxisInfo.yDomain.join(', ')}]` : 'Not available'}`);
            if (yAxisInfo.tickValues.length > 0) {
                console.log(`   Tick Range: ${yAxisInfo.tickValues[0].text} to ${yAxisInfo.tickValues[yAxisInfo.tickValues.length-1].text}`);
            }
            
            return yAxisInfo;
        };
        
        // Capture initial state
        let step1 = await captureYAxisInfo('Initial Load');
        
        // Wait a bit more for any animations
        await page.waitForTimeout(1000);
        
        // Look for player selection mechanism
        console.log('\n🎯 Looking for player selection elements...');
        
        // Try different selectors for player selection
        const selectors = [
            '.player-item',
            '.player-row', 
            '[data-player-id]',
            '.scatter-point',
            'circle',
            '.player-button'
        ];
        
        let playerElements = [];
        for (const selector of selectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                console.log(`   Found ${elements.length} elements with selector: ${selector}`);
                playerElements = elements;
                break;
            }
        }
        
        if (playerElements.length === 0) {
            console.log('❌ No player selection elements found. Checking page structure...');
            const pageStructure = await page.evaluate(() => {
                const body = document.body;
                const classes = Array.from(body.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 20);
                return {
                    bodyClasses: body.className,
                    elementClasses: classes,
                    hasChart: !!document.querySelector('.vbd-scatter-chart'),
                    hasScatterPoints: !!document.querySelector('circle'),
                    allCircles: document.querySelectorAll('circle').length
                };
            });
            console.log('Page structure:', pageStructure);
        } else {
            // Select first few players and capture Y-axis changes
            const playersToTest = Math.min(5, playerElements.length);
            
            for (let i = 0; i < playersToTest; i++) {
                console.log(`\n🖱️  Selecting player ${i + 1}...`);
                
                // Click on the player element
                await playerElements[i].click();
                await page.waitForTimeout(1000); // Wait for any animations
                
                // Capture Y-axis state after selection
                let stepData = await captureYAxisInfo(`Player ${i + 1} Selected`);
                
                // Compare with previous step
                if (i === 0) {
                    console.log(`   🔍 Comparing to initial state...`);
                    if (step1.yDomain && stepData.yDomain) {
                        const domainChanged = step1.yDomain[0] !== stepData.yDomain[0] || 
                                            step1.yDomain[1] !== stepData.yDomain[1];
                        console.log(`   📈 Y-domain changed: ${domainChanged ? 'YES' : 'NO'}`);
                        if (domainChanged) {
                            console.log(`   📊 Before: [${step1.yDomain.join(', ')}]`);
                            console.log(`   📊 After:  [${stepData.yDomain.join(', ')}]`);
                        }
                    }
                }
            }
        }
        
        console.log('\n✅ Debug session completed');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
    } finally {
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser left open for manual inspection. Close manually when done.');
        // await browser.close();
    }
}

// Run the debug session
debugVBDAxisScaling().catch(console.error);