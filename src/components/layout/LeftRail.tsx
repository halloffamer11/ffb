import React from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import { useLayoutPresets } from '../../hooks/useLayoutPresets';
import { presetMetadata } from '../../utils/layoutPresets';

const RailContainer = styled.aside<{ $collapsed: boolean }>`
  width: ${props => props.$collapsed ? theme('layout.leftRailWidth.collapsed') : theme('layout.leftRailWidth.expanded')};
  background: ${props => theme('gradients.widget')};
  border-right: 1px solid ${props => theme('colors.border1')};
  transition: width ${props => theme('transitions.layout')}, box-shadow ${props => theme('transitions.fast')};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  
  /* Professional shadow for depth */
  box-shadow: ${props => theme('shadows.widget')};
  
  /* Inner highlight */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: ${props => theme('gradients.subtle')};
  }
`;

const RailHeader = styled.div`
  padding: ${props => theme('spacing.lg')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => theme('gradients.subtle')};
  position: relative;
  
  /* Professional header shadow */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${props => theme('colors.border2')}, transparent);
  }
`;

const RailTitle = styled.h3`
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.wider')};
  margin: 0;
`;

const CollapseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${props => theme('borderRadius.base')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => theme('colors.text2')};
  font-size: 14px;
  font-weight: ${props => theme('typography.fontWeight.medium')};
  border: 1px solid transparent;
  transition: ${props => theme('animations.buttonHover')};
  
  &:hover {
    background: ${props => theme('states.hover.background')};
    color: ${props => theme('colors.text1')};
    border-color: ${props => theme('colors.border2')};
    transform: translateX(-2px);
  }
  
  &:active {
    transform: translateX(0);
    background: ${props => theme('states.active.background')};
    transition: transform ${props => theme('transitions.micro')};
  }
`;

const RailContent = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.$collapsed ? '8px 4px' : '16px'};
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionHeader = styled.h4`
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.textMuted')};
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.widest')};
  margin: 0 0 ${props => theme('spacing.sm')} 0;
  padding: 0 ${props => theme('spacing.sm')};
`;

const MenuItem = styled.div<{ $collapsed: boolean; $active?: boolean }>`
  padding: ${props => props.$collapsed ? theme('spacing.sm') : `${theme('spacing.sm')} ${theme('spacing.md')}`};
  border-radius: ${props => theme('borderRadius.base')};
  cursor: pointer;
  color: ${props => props.$active ? theme('colors.text1') : theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.md')};
  margin-bottom: ${props => theme('spacing.xs')};
  transition: ${props => theme('transitions.fast')};
  position: relative;
  border: 1px solid transparent;
  
  /* Active state styling */
  ${props => props.$active && `
    background: ${theme('colors.accentAlpha')};
    color: ${theme('colors.text1')};
    border-color: ${theme('colors.accent')}40;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${theme('colors.accent')};
      border-radius: 0 2px 2px 0;
    }
  `}
  
  &:hover {
    background: ${props => theme('states.hover.background')};
    color: ${props => theme('colors.text1')};
    border-color: ${props => theme('colors.border2')};
    transform: translateX(2px);
  }
  
  &:active {
    transform: translateX(1px);
    background: ${props => theme('states.active.background')};
    transition: transform ${props => theme('transitions.micro')};
  }
  
  ${props => props.$collapsed && `
    justify-content: center;
    padding: ${theme('spacing.sm')};
  `}
`;

const MenuIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
`;

const MenuText = styled.span<{ $collapsed: boolean }>`
  ${props => props.$collapsed && 'display: none;'}
`;

const LinkDot = styled.div<{ color: string; $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${props => props.$active ? 
    `radial-gradient(circle, ${props.color} 0%, ${props.color}80 70%, transparent 100%)` : 
    'transparent'
  };
  border: 2px solid ${props => props.$active ? props.color : theme('colors.border1')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  position: relative;
  
  /* Professional glow effect when active */
  ${props => props.$active && `
    box-shadow: 0 0 8px ${props.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2);
    
    &::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: ${props.color};
      opacity: 0.1;
      animation: pulse 2s infinite;
    }
  `}
  
  &:hover {
    transform: scale(1.15);
    border-color: ${props => props.$active ? props.color : theme('colors.border2')};
    
    ${props => !props.$active && `
      background: radial-gradient(circle, ${props.color}30 0%, transparent 100%);
      border-color: ${props.color}60;
    `}
  }
  
  &:active {
    transform: scale(1.05);
    transition: transform ${props => theme('transitions.micro')};
  }
`;

const LinkGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
`;

const PresetMenuItem = styled.div<{ $collapsed: boolean; $active?: boolean; $primaryColor?: string }>`
  padding: ${props => props.$collapsed ? theme('spacing.sm') : `${theme('spacing.sm')} ${theme('spacing.md')}`};
  border-radius: ${props => theme('borderRadius.base')};
  cursor: pointer;
  color: ${props => props.$active ? theme('colors.text1') : theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.md')};
  margin-bottom: ${props => theme('spacing.xs')};
  transition: ${props => theme('transitions.fast')};
  position: relative;
  border: 1px solid transparent;
  
  /* Active state styling with preset-specific colors */
  ${props => props.$active && `
    background: ${props.$primaryColor || theme('colors.accent')}15;
    color: ${theme('colors.text1')};
    border-color: ${props.$primaryColor || theme('colors.accent')}40;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${props.$primaryColor || theme('colors.accent')};
      border-radius: 0 2px 2px 0;
    }
  `}
  
  &:hover {
    background: ${props => props.$active 
      ? `${props.$primaryColor || theme('colors.accent')}20` 
      : theme('states.hover.background')
    };
    color: ${props => theme('colors.text1')};
    border-color: ${props => props.$active 
      ? `${props.$primaryColor || theme('colors.accent')}60`
      : theme('colors.border2')
    };
    transform: translateX(2px);
  }
  
  &:active {
    transform: translateX(1px);
    background: ${props => props.$active 
      ? `${props.$primaryColor || theme('colors.accent')}25`
      : theme('states.active.background')
    };
    transition: transform ${props => theme('transitions.micro')};
  }
  
  ${props => props.$collapsed && `
    justify-content: center;
    padding: ${theme('spacing.sm')};
  `}
`;

const PresetShortcut = styled.span<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  
  background: ${props => theme('colors.surface2')};
  color: ${props => theme('colors.textMuted')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  
  font-size: 10px;
  font-weight: ${props => theme('fontWeights.medium')};
  font-family: ${props => theme('fonts.mono')};
  
  ${props => props.$collapsed && 'display: none;'}
`;

interface LeftRailProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function LeftRail({ collapsed, onToggleCollapsed }: LeftRailProps) {
  // Use the layout presets hook for preset management
  const {
    currentPreset,
    currentPresetId,
    allPresets,
    switchToPreset,
    isPresetActive
  } = useLayoutPresets();

  const handlePresetClick = (presetId: string) => {
    console.log(`🎯 LeftRail: Preset clicked: ${presetId}`);
    if (presetId === 'pre-draft' || presetId === 'nomination' || presetId === 'player-analytics') {
      const success = switchToPreset(presetId);
      console.log(`🎯 LeftRail: Preset switch result: ${success}`);
    } else {
      console.warn(`🎯 LeftRail: Invalid preset ID: ${presetId}`);
    }
  };

  return (
    <RailContainer $collapsed={collapsed}>
      <RailHeader>
        {!collapsed && <RailTitle>Navigation</RailTitle>}
        <CollapseButton onClick={onToggleCollapsed}>
          {collapsed ? '→' : '←'}
        </CollapseButton>
      </RailHeader>
      
      <RailContent $collapsed={collapsed}>
        <Section>
          {!collapsed && <SectionHeader>Watchlists</SectionHeader>}
          <MenuItem $collapsed={collapsed} $active={true}>
            <MenuIcon>⭐</MenuIcon>
            <MenuText $collapsed={collapsed}>Favorites</MenuText>
          </MenuItem>
          <MenuItem $collapsed={collapsed}>
            <MenuIcon>🎯</MenuIcon>
            <MenuText $collapsed={collapsed}>Targets</MenuText>
          </MenuItem>
          <MenuItem $collapsed={collapsed}>
            <MenuIcon>⚠️</MenuIcon>
            <MenuText $collapsed={collapsed}>Avoid List</MenuText>
          </MenuItem>
        </Section>
        
        <Section>
          {!collapsed && <SectionHeader>Layouts</SectionHeader>}
          {allPresets.map((preset) => {
            const metadata = presetMetadata[preset.id];
            const isActive = isPresetActive(preset.id);
            
            return (
              <PresetMenuItem 
                key={preset.id}
                $collapsed={collapsed}
                $active={isActive}
                $primaryColor={metadata.primaryColor}
                onClick={() => handlePresetClick(preset.id)}
                title={collapsed ? `${preset.name} (${preset.shortcut})` : preset.description}
              >
                <MenuIcon>{preset.icon}</MenuIcon>
                <MenuText $collapsed={collapsed}>{preset.name}</MenuText>
                <PresetShortcut $collapsed={collapsed}>
                  {preset.shortcut}
                </PresetShortcut>
              </PresetMenuItem>
            );
          })}
        </Section>
        
        <Section>
          {!collapsed && <SectionHeader>Widget Links</SectionHeader>}
          {!collapsed ? (
            <div>
              <LinkGroup>
                <LinkDot color="var(--accent)" $active={true} />
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Group A</span>
              </LinkGroup>
              <LinkGroup>
                <LinkDot color="#3ddc84" $active={false} />
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Group B</span>
              </LinkGroup>
              <LinkGroup>
                <LinkDot color="#ff5a5f" $active={false} />
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Group C</span>
              </LinkGroup>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <LinkDot color="var(--accent)" $active={true} />
              <LinkDot color="#3ddc84" $active={false} />
              <LinkDot color="#ff5a5f" $active={false} />
            </div>
          )}
        </Section>
      </RailContent>
    </RailContainer>
  );
}