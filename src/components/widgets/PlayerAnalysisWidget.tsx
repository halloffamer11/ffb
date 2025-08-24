import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetContainer from './WidgetContainer';
import { useDraftStore } from '../../stores/draftStore';
import { Badge } from '../ui/Badge';
import { Player, DraftPick, LeagueSettings } from '../../types';

// Styled components
const AnalysisContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => theme('spacing.sm')};
  height: 100%;
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
`;

const PlayerName = styled.div`
  font-size: ${props => theme('typography.fontSize.base')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  
  .player-meta {
    font-size: ${props => theme('typography.fontSize.sm')};
    font-weight: ${props => theme('typography.fontWeight.normal')};
    color: ${props => theme('colors.text2')};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => theme('spacing.sm')};
  flex: 1;
`;

const MetricCard = styled.div`
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  
  .label {
    font-size: ${props => theme('typography.fontSize.xs')};
    color: ${props => theme('colors.text2')};
    margin-bottom: ${props => theme('spacing.xs')};
  }
  
  .value {
    font-size: ${props => theme('typography.fontSize.lg')};
    font-weight: ${props => theme('typography.fontWeight.semibold')};
    color: ${props => theme('colors.text1')};
  }
`;

const VBDCard = styled(MetricCard)<{ vbdValue: number }>`
  .value {
    color: ${props => {
      const v = props.vbdValue;
      if (!Number.isFinite(v)) return theme('colors.text2');
      if (v >= 20) return theme('colors.success');
      if (v >= 5) return theme('colors.warning');
      return theme('colors.error');
    }};
  }
`;

const BidRecommendationCard = styled.div`
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  grid-column: 1 / -1;
  
  .label {
    font-size: ${props => theme('typography.fontSize.xs')};
    color: ${props => theme('colors.text2')};
    margin-bottom: ${props => theme('spacing.xs')};
  }
  
  .bid-details {
    display: flex;
    flex-wrap: wrap;
    gap: ${props => theme('spacing.sm')};
    font-size: ${props => theme('typography.fontSize.sm')};
    
    .bid-item {
      display: flex;
      align-items: center;
      gap: ${props => theme('spacing.xs')};
      
      .bid-label {
        color: ${props => theme('colors.text2')};
      }
      
      .bid-value {
        font-weight: ${props => theme('typography.fontWeight.semibold')};
        color: ${props => theme('colors.text1')};
      }
      
      &.recommended .bid-value {
        color: ${props => theme('colors.accent')};
        font-weight: ${props => theme('typography.fontWeight.bold')};
      }
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${props => theme('spacing.lg')};
  text-align: center;
  color: ${props => theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

// Utility functions (migrated from analysis.js and related core modules)
import { baselineForPosition, calculatePlayerVBD } from '../../core/vbd';
import { stdDev } from '../../core/tiers';
import { 
  calculateMaxBid, 
  calculateRemainingBudget, 
  countSpotsRemaining 
} from '../../core/budget';

function getInjuryBadgeProps(player: Player) {
  const s = String(player?.injuryStatus ?? 'NA').toUpperCase();
  const code = (s === '0' || s === 'HEALTHY') ? 0 : 
               (s === 'Q' || s === '1') ? 1 : 
               (s === 'D' || s === '2') ? 2 : 
               (s === 'O' || s === '3') ? 3 : 
               (s === 'IR' || s === '4') ? 4 : 
               (s === 'PUP' || s === '5') ? 5 : 6;
  
  const map = {
    0: { label: 'Healthy', variant: 'success' },
    1: { label: 'Q', variant: 'warning' },
    2: { label: 'D', variant: 'error' },
    3: { label: 'Out', variant: 'error' },
    4: { label: 'IR', variant: 'error' },
    5: { label: 'PUP', variant: 'error' },
    6: { label: 'NA', variant: 'default' }
  };
  
  return map[code] || map[6];
}

function computeBidRecommendation(player: Player, leagueSettings: LeagueSettings, picks: DraftPick[]) {
  const userTeamId = leagueSettings?.userTeamId || 1;
  const remaining = calculateRemainingBudget(userTeamId, leagueSettings, picks);
  const spots = countSpotsRemaining(userTeamId, leagueSettings, picks);
  const maxBid = calculateMaxBid(remaining, spots, Number(leagueSettings.minBid ?? 1));
  
  // Conservative: recommend between avg-per-spot and maxBid bounded by VBD signal
  const avg = spots > 0 ? (remaining / spots) : remaining;
  const v = Number(player?.vbd || 0);
  
  // Scale by VBD tiers: high VBD → closer to max
  const weight = v >= 20 ? 0.9 : v >= 10 ? 0.7 : v >= 5 ? 0.5 : 0.3;
  const rec = Math.max(
    Number(leagueSettings.minBid ?? 1), 
    Math.min(maxBid, Math.round(avg * (0.8 + weight * 0.4)))
  );
  
  return { 
    remaining, 
    spots, 
    maxBid, 
    recommended: rec, 
    avgPerSpot: spots > 0 ? (remaining / spots) : remaining 
  };
}

interface PlayerViewModel {
  id?: number;
  name: string;
  position: string;
  team: string;
  points: number;
  vbd: number | null;
  tier: number | null;
  adp: number | null;
  baseline?: number;
  zScore?: number;
  bid?: {
    min: number;
    max: number;
    target: number;
  };
  injuryBadge: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'position';
  };
  bidRecommendation: {
    min: number;
    max: number;
    target: number;
  };
}

function createPlayerViewModel(player: Player, players: Player[], leagueSettings: LeagueSettings, picks: DraftPick[]): PlayerViewModel {
  if (!player) return null;
  
  const byPos = players.filter(p => 
    String(p.position || '').toUpperCase() === String(player.position || '').toUpperCase()
  );
  
  const league = { 
    teams: Number(leagueSettings.teams || 12), 
    starters: leagueSettings.roster || {} 
  };
  
  const withVbd = calculatePlayerVBD(players, league);
  const hasId = player.id != null && player.id !== '';
  const p2 = withVbd.find(p => 
    hasId ? String(p.id) === String(player.id) : 
           String(p.name).toLowerCase() === String(player.name).toLowerCase()
  ) || player;
  
  const baseline = baselineForPosition(players, String(player.position || ''), league);
  const vbd = Number(p2.vbd || ((Number(p2.points || 0)) - baseline));
  const vbdVals = byPos.map(p => 
    p.vbd != null ? Number(p.vbd) : (Number(p.points || 0) - baseline)
  );
  const sigma = stdDev(vbdVals);
  const z = sigma > 0 ? (vbd / sigma) : 0;
  const bid = computeBidRecommendation({ ...p2, vbd }, leagueSettings, picks);
  
  return {
    id: p2.id,
    name: p2.name,
    team: p2.team,
    position: p2.position,
    points: Number(p2.points || 0),
    vbd,
    baseline,
    zScore: Number.isFinite(z) ? Number(z.toFixed(2)) : 0,
    injuryBadge: getInjuryBadgeProps(p2),
    bid
  };
}

interface PlayerAnalysisWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

export default function PlayerAnalysisWidget({ editMode = false, onRemove }: PlayerAnalysisWidgetProps) {
  const { selectedPlayer, players, settings, picks } = useDraftStore();
  const [playerViewModel, setPlayerViewModel] = useState<PlayerViewModel | null>(null);
  
  // Update analysis when selected player or data changes
  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerViewModel(null);
      return;
    }
    
    const vm = createPlayerViewModel(selectedPlayer, players, settings, picks);
    setPlayerViewModel(vm);
    
    // Debug logging
    if (vm) {
      console.debug('[analysis] vm', { 
        id: vm.id, 
        name: vm.name, 
        pos: vm.position, 
        vbd: vm.vbd 
      });
    }
  }, [selectedPlayer, players, settings, picks]);
  
  // Listen for cross-widget player selection events
  useEffect(() => {
    function handlePlayerSelection(e: Event) {
      if (e.detail.source === 'analysis') return; // Ignore our own events
      
      const player = e.detail.player;
      if (player) {
        // Player will be set via the store, which triggers the above useEffect
      }
    }
    
    // Modern cross-widget events
    window.addEventListener('player:selected', handlePlayerSelection as EventListener);
    
    // Legacy iframe message support
    function handleMessage(e: MessageEvent) {
      const data = e?.data;
      if (!data || data.type !== 'player.selected') return;
      
      const pid = data.payload?.id;
      const pname = data.payload?.name;
      
      let player = null;
      if (pid != null && pid !== '') {
        player = players.find(p => String(p.id) === String(pid));
      }
      if (!player && pname) {
        player = players.find(p => 
          String(p.name).toLowerCase() === String(pname).toLowerCase()
        );
      }
      
      if (player) {
        // Set via store which will trigger the analysis update
        // Note: We need to use the store's setSelectedPlayer action
      }
    }
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('player:selected', handlePlayerSelection as EventListener);
      window.removeEventListener('message', handleMessage);
    };
  }, [players]);
  
  if (!playerViewModel) {
    return (
      <WidgetContainer title="Player Analysis" widgetId="player-analysis" editMode={editMode} onRemove={onRemove}>
        <EmptyState>
          Select a player from Search & Select to see analysis.
        </EmptyState>
      </WidgetContainer>
    );
  }
  
  const vm = playerViewModel;
  
  return (
    <WidgetContainer title="Player Analysis" widgetId="player-analysis" editMode={editMode}>
      <AnalysisContainer>
        <PlayerHeader>
          <PlayerName>
            {vm.name}{' '}
            <span className="player-meta">
              · {vm.team} · {vm.position}
            </span>
          </PlayerName>
          <Badge 
            variant={vm.injuryBadge.variant as 'default' | 'success' | 'warning' | 'danger'}
            size="sm"
          >
            {vm.injuryBadge.label}
          </Badge>
        </PlayerHeader>
        
        <MetricsGrid>
          <MetricCard>
            <div className="label">Projected Points</div>
            <div className="value">{vm.points.toFixed(1)}</div>
          </MetricCard>
          
          <VBDCard vbdValue={vm.vbd}>
            <div className="label">VBD vs Baseline ({vm.position})</div>
            <div className="value">{vm.vbd.toFixed(1)}</div>
          </VBDCard>
          
          <MetricCard>
            <div className="label">Baseline Points ({vm.position})</div>
            <div className="value">{vm.baseline.toFixed(1)}</div>
          </MetricCard>
          
          <MetricCard>
            <div className="label">Relative Strength (z-score)</div>
            <div className="value">{vm.zScore}</div>
          </MetricCard>
          
          <BidRecommendationCard>
            <div className="label">Bid Recommendation</div>
            <div className="bid-details">
              <div className="bid-item recommended">
                <span className="bid-label">Recommended:</span>
                <span className="bid-value">${vm.bid.recommended}</span>
              </div>
              <div className="bid-item">
                <span className="bid-label">Max Bid:</span>
                <span className="bid-value">${vm.bid.maxBid}</span>
              </div>
              <div className="bid-item">
                <span className="bid-label">Remaining:</span>
                <span className="bid-value">${vm.bid.remaining}</span>
              </div>
              <div className="bid-item">
                <span className="bid-label">Avg/Spot:</span>
                <span className="bid-value">${vm.bid.avgPerSpot.toFixed(1)}</span>
              </div>
            </div>
          </BidRecommendationCard>
        </MetricsGrid>
      </AnalysisContainer>
    </WidgetContainer>
  );
}