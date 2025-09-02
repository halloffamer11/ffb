/**
 * Projections Import Adapter
 * 
 * Handles importing and merging projection data from multiple Excel sources:
 * - FFA raw stats with mean/SD values
 * - FPs projections with high/low values
 */

import { 
  Player, 
  LegacyPlayer,
  PositionStats,
  QBStats,
  RBStats,
  WRStats,
  TEStats,
  KStats,
  DSTStats,
  ProjectionData,
  ProjectionImportResult,
  ProjectionSource,
  Position,
  InjuryStatus
} from '../types/data-contracts';

// Raw data interfaces for Excel parsing
interface FFAPlayerData {
  player: string;
  team: string;
  position: string;
  id: string;
  // Passing stats
  pass_yds: number;
  pass_yds_sd: number;
  pass_tds: number;
  pass_tds_sd: number;
  pass_int: number;
  pass_int_sd: number;
  // Rushing stats
  rush_yds: number;
  rush_yds_sd: number;
  rush_tds: number;
  rush_tds_sd: number;
  // Receiving stats
  rec_yds: number;
  rec_yds_sd: number;
  rec_tds: number;
  rec_tds_sd: number;
  // Kicking stats
  fg_0019: number;
  fg_0019_sd: number;
  fg_2029: number;
  fg_2029_sd: number;
  fg_3039: number;
  fg_3039_sd: number;
  fg_4049: number;
  fg_4049_sd: number;
  fg_50: number;
  fg_50_sd: number;
  xp: number;
  xp_sd: number;
  // Defense stats
  dst_sacks: number;
  dst_sacks_sd: number;
  dst_int: number;
  dst_int_sd: number;
  dst_td: number;
  dst_td_sd: number;
  // Other stats
  fumbles_lost: number;
  fumbles_lost_sd: number;
  injury_status: string;
  birthdate: string;
  draft_year: number;
}

interface FPsPlayerData {
  Player: string;
  Team: string;
  // Position-specific columns vary by sheet
  [key: string]: any;
}

// Main projection import class
export class ProjectionImporter {
  private ffaData: FFAPlayerData[] = [];
  private fpsData: Map<Position, FPsPlayerData[]> = new Map();
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Import FFA raw stats from Excel data
   */
  async importFFAData(data: any[]): Promise<void> {
    try {
      this.ffaData = data
        .filter(row => row.player && row.player.trim() !== '')
        .map(row => ({
          player: String(row.player).trim(),
          team: String(row.team || '').trim().toUpperCase(),
          position: this.normalizePosition(String(row.position || '')),
          id: String(row.id || ''),
          // Convert numeric fields with fallback to 0
          pass_yds: this.parseNumber(row.pass_yds),
          pass_yds_sd: this.parseNumber(row.pass_yds_sd),
          pass_tds: this.parseNumber(row.pass_tds),
          pass_tds_sd: this.parseNumber(row.pass_tds_sd),
          pass_int: this.parseNumber(row.pass_int),
          pass_int_sd: this.parseNumber(row.pass_int_sd),
          rush_yds: this.parseNumber(row.rush_yds),
          rush_yds_sd: this.parseNumber(row.rush_yds_sd),
          rush_tds: this.parseNumber(row.rush_tds),
          rush_tds_sd: this.parseNumber(row.rush_tds_sd),
          rec_yds: this.parseNumber(row.rec_yds),
          rec_yds_sd: this.parseNumber(row.rec_yds_sd),
          rec_tds: this.parseNumber(row.rec_tds),
          rec_tds_sd: this.parseNumber(row.rec_tds_sd),
          fg_0019: this.parseNumber(row.fg_0019),
          fg_0019_sd: this.parseNumber(row.fg_0019_sd),
          fg_2029: this.parseNumber(row.fg_2029),
          fg_2029_sd: this.parseNumber(row.fg_2029_sd),
          fg_3039: this.parseNumber(row.fg_3039),
          fg_3039_sd: this.parseNumber(row.fg_3039_sd),
          fg_4049: this.parseNumber(row.fg_4049),
          fg_4049_sd: this.parseNumber(row.fg_4049_sd),
          fg_50: this.parseNumber(row.fg_50),
          fg_50_sd: this.parseNumber(row.fg_50_sd),
          xp: this.parseNumber(row.xp),
          xp_sd: this.parseNumber(row.xp_sd),
          dst_sacks: this.parseNumber(row.dst_sacks),
          dst_sacks_sd: this.parseNumber(row.dst_sacks_sd),
          dst_int: this.parseNumber(row.dst_int),
          dst_int_sd: this.parseNumber(row.dst_int_sd),
          dst_td: this.parseNumber(row.dst_td),
          dst_td_sd: this.parseNumber(row.dst_td_sd),
          fumbles_lost: this.parseNumber(row.fumbles_lost),
          fumbles_lost_sd: this.parseNumber(row.fumbles_lost_sd),
          injury_status: String(row.injury_status || ''),
          birthdate: String(row.birthdate || ''),
          draft_year: this.parseNumber(row.draft_year),
        }));

      console.log(`Imported ${this.ffaData.length} players from FFA data`);
    } catch (error) {
      this.errors.push(`FFA import error: ${error}`);
      throw error;
    }
  }

  /**
   * Import FPs projections from Excel data by position
   */
  async importFPsData(positionData: Map<string, any[]>): Promise<void> {
    try {
      for (const [sheetName, data] of positionData.entries()) {
        const position = this.normalizePosition(sheetName);
        if (!position) {
          this.warnings.push(`Unknown position sheet: ${sheetName}`);
          continue;
        }

        // Filter out empty rows and normalize data
        const cleanData = data
          .filter(row => row.Player && String(row.Player).trim() !== '' && !String(row.Player).startsWith('¬'))
          .map(row => {
            const normalized: FPsPlayerData = {
              Player: String(row.Player).trim(),
              Team: this.parseTeamFromFPs(String(row.Team || '')),
            };

            // Copy all other properties
            for (const [key, value] of Object.entries(row)) {
              if (key !== 'Player' && key !== 'Team') {
                normalized[key] = this.parseNumber(value);
              }
            }

            return normalized;
          });

        this.fpsData.set(position as Position, cleanData);
        console.log(`Imported ${cleanData.length} players for position ${position} from FPs data`);
      }
    } catch (error) {
      this.errors.push(`FPs import error: ${error}`);
      throw error;
    }
  }

  /**
   * Merge FFA and FPs data into enhanced Player objects
   */
  mergeProjections(): Player[] {
    const players: Player[] = [];
    const playerMap = new Map<string, Partial<Player>>();

    // First pass: process FFA data
    for (const ffaPlayer of this.ffaData) {
      const playerKey = this.createPlayerKey(ffaPlayer.player, ffaPlayer.team);
      const position = ffaPlayer.position as Position;
      
      if (!position) {
        this.warnings.push(`Invalid position for player ${ffaPlayer.player}: ${ffaPlayer.position}`);
        continue;
      }

      const stats = this.createPositionStats(position, ffaPlayer);
      if (!stats) {
        this.warnings.push(`Could not create stats for ${ffaPlayer.player} (${position})`);
        continue;
      }

      const player: Partial<Player> = {
        id: parseInt(ffaPlayer.id) || this.generatePlayerId(playerKey),
        name: ffaPlayer.player,
        position,
        team: ffaPlayer.team,
        stats,
        injuryStatus: this.parseInjuryStatus(ffaPlayer.injury_status) as InjuryStatus,
        drafted: false,
        projections: {
          points: 0, // Will be calculated later
          source: 'FFA',
          lastUpdated: Date.now(),
          confidence: this.calculateConfidence(stats),
        },
        points: 0, // Will be calculated
        vbd: 0,    // Will be calculated
      };

      playerMap.set(playerKey, player);
    }

    // Second pass: merge FPs data
    for (const [position, fpsPlayers] of this.fpsData.entries()) {
      for (const fpsPlayer of fpsPlayers) {
        // Handle high/low projections in FPs data
        const baseName = this.extractBaseName(fpsPlayer.Player);
        const team = fpsPlayer.Team;
        const playerKey = this.createPlayerKey(baseName, team);

        let existingPlayer = playerMap.get(playerKey);
        if (!existingPlayer) {
          // Create new player if not found in FFA data
          existingPlayer = {
            id: this.generatePlayerId(playerKey),
            name: baseName,
            position,
            team,
            stats: this.createDefaultStats(position),
            injuryStatus: 0, // Healthy
            drafted: false,
            projections: {
              points: 0,
              source: 'FPs',
              lastUpdated: Date.now(),
            },
            points: 0,
            vbd: 0,
          };
          playerMap.set(playerKey, existingPlayer);
        }

        // Merge FPs projections
        this.mergeFPsProjections(existingPlayer, fpsPlayer);
      }
    }

    // Convert to array and calculate final values
    for (const player of playerMap.values()) {
      if (player.projections && player.stats) {
        // Calculate fantasy points based on stats
        player.points = this.calculateFantasyPoints(player.stats);
        player.projections.points = player.points;
        
        players.push(player as Player);
      }
    }

    return players;
  }

  /**
   * Generate import result summary
   */
  getImportResult(players: Player[]): ProjectionImportResult {
    return {
      success: this.errors.length === 0,
      playersImported: players.length,
      errors: [...this.errors],
      warnings: [...this.warnings],
      source: 'FFA' as ProjectionSource,
      timestamp: Date.now(),
    };
  }

  // Helper methods
  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private normalizePosition(pos: string): Position {
    const position = pos.trim().toUpperCase();
    switch (position) {
      case 'QB': return 'QB';
      case 'RB': return 'RB';
      case 'WR': return 'WR';
      case 'TE': return 'TE';
      case 'K': return 'K';
      case 'DST':
      case 'DEF':
      case 'D/ST': return 'DST';
      default: 
        console.warn(`Unknown position: ${pos}, defaulting to QB`);
        return 'QB';
    }
  }

  private parseTeamFromFPs(teamField: string): string {
    // FPs data has format like "BUFhigh", "PHIlow", etc.
    const team = teamField.replace(/high|low|avg/gi, '').trim().toUpperCase();
    return team;
  }

  private createPlayerKey(name: string, team: string): string {
    return `${name.toLowerCase().trim()}:${team.toLowerCase().trim()}`;
  }

  private generatePlayerId(playerKey: string): number {
    // Generate a consistent ID from the player key
    let hash = 0;
    for (let i = 0; i < playerKey.length; i++) {
      const char = playerKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private parseInjuryStatus(status: string): number {
    if (!status) return 0; // Healthy
    const s = status.toUpperCase();
    switch (s) {
      case 'Q':
      case 'QUESTIONABLE': return 1;
      case 'D':
      case 'DOUBTFUL': return 2;
      case 'O':
      case 'OUT': return 3;
      case 'IR': return 4;
      case 'PUP': return 5;
      default: return 0;
    }
  }

  private createPositionStats(position: Position, ffaData: FFAPlayerData): PositionStats | null {
    switch (position) {
      case 'QB':
        return {
          type: 'QB',
          passYds: ffaData.pass_yds,
          passAtt: Math.max(1, ffaData.pass_yds / 7), // Estimate attempts from yards
          passCmp: Math.max(1, ffaData.pass_yds / 11), // Estimate completions
          passTDs: ffaData.pass_tds,
          passInt: ffaData.pass_int,
          rushYds: ffaData.rush_yds,
          rushAtt: Math.max(1, ffaData.rush_yds / 4.5), // Estimate attempts
          rushTDs: ffaData.rush_tds,
          fumbles: ffaData.fumbles_lost,
          passYdsSd: ffaData.pass_yds_sd,
          passTDsSd: ffaData.pass_tds_sd,
          passIntSd: ffaData.pass_int_sd,
          rushYdsSd: ffaData.rush_yds_sd,
          rushTDsSd: ffaData.rush_tds_sd,
        } as QBStats;

      case 'RB':
        return {
          type: 'RB',
          rushYds: ffaData.rush_yds,
          rushAtt: Math.max(1, ffaData.rush_yds / 4.5),
          rushTDs: ffaData.rush_tds,
          rec: Math.max(0, ffaData.rec_yds / 10), // Estimate receptions
          recYds: ffaData.rec_yds,
          recTDs: ffaData.rec_tds,
          fumbles: ffaData.fumbles_lost,
          rushYdsSd: ffaData.rush_yds_sd,
          rushTDsSd: ffaData.rush_tds_sd,
          recYdsSd: ffaData.rec_yds_sd,
          recTDsSd: ffaData.rec_tds_sd,
        } as RBStats;

      case 'WR':
        return {
          type: 'WR',
          rec: Math.max(0, ffaData.rec_yds / 12), // Estimate receptions
          recYds: ffaData.rec_yds,
          recTDs: ffaData.rec_tds,
          rushYds: ffaData.rush_yds,
          rushAtt: Math.max(0, ffaData.rush_yds / 4.5),
          rushTDs: ffaData.rush_tds,
          fumbles: ffaData.fumbles_lost,
          recYdsSd: ffaData.rec_yds_sd,
          recTDsSd: ffaData.rec_tds_sd,
          rushYdsSd: ffaData.rush_yds_sd,
        } as WRStats;

      case 'TE':
        return {
          type: 'TE',
          rec: Math.max(0, ffaData.rec_yds / 11), // Estimate receptions
          recYds: ffaData.rec_yds,
          recTDs: ffaData.rec_tds,
          fumbles: ffaData.fumbles_lost,
          recYdsSd: ffaData.rec_yds_sd,
          recTDsSd: ffaData.rec_tds_sd,
        } as TEStats;

      case 'K':
        return {
          type: 'K',
          fg: ffaData.fg_0019 + ffaData.fg_2029 + ffaData.fg_3039 + ffaData.fg_4049 + ffaData.fg_50,
          fga: Math.ceil((ffaData.fg_0019 + ffaData.fg_2029 + ffaData.fg_3039 + ffaData.fg_4049 + ffaData.fg_50) * 1.15),
          fg_0019: ffaData.fg_0019,
          fg_2029: ffaData.fg_2029,
          fg_3039: ffaData.fg_3039,
          fg_4049: ffaData.fg_4049,
          fg_50: ffaData.fg_50,
          xp: ffaData.xp,
          fg_0019Sd: ffaData.fg_0019_sd,
          fg_2029Sd: ffaData.fg_2029_sd,
          fg_3039Sd: ffaData.fg_3039_sd,
          fg_4049Sd: ffaData.fg_4049_sd,
          fg_50Sd: ffaData.fg_50_sd,
          xpSd: ffaData.xp_sd,
        } as KStats;

      case 'DST':
        return {
          type: 'DST',
          sacks: ffaData.dst_sacks,
          int: ffaData.dst_int,
          fumbleRec: Math.max(0, ffaData.dst_int / 2), // Estimate fumble recoveries
          fumbleForced: Math.max(0, ffaData.dst_int / 1.5), // Estimate forced fumbles
          td: ffaData.dst_td,
          safety: 0, // Not in FFA data
          pointsAllowed: 300, // Default estimate
          yardsAllowed: 5500, // Default estimate
          sacksSd: ffaData.dst_sacks_sd,
          intSd: ffaData.dst_int_sd,
          tdSd: ffaData.dst_td_sd,
        } as DSTStats;

      default:
        return null;
    }
  }

  private createDefaultStats(position: Position): PositionStats {
    switch (position) {
      case 'QB':
        return {
          type: 'QB',
          passYds: 0, passAtt: 0, passCmp: 0, passTDs: 0, passInt: 0,
          rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0,
        } as QBStats;
      case 'RB':
        return {
          type: 'RB',
          rushYds: 0, rushAtt: 0, rushTDs: 0,
          rec: 0, recYds: 0, recTDs: 0, fumbles: 0,
        } as RBStats;
      case 'WR':
        return {
          type: 'WR',
          rec: 0, recYds: 0, recTDs: 0,
          rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0,
        } as WRStats;
      case 'TE':
        return {
          type: 'TE',
          rec: 0, recYds: 0, recTDs: 0, fumbles: 0,
        } as TEStats;
      case 'K':
        return {
          type: 'K',
          fg: 0, fga: 0, fg_0019: 0, fg_2029: 0, fg_3039: 0, fg_4049: 0, fg_50: 0, xp: 0,
        } as KStats;
      case 'DST':
        return {
          type: 'DST',
          sacks: 0, int: 0, fumbleRec: 0, fumbleForced: 0, td: 0, safety: 0,
          pointsAllowed: 0, yardsAllowed: 0,
        } as DSTStats;
    }
  }

  private calculateConfidence(stats: PositionStats): number {
    // Calculate confidence based on standard deviations
    // Higher SD = lower confidence
    let totalVariance = 0;
    let statCount = 0;

    switch (stats.type) {
      case 'QB':
        if (stats.passYdsSd) { totalVariance += stats.passYdsSd; statCount++; }
        if (stats.passTDsSd) { totalVariance += stats.passTDsSd; statCount++; }
        if (stats.rushYdsSd) { totalVariance += stats.rushYdsSd; statCount++; }
        break;
      case 'RB':
        if (stats.rushYdsSd) { totalVariance += stats.rushYdsSd; statCount++; }
        if (stats.recYdsSd) { totalVariance += stats.recYdsSd; statCount++; }
        break;
      // Add other positions as needed
    }

    if (statCount === 0) return 0.5; // Default confidence
    const avgVariance = totalVariance / statCount;
    return Math.max(0.1, Math.min(0.9, 1 - (avgVariance / 100))); // Scale to 0.1-0.9
  }

  private mergeFPsProjections(player: Partial<Player>, fpsData: FPsPlayerData): void {
    // Extract high/low values from FPs data
    // Note: FPs data structure varies by position, this is a simplified approach
    if (fpsData.FPTS) {
      const points = this.parseNumber(fpsData.FPTS);
      if (!player.projections) {
        player.projections = {
          points,
          source: 'FPs',
          lastUpdated: Date.now(),
        };
      } else {
        // Merge with existing FFA data
        player.projections.pointsHigh = Math.max(points, player.projections.points);
        player.projections.pointsLow = Math.min(points, player.projections.points);
      }
    }
  }

  private extractBaseName(playerName: string): string {
    // Remove any suffixes that might indicate high/low projections
    return playerName.replace(/\s*(high|low|avg)$/gi, '').trim();
  }

  private calculateFantasyPoints(stats: PositionStats): number {
    // Basic fantasy point calculation - this should use actual scoring rules
    // For now, use simplified standard scoring
    switch (stats.type) {
      case 'QB':
        return (stats.passYds * 0.04) + (stats.passTDs * 4) - (stats.passInt * 2) + 
               (stats.rushYds * 0.1) + (stats.rushTDs * 6) - (stats.fumbles * 2);
      case 'RB':
        return (stats.rushYds * 0.1) + (stats.rushTDs * 6) + 
               (stats.recYds * 0.1) + (stats.recTDs * 6) + (stats.rec * 0.5) - (stats.fumbles * 2);
      case 'WR':
        return (stats.recYds * 0.1) + (stats.recTDs * 6) + (stats.rec * 0.5) +
               (stats.rushYds * 0.1) + (stats.rushTDs * 6) - (stats.fumbles * 2);
      case 'TE':
        return (stats.recYds * 0.1) + (stats.recTDs * 6) + (stats.rec * 0.5) - (stats.fumbles * 2);
      case 'K':
        return (stats.xp * 1) + (stats.fg_0019 * 3) + (stats.fg_2029 * 3) + 
               (stats.fg_3039 * 3) + (stats.fg_4049 * 4) + (stats.fg_50 * 5);
      case 'DST':
        return (stats.sacks * 1) + (stats.int * 2) + (stats.fumbleRec * 2) + 
               (stats.td * 6) + (stats.safety * 2);
      default:
        return 0;
    }
  }
}

/**
 * Utility function to convert legacy players to enhanced format
 */
export function migrateLegacyPlayer(legacy: LegacyPlayer): Player {
  const defaultStats = createDefaultStatsForPosition(legacy.position);
  
  return {
    ...legacy,
    projections: {
      points: legacy.points,
      source: 'custom',
      lastUpdated: Date.now(),
    },
    stats: defaultStats,
    valueScore: legacy.vbd,
  };
}

/**
 * Create default stats for a given position
 */
function createDefaultStatsForPosition(position: Position): PositionStats {
  switch (position) {
    case 'QB':
      return {
        type: 'QB',
        passYds: 0, passAtt: 0, passCmp: 0, passTDs: 0, passInt: 0,
        rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0,
      } as QBStats;
    case 'RB':
      return {
        type: 'RB',
        rushYds: 0, rushAtt: 0, rushTDs: 0,
        rec: 0, recYds: 0, recTDs: 0, fumbles: 0,
      } as RBStats;
    case 'WR':
      return {
        type: 'WR',
        rec: 0, recYds: 0, recTDs: 0,
        rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0,
      } as WRStats;
    case 'TE':
      return {
        type: 'TE',
        rec: 0, recYds: 0, recTDs: 0, fumbles: 0,
      } as TEStats;
    case 'K':
      return {
        type: 'K',
        fg: 0, fga: 0, fg_0019: 0, fg_2029: 0, fg_3039: 0, fg_4049: 0, fg_50: 0, xp: 0,
      } as KStats;
    case 'DST':
      return {
        type: 'DST',
        sacks: 0, int: 0, fumbleRec: 0, fumbleForced: 0, td: 0, safety: 0,
        pointsAllowed: 0, yardsAllowed: 0,
      } as DSTStats;
  }
}