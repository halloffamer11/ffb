/**
 * Layout Presets Hook - Professional dashboard preset management
 * 
 * Provides state management and keyboard shortcuts for switching between
 * workflow-optimized layout presets with proper focus guarding.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  layoutPresets, 
  getLayoutPreset, 
  getLayoutPresetByShortcut, 
  getDefaultPreset,
  type PresetId, 
  type LayoutPreset 
} from '../utils/layoutPresets';
import { createStorageAdapter } from '../adapters/storage.js';

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
  // Load initial preset from storage or default
  const [currentPresetId, setCurrentPresetId] = useState<PresetId>(() => {
    if (presetStorage.isAvailable()) {
      const saved = presetStorage.get('currentPreset');
      if (saved && typeof saved === 'string' && saved in layoutPresets) {
        return saved as PresetId;
      }
    }
    return getDefaultPreset().id;
  });
  
  const [presetSwitchHistory, setPresetSwitchHistory] = useState<PresetId[]>([currentPresetId]);
  
  // Track keyboard event listeners to prevent memory leaks
  const keyboardListenerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  
  const currentPreset = layoutPresets[currentPresetId];
  const allPresets = Object.values(layoutPresets);

  /**
   * Switch to a specific preset with validation and persistence
   */
  const switchToPreset = useCallback((presetId: PresetId): boolean => {
    if (!(presetId in layoutPresets)) {
      console.warn(`Invalid preset ID: ${presetId}`);
      return false;
    }
    
    if (presetId === currentPresetId) {
      return true; // Already active
    }
    
    const preset = layoutPresets[presetId];
    
    console.log(`🎯 Switching to preset: ${preset.name} (${presetId})`);
    
    // Update state
    setCurrentPresetId(presetId);
    
    // Update history (keep last 10 switches)
    setPresetSwitchHistory(prev => {
      const newHistory = [presetId, ...prev.filter(id => id !== presetId)].slice(0, 10);
      return newHistory;
    });
    
    // Persist to storage
    if (presetStorage.isAvailable()) {
      const saveResult = presetStorage.set('currentPreset', presetId);
      if (!saveResult.ok) {
        console.warn('Failed to save preset preference:', saveResult.error);
      }
    }
    
    // Notify parent component
    if (onPresetChange) {
      onPresetChange(preset);
    }
    
    return true;
  }, [currentPresetId, onPresetChange]);

  /**
   * Switch preset by keyboard shortcut with focus guarding
   */
  const switchToPresetByShortcut = useCallback((shortcut: string): boolean => {
    // Focus guard: Don't activate shortcuts when user is typing
    if (isFocusGuarded()) {
      return false;
    }
    
    const preset = getLayoutPresetByShortcut(shortcut);
    if (!preset) {
      return false;
    }
    
    return switchToPreset(preset.id);
  }, [switchToPreset]);

  /**
   * Check if a preset is currently active
   */
  const isPresetActive = useCallback((presetId: PresetId): boolean => {
    return presetId === currentPresetId;
  }, [currentPresetId]);

  /**
   * Set up keyboard event listeners for preset shortcuts (1, 2, 3)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle number keys 1, 2, 3
      if (event.key >= '1' && event.key <= '3') {
        // Only prevent default if we're actually going to handle the shortcut
        // This allows character input in search fields while preventing shortcuts
        if (!isFocusGuarded()) {
          event.preventDefault();
          
          const switched = switchToPresetByShortcut(event.key);
          if (switched) {
            console.log(`🎯 Preset switched via keyboard shortcut: ${event.key}`);
          }
        }
        // If focus is guarded (user is typing), don't preventDefault
        // This allows the character to be typed normally in input fields
      }
    };
    
    // Store reference for cleanup
    keyboardListenerRef.current = handleKeyDown;
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      if (keyboardListenerRef.current) {
        document.removeEventListener('keydown', keyboardListenerRef.current);
        keyboardListenerRef.current = null;
      }
    };
  }, [switchToPresetByShortcut]);

  /**
   * Log preset change for debugging
   */
  useEffect(() => {
    console.log(`🎯 Current preset: ${currentPreset.name} (${currentPresetId})`);
    console.log(`🎯 Preset workflow: ${currentPreset.workflow}`);
  }, [currentPreset, currentPresetId]);

  return {
    currentPreset,
    currentPresetId,
    allPresets,
    switchToPreset,
    switchToPresetByShortcut,
    isPresetActive,
    presetSwitchHistory,
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
      if (event.key >= '1' && event.key <= '3') {
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