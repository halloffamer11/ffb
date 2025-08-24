// Default theme fallback values for when ThemeProvider is not available
export const defaultTheme = {
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  colors: {
    bg: '#0b0b0c',
    surface1: '#121214',
    surface2: '#18181b',
    surface3: '#1f1f23',
    text1: '#f5f5f6',
    text2: '#b3b3b8',
    textMuted: '#8a8a90',
    border1: '#2a2a2f',
    border2: '#3a3a40',
    accent: '#ccff00',
    positive: '#3ddc84',
    negative: '#ff5a5f',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  typography: {
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontFamily: {
      base: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    }
  },
  borderRadius: {
    sm: '4px',
    base: '6px',
    lg: '8px',
  }
};

// Helper function to safely access theme properties with fallback
export const getThemeValue = (props: any, path: string, fallback?: string): string => {
  const theme = props.theme || defaultTheme;
  const keys = path.split('.');
  let current = theme;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback || '8px'; // Default fallback
    }
  }
  
  return typeof current === 'string' ? current : (fallback || '8px');
};