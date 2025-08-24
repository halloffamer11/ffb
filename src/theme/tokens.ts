// Professional Trading Platform Design Tokens
// Robinhood Legend inspired with enhanced professional aesthetics
export const designTokens = {
  // Colors
  colors: {
    // Primary palette
    accent: '#ccff00',
    bg: '#0b0b0c',
    
    // Surface levels
    surface1: '#121214',
    surface2: '#18181b',
    surface3: '#1f1f23',
    
    // Text hierarchy
    text1: '#f5f5f6',      // Primary text
    text2: '#b3b3b8',      // Secondary text  
    textMuted: '#8a8a90',  // Muted text
    
    // Borders
    border1: '#2a2a2f',    // Subtle borders
    border2: '#3a3a40',    // Prominent borders
    
    // Semantic colors
    positive: '#3ddc84',   // Up moves, success
    negative: '#ff5a5f',   // Down moves, errors
    warning: '#fbbf24',    // Warning states
    info: '#60a5fa',       // Information
    
    // Alpha variants for overlays and subtle effects
    accentAlpha: 'rgba(204, 255, 0, 0.1)',
    positiveAlpha: 'rgba(61, 220, 132, 0.1)',
    positiveMuted: 'rgba(61, 220, 132, 0.6)',
    negativeAlpha: 'rgba(255, 90, 95, 0.1)',
    warningAlpha: 'rgba(251, 191, 36, 0.1)',
    infoAlpha: 'rgba(96, 165, 250, 0.1)',
    
    // Additional semantic variants
    danger: '#e53e3e',
    dangerAlpha: 'rgba(229, 62, 62, 0.1)',
    success: '#3ddc84',
    successAlpha: 'rgba(61, 220, 132, 0.1)',
    
    // Position colors (for charts/widgets)
    positions: {
      QB: '#8b5cf6',  // Purple
      RB: '#10b981',  // Green
      WR: '#3b82f6',  // Blue
      TE: '#f59e0b',  // Orange
      K: '#ef4444',   // Red
      DST: '#6366f1'  // Indigo
    }
  },
  
  // Professional Typography System
  typography: {
    fontFamily: {
      base: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Consolas", monospace',
      // Trading platform fonts with tabular numerics
      data: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      display: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '32px'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 800
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      base: 1.5,
      relaxed: 1.625,
      loose: 1.75
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    },
    // Font feature settings for professional data display
    fontFeatures: {
      tabularNums: 'font-variant-numeric: tabular-nums',
      proportionalNums: 'font-variant-numeric: proportional-nums',
      liningNums: 'font-variant-numeric: lining-nums',
      oldstyleNums: 'font-variant-numeric: oldstyle-nums'
    }
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px'
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    base: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  // Minimal Shadow System (prioritizing text readability)
  shadows: {
    // Very subtle shadows for depth only, no text interference
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    base: '0 2px 4px rgba(0, 0, 0, 0.15)',
    lg: '0 3px 6px rgba(0, 0, 0, 0.2)',
    
    // Widget shadows - minimal depth, maximum readability
    widget: '0 1px 3px rgba(0, 0, 0, 0.15)',
    widgetElevated: '0 2px 4px rgba(0, 0, 0, 0.2)',
    widgetInset: 'none', // Removed inset shadows that interfere with text
    
    // Interactive states - focus without heavy shadows
    focus: '0 0 0 2px #ccff00',
    focusInset: '0 0 0 2px #ccff00',
    
    // Data visualization overlays - reduced opacity
    tooltip: '0 3px 8px rgba(0, 0, 0, 0.3)',
    modal: '0 8px 16px rgba(0, 0, 0, 0.4)'
  },
  
  // Professional Gradient System
  gradients: {
    // Clean surface enhancement
    subtle: 'transparent',
    subtleInvert: 'transparent',
    
    // Widget backgrounds for premium feel
    widget: 'linear-gradient(145deg, #121214 0%, #18181b 100%)',
    widgetHover: 'linear-gradient(145deg, #18181b 0%, #1f1f23 100%)',
    widgetPressed: 'linear-gradient(145deg, #0f0f10 0%, #121214 100%)',
    
    // Accent gradients
    accent: 'linear-gradient(135deg, #ccff00 0%, #a3d900 100%)',
    accentHover: 'linear-gradient(135deg, #d9ff33 0%, #b3e600 100%)',
    accentMuted: 'linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(163, 217, 0, 0.05) 100%)',
    
    // Data visualization backgrounds
    chartOverlay: 'linear-gradient(180deg, rgba(11, 11, 12, 0) 0%, rgba(11, 11, 12, 0.8) 100%)',
    tooltipBg: 'linear-gradient(135deg, #1a1a1e 0%, #0f0f12 100%)',
    
    // Status gradients for semantic colors
    positive: 'linear-gradient(135deg, #3ddc84 0%, #00c851 100%)',
    negative: 'linear-gradient(135deg, #ff5a5f 0%, #e53e3e 100%)',
    warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
  },
  
  // Layout
  layout: {
    headerHeight: '64px',
    leftRailWidth: {
      expanded: '280px',
      collapsed: '64px'
    },
    grid: {
      columns: 24,
      rowHeight: '12px',
      gap: '8px'
    }
  },
  
  // Professional Animation System
  transitions: {
    // Micro-interactions (buttons, hover states)
    micro: '0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    base: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Specialized easing for different interactions
    bounce: '0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    
    // Data animations (charts, tables)
    dataEntry: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    dataExit: '0.2s cubic-bezier(0.4, 0, 0.6, 1)',
    
    // Layout transitions
    layout: '0.25s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Animation Presets
  animations: {
    // Button interactions
    buttonHover: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    buttonPress: 'transform 0.1s cubic-bezier(0.4, 0, 0.6, 1)',
    
    // Widget interactions  
    widgetHover: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    widgetFocus: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Data state changes
    dataChange: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    valueUpdate: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Loading states
    shimmer: 'shimmer 1.5s ease-in-out infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    
    // Modal and overlay animations
    fadeIn: 'fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slideUp: 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    scaleIn: 'scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Z-index scale
  zIndex: {
    tooltip: 1000,
    modal: 2000,
    toast: 3000
  },
  
  // Professional Interaction States
  states: {
    // Interactive element states with precise opacity values
    hover: {
      opacity: 0.8,
      background: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.08)'
    },
    active: {
      opacity: 0.9,
      background: 'rgba(255, 255, 255, 0.02)',
      transform: 'translateY(1px)'
    },
    focus: {
      outline: '2px solid #ccff00',
      outlineOffset: '2px'
    },
    disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
      filter: 'grayscale(0.5)'
    }
  },
  
  // Data Visualization Enhancements
  dataViz: {
    // Chart styling
    grid: {
      primary: 'rgba(255, 255, 255, 0.08)',
      secondary: 'rgba(255, 255, 255, 0.04)'
    },
    axes: {
      color: 'rgba(255, 255, 255, 0.4)',
      width: 1
    },
    
    // Professional color scales for data
    scales: {
      performance: ['#ff5a5f', '#fbbf24', '#3ddc84'],
      heatmap: ['#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
      diverging: ['#ff5a5f', '#f1f5f9', '#3ddc84']
    },
    
    // Data point styling
    points: {
      radius: {
        sm: 3,
        base: 4,
        lg: 6,
        selected: 8
      },
      stroke: {
        width: 1.5,
        selectedWidth: 2.5
      }
    }
  },
  
  // Responsive Breakpoints (for consistent scaling)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const;

export type DesignTokens = typeof designTokens;