import React, { ReactNode, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { designTokens } from './tokens';

// Import animations CSS
import './animations.css';

// Global styles with CSS custom properties for professional trading platform aesthetics
const GlobalStyles = createGlobalStyle`
  :root {
    /* Core Colors */
    --accent: ${designTokens.colors.accent};
    --bg: ${designTokens.colors.bg};
    
    /* Surface Levels */
    --surface-1: ${designTokens.colors.surface1};
    --surface-2: ${designTokens.colors.surface2};
    --surface-3: ${designTokens.colors.surface3};
    
    /* Text Hierarchy */
    --text-1: ${designTokens.colors.text1};
    --text-2: ${designTokens.colors.text2};
    --text-muted: ${designTokens.colors.textMuted};
    
    /* Borders */
    --border-1: ${designTokens.colors.border1};
    --border-2: ${designTokens.colors.border2};
    
    /* Semantic Colors */
    --positive: ${designTokens.colors.positive};
    --negative: ${designTokens.colors.negative};
    --warning: ${designTokens.colors.warning};
    --info: ${designTokens.colors.info};
    --danger: ${designTokens.colors.danger};
    --success: ${designTokens.colors.success};
    
    /* Alpha Variants */
    --accent-alpha: ${designTokens.colors.accentAlpha};
    --positive-alpha: ${designTokens.colors.positiveAlpha};
    --positive-muted: ${designTokens.colors.positiveMuted};
    --negative-alpha: ${designTokens.colors.negativeAlpha};
    --warning-alpha: ${designTokens.colors.warningAlpha};
    --info-alpha: ${designTokens.colors.infoAlpha};
    --danger-alpha: ${designTokens.colors.dangerAlpha};
    --success-alpha: ${designTokens.colors.successAlpha};
  }
  
  /* Professional Typography with Tabular Numerics */
  body {
    font-family: ${designTokens.typography.fontFamily.base};
    background: ${designTokens.colors.bg};
    color: ${designTokens.colors.text1};
    font-feature-settings: "tnum" 1; /* Enable tabular numerics by default */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Data visualization text should always use tabular numerics */
  .data-value,
  .numeric-value,
  [data-numeric="true"],
  .vbd-value,
  .price-value,
  .percentage-value {
    ${designTokens.typography.fontFeatures.tabularNums};
    font-weight: ${designTokens.typography.fontWeight.medium};
  }
  
  /* Professional scrollbars */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${designTokens.colors.border2} transparent;
  }
  
  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  
  *::-webkit-scrollbar-thumb {
    background: ${designTokens.colors.border2};
    border-radius: 3px;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: ${designTokens.colors.textMuted};
  }
  
  /* Focus management for accessibility */
  :focus {
    outline: 2px solid ${designTokens.colors.accent};
    outline-offset: 2px;
  }
  
  :focus-visible {
    outline: 2px solid ${designTokens.colors.accent};
    outline-offset: 2px;
  }
  
  /* Remove focus outline for mouse interactions */
  :focus:not(:focus-visible) {
    outline: none;
  }
  
  /* Professional selection styles */
  ::selection {
    background: ${designTokens.colors.accentAlpha};
    color: ${designTokens.colors.accent};
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Apply theme tokens to document for CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const startTime = performance.now();
    
    // Set CSS custom properties for real-time theme updates only if not already set
    Object.entries(designTokens.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const propertyName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        const currentValue = root.style.getPropertyValue(propertyName);
        if (!currentValue || currentValue !== value) {
          root.style.setProperty(propertyName, value);
        }
      }
    });
    
    // Performance monitoring for theme application - only warn if over 50ms
    const endTime = performance.now();
    if (endTime - startTime > 50) {
      console.warn(`Theme application took ${(endTime - startTime).toFixed(2)}ms`);
    }
  }, []);
  
  return (
    <StyledThemeProvider theme={designTokens}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
}

// Export theme hook
export { useTheme } from 'styled-components';

// Helper function to access theme tokens
export const getToken = (path: string) => {
  return path.split('.').reduce((acc, key) => acc?.[key], designTokens);
};