/**
 * Layout Presets Hook - Professional dashboard preset management
 * 
 * Provides state management and keyboard shortcuts for switching between
 * workflow-optimized layout presets with proper focus guarding.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  layoutPresets, 
  getLayoutPresetByShortcut, 
  getDefaultPreset,
  type PresetId, 
  type LayoutPreset 
} from '../utils/layoutPresets';
import { createStorageAdapter } from '../adapters/storage.js';
import { usePreset } from '../stores/PresetContext';

// Storage for current preset selection
const presetStorage = createStorageAdapter({
  namespace: 'layout-presets',
  version: '1.0.0'
});

interface UseLayoutPresetsReturn {
  currentPreset: LayoutPreset;
  currentPresetId: PresetId;
  allPresets: LayoutPreset[];
  switchToPreset: (presetId: PresetId) => boolean;
  switchToPresetByShortcut: (shortcut: string) => boolean;
  isPresetActive: (presetId: PresetId) => boolean;
  presetSwitchHistory: PresetId[];
}

/**
 * Focus guard utilities
 * Prevents keyboard shortcuts from firing when user is typing in form fields
 */
const isFocusGuarded = (): boolean => {
  const activeElement = document.activeElement;
  
  if (!activeElement) return false;
  
  // Guard against input fields, textareas, and contenteditable elements
  const tagName = activeElement.tagName.toLowerCase();
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
  const hasRole = ['textbox', 'searchbox', 'combobox'].includes(
    activeElement.getAttribute('role') || ''
  );
  
  // Also check if element is inside a search widget or form
  const isInSearchWidget = activeElement.closest('[data-widget="search"]') !== null;
  const isInForm = activeElement.closest('form') !== null;
  
  return isInput || isContentEditable || hasRole || isInSearchWidget || isInForm;
};

/**
 * Main layout presets hook
 */
export function useLayoutPresets(
  onPresetChange?: (preset: LayoutPreset) => void
): UseLayoutPresetsReturn {
  // Delegate to shared context
  const ctx = usePreset();
  const { currentPreset, currentPresetId, allPresets } = ctx;

  /**
   * Switch to a specific preset with validation and persistence
   */
  const switchToPreset = useCallback((presetId: PresetId): boolean => {
    const ok = ctx.switchToPreset(presetId);
    if (ok && onPresetChange) onPresetChange(layoutPresets[presetId]);
    return ok;
  }, [ctx, onPresetChange]);

  /**
   * Switch preset by keyboard shortcut with focus guarding
   */
  const switchToPresetByShortcut = useCallback((shortcut: string): boolean => ctx.switchToPresetByShortcut(shortcut), [ctx]);

  /**
   * Check if a preset is currently active
   */
  const isPresetActive = useCallback((presetId: PresetId): boolean => ctx.isPresetActive(presetId), [ctx]);

  /**
   * Set up keyboard event listeners for preset shortcuts (1, 2, 3, 4)
   */
  // Keyboard handling is done in provider; no-op here

  /**
   * Log preset change for debugging
   */
  useEffect(() => {
    // Preset change side-effects could be added here if needed in the future
  }, [currentPreset, currentPresetId]);

  return {
    currentPreset,
    currentPresetId,
    allPresets,
    switchToPreset,
    switchToPresetByShortcut,
    isPresetActive,
    presetSwitchHistory: ctx.presetSwitchHistory,
  };
}

/**
 * Utility hook for preset keyboard shortcuts only (lighter weight)
 */
export function useLayoutPresetShortcuts(
  onPresetSwitch: (preset: LayoutPreset) => void
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '1' && event.key <= '4') {
        // Only prevent default and handle shortcut if focus is not guarded
        if (!isFocusGuarded()) {
          event.preventDefault();
          
          const preset = getLayoutPresetByShortcut(event.key);
          if (preset) {
            onPresetSwitch(preset);
          }
        }
        // If focus is guarded (user is typing), don't preventDefault
        // This allows the character to be typed normally in input fields
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPresetSwitch]);
}

/**
 * Debug utilities for development
 */
export const debugLayoutPresets = {
  /**
   * Log all available presets
   */
  logAllPresets: () => {
    console.group('🎯 Layout Presets Debug');
    Object.entries(layoutPresets).forEach(([id, preset]) => {
      console.log(`${preset.shortcut}: ${preset.name} - ${preset.description}`);
    });
    console.groupEnd();
  },
  
  /**
   * Test focus guarding
   */
  testFocusGuard: () => {
    console.log('🎯 Focus guarded:', isFocusGuarded());
    console.log('🎯 Active element:', document.activeElement);
  },
  
  /**
   * Simulate preset switch
   */
  simulateShortcut: (shortcut: string) => {
    const event = new KeyboardEvent('keydown', { key: shortcut });
    document.dispatchEvent(event);
  }
};