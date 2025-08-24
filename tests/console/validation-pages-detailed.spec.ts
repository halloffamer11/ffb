import { test, expect } from '@playwright/test';

interface TestIssue {
  page: string;
  type: 'error' | 'warning' | 'missing-functionality' | 'broken-feature';
  description: string;
  location?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

test.describe('Validation Pages Detailed Analysis', () => {
  let issues: TestIssue[] = [];
  let consoleMessages: any[] = [];

  test.beforeEach(async ({ page }) => {
    issues = [];
    consoleMessages = [];
    
    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      issues.push({
        page: 'current',
        type: 'error',
        description: `Page Error: ${error.message}`,
        location: error.stack?.split('\n')[1] || 'unknown',
        severity: 'critical'
      });
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      issues.push({
        page: 'current',
        type: 'error',
        description: `Failed request: ${request.url()} - ${request.failure()?.errorText}`,
        severity: 'high'
      });
    });
  });

  test('T-039 Player Search React - Detailed Analysis', async ({ page }) => {
    await page.goto('/demos/ui/T-039_player_search_react.html');
    await page.waitForTimeout(3000);

    console.log('\n=== T-039 PLAYER SEARCH VALIDATION ===');
    
    // Check if React widget is actually mounted
    const reactWidgetContainer = page.locator('#react-search-widget');
    const reactContent = await reactWidgetContainer.textContent();
    
    if (reactContent?.includes('React PlayerSearchWidget would mount here')) {
      issues.push({
        page: 'T-039',
        type: 'missing-functionality',
        description: 'React PlayerSearchWidget is not actually mounted - showing placeholder instead',
        severity: 'critical'
      });
      console.log('❌ CRITICAL: React widget not mounted, showing placeholder');
    }

    // Check test button functionality
    const testButtons = ['getSelectedPlayer', 'setMockSelection', 'clearSelection', 'triggerSync', 'loadTestData'];
    for (const buttonId of testButtons) {
      const button = page.locator(`#${buttonId}`);
      if (await button.count() > 0) {
        try {
          await button.click();
          await page.waitForTimeout(200);
          console.log(`✅ Button ${buttonId} - clickable`);
        } catch (error) {
          issues.push({
            page: 'T-039',
            type: 'broken-feature',
            description: `Button ${buttonId} failed to respond: ${error}`,
            severity: 'medium'
          });
        }
      }
    }

    // Check automated test buttons
    const autoTestButtons = ['fuzzySearchTest', 'virtualScrollTest', 'keyboardNavTest'];
    for (const buttonId of autoTestButtons) {
      const button = page.locator(`#${buttonId}`);
      if (await button.count() > 0) {
        try {
          await button.click();
          await page.waitForTimeout(500);
          const results = await page.locator('#testResults').textContent();
          console.log(`✅ Automated test ${buttonId} - executed`);
        } catch (error) {
          issues.push({
            page: 'T-039',
            type: 'broken-feature',
            description: `Automated test ${buttonId} failed: ${error}`,
            severity: 'medium'
          });
        }
      }
    }

    // Check performance metrics display
    const metrics = ['searchTime', 'resultCount', 'totalPlayers', 'availablePlayers', 'draftedPlayers'];
    for (const metricId of metrics) {
      const metric = page.locator(`#${metricId}`);
      const value = await metric.textContent();
      if (value === '-' || value === '0') {
        issues.push({
          page: 'T-039',
          type: 'missing-functionality',
          description: `Metric ${metricId} not updating - shows: ${value}`,
          severity: 'medium'
        });
      }
    }

    // Check storage adapter and data loading
    const testDataResults = await page.evaluate(() => {
      try {
        const adapter = window.localStorage.getItem('workspace::players');
        return {
          hasStorageData: !!adapter,
          playerCount: adapter ? JSON.parse(adapter).length : 0
        };
      } catch {
        return { hasStorageData: false, playerCount: 0 };
      }
    });

    if (!testDataResults.hasStorageData) {
      issues.push({
        page: 'T-039',
        type: 'missing-functionality',
        description: 'Storage adapter not working - no player data stored',
        severity: 'high'
      });
    }

    console.log(`Player data: ${testDataResults.playerCount} players in storage`);
  });

  test('T-040 Budget Widget - Detailed Analysis', async ({ page }) => {
    await page.goto('/demos/ui/T-040_budget_widget_react_validation.html');
    await page.waitForTimeout(3000);

    console.log('\n=== T-040 BUDGET WIDGET VALIDATION ===');

    // Check if widget is properly rendered
    const widgetContainer = page.locator('#widget-root');
    const widgetContent = await widgetContainer.textContent();
    
    if (widgetContent?.includes('Budget Tracker (Enhanced)')) {
      console.log('✅ Budget widget is rendering');
      
      // Check if it shows real data or mock data
      if (widgetContent.includes('Updates: 0')) {
        issues.push({
          page: 'T-040',
          type: 'missing-functionality',
          description: 'Budget widget showing 0 updates - may not be connected to store',
          severity: 'high'
        });
      }
    } else {
      issues.push({
        page: 'T-040',
        type: 'missing-functionality',
        description: 'Budget widget not rendering content',
        severity: 'critical'
      });
    }

    // Test all validation buttons
    const testSuites = [
      { prefix: 'test1', name: 'Real Budget Calculations', buttons: ['loadFreshDraft', 'verifyInitialBudget'] },
      { prefix: 'test2', name: 'Real-time Draft Updates', buttons: ['draftPlayer1', 'draftPlayer2', 'draftPlayer3', 'undoLastPick'] },
      { prefix: 'test3', name: 'Position Spending', buttons: ['draftQB', 'draftRB', 'draftWR', 'draftTE'] },
      { prefix: 'test4', name: 'Budget Warnings', buttons: ['createLowBudget', 'createCriticalBudget', 'createConstraintViolation'] },
      { prefix: 'test5', name: 'Visual & Performance', buttons: ['performanceTest', 'visualCheck'] }
    ];

    for (const suite of testSuites) {
      console.log(`\nTesting ${suite.name}:`);
      
      for (const buttonName of suite.buttons) {
        const button = page.locator(`button[onclick*="${suite.prefix}_${buttonName}"]`);
        if (await button.count() > 0) {
          try {
            await button.click();
            await page.waitForTimeout(500);
            
            // Check if test result appeared
            const resultContainer = page.locator(`#${suite.prefix}-results`);
            const hasResult = await resultContainer.isVisible();
            const status = await page.locator(`#${suite.prefix}-status`).getAttribute('class');
            
            console.log(`  ${buttonName}: ${hasResult ? 'executed' : 'no result'} - status: ${status?.includes('pass') ? 'PASS' : status?.includes('fail') ? 'FAIL' : 'PENDING'}`);
            
            if (!hasResult) {
              issues.push({
                page: 'T-040',
                type: 'broken-feature',
                description: `Test ${suite.prefix}_${buttonName} button clicked but no result displayed`,
                severity: 'medium'
              });
            }
          } catch (error) {
            issues.push({
              page: 'T-040',
              type: 'broken-feature',
              description: `Test button ${suite.prefix}_${buttonName} failed: ${error}`,
              severity: 'medium'
            });
          }
        } else {
          issues.push({
            page: 'T-040',
            type: 'missing-functionality',
            description: `Test button ${suite.prefix}_${buttonName} not found`,
            severity: 'medium'
          });
        }
      }
    }

    // Check store integration
    const storeIntegration = await page.evaluate(() => {
      return {
        hasTestStore: typeof window.testStore !== 'undefined',
        hasTestAdapter: typeof window.testAdapter !== 'undefined',
        storeType: window.testStore ? window.testStore.constructor.name : 'undefined'
      };
    });

    if (!storeIntegration.hasTestStore) {
      issues.push({
        page: 'T-040',
        type: 'missing-functionality',
        description: 'testStore not available on window - store integration broken',
        severity: 'critical'
      });
    }

    console.log(`Store integration: testStore=${storeIntegration.hasTestStore}, adapter=${storeIntegration.hasTestAdapter}`);
  });

  test('T-041 VBD Scatter - Detailed Analysis', async ({ page }) => {
    await page.goto('/demos/ui/T-041_vbd_scatter_react_validation.html');
    await page.waitForTimeout(3000);

    console.log('\n=== T-041 VBD SCATTER VALIDATION ===');

    // Check if React app mounted
    const appContainer = page.locator('#app');
    const appContent = await appContainer.textContent();
    
    if (!appContent || appContent.trim() === '') {
      issues.push({
        page: 'T-041',
        type: 'missing-functionality',
        description: 'React app container (#app) is empty - widget not mounted',
        severity: 'critical'
      });
      console.log('❌ CRITICAL: React app not mounted in #app container');
    }

    // Check for canvas elements (scatter plot should use canvas)
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount === 0) {
      issues.push({
        page: 'T-041',
        type: 'missing-functionality',
        description: 'No canvas elements found - scatter plot not rendering',
        severity: 'critical'
      });
      console.log('❌ CRITICAL: No canvas elements found for scatter plot');
    } else {
      console.log(`✅ Found ${canvasCount} canvas element(s)`);
    }

    // Check performance metrics
    const metrics = ['render-time', 'player-count', 'interaction-delay', 'memory-usage'];
    for (const metricId of metrics) {
      const metric = page.locator(`#${metricId}`);
      const value = await metric.textContent();
      if (value === '--') {
        issues.push({
          page: 'T-041',
          type: 'missing-functionality',
          description: `Performance metric ${metricId} not updating`,
          severity: 'low'
        });
      }
    }

    // Check performance monitor
    const perfMonitor = page.locator('.performance-monitor');
    const fpsCounter = await page.locator('#fps-counter').textContent();
    console.log(`Performance monitor FPS: ${fpsCounter}`);

    // Try to interact with the chart (if it exists)
    if (canvasCount > 0) {
      try {
        const canvas = page.locator('canvas').first();
        await canvas.hover();
        await canvas.click();
        console.log('✅ Canvas interaction test completed');
      } catch (error) {
        issues.push({
          page: 'T-041',
          type: 'broken-feature',
          description: `Canvas interaction failed: ${error}`,
          severity: 'medium'
        });
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Filter console messages for errors
    const consoleErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && !msg.text.includes('favicon')
    );

    consoleErrors.forEach(error => {
      issues.push({
        page: 'current',
        type: 'error',
        description: `Console Error: ${error.text}`,
        location: error.location ? `${error.location.url}:${error.location.lineNumber}` : 'unknown',
        severity: 'high'
      });
    });

    // Print summary
    console.log('\n=== ISSUE SUMMARY ===');
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    criticalIssues.forEach(issue => {
      console.log(`   [${issue.page}] ${issue.description}`);
    });

    console.log(`⚠️  High Issues: ${highIssues.length}`);
    highIssues.forEach(issue => {
      console.log(`   [${issue.page}] ${issue.description}`);
    });

    console.log(`📋 Medium Issues: ${mediumIssues.length}`);
    console.log(`📝 Low Issues: ${lowIssues.length}`);

    console.log(`\nTotal Issues Found: ${issues.length}`);
  });
});