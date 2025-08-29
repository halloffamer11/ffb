import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { theme } from '../utils/styledHelpers';
import { useUnifiedStore } from '../stores/unified-store';
import { DataInspector } from '../components/developer/DataInspector';
import { PerformanceMonitor } from '../components/developer/PerformanceMonitor';
import { StorageViewer } from '../components/developer/StorageViewer';

const DeveloperContainer = styled.div`
  min-height: 100vh;
  background: ${props => theme('colors.bg')};
  color: ${props => theme('colors.text1')};
  padding: ${props => theme('spacing.xl')};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => theme('spacing.xl')};
  padding-bottom: ${props => theme('spacing.lg')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface2')};
  color: ${props => theme('colors.text1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  font-size: ${props => theme('typography.fontSize.sm')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => theme('colors.surface3')};
    border-color: ${props => theme('colors.border2')};
  }
`;

const Title = styled.h1`
  font-size: ${props => theme('typography.fontSize.xl')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  color: ${props => theme('colors.text1')};
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: ${props => theme('spacing.xl')};
`;

const SectionTitle = styled.h2`
  font-size: ${props => theme('typography.fontSize.lg')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0 0 ${props => theme('spacing.md')} 0;
  padding-bottom: ${props => theme('spacing.sm')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => theme('spacing.lg')};
  margin-bottom: ${props => theme('spacing.lg')};
`;

const Card = styled.div`
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  padding: ${props => theme('spacing.lg')};
  box-shadow: ${props => theme('shadows.widget')};
`;

const CardTitle = styled.h3`
  font-size: ${props => theme('typography.fontSize.md')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0 0 ${props => theme('spacing.sm')} 0;
`;

const CardDescription = styled.p`
  font-size: ${props => theme('typography.fontSize.sm')};
  color: ${props => theme('colors.text2')};
  margin: 0 0 ${props => theme('spacing.md')} 0;
  line-height: 1.5;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    if (props.$variant === 'primary') return theme('colors.accent');
    if (props.$variant === 'danger') return theme('colors.negative');
    return theme('colors.surface2');
  }};
  color: ${props => {
    if (props.$variant === 'primary') return 'white';
    if (props.$variant === 'danger') return 'white';
    return theme('colors.text1');
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return theme('colors.accent');
    if (props.$variant === 'danger') return theme('colors.negative');
    return theme('colors.border1');
  }};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  margin-right: ${props => theme('spacing.sm')};
  margin-bottom: ${props => theme('spacing.sm')};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.base')};
  font-size: ${props => theme('typography.fontSize.sm')};
  margin-bottom: ${props => theme('spacing.md')};
  
  background: ${props => {
    if (props.$type === 'success') return theme('colors.positiveAlpha');
    if (props.$type === 'error') return theme('colors.negativeAlpha');
    return theme('colors.infoAlpha');
  }};
  
  color: ${props => {
    if (props.$type === 'success') return theme('colors.positive');
    if (props.$type === 'error') return theme('colors.negative');
    return theme('colors.info');
  }};
  
  border: 1px solid ${props => {
    if (props.$type === 'success') return theme('colors.positive');
    if (props.$type === 'error') return theme('colors.negative');
    return theme('colors.info');
  }};
`;

const DataViewer = styled.pre`
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.md')};
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: ${props => theme('colors.text1')};
  overflow: auto;
  max-height: 300px;
  white-space: pre-wrap;
  margin-top: ${props => theme('spacing.sm')};
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => theme('spacing.lg')};
`;

const TabHeader = styled.div`
  display: flex;
  gap: ${props => theme('spacing.md')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  margin-bottom: ${props => theme('spacing.lg')};
`;

const TabButton = styled.button<{ $active?: boolean }>`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.lg')};
  background: ${props => props.$active ? theme('colors.accent') : 'transparent'};
  color: ${props => props.$active ? '#0f1419' : theme('colors.text1')};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? theme('colors.accent') : 'transparent'};
  cursor: pointer;
  font-size: ${props => theme('typography.fontSize.md')};
  font-weight: ${props => props.$active ? theme('typography.fontWeight.bold') : theme('typography.fontWeight.medium')};
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    background: ${props => props.$active ? theme('colors.accent') : theme('colors.surface2')};
  }
`;

const TabContent = styled.div`
  min-height: 600px;
`;

export default function DeveloperPage() {
  const navigate = useNavigate();
  
  // 🔥 USE UNIFIED STORE DIRECTLY - NO MORE LEGACY WRAPPER
  const unifiedStore = useUnifiedStore();
  const players = unifiedStore.players;
  const picks = unifiedStore.picks;
  const settings = unifiedStore.settings;
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [viewingData, setViewingData] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'legacy' | 'inspector' | 'performance' | 'storage'>('inspector');

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const loadTestData = async () => {
    try {
      // Load the demo data from the known path
      const response = await fetch('/demos/data/top300_2024.csv');
      if (!response.ok) throw new Error('Failed to load test data');
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const testPlayers = lines.slice(1, 51) // Load first 50 players
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',');
          // CSV format: id,name,team,position,byeWeek,injuryStatus,points,adp
          return {
            id: parseInt(values[0]) || (index + 1),
            name: values[1]?.replace(/"/g, '') || `Player ${index + 1}`,
            team: values[2]?.replace(/"/g, '') || 'FA',
            position: values[3]?.replace(/"/g, '') || 'RB',
            byeWeek: parseInt(values[4]) || 0,
            injuryStatus: values[5]?.replace(/"/g, '') === 'NA' ? 0 : parseInt(values[5]) || 0,
            points: parseFloat(values[6]) || 0,
            adp: parseFloat(values[7]) || 100 + index,
            drafted: false
          };
        });

      unifiedStore.importPlayers(testPlayers);
      showStatus('success', `Loaded ${testPlayers.length} test players successfully`);
      
      // Trigger recalculation for VBD calculation in background (non-blocking)
      setTimeout(async () => {
        try {
          showStatus('info', 'Calculating VBD values...');
          const { recalcAll } = await import('../core/recalculation');
          await recalcAll();
          console.log('✅ VBD recalculation completed after import');
          showStatus('success', 'VBD calculation completed!');
        } catch (error) {
          console.warn('VBD recalculation failed:', error);
          showStatus('warning', 'VBD calculation failed, but player data loaded');
        }
      }, 100); // Run after current event loop
    } catch (error) {
      showStatus('error', `Failed to load test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      unifiedStore.reset();
      showStatus('info', 'All data cleared');
    }
  };

  const simulateDraft = () => {
    if (players.length === 0) {
      showStatus('error', 'No players loaded. Load test data first.');
      return;
    }

    // Draft a few random players
    const availablePlayers = players.filter(p => !p.drafted);
    const playersToDraft = availablePlayers.slice(0, 5);
    
    playersToDraft.forEach((player, index) => {
      const draftPick = {
        player: {
          id: player.id,
          name: player.name,
          position: player.position
        },
        teamId: index + 1,
        price: Math.floor(Math.random() * 50) + 1
      };
      
      // Use unified store method
      unifiedStore.draftPlayer(draftPick.player, draftPick.teamId, draftPick.price);
    });

    showStatus('success', `Simulated drafting ${playersToDraft.length} players`);
  };

  const viewData = (dataType: string) => {
    let data;
    
    switch (dataType) {
      case 'players':
        data = players.slice(0, 10); // Show first 10 players
        break;
      case 'picks':
        data = picks;
        break;
      case 'settings':
        data = settings;
        break;
      case 'fullState':
        data = unifiedStore.getState();
        break;
      default:
        data = { error: 'Unknown data type' };
    }
    
    setViewingData(JSON.stringify(data, null, 2));
  };

  return (
    <DeveloperContainer>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          ← Back to Dashboard
        </BackButton>
        <Title>Developer Tools</Title>
      </Header>

      {statusMessage && (
        <StatusMessage $type={statusMessage.type}>
          {statusMessage.message}
        </StatusMessage>
      )}

      <TabContainer>
        <TabHeader>
          <TabButton 
            $active={activeTab === 'inspector'} 
            onClick={() => setActiveTab('inspector')}
          >
            Data Inspector
          </TabButton>
          <TabButton 
            $active={activeTab === 'performance'} 
            onClick={() => setActiveTab('performance')}
          >
            Performance Monitor
          </TabButton>
          <TabButton 
            $active={activeTab === 'storage'} 
            onClick={() => setActiveTab('storage')}
          >
            Storage Viewer
          </TabButton>
          <TabButton 
            $active={activeTab === 'legacy'} 
            onClick={() => setActiveTab('legacy')}
          >
            Legacy Tools
          </TabButton>
        </TabHeader>

        <TabContent>
          {activeTab === 'inspector' && <DataInspector height="800px" />}
          {activeTab === 'performance' && <PerformanceMonitor height="800px" />}
          {activeTab === 'storage' && <StorageViewer height="800px" />}
          {activeTab === 'legacy' && (
            <>
              <Section>
                <SectionTitle>Test Data Management</SectionTitle>
                <Grid>
                  <Card>
                    <CardTitle>Load Test Players</CardTitle>
                    <CardDescription>
                      Load sample player data from the demo CSV file for testing purposes. 
                      This will import the first 50 players from the top300_2024.csv file.
                    </CardDescription>
                    <ActionButton $variant="primary" onClick={loadTestData}>
                      Load Test Data
                    </ActionButton>
                  </Card>

                  <Card>
                    <CardTitle>Clear All Data</CardTitle>
                    <CardDescription>
                      Remove all players, picks, and reset the application state. 
                      This action cannot be undone.
                    </CardDescription>
                    <ActionButton $variant="danger" onClick={clearAllData}>
                      Clear All Data
                    </ActionButton>
                  </Card>
                </Grid>
              </Section>

              <Section>
                <SectionTitle>Draft Simulation</SectionTitle>
                <Grid>
                  <Card>
                    <CardTitle>Simulate Draft Picks</CardTitle>
                    <CardDescription>
                      Automatically draft 5 random players with random prices to test 
                      draft functionality and widget updates.
                    </CardDescription>
                    <ActionButton $variant="primary" onClick={simulateDraft}>
                      Simulate Draft
                    </ActionButton>
                  </Card>
                </Grid>
              </Section>

              <Section>
                <SectionTitle>Data Inspection</SectionTitle>
                <Grid>
                  <Card>
                    <CardTitle>View Application Data</CardTitle>
                    <CardDescription>
                      Inspect the current state of players, picks, settings, and other data 
                      for debugging purposes.
                    </CardDescription>
                    <ActionButton onClick={() => viewData('players')}>View Players (10)</ActionButton>
                    <ActionButton onClick={() => viewData('picks')}>View Picks</ActionButton>
                    <ActionButton onClick={() => viewData('settings')}>View Settings</ActionButton>
                    <ActionButton onClick={() => viewData('fullState')}>View Full State</ActionButton>
                  </Card>
                </Grid>
                
                {viewingData && (
                  <Card>
                    <CardTitle>Data Output</CardTitle>
                    <ActionButton onClick={() => setViewingData(null)}>Close</ActionButton>
                    <DataViewer>{viewingData}</DataViewer>
                  </Card>
                )}
              </Section>

              <Section>
                <SectionTitle>Current State Summary</SectionTitle>
                <Grid>
                  <Card>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>
                      Players Loaded: {players.length}<br/>
                      Picks Made: {picks.length}<br/>
                      Settings Configured: {Object.keys(settings).length}<br/>
                      Store Type: UNIFIED (Legacy Eliminated ✅)<br/>
                      Data Namespace: workspace::
                    </CardDescription>
                  </Card>
                </Grid>
              </Section>
            </>
          )}
        </TabContent>
      </TabContainer>
    </DeveloperContainer>
  );
}