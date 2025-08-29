# React Component Documentation

This document provides comprehensive documentation for all React components in the FFB Fantasy Football Draft Helper application following the React migration completion.

## Architecture Overview

The React component architecture follows a hybrid island pattern where React components are mounted within the existing vanilla JavaScript application. Components communicate with the legacy state system through a bridge pattern using Zustand for React state management.

## Component Categories

### Layout Components

#### `TopAppBar`
**Location:** `src/components/layout/TopAppBar.tsx`

Main application header with navigation and user controls.

**Props:**
- None (controlled through internal state)

**Features:**
- Professional gradient styling
- Responsive design
- Theme integration

**Usage:**
```tsx
import TopAppBar from '../components/layout/TopAppBar';

<TopAppBar />
```

#### `MainCanvas`
**Location:** `src/components/layout/MainCanvas.tsx`

Primary content area container that hosts widgets and main application views.

**Props:**
- `children: ReactNode` - Content to render

**Features:**
- Full-height layout management
- Widget grid container
- Responsive breakpoints

**Usage:**
```tsx
import MainCanvas from '../components/layout/MainCanvas';

<MainCanvas>
  {/* Widget content */}
</MainCanvas>
```

#### `LeftRail`
**Location:** `src/components/layout/LeftRail.tsx`

Sidebar navigation and secondary controls.

**Props:**
- `isCollapsed?: boolean` - Whether the rail is collapsed

**Features:**
- Collapsible navigation
- Tool palette
- Quick actions

**Usage:**
```tsx
import LeftRail from '../components/layout/LeftRail';

<LeftRail isCollapsed={false} />
```

### UI Components

#### `Button`
**Location:** `src/components/ui/Button.tsx`

Professional button component with multiple variants and states.

**Props:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}
```

**Usage:**
```tsx
import { Button } from '../components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Save Draft
</Button>

<Button variant="outline" icon={<SearchIcon />} loading={isSearching}>
  Search Players
</Button>
```

#### `Badge`
**Location:** `src/components/ui/Badge.tsx`

Status and category indicators with themed styling.

**Props:**
```tsx
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
}
```

**Usage:**
```tsx
import { Badge } from '../components/ui';

<Badge variant="success">Available</Badge>
<Badge variant="danger">Injured</Badge>
```

#### `Toast`
**Location:** `src/components/ui/Toast.tsx`

Notification system for user feedback and alerts.

**Props:**
```tsx
interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}
```

**Usage:**
```tsx
import { Toast } from '../components/ui';

<Toast 
  type="success" 
  title="Player Drafted" 
  message="Josh Allen added to your roster"
  duration={3000}
/>
```

#### `ErrorBoundary`
**Location:** `src/components/ui/ErrorBoundary.tsx`

React error boundary for graceful error handling.

**Props:**
```tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

**Usage:**
```tsx
import { ErrorBoundary } from '../components/ui';

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <SomeComponent />
</ErrorBoundary>
```

#### `LoadingState`
**Location:** `src/components/ui/LoadingState.tsx`

Loading indicators and skeleton screens.

**Props:**
```tsx
interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}
```

**Usage:**
```tsx
import { LoadingState } from '../components/ui';

<LoadingState type="skeleton" size="lg" />
<LoadingState type="spinner" message="Loading players..." />
```

### Widget Components

All widget components use the `WidgetContainer` wrapper and follow consistent patterns for state management and styling.

#### `WidgetContainer`
**Location:** `src/components/widgets/WidgetContainer.tsx`

Universal wrapper for all dashboard widgets providing consistent styling and behavior.

**Props:**
```tsx
interface WidgetContainerProps {
  title: string;
  widgetId: string;
  children: ReactNode;
  actions?: ReactNode;
  isLinked?: boolean;
  linkColor?: string;
  onResize?: (size: { width: number; height: number }) => void;
}
```

**Features:**
- Consistent professional styling
- Hover and focus states
- Resize handling
- Widget linking indicators
- Accessibility support

**Usage:**
```tsx
import WidgetContainer from './WidgetContainer';

<WidgetContainer title="Player Search" widgetId="search">
  {/* Widget content */}
</WidgetContainer>
```

#### `PlayerSearchWidget`
**Location:** `src/components/widgets/PlayerSearchWidget.tsx`

Advanced player search with fuzzy matching, filters, and keyboard navigation.

**Props:**
- None (connects to store automatically)

**Features:**
- Fuzzy search with highlighting
- Position filtering
- Drafted player toggle
- Keyboard navigation (↑↓ for selection, Enter to select)
- Performance optimized with debouncing
- Professional table layout
- Injury status indicators
- VBD value highlighting

**State Bridge:**
- Connects to `useDraftStore()` for player data
- Uses `useSelectedPlayer()` hook for selection state

**Usage:**
```tsx
import PlayerSearchWidget from '../components/widgets/PlayerSearchWidget';

<PlayerSearchWidget />
```

#### `VBDScatterWidget`
**Location:** `src/components/widgets/VBDScatterWidget.tsx`

Interactive scatter plot for Value-Based Drafting analysis.

**Props:**
- None (connects to store automatically)

**Features:**
- Professional D3.js-based visualization
- Interactive zoom and pan
- Player selection integration
- Position-based color coding
- Responsive design
- Performance optimized rendering
- Tooltips with player details

**Usage:**
```tsx
import VBDScatterWidget from '../components/widgets/VBDScatterWidget';

<VBDScatterWidget />
```

#### `BudgetTrackerWidget`
**Location:** `src/components/widgets/BudgetTrackerWidget.tsx`

Real-time budget and salary cap tracking.

**Props:**
- None (connects to store automatically)

**Features:**
- Live budget calculations
- Remaining budget display
- Average cost per remaining pick
- Budget constraint warnings
- Professional financial styling

**Usage:**
```tsx
import BudgetTrackerWidget from '../components/widgets/BudgetTrackerWidget';

<BudgetTrackerWidget />
```

#### `DraftEntryWidget`
**Location:** `src/components/widgets/DraftEntryWidget.tsx`

Primary interface for draft pick entry and management.

**Props:**
- None (connects to store automatically)

**Features:**
- Player selection integration
- Salary entry with validation
- Quick draft actions
- Undo/redo support
- Keyboard shortcuts

**Usage:**
```tsx
import DraftEntryWidget from '../components/widgets/DraftEntryWidget';

<DraftEntryWidget />
```

#### `DraftLedgerWidget`
**Location:** `src/components/widgets/DraftLedgerWidget.tsx`

Historical draft pick tracking and management.

**Props:**
- None (connects to store automatically)

**Features:**
- Pick history display
- Sortable columns
- Pick editing capabilities
- Export functionality

**Usage:**
```tsx
import DraftLedgerWidget from '../components/widgets/DraftLedgerWidget';

<DraftLedgerWidget />
```

#### `RosterPanelWidget`
**Location:** `src/components/widgets/RosterPanelWidget.tsx`

Current roster display and management.

**Props:**
- None (connects to store automatically)

**Features:**
- Position-based roster organization
- Salary cap tracking
- Player details on hover
- Roster validation

**Usage:**
```tsx
import RosterPanelWidget from '../components/widgets/RosterPanelWidget';

<RosterPanelWidget />
```

#### `PlayerAnalysisWidget`
**Location:** `src/components/widgets/PlayerAnalysisWidget.tsx`

Detailed player analytics and comparison tools.

**Props:**
- None (connects to store automatically)

**Features:**
- Selected player details
- VBD calculations
- Market data integration
- Injury status tracking
- Professional data presentation

**Usage:**
```tsx
import PlayerAnalysisWidget from '../components/widgets/PlayerAnalysisWidget';

<PlayerAnalysisWidget />
```

#### `WidgetGrid`
**Location:** `src/components/widgets/WidgetGrid.tsx`

Grid layout manager for dashboard widgets.

**Props:**
```tsx
interface WidgetGridProps {
  widgets: WidgetConfig[];
  layout?: GridLayout;
  onLayoutChange?: (layout: GridLayout) => void;
}
```

**Features:**
- Drag and drop reordering
- Responsive breakpoints
- Widget state persistence
- Layout optimization

**Usage:**
```tsx
import WidgetGrid from '../components/widgets/WidgetGrid';

<WidgetGrid 
  widgets={widgetConfigs} 
  onLayoutChange={handleLayoutChange}
/>
```

## State Management Bridge

### `useDraftStore`
**Location:** `src/stores/draftStore.ts`

Primary Zustand store that bridges React components with the vanilla JavaScript DraftStore.

**Key Features:**
- Automatic synchronization with legacy state
- React-optimized state updates
- Action dispatching to legacy store
- UI-specific state management

**Usage:**
```tsx
import { useDraftStore } from '../stores/draftStore';

const MyComponent = () => {
  const { players, dispatch, selectedPlayer } = useDraftStore();
  
  const handleAction = () => {
    dispatch({ type: 'DRAFT_PLAYER', payload: player });
  };
  
  return (
    // Component JSX
  );
};
```

### Custom Hooks

#### `useSelectedPlayer`
Convenience hook for accessing selected player state.

**Usage:**
```tsx
import { useSelectedPlayer } from '../stores/draftStore';

const selectedPlayer = useSelectedPlayer();
```

## Styling System

### Theme Integration

All components use the `theme()` helper function for consistent styling:

```tsx
import { theme } from "../../utils/styledHelpers";

const StyledComponent = styled.div`
  color: ${props => theme('colors.text1')};
  font-size: ${props => theme('typography.fontSize.base')};
  padding: ${props => theme('spacing.md')};
`;
```

### Professional Aesthetics

Components follow the "Robinhood Legend" design system with:
- Professional gradients and shadows
- Consistent hover and focus states
- Subtle animations and transitions
- Data-optimized typography
- Accessibility-compliant color contrasts

## Performance Optimizations

### Memoization
- All components use `React.memo()` for render optimization
- Custom hooks like `useMemoizedCalculation` for expensive operations
- Debounced inputs for search and filtering

### Virtualization
- Large data sets use virtual scrolling
- Lazy loading for off-screen components
- Progressive enhancement patterns

## Accessibility Features

### ARIA Support
- Complete ARIA labeling
- Keyboard navigation support
- Screen reader optimizations
- Focus management

### Keyboard Navigation
- Full keyboard access to all features
- Standard shortcuts (Arrow keys, Enter, Escape)
- Focus indicators and management

## Development Guidelines

### Adding New Components
1. Follow the established folder structure
2. Use TypeScript for all new components  
3. Implement proper error boundaries
4. Include accessibility attributes
5. Add performance monitoring hooks
6. Follow the professional styling patterns

### Testing Considerations
- Components should work with the hybrid architecture
- State bridge functionality must be validated
- Performance under load should be monitored
- Accessibility compliance should be verified