/**
 * Unit tests for VAL% (Value Percentage) calculation system
 * Tests for calculateValuePercentages and calculatePlayerVBDWithValPercent functions
 */

import { 
  calculateValuePercentages, 
  calculatePlayerVBDWithValPercent,
  calculatePlayerVBD
} from '../../src/core/vbd.js';

// Test data setup
const mockLeagueSettings = {
  teams: 12,
  starters: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    K: 1,
    DST: 1,
    FLEX: 1
  }
};

const mockLeagueSettingsCustomFlex = {
  teams: 12,
  starters: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    K: 1,
    DST: 1,
    FLEX: 1
  },
  flexConfig: {
    spots: [{
      id: 'flex1',
      allowedPositions: {
        QB: false,
        RB: true,
        WR: true,
        TE: true
      }
    }]
  }
};

const mockPlayersWithVBD = [
  // QBs
  { id: 1, name: 'Josh Allen', position: 'QB', points: 350, vbd: 50.0, drafted: false },
  { id: 2, name: 'Joe Burrow', position: 'QB', points: 320, vbd: 20.0, drafted: false },
  { id: 3, name: 'Kirk Cousins', position: 'QB', points: 280, vbd: -20.0, drafted: false }, // Negative VBD
  
  // RBs
  { id: 4, name: 'Christian McCaffrey', position: 'RB', points: 380, vbd: 100.0, drafted: false },
  { id: 5, name: 'Saquon Barkley', position: 'RB', points: 320, vbd: 40.0, drafted: false },
  { id: 6, name: 'Drafted RB', position: 'RB', points: 300, vbd: 20.0, drafted: true }, // Drafted
  
  // WRs  
  { id: 7, name: 'Tyreek Hill', position: 'WR', points: 350, vbd: 80.0, drafted: false },
  { id: 8, name: 'Stefon Diggs', position: 'WR', points: 310, vbd: 40.0, drafted: false },
  { id: 9, name: 'Mike Evans', position: 'WR', points: 280, vbd: 10.0, drafted: false },
  
  // TEs
  { id: 10, name: 'Travis Kelce', position: 'TE', points: 300, vbd: 60.0, drafted: false },
  { id: 11, name: 'Mark Andrews', position: 'TE', points: 250, vbd: 10.0, drafted: false },
  
  // K and DST (minimal VBD)
  { id: 12, name: 'Justin Tucker', position: 'K', points: 150, vbd: 5.0, drafted: false },
  { id: 13, name: 'Bills DST', position: 'DST', points: 140, vbd: 3.0, drafted: false }
];

// Test helper functions
function assertApproximateEqual(actual, expected, tolerance = 0.1, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message} Expected ~${expected}, got ${actual} (diff: ${diff})`);
  }
}

function runTest(testName, testFunction) {
  try {
    const start = performance.now();
    testFunction();
    const end = performance.now();
    console.log(`✅ ${testName} (${(end - start).toFixed(2)}ms)`);
    return true;
  } catch (error) {
    console.error(`❌ ${testName}: ${error.message}`);
    return false;
  }
}

// Test 1: Basic VAL% calculation
function testBasicValPercentCalculation() {
  const result = calculateValuePercentages(mockPlayersWithVBD, mockLeagueSettings);
  
  // Check that all players have valPercent property
  for (const player of result) {
    if (player.valPercent === undefined) {
      throw new Error(`Player ${player.name} missing valPercent property`);
    }
  }
  
  // Check specific calculations
  // QB: Josh Allen (50 VBD) should have ~71.4% of total QB VBD (50 + 20 = 70)
  const joshAllen = result.find(p => p.name === 'Josh Allen');
  assertApproximateEqual(joshAllen.valPercent, 71.4, 0.5, 'Josh Allen VAL%');
  
  // RB: McCaffrey (100 VBD) should have ~71.4% of total RB VBD (100 + 40 = 140, excluding drafted)
  const mccaffrey = result.find(p => p.name === 'Christian McCaffrey');
  assertApproximateEqual(mccaffrey.valPercent, 71.4, 0.5, 'McCaffrey VAL%');
  
  // Negative VBD player should have 0 VAL%
  const cousins = result.find(p => p.name === 'Kirk Cousins');
  if (cousins.valPercent !== 0) {
    throw new Error(`Negative VBD player should have 0 VAL%, got ${cousins.valPercent}`);
  }
  
  // Drafted player should have 0 VAL%
  const draftedRb = result.find(p => p.name === 'Drafted RB');
  if (draftedRb.valPercent !== 0) {
    throw new Error(`Drafted player should have 0 VAL%, got ${draftedRb.valPercent}`);
  }
}

// Test 2: Edge cases
function testEdgeCases() {
  // Test empty array
  const emptyResult = calculateValuePercentages([], mockLeagueSettings);
  if (emptyResult.length !== 0) {
    throw new Error('Empty array should return empty result');
  }
  
  // Test all drafted players
  const allDraftedPlayers = mockPlayersWithVBD.map(p => ({ ...p, drafted: true }));
  const allDraftedResult = calculateValuePercentages(allDraftedPlayers, mockLeagueSettings);
  for (const player of allDraftedResult) {
    if (player.valPercent !== 0) {
      throw new Error(`All drafted players should have 0 VAL%, ${player.name} has ${player.valPercent}`);
    }
  }
  
  // Test all negative VBD players  
  const allNegativeVbdPlayers = mockPlayersWithVBD.map(p => ({ ...p, vbd: -10.0 }));
  const allNegativeResult = calculateValuePercentages(allNegativeVbdPlayers, mockLeagueSettings);
  for (const player of allNegativeResult) {
    if (player.valPercent !== 0) {
      throw new Error(`All negative VBD players should have 0 VAL%, ${player.name} has ${player.valPercent}`);
    }
  }
  
  // Test single player at position
  const singleQbPlayers = mockPlayersWithVBD.filter(p => p.position !== 'QB').concat([
    { id: 100, name: 'Solo QB', position: 'QB', points: 300, vbd: 30.0, drafted: false }
  ]);
  const singleResult = calculateValuePercentages(singleQbPlayers, mockLeagueSettings);
  const soloQb = singleResult.find(p => p.name === 'Solo QB');
  assertApproximateEqual(soloQb.valPercent, 100.0, 0.1, 'Single player should have 100% VAL%');
}

// Test 3: FLEX position handling
function testFlexPositionHandling() {
  // Test with traditional FLEX (RB/WR/TE)
  const result = calculateValuePercentages(mockPlayersWithVBD, mockLeagueSettings);
  
  // FLEX-eligible players should be accounted for in FLEX totals
  // Total FLEX VBD = RB (100+40) + WR (80+40+10) + TE (60+10) = 340
  // McCaffrey (100 VBD) should have ~29.4% of FLEX VBD (100/340)
  const mccaffrey = result.find(p => p.name === 'Christian McCaffrey');
  // Note: We're testing his direct position VAL%, not FLEX VAL%
  // His RB VAL% should be 71.4% (100/140)
  assertApproximateEqual(mccaffrey.valPercent, 71.4, 0.5, 'McCaffrey RB VAL% with FLEX');
  
  // Test with custom FLEX config
  const customFlexResult = calculateValuePercentages(mockPlayersWithVBD, mockLeagueSettingsCustomFlex);
  // Should behave the same since custom config allows RB/WR/TE like traditional
  const mccaffreyCustom = customFlexResult.find(p => p.name === 'Christian McCaffrey');
  assertApproximateEqual(mccaffreyCustom.valPercent, 71.4, 0.5, 'McCaffrey VAL% with custom FLEX');
}

// Test 4: Performance test
function testPerformance() {
  // Create a larger dataset for performance testing
  const largeDataset = [];
  for (let i = 0; i < 300; i++) {
    largeDataset.push({
      id: i,
      name: `Player ${i}`,
      position: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'][i % 6],
      points: Math.random() * 400,
      vbd: (Math.random() - 0.3) * 100, // Some negative VBD
      drafted: Math.random() < 0.3 // 30% drafted
    });
  }
  
  const start = performance.now();
  const result = calculateValuePercentages(largeDataset, mockLeagueSettings);
  const end = performance.now();
  
  const duration = end - start;
  if (duration > 100) { // Should complete in < 100ms
    throw new Error(`Performance test failed: ${duration.toFixed(2)}ms (should be < 100ms)`);
  }
  
  if (result.length !== largeDataset.length) {
    throw new Error('Performance test failed: result length mismatch');
  }
  
  console.log(`Performance test: ${largeDataset.length} players processed in ${duration.toFixed(2)}ms`);
}

// Test 5: Integration test with full VBD pipeline
function testFullVBDPipeline() {
  // Create test players without VBD - need multiple per position for meaningful VBD
  const playersWithoutVBD = [
    // QBs - need multiple for VBD calculation
    { id: 1, name: 'Josh Allen', position: 'QB', points: 350, drafted: false, injuryStatus: 0 },
    { id: 2, name: 'Joe Burrow', position: 'QB', points: 320, drafted: false, injuryStatus: 0 },
    { id: 3, name: 'Kirk Cousins', position: 'QB', points: 280, drafted: false, injuryStatus: 0 },
    { id: 15, name: 'QB Baseline', position: 'QB', points: 250, drafted: false, injuryStatus: 0 },
    
    // RBs - multiple for meaningful calculations
    { id: 4, name: 'Christian McCaffrey', position: 'RB', points: 380, drafted: false, injuryStatus: 0 },
    { id: 5, name: 'Saquon Barkley', position: 'RB', points: 320, drafted: false, injuryStatus: 0 },
    { id: 14, name: 'RB Baseline', position: 'RB', points: 250, drafted: false, injuryStatus: 0 },
    
    // WRs
    { id: 6, name: 'Tyreek Hill', position: 'WR', points: 350, drafted: false, injuryStatus: 0 },
    { id: 7, name: 'Stefon Diggs', position: 'WR', points: 310, drafted: false, injuryStatus: 0 },
    { id: 13, name: 'WR Baseline', position: 'WR', points: 240, drafted: false, injuryStatus: 0 },
    
    // TEs
    { id: 8, name: 'Travis Kelce', position: 'TE', points: 300, drafted: false, injuryStatus: 0 },
    { id: 9, name: 'Mark Andrews', position: 'TE', points: 250, drafted: false, injuryStatus: 0 },
    { id: 12, name: 'TE Baseline', position: 'TE', points: 200, drafted: false, injuryStatus: 0 },
    
    // K and DST for completeness
    { id: 10, name: 'Justin Tucker', position: 'K', points: 150, drafted: false, injuryStatus: 0 },
    { id: 11, name: 'Bills DST', position: 'DST', points: 140, drafted: false, injuryStatus: 0 }
  ];
  
  // Test the full pipeline
  const result = calculatePlayerVBDWithValPercent(playersWithoutVBD, mockLeagueSettings);
  
  // Verify all calculated fields are present
  for (const player of result) {
    if (player.vbd === undefined) {
      throw new Error(`Player ${player.name} missing VBD after full pipeline`);
    }
    if (player.valPercent === undefined) {
      throw new Error(`Player ${player.name} missing valPercent after full pipeline`);
    }
  }
  
  // Verify that top players have positive VBD and VAL%
  const topPlayers = result.filter(p => !p.drafted && p.vbd > 0).slice(0, 3);
  if (topPlayers.length === 0) {
    throw new Error('Should have some players with positive VBD');
  }
  
  for (const player of topPlayers) {
    if (player.valPercent <= 0) {
      throw new Error(`Top player ${player.name} should have positive VAL%, got ${player.valPercent}`);
    }
  }
  
  // Verify VAL% values are reasonable (each position's undrafted positive VBD should sum to 100%)
  const positions = ['QB', 'RB', 'WR', 'TE'];
  for (const position of positions) {
    const positionPlayers = result.filter(p => p.position === position && !p.drafted && p.vbd > 0);
    if (positionPlayers.length > 0) {
      const total = positionPlayers.reduce((sum, p) => sum + p.valPercent, 0);
      assertApproximateEqual(total, 100.0, 0.5, `${position} VAL% should sum to ~100%`);
    }
  }
}

// Test 6: Rounding precision test
function testRoundingPrecision() {
  const testPlayers = [
    { id: 1, name: 'Player A', position: 'QB', points: 300, vbd: 33.333, drafted: false },
    { id: 2, name: 'Player B', position: 'QB', points: 290, vbd: 66.666, drafted: false }
  ];
  
  const result = calculateValuePercentages(testPlayers, mockLeagueSettings);
  
  // Check rounding to 1 decimal place
  for (const player of result) {
    if (player.valPercent > 0) {
      const decimalPlaces = (player.valPercent.toString().split('.')[1] || '').length;
      if (decimalPlaces > 1) {
        throw new Error(`VAL% should be rounded to 1 decimal place, got ${player.valPercent}`);
      }
    }
  }
  
  // Verify specific values
  const playerA = result.find(p => p.name === 'Player A');
  const playerB = result.find(p => p.name === 'Player B');
  assertApproximateEqual(playerA.valPercent, 33.3, 0.1, 'Player A VAL% rounding');
  assertApproximateEqual(playerB.valPercent, 66.7, 0.1, 'Player B VAL% rounding');
}

// Run all tests
function runAllTests() {
  console.log('Running VAL% calculation tests...\n');
  
  const tests = [
    ['Basic VAL% Calculation', testBasicValPercentCalculation],
    ['Edge Cases', testEdgeCases], 
    ['FLEX Position Handling', testFlexPositionHandling],
    ['Performance Test', testPerformance],
    ['Full VBD Pipeline Integration', testFullVBDPipeline],
    ['Rounding Precision', testRoundingPrecision]
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, testFn] of tests) {
    if (runTest(name, testFn)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All VAL% tests passed!');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };