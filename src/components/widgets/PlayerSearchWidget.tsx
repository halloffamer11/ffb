import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useUnifiedStore } from '../../stores/unified-store';
import type { Player } from '../../types/data-contracts';
import { calculateProjectionRange } from '../../core/projections';
import { FuzzySearch } from '../../core/search';
import WidgetContainer from './WidgetContainer';
import { 
  useDebounce, 
  useMemoizedCalculation,
  usePerformanceMonitor
} from '../../hooks';
import { WidgetErrorBoundary, SkeletonLoader } from '../../components/ui';

// Styled components with Robinhood Legend aesthetic
const SearchContainer = styled.div`
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  font-family: ${props => theme('typography.fontFamily.base')};
  color: ${props => theme('colors.text1')};
  
  /* Professional cell styling */
  .team-cell {
    font-weight: ${props => theme('typography.fontWeight.medium')};
    color: ${props => theme('colors.text2')};
  }
  
  .position-cell {
    font-weight: ${props => theme('typography.fontWeight.semibold')};
    font-size: ${props => theme('typography.fontSize.sm')};
    
    /* Position-specific colors */
    &[data-position="QB"] { color: ${props => theme('colors.positions.QB')}; }
    &[data-position="RB"] { color: ${props => theme('colors.positions.RB')}; }
    &[data-position="WR"] { color: ${props => theme('colors.positions.WR')}; }
    &[data-position="TE"] { color: ${props => theme('colors.positions.TE')}; }
    &[data-position="K"] { color: ${props => theme('colors.positions.K')}; }
    &[data-position="DST"] { color: ${props => theme('colors.positions.DST')}; }
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-1);
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 12px;
  transition: all 0.15s ease;
  
  &::placeholder {
    color: ${props => theme('colors.text2')};
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-alpha);
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
  font-size: 12px;
`;

const FilterSelect = styled.select`
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 4px;
  padding: 6px 8px;
  color: var(--text-2);
  font-size: 12px;
  min-width: 80px;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-2);
  cursor: pointer;
  
  input[type="checkbox"] {
    margin: 0;
  }
`;

const PositionFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--surface-2);
  border-radius: 6px;
  border: 1px solid var(--border-1);
`;

const PositionFilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleSwitch = styled.label<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$checked ? 'var(--accent)' : 'var(--text-2)'};
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
  }
  
  &:hover {
    color: var(--text-1);
  }
`;

const PositionCheckbox = styled.label<{ $checked?: boolean; $allActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  color: ${props => props.$allActive ? 'var(--text-muted)' : 'var(--text-2)'};
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
  opacity: ${props => props.$allActive ? '0.6' : '1'};
  
  input[type="checkbox"] {
    width: 12px;
    height: 12px;
    accent-color: var(--accent);
  }
  
  &:hover {
    color: var(--text-1);
    background: var(--surface-3);
    opacity: 1;
  }
  
  ${props => props.$checked && !props.$allActive && `
    background: var(--accent-alpha);
    color: var(--accent);
    font-weight: 500;
  `}
`;

const ResultCount = styled.span`
  color: ${props => theme('colors.text2')};
  font-size: 11px;
  margin-left: auto;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-1);
  border-radius: ${props => theme('borderRadius.lg')};
  background: ${props => theme('colors.surface1')};
  position: relative;
  
  /* Professional scrollbar for dense data */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => theme('colors.surface2')};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => theme('colors.border2')};
    border-radius: 4px;
    
    &:hover {
      background: ${props => theme('colors.textMuted')};
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${props => theme('typography.fontSize.sm')};
  font-family: ${props => theme('typography.fontFamily.data')};
  ${props => theme('typography.fontFeatures.tabularNums')};
  
  /* Professional data table spacing */
  border-spacing: 0;
  table-layout: fixed;
`;

const TableHeader = styled.thead`
  background: ${props => theme('colors.surface1')};
  position: sticky;
  top: 0;
  z-index: 2;
  
  /* Professional header shadow for stickiness */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${props => theme('colors.border2')}, transparent);
  }
`;

const HeaderCell = styled.th`
  text-align: left;
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.xs')};
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.wider')};
  border-bottom: 1px solid ${props => theme('colors.border1')};
  background: ${props => theme('gradients.subtle')};
  position: relative;
  cursor: pointer;
  user-select: none;
  transition: ${props => theme('transitions.fast')};
  
  /* Professional sortable header styling */
  &:hover {
    background: ${props => theme('colors.surface3')};
    color: ${props => theme('colors.text1')};
  }
  
  /* Column resize indicator */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 25%;
    bottom: 25%;
    width: 1px;
    background: ${props => theme('colors.border1')};
  }
`;

const TableRow = styled.tr<{ $isSelected?: boolean; $isDrafted?: boolean; $isKeyboardHighlighted?: boolean }>`
  cursor: pointer;
  transition: ${props => theme('animations.dataChange')};
  height: 32px; /* Dense row height for professional look */
  position: relative;
  
  /* Professional opacity states */
  opacity: ${props => props.$isDrafted ? 0.4 : 1};
  
  /* Background states with sophisticated gradients */
  background: ${props => {
    if (props.$isKeyboardHighlighted) return theme('colors.accentAlpha');
    if (props.$isSelected) return theme('gradients.widgetHover');
    return 'transparent';
  }};
  
  /* Professional hover state */
  &:hover {
    background: ${props => theme('states.hover.background')};
  }
  
  /* Zebra striping for better readability */
  &:nth-child(even) {
    background-color: ${props => !props.$isSelected ? 'rgba(255, 255, 255, 0.01)' : undefined};
  }
  
  /* Bottom border for row separation */
  &:not(:last-child) {
    border-bottom: 1px solid ${props => theme('colors.border1')};
  }
  
  /* Active selection styling */
  ${props => props.$isSelected && `
    background: ${theme('colors.accentAlpha')};
    border-left: 3px solid ${theme('colors.accent')};
  `}
  
  /* Drafted player styling */
  ${props => props.$isDrafted && `
    text-decoration: line-through;
    filter: grayscale(0.3);
    opacity: 0.6;
  `}
`;

const TableCell = styled.td`
  padding: ${props => theme('spacing.xs')} ${props => theme('spacing.md')};
  color: ${props => theme('colors.text2')};
  line-height: ${props => theme('typography.lineHeight.tight')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: ${props => theme('typography.fontWeight.normal')};
  
  /* Numeric cells use tabular numerics */
  &[data-numeric="true"] {
    ${props => theme('typography.fontFeatures.tabularNums')};
    font-weight: ${props => theme('typography.fontWeight.medium')};
    text-align: right;
  }
  
  /* First cell (player name) gets more emphasis */
  &:first-child {
    font-weight: ${props => theme('typography.fontWeight.medium')};
    color: ${props => theme('colors.text1')};
  }
`;

const PlayerName = styled.span`
  font-weight: 500;
  color: var(--text-1);
  
  mark {
    background: var(--accent-alpha);
    color: var(--accent);
    padding: 0;
  }
`;

const InjuryBadge = styled.span<{ $status: number }>`
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  padding: 3px 6px;
  border-radius: ${props => theme('borderRadius.sm')};
  text-align: center;
  min-width: 24px;
  display: inline-block;
  letter-spacing: ${props => theme('typography.letterSpacing.tight')};
  text-transform: uppercase;
  
  color: ${props => {
    switch (props.$status) {
      case 1: return theme('colors.warning');
      case 2: case 3: case 5: return theme('colors.danger');
      case 4: return theme('colors.danger');
      case 6: return theme('colors.textMuted');
      default: return theme('colors.positive');
    }
  }};
  
  background: ${props => {
    switch (props.$status) {
      case 1: return theme('colors.warningAlpha');
      case 2: case 3: case 5: return theme('colors.dangerAlpha');
      case 4: return theme('colors.dangerAlpha');
      case 6: return theme('colors.surface2');
      default: return theme('colors.positiveAlpha');
    }
  }};
  
  /* Professional badge with subtle border */
  border: 1px solid ${props => {
    switch (props.$status) {
      case 1: return theme('colors.warning') + '40';
      case 2: case 3: case 5: return theme('colors.danger') + '40';
      case 4: return theme('colors.danger') + '40';
      case 6: return theme('colors.border1');
      default: return theme('colors.positive') + '40';
    }
  }};
  
  /* Micro-animation on hover */
  transition: ${props => theme('transitions.fast')};
  cursor: help;
  
  &:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
`;

const VBDValue = styled.span<{ $value: number }>`
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  ${props => theme('typography.fontFeatures.tabularNums')};
  color: ${props => {
    if (props.$value > 50) return theme('colors.positive');
    if (props.$value > 20) return theme('colors.positiveMuted');
    if (props.$value > 0) return theme('colors.text2');
    return theme('colors.negative');
  }};
  
  /* Professional value styling with subtle background */
  background: ${props => {
    if (props.$value > 50) return theme('colors.positiveAlpha');
    if (props.$value < 0) return theme('colors.negativeAlpha');
    return 'transparent';
  }};
  
  padding: 2px 6px;
  border-radius: ${props => theme('borderRadius.sm')};
  font-size: ${props => theme('typography.fontSize.sm')};
  
  /* Animation for value changes */
  transition: ${props => theme('animations.valueUpdate')};
`;

const ProjectionRange = styled.span`
  font-weight: ${props => theme('typography.fontWeight.medium')};
  ${props => theme('typography.fontFeatures.tabularNums')};
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.sm')};
  
  &:hover {
    cursor: help;
  }
`;

const ProjectionSource = styled.span<{ $source: string }>`
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.bold')};
  text-transform: uppercase;
  padding: 2px 4px;
  border-radius: 3px;
  
  color: ${props => {
    switch (props.$source) {
      case 'FFA': return theme('colors.accent');
      case 'FPs': return theme('colors.positive');
      case 'custom': return theme('colors.warning');
      default: return theme('colors.text2');
    }
  }};
  
  background: ${props => {
    switch (props.$source) {
      case 'FFA': return theme('colors.accentAlpha');
      case 'FPs': return theme('colors.positiveAlpha');
      case 'custom': return theme('colors.warningAlpha');
      default: return theme('colors.surface2');
    }
  }};
`;

const EmptyState = styled.div`
  padding: ${props => theme('spacing')['5xl']} ${props => theme('spacing')['2xl']};
  text-align: center;
  color: ${props => theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.base')};
  
  .empty-icon {
    font-size: ${props => theme('typography.fontSize')['3xl']};
    margin-bottom: ${props => theme('spacing.lg')};
    opacity: 0.5;
  }
  
  .empty-title {
    font-weight: ${props => theme('typography.fontWeight.medium')};
    margin-bottom: ${props => theme('spacing.sm')};
    color: ${props => theme('colors.text1')};
  }
  
  .empty-subtitle {
    font-size: ${props => theme('typography.fontSize.sm')};
    opacity: 0.85;
    color: ${props => theme('colors.text2')};
  }
`;

const LoadingState = styled.div`
  padding: ${props => theme('spacing')['2xl']};
  
  .skeleton-row {
    height: 32px;
    background: ${props => theme('colors.surface2')};
    border-radius: ${props => theme('borderRadius.sm')};
    margin-bottom: ${props => theme('spacing.xs')};
    animation: skeleton-loading 1.5s ease-in-out infinite;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.04),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
  }
  
  .skeleton-header {
    height: 28px;
    background: ${props => theme('colors.surface3')};
    margin-bottom: ${props => theme('spacing.sm')};
  }
`;

// Injury status mapping
const INJURY_LABELS = {
  0: 'H',
  1: 'Q',
  2: 'D',
  3: 'O',
  4: 'IR',
  5: 'PUP',
  6: 'NA'
} as const;

// Removed duplicate useDebounce - using the one from hooks

const columnHelper = createColumnHelper<Player>();

// Props interface
interface PlayerSearchWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

// Memoized PlayerSearchWidget with performance optimizations
const PlayerSearchWidget = React.memo(({ editMode = false, onRemove }: PlayerSearchWidgetProps) => {
  // Store connections
  const store = useUnifiedStore();
  const { players } = store;
  const selectedPlayer = store.ui.selectedPlayer;
  
  // Performance monitoring in development
  const renderCount = usePerformanceMonitor('PlayerSearchWidget');
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [positionFilters, setPositionFilters] = useState<Set<string>>(new Set());
  const [showAllPositions, setShowAllPositions] = useState(true);
  const [showDrafted, setShowDrafted] = useState(false);
  const [keyboardIndex, setKeyboardIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  
  // Memoized search engine with performance tracking
  const searchEngine = useMemoizedCalculation(
    () => players.length > 0 ? new FuzzySearch(players) : null,
    [players],
    'FuzzySearch creation'
  );
  
  // Optimized search and filter logic with memoized calculation
  const searchResults = useMemoizedCalculation(
    () => {
      if (!searchEngine || players.length === 0) return [];
      
      // Get search results
      let results = debouncedSearchTerm.trim() 
        ? searchEngine.search(debouncedSearchTerm, { drafted: 'all' })
        : players;
      
      // Apply position filter (if not showing all)
      if (!showAllPositions && positionFilters.size > 0) {
        results = results.filter((p: Player) => positionFilters.has(p.position));
      }
      
      // Apply drafted filter
      if (!showDrafted) {
        results = results.filter((p: Player) => !p.drafted);
      }
      
      // Sort by VBD if available, else by points, else by ADP
      results.sort((a: Player, b: Player) => {
        if (a.vbd !== undefined && b.vbd !== undefined) {
          return b.vbd - a.vbd;
        }
        if ((a.points || 0) !== (b.points || 0)) {
          return (b.points || 0) - (a.points || 0);
        }
        const adpA = a.marketData?.adp ?? a.adp ?? Infinity;
        const adpB = b.marketData?.adp ?? b.adp ?? Infinity;
        return adpA - adpB;
      });
      
      // Limit results for performance (virtual scrolling would be better for large datasets)
      return results.slice(0, 100);
    },
    [searchEngine, players, debouncedSearchTerm, positionFilters, showAllPositions, showDrafted],
    'Player search and filtering'
  );
  
  // Highlight matching text
  const highlightMatch = useCallback((name: string, query: string) => {
    if (!query) return name;
    
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return name.replace(regex, '<mark>$1</mark>');
    } catch {
      return name;
    }
  }, []);
  
  // Table columns definition
  const columns = useMemo<ColumnDef<Player>[]>(() => [
    columnHelper.accessor('name', {
      header: 'Player',
      cell: info => (
        <PlayerName 
          dangerouslySetInnerHTML={{ 
            __html: highlightMatch(info.getValue(), debouncedSearchTerm) 
          }}
        />
      ),
      size: 180
    }),
    columnHelper.accessor('team', {
      header: 'Team',
      cell: info => (
        <span className="team-cell">
          {info.getValue() || '-'}
        </span>
      ),
      size: 60
    }),
    columnHelper.accessor('position', {
      header: 'Pos',
      cell: info => (
        <span className="position-cell" data-position={info.getValue()}>
          {info.getValue() || '-'}
        </span>
      ),
      size: 50
    }),
    columnHelper.accessor('points', {
      header: 'Pts',
      cell: info => {
        const points = info.getValue();
        return (
          <span data-numeric="true">
            {points !== undefined ? points.toFixed(1) : '-'}
          </span>
        );
      },
      size: 60
    }),
    columnHelper.accessor('vbd', {
      header: 'VBD',
      cell: info => {
        const vbd = info.getValue();
        return vbd !== undefined && vbd !== null ? (
          <VBDValue $value={vbd} data-numeric="true">
            {vbd > 0 ? '+' : ''}{vbd.toFixed(1)}
          </VBDValue>
        ) : (
          <span data-numeric="true">-</span>
        );
      },
      size: 70,
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.original.vbd || 0;
        const b = rowB.original.vbd || 0;
        return a - b;
      }
    }),
    columnHelper.accessor('projections', {
      header: 'Range',
      cell: info => {
        const projections = info.getValue();
        if (!projections) return <span data-numeric="true">-</span>;
        
        try {
          const range = calculateProjectionRange(projections);
          const hasRange = Math.abs(range.high - range.low) > 0.1;
          
          return (
            <ProjectionRange data-numeric="true" title={`Confidence: ${Math.round(range.confidence * 100)}%`}>
              {hasRange ? (
                <span>
                  {range.low.toFixed(1)}-{range.high.toFixed(1)}
                </span>
              ) : (
                <span>{projections.points.toFixed(1)}</span>
              )}
            </ProjectionRange>
          );
        } catch (error) {
          return <span data-numeric="true">{projections?.points?.toFixed(1) || '-'}</span>;
        }
      },
      size: 90,
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.original.projections?.points || 0;
        const b = rowB.original.projections?.points || 0;
        return a - b;
      }
    }),
    columnHelper.accessor(row => row.projections?.source, {
      id: 'source',
      header: 'Src',
      cell: info => {
        const source = info.getValue();
        if (!source) return <span>-</span>;
        
        return (
          <ProjectionSource $source={source}>
            {source}
          </ProjectionSource>
        );
      },
      size: 50
    }),
    columnHelper.accessor('injuryStatus', {
      header: 'Status',
      cell: info => {
        const status = info.getValue() || 0;
        return (
          <InjuryBadge $status={status}>
            {INJURY_LABELS[status as keyof typeof INJURY_LABELS]}
          </InjuryBadge>
        );
      },
      size: 60
    })
  ], [highlightMatch, debouncedSearchTerm]);
  
  // Table setup
  const table = useReactTable({
    data: searchResults,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: true, // Allow removing sort by clicking header again
  });
  
  // Handle player selection
  const handlePlayerSelect = useCallback((player: Player) => {
    store.selectPlayer(player);
    
    // Emit event for cross-widget synchronization
    window.dispatchEvent(new CustomEvent('player:selected', { 
      detail: player 
    }));
  }, [store]);

  // Position filter handlers
  const handleAllPositionsToggle = useCallback(() => {
    if (showAllPositions) {
      // Already showing all, do nothing (ALL should always be on when no specific positions selected)
      return;
    } else {
      // Turn on ALL, clear individual selections
      setShowAllPositions(true);
      setPositionFilters(new Set());
    }
  }, [showAllPositions]);

  const handlePositionToggle = useCallback((position: string) => {
    setShowAllPositions(false);
    setPositionFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(position)) {
        newFilters.delete(position);
        // If no positions selected, turn ALL back on
        if (newFilters.size === 0) {
          setShowAllPositions(true);
        }
      } else {
        newFilters.add(position);
      }
      return newFilters;
    });
  }, []);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const rowCount = searchResults.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setKeyboardIndex(prev => Math.min(prev + 1, rowCount - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setKeyboardIndex(prev => Math.max(prev - 1, -1));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (keyboardIndex >= 0 && keyboardIndex < rowCount) {
          handlePlayerSelect(searchResults[keyboardIndex]);
        }
        break;
        
      case 'Escape':
        setKeyboardIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [searchResults, keyboardIndex, handlePlayerSelect]);
  
  // Reset keyboard index when search changes
  useEffect(() => {
    setKeyboardIndex(-1);
  }, [searchResults]);
  
  return (
    <WidgetErrorBoundary widgetName="Player Search">
      <WidgetContainer title="Player Search" widgetId="search" editMode={editMode} onRemove={onRemove}>
        <SearchContainer>
        <SearchInput
          ref={inputRef}
          type="text"
          placeholder="Search players (fuzzy matching enabled)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Search players by name"
          aria-describedby="search-help search-results-count"
          role="searchbox"
          aria-autocomplete="list"
          aria-expanded={searchResults.length > 0}
          aria-activedescendant={keyboardIndex >= 0 ? `player-row-${keyboardIndex}` : undefined}
        />
        <div id="search-help" className="sr-only">
          Use arrow keys to navigate results, Enter to select, Escape to clear focus
        </div>
        
        <PositionFiltersContainer>
          <PositionFilterGroup>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '500' }}>Position:</span>
            <ToggleSwitch $checked={showAllPositions}>
              <input
                type="checkbox"
                checked={showAllPositions}
                onChange={handleAllPositionsToggle}
                aria-label="Show all positions"
              />
              ALL
            </ToggleSwitch>
          </PositionFilterGroup>
          
          <PositionFilterGroup>
            {['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(position => (
              <PositionCheckbox 
                key={position}
                $checked={positionFilters.has(position)}
                $allActive={showAllPositions}
              >
                <input
                  type="checkbox"
                  checked={positionFilters.has(position)}
                  onChange={() => handlePositionToggle(position)}
                  aria-label={`Filter by ${position}`}
                />
                {position}
              </PositionCheckbox>
            ))}
          </PositionFilterGroup>
        </PositionFiltersContainer>

        <FiltersRow>
          
          <CheckboxContainer>
            <input
              id="show-drafted"
              type="checkbox"
              checked={showDrafted}
              onChange={(e) => setShowDrafted(e.target.checked)}
              aria-describedby="drafted-help"
            />
            <label htmlFor="show-drafted">Show Drafted</label>
            <div id="drafted-help" className="sr-only">
              Include already drafted players in search results
            </div>
          </CheckboxContainer>
          
          <ResultCount id="search-results-count" aria-live="polite" aria-atomic="true">
            {loading ? 'Searching...' : `${searchResults.length} results found`}
          </ResultCount>
        </FiltersRow>
        
        <TableContainer ref={tableRef} role="region" aria-label="Player search results" aria-describedby="search-results-count">
          {searchResults.length > 0 ? (
            <Table role="table" aria-label="Player search results table">
              <TableHeader role="rowgroup">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} role="row">
                    {headerGroup.headers.map(header => (
                      <HeaderCell 
                        key={header.id} 
                        style={{ 
                          width: header.getSize(),
                          cursor: header.column.getCanSort() ? 'pointer' : 'default'
                        }}
                        role="columnheader"
                        scope="col"
                        tabIndex={header.column.getCanSort() ? 0 : -1}
                        aria-sort={
                          header.column.getIsSorted() === 'asc' ? 'ascending' :
                          header.column.getIsSorted() === 'desc' ? 'descending' : 'none'
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span style={{ 
                              marginLeft: '4px', 
                              fontSize: '10px',
                              opacity: header.column.getIsSorted() ? 1 : 0.5
                            }}>
                              {header.column.getIsSorted() === 'asc' ? '▲' :
                               header.column.getIsSorted() === 'desc' ? '▼' : '⇅'}
                            </span>
                          )}
                        </div>
                      </HeaderCell>
                    ))}
                  </tr>
                ))}
              </TableHeader>
              <tbody role="rowgroup">
                {table.getRowModel().rows.map((row, index) => {
                  const player = row.original;
                  const isSelected = selectedPlayer?.id === player.id;
                  const isKeyboardHighlighted = keyboardIndex === index;
                  
                  return (
                    <TableRow
                      key={row.id}
                      id={`player-row-${index}`}
                      $isSelected={isSelected}
                      $isDrafted={player.drafted}
                      $isKeyboardHighlighted={isKeyboardHighlighted}
                      onClick={() => handlePlayerSelect(player)}
                      role="row"
                      tabIndex={isKeyboardHighlighted ? 0 : -1}
                      aria-selected={isSelected}
                      aria-describedby={`player-desc-${index}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} role="gridcell">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <>
              {loading ? (
                <LoadingState>
                  <div className="skeleton-header"></div>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton-row"></div>
                  ))}
                </LoadingState>
              ) : (
                <EmptyState role="status" aria-live="polite">
                  <div className="empty-icon" aria-hidden="true">🔍</div>
                  <div className="empty-title">
                    {searchTerm ? `No players found matching "${searchTerm}"` : 'Search for Players'}
                  </div>
                  <div className="empty-subtitle">
                    {searchTerm ? 'Try adjusting your search terms or filters' : 'Enter a player name to get started with fuzzy matching'}
                  </div>
                </EmptyState>
              )}
            </>
          )}
        </TableContainer>
        </SearchContainer>
      </WidgetContainer>
    </WidgetErrorBoundary>
  );
});

PlayerSearchWidget.displayName = 'PlayerSearchWidget';

export default PlayerSearchWidget;