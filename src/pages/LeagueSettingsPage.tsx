import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../utils/styledHelpers';
import { createStorageAdapter } from '../adapters/storage';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

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
  gap: ${props => theme('spacing.xl')};
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

interface LeagueSettings {
  leagueSize: number;
  auctionBudget: number;
  scoringFormat: 'standard' | 'ppr' | 'halfppr' | 'custom';
  roster: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    k: number;
    dst: number;
    flex: number;
    bench: number;
  };
  customScoring?: {
    passingYards: number;
    passingTDs: number;
    interceptions: number;
    rushingYards: number;
    rushingTDs: number;
    receivingYards: number;
    receivingTDs: number;
    receptions: number;
  };
}

const defaultSettings: LeagueSettings = {
  leagueSize: 12,
  auctionBudget: 200,
  scoringFormat: 'ppr',
  roster: {
    qb: 1,
    rb: 2,
    wr: 2,
    te: 1,
    k: 1,
    dst: 1,
    flex: 1,
    bench: 6
  },
  customScoring: {
    passingYards: 0.04,
    passingTDs: 4,
    interceptions: -2,
    rushingYards: 0.1,
    rushingTDs: 6,
    receivingYards: 0.1,
    receivingTDs: 6,
    receptions: 1
  }
};

export default function LeagueSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LeagueSettings>(defaultSettings);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Initialize storage adapter
  const storage = createStorageAdapter({ 
    namespace: 'ffb_league_settings',
    version: '1.0.0'
  });

  // Load saved settings on mount
  useEffect(() => {
    if (storage.isAvailable()) {
      const saved = storage.get('settings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...saved }));
      }
    }
  }, []);

  const handleInputChange = (field: keyof LeagueSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setStatusMessage(null);
  };

  const handleRosterChange = (position: keyof LeagueSettings['roster'], value: number) => {
    setSettings(prev => ({
      ...prev,
      roster: {
        ...prev.roster,
        [position]: value
      }
    }));
    setStatusMessage(null);
  };

  const handleCustomScoringChange = (field: keyof NonNullable<LeagueSettings['customScoring']>, value: number) => {
    setSettings(prev => ({
      ...prev,
      customScoring: {
        ...prev.customScoring!,
        [field]: value
      }
    }));
    setStatusMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (storage.isAvailable()) {
        const result = storage.set('settings', settings);
        if (result.ok) {
          setStatusMessage({ type: 'success', message: 'League settings saved successfully!' });
        } else {
          setStatusMessage({ type: 'error', message: `Failed to save settings: ${result.error}` });
        }
      } else {
        setStatusMessage({ type: 'error', message: 'Storage not available' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setStatusMessage(null);
  };

  const totalRosterSpots = Object.values(settings.roster).reduce((sum, count) => sum + count, 0);

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/')} aria-label="Back to dashboard">
          ← Back
        </BackButton>
        <Title>League Settings</Title>
      </Header>
      
      <ContentArea>
        {statusMessage && (
          <StatusMessage $type={statusMessage.type}>
            {statusMessage.message}
          </StatusMessage>
        )}
        
        <SettingsGrid>
          <SettingsCard>
            <CardTitle>
              ⚙️ Basic League Configuration
            </CardTitle>
            
            <FormGroup>
              <Label htmlFor="leagueSize">League Size</Label>
              <Select
                id="leagueSize"
                value={settings.leagueSize}
                onChange={(e) => handleInputChange('leagueSize', parseInt(e.target.value))}
              >
                <option value="8">8 Teams</option>
                <option value="10">10 Teams</option>
                <option value="12">12 Teams</option>
                <option value="14">14 Teams</option>
                <option value="16">16 Teams</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="auctionBudget">Auction Budget ($)</Label>
              <Input
                id="auctionBudget"
                type="number"
                min="100"
                max="1000"
                step="10"
                value={settings.auctionBudget}
                onChange={(e) => handleInputChange('auctionBudget', parseInt(e.target.value))}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="scoringFormat">Scoring Format</Label>
              <Select
                id="scoringFormat"
                value={settings.scoringFormat}
                onChange={(e) => handleInputChange('scoringFormat', e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="halfppr">Half PPR</option>
                <option value="ppr">Full PPR</option>
                <option value="custom">Custom</option>
              </Select>
            </FormGroup>
          </SettingsCard>

          <SettingsCard>
            <CardTitle>
              👥 Roster Configuration
            </CardTitle>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Total roster spots: {totalRosterSpots}
            </p>
            
            <RosterGrid>
              <FormGroup>
                <Label htmlFor="qb">QB</Label>
                <Input
                  id="qb"
                  type="number"
                  min="0"
                  max="3"
                  value={settings.roster.qb}
                  onChange={(e) => handleRosterChange('qb', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="rb">RB</Label>
                <Input
                  id="rb"
                  type="number"
                  min="0"
                  max="5"
                  value={settings.roster.rb}
                  onChange={(e) => handleRosterChange('rb', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="wr">WR</Label>
                <Input
                  id="wr"
                  type="number"
                  min="0"
                  max="5"
                  value={settings.roster.wr}
                  onChange={(e) => handleRosterChange('wr', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="te">TE</Label>
                <Input
                  id="te"
                  type="number"
                  min="0"
                  max="3"
                  value={settings.roster.te}
                  onChange={(e) => handleRosterChange('te', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="k">K</Label>
                <Input
                  id="k"
                  type="number"
                  min="0"
                  max="2"
                  value={settings.roster.k}
                  onChange={(e) => handleRosterChange('k', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="dst">DST</Label>
                <Input
                  id="dst"
                  type="number"
                  min="0"
                  max="2"
                  value={settings.roster.dst}
                  onChange={(e) => handleRosterChange('dst', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="flex">FLEX</Label>
                <Input
                  id="flex"
                  type="number"
                  min="0"
                  max="3"
                  value={settings.roster.flex}
                  onChange={(e) => handleRosterChange('flex', parseInt(e.target.value))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="bench">Bench</Label>
                <Input
                  id="bench"
                  type="number"
                  min="3"
                  max="12"
                  value={settings.roster.bench}
                  onChange={(e) => handleRosterChange('bench', parseInt(e.target.value))}
                />
              </FormGroup>
            </RosterGrid>
          </SettingsCard>

          {settings.scoringFormat === 'custom' && settings.customScoring && (
            <SettingsCard style={{ gridColumn: '1 / -1' }}>
              <CardTitle>
                📊 Custom Scoring Settings
              </CardTitle>
              
              <SettingsGrid>
                <div>
                  <FormGroup>
                    <Label htmlFor="passingYards">Passing Yards (per yard)</Label>
                    <Input
                      id="passingYards"
                      type="number"
                      step="0.01"
                      value={settings.customScoring.passingYards}
                      onChange={(e) => handleCustomScoringChange('passingYards', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="passingTDs">Passing TDs</Label>
                    <Input
                      id="passingTDs"
                      type="number"
                      step="0.5"
                      value={settings.customScoring.passingTDs}
                      onChange={(e) => handleCustomScoringChange('passingTDs', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="interceptions">Interceptions</Label>
                    <Input
                      id="interceptions"
                      type="number"
                      step="0.5"
                      value={settings.customScoring.interceptions}
                      onChange={(e) => handleCustomScoringChange('interceptions', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="receptions">Receptions</Label>
                    <Input
                      id="receptions"
                      type="number"
                      step="0.1"
                      value={settings.customScoring.receptions}
                      onChange={(e) => handleCustomScoringChange('receptions', parseFloat(e.target.value))}
                    />
                  </FormGroup>
                </div>

                <div>
                  <FormGroup>
                    <Label htmlFor="rushingYards">Rushing Yards (per yard)</Label>
                    <Input
                      id="rushingYards"
                      type="number"
                      step="0.01"
                      value={settings.customScoring.rushingYards}
                      onChange={(e) => handleCustomScoringChange('rushingYards', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="rushingTDs">Rushing TDs</Label>
                    <Input
                      id="rushingTDs"
                      type="number"
                      step="0.5"
                      value={settings.customScoring.rushingTDs}
                      onChange={(e) => handleCustomScoringChange('rushingTDs', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="receivingYards">Receiving Yards (per yard)</Label>
                    <Input
                      id="receivingYards"
                      type="number"
                      step="0.01"
                      value={settings.customScoring.receivingYards}
                      onChange={(e) => handleCustomScoringChange('receivingYards', parseFloat(e.target.value))}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="receivingTDs">Receiving TDs</Label>
                    <Input
                      id="receivingTDs"
                      type="number"
                      step="0.5"
                      value={settings.customScoring.receivingTDs}
                      onChange={(e) => handleCustomScoringChange('receivingTDs', parseFloat(e.target.value))}
                    />
                  </FormGroup>
                </div>
              </SettingsGrid>
            </SettingsCard>
          )}
        </SettingsGrid>

        <SaveActions>
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </SaveActions>
      </ContentArea>
    </PageContainer>
  );
}