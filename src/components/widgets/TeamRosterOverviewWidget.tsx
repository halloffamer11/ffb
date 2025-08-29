import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetContainer from './WidgetContainer';
import { useUnifiedStore } from '../../stores/unified-store';

const OverviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${props => theme('spacing.xs')};
`;

const TeamGridContainer = styled.div`
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
`;

const TeamGrid = styled.div<{ $teamCount: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$teamCount}, minmax(120px, 1fr));
  gap: 2px;
  min-width: ${props => props.$teamCount * 120}px;
  height: 100%;
`;

const TeamColumn = styled.div<{ $isUserTeam?: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  background: ${props => props.$isUserTeam ? theme('colors.accent') + '10' : theme('colors.surface1')};
  overflow: hidden;
  min-height: 180px;
`;

const TeamHeader = styled.div<{ $isUserTeam?: boolean }>`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => props.$isUserTeam ? theme('colors.accent') : theme('colors.surface2')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  text-align: center;
  position: relative;
`;

const TeamName = styled.div<{ $isUserTeam?: boolean }>`
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => props.$isUserTeam ? theme('colors.background') : theme('colors.text1')};
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OwnerName = styled.div<{ $isUserTeam?: boolean }>`
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => props.$isUserTeam ? theme('colors.background') + 'CC' : theme('colors.text2')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RosterStatus = styled.div`
  padding: 2px ${props => theme('spacing.xs')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.text2')};
  text-align: center;
  background: ${props => theme('colors.surface2')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const PositionSlotsContainer = styled.div<{ $expanded: boolean }>`
  flex: 1;
  overflow: hidden;
  transition: max-height 0.2s ease;
  max-height: ${props => props.$expanded ? '200px' : '0px'};
`;

const PositionSlots = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2px;
  gap: 1px;
`;

const PositionRow = styled.div<{ $filled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1px 4px;
  font-size: 10px;
  background: ${props => props.$filled ? theme('colors.success') + '20' : theme('colors.surface2')};
  border: 1px solid ${props => props.$filled ? theme('colors.success') + '40' : theme('colors.border1')};
  border-radius: 2px;
  min-height: 16px;
`;

const PositionLabel = styled.span<{ $filled: boolean }>`
  font-weight: ${props => theme('typography.fontWeight.medium')};
  color: ${props => props.$filled ? theme('colors.success') : theme('colors.textMuted')};
  font-size: 9px;
`;

const SlotCount = styled.span<{ $needsMore: boolean }>`
  font-size: 8px;
  color: ${props => props.$needsMore ? theme('colors.error') : theme('colors.text2')};
  font-family: ${props => theme('typography.fontFamily.mono')};
`;

const ExpandToggle = styled.button<{ $expanded: boolean }>`
  width: 100%;
  padding: 2px;
  background: ${props => theme('colors.surface2')};
  border: none;
  border-top: 1px solid ${props => theme('colors.border1')};
  font-size: 10px;
  color: ${props => theme('colors.text2')};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => theme('colors.surface1')};
  }
  
  &::after {
    content: '${props => props.$expanded ? '▲' : '▼'}';
    margin-left: 4px;
  }
`;

const CompactView = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => theme('spacing.sm')};
`;

const FilledSlots = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  align-items: center;
`;

const SlotIndicator = styled.div<{ $filled: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${props => props.$filled ? theme('colors.success') : theme('colors.border1')};
  border: 1px solid ${props => props.$filled ? theme('colors.success') : theme('colors.border2')};
`;

// TeamRosterData structure is inferred from the map function

interface TeamRosterOverviewWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
  onPopOut?: () => void;
}

const TeamRosterOverviewWidget = React.memo<TeamRosterOverviewWidgetProps>(function TeamRosterOverviewWidget({ 
  editMode = false, 
  onRemove,
  onPopOut 
}) {
  const store = useUnifiedStore();
  const { settings, players, picks } = store;
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Calculate roster data for all teams
  const teamRosterData = useMemo(() => {
    const settingsAny = settings as any; // Type assertion to access dynamic properties
    const owners = settingsAny?.owners || [];
    const userTeamId = Number(settingsAny?.userTeamId || 1);
    const requiredPositions = {
      QB: Number(settingsAny?.roster?.QB || settingsAny?.positions?.QB || 1),
      RB: Number(settingsAny?.roster?.RB || settingsAny?.positions?.RB || 2),
      WR: Number(settingsAny?.roster?.WR || settingsAny?.positions?.WR || 2),
      TE: Number(settingsAny?.roster?.TE || settingsAny?.positions?.TE || 1),
      K: Number(settingsAny?.roster?.K || settingsAny?.positions?.K || 1),
      DST: Number(settingsAny?.roster?.DST || settingsAny?.positions?.DST || 1)
    };

    if (owners.length === 0) {
      return [];
    }

    return owners.map((owner: any) => {
      const teamId = Number(owner.id);
      
      // Group drafted players by position for this team
      const teamPicks = (picks || []).filter(p => Number(p.teamId) === teamId);
      const rosterByPosition = new Map<string, number>();
      
      // Initialize all positions with 0
      Object.keys(requiredPositions).forEach(pos => {
        rosterByPosition.set(pos, 0);
      });

      // Count players by position
      teamPicks.forEach(pick => {
        const pickAny = pick as any; // Type assertion for dynamic properties
        const player = (players || []).find(p => 
          Number(p.id) === Number(pickAny.playerId || pick.player?.id) || 
          String(p.name).toLowerCase() === String(pickAny.playerName || pick.player?.name || '').toLowerCase()
        );
        
        if (player?.position) {
          const currentCount = rosterByPosition.get(player.position) || 0;
          rosterByPosition.set(player.position, currentCount + 1);
        }
      });

      // Calculate totals
      const totalRequired = Object.values(requiredPositions).reduce((sum, count) => sum + count, 0);
      const totalFilled = Array.from(rosterByPosition.values()).reduce((sum, count) => sum + count, 0);

      return {
        id: teamId,
        teamName: owner.team || `Team ${teamId}`,
        ownerName: owner.name || `Owner ${teamId}`,
        roster: rosterByPosition,
        totalSlots: totalRequired,
        filledSlots: totalFilled,
        isUserTeam: teamId === userTeamId
      };
    }).sort((a, b) => {
      // Sort user team first, then by team ID
      if (a.isUserTeam) return -1;
      if (b.isUserTeam) return 1;
      return a.id - b.id;
    });
  }, [settings, players, picks, refreshKey]);

  const toggleTeamExpansion = (teamId: number) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const settingsAny = settings as any; // Type assertion for consistent access
  const requiredPositions = {
    QB: Number(settingsAny?.roster?.QB || settingsAny?.positions?.QB || 1),
    RB: Number(settingsAny?.roster?.RB || settingsAny?.positions?.RB || 2),
    WR: Number(settingsAny?.roster?.WR || settingsAny?.positions?.WR || 2),
    TE: Number(settingsAny?.roster?.TE || settingsAny?.positions?.TE || 1),
    K: Number(settingsAny?.roster?.K || settingsAny?.positions?.K || 1),
    DST: Number(settingsAny?.roster?.DST || settingsAny?.positions?.DST || 1)
  };

  if (teamRosterData.length === 0) {
    return (
      <WidgetContainer title="Team Roster Overview" widgetId="team-roster-overview" editMode={editMode} onRemove={onRemove} onPopOut={onPopOut}>
        <OverviewContainer>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No team data available. Configure league settings to see roster overview.
          </div>
        </OverviewContainer>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Team Roster Overview" widgetId="team-roster-overview" editMode={editMode} onRemove={onRemove} onPopOut={onPopOut}>
      <OverviewContainer key={refreshKey}>
        <TeamGridContainer>
          <TeamGrid $teamCount={teamRosterData.length}>
            {teamRosterData.map((team: any) => {
              const isExpanded = expandedTeams.has(team.id);
              const progressPercentage = team.totalSlots > 0 ? (team.filledSlots / team.totalSlots) * 100 : 0;

              return (
                <TeamColumn key={team.id} $isUserTeam={team.isUserTeam}>
                  <TeamHeader $isUserTeam={team.isUserTeam}>
                    <TeamName $isUserTeam={team.isUserTeam} title={team.teamName}>
                      {team.teamName}
                    </TeamName>
                    <OwnerName $isUserTeam={team.isUserTeam} title={team.ownerName}>
                      {team.ownerName}
                    </OwnerName>
                  </TeamHeader>
                  
                  <RosterStatus>
                    {team.filledSlots}/{team.totalSlots} ({progressPercentage.toFixed(0)}%)
                  </RosterStatus>

                  {!isExpanded ? (
                    <CompactView>
                      <FilledSlots>
                        {Array.from({ length: team.totalSlots }, (_, i) => (
                          <SlotIndicator key={i} $filled={i < team.filledSlots} />
                        ))}
                      </FilledSlots>
                    </CompactView>
                  ) : (
                    <PositionSlotsContainer $expanded={isExpanded}>
                      <PositionSlots>
                        {Object.entries(requiredPositions).map(([position, required]) => {
                          const filled = team.roster.get(position) || 0;
                          const needsMore = filled < required;
                          
                          return (
                            <PositionRow key={position} $filled={filled > 0}>
                              <PositionLabel $filled={filled > 0}>
                                {position}
                              </PositionLabel>
                              <SlotCount $needsMore={needsMore}>
                                {filled}/{required}
                              </SlotCount>
                            </PositionRow>
                          );
                        })}
                      </PositionSlots>
                    </PositionSlotsContainer>
                  )}

                  <ExpandToggle 
                    $expanded={isExpanded}
                    onClick={() => toggleTeamExpansion(team.id)}
                    title={isExpanded ? "Collapse details" : "Expand details"}
                  >
                    Details
                  </ExpandToggle>
                </TeamColumn>
              );
            })}
          </TeamGrid>
        </TeamGridContainer>
      </OverviewContainer>
    </WidgetContainer>
  );
});

export default TeamRosterOverviewWidget;