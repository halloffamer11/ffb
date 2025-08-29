// Quick test to verify Playwright can interact with the React app
import { chromium } from 'playwright';

async function testPlaywright() {
  let browser, page;
  try {
    console.log('🚀 Starting Playwright test...');
    
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    console.log('📱 Navigating to React app...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking page title...');
    const title = await page.title();
    console.log('Page title:', title);
    
    console.log('📊 Collecting console messages...');
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Wait for any console messages
    await page.waitForTimeout(3000);
    
    console.log('Console messages found:', consoleMessages.length);
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });
    
    // Check if the React app loaded
    const hasReactRoot = await page.$('#root');
    if (hasReactRoot) {
      console.log('✅ React app is loaded successfully!');
    } else {
      console.log('❌ React app did not load properly');
    }
    
    console.log('✅ Playwright test completed successfully!');
    
  } catch (error) {
    console.error('❌ Playwright test failed:', error.message);
    return false;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
  
  return true;
}

testPlaywright();