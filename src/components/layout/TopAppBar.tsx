import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../utils/styledHelpers';

const AppBar = styled.header`
  height: ${props => theme('layout.headerHeight')};
  background: ${props => theme('gradients.widget')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding: 0 ${props => theme('spacing.xl')};
  gap: ${props => theme('spacing.lg')};
  z-index: 100;
  position: relative;
  
  /* Professional header shadow */
  box-shadow: ${props => theme('shadows.widget')};
  
  /* Subtle top highlight */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => theme('gradients.subtle')};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.div`
  font-size: ${props => theme('typography.fontSize.xl')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  color: ${props => theme('colors.text1')};
  letter-spacing: ${props => theme('typography.letterSpacing.tight')};
  cursor: pointer;
  user-select: none;
  transition: ${props => theme('transitions.fast')};
  
  /* Professional logo styling */
  background: ${props => theme('gradients.accent')};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  &:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
`;


const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchInput = styled.input`
  width: 100%;
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  padding: ${props => theme('spacing.md')} ${props => theme('spacing.lg')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.normal')};
  transition: ${props => theme('transitions.fast')};
  
  &::placeholder {
    color: ${props => theme('colors.textMuted')};
    font-style: italic;
  }
  
  &:hover {
    background: ${props => theme('colors.surface3')};
    border-color: ${props => theme('colors.border2')};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => theme('colors.accent')};
    box-shadow: ${props => theme('shadows.focus')};
    background: ${props => theme('colors.surface1')};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.text2')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.wider')};
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => theme('colors.positiveAlpha')};
  border-radius: ${props => theme('borderRadius.base')};
  border: 1px solid ${props => theme('colors.positive')}40;
`;

const LiveDot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? theme('colors.positive') : theme('colors.textMuted')};
  position: relative;
  
  ${props => props.$active && `
    animation: pulse 2s infinite;
    
    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: ${theme('colors.positive')};
      opacity: 0.3;
      animation: pulse-ring 2s infinite;
    }
  `}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes pulse-ring {
    0% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.5);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${props => theme('borderRadius.base')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => theme('colors.text2')};
  font-size: 16px;
  position: relative;
  transition: ${props => theme('animations.buttonHover')};
  border: 1px solid transparent;
  
  /* Professional button styling */
  &:hover {
    background: ${props => theme('states.hover.background')};
    color: ${props => theme('colors.text1')};
    border-color: ${props => theme('colors.border2')};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
    background: ${props => theme('states.active.background')};
    transition: transform ${props => theme('transitions.micro')};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => theme('colors.accent')};
    outline-offset: 2px;
  }
`;

export default function TopAppBar() {
  const navigate = useNavigate();

  return (
    <AppBar>
      <LeftSection>
        <Logo>FFB</Logo>
      </LeftSection>
      
      <CenterSection>
        <SearchInput 
          type="text"
          placeholder="Search players, teams, or strategies..."
        />
      </CenterSection>
      
      <RightSection>
        <StatusIndicator>
          <LiveDot $active={true} />
          LIVE
        </StatusIndicator>
        
        <IconButton 
          title="Import Data" 
          aria-label="Import Data"
          onClick={() => navigate('/data-management')}
        >
          📊
        </IconButton>
        
        <IconButton title="Notifications" aria-label="Notifications">
          🔔
        </IconButton>
        
        <IconButton 
          title="Settings" 
          aria-label="Settings"
          onClick={() => navigate('/settings')}
        >
          ⚙️
        </IconButton>
        
        <IconButton title="User Account" aria-label="User Account">
          👤
        </IconButton>
      </RightSection>
    </AppBar>
  );
}