import { chromium } from 'playwright';

async function debugAxisSimple() {
    console.log('🔍 Simple VBD Axis Debug - Focused on Y-axis scaling');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log('📱 Loading page...');
        await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
        
        console.log('⏳ Waiting 8 seconds for stabilization...');
        await page.waitForTimeout(8000);
        
        // Simple axis capture function
        const captureAxis = async (eventName) => {
            const axisData = await page.evaluate((event) => {
                const svg = document.querySelector('svg');
                if (!svg) return { error: 'No SVG', event };
                
                // Get all text elements and extract numeric ones
                const allTexts = Array.from(svg.querySelectorAll('text'));
                const numbers = allTexts
                    .map(t => parseFloat(t.textContent))
                    .filter(n => !isNaN(n) && n > 0);
                
                // Assume Y-axis values are the larger numbers (VBD values)
                const yValues = numbers.filter(n => n > 1).sort((a,b) => b-a);
                
                return {
                    event,
                    timestamp: Date.now(),
                    allTextCount: allTexts.length,
                    numberCount: numbers.length,
                    yAxisValues: yValues.slice(0, 10), // Top 10 values
                    maxY: yValues.length > 0 ? yValues[0] : 0,
                    minY: yValues.length > 0 ? yValues[yValues.length - 1] : 0,
                    svgSize: {
                        w: svg.clientWidth,
                        h: svg.clientHeight
                    }
                };
            }, eventName);
            
            console.log(`📊 ${axisData.event}: Y-range [${axisData.minY} to ${axisData.maxY}] (${axisData.yAxisValues.length} values)`);
            return axisData;
        };
        
        // Capture initial state
        const initial = await captureAxis('INITIAL');
        
        // Look for any clickable elements
        console.log('\n🎯 Finding clickable elements...');
        const clickables = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const circles = document.querySelectorAll('svg circle, svg rect');
            const clickableItems = document.querySelectorAll('[onclick], [data-player]');
            
            return {
                buttons: buttons.length,
                shapes: circles.length,
                clickable: clickableItems.length,
                buttonTexts: Array.from(buttons).slice(0, 5).map(b => b.textContent?.substring(0, 20))
            };
        });
        
        console.log(`Found: ${clickables.buttons} buttons, ${clickables.shapes} shapes, ${clickables.clickable} clickable items`);
        console.log(`Button samples: ${clickables.buttonTexts.join(', ')}`);
        
        // Try clicking buttons (likely player selection)
        if (clickables.buttons > 0) {
            for (let i = 0; i < Math.min(3, clickables.buttons); i++) {
                console.log(`\n🖱️  Clicking button ${i + 1}...`);
                
                await page.evaluate((index) => {
                    const buttons = document.querySelectorAll('button');
                    if (buttons[index]) {
                        buttons[index].click();
                    }
                }, i);
                
                await page.waitForTimeout(2000);
                const afterClick = await captureAxis(`BUTTON_${i + 1}_CLICKED`);
                
                // Compare to initial
                const rangeChanged = afterClick.maxY !== initial.maxY || afterClick.minY !== initial.minY;
                const scaleIncreased = afterClick.maxY > initial.maxY;
                
                if (rangeChanged) {
                    console.log(`🔴 AXIS CHANGED! Max: ${initial.maxY} → ${afterClick.maxY} (+${afterClick.maxY - initial.maxY})`);
                    if (scaleIncreased) {
                        console.log(`📈 SCALE INCREASED by ${afterClick.maxY - initial.maxY}`);
                    }
                } else {
                    console.log(`✅ No axis change detected`);
                }
            }
        }
        
        // Try clicking in chart area if no buttons worked
        if (clickables.shapes > 0) {
            console.log('\n🖱️  Trying chart area clicks...');
            
            await page.evaluate(() => {
                const svg = document.querySelector('svg');
                if (svg) {
                    const event = new MouseEvent('click', { bubbles: true });
                    svg.dispatchEvent(event);
                }
            });
            
            await page.waitForTimeout(1500);
            await captureAxis('SVG_CLICKED');
        }
        
        console.log('\n✅ Debug complete - browser left open for inspection');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAxisSimple().catch(console.error);