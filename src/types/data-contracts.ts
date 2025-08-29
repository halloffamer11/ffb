/**
 * Data Contract Definitions for FFB Application
 * 
 * This file defines all TypeScript interfaces and data shapes used throughout
 * the application to ensure type safety and data consistency.
 */

// Core data entities
export interface Player {
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
  teams: Team[];
  userTeamId: number | null;
  scoring: ScoringSystem;
  isDraftStarted: boolean;
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
  | 'STATE_RESTORE';

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

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  stateUpdateTime: number;
  searchTime: number;
  persistenceTime: number;
  memoryUsage: number;
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