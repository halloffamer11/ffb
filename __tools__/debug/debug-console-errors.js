import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function debugConsoleErrors() {
  console.log('🔍 Starting Playwright console error debugging...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const msgText = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: msgText,
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      errors.push(msgText);
      console.error('❌ Console Error:', msgText);
    } else {
      console.log(`📝 Console ${msg.type()}:`, msgText);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
    console.error('💥 Page Error:', error.message);
    console.error('Stack:', error.stack);
  });
  
  // Capture network failures
  page.on('response', response => {
    if (!response.ok()) {
      const failureMsg = `Network failure: ${response.status()} ${response.url()}`;
      errors.push(failureMsg);
      console.error('🌐 Network Error:', failureMsg);
    }
  });
  
  try {
    console.log('🚀 Navigating to http://localhost:5173...');
    
    // Navigate with longer timeout since dev server might be starting up
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait a bit for any dynamic content/errors to appear
    await page.waitForTimeout(3000);
    
    // Check if we have a working React app
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      console.log('✅ React root element found');
      
      // Check for any content in the root
      const rootContent = await page.$eval('#root', el => el.innerHTML);
      if (rootContent.trim()) {
        console.log('✅ Root has content');
      } else {
        console.log('⚠️ Root element is empty');
      }
    } else {
      console.log('❌ React root element not found');
    }
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-screenshot.png');
    
    // Get page title and URL
    const title = await page.title();
    const url = await page.url();
    console.log(`📄 Page title: "${title}"`);
    console.log(`🔗 Final URL: ${url}`);
    
  } catch (error) {
    errors.push(`Navigation error: ${error.message}`);
    console.error('❌ Failed to load page:', error.message);
  }
  
  // Summary
  console.log('\n📊 DEBUGGING SUMMARY:');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ No errors detected!');
  }
  
  // Write detailed report
  const report = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:5173',
    consoleMessages,
    errors,
    summary: {
      totalMessages: consoleMessages.length,
      totalErrors: errors.length
    }
  };
  
  writeFileSync('debug-console-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved as debug-console-report.json');
  
  // Keep browser open for manual inspection
  console.log('\n🔍 Browser kept open for manual inspection. Close when done.');
  // await browser.close();
}

debugConsoleErrors().catch(console.error);