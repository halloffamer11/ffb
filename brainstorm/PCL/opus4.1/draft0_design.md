# Draft 0 Design - Fantasy Football Auction Draft Helper

## System Architecture Overview

### Deployment Architecture
**MVP Phase: Pure Client-Side Application**
- Static HTML/CSS/JavaScript application
- No backend server required initially
- Browser localStorage for data persistence
- Can be hosted on any static file server (GitHub Pages, Netlify, Vercel)

**Production Phase: Full-Stack Application**
- Frontend remains largely unchanged
- Lightweight backend API for user accounts and data sync
- Payment processing integration
- Cloud hosting (AWS, Vercel, or similar)

## Core Technical Components

### Frontend Architecture

#### Technology Stack
- **Framework**: Vanilla JavaScript or lightweight framework (Vue.js/Alpine.js)
- **Styling**: Tailwind CSS for rapid UI development
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: Browser localStorage + in-memory state

#### Application Structure
```
frontend/
├── index.html              # Single page application entry
├── src/
│   ├── core/              # Business logic (VBD calculations)
│   │   ├── vbd.js         # Value-based drafting algorithms
│   │   ├── projections.js # Player projection handling
│   │   ├── scoring.js     # Fantasy point calculations
│   │   └── tiers.js       # Position tier analysis
│   ├── data/              # Data management layer
│   │   ├── storage.js     # localStorage wrapper
│   │   ├── import.js      # CSV parsing and import
│   │   └── schema.js      # Data structure definitions
│   ├── ui/                # User interface components
│   │   ├── search.js      # Fuzzy search implementation
│   │   ├── dashboard.js   # Main draft interface
│   │   ├── settings.js    # League configuration
│   │   └── analysis.js    # Player analysis display
│   └── app.js            # Application initialization
├── styles/
│   └── main.css          # Tailwind directives
└── data/
    └── golden/           # Test datasets (CSV files)
```

### Data Architecture

#### Core Data Models

**Player Model**
```javascript
{
  id: string,
  name: string,
  position: string,
  team: string,
  byeWeek: number,
  age: number,
  projections: {
    passingYards: number,
    passingTDs: number,
    rushingYards: number,
    rushingTDs: number,
    receptions: number,
    receivingYards: number,
    receivingTDs: number,
    // ... other stats
  },
  marketData: {
    adp: number,
    auctionValue: number,
    rankings: Map<source, rank>
  },
  calculated: {
    projectedPoints: number,
    vbdScore: number,
    positionRank: number,
    tier: number
  }
}
```

**League Settings Model**
```javascript
{
  teams: number,
  budget: number,
  scoring: {
    type: 'PPR' | 'HALF_PPR' | 'STANDARD',
    customRules: Map<stat, points>
  },
  roster: {
    QB: number,
    RB: number,
    WR: number,
    TE: number,
    FLEX: number,
    K: number,
    DST: number,
    BENCH: number
  },
  keepers: Array<{playerId, teamId, cost}>
}
```

**Draft State Model**
```javascript
{
  draftedPlayers: Array<{
    playerId: string,
    teamId: string,
    price: number,
    timestamp: Date
  }>,
  teams: Map<teamId, {
    name: string,
    owner: string,
    budget: number,
    roster: Array<playerId>
  }>,
  currentNomination: playerId | null,
  history: Array<draftEvent>
}
```

### Core Algorithms

#### Value-Based Drafting (VBD)
1. Calculate projected fantasy points for each player
2. Determine replacement level at each position
3. Calculate Points Above Replacement (PAR)
4. Normalize across positions for global VBD
5. Adjust for position scarcity and roster needs

#### Fuzzy Search Implementation
- Levenshtein distance for typo tolerance
- Soundex for phonetic matching
- Trigram similarity for partial matches
- Pre-built search index for performance

#### Tier Calculation
- K-means clustering on VBD scores within position
- Dynamic tier adjustment as players are drafted
- Visual representation of tier breaks

### User Interface Design

#### Layout Structure
```
┌─────────────────────────────────────────────────┐
│                  Header/Navigation               │
├──────────────┬──────────────────────┬───────────┤
│              │                      │           │
│   Team/      │   Player Analysis    │  Position │
│   Budget     │   (Main Focus)       │  Tiers    │
│   Panel      │                      │           │
│              │   - Player Stats     │           │
│              │   - VBD Score        │           │
│              │   - Value Range      │           │
│              │   - Bid Guidance     │           │
│              │                      │           │
├──────────────┴──────────────────────┴───────────┤
│            My Roster & Remaining Needs          │
└─────────────────────────────────────────────────┘
```

#### Key UI Components
- **Search Bar**: Omnipresent, auto-focused, fuzzy matching
- **Player Card**: Comprehensive analysis in single view
- **Value Indicator**: Color gradient (green to red)
- **Budget Tracker**: Always visible remaining funds
- **Position Scarcity**: Visual tier representation

### Data Flow

1. **Pre-Draft Setup**
   - User configures league settings
   - Import/edit player projections
   - System calculates initial VBD scores

2. **During Draft**
   - User searches for nominated player
   - System displays analysis instantly
   - User makes bid decision
   - User logs result
   - System recalculates all metrics
   - Updates display in <500ms

3. **Post-Draft**
   - Export draft results
   - Generate team summary
   - Save for future reference

### Storage Strategy

#### localStorage Structure
```javascript
{
  'ffd_league_settings': { /* League configuration */ },
  'ffd_player_data': { /* Master player list */ },
  'ffd_draft_state': { /* Current draft progress */ },
  'ffd_user_prefs': { /* UI preferences */ },
  'ffd_history': [ /* Previous drafts */ ]
}
```

#### Data Persistence
- Auto-save after each draft action
- Versioned data format for migrations
- Export/import capability for backup
- Clear separation of config vs. draft data

### Performance Optimizations

- **Virtual scrolling** for large player lists
- **Memoized calculations** for VBD scores
- **Debounced search** input
- **Indexed player data** for instant lookups
- **Lazy loading** of historical data
- **Web Workers** for heavy calculations (if needed)

### Security Considerations

- No sensitive data in MVP (no user accounts)
- Input sanitization for CSV imports
- XSS prevention in player names/notes
- Future: JWT auth for user accounts
- Future: Encrypted payment tokens

### Testing Strategy

- Unit tests for VBD calculations
- Integration tests for data import/export
- Manual testing checklist for draft flow
- Golden dataset validation
- Browser compatibility testing

### Future Architecture Considerations

#### Backend API (Post-MVP)
```
/api/
  /auth/          # User authentication
  /users/         # User management
  /leagues/       # League data
  /drafts/        # Draft history
  /players/       # Player data updates
  /payments/      # Stripe integration
```

#### LLM Integration
- Separate microservice for AI features
- Websocket for real-time suggestions
- Caching layer for common queries
- Rate limiting for API costs

#### Mobile Optimization
- Progressive Web App (PWA)
- Touch-optimized controls
- Responsive breakpoints
- Reduced data transfer