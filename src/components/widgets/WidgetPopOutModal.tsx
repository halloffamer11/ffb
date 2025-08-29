import React, { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// Smooth fade and scale animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Modal = styled.div`
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  background: ${props => theme('colors.surface1')};
  border: 1px solid var(--border-1);
  border-radius: ${props => theme('borderRadius.lg')};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: ${props => theme('shadows.modal')};
  animation: ${scaleIn} 0.3s ease-out;
  position: relative;
  
  /* Subtle top accent line for visual hierarchy */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    opacity: 0.6;
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.md')} ${props => theme('spacing.lg')};
  border-bottom: 1px solid var(--border-1);
  background: ${props => theme('colors.surface1')};
  flex-shrink: 0;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
`;

const PopOutIcon = styled.div`
  color: var(--accent);
  font-size: 18px;
  font-weight: ${props => theme('typography.fontWeight.medium')};
`;

const Title = styled.h2`
  font-size: ${props => theme('typography.fontSize.lg')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: var(--text-1);
  margin: 0;
  letter-spacing: ${props => theme('typography.letterSpacing.tight')};
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${props => theme('borderRadius.md')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 18px;
  font-weight: ${props => theme('typography.fontWeight.medium')};
  border: 1px solid transparent;
  transition: ${props => theme('transitions.base')};
  background: transparent;
  
  &:hover {
    background: ${props => theme('states.hover.background')};
    color: var(--text-1);
    border-color: var(--border-2);
  }
  
  &:active {
    background: ${props => theme('states.active.background')};
    border-color: var(--border-2);
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  background: ${props => theme('colors.bg')};
  position: relative;
`;

const KeyboardShortcut = styled.div`
  position: absolute;
  top: 16px;
  right: 60px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: ${props => theme('borderRadius.sm')};
  font-size: 11px;
  font-weight: ${props => theme('typography.fontWeight.medium')};
  pointer-events: none;
  opacity: 0.8;
  z-index: 1;
  
  kbd {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 10px;
    margin: 0 2px;
  }
`;

interface WidgetPopOutModalProps {
  title: string;
  widgetId: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetPopOutModal({
  title,
  widgetId,
  children,
  isOpen,
  onClose
}: WidgetPopOutModalProps) {
  // Handle ESC key to close modal
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Add/remove global keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click to close
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <Backdrop 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`popout-title-${widgetId}`}
    >
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleSection>
            <PopOutIcon aria-hidden="true">⤴</PopOutIcon>
            <Title id={`popout-title-${widgetId}`}>{title}</Title>
          </TitleSection>
          
          <div style={{ position: 'relative' }}>
            <KeyboardShortcut>
              Press <kbd>ESC</kbd> to close
            </KeyboardShortcut>
            <CloseButton 
              onClick={onClose}
              title="Close pop-out (ESC)"
              aria-label="Close pop-out modal"
            >
              <span aria-hidden="true">×</span>
            </CloseButton>
          </div>
        </Header>
        
        <Content>
          {children}
        </Content>
      </Modal>
    </Backdrop>
  );

  // Use portal to render at document root for proper z-index layering
  return createPortal(modalContent, document.body);
}