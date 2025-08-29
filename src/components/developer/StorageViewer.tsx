/**
 * Storage Viewer Component
 * 
 * Visual representation of localStorage usage, namespace distribution,
 * data integrity status, and storage management tools.
 */

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../utils/styledHelpers';
import { createEnhancedStorageAdapter, migrateStorageNamespaces } from '../../adapters/storage';

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => theme('colors.surface1')};
  border-radius: ${props => theme('borderRadius.lg')};
  border: 1px solid ${props => theme('colors.border1')};
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const Title = styled.h3`
  font-size: ${props => theme('typography.fontSize.lg')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'warning' }>`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return theme('colors.accent');
      case 'danger': return theme('colors.negative');
      case 'warning': return theme('colors.warning');
      default: return theme('colors.surface3');
    }
  }};
  color: ${props => props.$variant === 'primary' || props.$variant === 'danger' || props.$variant === 'warning' 
    ? '#0f1419' : theme('colors.text1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => props.$variant ? theme('typography.fontWeight.semibold') : theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  margin-left: ${props => theme('spacing.xs')};
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StorageOverview = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const UsageCard = styled.div`
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.md')};
`;

const UsageTitle = styled.h4`
  font-size: ${props => theme('typography.fontSize.md')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin: 0 0 ${props => theme('spacing.md')} 0;
`;

const UsageBar = styled.div`
  height: 20px;
  background: ${props => theme('colors.surface3')};
  border-radius: ${props => theme('borderRadius.base')};
  overflow: hidden;
  margin: ${props => theme('spacing.sm')} 0;
  position: relative;
`;

const UsageFill = styled.div<{ $percentage: number; $color: string }>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: ${props => props.$color};
  transition: width 0.3s ease;
`;

const UsageLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${props => theme('typography.fontSize.sm')};
  color: ${props => theme('colors.text2')};
  margin-top: ${props => theme('spacing.xs')};
`;

const NamespaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const NamespaceCard = styled.div<{ $healthy: boolean }>`
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => props.$healthy ? theme('colors.positive') : theme('colors.negative')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.md')};
`;

const NamespaceTitle = styled.div`
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin-bottom: ${props => theme('spacing.sm')};
  font-family: 'Monaco', 'Menlo', monospace;
`;

const NamespaceStats = styled.div`
  font-size: ${props => theme('typography.fontSize.sm')};
  color: ${props => theme('colors.text2')};
  line-height: 1.4;
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .stat-label {
    color: ${props => theme('colors.textMuted')};
  }
  
  .stat-value {
    font-family: 'Monaco', 'Menlo', monospace;
    color: ${props => theme('colors.text1')};
  }
`;

const KeysList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => theme('spacing.md')};
`;

const KeysHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => theme('spacing.md')};
`;

const KeyItem = styled.div<{ $corrupted?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => theme('spacing.sm')};
  background: ${props => props.$corrupted ? theme('colors.negativeAlpha') : theme('colors.surface2')};
  border: 1px solid ${props => props.$corrupted ? theme('colors.negative') : theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  margin-bottom: ${props => theme('spacing.xs')};
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const KeyName = styled.div`
  flex: 1;
  color: ${props => theme('colors.text1')};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const KeySize = styled.div`
  color: ${props => theme('colors.textMuted')};
  margin: 0 ${props => theme('spacing.md')};
  min-width: 80px;
  text-align: right;
`;

const KeyActions = styled.div`
  display: flex;
  gap: ${props => theme('spacing.xs')};
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  background: ${props => {
    switch (props.$type) {
      case 'success': return theme('colors.positiveAlpha');
      case 'error': return theme('colors.negativeAlpha');
      default: return theme('colors.infoAlpha');
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return theme('colors.positive');
      case 'error': return theme('colors.negative');
      default: return theme('colors.info');
    }
  }};
  border-radius: ${props => theme('borderRadius.base')};
  font-size: ${props => theme('typography.fontSize.sm')};
  margin: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
`;

interface StorageViewerProps {
  height?: string;
}

export const StorageViewer: React.FC<StorageViewerProps> = ({ height = '600px' }) => {
  const [storageData, setStorageData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const storageAdapter = useMemo(() => {
    return createEnhancedStorageAdapter({ namespace: 'workspace', version: '2.0.0' });
  }, []);

  // Load storage data
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // Get all storage information
        const keys = storageAdapter.keys();
        const totalSize = storageAdapter.bytesUsed();
        const integrity = storageAdapter.checkIntegrity();
        const metrics = storageAdapter.getMetrics();
        
        // Scan all localStorage for namespace analysis
        const namespaces = new Map();
        if (typeof window !== 'undefined' && window.localStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const namespace = key.includes('::') ? key.split('::')[0] : 'global';
              const value = localStorage.getItem(key);
              const size = key.length + (value ? value.length : 0);
              
              if (!namespaces.has(namespace)) {
                namespaces.set(namespace, { keys: [], totalSize: 0, healthy: true });
              }
              
              const nsData = namespaces.get(namespace);
              nsData.keys.push({ key, size, corrupted: false });
              nsData.totalSize += size;
            }
          }
        }

        // Get detailed key information
        const keyDetails = keys.map(key => {
          const value = storageAdapter.get(key);
          const size = JSON.stringify(value).length;
          const corrupted = integrity.corruptedKeys.includes(key);
          
          return {
            key,
            size,
            corrupted,
            value,
            type: Array.isArray(value) ? 'array' : typeof value
          };
        });

        setStorageData({
          keys: keyDetails,
          totalSize,
          integrity,
          metrics,
          namespaces: Array.from(namespaces.entries()).map(([name, data]) => ({ name, ...data })),
          quota: getStorageQuota()
        });
      } catch (error) {
        showStatus('error', `Failed to load storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    loadStorageData();
  }, [storageAdapter, refreshKey]);

  const getStorageQuota = (): { used: number; total: number } => {
    try {
      // Estimate localStorage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += key.length + (value ? value.length : 0);
        }
      }
      
      // Most browsers have ~10MB localStorage limit
      const total = 10 * 1024 * 1024;
      return { used, total };
    } catch {
      return { used: 0, total: 10 * 1024 * 1024 };
    }
  };

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleMigrateNamespaces = async () => {
    try {
      const result = migrateStorageNamespaces(storageAdapter);
      if (result.ok) {
        showStatus('success', `Migration completed: ${result.migrated} items migrated`);
        setRefreshKey(prev => prev + 1);
      } else {
        showStatus('error', `Migration failed: ${result.error}`);
      }
    } catch (error) {
      showStatus('error', `Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRepairStorage = async () => {
    try {
      const result = storageAdapter.repair();
      if (result.healthy) {
        showStatus('success', `Storage repaired: ${result.repairedKeys} corrupted keys removed`);
      } else {
        showStatus('warning', `Partial repair: ${result.repairedKeys}/${result.corruptedKeys} keys repaired`);
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      showStatus('error', `Repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to clear all storage? This cannot be undone.')) {
      try {
        const keys = storageAdapter.keys();
        keys.forEach(key => storageAdapter.remove(key));
        showStatus('info', 'Storage cleared successfully');
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        showStatus('error', `Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDeleteKey = (key: string) => {
    if (window.confirm(`Delete key "${key}"?`)) {
      try {
        storageAdapter.remove(key);
        showStatus('info', `Key "${key}" deleted`);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        showStatus('error', `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!storageData) {
    return (
      <ViewerContainer style={{ height }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading storage data...</div>
      </ViewerContainer>
    );
  }

  const usagePercentage = (storageData.quota.used / storageData.quota.total) * 100;

  return (
    <ViewerContainer style={{ height }}>
      <ViewerHeader>
        <Title>Storage Viewer</Title>
        <div>
          <ActionButton onClick={() => setRefreshKey(prev => prev + 1)}>
            Refresh
          </ActionButton>
          <ActionButton $variant="warning" onClick={handleMigrateNamespaces}>
            Migrate Legacy
          </ActionButton>
          <ActionButton $variant="primary" onClick={handleRepairStorage}>
            Repair Storage
          </ActionButton>
          <ActionButton $variant="danger" onClick={handleClearStorage}>
            Clear All
          </ActionButton>
        </div>
      </ViewerHeader>

      {statusMessage && (
        <StatusMessage $type={statusMessage.type}>
          {statusMessage.message}
        </StatusMessage>
      )}

      <StorageOverview>
        <UsageCard>
          <UsageTitle>Storage Usage</UsageTitle>
          <UsageBar>
            <UsageFill 
              $percentage={usagePercentage} 
              $color={usagePercentage > 80 ? theme('colors.negative') : theme('colors.accent')} 
            />
          </UsageBar>
          <UsageLabel>
            <span>{formatBytes(storageData.quota.used)} used</span>
            <span>{formatBytes(storageData.quota.total)} total</span>
          </UsageLabel>
          <UsageLabel>
            <span>Current namespace: {formatBytes(storageData.totalSize)}</span>
            <span>{usagePercentage.toFixed(1)}% full</span>
          </UsageLabel>
        </UsageCard>

        <UsageCard>
          <UsageTitle>Health Status</UsageTitle>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: storageData.integrity.healthy ? '#00d4aa' : '#ef4444' }}>
              {storageData.integrity.healthy ? '✓ Healthy' : '⚠ Issues Detected'}
            </strong>
          </div>
          <div style={{ fontSize: '14px', color: '#a0a9b8' }}>
            <div>Total Keys: {storageData.integrity.totalKeys}</div>
            <div>Corrupted: {storageData.integrity.corruptedKeys.length}</div>
            <div>Operations: {storageData.metrics.operations}</div>
            <div>Failures: {storageData.metrics.failures}</div>
          </div>
        </UsageCard>
      </StorageOverview>

      <NamespaceGrid>
        {storageData.namespaces.map((ns: any) => (
          <NamespaceCard key={ns.name} $healthy={ns.healthy}>
            <NamespaceTitle>{ns.name}::</NamespaceTitle>
            <NamespaceStats>
              <div className="stat-row">
                <span className="stat-label">Keys:</span>
                <span className="stat-value">{ns.keys.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Size:</span>
                <span className="stat-value">{formatBytes(ns.totalSize)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Status:</span>
                <span className="stat-value" style={{ color: ns.healthy ? '#00d4aa' : '#ef4444' }}>
                  {ns.healthy ? 'OK' : 'Issues'}
                </span>
              </div>
            </NamespaceStats>
          </NamespaceCard>
        ))}
      </NamespaceGrid>

      <KeysList>
        <KeysHeader>
          <h4 style={{ margin: 0 }}>Storage Keys ({storageData.keys.length})</h4>
        </KeysHeader>
        
        {storageData.keys.map((keyData: any) => (
          <KeyItem key={keyData.key} $corrupted={keyData.corrupted}>
            <KeyName title={keyData.key}>
              {keyData.key}
              {keyData.corrupted && ' ⚠'}
            </KeyName>
            <KeySize>{formatBytes(keyData.size)}</KeySize>
            <KeyActions>
              <ActionButton
                onClick={() => console.log('Key data:', keyData)}
                title="Log to console"
              >
                👁
              </ActionButton>
              <ActionButton
                $variant="danger"
                onClick={() => handleDeleteKey(keyData.key)}
                title="Delete key"
              >
                🗑
              </ActionButton>
            </KeyActions>
          </KeyItem>
        ))}
      </KeysList>
    </ViewerContainer>
  );
};