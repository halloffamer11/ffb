/**
 * State Validation Utilities
 * 
 * Provides validation functions for application state to ensure data integrity
 * and handle migrations between different schema versions.
 */

import { 
  ApplicationState, 
  Player, 
  DraftPick, 
  Keeper,
  Team,
  LeagueSettings,
  ScoringSystem,
  UIState,
  StateMetadata,
  ValidationResult,
  ValidationError,
  Position,
  InjuryStatus
} from '../types/data-contracts';

// Validation schemas
const VALID_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
const VALID_INJURY_STATUSES: InjuryStatus[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Create default scoring system
 */
function createDefaultScoring(): ScoringSystem {
  return {
    preset: 'ppr',
    values: {
      passingYards: 0.04,
      passingTDs: 4,
      interceptions: -2,
      rushingYards: 0.1,
      rushingTDs: 6,
      receivingYards: 0.1,
      receivingTDs: 6,
      receptions: 1,
      fumbles: -2,
      kickingXP: 1,
      fieldGoals: {
        under40: 3,
        from40to49: 4,
        over50: 5
      },
      defense: {
        pointsAllowed0: 10,
        pointsAllowed1to6: 7,
        pointsAllowed7to13: 4,
        pointsAllowed14to20: 1,
        pointsAllowed21to27: 0,
        pointsAllowed28to34: -1,
        pointsAllowed35Plus: -4,
        yardsAllowed0to99: 5,
        yardsAllowed100to199: 3,
        yardsAllowed200to299: 2,
        yardsAllowed300to399: 0,
        yardsAllowed400to449: -1,
        yardsAllowed450to499: -3,
        yardsAllowed500Plus: -5,
        sacks: 1,
        interceptions: 2,
        fumbleRecoveries: 2,
        safeties: 2,
        touchdowns: 6
      }
    }
  };
}

/**
 * Create default teams for a given team count
 */
function createDefaultTeams(teamCount: number, budget: number): Team[] {
  const teams: Team[] = [];
  for (let i = 0; i < teamCount; i++) {
    teams.push({
      id: i + 1,
      teamName: `Team ${i + 1}`,
      ownerName: `Owner ${i + 1}`,
      budget
    });
  }
  return teams;
}

/**
 * Create initial application state
 */
export function createInitialState(): ApplicationState {
  const budget = 200;
  const teamCount = 12;
  
  return {
    players: [],
    picks: [],
    keepers: [],
    settings: {
      leagueName: 'My Fantasy League',
      teamCount,
      budget,
      minBid: 1,
      rosterSize: 16,
      positions: {
        QB: 1,
        RB: 2,
        WR: 2,
        TE: 1,
        K: 1,
        DST: 1,
        FLEX: 1,
        BENCH: 7
      },
      teams: createDefaultTeams(teamCount, budget),
      userTeamId: null,
      scoring: createDefaultScoring(),
      isDraftStarted: false
    },
    ui: {
      selectedPlayer: null,
      searchTerm: '',
      activeWidget: null,
      layoutPreset: 'default',
      editMode: false,
      filters: {
        position: 'ALL',
        team: 'ALL',
        drafted: false,
        showInjured: true
      }
    },
    metadata: {
      version: '2.0.0',
      lastModified: Date.now(),
      saveCount: 0,
      dataSource: 'initial',
      validationErrors: []
    }
  };
}

/**
 * Validate a player object
 */
export function validatePlayer(player: any, index?: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const context = index !== undefined ? `player[${index}]` : 'player';
  
  // Required fields
  if (typeof player?.id !== 'number' || player.id <= 0) {
    errors.push({
      field: `${context}.id`,
      message: 'Player ID must be a positive number',
      severity: 'error',
      code: 'INVALID_PLAYER_ID'
    });
  }
  
  if (typeof player?.name !== 'string' || player.name.trim().length === 0) {
    errors.push({
      field: `${context}.name`,
      message: 'Player name must be a non-empty string',
      severity: 'error',
      code: 'INVALID_PLAYER_NAME'
    });
  }
  
  if (!VALID_POSITIONS.includes(player?.position)) {
    errors.push({
      field: `${context}.position`,
      message: `Position must be one of: ${VALID_POSITIONS.join(', ')}`,
      severity: 'error', 
      code: 'INVALID_POSITION'
    });
  }
  
  if (typeof player?.team !== 'string' || player.team.trim().length === 0) {
    errors.push({
      field: `${context}.team`,
      message: 'Player team must be a non-empty string',
      severity: 'error',
      code: 'INVALID_TEAM'
    });
  }
  
  // Numeric fields
  if (typeof player?.points !== 'number' || isNaN(player.points)) {
    errors.push({
      field: `${context}.points`,
      message: 'Points must be a valid number',
      severity: 'error',
      code: 'INVALID_POINTS'
    });
  }
  
  if (typeof player?.vbd !== 'number' || isNaN(player.vbd)) {
    errors.push({
      field: `${context}.vbd`,
      message: 'VBD must be a valid number',
      severity: 'error',
      code: 'INVALID_VBD'
    });
  }
  
  // Boolean fields
  if (typeof player?.drafted !== 'boolean') {
    errors.push({
      field: `${context}.drafted`,
      message: 'Drafted status must be a boolean',
      severity: 'error',
      code: 'INVALID_DRAFTED_STATUS'
    });
  }
  
  // Optional fields
  if (player?.injuryStatus !== undefined && !VALID_INJURY_STATUSES.includes(player.injuryStatus)) {
    errors.push({
      field: `${context}.injuryStatus`,
      message: `Injury status must be one of: ${VALID_INJURY_STATUSES.join(', ')}`,
      severity: 'error',
      code: 'INVALID_INJURY_STATUS'
    });
  }
  
  if (player?.adp !== undefined && (typeof player.adp !== 'number' || player.adp <= 0)) {
    errors.push({
      field: `${context}.adp`,
      message: 'ADP must be a positive number',
      severity: 'warning',
      code: 'INVALID_ADP'
    });
  }
  
  if (player?.byeWeek !== undefined && (typeof player.byeWeek !== 'number' || player.byeWeek < 1 || player.byeWeek > 18)) {
    errors.push({
      field: `${context}.byeWeek`,
      message: 'Bye week must be between 1 and 18',
      severity: 'warning',
      code: 'INVALID_BYE_WEEK'
    });
  }
  
  return errors;
}

/**
 * Validate a draft pick object
 */
export function validateDraftPick(pick: any, index?: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const context = index !== undefined ? `pick[${index}]` : 'pick';
  
  // Player validation
  if (!pick?.player) {
    errors.push({
      field: `${context}.player`,
      message: 'Pick must include a player object',
      severity: 'error',
      code: 'MISSING_PLAYER'
    });
  } else {
    errors.push(...validatePlayer(pick.player, undefined).map(error => ({
      ...error,
      field: error.field.replace('player', `${context}.player`)
    })));
  }
  
  // Team ID validation
  if (typeof pick?.teamId !== 'number' || pick.teamId < 1 || pick.teamId > 20) {
    errors.push({
      field: `${context}.teamId`,
      message: 'Team ID must be a number between 1 and 20',
      severity: 'error',
      code: 'INVALID_TEAM_ID'
    });
  }
  
  // Price validation
  if (typeof pick?.price !== 'number' || pick.price < 1 || pick.price > 1000) {
    errors.push({
      field: `${context}.price`,
      message: 'Price must be between 1 and 1000',
      severity: 'error',
      code: 'INVALID_PRICE'
    });
  }
  
  // Timestamp validation
  if (typeof pick?.timestamp !== 'number' || pick.timestamp <= 0) {
    errors.push({
      field: `${context}.timestamp`,
      message: 'Timestamp must be a positive number',
      severity: 'error',
      code: 'INVALID_TIMESTAMP'
    });
  }
  
  return errors;
}

/**
 * Validate league settings
 */
export function validateLeagueSettings(settings: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof settings?.leagueName !== 'string' || settings.leagueName.trim().length === 0) {
    errors.push({
      field: 'settings.leagueName',
      message: 'League name must be a non-empty string',
      severity: 'error',
      code: 'INVALID_LEAGUE_NAME'
    });
  }
  
  if (typeof settings?.teamCount !== 'number' || settings.teamCount < 2 || settings.teamCount > 20) {
    errors.push({
      field: 'settings.teamCount',
      message: 'Team count must be between 2 and 20',
      severity: 'error',
      code: 'INVALID_TEAM_COUNT'
    });
  }
  
  if (typeof settings?.budget !== 'number' || settings.budget < 1) {
    errors.push({
      field: 'settings.budget',
      message: 'Budget must be a positive number',
      severity: 'error',
      code: 'INVALID_BUDGET'
    });
  }
  
  if (typeof settings?.minBid !== 'number' || settings.minBid < 1) {
    errors.push({
      field: 'settings.minBid', 
      message: 'Minimum bid must be at least 1',
      severity: 'error',
      code: 'INVALID_MIN_BID'
    });
  }
  
  if (typeof settings?.rosterSize !== 'number' || settings.rosterSize < 1) {
    errors.push({
      field: 'settings.rosterSize',
      message: 'Roster size must be at least 1',
      severity: 'error',
      code: 'INVALID_ROSTER_SIZE'
    });
  }
  
  // Validate position requirements
  if (!settings?.positions || typeof settings.positions !== 'object') {
    errors.push({
      field: 'settings.positions',
      message: 'Position requirements must be an object',
      severity: 'error',
      code: 'INVALID_POSITIONS'
    });
  } else {
    const requiredPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'BENCH'];
    for (const pos of requiredPositions) {
      if (typeof settings.positions[pos] !== 'number' || settings.positions[pos] < 0) {
        errors.push({
          field: `settings.positions.${pos}`,
          message: `${pos} requirement must be a non-negative number`,
          severity: 'error',
          code: 'INVALID_POSITION_REQUIREMENT'
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate UI state
 */
export function validateUIState(ui: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (ui?.selectedPlayer !== null && ui?.selectedPlayer !== undefined) {
    errors.push(...validatePlayer(ui.selectedPlayer).map(error => ({
      ...error,
      field: error.field.replace('player', 'ui.selectedPlayer'),
      severity: 'warning' as const
    })));
  }
  
  if (ui?.searchTerm !== undefined && typeof ui.searchTerm !== 'string') {
    errors.push({
      field: 'ui.searchTerm',
      message: 'Search term must be a string',
      severity: 'warning',
      code: 'INVALID_SEARCH_TERM'
    });
  }
  
  if (ui?.editMode !== undefined && typeof ui.editMode !== 'boolean') {
    errors.push({
      field: 'ui.editMode',
      message: 'Edit mode must be a boolean',
      severity: 'warning',
      code: 'INVALID_EDIT_MODE'
    });
  }
  
  return errors;
}

/**
 * Validate complete application state
 */
export function validateApplicationState(state: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate structure
  if (!state || typeof state !== 'object') {
    return {
      valid: false,
      errors: [{
        field: 'state',
        message: 'State must be an object',
        severity: 'error',
        code: 'INVALID_STATE'
      }],
      warnings: []
    };
  }
  
  // Validate players array
  if (!Array.isArray(state.players)) {
    errors.push({
      field: 'state.players',
      message: 'Players must be an array',
      severity: 'error',
      code: 'INVALID_PLAYERS_ARRAY'
    });
  } else {
    state.players.forEach((player, index) => {
      errors.push(...validatePlayer(player, index));
    });
  }
  
  // Validate picks array
  if (!Array.isArray(state.picks)) {
    errors.push({
      field: 'state.picks',
      message: 'Picks must be an array',
      severity: 'error',
      code: 'INVALID_PICKS_ARRAY'
    });
  } else {
    state.picks.forEach((pick, index) => {
      errors.push(...validateDraftPick(pick, index));
    });
  }
  
  // Validate keepers array
  if (!Array.isArray(state.keepers)) {
    errors.push({
      field: 'state.keepers',
      message: 'Keepers must be an array',
      severity: 'error',
      code: 'INVALID_KEEPERS_ARRAY'
    });
  }
  
  // Validate settings
  errors.push(...validateLeagueSettings(state.settings));
  
  // Validate UI state
  if (state.ui) {
    errors.push(...validateUIState(state.ui));
  }
  
  // Validate metadata
  if (state.metadata && typeof state.metadata !== 'object') {
    errors.push({
      field: 'state.metadata',
      message: 'Metadata must be an object',
      severity: 'warning',
      code: 'INVALID_METADATA'
    });
  }
  
  // Separate errors and warnings
  const actualErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning' || e.severity === 'info');
  
  return {
    valid: actualErrors.length === 0,
    errors: actualErrors,
    warnings
  };
}

/**
 * Sanitize and repair state data
 */
export function repairApplicationState(state: any): ApplicationState {
  const repaired = createInitialState();
  
  try {
    // Repair players
    if (Array.isArray(state?.players)) {
      repaired.players = state.players
        .map((player, index) => {
          const validation = validatePlayer(player, index);
          const hasErrors = validation.some(e => e.severity === 'error');
          
          if (!hasErrors) {
            return player;
          }
          
          // Try to repair player
          return {
            id: typeof player?.id === 'number' ? player.id : index + 1,
            name: typeof player?.name === 'string' ? player.name.trim() : `Player ${index + 1}`,
            position: VALID_POSITIONS.includes(player?.position) ? player.position : 'RB',
            team: typeof player?.team === 'string' ? player.team.trim() : 'FA',
            points: typeof player?.points === 'number' ? player.points : 0,
            vbd: typeof player?.vbd === 'number' ? player.vbd : 0,
            drafted: typeof player?.drafted === 'boolean' ? player.drafted : false,
            injuryStatus: VALID_INJURY_STATUSES.includes(player?.injuryStatus) ? player.injuryStatus : 0,
            adp: typeof player?.adp === 'number' ? player.adp : undefined,
            byeWeek: typeof player?.byeWeek === 'number' ? player.byeWeek : undefined
          };
        })
        .filter(Boolean);
    }
    
    // Repair picks
    if (Array.isArray(state?.picks)) {
      repaired.picks = state.picks
        .filter(pick => pick && typeof pick === 'object')
        .map(pick => ({
          player: pick.player || repaired.players[0] || { id: 1, name: 'Unknown', position: 'RB', team: 'FA', points: 0, vbd: 0, drafted: true, injuryStatus: 0 },
          teamId: typeof pick.teamId === 'number' ? pick.teamId : 1,
          price: typeof pick.price === 'number' ? pick.price : 1,
          timestamp: typeof pick.timestamp === 'number' ? pick.timestamp : Date.now()
        }));
    }
    
    // Repair settings
    if (state?.settings && typeof state.settings === 'object') {
      repaired.settings = {
        leagueName: typeof state.settings.leagueName === 'string' ? state.settings.leagueName : repaired.settings.leagueName,
        teamCount: typeof state.settings.teamCount === 'number' ? state.settings.teamCount : repaired.settings.teamCount,
        budget: typeof state.settings.budget === 'number' ? state.settings.budget : repaired.settings.budget,
        minBid: typeof state.settings.minBid === 'number' ? state.settings.minBid : repaired.settings.minBid,
        rosterSize: typeof state.settings.rosterSize === 'number' ? state.settings.rosterSize : repaired.settings.rosterSize,
        positions: {
          QB: typeof state.settings.positions?.QB === 'number' ? state.settings.positions.QB : repaired.settings.positions.QB,
          RB: typeof state.settings.positions?.RB === 'number' ? state.settings.positions.RB : repaired.settings.positions.RB,
          WR: typeof state.settings.positions?.WR === 'number' ? state.settings.positions.WR : repaired.settings.positions.WR,
          TE: typeof state.settings.positions?.TE === 'number' ? state.settings.positions.TE : repaired.settings.positions.TE,
          K: typeof state.settings.positions?.K === 'number' ? state.settings.positions.K : repaired.settings.positions.K,
          DST: typeof state.settings.positions?.DST === 'number' ? state.settings.positions.DST : repaired.settings.positions.DST,
          FLEX: typeof state.settings.positions?.FLEX === 'number' ? state.settings.positions.FLEX : repaired.settings.positions.FLEX,
          BENCH: typeof state.settings.positions?.BENCH === 'number' ? state.settings.positions.BENCH : repaired.settings.positions.BENCH
        },
        teams: Array.isArray(state.settings.teams) ? state.settings.teams : repaired.settings.teams,
        userTeamId: typeof state.settings.userTeamId === 'number' ? state.settings.userTeamId : repaired.settings.userTeamId,
        scoring: state.settings.scoring && typeof state.settings.scoring === 'object' ? state.settings.scoring : repaired.settings.scoring,
        isDraftStarted: typeof state.settings.isDraftStarted === 'boolean' ? state.settings.isDraftStarted : repaired.settings.isDraftStarted
      };
    }
    
    // Repair UI state
    if (state?.ui && typeof state.ui === 'object') {
      repaired.ui = {
        selectedPlayer: state.ui.selectedPlayer || null,
        searchTerm: typeof state.ui.searchTerm === 'string' ? state.ui.searchTerm : '',
        activeWidget: typeof state.ui.activeWidget === 'string' ? state.ui.activeWidget : null,
        layoutPreset: typeof state.ui.layoutPreset === 'string' ? state.ui.layoutPreset : 'default',
        editMode: typeof state.ui.editMode === 'boolean' ? state.ui.editMode : false,
        filters: {
          position: state.ui.filters?.position || 'ALL',
          team: state.ui.filters?.team || 'ALL',
          drafted: typeof state.ui.filters?.drafted === 'boolean' ? state.ui.filters.drafted : false,
          showInjured: typeof state.ui.filters?.showInjured === 'boolean' ? state.ui.filters.showInjured : true
        }
      };
    }
    
    // Update metadata
    repaired.metadata = {
      version: '2.0.0',
      lastModified: Date.now(),
      saveCount: typeof state?.metadata?.saveCount === 'number' ? state.metadata.saveCount + 1 : 1,
      dataSource: state?.metadata?.dataSource || 'repaired',
      validationErrors: []
    };
    
  } catch (error) {
    console.error('State repair failed, using default state:', error);
  }
  
  return repaired;
}