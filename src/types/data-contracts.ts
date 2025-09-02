/**
 * Data Contract Definitions for FFB Application
 * 
 * This file defines all TypeScript interfaces and data shapes used throughout
 * the application to ensure type safety and data consistency.
 */

// Core data entities
// Enhanced projection data
export interface ProjectionData {
  points: number;           // Calculated fantasy points
  pointsHigh?: number;      // High projection
  pointsLow?: number;       // Low projection
  confidence?: number;      // SD or confidence interval
  source: 'FFA' | 'FPs' | 'custom';
  lastUpdated: number;
}

// Position-specific stats (union type for efficiency)
export type PositionStats = 
  | QBStats 
  | RBStats 
  | WRStats 
  | TEStats 
  | KStats 
  | DSTStats;

// QB-specific statistics
export interface QBStats {
  type: 'QB';
  passYds: number;
  passAtt: number;
  passCmp: number;
  passTDs: number;
  passInt: number;
  rushYds: number;
  rushAtt: number;
  rushTDs: number;
  fumbles: number;
  // Standard deviations for uncertainty
  passYdsSd?: number;
  passTDsSd?: number;
  passIntSd?: number;
  rushYdsSd?: number;
  rushTDsSd?: number;
}

// RB-specific statistics
export interface RBStats {
  type: 'RB';
  rushYds: number;
  rushAtt: number;
  rushTDs: number;
  rec: number;
  recYds: number;
  recTDs: number;
  fumbles: number;
  // Standard deviations
  rushYdsSd?: number;
  rushTDsSd?: number;
  recSd?: number;
  recYdsSd?: number;
  recTDsSd?: number;
}

// WR-specific statistics
export interface WRStats {
  type: 'WR';
  rec: number;
  recYds: number;
  recTDs: number;
  rushYds: number;
  rushAtt: number;
  rushTDs: number;
  fumbles: number;
  // Standard deviations
  recSd?: number;
  recYdsSd?: number;
  recTDsSd?: number;
  rushYdsSd?: number;
}

// TE-specific statistics
export interface TEStats {
  type: 'TE';
  rec: number;
  recYds: number;
  recTDs: number;
  fumbles: number;
  // Standard deviations
  recSd?: number;
  recYdsSd?: number;
  recTDsSd?: number;
}

// K-specific statistics
export interface KStats {
  type: 'K';
  fg: number;              // Field goals made
  fga: number;             // Field goals attempted
  fg_0019: number;         // FG 0-19 yards
  fg_2029: number;         // FG 20-29 yards
  fg_3039: number;         // FG 30-39 yards
  fg_4049: number;         // FG 40-49 yards
  fg_50: number;           // FG 50+ yards
  xp: number;              // Extra points
  // Standard deviations
  fg_0019Sd?: number;
  fg_2029Sd?: number;
  fg_3039Sd?: number;
  fg_4049Sd?: number;
  fg_50Sd?: number;
  xpSd?: number;
}

// DST-specific statistics
export interface DSTStats {
  type: 'DST';
  sacks: number;
  int: number;
  fumbleRec: number;
  fumbleForced: number;
  td: number;
  safety: number;
  pointsAllowed: number;
  yardsAllowed: number;
  // Standard deviations
  sacksSd?: number;
  intSd?: number;
  fumbleRecSd?: number;
  fumbleForcedSd?: number;
  tdSd?: number;
}

export interface Player {
  id: number;
  name: string;
  position: Position;
  team: string;
  drafted: boolean;
  injuryStatus: InjuryStatus;
  adp?: number;
  byeWeek?: number;
  
  // Enhanced projection system
  projections: ProjectionData;
  
  // Position-specific stats
  stats: PositionStats;
  
  // Calculated fields (for performance)
  points: number;          // Direct access for backward compatibility
  vbd: number;
  valPercent?: number;     // VAL% - percentage of position's positive VBD
  tier?: number;
  valueScore?: number;     // Composite value metric
  
  // Legacy support
  marketData?: {
    adp?: number;
    projection?: number;
    tier?: number;
  };
}

export interface DraftPick {
  player: Player;
  teamId: number;
  price: number;
  timestamp: number;
  pickNumber?: number;
  round?: number;
}

export interface Team {
  id: number;
  teamName: string;
  ownerName: string;
  budget: number;
}

export interface Keeper {
  player: Player;
  teamId: number;
  cost: number;
  year?: number;
}

export interface ScoringSystem {
  preset: 'standard' | 'halfppr' | 'ppr' | 'custom';
  values: {
    passingYards: number;
    passingTDs: number;
    interceptions: number;
    rushingYards: number;
    rushingTDs: number;
    receivingYards: number;
    receivingTDs: number;
    receptions: number;
    fumbles: number;
    kickingXP: number;
    fieldGoals: {
      under40: number;
      from40to49: number;
      over50: number;
    };
    defense: {
      pointsAllowed0: number;
      pointsAllowed1to6: number;
      pointsAllowed7to13: number;
      pointsAllowed14to20: number;
      pointsAllowed21to27: number;
      pointsAllowed28to34: number;
      pointsAllowed35Plus: number;
      yardsAllowed0to99: number;
      yardsAllowed100to199: number;
      yardsAllowed200to299: number;
      yardsAllowed300to399: number;
      yardsAllowed400to449: number;
      yardsAllowed450to499: number;
      yardsAllowed500Plus: number;
      sacks: number;
      interceptions: number;
      fumbleRecoveries: number;
      safeties: number;
      touchdowns: number;
    };
  };
}

export interface FlexSpot {
  id: string;
  allowedPositions: {
    QB: boolean;
    RB: boolean;
    WR: boolean;
    TE: boolean;
  };
}

export interface LeagueSettings {
  leagueName: string;
  teamCount: number;
  budget: number;
  minBid: number;
  rosterSize: number;
  positions: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    K: number;
    DST: number;
    FLEX: number;
    BENCH: number;
  };
  flexConfig?: {
    spots: FlexSpot[];
  };
  teams: Team[];
  userTeamId: number | null;
  scoring: ScoringSystem;
  isDraftStarted: boolean;
  selectedPreset?: string; // ID of the currently selected league preset
}

// Application state structure
export interface ApplicationState {
  players: Player[];
  picks: DraftPick[];
  keepers: Keeper[];
  settings: LeagueSettings;
  ui: UIState;
  metadata: StateMetadata;
}

export interface UIState {
  selectedPlayer: Player | null;
  searchTerm: string;
  activeWidget: string | null;
  layoutPreset: string;
  editMode: boolean;
  filters: {
    position: Position | 'ALL';
    team: string | 'ALL';
    drafted: boolean;
    showInjured: boolean;
  };
}

export interface StateMetadata {
  version: string;
  lastModified: number;
  saveCount: number;
  dataSource: string;
  validationErrors: ValidationError[];
}

// Projection source types
export type ProjectionSource = 'FFA' | 'FPs' | 'custom';

// Enums and constants
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export type InjuryStatus = 
  | 0  // Healthy
  | 1  // Questionable
  | 2  // Doubtful
  | 3  // Out
  | 4  // IR
  | 5  // PUP
  | 6; // N/A

export const INJURY_STATUS_LABELS: Record<InjuryStatus, string> = {
  0: 'H',
  1: 'Q', 
  2: 'D',
  3: 'O',
  4: 'IR',
  5: 'PUP',
  6: 'N/A'
} as const;

export const POSITION_COLORS: Record<Position, string> = {
  QB: '#10b981',
  RB: '#3b82f6', 
  WR: '#8b5cf6',
  TE: '#f59e0b',
  K: '#ef4444',
  DST: '#6b7280'
} as const;

// Storage and persistence types
export interface StorageNamespace {
  players: Player[];
  picks: DraftPick[];
  keepers: Keeper[];
  settings: LeagueSettings;
  ui: Partial<UIState>;
  metadata: StateMetadata;
  teams: Team[];
}

export interface StorageAdapter {
  namespace: string;
  get<K extends keyof StorageNamespace>(key: K): StorageNamespace[K] | null;
  set<K extends keyof StorageNamespace>(key: K, value: StorageNamespace[K]): { ok: boolean; error?: string };
  remove<K extends keyof StorageNamespace>(key: K): void;
  clear(): void;
  size(): number;
  export(): { ok: boolean; data?: string; error?: string };
  import(data: string): { ok: boolean; error?: string };
}

// Action types for state management
export type ActionType = 
  | 'PLAYERS_IMPORT'
  | 'PLAYERS_CLEAR'
  | 'PLAYER_DRAFT'
  | 'PLAYER_UNDRAFT'
  | 'PLAYER_SELECT'
  | 'PICK_ADD'
  | 'PICK_REMOVE'
  | 'PICK_EDIT'
  | 'KEEPER_ADD'
  | 'KEEPER_REMOVE'
  | 'KEEPER_UPDATE'
  | 'KEEPER_ASSIGN'
  | 'TEAMS_UPDATE'
  | 'SETTINGS_UPDATE'
  | 'DRAFT_START'
  | 'UI_UPDATE'
  | 'STATE_RESET'
  | 'STATE_RESTORE'
  | 'PROJECTIONS_UPDATE'
  | 'PROJECTIONS_RECALC';

export interface Action<T = any> {
  type: ActionType;
  payload: T;
  timestamp?: number;
  source?: string;
}

// Validation and error handling
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Search and filtering types
export interface SearchOptions {
  includePosition: boolean;
  includeTeam: boolean;
  fuzzyMatch: boolean;
  maxResults: number;
  drafted: 'all' | 'available' | 'drafted';
}

export interface SearchResult {
  player: Player;
  score: number;
  matchedFields: string[];
}

// Projection utilities
export interface ProjectionRange {
  low: number;
  high: number;
  confidence: number;
}

// Fantasy scoring settings for projections
export interface FantasyScoringRules {
  passingYards: number;
  passingTDs: number;
  interceptions: number;
  rushingYards: number;
  rushingTDs: number;
  receivingYards: number;
  receivingTDs: number;
  receptions: number;
  fumbles: number;
  kickingXP: number;
  fieldGoals: {
    under40: number;
    from40to49: number;
    over50: number;
  };
  defense: {
    sacks: number;
    interceptions: number;
    fumbleRecoveries: number;
    safeties: number;
    touchdowns: number;
    pointsAllowed0: number;
    pointsAllowed1to6: number;
    pointsAllowed7to13: number;
    pointsAllowed14to20: number;
    pointsAllowed21to27: number;
    pointsAllowed28to34: number;
    pointsAllowed35Plus: number;
  };
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  stateUpdateTime: number;
  searchTime: number;
  persistenceTime: number;
  memoryUsage: number;
  projectionCalcTime?: number;
}

export interface PerformanceEntry {
  component: string;
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Widget communication
export interface WidgetMessage {
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: number;
}

export interface WidgetState {
  id: string;
  type: string;
  visible: boolean;
  position: { x: number; y: number; w: number; h: number };
  data: any;
  lastUpdate: number;
}

// Developer tools interfaces
export interface DebugInfo {
  state: ApplicationState;
  performance: PerformanceMetrics;
  storage: {
    size: number;
    keys: string[];
    errors: string[];
  };
  widgets: WidgetState[];
  events: WidgetMessage[];
}

export interface DataInspectorEntry {
  path: string;
  value: any;
  type: string;
  size: number;
  lastModified: number;
}

// Migration and backward compatibility
export interface LegacyPlayer {
  id: number;
  name: string;
  position: Position;
  team: string;
  points: number;
  vbd: number;
  drafted: boolean;
  injuryStatus: InjuryStatus;
  adp?: number;
  byeWeek?: number;
  marketData?: {
    adp?: number;
    projection?: number;
    tier?: number;
  };
}

export interface ProjectionImportResult {
  success: boolean;
  playersImported: number;
  errors: string[];
  warnings: string[];
  source: ProjectionSource;
  timestamp: number;
}

// Type guards for position-specific stats
export function isQBStats(stats: PositionStats): stats is QBStats {
  return stats.type === 'QB';
}

export function isRBStats(stats: PositionStats): stats is RBStats {
  return stats.type === 'RB';
}

export function isWRStats(stats: PositionStats): stats is WRStats {
  return stats.type === 'WR';
}

export function isTEStats(stats: PositionStats): stats is TEStats {
  return stats.type === 'TE';
}

export function isKStats(stats: PositionStats): stats is KStats {
  return stats.type === 'K';
}

export function isDSTStats(stats: PositionStats): stats is DSTStats {
  return stats.type === 'DST';
}