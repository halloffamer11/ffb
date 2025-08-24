/**
 * PresetSelector - Professional layout preset selection interface
 * 
 * Provides an elegant, trading-platform-style interface for switching between
 * workflow-optimized dashboard layouts with clear visual hierarchy and
 * accessibility features.
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../utils/styledHelpers';
import { presetMetadata, type PresetId, type LayoutPreset } from '../../utils/layoutPresets';

// Styled components with professional trading platform aesthetic
const SelectorContainer = styled.div<{ isOpen: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  z-index: ${props => props.isOpen ? 1000 : 10};
`;

const SelectorButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  
  background: ${props => props.isActive 
    ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)'
    : theme('colors.surface1')
  };
  color: ${props => props.isActive ? theme('colors.bg') : theme('colors.text1')};
  border: 1px solid ${props => props.isActive ? 'var(--accent)' : theme('colors.border1')};
  border-radius: ${props => theme('radii.md')};
  
  font-size: ${props => theme('fontSizes.sm')};
  font-weight: ${props => theme('fontWeights.medium')};
  font-family: ${props => theme('fonts.mono')};
  
  cursor: pointer;
  user-select: none;
  transition: all ${props => theme('transitions.fast')};
  
  /* Professional shadow */
  box-shadow: ${props => props.isActive
    ? `0 2px 8px ${theme('colors.accent')}40, inset 0 1px 0 rgba(255,255,255,0.1)`
    : `0 1px 3px ${theme('colors.shadow')}20, inset 0 1px 0 rgba(255,255,255,0.05)`
  };
  
  &:hover {
    background: ${props => props.isActive 
      ? 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)'
      : theme('colors.surface2')
    };
    border-color: ${props => props.isActive ? 'var(--accent-hover)' : theme('colors.border2')};
    transform: translateY(-1px);
    box-shadow: ${props => props.isActive
      ? `0 4px 12px ${theme('colors.accent')}50, inset 0 1px 0 rgba(255,255,255,0.15)`
      : `0 2px 8px ${theme('colors.shadow')}30, inset 0 1px 0 rgba(255,255,255,0.08)`
    };
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

const DropdownIcon = styled.span<{ isOpen: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
  transition: transform ${props => theme('transitions.fast')};
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 320px;
  
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.lg')};
  
  /* Professional depth */
  box-shadow: 
    0 8px 32px ${props => theme('colors.shadow')}40,
    0 2px 8px ${props => theme('colors.shadow')}20,
    inset 0 1px 0 rgba(255,255,255,0.1);
  
  /* Backdrop blur for modern feel */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen 
    ? 'translateY(0) scale(1)' 
    : 'translateY(-8px) scale(0.95)'
  };
  transition: all ${props => theme('transitions.medium')};
  
  /* Subtle border gradient */
  background-image: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
`;

const PresetOption = styled.button<{ 
  isActive: boolean; 
  primaryColor: string; 
}>`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  
  background: ${props => props.isActive 
    ? `linear-gradient(135deg, ${props.primaryColor}15 0%, ${props.primaryColor}08 100%)`
    : 'transparent'
  };
  color: ${props => theme('colors.text1')};
  border: none;
  border-left: 3px solid ${props => props.isActive ? props.primaryColor : 'transparent'};
  
  text-align: left;
  cursor: pointer;
  transition: all ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => props.isActive 
      ? `linear-gradient(135deg, ${props.primaryColor}20 0%, ${props.primaryColor}10 100%)`
      : `${theme('colors.surface2')}80`
    };
    border-left-color: ${props => props.primaryColor};
  }
  
  &:first-child {
    border-top-left-radius: ${props => theme('radii.lg')};
    border-top-right-radius: ${props => theme('radii.lg')};
  }
  
  &:last-child {
    border-bottom-left-radius: ${props => theme('radii.lg')};
    border-bottom-right-radius: ${props => theme('radii.lg')};
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    z-index: 1;
  }
`;

const PresetIcon = styled.div<{ primaryColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  
  background: linear-gradient(135deg, ${props => props.primaryColor}20 0%, ${props => props.primaryColor}10 100%);
  border: 1px solid ${props => props.primaryColor}40;
  border-radius: ${props => theme('radii.md')};
  
  font-size: 18px;
  flex-shrink: 0;
`;

const PresetInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PresetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  margin-bottom: ${props => theme('spacing.xs')};
`;

const PresetName = styled.span`
  font-size: ${props => theme('fontSizes.sm')};
  font-weight: ${props => theme('fontWeights.semibold')};
  color: ${props => theme('colors.text1')};
`;

const PresetShortcut = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  
  background: ${props => theme('colors.surface2')};
  color: ${props => theme('colors.textMuted')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  
  font-size: 11px;
  font-weight: ${props => theme('fontWeights.medium')};
  font-family: ${props => theme('fonts.mono')};
`;

const PresetDescription = styled.p`
  font-size: ${props => theme('fontSizes.xs')};
  color: ${props => theme('colors.textMuted')};
  margin: 0 0 ${props => theme('spacing.xs')} 0;
  line-height: 1.4;
`;

const PresetWorkflow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => theme('spacing.xs')};
`;

const WorkflowTag = styled.span<{ primaryColor: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${props => theme('spacing.xs')};
  
  background: ${props => props.primaryColor}15;
  color: ${props => props.primaryColor};
  border: 1px solid ${props => props.primaryColor}30;
  border-radius: ${props => theme('radii.sm')};
  
  font-size: 10px;
  font-weight: ${props => theme('fontWeights.medium')};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => theme('spacing.xs')};
  color: var(--accent);
  font-size: 11px;
  font-weight: ${props => theme('fontWeights.medium')};
  margin-left: auto;
`;

interface PresetSelectorProps {
  currentPreset: LayoutPreset;
  allPresets: LayoutPreset[];
  onPresetSelect: (presetId: PresetId) => void;
  className?: string;
}

export default function PresetSelector({
  currentPreset,
  allPresets,
  onPresetSelect,
  className
}: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);
  
  const handlePresetSelect = (presetId: PresetId) => {
    onPresetSelect(presetId);
    setIsOpen(false);
  };
  
  const currentMetadata = presetMetadata[currentPreset.id];
  
  return (
    <SelectorContainer 
      ref={containerRef} 
      className={className}
      isOpen={isOpen}
    >
      <SelectorButton
        isActive={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current layout: ${currentPreset.name}. Click to change layout.`}
      >
        <span>{currentPreset.icon}</span>
        <span>{currentPreset.name}</span>
        <DropdownIcon isOpen={isOpen}>▼</DropdownIcon>
      </SelectorButton>
      
      <DropdownMenu 
        isOpen={isOpen}
        role="listbox"
        aria-label="Layout presets"
      >
        {allPresets.map((preset) => {
          const metadata = presetMetadata[preset.id];
          const isActive = preset.id === currentPreset.id;
          
          return (
            <PresetOption
              key={preset.id}
              isActive={isActive}
              primaryColor={metadata.primaryColor}
              onClick={() => handlePresetSelect(preset.id)}
              role="option"
              aria-selected={isActive}
            >
              <PresetIcon primaryColor={metadata.primaryColor}>
                {preset.icon}
              </PresetIcon>
              
              <PresetInfo>
                <PresetHeader>
                  <PresetName>{preset.name}</PresetName>
                  <PresetShortcut 
                    aria-label={`Keyboard shortcut: ${preset.shortcut}`}
                  >
                    {preset.shortcut}
                  </PresetShortcut>
                  {isActive && (
                    <ActiveIndicator>
                      <span>●</span>
                      <span>Active</span>
                    </ActiveIndicator>
                  )}
                </PresetHeader>
                
                <PresetDescription>
                  {preset.description}
                </PresetDescription>
                
                <PresetWorkflow>
                  {metadata.workflow.map((step, index) => (
                    <WorkflowTag 
                      key={index}
                      primaryColor={metadata.primaryColor}
                    >
                      {step}
                    </WorkflowTag>
                  ))}
                </PresetWorkflow>
              </PresetInfo>
            </PresetOption>
          );
        })}
      </DropdownMenu>
    </SelectorContainer>
  );
}