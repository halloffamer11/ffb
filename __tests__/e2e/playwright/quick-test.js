import { chromium } from 'playwright';

async function testConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(5000);

  // Filter styled-components warnings
  const styledWarnings = consoleMessages.filter(msg =>
    msg.type === 'warning' && 
    msg.text.includes('styled-components: it looks like an unknown prop')
  );

  // Filter React prop warnings  
  const reactWarnings = consoleMessages.filter(msg =>
    msg.type === 'warning' && 
    msg.text.includes('Received') && 
    msg.text.includes('for a non-boolean attribute')
  );

  console.log('=== Console Test Results ===');
  console.log(`Total messages: ${consoleMessages.length}`);
  console.log(`Styled-components warnings: ${styledWarnings.length}`);
  console.log(`React prop warnings: ${reactWarnings.length}`);
  
  if (styledWarnings.length === 0 && reactWarnings.length === 0) {
    console.log('✅ SUCCESS: No styled-components or React prop warnings!');
  } else {
    console.log('❌ FAILED: Still have warnings');
    [...styledWarnings, ...reactWarnings].forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });
  }

  await browser.close();
}

testConsoleErrors();