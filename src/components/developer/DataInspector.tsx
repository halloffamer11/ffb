/**
 * Advanced Data Inspector Component
 * 
 * Provides comprehensive visibility into application state, storage,
 * widget communication, and performance metrics for debugging.
 */

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../utils/styledHelpers';
import { useUnifiedStore } from '../../stores/unified-store';
import { DataInspectorEntry } from '../../types/data-contracts';

const InspectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => theme('colors.surface1')};
  border-radius: ${props => theme('borderRadius.lg')};
  border: 1px solid ${props => theme('colors.border1')};
  overflow: hidden;
`;

const InspectorHeader = styled.div`
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

const HeaderControls = styled.div`
  display: flex;
  gap: ${props => theme('spacing.sm')};
  align-items: center;
`;

const RefreshButton = styled.button`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => theme('colors.accent')};
  color: #0f1419;
  border: none;
  border-radius: ${props => theme('borderRadius.base')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    opacity: 0.9;
  }
`;

const FilterSelect = styled.select`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => theme('colors.surface3')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const InspectorBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const TreePanel = styled.div`
  flex: 1;
  border-right: 1px solid ${props => theme('colors.border1')};
  overflow-y: auto;
  background: ${props => theme('colors.surface1')};
`;

const DetailsPanel = styled.div`
  flex: 1;
  padding: ${props => theme('spacing.md')};
  overflow-y: auto;
  background: ${props => theme('colors.surface2')};
`;

const TreeNode = styled.div<{ $level: number; $selected: boolean }>`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  padding-left: ${props => props.$level * 20 + 12}px;
  cursor: pointer;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  border-bottom: 1px solid ${props => theme('colors.border1')};
  background: ${props => props.$selected ? theme('colors.accentAlpha') : 'transparent'};
  color: ${props => props.$selected ? theme('colors.accent') : theme('colors.text2')};
  
  &:hover {
    background: ${props => props.$selected ? theme('colors.accentAlpha') : theme('colors.surface3')};
  }
  
  .node-key {
    color: ${props => theme('colors.text1')};
    font-weight: 500;
  }
  
  .node-type {
    color: ${props => theme('colors.textMuted')};
    font-size: 11px;
    margin-left: 8px;
  }
  
  .node-preview {
    color: ${props => theme('colors.text2')};
    margin-left: 8px;
    opacity: 0.7;
  }
`;

const DetailsContent = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
`;

const DetailsHeader = styled.div`
  margin-bottom: ${props => theme('spacing.md')};
  padding-bottom: ${props => theme('spacing.sm')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const DetailsPath = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => theme('colors.text1')};
  margin-bottom: ${props => theme('spacing.xs')};
`;

const DetailsMetadata = styled.div`
  display: flex;
  gap: ${props => theme('spacing.md')};
  font-size: 12px;
  color: ${props => theme('colors.textMuted')};
  
  .metadata-item {
    display: flex;
    flex-direction: column;
    
    .label {
      font-weight: 500;
      color: ${props => theme('colors.text2')};
    }
    
    .value {
      color: ${props => theme('colors.textMuted')};
    }
  }
`;

const ValueDisplay = styled.pre`
  background: ${props => theme('colors.surface3')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.md')};
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 400px;
  color: ${props => theme('colors.text1')};
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface3')};
  border-top: 1px solid ${props => theme('colors.border1')};
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.textMuted')};
`;

interface DataInspectorProps {
  height?: string;
}

export const DataInspector: React.FC<DataInspectorProps> = ({ height = '600px' }) => {
  const store = useUnifiedStore();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get debug info from store
  const debugInfo = useMemo(() => {
    return store.getDebugInfo();
  }, [store, refreshKey]);

  // Build data tree from debug info
  const dataTree = useMemo(() => {
    const tree: DataInspectorEntry[] = [];
    
    function addToTree(path: string, value: any, level = 0) {
      const type = Array.isArray(value) ? 'array' : typeof value;
      const size = typeof value === 'string' ? value.length : 
                   typeof value === 'object' && value !== null ? JSON.stringify(value).length : 0;
      
      tree.push({
        path,
        value,
        type,
        size,
        lastModified: Date.now() // TODO: Track actual modification times
      });

      if (typeof value === 'object' && value !== null && level < 3) {
        Object.keys(value).forEach(key => {
          addToTree(`${path}.${key}`, value[key], level + 1);
        });
      }
    }

    // Add state data
    addToTree('state', debugInfo.state);
    
    // Add performance data
    addToTree('performance', debugInfo.performance.slice(-20)); // Last 20 entries
    
    // Add storage data
    addToTree('storage', debugInfo.storage);
    
    // Add errors
    addToTree('errors', debugInfo.errors.slice(-10)); // Last 10 errors
    
    // Add actions
    addToTree('actions', debugInfo.actions.slice(-10)); // Last 10 actions

    return tree;
  }, [debugInfo]);

  // Filter data tree based on selected filter
  const filteredTree = useMemo(() => {
    if (filterType === 'all') return dataTree;
    
    return dataTree.filter(entry => {
      switch (filterType) {
        case 'arrays':
          return entry.type === 'array';
        case 'objects':
          return entry.type === 'object' && !Array.isArray(entry.value);
        case 'primitives':
          return ['string', 'number', 'boolean'].includes(entry.type);
        case 'large':
          return entry.size > 1000; // Over 1KB
        default:
          return true;
      }
    });
  }, [dataTree, filterType]);

  // Get selected entry details
  const selectedEntry = useMemo(() => {
    if (!selectedPath) return null;
    return filteredTree.find(entry => entry.path === selectedPath);
  }, [filteredTree, selectedPath]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value, null, 2);
  };

  const getNodePreview = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      return `{${keys.length} keys}`;
    }
    if (typeof value === 'string') {
      return value.length > 30 ? `"${value.substring(0, 30)}..."` : `"${value}"`;
    }
    return String(value);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <InspectorContainer style={{ height }}>
      <InspectorHeader>
        <Title>Data Inspector</Title>
        <HeaderControls>
          <FilterSelect 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Data</option>
            <option value="arrays">Arrays Only</option>
            <option value="objects">Objects Only</option>
            <option value="primitives">Primitives Only</option>
            <option value="large">Large Items (&gt;1KB)</option>
          </FilterSelect>
          <RefreshButton onClick={handleRefresh}>
            Refresh
          </RefreshButton>
        </HeaderControls>
      </InspectorHeader>
      
      <InspectorBody>
        <TreePanel>
          {filteredTree.map((entry, index) => {
            const level = (entry.path.match(/\./g) || []).length;
            const key = entry.path.split('.').pop() || entry.path;
            const isSelected = entry.path === selectedPath;
            
            return (
              <TreeNode
                key={`${entry.path}-${index}`}
                $level={level}
                $selected={isSelected}
                onClick={() => setSelectedPath(entry.path)}
              >
                <span className="node-key">{key}</span>
                <span className="node-type">({entry.type})</span>
                <span className="node-preview">{getNodePreview(entry.value)}</span>
              </TreeNode>
            );
          })}
        </TreePanel>
        
        <DetailsPanel>
          {selectedEntry ? (
            <DetailsContent>
              <DetailsHeader>
                <DetailsPath>{selectedEntry.path}</DetailsPath>
                <DetailsMetadata>
                  <div className="metadata-item">
                    <span className="label">Type</span>
                    <span className="value">{selectedEntry.type}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Size</span>
                    <span className="value">{formatBytes(selectedEntry.size)}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Last Modified</span>
                    <span className="value">{new Date(selectedEntry.lastModified).toLocaleTimeString()}</span>
                  </div>
                </DetailsMetadata>
              </DetailsHeader>
              
              <ValueDisplay>
                {formatValue(selectedEntry.value)}
              </ValueDisplay>
            </DetailsContent>
          ) : (
            <DetailsContent>
              <div style={{ textAlign: 'center', color: '#a0a9b8', marginTop: '50px' }}>
                Select an item from the tree to view its details
              </div>
            </DetailsContent>
          )}
        </DetailsPanel>
      </InspectorBody>
      
      <StatusBar>
        <div>
          {filteredTree.length} items • Storage: {formatBytes(debugInfo.storage.size)} • Errors: {debugInfo.errors.length}
        </div>
        <div>
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </StatusBar>
    </InspectorContainer>
  );
};