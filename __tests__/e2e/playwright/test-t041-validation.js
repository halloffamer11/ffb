import { chromium } from 'playwright';

async function validateT041Page() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  try {
    console.log('=== T-041 VBD Scatter Validation Analysis ===');
    await page.goto('http://localhost:5173/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(4000);
    
    // 1. Check if VBD Scatter widget is mounted
    console.log('\n1. VBD Scatter Widget Mounting:');
    const widgetStatus = await page.evaluate(() => {
      const appContainer = document.getElementById('app');
      const hasContent = appContainer && appContainer.textContent.trim() !== '';
      const canvasElements = document.querySelectorAll('canvas').length;
      const hasVBDWidget = document.querySelector('[class*="VBD"], [class*="scatter"], [class*="Chart"]');
      
      return {
        hasAppContainer: !!appContainer,
        hasContent,
        canvasCount: canvasElements,
        hasVBDWidget: !!hasVBDWidget,
        appHTML: appContainer ? appContainer.innerHTML.substring(0, 300) + '...' : 'No app container'
      };
    });
    
    console.log('Widget mount status:', widgetStatus);
    
    // 2. Visual Analysis - Check text contrast and readability
    console.log('\n2. Visual Contrast & Readability Analysis:');
    const visualAnalysis = await page.evaluate(() => {
      const textElements = document.querySelectorAll('*');
      const contrastIssues = [];
      const colorAnalysis = [];
      
      // Check various text elements for contrast
      const elementsToCheck = [
        'h1', 'h2', 'h3', 'h4', 'p', 'span', 'div', 'label', 'button'
      ];
      
      elementsToCheck.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          if (index < 3) { // Check first 3 of each type
            const computedStyle = window.getComputedStyle(el);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;
            const fontSize = computedStyle.fontSize;
            
            if (el.textContent && el.textContent.trim()) {
              colorAnalysis.push({
                selector: selector + `:nth-of-type(${index + 1})`,
                text: el.textContent.substring(0, 50) + '...',
                color,
                backgroundColor,
                fontSize
              });
            }
          }
        });
      });
      
      // Check for common contrast issues
      const bodyStyle = window.getComputedStyle(document.body);
      const pageBackground = bodyStyle.backgroundColor;
      
      return {
        pageBackground,
        colorAnalysis: colorAnalysis.slice(0, 10), // Limit to first 10 for readability
        elementCount: textElements.length
      };
    });
    
    console.log('Visual analysis:', visualAnalysis);
    
    // 3. Player Data Loading Investigation
    console.log('\n3. Player Data Loading Analysis:');
    const dataLoadingStatus = await page.evaluate(() => {
      // Check for data loading controls/buttons
      const dataButtons = [
        ...document.querySelectorAll('button'),
        ...document.querySelectorAll('input[type="button"]'),
        ...document.querySelectorAll('[onclick]')
      ];
      
      const dataRelatedButtons = dataButtons.filter(btn => {
        const text = btn.textContent || btn.value || btn.title || '';
        const onclick = btn.getAttribute('onclick') || '';
        return text.toLowerCase().includes('load') || 
               text.toLowerCase().includes('data') || 
               text.toLowerCase().includes('player') ||
               onclick.includes('load') ||
               onclick.includes('data');
      });
      
      // Check for existing data sources
      const storageData = {
        localStorage: Object.keys(localStorage).filter(key => 
          key.includes('player') || key.includes('workspace') || key.includes('draft')
        ),
        hasTestStore: typeof window.testStore !== 'undefined',
        hasUseDraftStore: typeof window.useDraftStore !== 'undefined'
      };
      
      // Check if there's any player data in React store
      let reactStoreData = null;
      try {
        if (window.testStore) {
          const state = window.testStore.getState();
          reactStoreData = {
            players: state.players?.length || 0,
            hasPlayers: (state.players?.length || 0) > 0
          };
        }
      } catch (e) {
        reactStoreData = { error: e.message };
      }
      
      return {
        dataButtons: dataRelatedButtons.map(btn => ({
          text: btn.textContent || btn.value || 'No text',
          onclick: btn.getAttribute('onclick') || 'No onclick',
          id: btn.id || 'No id',
          classes: btn.className || 'No classes'
        })),
        storageData,
        reactStoreData,
        totalButtons: dataButtons.length
      };
    });
    
    console.log('Data loading analysis:', dataLoadingStatus);
    
    // 4. Performance Metrics Check
    console.log('\n4. Performance Metrics:');
    const performanceStatus = await page.evaluate(() => {
      const metrics = [
        'render-time', 'player-count', 'interaction-delay', 'memory-usage', 'fps-counter'
      ];
      
      const metricValues = {};
      metrics.forEach(id => {
        const element = document.getElementById(id);
        metricValues[id] = element ? element.textContent : 'Not found';
      });
      
      return {
        metrics: metricValues,
        performanceMonitorExists: !!document.querySelector('.performance-monitor')
      };
    });
    
    console.log('Performance status:', performanceStatus);
    
    // 5. Interaction Testing
    console.log('\n5. Interaction Testing:');
    const interactionResults = await page.evaluate(() => {
      // Try to find interactive elements
      const interactiveElements = {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        clickableElements: document.querySelectorAll('[onclick], [onmousedown]').length,
        canvas: document.querySelectorAll('canvas').length
      };
      
      // Test canvas interaction if available
      const canvasInteraction = document.querySelectorAll('canvas').length > 0;
      
      return {
        interactiveElements,
        canvasInteraction
      };
    });
    
    console.log('Interaction results:', interactionResults);
    
    // 6. Try to interact with canvas if it exists
    if (interactionResults.canvasInteraction) {
      console.log('\n6. Canvas Interaction Test:');
      try {
        await page.hover('canvas');
        await page.click('canvas');
        await page.waitForTimeout(1000);
        console.log('✅ Canvas interaction completed');
      } catch (error) {
        console.log('❌ Canvas interaction failed:', error.message);
      }
    }
    
    // 7. Summary and Recommendations
    console.log('\n=== VALIDATION SUMMARY ===');
    
    const issues = [];
    const recommendations = [];
    
    if (!widgetStatus.hasContent) {
      issues.push('❌ CRITICAL: VBD Scatter widget not mounted or empty');
    }
    
    if (widgetStatus.canvasCount === 0) {
      issues.push('❌ CRITICAL: No canvas elements found - scatter plot not rendering');
    }
    
    if (dataLoadingStatus.dataButtons.length === 0) {
      issues.push('❌ MAJOR: No data loading buttons/controls found');
      recommendations.push('💡 Add player data loading functionality');
    }
    
    if (dataLoadingStatus.reactStoreData?.players === 0) {
      issues.push('❌ MAJOR: No player data in React store');
      recommendations.push('💡 Implement data loading from localStorage or test data');
    }
    
    // Contrast issues
    const lowContrastElements = visualAnalysis.colorAnalysis.filter(el => 
      el.color === 'rgb(255, 255, 255)' && 
      (el.backgroundColor === 'rgba(0, 0, 0, 0)' || el.backgroundColor === 'rgb(255, 255, 255)')
    );
    
    if (lowContrastElements.length > 0) {
      issues.push('❌ VISUAL: Poor text contrast detected');
      recommendations.push('💡 Improve text color contrast for better readability');
    }
    
    console.log('\nIssues Found:', issues);
    console.log('\nRecommendations:', recommendations);
    
    const overallStatus = issues.length === 0 ? '✅ PASS' : 
                         issues.filter(i => i.includes('CRITICAL')).length > 0 ? '❌ CRITICAL ISSUES' : '⚠️ ISSUES FOUND';
    
    console.log('\nOverall Status:', overallStatus);
    
  } catch (error) {
    console.error('Validation failed:', error);
  }
  
  await browser.close();
}

validateT041Page().catch(console.error);