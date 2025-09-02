import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../utils/styledHelpers';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '../stores/unified-store';
import { Team, Keeper, Player, ScoringSystem, FlexSpot } from '../types/data-contracts';
import { getAvailablePresets, getPresetById, detectMatchingPreset, generateDefaultTeams } from '../config/league-presets';

const PageContainer = styled.div`
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  height: ${props => theme('layout.headerHeight')};
  background: ${props => theme('gradients.widget')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  display: flex;
  align-items: center;
  padding: 0 ${props => theme('spacing.xl')};
  gap: ${props => theme('spacing.md')};
  box-shadow: ${props => theme('shadows.widget')};
  z-index: 100;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  color: ${props => theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => theme('colors.surface3')};
    color: ${props => theme('colors.text1')};
    border-color: ${props => theme('colors.border2')};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => theme('colors.accent')};
    outline-offset: 2px;
  }
`;

const Title = styled.h1`
  font-size: ${props => theme('typography.fontSize.xl')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  color: ${props => theme('colors.text1')};
  margin: 0;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${props => theme('spacing.xl')};
  background: ${props => theme('colors.surface1')};
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => theme('spacing.lg')};
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsCard = styled.div`
  background: ${props => theme('gradients.widget')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  box-shadow: ${props => theme('shadows.widget')};
  padding: ${props => theme('spacing.xl')};
  transition: ${props => theme('transitions.smooth')};
  
  &:hover {
    border-color: ${props => theme('colors.border2')};
    box-shadow: ${props => theme('shadows.widgetHover')};
  }
`;

const CardTitle = styled.h2`
  font-size: ${props => theme('typography.fontSize.lg')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0 0 ${props => theme('spacing.lg')} 0;
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => theme('spacing.lg')};
`;

const Label = styled.label`
  display: block;
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  color: ${props => theme('colors.text2')};
  margin-bottom: ${props => theme('spacing.sm')};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => theme('colors.surface3')};
    border-color: ${props => theme('colors.border2')};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => theme('colors.accent')};
    box-shadow: ${props => theme('shadows.focus')};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => theme('colors.surface3')};
    border-color: ${props => theme('colors.border2')};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => theme('colors.accent')};
    box-shadow: ${props => theme('shadows.focus')};
  }
`;

const RosterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.md')};
`;

const SaveActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.xl')};
  padding-top: ${props => theme('spacing.lg')};
  border-top: 1px solid ${props => theme('colors.border1')};
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.base')};
  margin-bottom: ${props => theme('spacing.lg')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  
  ${props => props.$type === 'success' && `
    background: ${theme('colors.positiveAlpha')};
    color: ${theme('colors.positive')};
    border: 1px solid ${theme('colors.positive')}40;
  `}
  
  ${props => props.$type === 'error' && `
    background: ${theme('colors.negativeAlpha')};
    color: ${theme('colors.negative')};
    border: 1px solid ${theme('colors.negative')}40;
  `}
`;

const TeamItem = styled.div<{ $isDragOver?: boolean; $isUserTeam?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  padding: ${props => theme('spacing.sm')};
  background: ${props => {
    if (props.$isUserTeam) return theme('colors.accentAlpha');
    if (props.$isDragOver) return theme('colors.surface3');
    return theme('colors.surface2');
  }};
  border: 1px solid ${props => {
    if (props.$isUserTeam) return theme('colors.accent');
    return theme('colors.border1');
  }};
  border-radius: ${props => theme('borderRadius.base')};
  margin-bottom: ${props => theme('spacing.xs')};
  transition: ${props => theme('transitions.fast')};
  position: relative;
  
  &:hover {
    background: ${props => props.$isUserTeam ? theme('colors.accentAlpha') : theme('colors.surface3')};
    border-color: ${props => props.$isUserTeam ? theme('colors.accent') : theme('colors.border2')};
  }
  
  ${props => props.$isUserTeam && `
    &::after {
      content: '⭐';
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 14px;
      opacity: 0.8;
    }
  `}
`;

const DragHandle = styled.div`
  color: ${props => theme('colors.text3')};
  font-size: 18px;
  cursor: grab;
  user-select: none;
  
  &:active {
    cursor: grabbing;
  }
`;

const TeamInfo = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 80px 60px;
  gap: ${props => theme('spacing.sm')};
  align-items: center;
`;

const RadioButton = styled.input`
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const KeeperTable = styled.div`
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  overflow: hidden;
`;

const KeeperRow = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 150px 80px 120px 40px;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  background: ${props => props.$isHeader ? theme('colors.surface3') : 'transparent'};
  font-weight: ${props => props.$isHeader ? theme('typography.fontWeight.semibold') : 'normal'};
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-top: none;
  border-radius: 0 0 ${props => theme('borderRadius.base')} ${props => theme('borderRadius.base')};
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
`;

const SearchResultItem = styled.div`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  cursor: pointer;
  border-bottom: 1px solid ${props => theme('colors.border1')};
  
  &:hover {
    background: ${props => theme('colors.surface2')};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchContainer = styled.div`
  position: relative;
`;

const LockIcon = styled.div`
  color: ${props => theme('colors.warning')};
  font-size: 18px;
  margin-right: ${props => theme('spacing.sm')};
`;

const LockNotice = styled.div`
  background: ${props => theme('colors.warningAlpha')};
  color: ${props => theme('colors.warning')};
  padding: ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.base')};
  margin-bottom: ${props => theme('spacing.lg')};
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
`;

const FlexTable = styled.div`
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  overflow: hidden;
  margin-top: ${props => theme('spacing.md')};
`;

const FlexRow = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  background: ${props => props.$isHeader ? theme('colors.surface3') : 'transparent'};
  font-weight: ${props => props.$isHeader ? theme('typography.fontWeight.semibold') : 'normal'};
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FlexPositionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => theme('spacing.md')};
  align-items: center;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.xs')};
  cursor: pointer;
  font-size: ${props => theme('typography.fontSize.sm')};
  color: ${props => theme('colors.text2')};
  
  &:hover {
    color: ${props => theme('colors.text1')};
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

export default function LeagueSettingsPage() {
  const navigate = useNavigate();
  const { 
    settings, 
    keepers, 
    players, 
    updateSettings, 
    updateTeams, 
    assignKeeper, 
    removeKeeper, 
    startDraft,
    resetDraft,
    undo,
    canUndo
  } = useUnifiedStore();
  
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [newKeeperSearch, setNewKeeperSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [keeperCost, setKeeperCost] = useState<number | string>(1);
  const [keeperCostError, setKeeperCostError] = useState<string>('');
  const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [scoringExpanded, setScoringExpanded] = useState<boolean>(false);
  const [flexSpots, setFlexSpots] = useState<FlexSpot[]>([]);
  const [availablePresets] = useState(getAvailablePresets());

  // Search for players when typing
  useEffect(() => {
    if (newKeeperSearch.length >= 2) {
      const filteredPlayers = players.filter(player => 
        player.name.toLowerCase().includes(newKeeperSearch.toLowerCase()) &&
        !keepers.some(k => k.player.id === player.id) &&
        !player.drafted
      ).slice(0, 10);
      setSearchResults(filteredPlayers);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [newKeeperSearch, players, keepers]);

  // Update team budgets when auction budget changes
  useEffect(() => {
    const updatedTeams = settings.teams.map(team => {
      // Calculate keeper costs for this team
      const teamKeeperCost = keepers
        .filter(k => k.teamId === team.id)
        .reduce((sum, k) => sum + k.cost, 0);
      
      return {
        ...team,
        budget: settings.budget - teamKeeperCost
      };
    });
    
    // Only update if budgets actually changed
    const budgetsChanged = updatedTeams.some((team, index) => 
      team.budget !== settings.teams[index]?.budget
    );
    
    if (budgetsChanged) {
      updateTeams(updatedTeams);
    }
  }, [settings.budget, keepers, updateTeams]);

  // Initialize and sync flex spots with FLEX count
  useEffect(() => {
    const flexCount = settings.positions.FLEX;
    
    // Initialize from settings if available
    if (settings.flexConfig?.spots && flexSpots.length === 0) {
      setFlexSpots(settings.flexConfig.spots);
      return;
    }
    
    // Create new flex spots array
    const newFlexSpots: FlexSpot[] = [];
    for (let i = 0; i < flexCount; i++) {
      const existingSpot = flexSpots[i] || settings.flexConfig?.spots?.[i];
      newFlexSpots.push(existingSpot || {
        id: `flex-${i + 1}`,
        allowedPositions: {
          QB: false,
          RB: true,
          WR: true,
          TE: true
        }
      });
    }
    
    if (JSON.stringify(newFlexSpots) !== JSON.stringify(flexSpots)) {
      setFlexSpots(newFlexSpots);
      
      // Update settings with flex configuration
      updateSettings({
        flexConfig: {
          spots: newFlexSpots
        }
      });
    }
  }, [settings.positions.FLEX, settings.flexConfig, flexSpots, updateSettings]);

  const handleScoringPresetChange = (preset: ScoringSystem['preset']) => {
    const presetValues = {
      standard: { ...settings.scoring.values, receptions: 0 },
      halfppr: { ...settings.scoring.values, receptions: 0.5 },
      ppr: { ...settings.scoring.values, receptions: 1 },
      custom: settings.scoring.values
    };
    
    const newScoringSettings = {
      scoring: {
        preset,
        values: presetValues[preset]
      }
    };
    
    updateSettings(newScoringSettings);
    
    // Check if this change breaks preset compatibility
    setTimeout(() => {
      const matchingPreset = detectMatchingPreset({ ...settings, ...newScoringSettings });
      if (matchingPreset !== settings.selectedPreset) {
        updateSettings({ selectedPreset: matchingPreset || 'custom' });
      }
    }, 100);
  };

  const handleScoringValueChange = (field: keyof ScoringSystem['values'], value: number) => {
    const newScoringSettings = {
      scoring: {
        preset: 'custom' as const, // Automatically switch to custom when values are changed
        values: { ...settings.scoring.values, [field]: value }
      }
    };
    
    updateSettings(newScoringSettings);
    
    // Check if this change breaks preset compatibility
    setTimeout(() => {
      const matchingPreset = detectMatchingPreset({ ...settings, ...newScoringSettings });
      if (matchingPreset !== settings.selectedPreset) {
        updateSettings({ selectedPreset: matchingPreset || 'custom' });
      }
    }, 100);
  };

  const handleFlexPositionChange = (flexIndex: number, position: keyof FlexSpot['allowedPositions'], checked: boolean) => {
    const updatedFlexSpots = [...flexSpots];
    updatedFlexSpots[flexIndex] = {
      ...updatedFlexSpots[flexIndex],
      allowedPositions: {
        ...updatedFlexSpots[flexIndex].allowedPositions,
        [position]: checked
      }
    };
    
    setFlexSpots(updatedFlexSpots);
    
    // Update settings and check if it still matches a preset
    const newSettings = {
      flexConfig: {
        spots: updatedFlexSpots
      }
    };
    
    updateSettings(newSettings);
    
    // Check for preset match after a brief delay to allow state to update
    setTimeout(() => {
      const matchingPreset = detectMatchingPreset({ ...settings, ...newSettings });
      if (matchingPreset !== settings.selectedPreset) {
        updateSettings({ selectedPreset: matchingPreset || 'custom' });
      }
    }, 100);
  };

  const handlePresetSelection = (presetId: string) => {
    if (presetId === 'custom') {
      updateSettings({ selectedPreset: 'custom' });
      return;
    }
    
    const preset = getPresetById(presetId);
    if (!preset) return;
    
    // Keep existing team names/owners if they exist and team count matches
    const existingTeams = settings.teams;
    const newTeamCount = preset.settings.teamCount;
    
    let newTeams;
    if (existingTeams.length === newTeamCount) {
      // Keep existing team data, just update budgets
      newTeams = existingTeams.map(team => ({
        ...team,
        budget: preset.settings.budget
      }));
    } else {
      // Generate new teams
      newTeams = generateDefaultTeams(newTeamCount, preset.settings.budget);
    }
    
    // Apply all preset settings
    const newSettings = {
      ...preset.settings,
      teams: newTeams,
      userTeamId: settings.userTeamId && settings.userTeamId <= newTeamCount ? settings.userTeamId : null,
      selectedPreset: presetId,
      leagueName: settings.leagueName // Preserve league name
    };
    
    updateSettings(newSettings);
    setFlexSpots(preset.settings.flexConfig?.spots || []);
    
    setStatusMessage({ type: 'success', message: `Loaded ${preset.name} preset successfully!` });
  };

  const handleTeamChange = (teamId: number, field: keyof Team, value: any) => {
    const updatedTeams = settings.teams.map(team => 
      team.id === teamId ? { ...team, [field]: value } : team
    );
    updateTeams(updatedTeams);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (settings.isDraftStarted) {
      e.preventDefault();
      return;
    }
    setDraggedTeamIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (settings.isDraftStarted || draggedTeamIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (settings.isDraftStarted || draggedTeamIndex === null) return;
    
    const items = [...settings.teams];
    const [reorderedItem] = items.splice(draggedTeamIndex, 1);
    items.splice(dropIndex, 0, reorderedItem);
    
    // Track which team was the user's team before reordering
    const userTeam = settings.teams.find(t => t.id === settings.userTeamId);
    
    // Update team IDs to match new order (draft order)
    const reorderedTeams = items.map((team, index) => ({
      ...team,
      id: index + 1
    }));
    
    // Find the new ID of the user's team after reordering
    const newUserTeamId = userTeam ? 
      reorderedTeams.find(t => t.teamName === userTeam.teamName && t.ownerName === userTeam.ownerName)?.id 
      : null;
    
    updateTeams(reorderedTeams);
    
    // Update user team selection to the new ID
    if (newUserTeamId && newUserTeamId !== settings.userTeamId) {
      updateSettings({ userTeamId: newUserTeamId });
    }
    
    setDraggedTeamIndex(null);
    setDragOverIndex(null);
  };

  const handleAddKeeper = () => {
    if (!selectedPlayer) return;
    
    // Validate cost
    const costValue = typeof keeperCost === 'string' ? parseInt(keeperCost) : keeperCost;
    if (isNaN(costValue) || costValue < 1) {
      setKeeperCostError('Keeper cost must be at least $1');
      return;
    }
    
    const team = settings.teams.find(t => t.id === selectedTeamId);
    if (!team) return;
    
    // Check if team has enough budget
    const teamKeeperCost = keepers
      .filter(k => k.teamId === selectedTeamId)
      .reduce((sum, k) => sum + k.cost, 0);
    
    if (teamKeeperCost + costValue > settings.budget) {
      setKeeperCostError(`Team ${team.teamName} would exceed budget with this keeper`);
      return;
    }
    
    const newKeeper: Keeper = {
      player: selectedPlayer,
      teamId: selectedTeamId,
      cost: costValue
    };
    
    assignKeeper(newKeeper);
    
    // Reset form
    setSelectedPlayer(null);
    setNewKeeperSearch('');
    setKeeperCost(1);
    setKeeperCostError('');
    setStatusMessage({ type: 'success', message: 'Keeper assigned successfully!' });
  };

  const handleRemoveKeeper = (keeper: Keeper) => {
    const keeperId = `${keeper.player.id}-${keeper.teamId}`;
    removeKeeper(keeperId);
    setStatusMessage({ type: 'success', message: 'Keeper removed successfully!' });
  };

  const handleStartDraft = () => {
    if (window.confirm('Are you sure you want to start the draft? This will lock all league settings.')) {
      startDraft();
      setStatusMessage({ type: 'success', message: 'Draft started! Settings are now locked.' });
    }
  };

  const totalRosterSpots = Object.values(settings.positions).reduce((sum, count) => sum + count, 0);

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/')} aria-label="Back to dashboard">
          ← Back
        </BackButton>
        <Title>
          {settings.isDraftStarted && <LockIcon>🔒</LockIcon>}
          League Settings
        </Title>
      </Header>
      
      <ContentArea>
        {settings.isDraftStarted && (
          <LockNotice>
            <LockIcon>🔒</LockIcon>
            Draft has started. Settings are locked to prevent changes that could affect draft integrity.
          </LockNotice>
        )}

        {statusMessage && (
          <StatusMessage $type={statusMessage.type}>
            {statusMessage.message}
          </StatusMessage>
        )}
        
        <SettingsGrid>
          {/* Left Column: Basic Settings + Roster */}
          <div>
            {/* League Preset Selection */}
            <SettingsCard style={{ marginBottom: '16px' }}>
              <CardTitle>
                🏈 League Template
              </CardTitle>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Choose a preset to quickly configure your league settings, or select Custom to manually configure everything.
              </p>
              
              <FormGroup>
                <Label htmlFor="leaguePreset">League Template</Label>
                <Select
                  id="leaguePreset"
                  value={settings.selectedPreset || 'custom'}
                  disabled={settings.isDraftStarted}
                  onChange={(e) => handlePresetSelection(e.target.value)}
                >
                  <option value="custom">Custom League</option>
                  {availablePresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} - {preset.description}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              {settings.selectedPreset && settings.selectedPreset !== 'custom' && (
                <div style={{
                  background: 'var(--color-surface-3)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--color-text-2)',
                  marginTop: '8px'
                }}>
                  <strong>Template Active:</strong> Settings are loaded from {availablePresets.find(p => p.id === settings.selectedPreset)?.name}. 
                  You can customize team names and keepers without affecting the template. 
                  Changing roster positions or scoring will switch to "Custom League".
                </div>
              )}
            </SettingsCard>

            {/* Basic Settings */}
            <SettingsCard style={{ marginBottom: '16px' }}>
            <CardTitle>
              ⚙️ Basic League Configuration
            </CardTitle>
            
            <FormGroup>
              <Label htmlFor="leagueName">League Name</Label>
              <Input
                id="leagueName"
                type="text"
                value={settings.leagueName}
                disabled={settings.isDraftStarted}
                onChange={(e) => updateSettings({ leagueName: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="teamCount">Team Count</Label>
              <Input
                id="teamCount"
                type="number"
                min="4"
                max="20"
                step="1"
                value={settings.teamCount}
                disabled={settings.isDraftStarted}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value);
                  if (newCount >= 4 && newCount <= 20) {
                    const newTeams = [];
                    for (let i = 0; i < newCount; i++) {
                      const existingTeam = settings.teams[i];
                      newTeams.push(existingTeam || {
                        id: i + 1,
                        teamName: `Team ${i + 1}`,
                        ownerName: `Owner ${i + 1}`,
                        budget: settings.budget
                      });
                    }
                    updateSettings({ teamCount: newCount });
                    updateTeams(newTeams);
                    
                    // Check for preset compatibility
                    setTimeout(() => {
                      const matchingPreset = detectMatchingPreset({ ...settings, teamCount: newCount, teams: newTeams });
                      if (matchingPreset !== settings.selectedPreset) {
                        updateSettings({ selectedPreset: matchingPreset || 'custom' });
                      }
                    }, 100);
                  }
                }}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="budget">Auction Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                min="100"
                max="1000"
                step="10"
                value={settings.budget}
                disabled={settings.isDraftStarted}
                onChange={(e) => {
                  const newBudget = parseInt(e.target.value);
                  updateSettings({ budget: newBudget });
                  
                  // Check for preset compatibility
                  setTimeout(() => {
                    const matchingPreset = detectMatchingPreset({ ...settings, budget: newBudget });
                    if (matchingPreset !== settings.selectedPreset) {
                      updateSettings({ selectedPreset: matchingPreset || 'custom' });
                    }
                  }, 100);
                }}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="scoringFormat">Scoring Format</Label>
              <Select
                id="scoringFormat"
                value={settings.scoring.preset}
                disabled={settings.isDraftStarted}
                onChange={(e) => handleScoringPresetChange(e.target.value as ScoringSystem['preset'])}
              >
                <option value="standard">Standard</option>
                <option value="halfppr">Half PPR</option>
                <option value="ppr">Full PPR</option>
                <option value="custom">Custom</option>
              </Select>
            </FormGroup>

            {/* Scoring Summary and Controls */}
            <div style={{ 
              background: 'var(--color-surface-3)', 
              padding: '12px', 
              borderRadius: '6px', 
              fontSize: '13px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: scoringExpanded ? '12px' : '0'
              }}>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  <strong>Scoring:</strong> 
                  {' '}PPR: {settings.scoring.values.receptions}
                  {' '}| Pass TD: {settings.scoring.values.passingTDs}
                  {' '}| Rush TD: {settings.scoring.values.rushingTDs}
                  {' '}| Rec TD: {settings.scoring.values.receivingTDs}
                </div>
                <button
                  onClick={() => setScoringExpanded(!scoringExpanded)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 4px'
                  }}
                >
                  {scoringExpanded ? '▲ Collapse' : '▼ Edit Values'}
                </button>
              </div>

              {/* Expanded Scoring Section */}
              {scoringExpanded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Passing Yards (per yard)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.passingYards}
                        onChange={(e) => handleScoringValueChange('passingYards', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Passing TDs</Label>
                      <Input
                        type="number"
                        step="0.5"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.passingTDs}
                        onChange={(e) => handleScoringValueChange('passingTDs', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Interceptions</Label>
                      <Input
                        type="number"
                        step="0.5"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.interceptions}
                        onChange={(e) => handleScoringValueChange('interceptions', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                  </div>

                  <div>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Rushing Yards (per yard)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.rushingYards}
                        onChange={(e) => handleScoringValueChange('rushingYards', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Rushing TDs</Label>
                      <Input
                        type="number"
                        step="0.5"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.rushingTDs}
                        onChange={(e) => handleScoringValueChange('rushingTDs', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: '8px' }}>
                      <Label style={{ fontSize: '11px' }}>Receptions</Label>
                      <Input
                        type="number"
                        step="0.1"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        disabled={settings.isDraftStarted}
                        value={settings.scoring.values.receptions}
                        onChange={(e) => handleScoringValueChange('receptions', parseFloat(e.target.value))}
                      />
                    </FormGroup>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>

            {/* Roster Configuration */}
            <SettingsCard>
            <CardTitle>
              👥 Roster Configuration
            </CardTitle>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Total roster spots: {totalRosterSpots}
            </p>
            
            <RosterGrid>
              {Object.entries(settings.positions).map(([position, count]) => (
                <FormGroup key={position}>
                  <Label htmlFor={position}>{position}</Label>
                  <Input
                    id={position}
                    type="number"
                    min="0"
                    max="5"
                    value={count}
                    disabled={settings.isDraftStarted}
                    onChange={(e) => {
                      const newPositions = { 
                        ...settings.positions, 
                        [position]: parseInt(e.target.value) 
                      };
                      updateSettings({ positions: newPositions });
                      
                      // Check for preset compatibility
                      setTimeout(() => {
                        const matchingPreset = detectMatchingPreset({ ...settings, positions: newPositions });
                        if (matchingPreset !== settings.selectedPreset) {
                          updateSettings({ selectedPreset: matchingPreset || 'custom' });
                        }
                      }, 100);
                    }}
                  />
                </FormGroup>
              ))}
            </RosterGrid>

            {/* Flex Configuration */}
            {settings.positions.FLEX > 0 && (
              <>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'var(--color-text-1)',
                  marginTop: '24px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔀 Flex Position Configuration
                </div>
                
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Configure which positions are allowed in each flex spot.
                </p>

                <FlexTable>
                  <FlexRow $isHeader>
                    <div>Flex Spot</div>
                    <div>Allowed Positions</div>
                  </FlexRow>
                  
                  {flexSpots.map((spot, index) => (
                    <FlexRow key={spot.id}>
                      <div style={{ fontWeight: '500' }}>
                        Flex {index + 1}
                      </div>
                      <FlexPositionGrid>
                        {(['QB', 'RB', 'WR', 'TE'] as const).map(position => (
                          <CheckboxContainer key={position}>
                            <Checkbox
                              type="checkbox"
                              checked={spot.allowedPositions[position]}
                              disabled={settings.isDraftStarted}
                              onChange={(e) => handleFlexPositionChange(index, position, e.target.checked)}
                            />
                            {position}
                          </CheckboxContainer>
                        ))}
                      </FlexPositionGrid>
                    </FlexRow>
                  ))}
                </FlexTable>
              </>
            )}
          </SettingsCard>
          </div>

          {/* Right Column: Teams Management */}
          <SettingsCard>
            <CardTitle>
              🏆 Teams & Draft Order
            </CardTitle>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Drag teams to reorder draft sequence. Select your team with the radio button.
            </p>

            <div>
              {settings.teams.map((team, index) => (
                <TeamItem
                  key={team.id}
                  draggable={!settings.isDraftStarted}
                  $isDragOver={dragOverIndex === index}
                  $isUserTeam={settings.userTeamId === team.id}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <DragHandle>⋮⋮</DragHandle>
                  <TeamInfo>
                    <Input
                      type="text"
                      placeholder="Team Name"
                      value={team.teamName}
                      disabled={settings.isDraftStarted}
                      onChange={(e) => handleTeamChange(team.id, 'teamName', e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="Owner Name"
                      value={team.ownerName}
                      disabled={settings.isDraftStarted}
                      onChange={(e) => handleTeamChange(team.id, 'ownerName', e.target.value)}
                    />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      ${team.budget}
                    </span>
                    <RadioButton
                      type="radio"
                      name="userTeam"
                      checked={settings.userTeamId === team.id}
                      disabled={settings.isDraftStarted}
                      onChange={() => updateSettings({ userTeamId: team.id })}
                    />
                  </TeamInfo>
                </TeamItem>
              ))}
            </div>
          </SettingsCard>

        </SettingsGrid>

        {/* Keepers System - Full Width */}
        <SettingsCard style={{ maxWidth: '1200px', margin: '20px auto' }}>
            <CardTitle>
              ⭐ Keepers Management
            </CardTitle>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Assign keepers to teams. Keeper costs will be deducted from team budgets.
            </p>

            {/* Add Keeper Form */}
            {!settings.isDraftStarted && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                <SettingsGrid>
                  <FormGroup>
                    <Label>Search Player</Label>
                    <SearchContainer>
                      <SearchInput
                        type="text"
                        placeholder="Type player name..."
                        value={newKeeperSearch}
                        onChange={(e) => setNewKeeperSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
                        onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                      />
                      {showSearchResults && searchResults.length > 0 && (
                        <SearchResults>
                          {searchResults.map(player => (
                            <SearchResultItem
                              key={player.id}
                              onClick={() => {
                                setSelectedPlayer(player);
                                setNewKeeperSearch(player.name);
                                setShowSearchResults(false);
                              }}
                            >
                              {player.name} ({player.position} - {player.team})
                            </SearchResultItem>
                          ))}
                        </SearchResults>
                      )}
                    </SearchContainer>
                  </FormGroup>

                  <FormGroup>
                    <Label>Team</Label>
                    <Select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
                    >
                      {settings.teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.teamName} (${team.budget} available)
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      min="1"
                      max={settings.budget}
                      value={keeperCost}
                      onChange={(e) => {
                        const value = e.target.value;
                        setKeeperCost(value === '' ? '' : parseInt(value) || '');
                        setKeeperCostError('');
                      }}
                    />
                    {keeperCostError && (
                      <div style={{ 
                        color: 'var(--color-negative)', 
                        fontSize: '12px', 
                        marginTop: '4px' 
                      }}>
                        {keeperCostError}
                      </div>
                    )}
                  </FormGroup>

                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <Button
                      onClick={handleAddKeeper}
                      disabled={!selectedPlayer}
                    >
                      Add Keeper
                    </Button>
                  </div>
                </SettingsGrid>
              </div>
            )}

            {/* Keepers Table */}
            <KeeperTable>
              <KeeperRow $isHeader>
                <div>Player</div>
                <div>Team</div>
                <div>Cost</div>
                <div>Position</div>
                <div></div>
              </KeeperRow>
              
              {keepers.length === 0 ? (
                <KeeperRow>
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No keepers assigned yet
                  </div>
                </KeeperRow>
              ) : (
                keepers.map((keeper, index) => {
                  const team = settings.teams.find(t => t.id === keeper.teamId);
                  return (
                    <KeeperRow key={index}>
                      <div>{keeper.player.name}</div>
                      <div>{team?.teamName || 'Unknown'}</div>
                      <div>${keeper.cost}</div>
                      <div>{keeper.player.position}</div>
                      <div>
                        {!settings.isDraftStarted && (
                          <button
                            onClick={() => handleRemoveKeeper(keeper)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-negative)',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                            title="Remove keeper"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </KeeperRow>
                  );
                })
              )}
            </KeeperTable>
          </SettingsCard>

        {/* Draft Control */}
        <SaveActions>
          {!settings.isDraftStarted ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Reset all settings to defaults?')) {
                    // Reset implementation would go here
                  }
                }}
                disabled={loading}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="primary"
                onClick={handleStartDraft}
                disabled={loading || settings.teams.length === 0}
              >
                Lock Settings
              </Button>
              {canUndo() && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    undo();
                    setStatusMessage({ type: 'success', message: 'Draft state restored.' });
                  }}
                  disabled={loading}
                >
                  Undo Reset
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Draft is active. Settings are locked.
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('⚠️ Unlocking settings will delete all draft data including picks and nominations. This action cannot be undone. Continue?')) {
                    resetDraft();
                    setStatusMessage({ type: 'success', message: 'Settings unlocked. All draft data has been cleared.' });
                  }
                }}
                disabled={loading}
              >
                Unlock Settings
              </Button>
            </div>
          )}
        </SaveActions>
      </ContentArea>
    </PageContainer>
  );
}