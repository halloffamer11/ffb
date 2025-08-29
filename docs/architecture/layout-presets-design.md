# Layout Presets Design Document

## Overview

The Layout Presets system provides three professional dashboard configurations optimized for different fantasy football workflow stages. Each preset is designed with trading platform aesthetics and strategic widget placement to maximize efficiency for specific user tasks.

## Design Philosophy

### Professional Trading Platform Aesthetic
- **Clean Visual Hierarchy**: Clear primary/secondary widget relationships
- **Data Density Optimization**: Maximize information density without overwhelming users  
- **Responsive Excellence**: Maintain usability across all screen sizes
- **Performance Focus**: Smooth transitions and minimal re-renders

### Workflow-Centric Design
Each preset optimizes screen real estate for specific user goals:
- **Pre-draft**: Research and analysis focus
- **Nomination**: Real-time decision making
- **Player Analytics**: Deep data exploration

## The Three Presets

### 1. Pre-Draft Research Layout (Shortcut: 1)
**Icon:** 🔍 **Color:** Blue (#3B82F6)

**Workflow:** Player research, value analysis, tier identification
**Use Case:** Before draft begins - evaluating player values and building draft strategy

**Widget Hierarchy:**
- **Primary**: PlayerSearch (prominent), VBDScatter (large), PlayerAnalysis
- **Secondary**: BudgetTracker (compact preview), RosterPanel (minimized)  
- **Support**: DraftEntry (compact), DraftLedger (preview)

**Layout Strategy:**
```
┌─────────────────┬────────┐
│ PlayerSearch    │Analysis│  <- Top row: Research tools
├─────────────────┴────────┤
│ VBDScatter (dominant)    │  <- Center: Large visualization
│                          │
├────────┬─────────┬───────┤
│ Draft  │ Ledger  │Budget │  <- Bottom: Support tools (compact)
│ Entry  │         │Roster │
└────────┴─────────┴───────┘
```

### 2. Active Nomination Layout (Shortcut: 2)
**Icon:** ⚡ **Color:** Red (#EF4444)

**Workflow:** Real-time bidding, budget management, roster building
**Use Case:** During active auction - making split-second drafting decisions

**Widget Hierarchy:**
- **Primary**: DraftEntry (prominent), BudgetTracker (critical), RosterPanel
- **Secondary**: PlayerSearch (quick lookups), VBDScatter (reference)
- **Support**: PlayerAnalysis, DraftLedger (context)

**Layout Strategy:**
```
┌──────────────┬──────────┐
│ DraftEntry   │ Budget   │  <- Top row: Action tools
├──────┬───────┼──────────┤
│Roster│Search │VBDScatter│  <- Middle: Decision support
│      │       │(compact) │
├──────┴───────┼──────────┤
│ PlayerAnalysis│ Ledger   │  <- Bottom: Context
└───────────────┴──────────┘
```

### 3. Player Analytics Layout (Shortcut: 3)
**Icon:** 📊 **Color:** Purple (#8B5CF6)

**Workflow:** Deep analysis, data visualization, player insights
**Use Case:** In-depth player evaluation - statistical analysis and comparisons

**Widget Hierarchy:**
- **Primary**: VBDScatter (dominant), PlayerAnalysis (large)
- **Secondary**: PlayerSearch (player lookups)
- **Minimal**: All draft tools (compact, supporting only)

**Layout Strategy:**
```
┌─────────────────────────┬───────┐
│                         │ Player│
│   VBDScatter            │ Analy-│  <- VBD chart dominates
│   (massive)             │ sis   │
│                         │       │
├─────────────┬───────────┼───────┤
│PlayerSearch │Draft Tools│       │  <- Bottom: Minimal support
│             │(compact)  │       │
└─────────────┴───────────┴───────┘
```

## Technical Architecture

### Core Components

#### 1. Layout Preset Definitions (`src/utils/layoutPresets.ts`)
- **Preset Metadata**: Name, description, icon, workflow, keyboard shortcut
- **Layout Configurations**: Grid positions and dimensions for lg/md/sm breakpoints
- **Professional Color Schemes**: Each preset has distinct visual identity
- **Validation Utilities**: Type-safe preset access and validation

#### 2. Preset Management Hook (`src/hooks/useLayoutPresets.ts`)
- **State Management**: Current preset, history tracking, persistence
- **Keyboard Shortcuts**: Focus-guarded hotkeys (1, 2, 3)
- **Storage Integration**: Automatic preset preference persistence
- **Focus Guard**: Prevents accidental activation during text input

#### 3. Preset Selector UI (`src/components/ui/PresetSelector.tsx`)
- **Professional Dropdown**: Trading platform style with depth and blur effects
- **Rich Preview**: Shows workflow tags, descriptions, and visual hierarchy
- **Accessibility**: Full keyboard navigation and screen reader support
- **Visual Feedback**: Active states, hover effects, professional shadows

#### 4. Grid Integration (`src/components/widgets/WidgetGrid.tsx`)
- **Preset Application**: Seamless switching between preset layouts
- **Custom Layout Preservation**: Maintains user modifications per preset
- **Reset Functionality**: Restore preset defaults when needed
- **Storage Coordination**: Manages custom vs preset layout states

### Focus Guard System

Prevents keyboard shortcuts from firing during text input:

```typescript
const isFocusGuarded = (): boolean => {
  const activeElement = document.activeElement;
  
  // Guard against form inputs
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
  const hasTextRole = ['textbox', 'searchbox', 'combobox'].includes(role);
  
  // Context-aware guarding
  const isInSearchWidget = activeElement.closest('[data-widget="search"]') !== null;
  const isInForm = activeElement.closest('form') !== null;
  
  return isInput || isContentEditable || hasTextRole || isInSearchWidget || isInForm;
};
```

### Responsive Grid System

Uses react-grid-layout with optimized breakpoints:
- **lg**: 24 columns (1200px+) - Full desktop experience
- **md**: 20 columns (996px+) - Laptop/tablet landscape  
- **sm**: 16 columns (768px+) - Tablet portrait/mobile landscape

Each preset maintains professional proportions across all breakpoints.

## Widget Sizing Philosophy

### Content-Aware Dimensions
Each widget type has optimal dimensions based on content requirements:

```typescript
// Example: PlayerSearch optimal sizing
const searchHeight = 
  widgetHeaderHeight +           // 48px
  searchInputHeight +            // 44px  
  filterRowHeight +              // 32px
  tableHeaderHeight +            // 40px
  (8 * tableRowHeight) +         // 8 rows * 32px = 256px
  widgetPadding +                // 24px
  scrollbarWidth;                // 12px
  // Total: ~456px = 16 grid units
```

### Professional Proportions
- **Golden Ratio**: 1:1.618 used for key widget relationships
- **Rule of Thirds**: Primary widgets occupy ~2/3 of screen space
- **Visual Weight**: Larger widgets for primary workflow tasks
- **Breathing Room**: Adequate spacing prevents cognitive overload

### Responsive Scaling
```typescript
const BREAKPOINT_MULTIPLIERS: Record<BreakpointKey, number> = {
  lg: 1.0,    // Full size on large screens
  md: 0.85,   // Slightly compressed on medium
  sm: 0.7     // Compact on small screens
};
```

## User Experience Design

### Workflow Optimization

#### Pre-Draft Research Flow
1. **Player Discovery** → PlayerSearch (prominent position)
2. **Value Analysis** → VBDScatter (large visualization)  
3. **Deep Dive** → PlayerAnalysis (detailed stats)
4. **Draft Prep** → Budget/Roster (preview mode)

#### Active Nomination Flow  
1. **Nomination Entry** → DraftEntry (immediate access)
2. **Budget Check** → BudgetTracker (critical visibility)
3. **Roster Impact** → RosterPanel (lineup assessment)
4. **Quick Research** → Search/VBD (supporting reference)

#### Player Analytics Flow
1. **Data Visualization** → VBDScatter (dominates screen)
2. **Statistical Analysis** → PlayerAnalysis (detailed metrics)  
3. **Player Lookup** → PlayerSearch (research support)
4. **Context Check** → Draft tools (minimal presence)

### Cognitive Load Management

- **Progressive Disclosure**: Complex features revealed as needed
- **Consistent Patterns**: Similar widgets behave predictably across presets
- **Visual Anchoring**: Key widgets maintain consistent relative positions  
- **Information Hierarchy**: Most important data gets prime screen real estate

### Accessibility Features

- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Comprehensive ARIA labels and roles
- **High Contrast**: Professional color schemes meet WCAG standards
- **Focus Management**: Clear visual focus indicators
- **Error Prevention**: Focus guard prevents accidental actions

## Performance Considerations

### Optimized Re-renders
- **Memoized Components**: Prevent unnecessary widget re-renders
- **Lazy Layout Application**: Only apply preset changes when needed
- **Efficient Storage**: Minimal localStorage footprint
- **Transition Smoothness**: Hardware-accelerated CSS transforms

### Memory Management
- **Event Cleanup**: Proper keyboard listener disposal
- **Storage Efficiency**: Compact preset definitions
- **Component Lifecycle**: Proper mounting/unmounting
- **Reference Management**: Avoid memory leaks in hooks

## Future Enhancements

### Phase 2 Features
- **Custom Preset Creation**: Allow users to save personalized layouts
- **Preset Templates**: Industry-specific templates (redraft, dynasty, etc.)
- **Advanced Animations**: Smooth widget transitions during preset switches
- **Preset Sharing**: Export/import preset configurations

### Advanced Workflow Features  
- **Context-Aware Switching**: Auto-suggest presets based on draft phase
- **Machine Learning**: Optimize layouts based on user behavior patterns
- **Multi-Monitor Support**: Preset configurations for extended displays
- **Mobile-First Presets**: Touch-optimized layouts for mobile users

## Implementation Guidelines

### Adding New Presets
1. Define preset in `layoutPresets.ts` with proper TypeScript types
2. Add metadata entry with visual identity (color, icon, workflow)
3. Create responsive grid layouts for all breakpoints
4. Test across all screen sizes and interaction patterns
5. Update validation documentation and test cases

### Modifying Existing Presets
1. Consider workflow impact - will changes improve user efficiency?
2. Maintain visual consistency with professional aesthetic
3. Test responsive behavior across all breakpoints  
4. Validate with real user scenarios and edge cases
5. Update documentation and validation criteria

### Best Practices
- **User-Centric Design**: Always optimize for user workflow efficiency
- **Professional Standards**: Maintain trading platform visual quality
- **Performance First**: Ensure smooth interactions under load
- **Accessibility Always**: Design inclusively from the start
- **Test Thoroughly**: Validate across devices, browsers, and use cases