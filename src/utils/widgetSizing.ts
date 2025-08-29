/**
 * Widget Size Calculator - Determines optimal dimensions based on content type
 * 
 * This module calculates optimal widget dimensions based on:
 * - Content type and typical data volume
 * - Grid unit conversion (30px per unit)
 * - Breakpoint-specific adjustments
 * - Content-aware sizing for better UX
 */

export interface WidgetDimensions {
  width: number;  // Grid units
  height: number; // Grid units
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface ContentSizeRequirements {
  tableRows?: number;
  chartWidth?: number;
  chartHeight?: number;
  formFields?: number;
  statisticCards?: number;
  padding?: number; // Additional padding in pixels
}

export type BreakpointKey = 'lg' | 'md' | 'sm';
export type WidgetType = 
  | 'search'
  | 'draft-entry'
  | 'player-analysis'
  | 'vbd-scatter'
  | 'budget'
  | 'roster'
  | 'draft-ledger'
  | 'team-roster-overview';

// Grid configuration constants
const GRID_ROW_HEIGHT = 50; // pixels per grid unit (increased for better drag targets)
const GRID_MARGIN = 8; // margin between grid items

// Content sizing constants (in pixels)
const CONTENT_CONSTANTS = {
  tableRowHeight: 32,
  tableHeaderHeight: 40,
  searchInputHeight: 44,
  filterRowHeight: 32,
  chartAxisHeight: 40,
  chartLegendHeight: 30,
  formFieldHeight: 44,
  statisticCardHeight: 80,
  buttonHeight: 36,
  widgetHeaderHeight: 48,
  widgetPadding: 24, // 12px * 2
  scrollbarWidth: 12
};

// Breakpoint multipliers for responsive sizing (adjusted for 24/20/16 column grids)
const BREAKPOINT_MULTIPLIERS: Record<BreakpointKey, number> = {
  lg: 2.0,  // 24 columns vs 12 baseline
  md: 1.67, // 20 columns vs 12 baseline  
  sm: 1.33  // 16 columns vs 12 baseline
};

// Maximum columns per breakpoint (must match WidgetGrid cols configuration)
const MAX_COLUMNS: Record<BreakpointKey, number> = {
  lg: 24, // Updated to match WidgetGrid configuration
  md: 20, // Updated to match WidgetGrid configuration  
  sm: 16  // Updated to match WidgetGrid configuration
};

/**
 * Convert pixels to grid units based on row height
 */
function pixelsToGridUnits(pixels: number): number {
  return Math.ceil(pixels / GRID_ROW_HEIGHT);
}

/**
 * Calculate widget dimensions based on content requirements
 */
function calculateContentSize(
  widgetType: WidgetType,
  breakpoint: BreakpointKey,
  customRequirements?: ContentSizeRequirements
): WidgetDimensions {
  
  const multiplier = BREAKPOINT_MULTIPLIERS[breakpoint];
  const maxCols = MAX_COLUMNS[breakpoint];
  
  let baseWidth: number;
  let baseHeight: number;
  let minW: number;
  let maxW: number;
  let minH: number;
  
  switch (widgetType) {
    case 'search':
      // PlayerSearch: Compact table view with 6 visible rows by default
      // Table columns (480px total) fit comfortably in 6 columns on 12-col grid
      const searchHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.searchInputHeight +
        CONTENT_CONSTANTS.filterRowHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        (customRequirements?.tableRows || 6) * CONTENT_CONSTANTS.tableRowHeight +
        CONTENT_CONSTANTS.widgetPadding +
        CONTENT_CONSTANTS.scrollbarWidth;
      
      baseWidth = Math.floor(6 * multiplier); // Compact: 8 → 6 columns
      baseHeight = pixelsToGridUnits(searchHeight);
      minW = Math.floor(4 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(280); // Reduced from 300
      break;
      
    case 'vbd-scatter':
      // VBDScatter: Compact scatter plot with controls
      // 6 columns provides adequate space for readable chart
      const chartHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.formFieldHeight + // Controls
        (customRequirements?.chartHeight || 280) + // Reduced from 320
        CONTENT_CONSTANTS.chartAxisHeight +
        CONTENT_CONSTANTS.chartLegendHeight +
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(6 * multiplier); // Compact: 8 → 6 columns
      baseHeight = pixelsToGridUnits(chartHeight);
      minW = Math.floor(5 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(260); // Reduced from 280
      break;
      
    case 'budget':
      // BudgetTracker: Compact stat cards + chart
      // Stat cards can be smaller, charts still readable at 4 columns
      const budgetHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        (customRequirements?.statisticCards || 4) * CONTENT_CONSTANTS.statisticCardHeight +
        180 + // Reduced chart space from 200
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(4 * multiplier); // Compact: 5 → 4 columns
      baseHeight = pixelsToGridUnits(budgetHeight);
      minW = Math.floor(3 * multiplier);
      maxW = Math.floor(7 * multiplier);
      minH = pixelsToGridUnits(220); // Reduced from 240
      break;
      
    case 'draft-entry':
      // DraftEntry: Ultra-compact form with stacked inputs
      // Team selector, price, quick entry can fit in 4 columns
      const draftEntryHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        (customRequirements?.formFields || 4) * CONTENT_CONSTANTS.formFieldHeight +
        CONTENT_CONSTANTS.buttonHeight +
        3 * CONTENT_CONSTANTS.tableRowHeight + // Recent picks preview
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(4 * multiplier); // Compact: 5 → 4 columns
      baseHeight = pixelsToGridUnits(draftEntryHeight);
      minW = Math.floor(3 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(200);
      break;
      
    case 'roster':
      // RosterPanel: Adaptive layout for 6 positions (QB, RB, WR, TE, K, DST)
      // 6 cols = 3×2 grid (default), 12 cols = 6×1, 4 cols = 2×3, 2 cols = 1×6
      const rosterHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        12 * CONTENT_CONSTANTS.tableRowHeight + // Reduced from 16
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(6 * multiplier); // Compact: 12 → 6 columns (3×2 grid)
      baseHeight = pixelsToGridUnits(rosterHeight);
      minW = Math.floor(4 * multiplier); // Can go down to 2×3
      maxW = maxCols; // Can expand to 6×1
      minH = pixelsToGridUnits(280); // Reduced from 300
      break;
      
    case 'draft-ledger':
      // DraftLedger: Compact picks table with tighter columns
      const ledgerHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        (customRequirements?.tableRows || 8) * CONTENT_CONSTANTS.tableRowHeight + // Reduced from 10
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(5 * multiplier); // Compact: 7 → 5 columns
      baseHeight = pixelsToGridUnits(ledgerHeight);
      minW = Math.floor(4 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(180); // Reduced from 200
      break;
      
    case 'player-analysis':
      // PlayerAnalysis: Compact 2×2 metrics grid
      // 4 columns provides adequate space for metric cards
      const analysisHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        5 * CONTENT_CONSTANTS.statisticCardHeight + // Reduced from 6
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(4 * multiplier); // Compact: 5 → 4 columns
      baseHeight = pixelsToGridUnits(analysisHeight);
      minW = Math.floor(3 * multiplier);
      maxW = Math.floor(6 * multiplier);
      minH = pixelsToGridUnits(220); // Reduced from 240
      break;
      
    case 'team-roster-overview':
      // Team Roster Overview: Full-width horizontal widget showing all teams
      // Widget spans full width but can be moved and height-resized
      const overviewHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        200 + // Base height for team columns (compact view)
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = maxCols; // Always full width
      baseHeight = pixelsToGridUnits(overviewHeight);
      minW = maxCols; // Cannot be made narrower than full width
      maxW = maxCols; // Cannot be made wider than full width
      minH = pixelsToGridUnits(160); // Minimum compact height
      
      // Debug logging
      console.log(`🔧 Team Overview Widget Sizing [${breakpoint}]:`, {
        maxCols,
        baseWidth,
        baseHeight,
        minW,
        maxW,
        minH
      });
      break;
      
    default:
      // Fallback for unknown widget types
      baseWidth = Math.floor(6 * multiplier);
      baseHeight = pixelsToGridUnits(300);
      minW = Math.floor(3 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(200);
  }
  
  // Ensure dimensions are within reasonable bounds
  baseWidth = Math.max(minW, Math.min(baseWidth, maxW));
  baseHeight = Math.max(minH, baseHeight);
  
  return {
    width: baseWidth,
    height: baseHeight,
    minWidth: minW,
    maxWidth: maxW,
    minHeight: minH
  };
}

/**
 * Calculate optimal dimensions for a widget across all breakpoints
 */
export function calculateWidgetDimensions(
  widgetType: WidgetType,
  customRequirements?: ContentSizeRequirements
): Record<BreakpointKey, WidgetDimensions> {
  
  return {
    lg: calculateContentSize(widgetType, 'lg', customRequirements),
    md: calculateContentSize(widgetType, 'md', customRequirements),
    sm: calculateContentSize(widgetType, 'sm', customRequirements)
  };
}

/**
 * Get content-aware sizing recommendations for all widget types
 */
export function getOptimalWidgetSizes(): Record<WidgetType, Record<BreakpointKey, WidgetDimensions>> {
  const widgetTypes: WidgetType[] = [
    'search', 'draft-entry', 'player-analysis', 'vbd-scatter', 
    'budget', 'roster', 'draft-ledger', 'team-roster-overview'
  ];
  
  const result = {} as Record<WidgetType, Record<BreakpointKey, WidgetDimensions>>;
  
  widgetTypes.forEach(widgetType => {
    result[widgetType] = calculateWidgetDimensions(widgetType);
  });
  
  return result;
}

/**
 * Convert widget dimensions to grid layout format
 */
export function dimensionsToGridItem(
  widgetId: string,
  dimensions: WidgetDimensions,
  position: { x: number; y: number }
) {
  return {
    i: widgetId,
    x: position.x,
    y: position.y,
    w: dimensions.width,
    h: dimensions.height,
    minW: dimensions.minWidth,
    maxW: dimensions.maxWidth,
    minH: dimensions.minHeight
    // Removed static property - team-roster-overview can now be moved and height-resized
  };
}

/**
 * Utility to get current grid row height (for external calculations)
 */
export function getGridRowHeight(): number {
  return GRID_ROW_HEIGHT;
}

/**
 * Debug helper to log widget sizing calculations
 */
export function debugWidgetSizing(widgetType: WidgetType) {
  const sizes = calculateWidgetDimensions(widgetType);
  
  console.group(`Widget Sizing Debug: ${widgetType}`);
  Object.entries(sizes).forEach(([breakpoint, dims]) => {
    const pixelWidth = dims.width * GRID_ROW_HEIGHT;
    const pixelHeight = dims.height * GRID_ROW_HEIGHT;
    console.log(`${breakpoint}: ${dims.width}x${dims.height} units (${pixelWidth}x${pixelHeight}px)`);
  });
  console.groupEnd();
}