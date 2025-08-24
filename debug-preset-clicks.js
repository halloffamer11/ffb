/**
 * Debug script to investigate preset button click issues
 * Run this in browser console while on the dashboard
 */

// Wait for React to load
setTimeout(() => {
  console.log('🔧 Debug: Investigating preset button clicks');
  
  // Find preset buttons
  const presetButtons = document.querySelectorAll('[data-widget] button, button[role="menuitem"], .preset-button');
  console.log('🔧 Found potential preset buttons:', presetButtons);
  
  // Find buttons with preset-related text
  const allButtons = document.querySelectorAll('button');
  const presetRelatedButtons = Array.from(allButtons).filter(btn => {
    const text = btn.textContent || btn.title || btn.getAttribute('aria-label') || '';
    return text.match(/(pre-draft|nomination|analytics|preset|layout)/i) || 
           btn.querySelector('span')?.textContent?.match(/[123]/);
  });
  
  console.log('🔧 Preset-related buttons:', presetRelatedButtons);
  
  // Add debug event listeners
  presetRelatedButtons.forEach((button, index) => {
    const originalClick = button.onclick;
    const text = button.textContent?.trim() || `Button ${index}`;
    
    console.log(`🔧 Adding debug listener to: "${text}"`);
    
    button.addEventListener('click', (e) => {
      console.log(`🔧 CLICK DETECTED on "${text}":`, {
        target: e.target,
        currentTarget: e.currentTarget,
        type: e.type,
        bubbles: e.bubbles,
        defaultPrevented: e.defaultPrevented
      });
      
      // Check if event is being prevented
      if (e.defaultPrevented) {
        console.warn(`🔧 Default prevented for "${text}"`);
      }
      
      // Try to find React fiber
      const fiber = e.target._reactInternalFiber || e.target._reactInternals;
      if (fiber) {
        console.log(`🔧 React fiber found for "${text}":`, fiber);
      }
      
    }, true); // Capture phase to catch early
  });
  
  // Look for React components
  const reactRoots = document.querySelectorAll('[data-reactroot], #root, .app');
  console.log('🔧 React roots found:', reactRoots);
  
  // Try to access React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 React DevTools available');
  }
  
  // Test keyboard shortcuts
  console.log('🔧 Testing keyboard shortcut simulation...');
  ['1', '2', '3'].forEach(key => {
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      console.log(`🔧 Simulating key "${key}"`);
      document.dispatchEvent(event);
    }, 1000 * parseInt(key));
  });
  
}, 2000);

// Function to manually test preset switching
window.debugPresets = {
  testClick: (buttonIndex = 0) => {
    const buttons = document.querySelectorAll('button');
    const presetButtons = Array.from(buttons).filter(btn => {
      const text = btn.textContent || '';
      return text.match(/(pre-draft|nomination|analytics)/i);
    });
    
    if (presetButtons[buttonIndex]) {
      console.log(`🔧 Manual click test on button ${buttonIndex}`);
      presetButtons[buttonIndex].click();
    } else {
      console.warn(`🔧 No preset button found at index ${buttonIndex}`);
    }
  },
  
  logAllButtons: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    console.log('🔧 All buttons on page:', buttons.map((btn, i) => ({
      index: i,
      text: btn.textContent?.trim(),
      classes: btn.className,
      id: btn.id,
      dataset: btn.dataset
    })));
  }
};

console.log('🔧 Debug utilities loaded. Use debugPresets.testClick(0) or debugPresets.logAllButtons()');