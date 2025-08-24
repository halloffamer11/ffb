import { chromium } from 'playwright';

async function testAppLoading() {
  console.log('🧪 Testing React app loading...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.error('❌ Console Error:', text);
    } else if (type === 'warning') {
      console.warn('⚠️ Console Warning:', text);  
    } else {
      console.log(`📝 Console ${type}:`, text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error('💥 Page Error:', error.message);
  });
  
  try {
    console.log('🚀 Navigating to http://localhost:5173...');
    
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    // Check for React root
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      console.log('✅ React root element found');
      
      const rootContent = await page.$eval('#root', el => el.innerHTML);
      if (rootContent.trim()) {
        console.log('✅ Root has content - app is rendering!');
        
        // Check for specific elements that indicate successful rendering
        const topAppBar = await page.$('.app-container');
        if (topAppBar) {
          console.log('✅ App container found - React components are rendering!');
        }
        
        // Check for widgets
        const widgets = await page.$$('.widget-container, [data-testid*="widget"]');
        console.log(`📊 Found ${widgets.length} widget elements`);
        
      } else {
        console.log('⚠️ Root element is empty - app may not be rendering');
      }
    } else {
      console.log('❌ React root element not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'app-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as app-test-screenshot.png');
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    console.log('\n✅ Test completed! Browser kept open for inspection.');
    
  } catch (error) {
    console.error('❌ Failed to test app:', error.message);
  }
  
  // Keep browser open for manual inspection
  console.log('🔍 Browser kept open for manual inspection. Close when done.');
}

testAppLoading().catch(console.error);