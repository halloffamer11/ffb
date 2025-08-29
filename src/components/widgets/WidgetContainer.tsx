import React, { ReactNode, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// Clean border highlight for focus states - no shadow overlays
const borderHighlight = keyframes`
  0%, 100% {
    border-color: var(--border-1);
  }
  50% {
    border-color: var(--accent);
  }
`;

const Container = styled.div`
  height: 100%;
  background: ${props => theme('colors.surface1')};
  border: 1px solid var(--border-1);
  border-radius: ${props => theme('borderRadius.lg')};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: ${props => theme('transitions.base')};
  box-shadow: ${props => theme('shadows.widget')};
  
  /* Subtle top accent line for visual hierarchy without text interference */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.04);
    pointer-events: none;
  }
  
  /* Clean hover state - border focus over shadows */
  &:hover {
    border-color: var(--border-2);
    background: ${props => theme('states.hover.background')};
    
    &::before {
      background: var(--accent);
      opacity: 0.4;
    }
  }
  
  /* Focus state for keyboard navigation - clear outline only */
  &:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
    border-color: var(--accent);
  }
  
  /* Subtle active state without transform */
  &:active {
    border-color: var(--border-2);
    background: ${props => theme('states.active.background')};
  }
`;

const TitleBar = styled.div<{ $isEditMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  border-bottom: 1px solid var(--border-1);
  background: ${props => theme('colors.surface1')};
  position: relative;
  cursor: ${props => props.$isEditMode ? 'grab' : 'default'};
  
  /* Draggable state in edit mode */
  ${props => props.$isEditMode && `
    &:active {
      cursor: grabbing;
    }
  `}
  
  /* Clean bottom border for separation - no overlays */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  position: relative;
  z-index: 1;
`;

const Title = styled.h3`
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: var(--text-1);
  margin: 0;
  letter-spacing: ${props => theme('typography.letterSpacing.tight')};
  position: relative;
  z-index: 1;
`;


const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.xs', '2px')};
  position: relative;
  z-index: 1;
`;

const ControlButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: ${props => theme('borderRadius.sm')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: ${props => theme('typography.fontWeight.medium')};
  border: 1px solid transparent;
  transition: ${props => theme('transitions.base')};
  position: relative;
  
  /* Clean hover state - no shadows or transforms */
  &:hover {
    background: ${props => theme('states.hover.background')};
    color: var(--text-1);
    border-color: var(--border-2);
  }
  
  /* Simple active press feedback */
  &:active {
    background: ${props => theme('states.active.background')};
    border-color: var(--border-2);
  }
  
  /* Clear focus state */
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  /* Disabled state */
  &:disabled {
    opacity: ${props => theme('states.disabled.opacity')};
    cursor: ${props => theme('states.disabled.cursor')};
    filter: ${props => theme('states.disabled.filter')};
  }
`;


const Content = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  cursor: se-resize;
  opacity: 0;
  transition: ${props => theme('transitions.base')};
  border-radius: ${props => theme('borderRadius.sm')};
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  
  ${Container}:hover & {
    opacity: 0.6;
  }
  
  &:hover {
    opacity: 1 !important;
    background: ${props => theme('states.hover.background')};
  }
  
  /* Professional resize grip pattern */
  &::after {
    content: '';
    width: 10px;
    height: 10px;
    background-image: 
      linear-gradient(-45deg, transparent 2px, var(--text-muted) 2px, var(--text-muted) 4px, transparent 4px),
      linear-gradient(-45deg, transparent 6px, var(--text-muted) 6px, var(--text-muted) 8px, transparent 8px);
    background-size: 6px 6px;
    background-position: 0 0, 3px 3px;
    opacity: 0.8;
  }
`;

interface WidgetContainerProps {
  title: string;
  widgetId: string;
  children: ReactNode;
  editMode?: boolean;
  onSettings?: () => void;
  onPopOut?: () => void;
  onClose?: () => void;
  onRemove?: () => void;
}

export default function WidgetContainer({
  title,
  widgetId,
  children,
  editMode = false,
  onSettings,
  onPopOut,
  onClose,
  onRemove
}: WidgetContainerProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Container 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-labelledby={`widget-title-${widgetId}`}
      data-widget={widgetId}
      tabIndex={0}
    >
      <TitleBar 
        $isEditMode={editMode}
      >
        <TitleSection className={editMode ? "widget-drag-handle" : ""}>
          {editMode && (
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '12px', 
              marginRight: '8px',
              userSelect: 'none'
            }}>
              ⋮⋮
            </div>
          )}
          <Title id={`widget-title-${widgetId}`}>{title}</Title>
        </TitleSection>
        
        <Controls role="toolbar" aria-label="Widget controls" className="widget-controls">
          {/* Non-edit mode: Only show popout button */}
          {!editMode && (
            <ControlButton 
              onClick={() => {
                if (onPopOut) {
                  onPopOut();
                }
              }} 
              title="Pop out widget"
              aria-label="Pop out widget to new window"
            >
              <span aria-hidden="true">⤴</span>
            </ControlButton>
          )}
          
          {/* Edit mode: Show remove button */}
          {editMode && (
            <ControlButton 
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                if (onRemove || onClose) {
                  (onRemove || onClose)();
                }
              }} 
              title="Remove widget"
              aria-label="Remove widget from layout"
            >
              <span aria-hidden="true">×</span>
            </ControlButton>
          )}
        </Controls>
      </TitleBar>
      
      <Content>
        {children}
        <ResizeHandle 
          className="widget-resize-handle" 
          title="Resize widget"
          role="button"
          tabIndex={isHovered ? 0 : -1}
          aria-label="Resize widget by dragging"
        />
      </Content>
    </Container>
  );
}