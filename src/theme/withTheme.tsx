import React from 'react';
import { ThemeProvider } from 'styled-components';
import { designTokens } from './tokens';

// HOC to ensure theme is always available
export function withTheme<T extends {}>(Component: React.ComponentType<T>) {
  const WrappedComponent = (props: T) => (
    <ThemeProvider theme={designTokens}>
      <Component {...props} />
    </ThemeProvider>
  );
  
  WrappedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook to access theme safely
import { useTheme as useStyledTheme } from 'styled-components';

export function useTheme() {
  try {
    return useStyledTheme() || designTokens;
  } catch {
    return designTokens;
  }
}