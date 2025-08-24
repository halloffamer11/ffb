/**
 * Simple test script to validate preset button functionality
 * Use this to test the preset buttons outside of the validation page
 */

console.log('🔧 Testing preset button functionality...');

// Wait for page to load
setTimeout(() => {
  console.log('🔧 Looking for preset buttons...');
  
  // Look for buttons with preset-related content
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`🔧 Found ${allButtons.length} total buttons`);
  
  // Find buttons that contain preset shortcuts (1, 2, 3)
  const presetButtons = allButtons.filter(btn => {
    const text = btn.textContent || '';
    const hasShortcut = text.includes('1') || text.includes('2') || text.includes('3');
    const hasPresetText = /pre-draft|nomination|analytics/i.test(text);
    return hasShortcut || hasPresetText;
  });
  
  console.log(`🔧 Found ${presetButtons.length} preset buttons:`, presetButtons.map(btn => ({
    text: btn.textContent?.trim(),
    className: btn.className,
    id: btn.id
  })));
  
  // Test clicking each preset button
  presetButtons.forEach((button, index) => {
    setTimeout(() => {
      console.log(`🔧 Testing button ${index}: ${button.textContent?.trim()}`);
      button.click();
      
      // Check console for expected output
      setTimeout(() => {
        console.log(`🔧 Button ${index} click test completed`);
      }, 100);
      
    }, 1000 * (index + 1));
  });
  
  // Test keyboard shortcuts after button tests
  setTimeout(() => {
    console.log('🔧 Testing keyboard shortcuts...');
    ['1', '2', '3'].forEach((key, index) => {
      setTimeout(() => {
        console.log(`🔧 Testing keyboard shortcut: ${key}`);
        const event = new KeyboardEvent('keydown', { key, bubbles: true });
        document.dispatchEvent(event);
      }, 500 * (index + 1));
    });
  }, 5000);
  
}, 3000);

// Export test functions for manual use
window.testPresetButtons = {
  clickAll: () => {
    const presetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent || '';
      return text.includes('1') || text.includes('2') || text.includes('3');
    });
    
    presetButtons.forEach(button => {
      console.log(`Manual click test: ${button.textContent?.trim()}`);
      button.click();
    });
  },
  
  testKeyboard: () => {
    ['1', '2', '3'].forEach(key => {
      console.log(`Manual keyboard test: ${key}`);
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    });
  }
};

console.log('🔧 Test utilities loaded. Use testPresetButtons.clickAll() or testPresetButtons.testKeyboard()');