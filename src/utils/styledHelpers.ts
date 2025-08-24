// Helper utilities for safe styled-components theme access
import { designTokens } from '../theme/tokens';

// Safe theme accessor that provides fallbacks
export const theme = (path: string, fallback?: string) => (props: any) => {
  const themeObj = props.theme || designTokens;
  const keys = path.split('.');
  let current = themeObj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Return fallback or CSS variable or hardcoded value
      if (fallback) return fallback;
      
      // Map common paths to CSS variables
      const cssVarMap: Record<string, string> = {
        'spacing.xs': 'var(--spacing-xs, 4px)',
        'spacing.sm': 'var(--spacing-sm, 8px)',
        'spacing.md': 'var(--spacing-md, 12px)',
        'spacing.lg': 'var(--spacing-lg, 16px)',
        'spacing.xl': 'var(--spacing-xl, 20px)',
        'colors.bg': 'var(--color-bg, #0b0b0c)',
        'colors.surface1': 'var(--color-surface1, #121214)',
        'colors.surface2': 'var(--color-surface2, #18181b)',
        'colors.surface3': 'var(--color-surface3, #1f1f23)',
        'colors.text1': 'var(--color-text1, #f5f5f6)',
        'colors.text2': 'var(--color-text2, #b3b3b8)',
        'colors.textMuted': 'var(--color-textMuted, #8a8a90)',
        'colors.border1': 'var(--color-border1, #2a2a2f)',
        'colors.border2': 'var(--color-border2, #3a3a40)',
        'colors.accent': 'var(--color-accent, #ccff00)',
        'colors.positive': 'var(--color-positive, #3ddc84)',
        'colors.negative': 'var(--color-negative, #ff5a5f)',
        'colors.warning': 'var(--color-warning, #fbbf24)',
        'colors.info': 'var(--color-info, #60a5fa)',
        'typography.fontSize.xs': 'var(--fontSize-xs, 11px)',
        'typography.fontSize.sm': 'var(--fontSize-sm, 12px)',
        'typography.fontSize.base': 'var(--fontSize-base, 14px)',
        'typography.fontSize.lg': 'var(--fontSize-lg, 16px)',
        'typography.fontWeight.medium': '500',
        'typography.fontWeight.semibold': '600',
        'typography.letterSpacing.tight': '-0.025em',
        'typography.fontFamily.base': 'var(--fontFamily-base, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)',
        'borderRadius.sm': 'var(--borderRadius-sm, 4px)',
        'borderRadius.base': 'var(--borderRadius-base, 6px)',
        'borderRadius.md': 'var(--borderRadius-md, 6px)',
        'borderRadius.lg': 'var(--borderRadius-lg, 8px)',
        'shadows.widget': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'shadows.modal': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'gradients.widget': 'var(--surface-1)',
        'gradients.widgetHover': 'var(--surface-2)',
        'gradients.widgetPressed': 'var(--surface-3)',
        'gradients.subtle': 'var(--surface-1)',
        'surfaces.widget': '#121214',
        'states.hover.background': 'rgba(255, 255, 255, 0.04)',
        'states.active.background': 'rgba(255, 255, 255, 0.02)',
        'states.disabled.opacity': '0.4',
        'states.disabled.cursor': 'not-allowed',
        'states.disabled.filter': 'grayscale(0.5)',
        'transitions.base': '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      };
      
      return cssVarMap[path] || 'var(--spacing-sm, 8px)'; // Ultimate fallback
    }
  }
  
  return typeof current === 'string' ? current : 'var(--spacing-sm, 8px)';
};