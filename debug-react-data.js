// Quick debug script to check React store data
import { chromium } from 'playwright';

async function debugReactData() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:5173/demos/ui/T-039_player_search_react.html');
    await page.waitForTimeout(3000);
    
    // Check what data is available
    const result = await page.evaluate(() => {
      // Check localStorage
      const localStorageData = localStorage.getItem('workspace::players');
      const localPlayerCount = localStorageData ? JSON.parse(localStorageData).length : 0;
      
      // Check if React store is accessible
      let reactStoreData = null;
      try {
        // Try to access Zustand store from window if exposed
        reactStoreData = window.useDraftStore ? window.useDraftStore.getState() : null;
      } catch (e) {
        reactStoreData = `Error: ${e.message}`;
      }
      
      // Check React component state
      const reactWidget = document.querySelector('#react-search-widget');
      const hasReactContent = reactWidget && reactWidget.innerHTML.includes('PlayerSearchWidget');
      const hasTableRows = document.querySelectorAll('tbody tr').length;
      
      return {
        localStoragePlayerCount: localPlayerCount,
        hasReactWidget: !!reactWidget,
        hasReactContent: hasReactContent,
        tableRows: hasTableRows,
        reactStoreData: reactStoreData,
        reactWidgetHTML: reactWidget ? reactWidget.innerHTML.substring(0, 200) + '...' : 'No widget'
      };
    });
    
    console.log('\n=== DEBUG RESULTS ===');
    console.log('LocalStorage player count:', result.localStoragePlayerCount);
    console.log('Has React widget container:', result.hasReactWidget);
    console.log('Has React content:', result.hasReactContent);
    console.log('Table rows visible:', result.tableRows);
    console.log('React store data:', result.reactStoreData);
    console.log('Widget HTML preview:', result.reactWidgetHTML);
    
    // Try clicking the load data button
    console.log('\n=== TESTING LOAD DATA BUTTON ===');
    await page.click('#loadTestData');
    await page.waitForTimeout(1000);
    
    const afterClick = await page.evaluate(() => {
      return {
        tableRows: document.querySelectorAll('tbody tr').length,
        localStoragePlayerCount: JSON.parse(localStorage.getItem('workspace::players') || '[]').length
      };
    });
    
    console.log('After clicking load data:');
    console.log('Table rows:', afterClick.tableRows);
    console.log('LocalStorage player count:', afterClick.localStoragePlayerCount);
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
  
  await browser.close();
}

debugReactData().catch(console.error);