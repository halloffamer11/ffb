import React from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// ============================================================================
// PROFESSIONAL BADGE COMPONENT  
// Standardized badge for status indicators, positions, etc.
// ============================================================================

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'position';
  size?: 'sm' | 'base' | 'lg';
  position?: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  className?: string;
}

const StyledBadge = styled.span<{
  $variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'position';
  $size?: 'sm' | 'base' | 'lg';
  $position?: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => theme('typography.fontFamily.base')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  border-radius: ${props => theme('borderRadius.sm')};
  border: 1px solid transparent;
  text-align: center;
  line-height: 1;
  transition: ${props => theme('transitions.fast')};
  user-select: none;
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.wide')};
  
  /* Size variants */
  ${props => {
    switch (props.$size) {
      case 'sm':
        return `
          padding: 2px 6px;
          font-size: ${theme('typography.fontSize.xs')};
          min-width: 20px;
        `;
      case 'lg':
        return `
          padding: 6px 12px;
          font-size: ${theme('typography.fontSize.sm')};
          min-width: 32px;
        `;
      default:
        return `
          padding: 3px 8px;
          font-size: ${theme('typography.fontSize.xs')};
          min-width: 24px;
        `;
    }
  }}
  
  /* Color variants */
  ${props => {
    if (props.$variant === 'position' && props.$position) {
      const positionColor = theme('colors.positions')[props.$position];
      return `
        color: ${positionColor};
        background: ${positionColor}20;
        border-color: ${positionColor}40;
      `;
    }
    
    switch (props.$variant) {
      case 'success':
        return `
          color: ${theme('colors.positive')};
          background: ${theme('colors.positiveAlpha')};
          border-color: ${theme('colors.positive')}40;
        `;
      case 'warning':
        return `
          color: ${theme('colors.warning')};
          background: ${theme('colors.warningAlpha')};
          border-color: ${theme('colors.warning')}40;
        `;
      case 'error':
        return `
          color: ${theme('colors.negative')};
          background: ${theme('colors.negativeAlpha')};
          border-color: ${theme('colors.negative')}40;
        `;
      case 'info':
        return `
          color: ${theme('colors.info')};
          background: ${theme('colors.infoAlpha')};
          border-color: ${theme('colors.info')}40;
        `;
      default:
        return `
          color: ${theme('colors.text2')};
          background: ${theme('colors.surface2')};
          border-color: ${theme('colors.border1')};
        `;
    }
  }}
  
  /* Hover effect */
  &:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
`;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'base',
  position,
  className,
  ...props
}) => {
  return (
    <StyledBadge
      {...props}
      $variant={variant}
      $size={size}
      $position={position}
      className={className}
    >
      {children}
    </StyledBadge>
  );
};