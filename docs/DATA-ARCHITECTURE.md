# FFB Data Architecture Guide

**THE DEFINITIVE GUIDE TO UNIFIED DATA ARCHITECTURE**

## 🎯 Overview

This document defines the **UNIFIED DATA ARCHITECTURE** that governs all data management in the FFB application. This architecture was created to eliminate data synchronization issues, provide consistent state management, and ensure reliable data persistence.

## 🔥 The Core Principle: **ONE STORE TO RULE THEM ALL**

The FFB application uses a **single, unified state management system**. There are no exceptions to this rule.

```
┌─────────────────────────────────────────────────┐
│                UNIFIED STORE                    │
│           src/stores/unified-store.ts           │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Players    │  │    Picks     │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Settings   │  │   UI State   │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│           localStorage: workspace::             │
└─────────────────────────────────────────────────┘
```

## 📁 File Structure

### Core Files
- **`src/stores/unified-store.ts`** - The ONLY data store
- **`src/types/data-contracts.ts`** - TypeScript interfaces for all data
- **`src/utils/state-validation.ts`** - Data validation and repair
- **`src/adapters/storage.js`** - Enhanced localStorage wrapper

### Legacy Compatibility (TEMPORARY)
- **`src/stores/draftStore.ts`** - Compatibility wrapper (DO NOT EXTEND)
- **`src/state/store.js`** - Legacy store (DEPRECATED)

## 🏗️ Data Flow Architecture

### 1. Data Input Flow
```
User Action → Component → useUnifiedStore() → Validation → Storage
```

### 2. Data Output Flow  
```
Storage → useUnifiedStore() → Component → UI Update
```

### 3. Cross-Component Communication
```
Component A → useUnifiedStore().dispatch() → Store → Component B (auto-update)
```

## 📊 Data Structure

### Application State Schema
```typescript
interface ApplicationState {
  players: Player[];           // All player data
  picks: DraftPick[];         // Draft picks made  
  keepers: Keeper[];          // Keeper selections
  settings: LeagueSettings;   // League configuration
  ui: UIState;               // UI-specific state
  metadata: StateMetadata;   // Store metadata
}
```

### Storage Namespace Structure
```
localStorage:
  workspace::state          // Complete unified state
  workspace::state.undo     // Undo history
  workspace::state.redo     // Redo history  
  workspace::state.actionLog // Action history
```

## 🔧 Usage Patterns

### ✅ CORRECT Usage

#### 1. Getting Data
```typescript
// Get the store instance
const store = useUnifiedStore();

// Access data directly
const players = store.players;
const picks = store.picks;
const settings = store.settings;
```

#### 2. Updating Data  
```typescript
const store = useUnifiedStore();

// Use specific methods
store.importPlayers(playerData);
store.draftPlayer(player, teamId, price);
store.updateSettings(newSettings);

// Or use generic dispatch
store.dispatch({ 
  type: 'PLAYERS_IMPORT', 
  payload: playerData 
});
```

#### 3. UI State Management
```typescript
const store = useUnifiedStore();

// UI-specific state
const selectedPlayer = store.ui.selectedPlayer;
const searchTerm = store.ui.searchTerm;

// UI-specific updates
store.selectPlayer(player);
store.setSearchTerm(term);
```

### ❌ INCORRECT Usage

#### 1. Direct localStorage Access
```typescript
// NEVER DO THIS
localStorage.setItem('workspace::players', JSON.stringify(players));
```

#### 2. Multiple State Systems
```typescript
// NEVER DO THIS  
const [players, setPlayers] = useState([]);
const playersContext = useContext(PlayersContext);
```

#### 3. Data Synchronization
```typescript
// NEVER DO THIS
useEffect(() => {
  // Syncing between stores
  setLocalPlayers(storePlayers);
}, [storePlayers]);
```

## 🛠️ Developer Tools Integration

### Data Inspector
- **Location**: Developer Tools → Data Inspector tab
- **Purpose**: Real-time visualization of complete application state
- **Features**: Tree navigation, filtering, search, size analysis

### Performance Monitor  
- **Location**: Developer Tools → Performance Monitor tab
- **Purpose**: Track store operations and render performance
- **Features**: Real-time metrics, operation timeline, slow operation detection

### Storage Viewer
- **Location**: Developer Tools → Storage Viewer tab  
- **Purpose**: localStorage management and integrity checking
- **Features**: Namespace analysis, corruption detection, repair tools

## 🔄 Migration Guide

### From Legacy Patterns

#### Step 1: Replace Store Hook
```typescript
// OLD
import { useDraftStore } from '../stores/draftStore';
const { players, dispatch } = useDraftStore();

// NEW  
import { useUnifiedStore } from '../stores/unified-store';
const store = useUnifiedStore();
```

#### Step 2: Update Data Access
```typescript
// OLD
const players = store.players;
dispatch({ type: 'IMPORT_PLAYERS', payload: data });

// NEW
const players = store.players;  
store.importPlayers(data);
```

#### Step 3: Handle UI State
```typescript
// OLD
const [selectedPlayer, setSelectedPlayer] = useState(null);

// NEW
const selectedPlayer = store.ui.selectedPlayer;
store.selectPlayer(player);
```

## 🧪 Testing Data Operations

### Unit Tests
```typescript
// Test store operations
const store = useUnifiedStore.getState();
store.importPlayers(testData);
expect(store.players).toHaveLength(testData.length);
```

### Integration Tests  
```typescript
// Test component integration
render(<PlayerSearchWidget />);
const store = useUnifiedStore.getState();
store.importPlayers(mockPlayers);
expect(screen.getByText(mockPlayers[0].name)).toBeInTheDocument();
```

### Performance Tests
```typescript
// Test store performance
const startTime = performance.now();
store.importPlayers(largeDataset);  
const duration = performance.now() - startTime;
expect(duration).toBeLessThan(100); // 100ms threshold
```

## 🚨 Error Handling

### Validation Errors
```typescript
// Store automatically validates data
try {
  store.importPlayers(invalidData);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Storage Errors
```typescript
// Storage operations include error recovery
const result = await store.save();
if (store.lastError) {
  console.error('Save failed:', store.lastError);
}
```

### Corruption Recovery
```typescript
// Store automatically repairs corrupted data
const validation = store.validate();
if (!validation.valid) {
  console.warn('Data issues detected:', validation.errors);
  // Auto-repair happens automatically
}
```

## 📈 Performance Guidelines

### Do's
- ✅ Use specific store methods when available
- ✅ Batch multiple operations when possible  
- ✅ Monitor performance with developer tools
- ✅ Use React.memo for expensive components

### Don'ts  
- ❌ Access store in render loops
- ❌ Create unnecessary subscriptions
- ❌ Mutate store state directly
- ❌ Perform synchronous heavy operations in store

## 🔍 Debugging Guide

### Common Issues

#### "Data not showing in widgets"
1. Check if component uses `useUnifiedStore()`
2. Verify data exists in Data Inspector
3. Ensure component subscribes to correct store slice

#### "Data not persisting"  
1. Check browser localStorage in DevTools
2. Look for `workspace::state` key
3. Verify no storage quota errors in console

#### "Performance issues"
1. Use Performance Monitor to identify slow operations
2. Check for unnecessary re-renders
3. Optimize component memoization

### Debug Commands
```typescript
// Get complete store state
const debug = useUnifiedStore.getState().getDebugInfo();
console.log('Store debug info:', debug);

// Validate current state
const validation = useUnifiedStore.getState().validate();
console.log('State validation:', validation);

// Monitor performance
const metrics = useUnifiedStore.getState().getDebugInfo().performance;
console.log('Performance metrics:', metrics);
```

## 🎯 Best Practices

### Component Design
- Keep components focused on UI concerns
- Use store for shared state, local state for UI-only concerns
- Implement proper loading and error states
- Use TypeScript for all data interfaces

### Data Management
- Validate all data at boundaries
- Use specific action creators when possible
- Implement optimistic updates carefully
- Handle offline scenarios gracefully

### Performance  
- Monitor store operation times
- Use React DevTools Profiler
- Implement virtual scrolling for large lists
- Batch state updates when possible

## 📝 Changelog

### Version 2.0.0 (Current)
- ✅ Unified store implementation
- ✅ Legacy compatibility layer
- ✅ Enhanced developer tools
- ✅ Comprehensive validation system
- ✅ Performance monitoring

### Version 1.0.0 (Legacy)
- ❌ Dual store system (removed)
- ❌ Manual data synchronization (eliminated)
- ❌ Fragmented localStorage (consolidated)

---

## 🚨 REMEMBER THE COMMANDMENTS

**There is ONE store. There is ONE way. There is ONE source of truth.**

All data flows through the unified store. No exceptions. No compromises. No sync issues.

**END OF DATA ARCHITECTURE DOCUMENT**