import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../utils/styledHelpers';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { createStorageAdapter } from '../adapters/storage';
import { useUnifiedStore } from '../stores/unified-store';

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
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelection(csvFile);
    } else {
      setStatus({ type: 'error', message: 'Please drop a CSV file' });
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
    
    try {
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
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    setCurrentStep(2);
    setStatus(null);
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
    if (!csvData || !csvData.fullRows) {
      setStatus({ type: 'error', message: 'No data to import. Please select a file first.' });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Transform CSV data to player format
      const players = csvData.fullRows.map((row, index) => {
        const player = {
          id: parseInt(row[0]) || index + 1,
          name: row[1] || '',
          team: row[2] || '',
          position: row[3] || '',
          points: parseFloat(row[6]) || 0,
          adp: parseInt(row[7]) || 0,
          injuryStatus: row[5] === 'NA' ? 0 : parseInt(row[5]) || 0,
          drafted: false
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
        message: `Successfully imported ${players.length} players! Calculating VBD values...` 
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
      
      console.log(`✅ Data Import: Imported ${players.length} players via draft store`);
      
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
                      {isProcessing ? 'Processing...' : 'Drop CSV file here or click to browse'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      Supports .csv files up to 10MB
                    </div>
                  </div>
                )}
              </DropZone>
              
              {csvData && (
                <FileInfo>
                  <div>
                    <strong>{csvData.filename}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(csvData.size)} • {csvData.rows.length}+ rows
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setCsvData(null);
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
                accept=".csv"
                onChange={handleFileChange}
              />
            </StepCard>
          )}

          {/* Step 3: Preview & Import */}
          {currentStep >= 3 && csvData && (
            <StepCard>
              <StepHeader>
                <StepNumber $active={currentStep === 3}>3</StepNumber>
                <StepTitle>Preview & Import</StepTitle>
              </StepHeader>
              
              <p style={{ color: 'var(--color-text2)', marginBottom: '16px' }}>
                Review your data before importing:
              </p>
              
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
              
              <ActionButtons>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCurrentStep(2);
                    setCsvData(null);
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