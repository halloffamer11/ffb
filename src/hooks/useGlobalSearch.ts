import { useState, useMemo, useCallback } from 'react';
import { FuzzySearch } from '../core/search';
import { useUnifiedStore } from '../stores/unified-store';

export interface SearchResult {
  type: 'player' | 'page' | 'filter';
  id: string;
  title: string;
  subtitle?: string;
  action?: string;
  data?: any;
}

export interface SearchCategory {
  type: 'player' | 'page' | 'filter';
  name: string;
  results: SearchResult[];
}

// Static search index for pages and filters
const STATIC_SEARCH_INDEX = [
  // Pages
  { type: 'page', id: 'settings', title: 'League Settings', subtitle: 'Configure draft settings', action: '/settings' },
  { type: 'page', id: 'data-management', title: 'Data Management', subtitle: 'Import player data', action: '/data-management' },
  { type: 'page', id: 'data', title: 'Data Settings', subtitle: 'Import player data', action: '/data-management' },
  { type: 'page', id: 'developer', title: 'Developer Tools', subtitle: 'Debug tools and test data', action: '/developer' },
  
  // Position filters
  { type: 'filter', id: 'qb', title: 'Quarterback', subtitle: 'Filter by QB position', action: 'filter:QB' },
  { type: 'filter', id: 'rb', title: 'Running Back', subtitle: 'Filter by RB position', action: 'filter:RB' },
  { type: 'filter', id: 'wr', title: 'Wide Receiver', subtitle: 'Filter by WR position', action: 'filter:WR' },
  { type: 'filter', id: 'te', title: 'Tight End', subtitle: 'Filter by TE position', action: 'filter:TE' },
  { type: 'filter', id: 'k', title: 'Kicker', subtitle: 'Filter by K position', action: 'filter:K' },
  { type: 'filter', id: 'def', title: 'Defense', subtitle: 'Filter by DEF position', action: 'filter:DEF' },
  { type: 'filter', id: 'dst', title: 'Defense', subtitle: 'Filter by DST position', action: 'filter:DST' }
] as SearchResult[];

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const store = useUnifiedStore();
  const { players } = store;

  // Initialize fuzzy search for players
  const playerSearch = useMemo(() => {
    if (!players || players.length === 0) return null;
    return new FuzzySearch(players);
  }, [players]);

  // Search function
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const query = searchTerm.toLowerCase();

    // Search players
    if (playerSearch) {
      const playerResults = playerSearch.search(searchTerm, { drafted: 'all' });
      const topPlayers = playerResults.slice(0, 5); // Limit to top 5 matches
      
      for (const player of topPlayers) {
        results.push({
          type: 'player',
          id: player.id || player.name,
          title: player.name,
          subtitle: `${player.position} - ${player.team}${player.drafted ? ' (Drafted)' : ''}`,
          action: `player:${player.id || player.name}`,
          data: player
        });
      }
    }

    // Search static items (pages and filters)
    for (const item of STATIC_SEARCH_INDEX) {
      if (item.title.toLowerCase().includes(query) || 
          item.subtitle?.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)) {
        results.push(item);
      }
    }

    return results;
  }, [searchTerm, playerSearch]);

  // Group results by category
  const searchCategories = useMemo(() => {
    const categories: SearchCategory[] = [];
    const playerResults = searchResults.filter(r => r.type === 'player');
    const pageResults = searchResults.filter(r => r.type === 'page');
    const filterResults = searchResults.filter(r => r.type === 'filter');

    if (playerResults.length > 0) {
      categories.push({
        type: 'player',
        name: 'Players',
        results: playerResults
      });
    }

    if (pageResults.length > 0) {
      categories.push({
        type: 'page', 
        name: 'Pages',
        results: pageResults
      });
    }

    if (filterResults.length > 0) {
      categories.push({
        type: 'filter',
        name: 'Filters',
        results: filterResults
      });
    }

    return categories;
  }, [searchResults]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setIsSearchOpen(term.length >= 2);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearchOpen(false);
  }, []);

  const selectResult = useCallback((result: SearchResult, navigate?: (path: string) => void) => {
    if (result.action) {
      if (result.action.startsWith('/')) {
        // Navigate to page using React Router
        if (navigate) {
          navigate(result.action);
        } else {
          // Fallback to hash navigation if navigate function not provided
          window.location.hash = result.action;
        }
      } else if (result.action.startsWith('player:')) {
        // Handle player selection - update store and emit event
        const player = result.data;
        if (player) {
          // Update the store (this is what widgets actually use)
          store.selectPlayer(player);
          
          // Also emit event for backward compatibility
          window.dispatchEvent(new CustomEvent('player:selected', { 
            detail: player 
          }));
        }
      } else if (result.action.startsWith('filter:')) {
        // Handle position filter - emit custom event
        const position = result.action.replace('filter:', '');
        window.dispatchEvent(new CustomEvent('position:filter', { 
          detail: { position } 
        }));
      }
    }
    clearSearch();
  }, [clearSearch, store]);

  return {
    searchTerm,
    isSearchOpen,
    searchResults,
    searchCategories,
    handleSearch,
    clearSearch,
    selectResult,
    setIsSearchOpen
  };
}