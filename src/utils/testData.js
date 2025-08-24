/**
 * Test Data Generator for PlayerSearchWidget Validation
 * Creates comprehensive test dataset for HITL validation
 */

/**
 * Generate test players for validation
 * @param {number} count - Number of players to generate
 * @returns {Array} Array of player objects
 */
export function generateTestPlayers(count = 300) {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  const teams = [
    'KC', 'BUF', 'MIA', 'NE', 'CIN', 'BAL', 'PIT', 'CLE',
    'HOU', 'IND', 'TEN', 'JAX', 'DAL', 'NYG', 'PHI', 'WAS',
    'GB', 'MIN', 'CHI', 'DET', 'ATL', 'NO', 'TB', 'CAR',
    'SF', 'LAR', 'SEA', 'ARI', 'DEN', 'LV', 'LAC', 'FA'
  ];
  
  const firstNames = [
    'Aaron', 'Baker', 'Calvin', 'David', 'Ezra', 'Frank', 'George', 'Henry',
    'Isaac', 'Jack', 'Kevin', 'Liam', 'Marcus', 'Nathan', 'Oscar', 'Paul',
    'Quincy', 'Robert', 'Samuel', 'Thomas', 'Ulysses', 'Victor', 'William', 'Xavier',
    'Yannick', 'Zachary', 'Alexander', 'Benjamin', 'Christopher', 'Daniel', 'Edward', 'Felix'
  ];
  
  const lastNames = [
    'Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris',
    'Jackson', 'King', 'Lopez', 'Miller', 'Nelson', 'Parker', 'Quinn', 'Rogers',
    'Smith', 'Taylor', 'Wilson', 'Young', 'Adams', 'Baker', 'Carter', 'Edwards',
    'Fisher', 'Green', 'Hall', 'Johnson', 'Lewis', 'Martin', 'Robinson', 'Thompson'
  ];

  // Create star players for testing specific scenarios
  const starPlayers = [
    {
      id: 1,
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      points: 380.5,
      vbd: 120.8,
      injuryStatus: 0,
      adp: 12,
      drafted: false
    },
    {
      id: 2,
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      points: 320.2,
      vbd: 110.5,
      injuryStatus: 0,
      adp: 3,
      drafted: false
    },
    {
      id: 3,
      name: 'Tyreek Hill',
      position: 'WR',
      team: 'MIA',
      points: 280.8,
      vbd: 85.3,
      injuryStatus: 1, // Q
      adp: 8,
      drafted: false
    },
    {
      id: 4,
      name: 'Travis Kelce',
      position: 'TE',
      team: 'KC',
      points: 220.1,
      vbd: 75.2,
      injuryStatus: 0,
      adp: 15,
      drafted: false
    },
    {
      id: 5,
      name: 'Justin Jefferson',
      position: 'WR',
      team: 'MIN',
      points: 300.4,
      vbd: 95.7,
      injuryStatus: 0,
      adp: 5,
      drafted: false
    },
    // Test fuzzy matching
    {
      id: 6,
      name: 'C.J. Stroud',
      position: 'QB',
      team: 'HOU',
      points: 340.1,
      vbd: 80.4,
      injuryStatus: 0,
      adp: 45,
      drafted: false
    },
    {
      id: 7,
      name: 'C.J. Fiedorowicz',
      position: 'TE',
      team: 'FA',
      points: 120.3,
      vbd: -5.2,
      injuryStatus: 4, // IR
      adp: 200,
      drafted: false
    },
    // Test drafted status
    {
      id: 8,
      name: 'Austin Ekeler',
      position: 'RB',
      team: 'LAC',
      points: 260.7,
      vbd: 50.1,
      injuryStatus: 0,
      adp: 25,
      drafted: true
    },
    // Test injury statuses
    {
      id: 9,
      name: 'Stefon Diggs',
      position: 'WR',
      team: 'BUF',
      points: 270.3,
      vbd: 75.8,
      injuryStatus: 2, // D
      adp: 18,
      drafted: false
    },
    {
      id: 10,
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      points: 370.9,
      vbd: 110.2,
      injuryStatus: 0,
      adp: 20,
      drafted: false
    },
    {
      id: 11,
      name: 'Saquon Barkley',
      position: 'RB',
      team: 'NYG',
      points: 240.5,
      vbd: 60.3,
      injuryStatus: 3, // O
      adp: 35,
      drafted: false
    },
    {
      id: 12,
      name: 'DeAndre Hopkins',
      position: 'WR',
      team: 'ARI',
      points: 190.8,
      vbd: 30.1,
      injuryStatus: 5, // PUP
      adp: 65,
      drafted: false
    }
  ];

  const players = [...starPlayers];

  // Generate additional random players
  for (let i = starPlayers.length + 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];
    
    // Position-based point ranges for realism
    const pointRanges = {
      QB: { min: 200, max: 380 },
      RB: { min: 100, max: 320 },
      WR: { min: 80, max: 300 },
      TE: { min: 60, max: 220 },
      K: { min: 80, max: 140 },
      DST: { min: 60, max: 180 }
    };
    
    const range = pointRanges[position];
    const points = Math.random() * (range.max - range.min) + range.min;
    const vbd = Math.random() * 120 - 30; // Range from -30 to 90
    
    players.push({
      id: i,
      name: `${firstName} ${lastName}`,
      position: position,
      team: team,
      points: Math.round(points * 10) / 10, // 1 decimal place
      vbd: Math.round(vbd * 10) / 10,
      injuryStatus: Math.random() > 0.85 ? Math.floor(Math.random() * 5) + 1 : 0,
      drafted: Math.random() > 0.8, // ~20% drafted
      adp: i + Math.floor(Math.random() * 50) - 25 // Varied ADP
    });
  }

  return players;
}

/**
 * Initialize test data in storage if not present
 * @param {object} storage - Storage adapter instance
 */
export function initializeTestData(storage) {
  let players = storage.get('players') || [];
  
  if (players.length === 0) {
    console.log('Initializing test data for PlayerSearchWidget validation...');
    players = generateTestPlayers(300);
    storage.set('players', players);
    console.log(`Created ${players.length} test players for validation`);
  }
  
  return players;
}

/**
 * Fuzzy search test cases for validation
 */
export const FUZZY_SEARCH_TEST_CASES = [
  { query: 'mahomes', expected: 'Patrick Mahomes' },
  { query: 'mccafrey', expected: 'Christian McCaffrey' },
  { query: 'maccaffrey', expected: 'Christian McCaffrey' },
  { query: 'CJ', expected: 'C.J. Stroud' },
  { query: 'alln', expected: 'Josh Allen' },
  { query: 'tyrek', expected: 'Tyreek Hill' },
  { query: 'kelce', expected: 'Travis Kelce' },
  { query: 'jefferson', expected: 'Justin Jefferson' },
  { query: 'diggs', expected: 'Stefon Diggs' },
  { query: 'barkley', expected: 'Saquon Barkley' }
];

/**
 * Performance test scenarios
 */
export const PERFORMANCE_TEST_SCENARIOS = [
  { name: 'Short Query (2 chars)', query: 'pa', expectedMaxTime: 50 },
  { name: 'Medium Query (5 chars)', query: 'allen', expectedMaxTime: 50 },
  { name: 'Long Query (10 chars)', query: 'jefferson', expectedMaxTime: 50 },
  { name: 'Fuzzy Query', query: 'mccafrey', expectedMaxTime: 50 },
  { name: 'Initials Query', query: 'CJ', expectedMaxTime: 50 },
  { name: 'Common Term', query: 'johnson', expectedMaxTime: 50 }
];