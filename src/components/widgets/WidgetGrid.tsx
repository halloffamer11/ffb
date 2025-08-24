import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import styled from 'styled-components';
import WidgetContainer from './WidgetContainer';
import VBDScatterWidget from './VBDScatterWidget';
import PlayerSearchWidget from './PlayerSearchWidget';
import BudgetTrackerWidget from './BudgetTrackerWidget';
import DraftEntryWidget from './DraftEntryWidget';
import RosterPanelWidget from './RosterPanelWidget';
import PlayerAnalysisWidget from './PlayerAnalysisWidget';
import DraftLedgerWidget from './DraftLedgerWidget';
import WidgetPopOutModal from './WidgetPopOutModal';
import { createStorageAdapter } from '../../adapters/storage.js';
import { getOptimalWidgetSizes, dimensionsToGridItem, getGridRowHeight, type WidgetType } from '../../utils/widgetSizing';
import { useLayoutPresets } from '../../hooks/useLayoutPresets';
import { type LayoutPreset } from '../../utils/layoutPresets';

// React Grid Layout CSS will be handled via CDN or inline styles

// Type definitions for grid layout
interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

interface GridLayouts {
  lg: GridItem[];
  md: GridItem[];
  sm: GridItem[];
  xs?: GridItem[];
  xxs?: GridItem[];
}

type BreakpointLayouts = Partial<GridLayouts>;
type BreakpointKey = keyof GridLayouts;

const ResponsiveGridLayout = WidthProvider(Responsive);

const GridWrapper = styled.div<{ $dynamicHeight: number; $editMode: boolean }>`
  height: ${props => props.$editMode ? 'auto' : `${props.$dynamicHeight}px`};
  min-height: ${props => props.$editMode ? '1200px' : `${props.$dynamicHeight}px`};
  
  .react-grid-layout {
    position: relative;
    min-height: ${props => props.$editMode ? '1200px' : 'auto'};
  }
  
  .react-grid-item {
    border-radius: 8px;
    transition: transform 0.2s ease;
  }
  
  .react-grid-item:hover {
    transform: scale(1.002);
  }
  
  .react-grid-item.react-grid-placeholder {
    background-color: var(--accent);
    opacity: 0.2;
    transition: all 0.15s ease;
    z-index: 2;
    user-select: none;
    border-radius: 8px;
  }
  
  .react-resizable-handle {
    background-image: none;
    background-color: var(--accent);
    border-radius: 50%;
    width: 12px;
    height: 12px;
    right: 6px;
    bottom: 6px;
  }
  
  .react-resizable-handle::after {
    border-right: none;
    border-bottom: none;
  }
`;

const WidgetAddMenu = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface-1);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  box-shadow: none;
  
  h4 {
    margin: 0;
    color: var(--text-1);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '+';
      display: inline-block;
      width: 20px;
      height: 20px;
      background: var(--accent);
      color: var(--bg);
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
      font-weight: bold;
    }
  }
  
  .menu-divider {
    width: 1px;
    height: 24px;
    background: var(--border-1);
    margin: 0 4px;
  }
`;

const AddWidgetButton = styled.button`
  padding: 8px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  
  &::before {
    content: '+';
    font-size: 14px;
    font-weight: bold;
  }
  
  &:hover {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 210, 211, 0.2);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 210, 211, 0.2);
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

// Generate content-aware default layouts using widget sizing system
const generateDefaultLayouts = (): GridLayouts => {
  const optimalSizes = getOptimalWidgetSizes();
  
  // Widget positioning strategy: Top row, then fill down and across
  const widgetPositions = {
    lg: [
      { id: 'search', x: 0, y: 0 },
      { id: 'draft-entry', x: 14, y: 0 },
      { id: 'player-analysis', x: 0, y: 12 },
      { id: 'vbd-scatter', x: 10, y: 12 },
      { id: 'budget', x: 0, y: 26 },
      { id: 'roster', x: 10, y: 26 },
      { id: 'draft-ledger', x: 0, y: 38 }
    ],
    md: [
      { id: 'search', x: 0, y: 0 },
      { id: 'draft-entry', x: 12, y: 0 },
      { id: 'player-analysis', x: 0, y: 12 },
      { id: 'vbd-scatter', x: 9, y: 12 },
      { id: 'budget', x: 0, y: 26 },
      { id: 'roster', x: 9, y: 26 },
      { id: 'draft-ledger', x: 0, y: 38 }
    ],
    sm: [
      { id: 'search', x: 0, y: 0 },
      { id: 'draft-entry', x: 0, y: 12 },
      { id: 'player-analysis', x: 0, y: 22 },
      { id: 'vbd-scatter', x: 0, y: 32 },
      { id: 'budget', x: 0, y: 46 },
      { id: 'roster', x: 0, y: 54 },
      { id: 'draft-ledger', x: 0, y: 66 }
    ]
  };
  
  const layouts: GridLayouts = { lg: [], md: [], sm: [] };
  
  (['lg', 'md', 'sm'] as const).forEach(breakpoint => {
    layouts[breakpoint] = widgetPositions[breakpoint].map(({ id, x, y }) => {
      const widgetType = id as WidgetType;
      const dimensions = optimalSizes[widgetType][breakpoint];
      return dimensionsToGridItem(id, dimensions, { x, y });
    });
  });
  
  return layouts;
};

// Generate default layouts with content-aware sizing
const defaultLayouts: GridLayouts = generateDefaultLayouts();

const breakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

const cols = {
  lg: 24,
  md: 20,
  sm: 16,
  xs: 12,
  xxs: 6
};

// Create storage adapter for widget layouts
const layoutStorage = createStorageAdapter({
  namespace: 'widget-layouts',
  version: '1.0.0'
});

// All available widgets
const ALL_WIDGETS: WidgetType[] = [
  'search',
  'draft-entry', 
  'player-analysis',
  'vbd-scatter',
  'budget',
  'roster',
  'draft-ledger'
];

// Memoized WidgetGrid component for optimal performance
const WidgetGrid = React.memo(() => {
  const [layouts, setLayouts] = useState<GridLayouts>(defaultLayouts);
  const [editMode, setEditMode] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set(ALL_WIDGETS));
  const [gridHeight, setGridHeight] = useState<number>(800); // Default height
  const [poppedOutWidget, setPoppedOutWidget] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Layout presets integration
  const {
    currentPreset,
    currentPresetId,
    allPresets,
    switchToPreset,
    isPresetActive
  } = useLayoutPresets();

  // Apply preset layouts when preset changes
  useEffect(() => {
    console.log(`🎯 Applying preset layout: ${currentPreset.name}`);
    const presetLayouts: GridLayouts = {
      lg: currentPreset.layouts.lg,
      md: currentPreset.layouts.md,
      sm: currentPreset.layouts.sm
    };
    setLayouts(presetLayouts);
    
    // Clear custom layout flag when switching to preset to prevent override
    if (layoutStorage.isAvailable()) {
      layoutStorage.remove('customLayoutActive');
    }
  }, [currentPreset, currentPresetId]);

  // Filter layouts to only include visible widgets
  const filteredLayouts = useMemo(() => {
    const filtered: GridLayouts = {
      lg: layouts.lg.filter(item => visibleWidgets.has(item.i)),
      md: layouts.md.filter(item => visibleWidgets.has(item.i)),
      sm: layouts.sm.filter(item => visibleWidgets.has(item.i))
    };
    console.log(`🔧 WidgetGrid: Visible widgets:`, Array.from(visibleWidgets));
    console.log(`🔧 WidgetGrid: Filtered layouts:`, filtered);
    return filtered;
  }, [layouts, visibleWidgets]);
  
  // Load saved custom layouts and visible widgets only if not using a preset
  useEffect(() => {
    console.log('🔧 WidgetGrid: Loading saved layouts...');
    if (layoutStorage.isAvailable()) {
      const savedLayouts = layoutStorage.get('layouts');
      const savedPreset = layoutStorage.get('customLayoutActive');
      const savedVisibleWidgets = layoutStorage.get('visibleWidgets');
      
      // Load visible widgets if saved
      if (savedVisibleWidgets && Array.isArray(savedVisibleWidgets)) {
        console.log('🔧 WidgetGrid: Restoring visible widgets from storage:', savedVisibleWidgets);
        setVisibleWidgets(new Set(savedVisibleWidgets));
      }
      
      // Only load saved layouts if user was using custom layout
      if (savedPreset === true && savedLayouts && typeof savedLayouts === 'object') {
        console.log('🔧 WidgetGrid: Restoring custom layout from storage');
        
        const mergedLayouts: GridLayouts = { ...defaultLayouts };
        (Object.keys(defaultLayouts) as Array<keyof GridLayouts>).forEach(breakpoint => {
          const defaultLayout = defaultLayouts[breakpoint];
          const savedLayout = savedLayouts[breakpoint] || [];
          
          if (defaultLayout) {
            const savedItemsMap = savedLayout.reduce((acc: Record<string, GridItem>, item: GridItem) => {
              acc[item.i] = item;
              return acc;
            }, {});
            
            mergedLayouts[breakpoint] = defaultLayout.map((defaultItem: GridItem) => {
              const savedItem = savedItemsMap[defaultItem.i];
              if (savedItem) {
                return {
                  ...defaultItem,
                  x: savedItem.x,
                  y: savedItem.y,
                  w: savedItem.w,
                  h: savedItem.h
                };
              }
              return defaultItem;
            });
          }
        });
        console.log('🔧 WidgetGrid: Merged custom layouts:', mergedLayouts);
        setLayouts(mergedLayouts);
      } else {
        console.log('🔧 WidgetGrid: Using preset layouts, ignoring saved custom layout');
      }
    } else {
      console.warn('🔧 WidgetGrid: Storage not available');
    }
  }, []); // Only run once on mount
  
  // Save visible widgets to localStorage when they change
  useEffect(() => {
    if (layoutStorage.isAvailable()) {
      const visibleArray = Array.from(visibleWidgets);
      const saveResult = layoutStorage.set('visibleWidgets', visibleArray);
      if (!saveResult.ok) {
        console.warn('🔧 WidgetGrid: Failed to save visible widgets:', saveResult.error);
      } else {
        console.log('🔧 WidgetGrid: Saved visible widgets:', visibleArray);
      }
    }
  }, [visibleWidgets]);

  // Calculate dynamic grid height based on widget positions
  const calculateGridHeight = useCallback((currentLayouts: GridLayouts, breakpoint: BreakpointKey = 'lg') => {
    const layout = currentLayouts[breakpoint];
    if (!layout || layout.length === 0) {
      console.log(`🔧 WidgetGrid: Height calculation - no layout data, using minimum 600px`);
      return 600; // Increased minimum height
    }
    
    // Find the bottom-most widget position
    let maxBottom = 0;
    const visibleItems: string[] = [];
    layout.forEach(item => {
      if (visibleWidgets.has(item.i)) {
        visibleItems.push(item.i);
        const bottom = item.y + item.h;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      }
    });
    
    // Convert grid units to pixels and add generous padding
    const calculatedHeight = (maxBottom + 6) * getGridRowHeight(); // +6 for generous bottom padding
    const finalHeight = Math.max(calculatedHeight, 600); // Ensure minimum height
    
    console.log(`🔧 WidgetGrid: Height calculation - breakpoint: ${breakpoint}, visible items: ${visibleItems.length}, maxBottom: ${maxBottom}, calculated: ${calculatedHeight}px, final: ${finalHeight}px`);
    
    return finalHeight;
  }, [visibleWidgets]);

  // Update grid height when layouts or visible widgets change
  useEffect(() => {
    if (!editMode) {
      const newHeight = calculateGridHeight(filteredLayouts);
      setGridHeight(newHeight);
    } else {
      // In edit mode, allow more space for dragging
      setGridHeight(Math.max(1500, calculateGridHeight(filteredLayouts) + 300));
    }
  }, [filteredLayouts, editMode, calculateGridHeight]);

  // Memoized layout change handler - only save custom layouts when user modifies
  const handleLayoutChange = useCallback((_layout: GridItem[], allLayouts: BreakpointLayouts) => {
    console.log('🔧 WidgetGrid: Layout changed by user interaction');
    
    // Ensure we have all required breakpoints
    const completeLayouts: GridLayouts = {
      lg: allLayouts.lg || defaultLayouts.lg,
      md: allLayouts.md || defaultLayouts.md,
      sm: allLayouts.sm || defaultLayouts.sm
    };
    
    console.log('🔧 WidgetGrid: User-modified layouts to save:', completeLayouts);
    setLayouts(completeLayouts);
    
    // Mark as custom layout and persist to localStorage
    if (layoutStorage.isAvailable()) {
      layoutStorage.set('customLayoutActive', true);
      const saveResult = layoutStorage.set('layouts', completeLayouts);
      console.log('🔧 WidgetGrid: Save result:', saveResult);
      if (!saveResult.ok) {
        console.warn('Failed to save custom widget layout:', saveResult.error);
      } else {
        console.log('✅ WidgetGrid: Custom layouts saved successfully');
      }
    } else {
      console.warn('🔧 WidgetGrid: Storage not available for saving');
    }
  }, []);

  // Memoized reset layout handler - resets to current preset
  const resetLayout = useCallback(() => {
    console.log(`🔧 WidgetGrid: Resetting layout to preset: ${currentPreset.name}`);
    const presetLayouts: GridLayouts = {
      lg: currentPreset.layouts.lg,
      md: currentPreset.layouts.md,
      sm: currentPreset.layouts.sm
    };
    setLayouts(presetLayouts);
    
    if (layoutStorage.isAvailable()) {
      layoutStorage.remove('layouts');
      layoutStorage.remove('customLayoutActive');
      console.log('✅ WidgetGrid: Custom layouts cleared, preset restored');
    }
  }, [currentPreset]);
  

  // Widget visibility management
  const removeWidget = useCallback((widgetId: string) => {
    console.log(`🔧 WidgetGrid: Removing widget ${widgetId}`);
    console.log(`🔧 WidgetGrid: Current visible widgets before removal:`, Array.from(visibleWidgets));
    
    setVisibleWidgets(prev => {
      const newSet = new Set(prev);
      const wasRemoved = newSet.delete(widgetId);
      
      if (!wasRemoved) {
        console.warn(`🔧 WidgetGrid: Widget ${widgetId} was not in visible set`);
        return prev; // Don't update if nothing changed
      }
      
      console.log(`🔧 WidgetGrid: New visible widgets after removal:`, Array.from(newSet));
      
      // Immediately save to storage to prevent restoration
      if (layoutStorage.isAvailable()) {
        const visibleArray = Array.from(newSet);
        const saveResult = layoutStorage.set('visibleWidgets', visibleArray);
        console.log(`🔧 WidgetGrid: Immediately saved visible widgets:`, visibleArray, saveResult);
      }
      
      return newSet;
    });
    
    // Force a layout recalculation by updating the key or triggering a re-render
    setTimeout(() => {
      console.log(`🔧 WidgetGrid: Post-removal check - visible widgets:`, Array.from(visibleWidgets));
    }, 100);
  }, [visibleWidgets]);

  const addWidget = useCallback((widgetId: string) => {
    console.log(`🔧 WidgetGrid: Adding widget ${widgetId}`);
    
    setVisibleWidgets(prev => {
      if (prev.has(widgetId)) {
        console.log(`🔧 WidgetGrid: Widget ${widgetId} is already visible`);
        return prev;
      }
      
      const newSet = new Set([...prev, widgetId]);
      console.log(`🔧 WidgetGrid: New visible widgets after addition:`, Array.from(newSet));
      return newSet;
    });
    
    // If the widget isn't in current layouts, add it with default position
    const hasLayoutPosition = layouts.lg.some(item => item.i === widgetId);
    if (!hasLayoutPosition) {
      console.log(`🔧 WidgetGrid: Adding default position for widget ${widgetId}`);
      const optimalSizes = getOptimalWidgetSizes();
      const widgetType = widgetId as WidgetType;
      
      // Find a good position (bottom of existing visible widgets)
      let maxY = 0;
      const visibleLayoutItems = layouts.lg.filter(item => visibleWidgets.has(item.i));
      visibleLayoutItems.forEach(item => {
        const bottom = item.y + item.h;
        if (bottom > maxY) maxY = bottom;
      });
      
      // Add some spacing
      const yPosition = Math.max(maxY + 2, 0);
      
      // Add to all breakpoints
      const newLayouts: GridLayouts = { ...layouts };
      (['lg', 'md', 'sm'] as const).forEach(breakpoint => {
        const dimensions = optimalSizes[widgetType][breakpoint];
        const newItem = dimensionsToGridItem(widgetId, dimensions, { x: 0, y: yPosition });
        newLayouts[breakpoint] = [...newLayouts[breakpoint], newItem];
      });
      
      console.log(`🔧 WidgetGrid: Added widget ${widgetId} at position y=${yPosition}`);
      setLayouts(newLayouts);
      
      // Save to storage if available
      if (layoutStorage.isAvailable()) {
        layoutStorage.set('customLayoutActive', true);
        layoutStorage.set('layouts', newLayouts);
        console.log(`🔧 WidgetGrid: Saved updated layouts for widget ${widgetId}`);
      }
    }
  }, [layouts, visibleWidgets]);

  // Toggle edit mode with height recalculation
  const toggleEditMode = useCallback(() => {
    const newEditMode = !editMode;
    console.log(`🔧 WidgetGrid: Toggling edit mode from ${editMode} to ${newEditMode}`);
    setEditMode(newEditMode);
    
    // Height will be recalculated by the useEffect when editMode changes
  }, [editMode]);

  // Pop-out handlers
  const handlePopOut = useCallback((widgetId: string) => {
    console.log(`🔧 WidgetGrid: Popping out widget ${widgetId}`);
    console.log(`🔧 WidgetGrid: Current popped out widget:`, poppedOutWidget);
    setPoppedOutWidget(widgetId);
    console.log(`🔧 WidgetGrid: Set popped out widget to:`, widgetId);
    
    // Force a re-render to ensure modal shows
    setTimeout(() => {
      console.log(`🔧 WidgetGrid: After timeout - popped out widget:`, poppedOutWidget);
    }, 100);
  }, [poppedOutWidget]);

  const handleClosePopOut = useCallback(() => {
    console.log('🔧 WidgetGrid: Closing pop-out');
    setPoppedOutWidget(null);
  }, []);

  // Get hidden widgets for add menu
  const hiddenWidgets = useMemo(() => {
    return ALL_WIDGETS.filter(widget => !visibleWidgets.has(widget));
  }, [visibleWidgets]);

  // Get widget title for pop-out modal
  const getWidgetTitle = useCallback((widgetId: string): string => {
    switch (widgetId) {
      case 'search': return 'Player Search';
      case 'draft-entry': return 'Draft Entry';
      case 'player-analysis': return 'Player Analysis';
      case 'vbd-scatter': return 'VBD Scatter Plot';
      case 'budget': return 'Budget Tracker';
      case 'roster': return 'Roster Panel';
      case 'draft-ledger': return 'Draft Ledger';
      default: return 'Unknown Widget';
    }
  }, []);

  // Render widget content without container (for pop-out)
  const renderWidgetContent = useCallback((widgetId: string) => {
    const baseProps = { editMode: false }; // Never edit mode in pop-out
    
    switch (widgetId) {
      case 'search':
        return <PlayerSearchWidget {...baseProps} />;
      case 'draft-entry':
        return <DraftEntryWidget {...baseProps} />;
      case 'player-analysis':
        return <PlayerAnalysisWidget {...baseProps} />;
      case 'vbd-scatter':
        return <VBDScatterWidget {...baseProps} />;
      case 'budget':
        return <BudgetTrackerWidget {...baseProps} />;
      case 'roster':
        return <RosterPanelWidget {...baseProps} />;
      case 'draft-ledger':
        return <DraftLedgerWidget {...baseProps} />;
      default:
        return <div>Widget not found</div>;
    }
  }, []);

  // Memoized widget renderer to prevent unnecessary re-renders
  const renderWidget = useCallback((widgetId: string) => {
    console.log(`🔧 WidgetGrid: Rendering widget ${widgetId}, editMode: ${editMode}, isVisible: ${visibleWidgets.has(widgetId)}`);
    
    // Double-check visibility before rendering
    if (!visibleWidgets.has(widgetId)) {
      console.log(`🔧 WidgetGrid: Widget ${widgetId} is not visible, skipping render`);
      return null;
    }
    
    const baseProps = { 
      editMode, 
      onRemove: editMode ? () => {
        console.log(`🔧 WidgetGrid: onRemove called for ${widgetId}`);
        removeWidget(widgetId);
      } : undefined,
      onPopOut: !editMode ? () => handlePopOut(widgetId) : undefined
    };
    
    switch (widgetId) {
      case 'search':
        return <PlayerSearchWidget {...baseProps} />;
      case 'draft-entry':
        return <DraftEntryWidget {...baseProps} />;
      case 'player-analysis':
        return <PlayerAnalysisWidget {...baseProps} />;
      case 'vbd-scatter':
        return <VBDScatterWidget {...baseProps} />;
      case 'budget':
        return <BudgetTrackerWidget {...baseProps} />;
      case 'roster':
        return <RosterPanelWidget {...baseProps} />;
      case 'draft-ledger':
        return <DraftLedgerWidget {...baseProps} />;
      default:
        return (
          <WidgetContainer title="Unknown Widget" widgetId={widgetId} editMode={editMode} onRemove={editMode ? () => removeWidget(widgetId) : undefined}>
            <div>Widget not found</div>
          </WidgetContainer>
        );
    }
  }, [editMode, removeWidget, handlePopOut]);

  return (
    <div>
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'flex-end', 
        gap: '16px' 
      }}>
        {/* Layout Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            console.log('🔧 Manual save test:', layouts);
            if (layoutStorage.isAvailable()) {
              const saveResult = layoutStorage.set('layouts', layouts);
              console.log('🔧 Manual save result:', saveResult);
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--surface-1)',
            color: 'var(--text-2)',
            border: '1px solid var(--border-1)',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Manual Save
        </button>
        <button
          onClick={resetLayout}
          aria-describedby="reset-help"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--surface-1)',
            color: 'var(--text-2)',
            border: '1px solid var(--border-1)',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Reset Layout
        </button>
        <div id="reset-help" className="sr-only">
          Reset all widgets to default positions and sizes
        </div>
        <button
          onClick={toggleEditMode}
          aria-pressed={editMode}
          aria-describedby="edit-mode-help"
          style={{
            padding: '8px 16px',
            backgroundColor: editMode ? 'var(--accent)' : 'var(--surface-1)',
            color: editMode ? 'var(--bg)' : 'var(--text-1)',
            border: '1px solid var(--border-1)',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {editMode ? 'Exit Edit Mode' : 'Edit Layout'}
        </button>
        <div id="edit-mode-help" className="sr-only">
          {editMode ? 'Exit layout editing mode and lock widget positions' : 'Enable layout editing to move and resize widgets'}
        </div>
        </div>
      </div>
      
      {/* Widget Add Menu - show in edit mode */}
      {console.log(`🔧 WidgetGrid: Edit mode: ${editMode}, Hidden widgets: ${hiddenWidgets.length}, Show menu: ${editMode && hiddenWidgets.length > 0}`)}
      {editMode && (
        <WidgetAddMenu>
          <h4>Edit Mode Active</h4>
          <div className="menu-divider" />
          {hiddenWidgets.length > 0 ? (
            <>
              <span style={{ color: 'var(--text-2)', fontSize: '12px' }}>Add widgets:</span>
              {hiddenWidgets.map(widgetId => {
                const widgetNames = {
                  'search': 'Player Search',
                  'draft-entry': 'Draft Entry',
                  'player-analysis': 'Player Analysis',
                  'vbd-scatter': 'VBD Scatter',
                  'budget': 'Budget Tracker',
                  'roster': 'Roster Panel',
                  'draft-ledger': 'Draft Ledger'
                };
                const displayName = widgetNames[widgetId as keyof typeof widgetNames] || widgetId;
                
                return (
                  <AddWidgetButton
                    key={widgetId}
                    onClick={() => addWidget(widgetId)}
                    title={`Add ${displayName} widget back to layout`}
                    aria-label={`Add ${displayName} widget`}
                  >
                    {displayName}
                  </AddWidgetButton>
                );
              })}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              All widgets are visible. Remove widgets using the × button in widget headers.
            </span>
          )}
        </WidgetAddMenu>
      )}
      
      <GridWrapper $dynamicHeight={gridHeight} $editMode={editMode} ref={gridRef}>
      <ResponsiveGridLayout
        key={`grid-${Array.from(visibleWidgets).sort().join('-')}`} // Force re-render when visible widgets change
        className="layout"
        layouts={filteredLayouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={getGridRowHeight()}
        margin={[8, 8]}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(breakpoint, cols) => {
          console.log('🔧 WidgetGrid: Breakpoint changed to', breakpoint, 'with cols', cols);
        }}
        compactType={editMode ? null : "vertical"}
        preventCollision={false}
        draggableHandle=".widget-drag-handle"
        role="application"
        aria-label="Widget dashboard layout"
        aria-describedby="grid-instructions"
        autoSize={false}
      >
        <div id="grid-instructions" className="sr-only">
          {editMode 
            ? 'Edit mode enabled. Drag widgets by their title bars to reposition, or drag resize handles to resize.'
            : 'Widget dashboard with 7 panels. Enable edit mode to customize layout.'
          }
        </div>
        {Array.from(visibleWidgets).map(widgetId => {
          const widget = renderWidget(widgetId);
          return widget ? <div key={widgetId}>{widget}</div> : null;
        }).filter(Boolean)}
      </ResponsiveGridLayout>
      </GridWrapper>
      
      {/* Pop-out Modal */}
      {poppedOutWidget && (
        <>
          <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>
            Modal should be rendering: {poppedOutWidget}
          </div>
          <WidgetPopOutModal
            title={getWidgetTitle(poppedOutWidget)}
            widgetId={poppedOutWidget}
            isOpen={!!poppedOutWidget}
            onClose={handleClosePopOut}
          >
            {renderWidgetContent(poppedOutWidget)}
          </WidgetPopOutModal>
        </>
      )}
    </div>
  );
});

WidgetGrid.displayName = 'WidgetGrid';

export default WidgetGrid;