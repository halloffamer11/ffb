import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetContainer from './WidgetContainer';
import { useDraftStore, legacyStore } from '../../stores/draftStore';
import { Button } from '../ui/Button';

// Styled components
const LedgerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${props => theme('spacing.sm')};
`;

const LedgerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
`;

const LedgerTitle = styled.div`
  font-weight: ${props => theme('typography.fontWeight.medium')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const ControlsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
`;

const LedgerList = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  background: ${props => theme('colors.surface2')};
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => theme('colors.border2')};
    border-radius: 3px;
  }
`;

const LedgerRow = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => theme('spacing.sm')};
  border-bottom: 1px solid ${props => theme('colors.border1')}30;
  font-size: ${props => theme('typography.fontSize.xs')};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => theme('colors.surface1')};
  }
`;

const PickNumber = styled.span`
  width: 56px;
  color: ${props => theme('colors.text2')};
  font-family: ${props => theme('typography.fontFamily.mono')};
`;

const RoundPick = styled.span`
  width: 56px;
  color: ${props => theme('colors.text1')};
  font-family: ${props => theme('typography.fontFamily.mono')};
`;

const TeamName = styled.span`
  width: 120px;
  color: ${props => theme('colors.text1')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
`;

const PlayerName = styled.span`
  flex: 1;
  color: ${props => theme('colors.text1')};
`;

const Price = styled.span`
  width: 64px;
  text-align: right;
  color: ${props => theme('colors.text1')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  font-family: ${props => theme('typography.fontFamily.mono')};
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

// Utility functions
function findOwnerName(owners: any[], teamId: number): string {
  const owner = (owners || []).find(o => Number(o.id) === Number(teamId));
  return owner ? (owner.team || `Team ${owner.id}`) : `Team ${teamId}`;
}

function computeRoundAndPick(overall: number, teams: number) {
  const round = Math.ceil(overall / teams);
  const pickInRound = ((overall - 1) % teams) + 1;
  return { round, pickInRound };
}

interface LedgerRow {
  overall: number;
  round: number;
  pickInRound: number;
  team: string;
  playerName: string;
  price: number;
  timestamp?: number;
  playerId?: any;
}

// Memoized DraftLedgerWidget for performance
interface DraftLedgerWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const DraftLedgerWidget = React.memo(({ editMode = false, onRemove }: DraftLedgerWidgetProps) => {
  const { settings, picks, players, canUndo, canRedo, undo, redo } = useDraftStore();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Memoized ledger rows calculation
  const ledgerRows = useMemo(() => {
    const owners = settings?.owners || [];
    const teams = Number(settings?.teams || owners.length || 12);
    
    // Build player id->name map
    const idToName = new Map();
    for (const player of players) {
      if (player?.id != null) {
        idToName.set(String(player.id), String(player.name || ''));
      }
    }
    
    const rows = picks.map((pick, idx) => {
      const overall = idx + 1;
      const { round, pickInRound } = computeRoundAndPick(overall, teams);
      const team = findOwnerName(owners, pick.teamId);
      const playerName = (pick.playerName ? String(pick.playerName) : '') || 
                        (pick.playerId != null ? idToName.get(String(pick.playerId)) : '') || 
                        `Player ${pick.playerId || ''}`;
      
      return {
        overall,
        round,
        pickInRound,
        team,
        playerName,
        price: pick.price,
        timestamp: pick.timestamp,
        playerId: pick.playerId
      };
    }).reverse(); // Latest first
    
    return rows;
  }, [picks, settings, players, refreshKey]);
  
  // Listen for state changes
  useEffect(() => {
    function handleStateChange() {
      setRefreshKey(prev => prev + 1);
    }
    
    window.addEventListener('workspace:state-changed', handleStateChange);
    window.addEventListener('workspace:players-changed', handleStateChange);
    
    // Listen for storage changes for cross-tab sync
    function handleStorageChange(e: StorageEvent) {
      try {
        if (!e) return;
        const key = String(e.key || '');
        if (key.includes('workspace::state') || 
            key.includes('workspace::leagueSettings') || 
            key.includes('workspace::players')) {
          handleStateChange();
        }
      } catch (error) {
        console.warn('Error handling storage change:', error);
      }
    }
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('workspace:state-changed', handleStateChange);
      window.removeEventListener('workspace:players-changed', handleStateChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Subscribe to legacy store changes for real-time updates
  useEffect(() => {
    function handleStoreChange() {
      setRefreshKey(prev => prev + 1);
    }
    
    // Subscribe to legacy store if available
    if (legacyStore && typeof legacyStore.subscribe === 'function') {
      legacyStore.subscribe('change', handleStoreChange);
      
      return () => {
        if (legacyStore && typeof legacyStore.unsubscribe === 'function') {
          legacyStore.unsubscribe('change', handleStoreChange);
        }
      };
    }
  }, []);
  
  // Memoized event handlers for performance
  const handleUndo = useCallback(() => {
    try {
      undo();
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  }, [undo]);
  
  const handleRedo = useCallback(() => {
    try {
      redo();
    } catch (error) {
      console.error('Failed to redo:', error);
    }
  }, [redo]);
  
  return (
    <WidgetContainer title="Draft Ledger" widgetId="draft-ledger" editMode={editMode} onRemove={onRemove}>
      <LedgerContainer>
        <LedgerHeader role="toolbar" aria-label="Draft ledger controls">
          <LedgerTitle id="draft-history-title">Draft History</LedgerTitle>
          <ControlsGroup>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={!canUndo()}
              aria-describedby="undo-help"
            >
              Undo
            </Button>
            <div id="undo-help" className="sr-only">
              Undo the last draft action
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={!canRedo()}
              aria-describedby="redo-help"
            >
              Redo
            </Button>
            <div id="redo-help" className="sr-only">
              Redo the last undone action
            </div>
          </ControlsGroup>
        </LedgerHeader>
        
        <LedgerList 
          role="table" 
          aria-labelledby="draft-history-title"
          aria-describedby="draft-history-desc"
        >
          <div id="draft-history-desc" className="sr-only">
            Table of draft picks in reverse chronological order. {ledgerRows.length} picks recorded.
          </div>
          {ledgerRows.length > 0 ? (
            ledgerRows.map((row, index) => (
              <LedgerRow 
                key={`${row.overall}-${row.timestamp || index}`}
                role="row"
                tabIndex={0}
                aria-describedby={`pick-${row.overall}-desc`}
              >
                <div id={`pick-${row.overall}-desc`} className="sr-only">
                  Pick {row.overall}, Round {row.round} Pick {row.pickInRound}: {row.team} drafted {row.playerName} for ${row.price}
                </div>
                <PickNumber role="cell" aria-label="Pick number">#{row.overall}</PickNumber>
                <RoundPick role="cell" aria-label="Round and pick">R{row.round} P{row.pickInRound}</RoundPick>
                <TeamName role="cell" aria-label="Team name">{row.team}</TeamName>
                <PlayerName role="cell" aria-label="Player name">{row.playerName}</PlayerName>
                <Price role="cell" aria-label="Price">${row.price}</Price>
              </LedgerRow>
            ))
          ) : (
            <EmptyState role="status" aria-live="polite">
              Draft picks will appear here as they are made...
            </EmptyState>
          )}
        </LedgerList>
      </LedgerContainer>
    </WidgetContainer>
  );
});

DraftLedgerWidget.displayName = 'DraftLedgerWidget';

export default DraftLedgerWidget;