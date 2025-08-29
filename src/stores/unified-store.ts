/**
 * Unified State Management Store
 * 
 * This replaces the dual legacy/Zustand system with a single, type-safe store
 * that properly handles data persistence, widget communication, and error recovery.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  ApplicationState, 
  Action, 
  Player, 
  DraftPick, 
  Keeper, 
  Team,
  LeagueSettings, 
  ScoringSystem,
  UIState,
  StateMetadata,
  ValidationResult,
  PerformanceEntry,
  StorageAdapter
} from '../types/data-contracts';
import { createStorageAdapter } from '../adapters/storage';
import { validateApplicationState, createInitialState } from '../utils/state-validation';

// Performance monitoring
const performanceEntries: PerformanceEntry[] = [];
const MAX_PERFORMANCE_ENTRIES = 1000;

function logPerformance(component: string, operation: string, duration: number, metadata?: any) {
  const entry: PerformanceEntry = {
    component,
    operation, 
    duration,
    timestamp: Date.now(),
    metadata
  };
  
  performanceEntries.push(entry);
  if (performanceEntries.length > MAX_PERFORMANCE_ENTRIES) {
    performanceEntries.shift();
  }
  
  // Warn about slow operations
  if (duration > 100) {
    console.warn(`Slow operation detected: ${component}.${operation} took ${duration.toFixed(2)}ms`, metadata);
  }
}

// Deep clone helper function
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

// Action history for debugging and undo/redo
const actionHistory: (Action & { timestamp: number; state: ApplicationState })[] = [];
const MAX_HISTORY_SIZE = 50;

function logAction(action: Action, state: ApplicationState) {
  try {
    const entry = {
      ...action,
      timestamp: Date.now(),
      state: deepClone(state)
    };
    
    actionHistory.push(entry);
    if (actionHistory.length > MAX_HISTORY_SIZE) {
      actionHistory.shift();
    }
  } catch (error) {
    console.warn('Failed to log action to history:', error);
  }
}

// Error handling and recovery
interface StoreError {
  type: 'validation' | 'persistence' | 'action' | 'recovery';
  message: string;
  timestamp: number;
  context?: any;
}

const storeErrors: StoreError[] = [];
const MAX_ERRORS = 100;

function logError(type: StoreError['type'], message: string, context?: any) {
  const error: StoreError = { type, message, timestamp: Date.now(), context };
  storeErrors.push(error);
  if (storeErrors.length > MAX_ERRORS) {
    storeErrors.shift();
  }
  console.error(`Store Error [${type}]:`, message, context);
}

// Create unified storage adapter with proper error handling
// CRITICAL: Using 'workspace' namespace to maintain compatibility with existing data
const storageAdapter = createStorageAdapter({ 
  namespace: 'workspace', 
  version: '2.0.0',
  maxBytes: 10 * 1024 * 1024 // 10MB limit
});

export interface UnifiedStoreState extends ApplicationState {
  // Store management
  isLoaded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
  
  // Actions
  dispatch: (action: Action) => void;
  
  // Player management
  importPlayers: (players: Player[]) => void;
  selectPlayer: (player: Player | null) => void;
  draftPlayer: (player: Player, teamId: number, price: number) => void;
  undraftPlayer: (pickIndex: number) => void;
  
  // Settings management  
  updateSettings: (settings: Partial<LeagueSettings>) => void;
  updateTeams: (teams: Team[]) => void;
  assignKeeper: (keeper: Keeper) => void;
  removeKeeper: (keeperId: string) => void;
  startDraft: () => void;
  
  // UI state management
  setSearchTerm: (term: string) => void;
  setFilter: (filterType: keyof UIState['filters'], value: any) => void;
  setEditMode: (enabled: boolean) => void;
  
  // Persistence
  save: () => Promise<void>;
  load: () => Promise<void>;
  reset: () => void;
  
  // Debug and developer tools
  getDebugInfo: () => {
    state: ApplicationState;
    performance: PerformanceEntry[];
    errors: StoreError[];
    actions: typeof actionHistory;
    storage: {
      size: number;
      namespace: string;
      available: boolean;
    };
  };
  
  // Validation
  validate: () => ValidationResult;
  
  // Undo/redo
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const undoStack: ApplicationState[] = [];
const redoStack: ApplicationState[] = [];
const MAX_UNDO_STACK = 20;

function pushUndoState(state: ApplicationState) {
  try {
    undoStack.push(deepClone(state));
    if (undoStack.length > MAX_UNDO_STACK) {
      undoStack.shift();
    }
    // Clear redo stack when new action is performed
    redoStack.length = 0;
  } catch (error) {
    console.warn('Failed to push undo state:', error);
  }
}

// Create the unified store
export const useUnifiedStore = create<UnifiedStoreState>()(
  subscribeWithSelector((set, get) => {
    // Initialize with empty state
    let initialState = createInitialState();
    
    // Load from storage if available
    if (storageAdapter.isAvailable()) {
      try {
        const savedState = storageAdapter.get('state');
        if (savedState) {
          const validation = validateApplicationState(savedState);
          if (validation.valid) {
            initialState = { ...initialState, ...savedState };
          } else {
            logError('validation', 'Invalid state loaded from storage', validation.errors);
          }
        }
      } catch (error) {
        logError('persistence', 'Failed to load state from storage', error);
      }
    }
    
    const store: UnifiedStoreState = {
      ...initialState,
      isLoaded: true,
      isLoading: false,
      isSaving: false,
      lastError: null,
      
      dispatch: (action: Action) => {
        const startTime = performance.now();
        
        try {
          const currentState = get();
          
          // Create undo point
          const undoState: ApplicationState = {
            players: currentState.players,
            picks: currentState.picks,
            keepers: currentState.keepers,
            settings: currentState.settings,
            ui: currentState.ui,
            metadata: currentState.metadata
          };
          pushUndoState(undoState);
          
          // Apply action
          let newState: Partial<UnifiedStoreState> = {};
          
          switch (action.type) {
            case 'PLAYERS_IMPORT':
              newState = {
                players: Array.isArray(action.payload) ? action.payload : [],
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now(),
                  saveCount: currentState.metadata.saveCount + 1,
                  dataSource: action.payload?.source || 'manual'
                }
              };
              break;
              
            case 'PLAYER_SELECT':
              newState = {
                ui: {
                  ...currentState.ui,
                  selectedPlayer: action.payload
                }
              };
              break;
              
            case 'PLAYER_DRAFT':
              const { player, teamId, price } = action.payload;
              const draftPick: DraftPick = {
                player,
                teamId,
                price,
                timestamp: Date.now()
              };
              
              newState = {
                picks: [...currentState.picks, draftPick],
                players: currentState.players.map(p => 
                  p.id === player.id ? { ...p, drafted: true } : p
                ),
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            case 'SETTINGS_UPDATE':
              newState = {
                settings: { ...currentState.settings, ...action.payload },
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            case 'TEAMS_UPDATE':
              // Update team budgets when teams change
              const updatedTeams = action.payload.map((team: Team) => ({
                ...team,
                budget: team.budget || currentState.settings.budget
              }));
              
              newState = {
                settings: { 
                  ...currentState.settings, 
                  teams: updatedTeams,
                  teamCount: updatedTeams.length
                },
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            case 'KEEPER_ASSIGN':
              const { keeper } = action.payload;
              const existingKeeperIndex = currentState.keepers.findIndex(
                k => k.player.id === keeper.player.id
              );
              
              let updatedKeepers;
              if (existingKeeperIndex >= 0) {
                updatedKeepers = [...currentState.keepers];
                updatedKeepers[existingKeeperIndex] = keeper;
              } else {
                updatedKeepers = [...currentState.keepers, keeper];
              }
              
              // Update team budget
              const updatedTeamsForKeeper = currentState.settings.teams.map(team => {
                if (team.id === keeper.teamId) {
                  const totalKeeperCost = updatedKeepers
                    .filter(k => k.teamId === team.id)
                    .reduce((sum, k) => sum + k.cost, 0);
                  return {
                    ...team,
                    budget: currentState.settings.budget - totalKeeperCost
                  };
                }
                return team;
              });
              
              newState = {
                keepers: updatedKeepers,
                settings: {
                  ...currentState.settings,
                  teams: updatedTeamsForKeeper
                },
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            case 'KEEPER_REMOVE':
              const { keeperId } = action.payload;
              const removedKeeperIndex = currentState.keepers.findIndex(
                k => `${k.player.id}-${k.teamId}` === keeperId
              );
              
              if (removedKeeperIndex >= 0) {
                const removedKeeper = currentState.keepers[removedKeeperIndex];
                const remainingKeepers = currentState.keepers.filter((_, index) => index !== removedKeeperIndex);
                
                // Restore team budget
                const restoredTeams = currentState.settings.teams.map(team => {
                  if (team.id === removedKeeper.teamId) {
                    const totalKeeperCost = remainingKeepers
                      .filter(k => k.teamId === team.id)
                      .reduce((sum, k) => sum + k.cost, 0);
                    return {
                      ...team,
                      budget: currentState.settings.budget - totalKeeperCost
                    };
                  }
                  return team;
                });
                
                newState = {
                  keepers: remainingKeepers,
                  settings: {
                    ...currentState.settings,
                    teams: restoredTeams
                  },
                  metadata: {
                    ...currentState.metadata,
                    lastModified: Date.now()
                  }
                };
              }
              break;
              
            case 'DRAFT_START':
              newState = {
                settings: {
                  ...currentState.settings,
                  isDraftStarted: true
                },
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            case 'UI_UPDATE':
              newState = {
                ui: { ...currentState.ui, ...action.payload }
              };
              break;
              
            case 'PICK_REMOVE':
              const { pickIndex } = action.payload;
              const removedPick = currentState.picks[pickIndex];
              
              newState = {
                picks: currentState.picks.filter((_, index) => index !== pickIndex),
                players: currentState.players.map(p => 
                  (removedPick && p.id === removedPick.player?.id) ? { ...p, drafted: false } : p
                ),
                metadata: {
                  ...currentState.metadata,
                  lastModified: Date.now()
                }
              };
              break;
              
            default:
              console.warn('Unknown action type:', action.type);
              return;
          }
          
          // Update state
          set(newState);
          
          // Log action for debugging
          const finalState = { ...currentState, ...newState };
          logAction(action, finalState as ApplicationState);
          
          // Auto-save (non-blocking)
          setTimeout(() => store.save(), 0);
          
        } catch (error) {
          logError('action', `Failed to process action: ${action.type}`, { action, error });
          set({ lastError: `Action failed: ${action.type}` });
        }
        
        const duration = performance.now() - startTime;
        logPerformance('UnifiedStore', `action:${action.type}`, duration, action.payload);
      },
      
      importPlayers: (players: Player[]) => {
        store.dispatch({ type: 'PLAYERS_IMPORT', payload: players });
      },
      
      selectPlayer: (player: Player | null) => {
        store.dispatch({ type: 'PLAYER_SELECT', payload: player });
      },
      
      draftPlayer: (player: Player, teamId: number, price: number) => {
        store.dispatch({ type: 'PLAYER_DRAFT', payload: { player, teamId, price } });
      },
      
      undraftPlayer: (pickIndex: number) => {
        store.dispatch({ type: 'PICK_REMOVE', payload: { pickIndex } });
      },
      
      updateSettings: (settings: Partial<LeagueSettings>) => {
        store.dispatch({ type: 'SETTINGS_UPDATE', payload: settings });
      },
      
      updateTeams: (teams: Team[]) => {
        store.dispatch({ type: 'TEAMS_UPDATE', payload: teams });
      },
      
      assignKeeper: (keeper: Keeper) => {
        store.dispatch({ type: 'KEEPER_ASSIGN', payload: { keeper } });
      },
      
      removeKeeper: (keeperId: string) => {
        store.dispatch({ type: 'KEEPER_REMOVE', payload: { keeperId } });
      },
      
      startDraft: () => {
        store.dispatch({ type: 'DRAFT_START', payload: {} });
      },
      
      setSearchTerm: (term: string) => {
        store.dispatch({ type: 'UI_UPDATE', payload: { searchTerm: term } });
      },
      
      setFilter: (filterType: keyof UIState['filters'], value: any) => {
        const currentState = get();
        store.dispatch({ 
          type: 'UI_UPDATE', 
          payload: { 
            filters: { 
              ...currentState.ui.filters, 
              [filterType]: value 
            } 
          } 
        });
      },
      
      setEditMode: (enabled: boolean) => {
        store.dispatch({ type: 'UI_UPDATE', payload: { editMode: enabled } });
      },
      
      save: async () => {
        const startTime = performance.now();
        set({ isSaving: true });
        
        try {
          const state = get();
          const dataToSave = {
            players: state.players,
            picks: state.picks,
            keepers: state.keepers,
            settings: state.settings,
            ui: state.ui,
            metadata: {
              ...state.metadata,
              saveCount: state.metadata.saveCount + 1,
              lastModified: Date.now()
            }
          };
          
          // Save in unified format only
          const result = storageAdapter.set('state', dataToSave);
          if (!result.ok) {
            throw new Error(result.error || 'Unknown storage error');
          }
          
          console.log('💾 Saved to unified store');
          
          set({ lastError: null });
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Save failed';
          logError('persistence', 'Failed to save state', error);
          set({ lastError: message });
        } finally {
          const duration = performance.now() - startTime;
          logPerformance('UnifiedStore', 'save', duration);
          set({ isSaving: false });
        }
      },
      
      load: async () => {
        const startTime = performance.now();
        set({ isLoading: true });
        
        try {
          if (!storageAdapter.isAvailable()) {
            throw new Error('Storage not available');
          }
          
          // TRY BOTH: New unified format AND legacy individual keys
          let loadedState = createInitialState();
          
          // First try unified format
          const savedData = storageAdapter.get('state');
          if (savedData && validateApplicationState(savedData).valid) {
            loadedState = { ...loadedState, ...savedData };
          } else {
            // Fall back to legacy individual keys (THIS IS THE CRITICAL FIX)
            console.log('🔄 Loading from legacy individual keys...');
            
            const players = storageAdapter.get('players') || [];
            let picks = storageAdapter.get('picks') || [];  
            let keepers = storageAdapter.get('keepers') || [];
            
            // Handle legacy draft structure: { picks: [], keepers: [] }
            const draftData = storageAdapter.get('draft');
            if (draftData && typeof draftData === 'object') {
              if (Array.isArray(draftData.picks)) picks = draftData.picks;
              if (Array.isArray(draftData.keepers)) keepers = draftData.keepers;
            }
            
            const settings = storageAdapter.get('settings') || loadedState.settings;
            const ui = storageAdapter.get('ui') || loadedState.ui;
            
            loadedState = {
              ...loadedState,
              players: Array.isArray(players) ? players : [],
              picks: Array.isArray(picks) ? picks : [],
              keepers: Array.isArray(keepers) ? keepers : [],
              settings: typeof settings === 'object' ? { ...loadedState.settings, ...settings } : loadedState.settings,
              ui: typeof ui === 'object' ? { ...loadedState.ui, ...ui } : loadedState.ui,
              metadata: {
                ...loadedState.metadata,
                lastModified: Date.now(),
                dataSource: 'legacy-migration'
              }
            };
            
            console.log(`✅ Loaded ${players.length} players, ${picks.length} picks from legacy storage`);
          }
          
          set({
            ...loadedState,
            isLoaded: true,
            lastError: null
          });
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Load failed';
          logError('persistence', 'Failed to load state', error);
          set({ 
            lastError: message,
            ...createInitialState(),
            isLoaded: true
          });
        } finally {
          const duration = performance.now() - startTime;
          logPerformance('UnifiedStore', 'load', duration);
          set({ isLoading: false });
        }
      },
      
      reset: () => {
        set({ 
          ...createInitialState(),
          lastError: null,
          isLoaded: true
        });
        
        // Clear storage
        if (storageAdapter.isAvailable()) {
          storageAdapter.remove('state');
        }
        
        // Clear history
        undoStack.length = 0;
        redoStack.length = 0;
        actionHistory.length = 0;
        storeErrors.length = 0;
        performanceEntries.length = 0;
      },

      resetDraft: () => {
        const currentState = get();
        
        // Save current state to undo stack before reset
        const stateToSave = {
          players: deepClone(currentState.players),
          picks: deepClone(currentState.picks),
          keepers: deepClone(currentState.keepers),
          settings: deepClone(currentState.settings),
          ui: deepClone(currentState.ui),
          metadata: deepClone(currentState.metadata)
        };
        undoStack.push(stateToSave);
        
        // Clear redo stack
        redoStack.length = 0;
        
        // Reset draft state while preserving settings
        const resetState = {
          ...currentState,
          players: currentState.players.map(p => ({ ...p, drafted: false })),
          picks: [],
          settings: {
            ...currentState.settings,
            isDraftStarted: false
          }
        };
        
        set(resetState);
        
        // Persist the changes
        if (storageAdapter.isAvailable()) {
          storageAdapter.set('state', resetState);
        }
        
        console.log('✅ Draft reset while preserving league settings');
      },
      
      validate: () => {
        const state = get();
        return validateApplicationState({
          players: state.players,
          picks: state.picks,
          keepers: state.keepers,
          settings: state.settings,
          ui: state.ui,
          metadata: state.metadata
        });
      },
      
      undo: () => {
        if (undoStack.length === 0) return false;
        
        try {
          const currentState = get();
          const prevState = undoStack.pop()!;
          
          // Push current to redo stack
          const currentStateClone: ApplicationState = {
            players: currentState.players,
            picks: currentState.picks, 
            keepers: currentState.keepers,
            settings: currentState.settings,
            ui: currentState.ui,
            metadata: currentState.metadata
          };
          redoStack.push(deepClone(currentStateClone));
          
          // Restore previous state
          set(prevState);
          
          return true;
        } catch (error) {
          console.warn('Undo failed:', error);
          return false;
        }
      },
      
      redo: () => {
        if (redoStack.length === 0) return false;
        
        try {
          const currentState = get();
          const nextState = redoStack.pop()!;
          
          // Push current to undo stack
          const currentStateClone: ApplicationState = {
            players: currentState.players,
            picks: currentState.picks,
            keepers: currentState.keepers, 
            settings: currentState.settings,
            ui: currentState.ui,
            metadata: currentState.metadata
          };
          undoStack.push(deepClone(currentStateClone));
          
          // Restore next state
          set(nextState);
          
          return true;
        } catch (error) {
          console.warn('Redo failed:', error);
          return false;
        }
      },
      
      canUndo: () => undoStack.length > 0,
      canRedo: () => redoStack.length > 0,
      
      getDebugInfo: () => ({
        state: {
          players: get().players,
          picks: get().picks,
          keepers: get().keepers,
          settings: get().settings,
          ui: get().ui,
          metadata: get().metadata
        },
        performance: [...performanceEntries],
        errors: [...storeErrors],
        actions: [...actionHistory],
        storage: {
          size: storageAdapter.bytesUsed(),
          namespace: 'ffb-workspace',
          available: storageAdapter.isAvailable()
        }
      })
    };
    
    return store;
  })
);

// Initialize store on creation
useUnifiedStore.getState().load();