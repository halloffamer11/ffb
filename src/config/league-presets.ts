/**
 * League Presets Configuration
 * 
 * Defines predefined league settings templates for common fantasy football
 * league formats. These presets include structural settings only (roster
 * composition, scoring, etc.) but not team names or player data.
 */

import { LeagueSettings, FlexSpot } from '../types/data-contracts';

export interface LeaguePreset {
  id: string;
  name: string;
  description: string;
  draftType: 'snake' | 'auction';
  settings: Omit<LeagueSettings, 'teams' | 'userTeamId' | 'isDraftStarted' | 'leagueName' | 'selectedPreset'>;
}

// Flex configurations
const noFlexSpots: FlexSpot[] = [];

const yahooFlexSpots: FlexSpot[] = [
  {
    id: 'flex-1',
    allowedPositions: {
      QB: false,
      RB: true,
      WR: true,
      TE: true
    }
  },
  {
    id: 'flex-2', // Super Flex (Q/W/R/T)
    allowedPositions: {
      QB: true,
      RB: true,
      WR: true,
      TE: true
    }
  }
];

export const LEAGUE_PRESETS: LeaguePreset[] = [
  {
    id: 'cbs-snake',
    name: 'CBS Snake',
    description: 'U of PFFL - 12 teams, standard scoring, no PPR',
    draftType: 'snake',
    settings: {
      teamCount: 12,
      budget: 200, // Not used for snake drafts
      minBid: 1,
      rosterSize: 16,
      positions: {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 1,
        K: 1,
        DST: 1,
        FLEX: 0,
        BENCH: 6
      },
      flexConfig: {
        spots: noFlexSpots
      },
      scoring: {
        preset: 'standard' as const,
        values: {
          passingYards: 0.04, // 25 yards per point
          passingTDs: 4,
          interceptions: -2,
          rushingYards: 0.1, // 10 yards per point
          rushingTDs: 6,
          receivingYards: 0.1, // 10 yards per point
          receivingTDs: 6,
          receptions: 0, // No PPR
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
      }
    }
  },
  {
    id: 'yahoo-auction',
    name: 'Yahoo Auction',
    description: 'Laces Out Dan - 10 teams, full PPR, super flex',
    draftType: 'auction',
    settings: {
      teamCount: 10,
      budget: 200,
      minBid: 1,
      rosterSize: 17,
      positions: {
        QB: 1,
        RB: 2,
        WR: 2,
        TE: 1,
        K: 1,
        DST: 1,
        FLEX: 2, // W/R/T and Q/W/R/T
        BENCH: 5
      },
      flexConfig: {
        spots: yahooFlexSpots
      },
      scoring: {
        preset: 'ppr' as const,
        values: {
          passingYards: 0.04, // 25 yards per point
          passingTDs: 4,
          interceptions: -2,
          rushingYards: 0.1, // 10 yards per point
          rushingTDs: 6,
          receivingYards: 0.1, // 10 yards per point
          receivingTDs: 6,
          receptions: 1, // Full PPR
          fumbles: -2,
          kickingXP: 1,
          fieldGoals: {
            under40: 2, // Average of 0-19 (1pt) and 20-29 (2pt) and 30-39 (3pt)
            from40to49: 4,
            over50: 5
          },
          defense: {
            pointsAllowed0: 10,
            pointsAllowed1to6: 8,
            pointsAllowed7to13: 4,
            pointsAllowed14to20: 1,
            pointsAllowed21to27: 0,
            pointsAllowed28to34: -1,
            pointsAllowed35Plus: -3,
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
            touchdowns: 4 // Yahoo uses 4pts for DST TDs
          }
        }
      }
    }
  }
];

/**
 * Get all available league presets
 */
export function getAvailablePresets(): LeaguePreset[] {
  return LEAGUE_PRESETS;
}

/**
 * Get a specific preset by ID
 */
export function getPresetById(id: string): LeaguePreset | null {
  return LEAGUE_PRESETS.find(preset => preset.id === id) || null;
}

/**
 * Check if current league settings match a known preset
 * This function compares structural settings only, ignoring team names, etc.
 */
export function detectMatchingPreset(settings: LeagueSettings): string | null {
  for (const preset of LEAGUE_PRESETS) {
    if (isSettingsMatch(settings, preset.settings)) {
      return preset.id;
    }
  }
  return null;
}

/**
 * Deep comparison of structural league settings
 */
function isSettingsMatch(
  current: LeagueSettings, 
  preset: Omit<LeagueSettings, 'teams' | 'userTeamId' | 'isDraftStarted' | 'leagueName' | 'selectedPreset'>
): boolean {
  // Compare basic settings
  if (current.teamCount !== preset.teamCount ||
      current.budget !== preset.budget ||
      current.minBid !== preset.minBid ||
      current.rosterSize !== preset.rosterSize) {
    return false;
  }
  
  // Compare positions
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'BENCH'] as const;
  for (const pos of positions) {
    if (current.positions[pos] !== preset.positions[pos]) {
      return false;
    }
  }
  
  // Compare scoring preset and key values
  if (current.scoring.preset !== preset.scoring.preset ||
      current.scoring.values.receptions !== preset.scoring.values.receptions ||
      current.scoring.values.passingTDs !== preset.scoring.values.passingTDs ||
      current.scoring.values.rushingTDs !== preset.scoring.values.rushingTDs ||
      current.scoring.values.receivingTDs !== preset.scoring.values.receivingTDs) {
    return false;
  }
  
  // Compare flex configuration
  const currentFlexSpots = current.flexConfig?.spots || [];
  const presetFlexSpots = preset.flexConfig?.spots || [];
  
  if (currentFlexSpots.length !== presetFlexSpots.length) {
    return false;
  }
  
  for (let i = 0; i < currentFlexSpots.length; i++) {
    const currentSpot = currentFlexSpots[i];
    const presetSpot = presetFlexSpots[i];
    
    const positions = ['QB', 'RB', 'WR', 'TE'] as const;
    for (const pos of positions) {
      if (currentSpot.allowedPositions[pos] !== presetSpot.allowedPositions[pos]) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Generate default teams for a given team count
 */
export function generateDefaultTeams(teamCount: number, budget: number) {
  const teams = [];
  for (let i = 0; i < teamCount; i++) {
    teams.push({
      id: i + 1,
      teamName: `Team ${i + 1}`,
      ownerName: `Owner ${i + 1}`,
      budget: budget
    });
  }
  return teams;
}