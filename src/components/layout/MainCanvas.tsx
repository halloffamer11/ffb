import React from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetGrid from '../widgets/WidgetGrid';

const CanvasContainer = styled.main`
  flex: 1;
  background: ${props => theme('colors.bg')};
  padding: ${props => theme('spacing.xl')};
  overflow: auto;
  position: relative;
  
  /* Clean professional background */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: transparent;
    pointer-events: none;
  }
  
  /* Custom scrollbar for main content */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => theme('colors.border2')};
    border-radius: 4px;
    
    &:hover {
      background: ${props => theme('colors.textMuted')};
    }
  }
`;

const GridContainer = styled.div`
  height: auto;
  min-height: calc(100vh - ${props => theme('layout.headerHeight')} - ${props => theme('spacing.xl')} * 2);
  position: relative;
  z-index: 1;
  
  /* Professional grid backdrop */
  background-image: 
    radial-gradient(circle at 20px 20px, ${props => theme('colors.border1')}40 1px, transparent 1px);
  background-size: ${props => theme('layout.grid.gap')} ${props => theme('layout.grid.gap')};
  background-position: ${props => theme('spacing.xs')} ${props => theme('spacing.xs')};
  
  /* Fade out grid pattern at edges */
  mask-image: radial-gradient(ellipse at center, black 60%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 60%, transparent 100%);
  
  /* Animation for smooth layout changes */
  transition: all ${props => theme('transitions.layout')};
`;

interface MainCanvasProps {
  className?: string;
}

export default function MainCanvas({ className }: MainCanvasProps) {
  return (
    <CanvasContainer className={className}>
      <GridContainer>
        <WidgetGrid />
      </GridContainer>
    </CanvasContainer>
  );
}