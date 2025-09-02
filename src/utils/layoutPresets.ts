/**
 * Professional Dashboard Layout Presets
 * 
 * Three workflow-optimized layouts for different fantasy football draft stages:
 * 1. Pre-draft: Research-focused with prominent analysis tools
 * 2. Nomination: Decision-making with active draft controls
 * 3. Player Analytics: Deep analysis with data visualization focus
 */

import { getOptimalWidgetSizes, dimensionsToGridItem, type WidgetType } from './widgetSizing';

export type PresetId = 'pre-draft' | 'nomination' | 'player-analytics' | 'custom';

export interface LayoutPreset {
  id: PresetId;
  name: string;
  description: string;
  shortcut: string;
  icon: string;
  workflow: string;
  layouts: {
    lg: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      maxW?: number;
      minH?: number;
    }>;
    md: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      maxW?: number;
      minH?: number;
    }>;
    sm: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      maxW?: number;
      minH?: number;
    }>;
  };
}

// Get optimal widget sizes for preset calculations
const optimalSizes = getOptimalWidgetSizes();

/**
 * Pre-draft Layout: Research and Analysis Focus
 * 
 * Primary workflow: Player research, VBD analysis, tier identification
 * Key widgets: PlayerSearch (prominent), VBDScatter (large), PlayerAnalysis
 * Supporting: BudgetTracker, RosterPanel (minimized), DraftEntry (compact)
 * 
 * Visual hierarchy: Analysis tools dominate, draft tools secondary
 */
const preDraftPreset: LayoutPreset = {
  id: 'pre-draft',
  name: 'Pre-Draft Research',
  description: 'Optimized for player research and value-based analysis before draft begins',
  shortcut: '1',
  icon: '🔍',
  workflow: 'Research-focused with prominent analysis tools',
  layouts: {
    lg: [
      // Top row: PlayerSearch (compact) + PlayerAnalysis + DraftEntry + Roster
      { i: 'search', x: 0, y: 0, w: 6, h: 9, minW: 4, maxW: 12, minH: 6 },
      { i: 'player-analysis', x: 6, y: 0, w: 4, h: 6, minW: 3, maxW: 6, minH: 5 },
      { i: 'draft-entry', x: 10, y: 0, w: 6, h: 6, minW: 3, maxW: 12, minH: 4 },
      { i: 'roster', x: 16, y: 0, w: 8, h: 6, minW: 4, maxW: 12, minH: 6 },
      
      // Middle row: VBDScatter (center) + Budget (right)
      { i: 'vbd-scatter', x: 6, y: 6, w: 12, h: 9, minW: 5, maxW: 12, minH: 6 },
      { i: 'budget', x: 18, y: 6, w: 6, h: 9, minW: 3, maxW: 7, minH: 5 },
      
      // Bottom: DraftLedger
      { i: 'draft-ledger', x: 0, y: 9, w: 6, h: 6, minW: 4, maxW: 12, minH: 4 },
      
      // Additional widgets for complete preset coverage
      { i: 'team-roster-overview', x: 0, y: 15, w: 24, h: 6, minW: 24, maxW: 24, minH: 4 },
      { i: 'beer-sheet', x: 0, y: 21, w: 12, h: 10, minW: 8, maxW: 24, minH: 6 },
    ],
    md: [
      // Top row: PlayerSearch + PlayerAnalysis
      { i: 'search', x: 0, y: 0, w: 14, h: 8, minW: 3, maxW: 10, minH: 6 },
      { i: 'player-analysis', x: 14, y: 0, w: 6, h: 10, minW: 2, maxW: 5, minH: 5 },
      
      // Middle: VBDScatter (large) + Budget/Roster (right column)
      { i: 'vbd-scatter', x: 0, y: 12, w: 14, h: 14, minW: 4, maxW: 10, minH: 6 },
      { i: 'budget', x: 14, y: 12, w: 6, h: 7, minW: 2, maxW: 5, minH: 5 },
      { i: 'roster', x: 14, y: 19, w: 6, h: 7, minW: 3, maxW: 10, minH: 6 },
      
      // Bottom row: Draft tools
      { i: 'draft-entry', x: 0, y: 26, w: 8, h: 6, minW: 2, maxW: 10, minH: 4 },
      { i: 'draft-ledger', x: 8, y: 26, w: 6, h: 6, minW: 3, maxW: 10, minH: 4 },
      
      // Additional widgets for complete preset coverage
      { i: 'team-roster-overview', x: 0, y: 32, w: 20, h: 6, minW: 20, maxW: 20, minH: 4 },
      { i: 'beer-sheet', x: 0, y: 38, w: 10, h: 8, minW: 8, maxW: 20, minH: 6 },
    ],
    sm: [
      // Stacked mobile layout
      { i: 'search', x: 0, y: 0, w: 4, h: 8, minW: 2, maxW: 6, minH: 6 },
      { i: 'vbd-scatter', x: 0, y: 12, w: 4, h: 14, minW: 3, maxW: 6, minH: 6 },
      { i: 'player-analysis', x: 0, y: 26, w: 2, h: 10, minW: 2, maxW: 4, minH: 5 },
      { i: 'budget', x: 0, y: 36, w: 2, h: 6, minW: 2, maxW: 4, minH: 5 },
      { i: 'roster', x: 0, y: 42, w: 4, h: 6, minW: 2, maxW: 6, minH: 6 },
      { i: 'draft-entry', x: 0, y: 48, w: 2, h: 5, minW: 2, maxW: 6, minH: 4 },
      { i: 'draft-ledger', x: 0, y: 53, w: 3, h: 5, minW: 2, maxW: 6, minH: 4 },
      
      // Additional widgets for complete preset coverage
      { i: 'team-roster-overview', x: 0, y: 58, w: 16, h: 6, minW: 16, maxW: 16, minH: 4 },
      { i: 'beer-sheet', x: 0, y: 64, w: 8, h: 8, minW: 6, maxW: 16, minH: 6 },
    ]
  }
};

/**
 * Nomination Layout: Active Drafting Focus
 * 
 * Primary workflow: Making real-time drafting decisions during auction
 * Key widgets: DraftEntry (prominent), BudgetTracker (large), RosterPanel
 * Supporting: PlayerSearch (medium), VBDScatter (quick reference)
 * 
 * Visual hierarchy: Draft action tools dominate, analysis secondary
 */
const nominationPreset: LayoutPreset = {
  id: 'nomination',
  name: 'Active Nomination',
  description: 'Optimized for real-time drafting decisions and bid management',
  shortcut: '2',
  icon: '⚡',
  workflow: 'Decision-making with prominent draft controls',
  layouts: {
    lg: [
      // Top row: DraftEntry (prominent) + BudgetTracker (critical)
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].lg, width: 14, height: 10 }, { x: 0, y: 0 }),
      dimensionsToGridItem('budget', { ...optimalSizes.budget.lg, width: 10, height: 10 }, { x: 14, y: 0 }),
      
      // Left column: RosterPanel (prominent for lineup decisions)
      dimensionsToGridItem('roster', { ...optimalSizes.roster.lg, width: 8, height: 16 }, { x: 0, y: 10 }),
      
      // Center: PlayerSearch (medium, for quick lookups)
      dimensionsToGridItem('search', { ...optimalSizes.search.lg, width: 10, height: 12 }, { x: 8, y: 10 }),
      
      // Right: VBDScatter (quick reference)
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].lg, width: 6, height: 12 }, { x: 18, y: 10 }),
      
      // Bottom: PlayerAnalysis + DraftLedger (supporting info)
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].lg, width: 8, height: 8 }, { x: 8, y: 22 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].lg, width: 10, height: 8 }, { x: 14, y: 22 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].lg, height: 6 }, { x: 0, y: 30 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].lg, height: 10 }, { x: 0, y: 36 }),
    ],
    md: [
      // Top row: DraftEntry + BudgetTracker
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].md, width: 12, height: 9 }, { x: 0, y: 0 }),
      dimensionsToGridItem('budget', { ...optimalSizes.budget.md, width: 8, height: 9 }, { x: 12, y: 0 }),
      
      // Middle: RosterPanel + PlayerSearch
      dimensionsToGridItem('roster', { ...optimalSizes.roster.md, width: 8, height: 14 }, { x: 0, y: 9 }),
      dimensionsToGridItem('search', { ...optimalSizes.search.md, width: 8, height: 10 }, { x: 8, y: 9 }),
      
      // Right: VBDScatter (compact)
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].md, width: 4, height: 10 }, { x: 16, y: 9 }),
      
      // Bottom: Analysis tools
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].md, width: 8, height: 6 }, { x: 8, y: 19 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].md, width: 8, height: 6 }, { x: 0, y: 23 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].md, height: 6 }, { x: 0, y: 29 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].md, height: 8 }, { x: 0, y: 35 }),
    ],
    sm: [
      // Mobile: Draft tools first, then supporting info
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].sm, height: 8 }, { x: 0, y: 0 }),
      dimensionsToGridItem('budget', { ...optimalSizes.budget.sm, height: 8 }, { x: 0, y: 8 }),
      dimensionsToGridItem('roster', { ...optimalSizes.roster.sm, height: 12 }, { x: 0, y: 16 }),
      dimensionsToGridItem('search', { ...optimalSizes.search.sm, height: 10 }, { x: 0, y: 28 }),
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].sm, height: 10 }, { x: 0, y: 38 }),
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].sm, height: 6 }, { x: 0, y: 48 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].sm, height: 6 }, { x: 0, y: 54 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].sm, height: 6 }, { x: 0, y: 60 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].sm, height: 8 }, { x: 0, y: 66 }),
    ]
  }
};

/**
 * Player Analytics Layout: Deep Analysis Focus
 * 
 * Primary workflow: Deep-dive player analysis and data visualization
 * Key widgets: VBDScatter (dominant), PlayerAnalysis (large)
 * Supporting: PlayerSearch (for player lookups)
 * Minimized: Draft tools (not primary focus)
 * 
 * Visual hierarchy: Data visualization and analysis dominate screen real estate
 */
const playerAnalyticsPreset: LayoutPreset = {
  id: 'player-analytics',
  name: 'Player Analytics',
  description: 'Deep analysis workflow with data visualization and player insights',
  shortcut: '3',
  icon: '📊',
  workflow: 'Analysis-focused with dominant data visualization',
  layouts: {
    lg: [
      // VBDScatter dominates (massive visualization space)
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].lg, width: 18, height: 18 }, { x: 0, y: 0 }),
      
      // Right column: PlayerAnalysis (detailed stats)
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].lg, width: 6, height: 14 }, { x: 18, y: 0 }),
      
      // PlayerSearch (medium, for player lookups)
      dimensionsToGridItem('search', { ...optimalSizes.search.lg, width: 12, height: 8 }, { x: 0, y: 18 }),
      
      // Draft tools (compact, supporting only)
      dimensionsToGridItem('budget', { ...optimalSizes.budget.lg, width: 6, height: 4 }, { x: 18, y: 14 }),
      dimensionsToGridItem('roster', { ...optimalSizes.roster.lg, width: 6, height: 8 }, { x: 18, y: 18 }),
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].lg, width: 6, height: 4 }, { x: 12, y: 18 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].lg, width: 6, height: 4 }, { x: 12, y: 22 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].lg, height: 6 }, { x: 0, y: 26 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].lg, height: 10 }, { x: 0, y: 32 }),
    ],
    md: [
      // VBDScatter large
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].md, width: 14, height: 16 }, { x: 0, y: 0 }),
      
      // PlayerAnalysis
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].md, width: 6, height: 12 }, { x: 14, y: 0 }),
      
      // PlayerSearch
      dimensionsToGridItem('search', { ...optimalSizes.search.md, width: 10, height: 6 }, { x: 0, y: 16 }),
      
      // Draft tools (compact)
      dimensionsToGridItem('budget', { ...optimalSizes.budget.md, width: 4, height: 4 }, { x: 14, y: 12 }),
      dimensionsToGridItem('roster', { ...optimalSizes.roster.md, width: 6, height: 6 }, { x: 14, y: 16 }),
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].md, width: 5, height: 4 }, { x: 10, y: 16 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].md, width: 5, height: 4 }, { x: 10, y: 20 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].md, height: 6 }, { x: 0, y: 24 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].md, height: 8 }, { x: 0, y: 30 }),
    ],
    sm: [
      // Mobile: Analytics first, then tools
      dimensionsToGridItem('vbd-scatter', { ...optimalSizes['vbd-scatter'].sm, height: 16 }, { x: 0, y: 0 }),
      dimensionsToGridItem('player-analysis', { ...optimalSizes['player-analysis'].sm, height: 12 }, { x: 0, y: 16 }),
      dimensionsToGridItem('search', { ...optimalSizes.search.sm, height: 8 }, { x: 0, y: 28 }),
      dimensionsToGridItem('budget', { ...optimalSizes.budget.sm, height: 4 }, { x: 0, y: 36 }),
      dimensionsToGridItem('roster', { ...optimalSizes.roster.sm, height: 6 }, { x: 0, y: 40 }),
      dimensionsToGridItem('draft-entry', { ...optimalSizes['draft-entry'].sm, height: 4 }, { x: 0, y: 46 }),
      dimensionsToGridItem('draft-ledger', { ...optimalSizes['draft-ledger'].sm, height: 4 }, { x: 0, y: 50 }),
      
      // Additional widgets for complete preset coverage
      dimensionsToGridItem('team-roster-overview', { ...optimalSizes['team-roster-overview'].sm, height: 6 }, { x: 0, y: 54 }),
      dimensionsToGridItem('beer-sheet', { ...optimalSizes['beer-sheet'].sm, height: 8 }, { x: 0, y: 60 }),
    ]
  }
};

/**
 * Custom Layout: Empty Canvas for User Control
 * 
 * Primary workflow: Complete user customization without restrictions
 * Key widgets: None by default - user adds what they need
 * Layout: Empty - allows unlimited flexibility
 * 
 * Visual hierarchy: User-defined, unrestricted widget placement
 */
const customPreset: LayoutPreset = {
  id: 'custom',
  name: 'Custom Layout',
  description: 'Empty canvas for unlimited widget customization and arrangement',
  shortcut: '4',
  icon: '🎨',
  workflow: 'User-defined with complete flexibility',
  layouts: {
    lg: [
      // Empty by default - widgets added by user with optimal sizing
    ],
    md: [
      // Empty by default - widgets added by user with optimal sizing
    ],
    sm: [
      // Empty by default - widgets added by user with optimal sizing
    ]
  }
};

/**
 * All available layout presets
 */
export const layoutPresets: Record<PresetId, LayoutPreset> = {
  'pre-draft': preDraftPreset,
  'nomination': nominationPreset,
  'player-analytics': playerAnalyticsPreset,
  'custom': customPreset,
};

/**
 * Get a specific layout preset by ID
 */
export function getLayoutPreset(presetId: PresetId): LayoutPreset | null {
  return layoutPresets[presetId] || null;
}

/**
 * Get all available layout presets as an array
 */
export function getAllLayoutPresets(): LayoutPreset[] {
  return Object.values(layoutPresets);
}

/**
 * Get layout preset by keyboard shortcut
 */
export function getLayoutPresetByShortcut(shortcut: string): LayoutPreset | null {
  return getAllLayoutPresets().find(preset => preset.shortcut === shortcut) || null;
}

/**
 * Validate if a preset ID exists
 */
export function isValidPresetId(presetId: string): presetId is PresetId {
  return presetId in layoutPresets;
}

/**
 * Get the default preset (pre-draft for new users)
 */
export function getDefaultPreset(): LayoutPreset {
  return preDraftPreset;
}

/**
 * Professional preset metadata for UI display
 */
export const presetMetadata = {
  'pre-draft': {
    primaryColor: '#3B82F6', // Blue - Research/Analysis
    workflow: ['Player Research', 'Value Analysis', 'Tier Identification'],
    keyFeatures: ['Prominent Search', 'Large VBD Chart', 'Analysis Focus'],
    bestFor: 'Research and preparation phase before draft starts'
  },
  'nomination': {
    primaryColor: '#EF4444', // Red - Action/Urgency  
    workflow: ['Real-time Bidding', 'Budget Management', 'Roster Building'],
    keyFeatures: ['Draft Controls', 'Budget Tracking', 'Quick Decisions'],
    bestFor: 'Active drafting during auction nominations'
  },
  'player-analytics': {
    primaryColor: '#8B5CF6', // Purple - Analytics/Data
    workflow: ['Deep Analysis', 'Data Visualization', 'Player Insights'],
    keyFeatures: ['Dominant Charts', 'Statistical Focus', 'Visual Analysis'],
    bestFor: 'In-depth player analysis and data exploration'
  },
  'custom': {
    primaryColor: '#10B981', // Green - Flexibility/Freedom
    workflow: ['Complete Customization', 'Unrestricted Layout', 'Personal Workflow'],
    keyFeatures: ['Empty Canvas', 'Unlimited Flexibility', 'User Control'],
    bestFor: 'Creating personalized layouts without constraints'
  }
} as const;