/**
 * Performance Monitor Component
 * 
 * Real-time monitoring of application performance including render times,
 * state updates, storage operations, and memory usage.
 */

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../utils/styledHelpers';
import { useUnifiedStore } from '../../stores/unified-store';
import { PerformanceEntry } from '../../types/data-contracts';

const MonitorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => theme('colors.surface1')};
  border-radius: ${props => theme('borderRadius.lg')};
  border: 1px solid ${props => theme('colors.border1')};
  overflow: hidden;
`;

const MonitorHeader = styled.div`
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

const ControlButton = styled.button<{ $active?: boolean }>`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.sm')};
  background: ${props => props.$active ? theme('colors.accent') : theme('colors.surface3')};
  color: ${props => props.$active ? '#0f1419' : theme('colors.text1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => props.$active ? theme('typography.fontWeight.semibold') : theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  &:hover {
    opacity: 0.9;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
`;

const MetricCard = styled.div`
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  padding: ${props => theme('spacing.md')};
`;

const MetricLabel = styled.div`
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.textMuted')};
  text-transform: uppercase;
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  margin-bottom: ${props => theme('spacing.xs')};
`;

const MetricValue = styled.div<{ $status?: 'good' | 'warning' | 'error' }>`
  font-size: ${props => theme('typography.fontSize.xl')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  font-family: 'Monaco', 'Menlo', monospace;
  color: ${props => {
    switch (props.$status) {
      case 'good': return theme('colors.positive');
      case 'warning': return theme('colors.warning');
      case 'error': return theme('colors.negative');
      default: return theme('colors.text1');
    }
  }};
`;

const ChartContainer = styled.div`
  flex: 1;
  padding: ${props => theme('spacing.md')};
  overflow: hidden;
`;

const TimelineChart = styled.div`
  height: 200px;
  background: ${props => theme('colors.surface2')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  position: relative;
  overflow: hidden;
`;

const ChartBar = styled.div<{ $height: number; $color: string; $left: number }>`
  position: absolute;
  bottom: 0;
  left: ${props => props.$left}%;
  width: 2px;
  height: ${props => props.$height}%;
  background: ${props => props.$color};
  transition: height 0.3s ease;
`;

const ChartLegend = styled.div`
  display: flex;
  gap: ${props => theme('spacing.md')};
  margin-top: ${props => theme('spacing.sm')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const LegendItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.xs')};
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    background: ${props => props.$color};
    border-radius: 2px;
  }
`;

const EntriesTable = styled.div`
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid ${props => theme('colors.border1')};
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface3')};
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  text-transform: uppercase;
  color: ${props => theme('colors.textMuted')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableRow = styled.div<{ $slow?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.md')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-family: 'Monaco', 'Menlo', monospace;
  border-bottom: 1px solid ${props => theme('colors.border1')};
  background: ${props => props.$slow ? theme('colors.negativeAlpha') : 'transparent'};
  
  &:hover {
    background: ${props => theme('colors.surface3')};
  }
`;

const CHART_COLORS = {
  render: theme('colors.accent'),
  action: theme('colors.positive'),
  storage: theme('colors.warning'),
  search: theme('colors.info')
};

interface PerformanceMonitorProps {
  height?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ height = '600px' }) => {
  const store = useUnifiedStore();
  const [isRecording, setIsRecording] = useState(true);
  const [viewMode, setViewMode] = useState<'realtime' | 'history'>('realtime');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh when recording
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const debugInfo = useMemo(() => {
    return store.getDebugInfo();
  }, [store, refreshKey]);

  // Performance metrics calculations
  const metrics = useMemo(() => {
    const entries = debugInfo.performance;
    const recentEntries = entries.slice(-100); // Last 100 operations
    
    if (recentEntries.length === 0) {
      return {
        avgRenderTime: 0,
        avgActionTime: 0,
        avgStorageTime: 0,
        slowOperations: 0,
        totalOperations: 0,
        memoryUsage: 0
      };
    }
    
    const renderEntries = recentEntries.filter(e => e.component.includes('Widget') || e.component.includes('Component'));
    const actionEntries = recentEntries.filter(e => e.operation.startsWith('action:'));
    const storageEntries = recentEntries.filter(e => ['save', 'load'].includes(e.operation));
    
    return {
      avgRenderTime: renderEntries.length ? renderEntries.reduce((sum, e) => sum + e.duration, 0) / renderEntries.length : 0,
      avgActionTime: actionEntries.length ? actionEntries.reduce((sum, e) => sum + e.duration, 0) / actionEntries.length : 0,
      avgStorageTime: storageEntries.length ? storageEntries.reduce((sum, e) => sum + e.duration, 0) / storageEntries.length : 0,
      slowOperations: recentEntries.filter(e => e.duration > 100).length,
      totalOperations: recentEntries.length,
      memoryUsage: performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024) : 0
    };
  }, [debugInfo.performance]);

  // Chart data for timeline view  
  const chartData = useMemo(() => {
    const entries = debugInfo.performance.slice(-50); // Last 50 for chart
    const maxDuration = Math.max(...entries.map(e => e.duration), 100);
    
    return entries.map((entry, index) => ({
      ...entry,
      height: (entry.duration / maxDuration) * 100,
      left: (index / entries.length) * 100,
      color: CHART_COLORS[entry.operation as keyof typeof CHART_COLORS] || CHART_COLORS.render
    }));
  }, [debugInfo.performance]);

  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'error' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1) return '<1ms';
    return `${ms.toFixed(1)}ms`;
  };

  const formatMemory = (mb: number): string => {
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <MonitorContainer style={{ height }}>
      <MonitorHeader>
        <Title>Performance Monitor</Title>
        <HeaderControls>
          <ControlButton
            $active={viewMode === 'realtime'}
            onClick={() => setViewMode('realtime')}
          >
            Real-time
          </ControlButton>
          <ControlButton
            $active={viewMode === 'history'}
            onClick={() => setViewMode('history')}
          >
            History
          </ControlButton>
          <ControlButton
            $active={isRecording}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? '⏸️ Pause' : '▶️ Record'}
          </ControlButton>
        </HeaderControls>
      </MonitorHeader>

      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Avg Render Time</MetricLabel>
          <MetricValue $status={getMetricStatus(metrics.avgRenderTime, { good: 16, warning: 50 })}>
            {formatDuration(metrics.avgRenderTime)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Avg Action Time</MetricLabel>
          <MetricValue $status={getMetricStatus(metrics.avgActionTime, { good: 10, warning: 50 })}>
            {formatDuration(metrics.avgActionTime)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Storage Ops</MetricLabel>
          <MetricValue $status={getMetricStatus(metrics.avgStorageTime, { good: 20, warning: 100 })}>
            {formatDuration(metrics.avgStorageTime)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Slow Operations</MetricLabel>
          <MetricValue $status={getMetricStatus(metrics.slowOperations, { good: 0, warning: 5 })}>
            {metrics.slowOperations}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Memory Usage</MetricLabel>
          <MetricValue $status={getMetricStatus(metrics.memoryUsage, { good: 50, warning: 100 })}>
            {formatMemory(metrics.memoryUsage)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Total Operations</MetricLabel>
          <MetricValue>
            {metrics.totalOperations}
          </MetricValue>
        </MetricCard>
      </MetricsGrid>

      {viewMode === 'realtime' && (
        <ChartContainer>
          <TimelineChart>
            {chartData.map((point, index) => (
              <ChartBar
                key={`${point.timestamp}-${index}`}
                $height={point.height}
                $color={point.color}
                $left={point.left}
                title={`${point.component}.${point.operation}: ${formatDuration(point.duration)}`}
              />
            ))}
          </TimelineChart>
          
          <ChartLegend>
            <LegendItem $color={CHART_COLORS.render}>Render</LegendItem>
            <LegendItem $color={CHART_COLORS.action}>Action</LegendItem>
            <LegendItem $color={CHART_COLORS.storage}>Storage</LegendItem>
            <LegendItem $color={CHART_COLORS.search}>Search</LegendItem>
          </ChartLegend>
        </ChartContainer>
      )}

      {viewMode === 'history' && (
        <EntriesTable>
          <TableHeader>
            <div>Component</div>
            <div>Operation</div>
            <div>Duration</div>
            <div>Time</div>
            <div>Metadata</div>
          </TableHeader>
          
          {debugInfo.performance.slice(-50).reverse().map((entry, index) => (
            <TableRow key={`${entry.timestamp}-${index}`} $slow={entry.duration > 100}>
              <div>{entry.component}</div>
              <div>{entry.operation}</div>
              <div>{formatDuration(entry.duration)}</div>
              <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
              <div>{entry.metadata ? JSON.stringify(entry.metadata).substring(0, 50) + '...' : '-'}</div>
            </TableRow>
          ))}
        </EntriesTable>
      )}
    </MonitorContainer>
  );
};