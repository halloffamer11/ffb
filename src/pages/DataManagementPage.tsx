import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../utils/styledHelpers';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '../stores/unified-store';
import { parseExcelFile, getExcelSheetInfo, validateExcelData, type ExcelParseResult, type SheetData } from '../utils/excel-parser';

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

const StepsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const StepCard = styled.div`
  background: ${props => theme('gradients.widget')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  box-shadow: ${props => theme('shadows.widget')};
  padding: ${props => theme('spacing.xl')};
  margin-bottom: ${props => theme('spacing.lg')};
  transition: ${props => theme('transitions.smooth')};
  
  &:hover {
    border-color: ${props => theme('colors.border2')};
    box-shadow: ${props => theme('shadows.widgetHover')};
  }
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.md')};
  margin-bottom: ${props => theme('spacing.lg')};
`;

const StepNumber = styled.div<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  
  ${props => props.$active ? `
    background: ${theme('colors.accent')};
    color: white;
  ` : `
    background: ${theme('colors.surface2')};
    color: ${theme('colors.text2')};
    border: 1px solid ${theme('colors.border1')};
  `}
`;

const StepTitle = styled.h2`
  font-size: ${props => theme('typography.fontSize.lg')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0;
`;

const DropZone = styled.div<{ $isDragOver?: boolean; $hasFile?: boolean }>`
  border: 2px dashed ${props => props.$isDragOver ? theme('colors.accent') : theme('colors.border2')};
  border-radius: ${props => theme('borderRadius.lg')};
  padding: ${props => theme('spacing.xl')};
  text-align: center;
  background: ${props => props.$isDragOver ? `${theme('colors.accent')}10` : theme('colors.surface2')};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$hasFile && `
    border-color: ${theme('colors.positive')};
    background: ${theme('colors.positiveAlpha')};
  `}
  
  &:hover {
    border-color: ${props => theme('colors.accent')};
    background: ${props => props.$hasFile ? theme('colors.positiveAlpha') : `${theme('colors.accent')}05`};
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface3')};
  border-radius: ${props => theme('borderRadius.base')};
  margin-top: ${props => theme('spacing.md')};
  border: 1px solid ${props => theme('colors.border1')};
`;

const PreviewTable = styled.div`
  margin-top: ${props => theme('spacing.lg')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  background: ${props => theme('colors.surface3')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const TableRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => theme('colors.border1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:nth-child(even) {
    background: ${props => theme('colors.surface2')};
  }
`;

const TableCell = styled.div`
  flex: 1;
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SourceSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.md')};
`;

const SourceCard = styled.div<{ $selected?: boolean }>`
  padding: ${props => theme('spacing.lg')};
  border: 2px solid ${props => props.$selected ? theme('colors.accent') : theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  background: ${props => props.$selected ? `${theme('colors.accent')}10` : theme('colors.surface2')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  text-align: center;
  
  &:hover {
    border-color: ${props => theme('colors.accent')};
    background: ${props => `${theme('colors.accent')}05`};
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'warning' }>`
  padding: ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.base')};
  margin-top: ${props => theme('spacing.md')};
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
  
  ${props => props.$type === 'warning' && `
    background: ${theme('colors.warningAlpha')};
    color: ${theme('colors.warning')};
    border: 1px solid ${theme('colors.warning')}40;
  `}
`;

const HiddenInput = styled.input`
  display: none;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.lg')};
`;

interface CSVData {
  headers: string[];
  rows: string[][];
  filename: string;
  size: number;
  fullRows?: string[][]; // Store all rows for import, separate from preview
}

interface ExcelData {
  filename: string;
  size: number;
  fileType: 'FFA' | 'FPs' | 'unknown';
  sheets: SheetData[];
  parseResult: ExcelParseResult;
}

const DATA_SOURCES = [
  { id: 'fantasypros', name: 'FantasyPros', description: 'Rankings and projections' },
  { id: 'espn', name: 'ESPN', description: 'Player data export' },
  { id: 'yahoo', name: 'Yahoo', description: 'League export' },
  { id: 'sleeper', name: 'Sleeper', description: 'Draft data' },
  { id: 'custom', name: 'Custom CSV', description: 'Your own format' }
];

export default function DataManagementPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const store = useUnifiedStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const supportedFile = files.find(file => 
      file.type === 'text/csv' || 
      file.name.endsWith('.csv') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx')
    );
    
    if (supportedFile) {
      handleFileSelection(supportedFile);
    } else {
      setStatus({ type: 'error', message: 'Please drop a CSV or Excel (.xlsx) file' });
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = async (file: File) => {
    setIsProcessing(true);
    setStatus(null);
    setCsvData(null);
    setExcelData(null);
    
    try {
      const isExcel = file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      if (isExcel) {
        // Handle Excel file
        const parseResult = await parseExcelFile(file);
        const validation = validateExcelData(parseResult);
        
        if (!parseResult.success) {
          throw new Error(parseResult.errors.join(', '));
        }
        
        const sheetInfo = await getExcelSheetInfo(file);
        
        setExcelData({
          filename: file.name,
          size: file.size,
          fileType: parseResult.fileType,
          sheets: sheetInfo,
          parseResult
        });
        
        setCurrentStep(3);
        
        // Show status with warnings if any
        const message = validation.warnings.length > 0
          ? `Successfully loaded ${file.name} (${parseResult.fileType} format) - ${validation.warnings.join(', ')}`
          : `Successfully loaded ${file.name} (${parseResult.fileType} format)`;
        
        setStatus({ 
          type: validation.warnings.length > 0 ? 'warning' : 'success', 
          message 
        });
      } else {
        // Handle CSV file (existing logic)
        const text = await file.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        // Parse CSV (simple implementation)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const allRows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        const previewRows = allRows.slice(0, 10); // Show first 10 rows for preview
        
        setCsvData({
          headers,
          rows: previewRows,
          fullRows: allRows, // Store all rows for import
          filename: file.name,
          size: file.size
        });
        
        setCurrentStep(3);
        setStatus({ type: 'success', message: `Successfully loaded ${file.name} with ${allRows.length} rows` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    setCurrentStep(2);
    setStatus(null);
  };

  const handlePurgeAllData = async () => {
    if (!window.confirm('⚠️ Are you absolutely sure you want to delete ALL data?\n\nThis will permanently remove:\n• All players and their stats\n• All draft picks and keepers\n• All league settings\n\nThis action cannot be undone!')) {
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'warning', message: 'Purging all data...' });

    try {
      // Reset the entire store
      store.reset();
      
      setStatus({ 
        type: 'success', 
        message: 'All data has been successfully purged. You can now import fresh data.' 
      });
      
      // Reset local state
      setCsvData(null);
      setExcelData(null);
      setCurrentStep(1);
      setSelectedSource('');
      
      console.log('✅ All data purged successfully');
    } catch (error) {
      console.error('Failed to purge data:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to purge data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDefaultData = async () => {
    setIsProcessing(true);
    setStatus(null);
    
    try {
      // Load the default demo data file
      const response = await fetch('/demos/data/top300_2024.csv');
      if (!response.ok) {
        throw new Error(`Failed to load default data: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('Default data file is invalid - missing data rows');
      }
      
      // Parse CSV data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const allRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
      const previewRows = allRows.slice(0, 10);
      
      setCsvData({
        headers,
        rows: previewRows,
        fullRows: allRows,
        filename: 'top300_2024.csv',
        size: text.length
      });
      
      setCurrentStep(3);
      setStatus({ 
        type: 'success', 
        message: `Successfully loaded default data with ${allRows.length} players! Ready to import.` 
      });
      
      console.log(`✅ Default Data: Loaded ${allRows.length} players from demo data`);
    } catch (error) {
      console.error('Failed to load default data:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to load default data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!csvData && !excelData) {
      setStatus({ type: 'error', message: 'No data to import. Please select a file first.' });
      return;
    }
    
    setIsProcessing(true);
    try {
      let importResult: any;
      
      if (excelData) {
        // Handle Excel import using ProjectionImporter
        if (excelData.fileType === 'FFA') {
          // Import FFA data
          const ffaData = excelData.parseResult.data as any[];
          importResult = await store.importProjections(ffaData, new Map());
        } else if (excelData.fileType === 'FPs') {
          // Import FPs data
          const fpsData = excelData.parseResult.data as Map<string, any[]>;
          importResult = await store.importProjections([], fpsData);
        } else {
          throw new Error('Unknown Excel file type - please use FFA or FPs format');
        }
        
        if (importResult.success) {
          setStatus({ 
            type: importResult.warnings.length > 0 ? 'warning' : 'success',
            message: `Successfully imported ${importResult.playersImported} players from Excel! Calculating VBD values...`
          });
          
          // Trigger VBD recalculation after Excel import
          setTimeout(async () => {
            try {
              store.updatePlayerProjections();
              console.log('✅ VBD recalculation triggered after Excel import');
              
              // Also trigger the full recalculation system
              const { recalcAll } = await import('../core/recalculation');
              await recalcAll();
              console.log('✅ Full VBD recalculation completed after Excel import');
              
              setStatus({ 
                type: importResult.warnings.length > 0 ? 'warning' : 'success',
                message: `Successfully imported ${importResult.playersImported} players from Excel! VBD calculations completed. ${importResult.warnings.join(', ')}`
              });
            } catch (error) {
              console.warn('VBD recalculation failed after Excel import:', error);
              setStatus({ 
                type: 'warning', 
                message: `Imported ${importResult.playersImported} players from Excel, but VBD calculation may be incomplete.` 
              });
            }
          }, 100);
        } else {
          throw new Error(importResult.errors.join(', '));
        }
      } else if (csvData && csvData.fullRows) {
        // Handle CSV import (legacy format)
        const players = csvData.fullRows.map((row, index) => {
          const player: any = {
            id: parseInt(row[0]) || index + 1,
            name: row[1] || '',
            team: row[2] || '',
            position: row[3] || '',
            points: parseFloat(row[6]) || 0,
            adp: parseInt(row[7]) || 0,
            injuryStatus: row[5] === 'NA' ? 0 : parseInt(row[5]) || 0,
            drafted: false,
            vbd: 0, // Will be calculated
            projections: {
              points: parseFloat(row[6]) || 0,
              source: 'csv' as const,
              lastUpdated: Date.now()
            },
            stats: {
              type: row[3] || 'QB',
              // Default stats based on position - will be minimal
              ...(row[3] === 'QB' ? {
                passYds: 0, passAtt: 0, passCmp: 0, passTDs: 0, passInt: 0,
                rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0
              } : row[3] === 'RB' ? {
                rushYds: 0, rushAtt: 0, rushTDs: 0,
                rec: 0, recYds: 0, recTDs: 0, fumbles: 0
              } : row[3] === 'WR' ? {
                rec: 0, recYds: 0, recTDs: 0,
                rushYds: 0, rushAtt: 0, rushTDs: 0, fumbles: 0
              } : row[3] === 'TE' ? {
                rec: 0, recYds: 0, recTDs: 0, fumbles: 0
              } : row[3] === 'K' ? {
                fg: 0, fga: 0, fg_0019: 0, fg_2029: 0, fg_3039: 0, fg_4049: 0, fg_50: 0, xp: 0
              } : {
                sacks: 0, int: 0, fumbleRec: 0, fumbleForced: 0, td: 0, safety: 0,
                pointsAllowed: 0, yardsAllowed: 0
              })
            }
            // vbd will be calculated by recalculation system
          };
          
          // Add byeWeek if available in CSV
          if (csvData.headers.includes('byeWeek') && row[4]) {
            player.byeWeek = parseInt(row[4]) || 0;
          }
          
          return player;
        });
        
        // Use the unified store to import players
        store.importPlayers(players);
        
        setStatus({ 
          type: 'success', 
          message: `Successfully imported ${players.length} players from CSV! Calculating VBD values...` 
        });
        
        // Trigger recalculation for VBD calculation in background (non-blocking)
        setTimeout(async () => {
          try {
            const { recalcAll } = await import('../core/recalculation');
            await recalcAll();
            console.log('✅ VBD recalculation completed after import');
            setStatus({ 
              type: 'success', 
              message: `Successfully imported ${players.length} players! VBD calculations completed.` 
            });
          } catch (error) {
            console.warn('VBD recalculation failed:', error);
            setStatus({ 
              type: 'warning', 
              message: `Imported ${players.length} players, but VBD calculation failed.` 
            });
          }
        }, 100);
        
        console.log(`✅ Data Import: Imported ${players.length} players via unified store`);
      }
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Data import failed:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/')} aria-label="Back to dashboard">
          ← Back
        </BackButton>
        <Title>Data Management</Title>
      </Header>
      
      <ContentArea>
        <StepsContainer>
          {/* Current Data Status */}
          <StepCard>
            <StepHeader>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                background: 'var(--color-accent)',
                color: 'white'
              }}>
                📊
              </div>
              <StepTitle>Current Data Status</StepTitle>
            </StepHeader>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ 
                padding: '16px', 
                background: 'var(--color-surface2)', 
                borderRadius: '8px',
                border: '1px solid var(--color-border1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                  {store.players.length}
                </div>
                <div style={{ color: 'var(--color-text2)', fontSize: '14px' }}>Players Loaded</div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'var(--color-surface2)', 
                borderRadius: '8px',
                border: '1px solid var(--color-border1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-positive)' }}>
                  {store.picks.length}
                </div>
                <div style={{ color: 'var(--color-text2)', fontSize: '14px' }}>Draft Picks</div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'var(--color-surface2)', 
                borderRadius: '8px',
                border: '1px solid var(--color-border1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                  {store.keepers.length}
                </div>
                <div style={{ color: 'var(--color-text2)', fontSize: '14px' }}>Keepers</div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'var(--color-surface2)', 
                borderRadius: '8px',
                border: '1px solid var(--color-border1)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  Data Source
                </div>
                <div style={{ color: 'var(--color-text2)', fontSize: '12px' }}>
                  {store.metadata.dataSource || 'Unknown'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', marginTop: '4px' }}>
                  Last: {store.metadata.lastModified ? new Date(store.metadata.lastModified).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>

            {store.players.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface3)', borderRadius: '8px' }}>
                <strong>Position Breakdown:</strong>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(
                    store.players.reduce((acc, player) => {
                      acc[player.position] = (acc[player.position] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([position, count]) => (
                    <span key={position} style={{ fontSize: '12px' }}>
                      <strong>{position}:</strong> {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {store.players.length > 0 && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#fee', borderRadius: '8px', border: '1px solid #fcc' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#d63384' }}>⚠️ Danger Zone</strong>
                  <div style={{ fontSize: '14px', color: '#6f4e4e', marginTop: '4px' }}>
                    This will permanently delete all imported data including players, picks, keepers, and settings.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={handlePurgeAllData}
                  disabled={isProcessing}
                  style={{
                    background: '#dc3545',
                    borderColor: '#dc3545',
                    color: 'white'
                  }}
                >
                  {isProcessing ? 'Purging...' : '🗑️ Purge All Data'}
                </Button>
              </div>
            )}
          </StepCard>

          {/* Step 1: Select Data Source */}
          <StepCard>
            <StepHeader>
              <StepNumber $active={currentStep === 1}>1</StepNumber>
              <StepTitle>Select Data Source</StepTitle>
            </StepHeader>
            
            <p style={{ color: 'var(--color-text2)', marginBottom: '16px' }}>
              Choose the source of your player data or rankings:
            </p>
            
            <SourceSelector>
              {DATA_SOURCES.map(source => (
                <SourceCard
                  key={source.id}
                  $selected={selectedSource === source.id}
                  onClick={() => handleSourceSelect(source.id)}
                >
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>{source.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {source.description}
                  </div>
                </SourceCard>
              ))}
            </SourceSelector>
          </StepCard>

          {/* Step 2: Upload File */}
          {currentStep >= 2 && (
            <StepCard>
              <StepHeader>
                <StepNumber $active={currentStep === 2}>2</StepNumber>
                <StepTitle>Upload CSV File</StepTitle>
              </StepHeader>
              
              <p style={{ color: 'var(--color-text2)', marginBottom: '16px' }}>
                Upload your {DATA_SOURCES.find(s => s.id === selectedSource)?.name} CSV file or use our sample data:
              </p>
              
              <ActionButtons style={{ marginBottom: '16px' }}>
                <Button
                  variant="primary"
                  onClick={handleLoadDefaultData}
                  disabled={isProcessing}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                >
                  {isProcessing ? 'Loading...' : '🚀 Load Default Data (Top 300 2024)'}
                </Button>
              </ActionButtons>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '16px 0',
                color: 'var(--color-text-muted)',
                fontSize: '14px'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border1)' }}></div>
                <span style={{ padding: '0 16px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border1)' }}></div>
              </div>
              
              <DropZone
                $isDragOver={isDragOver}
                $hasFile={!!csvData}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                {csvData ? (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                    <div>File loaded successfully!</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📁</div>
                    <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                      {isProcessing ? 'Processing...' : 'Drop CSV or Excel file here or click to browse'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      Supports .csv and .xlsx files up to 10MB
                    </div>
                  </div>
                )}
              </DropZone>
              
              {(csvData || excelData) && (
                <FileInfo>
                  <div>
                    <strong>{csvData?.filename || excelData?.filename}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(csvData?.size || excelData?.size || 0)} • 
                      {csvData ? ` ${csvData.rows.length}+ rows` : 
                       excelData ? ` ${excelData.sheets.length} sheets (${excelData.fileType})` : ''}
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setCsvData(null);
                      setExcelData(null);
                      setCurrentStep(2);
                    }}
                  >
                    Remove
                  </Button>
                </FileInfo>
              )}
              
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
              />
            </StepCard>
          )}

          {/* Step 3: Preview & Import */}
          {currentStep >= 3 && (csvData || excelData) && (
            <StepCard>
              <StepHeader>
                <StepNumber $active={currentStep === 3}>3</StepNumber>
                <StepTitle>Preview & Import</StepTitle>
              </StepHeader>
              
              <p style={{ color: 'var(--color-text2)', marginBottom: '16px' }}>
                Review your data before importing:
              </p>
              
              {csvData && (
                <PreviewTable>
                  <TableHeader>
                    {csvData.headers.map((header, index) => (
                      <TableCell key={index}>
                        <strong>{header}</strong>
                      </TableCell>
                    ))}
                  </TableHeader>
                  {csvData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} title={cell}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </PreviewTable>
              )}
              
              {excelData && (
                <div>
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-surface2)', borderRadius: '8px' }}>
                    <strong>Excel File Info:</strong>
                    <br />
                    <span style={{ color: 'var(--color-text2)' }}>
                      File Type: {excelData.fileType} • Sheets: {excelData.sheets.length}
                    </span>
                  </div>
                  
                  {excelData.sheets.map((sheet, index) => (
                    <div key={index} style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '8px 0', color: 'var(--color-text1)' }}>
                        Sheet: {sheet.name} ({sheet.rowCount} rows)
                      </h4>
                      <PreviewTable>
                        <TableHeader>
                          {sheet.headers.slice(0, 8).map((header, headerIndex) => (
                            <TableCell key={headerIndex}>
                              <strong>{header}</strong>
                            </TableCell>
                          ))}
                          {sheet.headers.length > 8 && (
                            <TableCell><strong>...</strong></TableCell>
                          )}
                        </TableHeader>
                        <TableRow>
                          <TableCell style={{ 
                            textAlign: 'center', 
                            fontStyle: 'italic', 
                            color: 'var(--color-text-muted)',
                            gridColumn: `1 / ${Math.min(sheet.headers.length, 9) + 1}`
                          }}>
                            Preview available after import
                          </TableCell>
                        </TableRow>
                      </PreviewTable>
                    </div>
                  ))}
                </div>
              )}
              
              <ActionButtons>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCurrentStep(2);
                    setCsvData(null);
                    setExcelData(null);
                  }}
                  disabled={isProcessing}
                >
                  Upload Different File
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Importing...' : 'Import Data'}
                </Button>
              </ActionButtons>
            </StepCard>
          )}

          {status && (
            <StatusMessage $type={status.type}>
              {status.message}
            </StatusMessage>
          )}
        </StepsContainer>
      </ContentArea>
    </PageContainer>
  );
}