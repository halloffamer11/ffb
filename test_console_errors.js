// Quick test to check if the application loads without console errors
const puppeteer = require('puppeteer');

async function testConsoleErrors() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the React app to fully render
    await page.waitForTimeout(3000);
    
    await browser.close();
    
    // Filter out info/debug messages and keep only errors and warnings
    const significantMessages = consoleMessages.filter(msg => 
      msg.type === 'error' || 
      (msg.type === 'warning' && !msg.text.includes('cdn.tailwindcss.com should not be used in production'))
    );
    
    console.log('Console messages found:');
    significantMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });
    
    if (significantMessages.length === 0) {
      console.log('✅ No significant console errors or warnings found!');
      return true;
    } else {
      console.log(`❌ Found ${significantMessages.length} significant console messages`);
      return false;
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

testConsoleErrors();