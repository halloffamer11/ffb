import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// ============================================================================
// LOADING STATE COMPONENTS
// Professional loading indicators with consistent styling
// ============================================================================

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Skeleton loading for table rows
const SkeletonContainer = styled.div`
  padding: ${props => theme('spacing.lg')};
  
  .skeleton-header {
    height: 24px;
    background: ${props => theme('colors.surface3')};
    border-radius: ${props => theme('borderRadius.sm')};
    margin-bottom: ${props => theme('spacing.md')};
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      animation: ${shimmer} 1.5s infinite;
    }
  }
  
  .skeleton-row {
    height: 32px;
    background: ${props => theme('colors.surface2')};
    border-radius: ${props => theme('borderRadius.sm')};
    margin-bottom: ${props => theme('spacing.xs')};
    position: relative;
    overflow: hidden;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.04),
        transparent
      );
      animation: ${shimmer} 1.5s infinite;
      animation-delay: ${props => Math.random() * 0.5}s;
    }
  }
`;

export interface SkeletonLoaderProps {
  rows?: number;
  showHeader?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  rows = 8,
  showHeader = false
}) => (
  <SkeletonContainer>
    {showHeader && <div className="skeleton-header" />}
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="skeleton-row" />
    ))}
  </SkeletonContainer>
);

// Spinner component
const SpinnerContainer = styled.div<{ size?: 'sm' | 'base' | 'lg' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  ${props => {
    switch (props.size) {
      case 'sm':
        return `width: 16px; height: 16px;`;
      case 'lg':
        return `width: 32px; height: 32px;`;
      default:
        return `width: 24px; height: 24px;`;
    }
  }}
`;

const SpinnerElement = styled.div<{ size?: 'sm' | 'base' | 'lg' }>`
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-top: 2px solid ${props => theme('colors.accent')};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  
  ${props => props.size === 'sm' && `border-width: 1.5px;`}
  ${props => props.size === 'lg' && `border-width: 3px;`}
`;

export interface SpinnerProps {
  size?: 'sm' | 'base' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'base', className }) => (
  <SpinnerContainer size={size} className={className}>
    <SpinnerElement size={size} />
  </SpinnerContainer>
);

// Full loading overlay
const LoadingOverlayContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => theme('colors.surface1')};
  backdrop-filter: blur(2px);
  z-index: 10;
`;

const LoadingText = styled.div`
  margin-top: ${props => theme('spacing.md')};
  color: ${props => theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  animation: ${pulse} 2s ease-in-out infinite;
`;

export interface LoadingOverlayProps {
  text?: string;
  size?: 'sm' | 'base' | 'lg';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text = 'Loading...',
  size = 'base'
}) => (
  <LoadingOverlayContainer>
    <Spinner size={size} />
    <LoadingText>{text}</LoadingText>
  </LoadingOverlayContainer>
);

// Chart loading state
const ChartLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => theme('gradients.subtle')};
    opacity: 0.3;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const ChartIcon = styled.div`
  font-size: ${props => theme('typography.fontSize')['2xl']};
  margin-bottom: ${props => theme('spacing.md')};
  opacity: 0.6;
  z-index: 1;
`;

const ChartLoadingText = styled.div`
  color: ${props => theme('colors.textMuted')};
  font-size: ${props => theme('typography.fontSize.sm')};
  z-index: 1;
  text-align: center;
`;

export const ChartLoading: React.FC<{ message?: string }> = ({
  message = 'Preparing chart data...'
}) => (
  <ChartLoadingContainer>
    <ChartIcon>📊</ChartIcon>
    <Spinner size="sm" />
    <ChartLoadingText>{message}</ChartLoadingText>
  </ChartLoadingContainer>
);

// Inline loading component for buttons
const InlineSpinner = styled(SpinnerElement)`
  width: 14px;
  height: 14px;
  border-width: 2px;
  margin-right: ${props => theme('spacing.xs')};
`;

export const InlineLoading: React.FC<{ text: string }> = ({ text }) => (
  <>
    <InlineSpinner />
    {text}
  </>
);