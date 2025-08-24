/**
 * Shared TypeScript types for React components
 * These interfaces bridge the vanilla JS core with React components
 */

export interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  points?: number;
  bye?: number;
  injuryStatus?: number;
  tier?: number;
  vbd?: number;
  adp?: number;
  price?: number;
  drafted?: boolean;
}

export interface DraftPick {
  id: number;
  playerId: number;
  teamId: number;
  price: number;
  round?: number;
  pick?: number;
  timestamp?: number;
  player?: Player;
}

export interface LeagueSettings {
  teams: number;
  budget: number;
  roster: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DST: number;
    BENCH: number;
  };
  owners?: Array<{ id: number; team: string; name: string; order: number }>;
  keepers?: Array<{ teamId: number; cost: number }>;
  minBid?: number;
  userTeamId?: number;
}

export interface DraftState {
  players: Player[];
  picks: DraftPick[];
  currentTeamId: number;
  leagueSettings: LeagueSettings;
  selectedPlayer?: Player;
  isLoading?: boolean;
  error?: string;
}

export interface Owner {
  id: number;
  name: string;
  teamName?: string;
}

// Legacy store bridge types
export interface LegacyStoreState {
  players: Player[];
  picks: DraftPick[];
  owners: Owner[];
  leagueSettings: LeagueSettings;
  currentTeamId: number;
  selectedPlayer?: Player;
}

// Widget-specific types
export interface PositionGroup {
  position: string;
  players: Player[];
  picks: DraftPick[];
  required: number;
  filled: number;
}

export interface TeamProjection {
  teamId: number;
  totalPoints: number;
  positionGroups: PositionGroup[];
  byeConflicts: Map<number, number>;
}

// VBD types
export interface VBDCalculation {
  player: Player;
  vbd: number;
  positionRank: number;
  overallRank: number;
  tier: number;
}

export interface ScatterPlotPoint {
  x: number;
  y: number;
  player: Player;
  color: string;
}

// Event handler types
export interface PlayerSelectionEvent {
  player: Player;
  source: string;
}

export interface DraftActionEvent {
  type: string;
  payload: any;
  timestamp: number;
}