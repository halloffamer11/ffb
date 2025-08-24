import { chromium } from 'playwright';

async function testTheme() {
  console.log('🔍 Testing theme loading...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enhanced console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`📝 Console ${type}: ${text}`);
  });
  
  // Capture all errors with full stack traces
  page.on('pageerror', error => {
    console.error('💥 Page Error:', error.message);
    console.error('Stack:', error.stack);
  });
  
  try {
    await page.goto('http://localhost:5173', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Check if we can access the app div
    const appDiv = await page.$('#app');
    if (appDiv) {
      console.log('✅ App div found');
      
      const appContent = await page.$eval('#app', el => el.innerHTML);
      console.log('App content length:', appContent.length);
      
      if (appContent.length > 0) {
        console.log('✅ App has content');
        // Check if styled-components are working
        const styledElements = await page.$$('[class*="sc-"]');
        console.log(`Found ${styledElements.length} styled-components elements`);
      } else {
        console.log('❌ App div is empty');
      }
    } else {
      console.log('❌ App div not found');
    }
    
    // Check for React DevTools
    const reactCheck = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    });
    console.log('React detected:', reactCheck);
    
    // Wait for any async rendering
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'theme-debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('🔍 Browser kept open for inspection...');
}

testTheme().catch(console.error);