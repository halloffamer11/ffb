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
  | 'draft-ledger';

// Grid configuration constants
const GRID_ROW_HEIGHT = 30; // pixels per grid unit (increased from 12px)
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

// Breakpoint multipliers for responsive sizing
const BREAKPOINT_MULTIPLIERS: Record<BreakpointKey, number> = {
  lg: 1.0,
  md: 0.85,
  sm: 0.7
};

// Maximum columns per breakpoint
const MAX_COLUMNS: Record<BreakpointKey, number> = {
  lg: 24,
  md: 20,
  sm: 16
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
      // PlayerSearch: Search input + filters + table (8-10 rows typically)
      const searchHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.searchInputHeight +
        CONTENT_CONSTANTS.filterRowHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        (customRequirements?.tableRows || 8) * CONTENT_CONSTANTS.tableRowHeight +
        CONTENT_CONSTANTS.widgetPadding +
        CONTENT_CONSTANTS.scrollbarWidth;
      
      baseWidth = Math.floor(14 * multiplier);
      baseHeight = pixelsToGridUnits(searchHeight);
      minW = Math.floor(8 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(300); // Minimum useful height
      break;
      
    case 'vbd-scatter':
      // VBDScatter: Chart with axes, legend, and controls
      const chartHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.formFieldHeight + // Controls
        (customRequirements?.chartHeight || 320) +
        CONTENT_CONSTANTS.chartAxisHeight +
        CONTENT_CONSTANTS.chartLegendHeight +
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(16 * multiplier);
      baseHeight = pixelsToGridUnits(chartHeight);
      minW = Math.floor(12 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(280);
      break;
      
    case 'budget':
      // BudgetTracker: Statistics cards + chart
      const budgetHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        (customRequirements?.statisticCards || 4) * CONTENT_CONSTANTS.statisticCardHeight +
        200 + // Chart space
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(10 * multiplier);
      baseHeight = pixelsToGridUnits(budgetHeight);
      minW = Math.floor(8 * multiplier);
      maxW = Math.floor(16 * multiplier);
      minH = pixelsToGridUnits(240);
      break;
      
    case 'draft-entry':
      // DraftEntry: Form fields + controls + recent picks
      const draftEntryHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        (customRequirements?.formFields || 4) * CONTENT_CONSTANTS.formFieldHeight +
        CONTENT_CONSTANTS.buttonHeight +
        3 * CONTENT_CONSTANTS.tableRowHeight + // Recent picks preview
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(12 * multiplier);
      baseHeight = pixelsToGridUnits(draftEntryHeight);
      minW = Math.floor(8 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(200);
      break;
      
    case 'roster':
      // RosterPanel: All position slots (typically 15-16 positions)
      const rosterHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        16 * CONTENT_CONSTANTS.tableRowHeight + // All positions
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(10 * multiplier);
      baseHeight = pixelsToGridUnits(rosterHeight);
      minW = Math.floor(8 * multiplier);
      maxW = Math.floor(14 * multiplier);
      minH = pixelsToGridUnits(300);
      break;
      
    case 'draft-ledger':
      // DraftLedger: Recent draft picks table
      const ledgerHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        CONTENT_CONSTANTS.tableHeaderHeight +
        (customRequirements?.tableRows || 10) * CONTENT_CONSTANTS.tableRowHeight +
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(14 * multiplier);
      baseHeight = pixelsToGridUnits(ledgerHeight);
      minW = Math.floor(10 * multiplier);
      maxW = maxCols;
      minH = pixelsToGridUnits(200);
      break;
      
    case 'player-analysis':
      // PlayerAnalysis: Stats display and info
      const analysisHeight = 
        CONTENT_CONSTANTS.widgetHeaderHeight +
        6 * CONTENT_CONSTANTS.statisticCardHeight + // Various stats
        CONTENT_CONSTANTS.widgetPadding;
      
      baseWidth = Math.floor(10 * multiplier);
      baseHeight = pixelsToGridUnits(analysisHeight);
      minW = Math.floor(8 * multiplier);
      maxW = Math.floor(14 * multiplier);
      minH = pixelsToGridUnits(240);
      break;
      
    default:
      // Fallback for unknown widget types
      baseWidth = Math.floor(12 * multiplier);
      baseHeight = pixelsToGridUnits(300);
      minW = Math.floor(6 * multiplier);
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
    'budget', 'roster', 'draft-ledger'
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