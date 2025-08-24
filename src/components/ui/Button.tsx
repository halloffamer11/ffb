import React from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// ============================================================================
// PROFESSIONAL BUTTON COMPONENT
// Standardized button with consistent styling and behavior
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'base' | 'lg';
  active?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const StyledButton = styled.button<{
  $variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  $size?: 'sm' | 'base' | 'lg';
  $active?: boolean;
  $loading?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => theme('spacing.sm')};
  font-family: ${props => theme('typography.fontFamily.base')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  border-radius: ${props => theme('borderRadius.base')};
  border: 1px solid transparent;
  cursor: pointer;
  transition: ${props => theme('animations.buttonHover')};
  user-select: none;
  position: relative;
  overflow: hidden;
  
  /* Size variants */
  ${props => {
    switch (props.$size) {
      case 'sm':
        return `
          padding: ${theme('spacing.xs')} ${theme('spacing.sm')};
          font-size: ${theme('typography.fontSize.sm')};
          line-height: ${theme('typography.lineHeight.tight')};
        `;
      case 'lg':
        return `
          padding: ${theme('spacing.lg')} ${theme('spacing.xl')};
          font-size: ${theme('typography.fontSize.lg')};
          line-height: ${theme('typography.lineHeight.base')};
        `;
      default:
        return `
          padding: ${theme('spacing.sm')} ${theme('spacing.md')};
          font-size: ${theme('typography.fontSize.base')};
          line-height: ${theme('typography.lineHeight.base')};
        `;
    }
  }}
  
  /* Style variants */
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: ${theme('gradients.accent')};
          color: ${theme('colors.bg')};
          border-color: ${theme('colors.accent')};
          
          &:hover:not(:disabled) {
            background: ${theme('gradients.accentHover')};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${theme('colors.accent')}40;
          }
          
          &:active {
            transform: translateY(0);
            transition: transform ${theme('transitions.micro')};
          }
        `;
        
      case 'outline':
        return `
          background: transparent;
          color: ${theme('colors.text2')};
          border-color: ${theme('colors.border2')};
          
          &:hover:not(:disabled) {
            background: ${theme('colors.surface2')};
            color: ${theme('colors.text1')};
            border-color: ${theme('colors.accent')};
          }
        `;
        
      case 'ghost':
        return `
          background: transparent;
          color: ${theme('colors.text2')};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background: ${theme('states.hover.background')};
            color: ${theme('colors.text1')};
          }
        `;
        
      default: // secondary
        return `
          background: ${theme('colors.surface2')};
          color: ${theme('colors.text2')};
          border-color: ${theme('colors.border1')};
          
          &:hover:not(:disabled) {
            background: ${theme('colors.surface3')};
            color: ${theme('colors.text1')};
            border-color: ${theme('colors.border2')};
          }
        `;
    }
  }}
  
  /* Active state */
  ${props => props.$active && `
    background: ${theme('colors.accent')} !important;
    color: ${theme('colors.bg')} !important;
    border-color: ${theme('colors.accent')} !important;
    box-shadow: 0 0 8px ${theme('colors.accent')}40;
    
    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: ${theme('borderRadius.base')};
      background: ${theme('colors.accent')};
      opacity: 0.1;
      pointer-events: none;
    }
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: ${props => theme('states.disabled.opacity')};
    cursor: ${props => theme('states.disabled.cursor')};
    filter: ${props => theme('states.disabled.filter')};
    transform: none !important;
    box-shadow: none !important;
  }
  
  /* Loading state */
  ${props => props.$loading && `
    pointer-events: none;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}
  
  /* Focus state */
  &:focus-visible {
    outline: ${props => theme('states.focus.outline')};
    outline-offset: ${props => theme('states.focus.outlineOffset')};
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'base',
  active = false,
  loading = false,
  disabled,
  children,
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      $variant={variant}
      $size={size}
      $active={active}
      $loading={loading}
      disabled={disabled || loading}
    >
      {loading ? '' : children}
    </StyledButton>
  );
};

// Default export for backward compatibility
export default Button;