import React from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetGrid from '../widgets/WidgetGrid';

const CanvasContainer = styled.main`
  flex: 1;
  background: ${theme('colors.bg')};
  padding: ${theme('spacing.xl')};
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
    background: ${theme('colors.border2')};
    border-radius: 4px;
    
    &:hover {
      background: ${theme('colors.textMuted')};
    }
  }
`;

const GridContainer = styled.div`
  height: auto;
  min-height: calc(100vh - ${theme('layout.headerHeight')} - ${theme('spacing.xl')} * 2);
  position: relative;
  z-index: 1;
  
  /* Professional grid backdrop */
  background-image: 
    radial-gradient(circle at 20px 20px, ${theme('colors.border1')}40 1px, transparent 1px);
  background-size: ${theme('layout.grid.gap')} ${theme('layout.grid.gap')};
  background-position: ${theme('spacing.xs')} ${theme('spacing.xs')};
  
  /* Animation for smooth layout changes */
  transition: all ${theme('transitions.layout')};
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