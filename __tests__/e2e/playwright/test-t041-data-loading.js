import { chromium } from 'playwright';

async function testT041DataLoading() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('=== T-041 Data Loading Functionality Test ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // Check initial data status
    console.log('\n1. Initial Data Status:');
    const initialStatus = await page.evaluate(() => {
      return {
        dataStatus: document.getElementById('data-status')?.textContent,
        storeStatus: document.getElementById('store-status')?.textContent,
        loadButtonText: document.getElementById('load-data-btn')?.textContent.trim()
      };
    });
    console.log('Initial status:', initialStatus);
    
    // Test the data loading button
    console.log('\n2. Testing Data Loading Button:');
    await page.click('#load-data-btn');
    await page.waitForTimeout(3000);
    
    const afterLoadStatus = await page.evaluate(() => {
      return {
        dataStatus: document.getElementById('data-status')?.textContent,
        storeStatus: document.getElementById('store-status')?.textContent,
        loadButtonText: document.getElementById('load-data-btn')?.textContent.trim(),
        playerCount: document.getElementById('player-count')?.textContent
      };
    });
    console.log('After loading:', afterLoadStatus);
    
    // Check if canvas is populated with data
    console.log('\n3. Canvas Data Verification:');
    const canvasData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Check if canvas has been drawn on by looking at image data
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Count non-transparent pixels (basic check for content)
        let nonTransparentPixels = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) nonTransparentPixels++;
        }
        
        return {
          hasCanvas: true,
          canvasSize: `${canvas.width}x${canvas.height}`,
          nonTransparentPixels,
          hasContent: nonTransparentPixels > 100 // Threshold for "has meaningful content"
        };
      }
      return { hasCanvas: false };
    });
    console.log('Canvas data:', canvasData);
    
    // Test canvas interaction after data loading
    console.log('\n4. Canvas Interaction After Data Load:');
    try {
      await page.hover('canvas');
      await page.click('canvas', { position: { x: 100, y: 100 } });
      await page.waitForTimeout(1000);
      console.log('✅ Canvas interaction successful');
    } catch (error) {
      console.log('❌ Canvas interaction failed:', error.message);
    }
    
    // Final validation summary
    console.log('\n=== DATA LOADING TEST SUMMARY ===');
    
    const results = [];
    
    if (afterLoadStatus.dataStatus && afterLoadStatus.dataStatus.includes('300')) {
      results.push('✅ Player data loaded (300 players)');
    } else {
      results.push('❌ Player data loading failed');
    }
    
    if (afterLoadStatus.storeStatus && afterLoadStatus.storeStatus.includes('300')) {
      results.push('✅ VBD store synchronized (300 players)');
    } else {
      results.push('❌ VBD store synchronization failed');
    }
    
    if (afterLoadStatus.loadButtonText.includes('Success') || afterLoadStatus.loadButtonText.includes('Load Test Data')) {
      results.push('✅ Load button working correctly');
    } else {
      results.push('❌ Load button issues detected');
    }
    
    if (canvasData.hasContent) {
      results.push('✅ Canvas populated with scatter plot data');
    } else {
      results.push('❌ Canvas appears empty - VBD scatter plot may not be rendering');
    }
    
    results.forEach(result => console.log(result));
    
    const overallSuccess = results.every(result => result.startsWith('✅'));
    console.log('\nOverall Result:', overallSuccess ? '✅ ALL DATA LOADING TESTS PASSED' : '⚠️ SOME ISSUES DETECTED');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testT041DataLoading().catch(console.error);