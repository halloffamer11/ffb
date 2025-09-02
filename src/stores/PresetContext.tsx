import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { layoutPresets, getLayoutPresetByShortcut, getDefaultPreset, type PresetId, type LayoutPreset } from '../utils/layoutPresets';
import { createStorageAdapter } from '../adapters/storage.js';

interface PresetContextValue {
  currentPreset: LayoutPreset;
  currentPresetId: PresetId;
  allPresets: LayoutPreset[];
  switchToPreset: (presetId: PresetId) => boolean;
  switchToPresetByShortcut: (shortcut: string) => boolean;
  isPresetActive: (presetId: PresetId) => boolean;
  presetSwitchHistory: PresetId[];
  registerNavigationToggle: (callback: () => void) => void;
  // Layout controls
  registerLayoutControls: (controls: {
    editMode: boolean;
    onSaveLayout: () => void;
    onResetLayout: () => void;
    onToggleEditMode: () => void;
  }) => void;
  getLayoutControls: () => {
    editMode: boolean;
    onSaveLayout?: () => void;
    onResetLayout?: () => void;
    onToggleEditMode?: () => void;
  } | null;
}

const presetStorage = createStorageAdapter({
  namespace: 'layout-presets',
  version: '1.0.0'
});

const PresetContext = createContext<PresetContextValue | null>(null);

function isFocusGuarded(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  const tagName = activeElement.tagName.toLowerCase();
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
  const hasRole = ['textbox', 'searchbox', 'combobox'].includes(activeElement.getAttribute('role') || '');
  const isInSearchWidget = activeElement.closest('[data-widget="search"]') !== null;
  const isInForm = activeElement.closest('form') !== null;
  return isInput || isContentEditable || hasRole || isInSearchWidget || isInForm;
}

export function PresetProvider({ children }: { children: React.ReactNode }) {
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
  const keyboardListenerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const navigationToggleRef = useRef<(() => void) | null>(null);
  
  // Layout controls state
  const layoutControlsRef = useRef<{
    editMode: boolean;
    onSaveLayout: () => void;
    onResetLayout: () => void;
    onToggleEditMode: () => void;
  } | null>(null);

  const currentPreset = layoutPresets[currentPresetId];
  const allPresets = Object.values(layoutPresets);

  const switchToPreset = useCallback((presetId: PresetId): boolean => {
    if (!(presetId in layoutPresets)) return false;
    if (presetId === currentPresetId) return true;
    setCurrentPresetId(presetId);
    setPresetSwitchHistory(prev => {
      const next = [presetId, ...prev.filter(id => id !== presetId)];
      return next.slice(0, 10);
    });
    if (presetStorage.isAvailable()) {
      presetStorage.set('currentPreset', presetId);
    }
    return true;
  }, [currentPresetId]);

  const switchToPresetByShortcut = useCallback((shortcut: string): boolean => {
    if (isFocusGuarded()) return false;
    const preset = getLayoutPresetByShortcut(shortcut);
    if (!preset) return false;
    return switchToPreset(preset.id);
  }, [switchToPreset]);

  const isPresetActive = useCallback((presetId: PresetId): boolean => presetId === currentPresetId, [currentPresetId]);

  const registerNavigationToggle = useCallback((callback: () => void) => {
    navigationToggleRef.current = callback;
  }, []);

  const registerLayoutControls = useCallback((controls: {
    editMode: boolean;
    onSaveLayout: () => void;
    onResetLayout: () => void;
    onToggleEditMode: () => void;
  }) => {
    layoutControlsRef.current = controls;
  }, []);

  const getLayoutControls = useCallback(() => {
    return layoutControlsRef.current;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusGuarded()) {
        if (event.key >= '1' && event.key <= '4') {
          event.preventDefault();
          switchToPresetByShortcut(event.key);
        } else if (event.key === 'n') {
          event.preventDefault();
          if (navigationToggleRef.current) {
            navigationToggleRef.current();
          }
        } else if (event.key === 'e') {
          event.preventDefault();
          if (layoutControlsRef.current && layoutControlsRef.current.onToggleEditMode) {
            layoutControlsRef.current.onToggleEditMode();
          }
        }
      }
    };
    keyboardListenerRef.current = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      if (keyboardListenerRef.current) {
        document.removeEventListener('keydown', keyboardListenerRef.current);
        keyboardListenerRef.current = null;
      }
    };
  }, [switchToPresetByShortcut]);

  const value: PresetContextValue = {
    currentPreset,
    currentPresetId,
    allPresets,
    switchToPreset,
    switchToPresetByShortcut,
    isPresetActive,
    presetSwitchHistory,
    registerNavigationToggle,
    registerLayoutControls,
    getLayoutControls
  };

  return (
    <PresetContext.Provider value={value}>
      {children}
    </PresetContext.Provider>
  );
}

export function usePreset(): PresetContextValue {
  const ctx = useContext(PresetContext);
  if (!ctx) {
    throw new Error('usePreset must be used within a PresetProvider');
  }
  return ctx;
}


