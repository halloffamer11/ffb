import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import { useUnifiedStore } from '../../stores/unified-store';
import { 
  processBeerSheetData, 
  applySearchHighlight, 
  BeerSheetData, 
  BeerSheetPlayer, 
  OverallRankingPlayer,
  formatters,
  updateBeerSheetForDraft,
  calculatePositionScarcity
} from '../../core/beer-sheet';

// Compact formatters for ultra-dense Beer Sheet layout
const compactFormatters = {
  vbd: (value: number): string => String(Math.round(value)),
  valPercent: (value: number): string => `${value.toFixed(1)}%`,
  price: (value: number): string => value ? String(Math.round(value)) : '0', // No $ symbol to save space
  bye: (value: number): string => value > 0 ? String(value) : '-',
  ovr: (value: number): string => String(value)
};
import WidgetContainer from './WidgetContainer';
import { useMemoizedCalculation, usePerformanceMonitor } from '../../hooks';
import { Player } from '../../types/data-contracts';

// Ultra-compact Beer Sheet styling - exact specifications
const BeerSheetContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  font-family: ${props => theme('typography.fontFamily.data')};
  ${props => theme('typography.fontFeatures.tabularNums')};
  font-size: 10px;
  line-height: 1.2;
  overflow: hidden;
  letter-spacing: -0.01em;
  
  /* Performance optimization */
  will-change: transform;
  transform: translateZ(0);
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border-1);
  background: var(--surface-2);
  font-size: 9px;
  min-height: 24px;
  gap: 6px;
  flex-shrink: 0;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 3px 6px;
  background: ${props => props.$active ? 'var(--accent)' : 'var(--surface-3)'};
  color: ${props => props.$active ? 'var(--surface-1)' : 'var(--text-2)'};
  border: 1px solid ${props => props.$active ? 'var(--accent)' : 'var(--border-1)'};
  border-radius: 3px;
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${props => props.$active ? 'var(--accent)' : 'var(--surface-4)'};
    border-color: var(--accent);
  }
`;

const LastUpdated = styled.span`
  color: var(--text-muted);
  font-size: 9px;
`;

const PlayerLimitDropdown = styled.select`
  padding: 1px 3px;
  background: var(--surface-3);
  color: var(--text-1);
  border: 1px solid var(--border-1);
  border-radius: 2px;
  font-size: 8px;
  font-weight: 500;
  cursor: pointer;
  min-width: 40px;
  height: 16px;
  line-height: 12px;
  margin-left: 4px;
  
  &:hover {
    background: var(--surface-4);
    border-color: var(--accent);
  }
  
  &:focus {
    outline: 1px solid var(--accent);
    outline-offset: 1px;
  }
`;

const DraftButton = styled.button<{ $drafted?: boolean }>`
  padding: 2px 6px;
  background: ${props => props.$drafted ? 'var(--negative)' : 'var(--positive)'};
  color: var(--surface-1);
  border: none;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  cursor: ${props => props.$drafted ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  opacity: ${props => props.$drafted ? 0.5 : 1};
  
  &:hover {
    transform: ${props => props.$drafted ? 'none' : 'scale(1.05)'};
    opacity: ${props => props.$drafted ? 0.5 : 0.9};
  }
`;

const DraftConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--surface-1);
  border: 2px solid var(--border-1);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  z-index: 1000;
  min-width: 300px;
  
  .dialog-header {
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-1);
  }
  
  .dialog-body {
    margin-bottom: 16px;
    color: var(--text-2);
    font-size: 12px;
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    
    button {
      padding: 6px 12px;
      border: 1px solid var(--border-1);
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
      
      &.primary {
        background: var(--accent);
        color: var(--surface-1);
        border-color: var(--accent);
        
        &:hover {
          opacity: 0.9;
        }
      }
      
      &.secondary {
        background: var(--surface-2);
        color: var(--text-2);
        
        &:hover {
          background: var(--surface-3);
        }
      }
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
`;

const ScarcityIndicator = styled.div<{ $scarcity: number }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.$scarcity > 70) return 'var(--negative)';
    if (props.$scarcity > 40) return 'var(--warning)';
    return 'var(--positive)';
  }};
  margin-left: 4px;
  title: ${props => `Scarcity: ${props.$scarcity}%`};
`;

const UndoButton = styled.button<{ $disabled: boolean }>`
  padding: 4px 8px;
  background: ${props => props.$disabled ? 'var(--surface-3)' : 'var(--warning)'};
  color: ${props => props.$disabled ? 'var(--text-muted)' : 'var(--surface-1)'};
  border: 1px solid ${props => props.$disabled ? 'var(--border-1)' : 'var(--warning)'};
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  
  &:hover {
    opacity: ${props => props.$disabled ? 0.5 : 0.8};
  }
`;

const DraftStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--text-muted);
  
  .stat {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  
  .stat-value {
    font-weight: 600;
    color: var(--text-1);
  }
`;

const TablesLayout = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 220px 240px 240px 160px;
  grid-template-rows: 1fr;
  gap: 1px;
  background: var(--border-1);
  overflow: hidden;
  min-width: 860px; /* Expanded to prevent truncation */
  
  /* Responsive breakpoints with expanded widths */
  @media (max-width: 1400px) {
    grid-template-columns: 200px 220px 220px 140px;
    min-width: 780px;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 180px 200px 200px 120px;
    min-width: 700px;
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 160px 180px 180px 100px;
    min-width: 620px;
  }
`;

const TableSection = styled.div<{ $gridArea?: string }>`
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  grid-area: ${props => props.$gridArea || 'auto'};
  border: 1px solid rgba(255,255,255,0.02);
  
  /* Subtle inner shadow for depth */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.01);
  
  &.left-column {
    grid-column: 1;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
  }
  
  &.middle-left {
    grid-column: 2;
    grid-row: 1 / 3;
  }
  
  &.middle-right {
    grid-column: 3;
    grid-row: 1 / 3;
  }
  
  &.right-column {
    grid-column: 4;
    grid-row: 1 / 3;
  }
`;

const PositionHeader = styled.div<{ $position?: string }>`
  padding: 2px 4px;
  background: ${props => {
    switch (props.$position) {
      case 'QB': return '#e3f2fd'; /* Light blue header */
      case 'RB': return '#e8f5e8'; /* Light green header */
      case 'WR': return '#fff3e0'; /* Light orange header */
      case 'TE': return '#f3e5f5'; /* Light purple header */
      case 'Overall': return '#f5f5f5'; /* Light grey header */
      default: return '#f5f5f5'; /* Light grey header */
    }
  }};
  border-bottom: 1px solid var(--border-1);
  font-weight: 600;
  font-size: 9px;
  color: ${props => {
    switch (props.$position) {
      case 'QB': return '#1976d2'; /* Darker blue text */
      case 'RB': return '#388e3c'; /* Darker green text */
      case 'WR': return '#f57c00'; /* Darker orange text */
      case 'TE': return '#7b1fa2'; /* Darker purple text */
      default: return '#424242'; /* Dark grey text */
    }
  }};
  text-align: center;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  height: 20px;
  line-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 4px;
  
  /* Subtle depth effect */
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  table-layout: fixed;
  background: var(--surface-1);
  
  /* Ensure consistent cell sizing */
  td, th {
    box-sizing: border-box;
    border-right: 1px solid rgba(255,255,255,0.01);
  }
  
  th:last-child, td:last-child {
    border-right: none;
  }
  
  /* Clean table styling */
  tbody tr:hover {
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    z-index: 1;
    position: relative;
  }
`;

const TableHeader = styled.thead`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface-2);
`;

const HeaderCell = styled.th<{ $width?: string; $align?: string }>`
  padding: 1px 2px;
  font-weight: 600;
  font-size: 8px;
  color: var(--text-2);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-1);
  text-align: ${props => props.$align || 'left'};
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  height: 14px;
  line-height: 10px;
  letter-spacing: 0.015em;
  background: var(--surface-2);
  position: sticky;
  top: 0;
  z-index: 10;
  
  &:last-child {
    border-right: none;
  }
  
  /* Professional hover transition */
  transition: background-color 0.1s ease, color 0.1s ease;
  
  &:hover {
    background: var(--surface-3);
    color: var(--text-1);
  }
`;

const TableBody = styled.tbody`
  font-size: 10px;
`;

const TableRow = styled.tr<{ 
  $drafted?: boolean; 
  $highlighted?: boolean;
  $focused?: boolean;
  $recentlyDrafted?: boolean;
  $valuePercent?: number;
}>`
  height: 14px;
  cursor: pointer;
  transition: background-color 0.1s ease, opacity 0.1s ease;
  
  /* Professional drafted player styling */
  background: ${props => {
    if (props.$focused) return 'rgba(59, 130, 246, 0.25)'; /* Blue focus - highest priority */
    if (props.$highlighted) return 'rgba(59, 130, 246, 0.15)'; /* Blue search highlight */
    if (props.$recentlyDrafted) return 'var(--warning-alpha)';
    if (props.$drafted) return 'rgba(0,0,0,0.05)';
    return 'transparent';
  }};
  
  opacity: ${props => props.$drafted ? 1 : 1}; /* Keep readable */
  
  /* Value-based styling for high-value players */
  font-weight: ${props => {
    if (props.$drafted) return '400';
    if (props.$valuePercent && props.$valuePercent > 20) return '500';
    return '400';
  }};
  
  &:hover {
    background: ${props => {
      if (props.$focused) return 'rgba(59, 130, 246, 0.35)'; /* Hover + Focus */
      if (props.$drafted) return 'rgba(0,0,0,0.08)';
      return 'rgba(59, 130, 246, 0.1)'; /* Light blue hover */
    }} !important; /* Force override nth-child styles */
    cursor: ${props => props.$drafted ? 'not-allowed' : 'pointer'};
    transform: ${props => props.$drafted ? 'none' : 'scale(1.001)'}; /* Subtle scale on hover */
    transition: all 0.1s ease-out;
  }
  
  /* Row borders for cleaner separation */
  border-bottom: 1px solid rgba(255,255,255,0.015);
  
  &:last-child {
    border-bottom: none;
  }
  
  /* Subtle zebra stripes - reduced to not interfere with hover */
  &:nth-child(even) {
    background: ${props => {
      if (props.$drafted) return 'rgba(0,0,0,0.02)';
      if (props.$recentlyDrafted) return 'var(--warning-alpha)';
      if (props.$highlighted) return '#f8f9ff';
      return 'transparent'; /* Remove zebra striping to fix hover */
    }};
  }
  
  ${props => props.$recentlyDrafted && `
    animation: draftFlash 0.3s ease-out;
    
    @keyframes draftFlash {
      0% { background: var(--warning); }
      100% { background: var(--warning-alpha); }
    }
  `}
`;

const TableCell = styled.td<{ $align?: string; $numeric?: boolean; $drafted?: boolean }>`
  padding: 0px 2px;
  white-space: nowrap;
  overflow: visible;
  text-overflow: ellipsis;
  text-align: ${props => props.$align || (props.$numeric ? 'right' : 'left')};
  font-weight: ${props => props.$numeric ? '500' : '400'};
  font-size: 10px;
  line-height: 12px;
  
  color: ${props => {
    if (props.$drafted) return '#666666';
    if (props.$numeric) return 'var(--text-1)';
    return 'var(--text-2)';
  }};
  
  /* Monospace for numbers */
  font-family: ${props => props.$numeric ? 'SF Mono, Monaco, Consolas, "Liberation Mono", monospace' : 'inherit'};
  font-variant-numeric: ${props => props.$numeric ? 'tabular-nums' : 'normal'};
  font-feature-settings: ${props => props.$numeric ? '"tnum"' : 'normal'};
  
  &:first-child {
    font-weight: ${props => props.$drafted ? '400' : '500'};
    color: ${props => props.$drafted ? '#666666' : 'var(--text-1)'};
    text-decoration: ${props => props.$drafted ? 'line-through' : 'none'};
  }
`;

const VBDCell = styled(TableCell)<{ $value: number; $drafted?: boolean }>`
  color: ${props => {
    if (props.$drafted) return '#666666'; /* Dimmed for drafted */
    if (props.$value > 20) return 'var(--positive)'; /* Green for high value */
    if (props.$value > 5) return '#000000'; /* Black for decent value */
    if (props.$value > 0) return 'var(--text-2)'; /* Grey for low value */
    return 'var(--negative)'; /* Red for negative */
  }};
  font-weight: 600;
`;

const PriceCell = styled(TableCell)<{ $drafted?: boolean }>`
  color: ${props => props.$drafted ? '#666666' : 'var(--accent)'};
  font-weight: 500;
`;

const PositionCell = styled(TableCell)<{ $position: string; $drafted?: boolean }>`
  color: ${props => {
    if (props.$drafted) return '#666666'; /* Dimmed for drafted */
    switch (props.$position) {
      case 'QB': return '#ef4444'; /* Red - matches Player Search */
      case 'RB': return '#10b981'; /* Green - matches Player Search */
      case 'WR': return '#3b82f6'; /* Blue - matches Player Search */
      case 'TE': return '#f59e0b'; /* Amber - matches Player Search */
      case 'K': return '#8b5cf6';  /* Purple - matches Player Search */
      case 'DST': return '#6b7280'; /* Gray - matches Player Search */
      default: return 'var(--text-2)';
    }
  }};
  font-weight: 600;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  /* Professional scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.01);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border-radius: 2px;
    
    &:hover {
      background: linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
    }
  }
  
  /* Performance optimization */
  will-change: scroll-position;
  contain: layout style;
`;

// Position Table Component
interface PositionTableProps {
  position: string;
  data: BeerSheetPlayer[];
  onDraftPlayer: (player: BeerSheetPlayer) => void;
  searchTerm?: string;
  recentlyDraftedIds: Set<string>;
  scarcityScore?: number;
}

const PositionTable: React.FC<PositionTableProps> = ({ 
  position, 
  data, 
  onDraftPlayer, 
  searchTerm, 
  recentlyDraftedIds,
  scarcityScore = 0
}) => {
  const handleRowClick = useCallback((player: BeerSheetPlayer) => {
    onDraftPlayer(player);
  }, [onDraftPlayer]);

  const highlightMatch = useCallback((text: string, query?: string) => {
    if (!query || query.length < 2) return text;
    
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch {
      return text;
    }
  }, []);

  return (
    <ScrollableContent>
      <Table role="table" aria-label={`${position} player rankings and auction values`}>
        <colgroup>
          <col style={{ width: '70px' }} />
          <col style={{ width: '20px' }} />
          <col style={{ width: '20px' }} />
          <col style={{ width: '24px' }} />
          <col style={{ width: '28px' }} />
          <col style={{ width: '20px' }} />
          <col style={{ width: '18px' }} />
          <col style={{ width: '18px' }} />
        </colgroup>
        <TableHeader>
          <tr>
            <HeaderCell>Name</HeaderCell>
            <HeaderCell $align="left">TM</HeaderCell>
            <HeaderCell $align="right">BYE</HeaderCell>
            <HeaderCell $align="right">VBD</HeaderCell>
            <HeaderCell $align="right">VAL%</HeaderCell>
            <HeaderCell $align="right">$</HeaderCell>
            <HeaderCell $align="right">L</HeaderCell>
            <HeaderCell $align="right">H</HeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((player, index) => (
            <TableRow
              key={player.id}
              $drafted={player.drafted}
              $highlighted={player.searchHighlight}
              $focused={player.isFocused}
              $recentlyDrafted={recentlyDraftedIds.has(player.id)}
              $valuePercent={player.valPercent}
              onClick={() => handleRowClick(player)}
              title={player.drafted ? `Drafted player` : `Click to focus ${player.name}`}
            >
              <TableCell 
                $drafted={player.drafted}
                dangerouslySetInnerHTML={{ 
                  __html: highlightMatch(player.name, searchTerm) 
                }}
              />
              <TableCell $drafted={player.drafted}>{player.team}</TableCell>
              <TableCell $numeric $drafted={player.drafted}>{compactFormatters.bye(player.bye)}</TableCell>
              <VBDCell $numeric $value={player.vbd} $drafted={player.drafted}>
                {compactFormatters.vbd(player.vbd)}
              </VBDCell>
              <TableCell $numeric $drafted={player.drafted}>{compactFormatters.valPercent(player.valPercent)}</TableCell>
              <PriceCell $numeric $drafted={player.drafted}>{compactFormatters.price(player.price)}</PriceCell>
              <TableCell $numeric $drafted={player.drafted}>{compactFormatters.price(player.minPrice)}</TableCell>
              <TableCell $numeric $drafted={player.drafted}>{compactFormatters.price(player.maxPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableContent>
  );
};

// Overall Table Component  
interface OverallTableProps {
  data: OverallRankingPlayer[];
  onDraftPlayer: (player: OverallRankingPlayer) => void;
  searchTerm?: string;
  recentlyDraftedIds: Set<string>;
}

const OverallTable: React.FC<OverallTableProps> = ({ 
  data, 
  onDraftPlayer, 
  searchTerm, 
  recentlyDraftedIds 
}) => {
  const handleRowClick = useCallback((player: OverallRankingPlayer) => {
    onDraftPlayer(player);
  }, [onDraftPlayer]);

  const highlightMatch = useCallback((text: string, query?: string) => {
    if (!query || query.length < 2) return text;
    
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch {
      return text;
    }
  }, []);

  return (
    <ScrollableContent>
      <Table role="table" aria-label="Overall player rankings across all positions">
        <colgroup>
          <col style={{ width: '24px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '24px' }} />
          <col style={{ width: '28px' }} />
        </colgroup>
        <TableHeader>
          <tr>
            <HeaderCell $align="right">OVR</HeaderCell>
            <HeaderCell>Name</HeaderCell>
            <HeaderCell $align="left">POS</HeaderCell>
            <HeaderCell $align="right">VBD</HeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.slice(0, 100).map((player, index) => {
            const playerId = `${player.name}-${player.position}`; // Unique ID for overall table
            return (
              <TableRow
                key={`${player.name}-${index}`}
                $drafted={player.drafted}
                $highlighted={player.searchHighlight}
                $focused={player.isFocused}
                $recentlyDrafted={recentlyDraftedIds.has(playerId)}
                $valuePercent={player.valPercent}
                onClick={() => handleRowClick(player)}
                title={player.drafted ? `Drafted player` : `Click to focus ${player.name}`}
              >
                <TableCell $numeric $drafted={player.drafted}>{compactFormatters.ovr(player.ovr)}</TableCell>
                <TableCell 
                  $drafted={player.drafted}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(player.name, searchTerm) 
                  }}
                />
                <PositionCell $position={player.position} $drafted={player.drafted}>
                  {player.position}
                </PositionCell>
                <VBDCell $numeric $value={player.vbd} $drafted={player.drafted}>
                  {compactFormatters.vbd(player.vbd)}
                </VBDCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollableContent>
  );
};

// Main Widget Component
interface BeerSheetWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const BeerSheetWidget: React.FC<BeerSheetWidgetProps> = ({ editMode = false, onRemove }) => {
  const store = useUnifiedStore();
  const { players, picks, settings, ui } = store;
  const [hideDrafted, setHideDrafted] = useState(false);
  const [recentlyDraftedIds, setRecentlyDraftedIds] = useState<Set<string>>(new Set());
  
  // Player count limits with localStorage persistence
  const [playerLimits, setPlayerLimits] = useState(() => {
    const saved = localStorage.getItem('beer-sheet-player-limits');
    return saved ? JSON.parse(saved) : {
      QB: 30,
      TE: 28,
      RB: 60,
      WR: 60,
      overall: 60
    };
  });
  
  const previousPicksCount = useRef(picks.length);
  
  // Performance monitoring
  const renderCount = usePerformanceMonitor('BeerSheetWidget');
  
  // Save player limits to localStorage when changed
  useEffect(() => {
    localStorage.setItem('beer-sheet-player-limits', JSON.stringify(playerLimits));
  }, [playerLimits]);
  
  // Handle player limit changes
  const handleLimitChange = useCallback((position: string, newLimit: number) => {
    setPlayerLimits(prev => ({
      ...prev,
      [position]: newLimit
    }));
  }, []);
  
  // Track recent draft actions for visual feedback
  useEffect(() => {
    if (picks.length > previousPicksCount.current) {
      const latestPick = picks[picks.length - 1];
      if (latestPick?.player) {
        const playerId = String(latestPick.player.id);
        setRecentlyDraftedIds(prev => new Set([...prev, playerId]));
        
        // Clear the highlight after animation completes
        setTimeout(() => {
          setRecentlyDraftedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(playerId);
            return newSet;
          });
        }, 1000);
      }
    }
    previousPicksCount.current = picks.length;
  }, [picks]);
  
  // Listen for cross-widget draft events
  useEffect(() => {
    const handlePlayerDrafted = (event: CustomEvent) => {
      const player = event.detail;
      if (player?.id) {
        const playerId = String(player.id);
        setRecentlyDraftedIds(prev => new Set([...prev, playerId]));
        
        setTimeout(() => {
          setRecentlyDraftedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(playerId);
            return newSet;
          });
        }, 1000);
      }
    };
    
    window.addEventListener('player:drafted', handlePlayerDrafted as EventListener);
    return () => window.removeEventListener('player:drafted', handlePlayerDrafted as EventListener);
  }, []);

  // Create set of drafted player IDs for quick lookup
  const draftedPlayerIds = useMemo(() => {
    const drafted = new Set<string>();
    picks.forEach(pick => {
      if (pick.player?.id) {
        drafted.add(String(pick.player.id));
      }
    });
    return drafted;
  }, [picks]);

  // Optimize data processing with intelligent caching
  const beerSheetData = useMemo(() => {
    const startTime = performance.now();
    
    if (!players || players.length === 0) {
      return {
        qb: [], rb: [], wr: [], te: [], overall: [],
        lastUpdated: new Date()
      } as BeerSheetData;
    }
    
    const result = processBeerSheetData(players, settings, draftedPlayerIds, hideDrafted, playerLimits);
    
    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`🐌 Slow Beer Sheet processing: ${duration.toFixed(2)}ms`);
    } else {
      console.log(`⚡ Fast Beer Sheet processing: ${duration.toFixed(1)}ms`);
    }
    
    return result;
  }, [players, settings, draftedPlayerIds, hideDrafted, playerLimits]);

  // Apply search highlighting and focused player highlighting
  const highlightedData = useMemo(() => {
    const startTime = performance.now();
    let result = applySearchHighlight(beerSheetData, ui.searchTerm || '');
    
    // Add focused player tracking (separate from search highlighting)
    if (ui.selectedPlayer) {
      const selectedId = ui.selectedPlayer.id;
      result = {
        qb: result.qb.map(p => ({
          ...p,
          isFocused: p.id === selectedId
        })),
        rb: result.rb.map(p => ({
          ...p,
          isFocused: p.id === selectedId
        })),
        wr: result.wr.map(p => ({
          ...p,
          isFocused: p.id === selectedId
        })),
        te: result.te.map(p => ({
          ...p,
          isFocused: p.id === selectedId
        })),
        overall: result.overall.map(p => ({
          ...p,
          isFocused: p.id === selectedId
        })),
        lastUpdated: result.lastUpdated
      };
    }
    
    const duration = performance.now() - startTime;
    if (duration > 10) {
      console.warn(`🔍 Slow highlighting: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, [beerSheetData, ui.searchTerm, ui.selectedPlayer]);

  // Handle player focus selection for cross-widget synchronization
  const handlePlayerFocus = useCallback((player: BeerSheetPlayer | OverallRankingPlayer) => {
    // Handle both id-based and name-based matching
    const fullPlayer = players.find(p => {
      // First try to match by id (for BeerSheetPlayer)
      if ('id' in player && p.id === player.id) {
        return true;
      }
      // Fall back to name + position matching (for OverallRankingPlayer)
      return p.name === player.name && p.position === player.position;
    });
    
    if (fullPlayer) {
      store.selectPlayer(fullPlayer);
    }
  }, [players, store]);
  
  // Handle undo last draft
  const handleUndoLastDraft = useCallback(() => {
    if (picks.length > 0) {
      const lastPickIndex = picks.length - 1;
      store.undraftPlayer(lastPickIndex);
    }
  }, [picks, store]);

  // Calculate position scarcity for enhanced display
  const positionScarcity = useMemo(() => {
    if (!highlightedData) return {};
    
    return {
      QB: calculatePositionScarcity(highlightedData.qb),
      RB: calculatePositionScarcity(highlightedData.rb),
      WR: calculatePositionScarcity(highlightedData.wr),
      TE: calculatePositionScarcity(highlightedData.te)
    };
  }, [highlightedData]);

  return (
    <WidgetContainer 
      title="Beer Sheet" 
      widgetId="beer-sheet" 
      editMode={editMode} 
      onRemove={onRemove}
    >
      <BeerSheetContainer>
        <ControlsBar>
          <ControlGroup>
            <ToggleButton
              $active={!hideDrafted}
              onClick={() => setHideDrafted(false)}
              title="Show all players"
            >
              Show All
            </ToggleButton>
            <ToggleButton
              $active={hideDrafted}
              onClick={() => setHideDrafted(true)}
              title="Hide drafted players"
            >
              Hide Drafted
            </ToggleButton>
            <UndoButton
              $disabled={picks.length === 0}
              onClick={handleUndoLastDraft}
              title={picks.length === 0 ? "No drafts to undo" : `Undo last draft (${picks[picks.length - 1]?.player?.name})`}
            >
              Undo
            </UndoButton>
          </ControlGroup>
          
          <DraftStats>
            <div className="stat">
              <span>Drafted:</span>
              <span className="stat-value">{picks.length}</span>
            </div>
            <div className="stat">
              <span>Available:</span>
              <span className="stat-value">{players.filter(p => !p.drafted).length}</span>
            </div>
            <LastUpdated>
              Updated: {highlightedData.lastUpdated.toLocaleTimeString()}
            </LastUpdated>
          </DraftStats>
        </ControlsBar>

        {players.length === 0 ? (
          <EmptyState>
            No player data available. Import projections to view Beer Sheet.
          </EmptyState>
        ) : (
          <TablesLayout>
            {/* Left Column: QB and TE stacked */}
            <TableSection className="left-column">
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <PositionHeader $position="QB" role="banner" aria-label={`Quarterback position with ${highlightedData.qb.length} players available`}>
                  QB ({highlightedData.qb.length})
                  <PlayerLimitDropdown
                    value={playerLimits.QB}
                    onChange={(e) => handleLimitChange('QB', parseInt(e.target.value))}
                  >
                    {[15, 20, 25, 30, 40, 50].map(limit => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </PlayerLimitDropdown>
                  <ScarcityIndicator $scarcity={positionScarcity.QB?.scarcityScore || 0} aria-label={`Scarcity indicator: ${Math.round(positionScarcity.QB?.scarcityScore || 0)}%`} />
                </PositionHeader>
                <div style={{ flex: '1', minHeight: '0' }}>
                  <PositionTable
                    position="QB"
                    data={highlightedData.qb}
                    onDraftPlayer={handlePlayerFocus}
                    searchTerm={ui.searchTerm}
                    recentlyDraftedIds={recentlyDraftedIds}
                    scarcityScore={positionScarcity.QB?.scarcityScore}
                  />
                </div>
              </div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-1)' }}>
                <PositionHeader $position="TE" role="banner" aria-label={`Tight End position with ${highlightedData.te.length} players available`}>
                  TE ({highlightedData.te.length})
                  <PlayerLimitDropdown
                    value={playerLimits.TE}
                    onChange={(e) => handleLimitChange('TE', parseInt(e.target.value))}
                  >
                    {[15, 20, 25, 28, 35, 40].map(limit => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </PlayerLimitDropdown>
                  <ScarcityIndicator $scarcity={positionScarcity.TE?.scarcityScore || 0} aria-label={`Scarcity indicator: ${Math.round(positionScarcity.TE?.scarcityScore || 0)}%`} />
                </PositionHeader>
                <div style={{ flex: '1', minHeight: '0' }}>
                  <PositionTable
                    position="TE"
                    data={highlightedData.te}
                    onDraftPlayer={handlePlayerFocus}
                    searchTerm={ui.searchTerm}
                    recentlyDraftedIds={recentlyDraftedIds}
                    scarcityScore={positionScarcity.TE?.scarcityScore}
                  />
                </div>
              </div>
            </TableSection>

            {/* Middle Left: RB (full height) */}
            <TableSection className="middle-left">
              <PositionHeader $position="RB" role="banner" aria-label={`Running Back position with ${highlightedData.rb.length} players available`}>
                RB ({highlightedData.rb.length})
                <PlayerLimitDropdown
                  value={playerLimits.RB}
                  onChange={(e) => handleLimitChange('RB', parseInt(e.target.value))}
                >
                  {[30, 40, 50, 60, 70, 80].map(limit => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </PlayerLimitDropdown>
                <ScarcityIndicator $scarcity={positionScarcity.RB?.scarcityScore || 0} aria-label={`Scarcity indicator: ${Math.round(positionScarcity.RB?.scarcityScore || 0)}%`} />
              </PositionHeader>
              <PositionTable
                position="RB"
                data={highlightedData.rb}
                onDraftPlayer={handlePlayerFocus}
                searchTerm={ui.searchTerm}
                recentlyDraftedIds={recentlyDraftedIds}
                scarcityScore={positionScarcity.RB?.scarcityScore}
              />
            </TableSection>

            {/* Middle Right: WR (full height) */}
            <TableSection className="middle-right">
              <PositionHeader $position="WR" role="banner" aria-label={`Wide Receiver position with ${highlightedData.wr.length} players available`}>
                WR ({highlightedData.wr.length})
                <PlayerLimitDropdown
                  value={playerLimits.WR}
                  onChange={(e) => handleLimitChange('WR', parseInt(e.target.value))}
                >
                  {[30, 40, 50, 60, 70, 80].map(limit => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </PlayerLimitDropdown>
                <ScarcityIndicator $scarcity={positionScarcity.WR?.scarcityScore || 0} aria-label={`Scarcity indicator: ${Math.round(positionScarcity.WR?.scarcityScore || 0)}%`} />
              </PositionHeader>
              <PositionTable
                position="WR"
                data={highlightedData.wr}
                onDraftPlayer={handlePlayerFocus}
                searchTerm={ui.searchTerm}
                recentlyDraftedIds={recentlyDraftedIds}
                scarcityScore={positionScarcity.WR?.scarcityScore}
              />
            </TableSection>

            {/* Right Column: Overall (narrow, full height) */}
            <TableSection className="right-column">
              <PositionHeader $position="Overall">
                Overall ({highlightedData.overall.length})
                <PlayerLimitDropdown
                  value={playerLimits.overall}
                  onChange={(e) => handleLimitChange('overall', parseInt(e.target.value))}
                >
                  {[30, 40, 50, 60, 80, 100].map(limit => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </PlayerLimitDropdown>
              </PositionHeader>
              <OverallTable
                data={highlightedData.overall}
                onDraftPlayer={handlePlayerFocus}
                searchTerm={ui.searchTerm}
                recentlyDraftedIds={recentlyDraftedIds}
              />
            </TableSection>
          </TablesLayout>
        )}
      </BeerSheetContainer>
    </WidgetContainer>
  );
};

export default BeerSheetWidget;