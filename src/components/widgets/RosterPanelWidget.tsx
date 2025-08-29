import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetContainer from './WidgetContainer';
import { useUnifiedStore } from '../../stores/unified-store';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// Styled components
const RosterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => theme('spacing.sm')};
  height: 100%;
`;

const RosterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const TeamInfo = styled.div`
  flex: 1;
  color: ${props => theme('colors.text2')};
  
  .team-name {
    font-weight: ${props => theme('typography.fontWeight.medium')};
    color: ${props => theme('colors.text1')};
  }
`;

const PositionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${props => theme('spacing.sm')};
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* Allow shrinking in flex container */
  
  /* Adaptive layout based on available space:
   * 12 cols (720px+) → 6×1 horizontal
   * 6 cols (420px)   → 3×2 grid (default)
   * 4 cols (280px)   → 2×3 grid  
   * 2 cols (140px)   → 1×6 vertical
   */
`;

const PositionCard = styled.div`
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  background: ${props => theme('colors.surface2')};
  overflow: hidden;
  min-height: 120px;
  display: flex;
  flex-direction: column;
`;

const PositionHeader = styled.div<{ $needsMore: boolean }>`
  padding: ${props => theme('spacing.sm')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => theme('colors.surface1')};
  
  .position-name {
    color: ${props => theme('colors.text1')};
  }
  
  .position-count {
    font-size: ${props => theme('typography.fontSize.xs')};
    color: ${props => props.$needsMore ? theme('colors.error') : theme('colors.text2')};
  }
`;

const PlayerList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const PlayerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.sm')};
  font-size: ${props => theme('typography.fontSize.sm')};
  border-bottom: 1px solid ${props => theme('colors.border1')}30;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => theme('colors.surface1')};
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.xs')};
  flex: 1;
`;

const InjuryStatus = styled.div<{ status: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${props => {
    const colors = {
      0: theme('colors.success'),  // HEALTHY
      1: theme('colors.warning'),  // Q
      2: '#f97316',                   // D (orange)
      3: theme('colors.error'),    // O
      4: '#b91c1c',                   // IR (dark red)
      5: theme('colors.error'),    // PUP
      6: theme('colors.textMuted') // NA
    };
    return colors[props.status] || colors[6];
  }};
`;

const PlayerName = styled.span`
  color: ${props => theme('colors.text1')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
`;

const PlayerStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
`;

const PlayerPoints = styled.span`
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.text2')};
  font-family: ${props => theme('typography.fontFamily.mono')};
`;

const RemoveButton = styled(Button)`
  padding: ${props => theme('spacing.xs')};
  font-size: ${props => theme('typography.fontSize.xs')};
`;

const EmptyPosition = styled.div`
  padding: ${props => theme('spacing.lg')};
  text-align: center;
  color: ${props => theme('colors.textMuted')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const ByeConflictsAlert = styled.div`
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.warning')}15;
  border: 1px solid ${props => theme('colors.warning')};
  border-radius: ${props => theme('radii.sm')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.warning')};
  margin-top: ${props => theme('spacing.sm')};
`;

// Utility functions (migrated from roster.js and core/roster.js)
function playerKey(p: any): string {
  return String(p?.id ?? p?.name ?? '').toLowerCase();
}

function pickKey(p: any): string {
  return String(p?.playerId ?? p?.playerName ?? '').toLowerCase();
}

function groupRosterByPosition(players: any[], picks: any[], teamId: number): Map<string, any[]> {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  
  const map = new Map();
  for (const p of (Array.isArray(players) ? players : [])) {
    if (!draftedByTeam.has(playerKey(p))) continue;
    const list = map.get(p.position) || [];
    list.push(p);
    map.set(p.position, list);
  }
  
  // Sort within position by name
  for (const [pos, list] of map.entries()) {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    map.set(pos, list);
  }
  
  return map;
}

function computeTeamProjection(players: any[], picks: any[], teamId: number): number {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  
  let sum = 0;
  for (const p of (Array.isArray(players) ? players : [])) {
    if (draftedByTeam.has(playerKey(p))) sum += Number(p.points || 0);
  }
  return sum;
}

function computeByeConflicts(players: any[], picks: any[], teamId: number): Map<number, number> {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  
  const weekCounts = new Map();
  for (const p of (Array.isArray(players) ? players : [])) {
    if (!draftedByTeam.has(playerKey(p))) continue;
    const w = Number(p.byeWeek || 0);
    if (!Number.isFinite(w) || w <= 0) continue;
    weekCounts.set(w, (weekCounts.get(w) || 0) + 1);
  }
  
  const conflicts = new Map();
  for (const [w, c] of weekCounts.entries()) {
    if (c >= 2) conflicts.set(w, c);
  }
  return conflicts;
}

function requiredStartersByPos(settings: any) {
  const r = (settings && settings.roster) || {};
  return { QB: r.QB||0, RB: r.RB||0, WR: r.WR||0, TE: r.TE||0, K: r.K||0, DST: r.DST||0 };
}

function getInjuryStatusDisplay(status: number) {
  const map = {
    0: { label: 'HEALTHY', color: 'success' },
    1: { label: 'Q', color: 'warning' },
    2: { label: 'D', color: 'error' },
    3: { label: 'O', color: 'error' },
    4: { label: 'IR', color: 'error' },
    5: { label: 'PUP', color: 'error' },
    6: { label: 'NA', color: 'default' }
  };
  return map[Number(status) || 0] || map[6];
}

interface RosterPanelWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const RosterPanelWidget = React.memo<RosterPanelWidgetProps>(function RosterPanelWidget({ editMode = false, onRemove }) {
  const store = useUnifiedStore();
  const { settings, players, picks } = store;
  const [lastRemoved, setLastRemoved] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get user team ID
  const teamId = Number(settings?.userTeamId || 1);
  
  // Compute roster data
  const rosterByPosition = groupRosterByPosition(players, picks, teamId);
  const teamProjection = computeTeamProjection(players, picks, teamId);
  const byeConflicts = computeByeConflicts(players, picks, teamId);
  const requiredStarters = requiredStartersByPos(settings);
  
  // Get team info
  const owners = settings?.owners || [];
  const teamInfo = owners.find(o => Number(o.id) === teamId);
  const teamLabel = teamInfo ? `${teamInfo.team} (${teamInfo.name})` : `Team ${teamId}`;
  
  // Listen for state changes to refresh
  useEffect(() => {
    function handleStateChange() {
      setRefreshKey(prev => prev + 1);
    }
    
    window.addEventListener('workspace:state-changed', handleStateChange);
    window.addEventListener('workspace:players-changed', handleStateChange);
    
    return () => {
      window.removeEventListener('workspace:state-changed', handleStateChange);
      window.removeEventListener('workspace:players-changed', handleStateChange);
    };
  }, []);
  
  // Remove pick function
  const removePick = (playerId: number) => {
    try {
      // Find the pick to remove
      const pickToRemove = picks.find(p => 
        Number(p.playerId) === Number(playerId) && Number(p.teamId) === teamId
      );
      
      if (!pickToRemove) {
        console.warn('Pick not found for removal:', playerId);
        return;
      }
      
      // Store for undo
      setLastRemoved(pickToRemove);
      
      // Use unified store to undraft player
      const pickIndex = picks.findIndex(p => p.player?.id === playerId && p.teamId === teamId);
      if (pickIndex >= 0) {
        store.undraftPlayer(pickIndex);
      }
      
    } catch (error) {
      console.error('Failed to remove pick:', error);
    }
  };
  
  // Undo last removal
  const undoRemoval = () => {
    if (!lastRemoved) return;
    
    try {
      // Re-draft the player using unified store
      const player = lastRemoved.player || lastRemoved;
      store.draftPlayer(player, lastRemoved.teamId, lastRemoved.price);
      
      setLastRemoved(null);
    } catch (error) {
      console.error('Failed to undo removal:', error);
    }
  };
  
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  
  return (
    <WidgetContainer title="My Roster" widgetId="roster" editMode={editMode} onRemove={onRemove}>
      <RosterContainer key={refreshKey}>
        <RosterHeader>
          <TeamInfo>
            <span className="team-name">{teamLabel}</span> · Team projection: {teamProjection.toFixed(1)}
          </TeamInfo>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={undoRemoval}
            disabled={!lastRemoved}
          >
            Undo last removal
          </Button>
        </RosterHeader>
        
        <PositionGrid>
          {positions.map(position => {
            const positionPlayers = rosterByPosition.get(position) || [];
            const have = positionPlayers.length;
            const need = requiredStarters[position as keyof typeof requiredStarters] || 0;
            const needsMore = have < need;
            
            return (
              <PositionCard key={position}>
                <PositionHeader $needsMore={needsMore}>
                  <span className="position-name">{position}</span>
                  <span className="position-count">{have}/{need}</span>
                </PositionHeader>
                
                <PlayerList>
                  {positionPlayers.length > 0 ? (
                    positionPlayers.map(player => {
                      const injuryStatus = getInjuryStatusDisplay(player.injuryStatus);
                      return (
                        <PlayerRow key={player.id}>
                          <PlayerInfo>
                            <InjuryStatus 
                              status={player.injuryStatus || 0} 
                              title={injuryStatus.label}
                            />
                            <PlayerName>{player.name}</PlayerName>
                          </PlayerInfo>
                          
                          <PlayerStats>
                            <PlayerPoints>
                              {player.points?.toFixed?.(1) || ''}
                            </PlayerPoints>
                            <RemoveButton
                              size="sm"
                              variant="outline"
                              onClick={() => removePick(player.id)}
                            >
                              Remove
                            </RemoveButton>
                          </PlayerStats>
                        </PlayerRow>
                      );
                    })
                  ) : (
                    <EmptyPosition>—</EmptyPosition>
                  )}
                </PlayerList>
              </PositionCard>
            );
          })}
        </PositionGrid>
        
        {byeConflicts.size > 0 && (
          <ByeConflictsAlert>
            Bye conflicts: {Array.from(byeConflicts.entries())
              .map(([week, count]) => `Week ${week}: ${count}`)
              .join(', ')}
          </ByeConflictsAlert>
        )}
      </RosterContainer>
    </WidgetContainer>
  );
});

export default RosterPanelWidget;