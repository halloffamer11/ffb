import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import WidgetContainer from './WidgetContainer';
import { useUnifiedStore } from '../../stores/unified-store';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { theme } from '../../utils/styledHelpers';

// Styled components for the draft entry interface
const DraftContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme('spacing.sm')};
  height: 100%;
`;

const SelectedPlayerSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme('spacing.sm')};
  padding: ${theme('spacing.sm')};
  background: ${theme('colors.surface1')};
  border: 1px solid ${theme('colors.border1')};
  border-radius: ${theme('borderRadius.sm')};
`;

const SelectedPlayerText = styled.div`
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  color: ${props => theme('colors.text1')};
  flex: 1;
`;

const DraftFormSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme('spacing.sm')};
  padding: ${theme('spacing.sm')};
  background: ${theme('colors.surface2')};
  border: 1px solid ${theme('colors.border1')};
  border-radius: ${theme('borderRadius.sm')};
`;

const FormGroup = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme('spacing.xs')};
  font-size: ${theme('typography.fontSize.xs')};
  color: ${theme('colors.text2')};
`;

const Select = styled.select`
  padding: ${theme('spacing.xs')} ${theme('spacing.sm')};
  border: 1px solid ${theme('colors.border1')};
  border-radius: ${theme('borderRadius.sm')};
  background: ${theme('colors.bg')};
  color: ${theme('colors.text1')};
  font-size: ${theme('typography.fontSize.sm')};
  
  &:focus {
    outline: none;
    border-color: ${theme('colors.accent')};
    box-shadow: 0 0 0 2px ${theme('colors.accent')}20;
  }
`;

const Input = styled.input`
  padding: ${theme('spacing.xs')} ${theme('spacing.sm')};
  border: 1px solid ${theme('colors.border1')};
  border-radius: ${theme('borderRadius.sm')};
  background: ${theme('colors.bg')};
  color: ${theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  
  &:focus {
    outline: none;
    border-color: ${props => theme('colors.accent')};
    box-shadow: 0 0 0 2px ${props => theme('colors.accent')}20;
  }
  
  &[type="number"] {
    width: 80px;
  }
`;

const QuickEntryInput = styled(Input)`
  width: 120px;
  font-family: ${props => theme('typography.fontFamily.mono')};
`;

const EditPickInput = styled(Input)`
  width: 60px;
`;


const DraftLog = styled.div`
  flex: 1;
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('radii.sm')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.text2')};
  overflow-y: auto;
  min-height: 80px;
  max-height: 120px;
  
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

const LogEntry = styled.div`
  padding: 2px 0;
  
  &:first-child {
    font-weight: ${props => theme('typography.fontWeight.medium')};
    color: ${props => theme('colors.text1')};
  }
`;

const NoPlayersWarning = styled.div`
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.warning')}15;
  border: 1px solid ${props => theme('colors.warning')};
  border-radius: ${props => theme('radii.sm')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.warning')};
  text-align: center;
`;

// Draft utility functions (migrated from draftUtils.js)
function parseQuickEntry(text: string): { teamId: number; price: number } | null {
  const s = String(text || '').trim();
  if (s === '') return null;
  
  // Accept two numbers separated by space or comma
  const m = s.match(/(\d+)[,\s]+(\d+)/);
  if (m) {
    const teamId = Number(m[1]);
    const price = Number(m[2]);
    if (Number.isFinite(teamId) && Number.isFinite(price)) return { teamId, price };
  }
  
  // Accept key:value pairs in any order
  const parts = Object.fromEntries(
    s.split(/[\s,]+/).map(tok => {
      const kv = tok.split(':');
      return [kv[0].toLowerCase(), kv[1]];
    })
  );
  const t = Number(parts.team ?? parts.t ?? parts.teamid);
  const p = Number(parts.price ?? parts.p ?? parts.bid);
  if (Number.isFinite(t) && Number.isFinite(p)) return { teamId: t, price: p };
  
  return null;
}

function computeRoundAndPick(overall: number, teams: number) {
  const t = Math.max(1, Number(teams || 1));
  const o = Math.max(1, Number(overall || 1));
  const round = Math.ceil(o / t);
  const pickInRound = ((o - 1) % t) + 1;
  return { round, pickInRound };
}

function formatPickLogLine(ctx: {
  overall: number;
  teamName: string;
  playerName: string;
  price: number;
  teams: number;
}) {
  const { round, pickInRound } = computeRoundAndPick(ctx.overall, ctx.teams);
  return `[#${ctx.overall} R${round} P${pickInRound}] ${ctx.teamName} draft ${ctx.playerName} for $${ctx.price}`;
}

function isPlayerAlreadyDrafted(picks: any[], player: any): boolean {
  if (!player) return false;
  const idKey = player.id != null ? String(player.id) : null;
  const nameKey = player.name != null ? String(player.name).toLowerCase() : null;
  return (Array.isArray(picks) ? picks : []).some(p => {
    if (idKey != null && p.playerId != null && String(p.playerId) === idKey) return true;
    if (nameKey != null && p.playerName != null && String(p.playerName).toLowerCase() === nameKey) return true;
    return false;
  });
}

function formatPlayer(player: any): string {
  const inj = player.injuryStatus != null ? String(player.injuryStatus) : '';
  return `${player.name} · ${player.team} · ${player.position}${inj !== '' ? ` · s${inj}` : ''}`;
}

interface DraftEntryWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const DraftEntryWidget = React.memo<DraftEntryWidgetProps>(function DraftEntryWidget({ editMode = false, onRemove }) {
  // State from unified store
  const store = useUnifiedStore();
  const { selectedPlayer } = store.ui;
  const { settings, players, picks } = store;
  
  // Toast notifications
  const { showToast } = useToast();
  
  // Local component state
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [price, setPrice] = useState<number>(1);
  const [quickEntryText, setQuickEntryText] = useState<string>('');
  const [editPickIndex, setEditPickIndex] = useState<string>('');
  const [draftLog, setDraftLog] = useState<string[]>([]);
  
  // Refs for input focus management
  const quickInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize team selection with user's team if available
  useEffect(() => {
    if (settings?.userTeamId != null) {
      setSelectedTeamId(Number(settings.userTeamId));
    }
  }, [settings?.userTeamId]);
  
  // Listen for cross-widget player selection events
  useEffect(() => {
    function handlePlayerSelection(e: any) {
      if (e.detail.source === 'draft') return; // Ignore our own events
      
      const player = e.detail.player;
      if (player) {
        // Find the full player object from our players list
        let fullPlayer = null;
        if (player.id != null) {
          fullPlayer = players.find(p => String(p.id) === String(player.id));
        }
        if (!fullPlayer && player.name) {
          fullPlayer = players.find(p => 
            String(p.name).toLowerCase() === String(player.name).toLowerCase()
          );
        }
        
        if (fullPlayer) {
          store.selectPlayer(fullPlayer);
          setMessage('');
        }
      }
    }
    
    // Modern cross-widget events
    window.addEventListener('player:selected', handlePlayerSelection);
    
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
        player = players.find(p => String(p.name).toLowerCase() === String(pname).toLowerCase());
      }
      
      if (player) {
        store.selectPlayer(player);
        setMessage('');
      }
    }
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('player:selected', handlePlayerSelection);
      window.removeEventListener('message', handleMessage);
    };
  }, [players, store]);
  
  // Clear selected player
  const clearSelection = () => {
    store.selectPlayer(null);
  };
  
  // Get team owners/names
  const owners = settings?.owners || [];
  if (owners.length === 0) {
    // Create default owners if none exist
    const teams = settings?.teams || 12;
    for (let i = 1; i <= teams; i++) {
      owners.push({ id: i, team: `Team ${i}`, name: `Owner ${i}`, order: i });
    }
  }
  
  // Draft player function
  const commitDraft = (teamId: number, draftPrice: number) => {
    if (!selectedPlayer) {
      showToast('Select a player in Search & Select.', 'error');
      return;
    }
    
    if (!Number.isFinite(draftPrice) || draftPrice < 1) {
      showToast('Enter a valid price.', 'error');
      return;
    }
    
    // Check if player already drafted
    if (isPlayerAlreadyDrafted(picks, selectedPlayer)) {
      showToast('Player already drafted.', 'error');
      return;
    }
    
    // Enforce roster limits with FLEX + BENCH policy
    try {
      const roster = settings?.roster || {};
      const myPicks = picks.filter(p => Number(p.teamId) === teamId);
      
      // Create position lookup map
      const idToPos = new Map(players.map(p => [String(p.id), String(p.position)]));
      
      // Count current positions
      const posCounts = myPicks.reduce((acc: any, p: any) => {
        const pos = idToPos.get(String(p.playerId)) || '';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {});
      
      const targetPos = String(selectedPlayer.position || '').toUpperCase();
      const posMin = Number(roster[targetPos] || 0);
      const flexSlots = Number(roster.FLEX || 0);
      const benchSlots = Number(roster.BENCH || 0);
      const flexEligible = (targetPos === 'RB' || targetPos === 'WR' || targetPos === 'TE') ? flexSlots : 0;
      const posMax = posMin + flexEligible + benchSlots;
      const cur = Number(posCounts[targetPos] || 0);
      
      if (posMax > 0 && cur >= posMax) {
        showToast(`Roster limit reached at ${targetPos} (max ${posMax}).`, 'error');
        return;
      }
    } catch (error) {
      console.warn('Failed to check roster limits:', error);
    }
    
    // Create pick object
    const pick = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      teamId: Number(teamId),
      price: draftPrice
    };
    
    try {
      // Use unified store
      store.draftPlayer(selectedPlayer, Number(teamId), draftPrice);
      
      // Add to draft log
      const teams = settings?.teams || owners.length || 12;
      const teamName = owners.find(o => o.id === teamId)?.team || `Team ${teamId}`;
      const logLine = formatPickLogLine({
        overall: picks.length + 1,
        teamName,
        playerName: selectedPlayer.name,
        price: draftPrice,
        teams
      });
      
      setDraftLog(prev => [logLine, ...prev]);
      
      // Show success toast
      showToast(
        `Drafted ${selectedPlayer.name} for $${draftPrice} to ${teamName}`,
        'success',
        2000
      );
      
      // Clear selection
      clearSelection();
      
    } catch (error) {
      console.error('Failed to draft player:', error);
      showToast('Error adding pick. Please try again.', 'error');
    }
  };
  
  // Edit pick function  
  const editPick = (pickIndex: number, teamId: number, draftPrice: number) => {
    if (!selectedPlayer) {
      showToast('Select a player for pick edit.', 'error');
      return;
    }
    
    const update = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      teamId,
      price: draftPrice
    };
    
    try {
      // Use unified store - undraft and redraft with new data
      store.undraftPlayer(pickIndex - 1);
      store.draftPlayer(selectedPlayer, teamId, draftPrice);
      
      showToast(`Edited pick #${pickIndex}`, 'success', 1500);
      clearSelection();
      setEditPickIndex('');
      
    } catch (error) {
      console.error('Failed to edit pick:', error);
      showToast('Error editing pick. Please try again.', 'error');
    }
  };
  
  // Handle draft button click
  const handleDraftClick = () => {
    const editIdx = Number(editPickIndex);
    
    if (Number.isInteger(editIdx) && editIdx > 0) {
      editPick(editIdx, selectedTeamId, price);
    } else {
      commitDraft(selectedTeamId, price);
    }
  };
  
  // Handle quick entry
  const handleQuickEntry = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    
    const parsed = parseQuickEntry(quickEntryText);
    if (!parsed) {
      showToast('Quick entry: expected "team price"', 'error');
      return;
    }
    
    setSelectedTeamId(parsed.teamId);
    setPrice(parsed.price);
    commitDraft(parsed.teamId, parsed.price);
    setQuickEntryText('');
  };
  
  
  return (
    <WidgetContainer title="Draft Entry" widgetId="draft-entry" editMode={editMode} onRemove={onRemove}>
      <DraftContainer>
        {/* Selected Player Section */}
        <SelectedPlayerSection role="group" aria-labelledby="selected-player-label">
          <div id="selected-player-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Selected:</div>
          <SelectedPlayerText>
            {selectedPlayer ? formatPlayer(selectedPlayer) : '—'}
          </SelectedPlayerText>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            Clear
          </Button>
        </SelectedPlayerSection>
        
        {/* Draft Form Section */}
        <DraftFormSection>
          <FormGroup>
            Team
            <Select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
            >
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>
                  {owner.team} ({owner.name})
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            Price
            <Input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </FormGroup>
          
          <Button onClick={handleDraftClick}>
            Draft
          </Button>
          
          <FormGroup>
            Quick:
            <QuickEntryInput
              ref={quickInputRef}
              placeholder="team price e.g., 3 25"
              value={quickEntryText}
              onChange={(e) => setQuickEntryText(e.target.value)}
              onKeyDown={handleQuickEntry}
            />
          </FormGroup>
          
          <FormGroup>
            Edit Pick #
            <EditPickInput
              type="number"
              min="1"
              value={editPickIndex}
              onChange={(e) => setEditPickIndex(e.target.value)}
            />
          </FormGroup>
          
        </DraftFormSection>
        
        {/* Draft Log */}
        <DraftLog>
          {draftLog.length > 0 ? (
            draftLog.map((entry, index) => (
              <LogEntry key={index}>{entry}</LogEntry>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Draft log will appear here...</div>
          )}
        </DraftLog>
        
        {/* No Players Warning */}
        {players.length === 0 && (
          <NoPlayersWarning>
            No players in workspace. Load data via Data Management.
          </NoPlayersWarning>
        )}
      </DraftContainer>
    </WidgetContainer>
  );
});

export default DraftEntryWidget;