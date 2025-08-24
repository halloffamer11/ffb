import { create } from 'zustand';
// import { subscribeWithSelector } from 'zustand/middleware';
import { DraftStore } from '../state/store';
import { createStorageAdapter } from '../adapters/storage';
import { initializeTestData } from '../utils/testData';

// Import the existing storage adapter
const storageAdapter = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

// Create the legacy DraftStore instance
const legacyStore = new DraftStore({
  storageAdapter,
  version: '1.0.0'
});

// Define the React state interface
export interface DraftState {
  // Draft state
  players: any[];
  picks: any[];
  settings: any;
  roster: any[];
  
  // UI state
  selectedPlayer: any | null;
  searchTerm: string;
  
  // Actions
  dispatch: (action: { type: string; payload?: any }) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setSelectedPlayer: (player: any) => void;
  setSearchTerm: (term: string) => void;
  
  // Getters
  getState: () => any;
  
  // Internal
  _legacyStore: DraftStore;
  _syncFromLegacy: () => void;
}

// Create the Zustand store
export const useDraftStore = create<DraftState>()((set, get) => {
    // Function to sync React state with legacy store
    const syncFromLegacy = () => {
      const legacyState = legacyStore.getState();
      set({
        players: legacyState.players || [],
        picks: legacyState.picks || [],
        settings: legacyState.settings || {},
        roster: legacyState.roster || []
      });
    };
    
    // Subscribe to legacy store changes
    legacyStore.subscribe('change', syncFromLegacy);
    
    // Initialize test data for development/validation
    try {
      initializeTestData(storageAdapter);
    } catch (error) {
      console.warn('Failed to initialize test data:', error);
    }
    
    // Initial sync
    syncFromLegacy();
    
    return {
      // State from legacy store
      players: [],
      picks: [],
      settings: {},
      roster: [],
      
      // UI-specific state
      selectedPlayer: null,
      searchTerm: '',
      
      // Actions that delegate to legacy store
      dispatch: (action) => {
        // Handle UI-only actions in React state
        if (action.type === 'SET_SELECTED_PLAYER') {
          set({ selectedPlayer: action.payload });
          return;
        }
        
        legacyStore.dispatch(action);
        // State will be synced via the subscription
      },
      
      undo: () => {
        const result = legacyStore.undo();
        // State will be synced via the subscription
        return result;
      },
      
      redo: () => {
        const result = legacyStore.redo();
        // State will be synced via the subscription
        return result;
      },
      
      canUndo: () => legacyStore.canUndo(),
      canRedo: () => legacyStore.canRedo(),
      
      getState: () => legacyStore.getState(),
      
      // Internal references
      _legacyStore: legacyStore,
      _syncFromLegacy: syncFromLegacy,
      
      // UI state setters (React-specific)
      setSelectedPlayer: (player: any) => {
        set({ selectedPlayer: player });
        // FIXED: Removed legacy store dispatch to prevent data mutations on selection
        // Selection should be UI-only state, not trigger data changes
      },
      setSearchTerm: (term: string) => set({ searchTerm: term })
    };
  })

// Export the legacy store instance for direct access if needed
export { legacyStore };

// Convenience hooks
export const useSelectedPlayer = () => useDraftStore(state => state.selectedPlayer);
export const useSearchTerm = () => useDraftStore(state => state.searchTerm);
export const usePlayers = () => useDraftStore(state => state.players);
export const usePicks = () => useDraftStore(state => state.picks);
export const useSettings = () => useDraftStore(state => state.settings);
export const useRoster = () => useDraftStore(state => state.roster);

// Action creators
export const draftActions = {
  draftPlayer: (player: any, team: string, price: number) => ({
    type: 'DRAFT_PLAYER',
    payload: { player, team, price }
  }),
  
  undraftPlayer: (pickIndex: number) => ({
    type: 'UNDRAFT_PLAYER', 
    payload: { pickIndex }
  }),
  
  removePick: (playerId: number, teamId: number) => ({
    type: 'REMOVE_PICK',
    payload: { playerId, teamId }
  }),
  
  updateSettings: (settings: any) => ({
    type: 'UPDATE_SETTINGS',
    payload: settings
  }),
  
  importPlayers: (players: any[]) => ({
    type: 'IMPORT_PLAYERS',
    payload: players
  })
};