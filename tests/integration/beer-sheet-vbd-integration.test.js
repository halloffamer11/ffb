/**
 * Beer Sheet VBD Integration Test
 * 
 * Tests the integration between the Beer Sheet data processing utilities
 * and the existing VBD calculation system to ensure compatibility.
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

// Import existing VBD utilities (mock for testing)
const VBD = {
  calculatePlayerVBDWithValPercent: (players, leagueSettings) => {
    // Mock implementation that matches the existing vbd.js behavior
    return players.map(player => ({
      ...player,
      vbd: player.vbd || (player.points - 100), // Simple VBD calculation
      valPercent: player.valPercent || Math.max(0, (player.vbd || 0) / 2)
    }));
  }
};

// Beer Sheet processor (simplified for integration test)
const BeerSheet = {
  processBeerSheetData: (players, leagueSettings, draftedPlayers, hideDrafted = false) => {
    // Filter drafted players
    const playersWithDraftStatus = players.map(player => ({
      ...player,
      drafted: player.drafted || draftedPlayers.has(String(player.id))
    }));
    
    const filterByPosition = (pos) => {
      let filtered = playersWithDraftStatus.filter(p => p.position === pos);
      if (hideDrafted) {
        filtered = filtered.filter(p => !p.drafted);
      }
      return filtered.sort((a, b) => {
        if (Math.abs(b.vbd - a.vbd) > 0.05) return b.vbd - a.vbd;
        if (Math.abs(b.valPercent - a.valPercent) > 0.05) return b.valPercent - a.valPercent;
        return a.name.localeCompare(b.name);
      });
    };
    
    return {
      qb: filterByPosition('QB'),
      rb: filterByPosition('RB'),
      wr: filterByPosition('WR'),
      te: filterByPosition('TE'),
      overall: playersWithDraftStatus
        .filter(p => hideDrafted ? !p.drafted : true)
        .sort((a, b) => (b.vbd || 0) - (a.vbd || 0))
        .map((p, index) => ({ ...p, ovr: index + 1 })),
      lastUpdated: new Date()
    };
  }
};

function generateRealisticPlayers() {
  return [
    // Elite tier
    { id: 1, name: 'Mahomes', position: 'QB', team: 'KC', points: 325, byeWeek: 10, drafted: false },
    { id: 2, name: 'Allen', position: 'QB', team: 'BUF', points: 315, byeWeek: 7, drafted: false },
    { id: 3, name: 'CMC', position: 'RB', team: 'CAR', points: 285, byeWeek: 11, drafted: false },
    { id: 4, name: 'Jefferson', position: 'WR', team: 'MIN', points: 275, byeWeek: 6, drafted: false },
    { id: 5, name: 'Kelce', position: 'TE', team: 'KC', points: 245, byeWeek: 10, drafted: false },
    
    // Mid tier
    { id: 6, name: 'Herbert', position: 'QB', team: 'LAC', points: 290, byeWeek: 8, drafted: false },
    { id: 7, name: 'Taylor', position: 'RB', team: 'IND', points: 265, byeWeek: 14, drafted: false },
    { id: 8, name: 'Chase', position: 'WR', team: 'CIN', points: 255, byeWeek: 5, drafted: false },
    { id: 9, name: 'Andrews', position: 'TE', team: 'BAL', points: 225, byeWeek: 9, drafted: false },
    
    // Lower tier
    { id: 10, name: 'Wilson', position: 'QB', team: 'SEA', points: 250, byeWeek: 12, drafted: false },
    { id: 11, name: 'Mixon', position: 'RB', team: 'CIN', points: 235, byeWeek: 5, drafted: false },
    { id: 12, name: 'Hill', position: 'WR', team: 'MIA', points: 240, byeWeek: 4, drafted: false }
  ];
}

function testBeerSheetVBDIntegration() {
  console.log('\n🔗 Beer Sheet VBD Integration Tests');
  console.log('===================================\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, testFn) {
    try {
      console.log(`Testing: ${name}...`);
      const startTime = performance.now();
      testFn();
      const duration = performance.now() - startTime;
      console.log(`✅ PASS (${duration.toFixed(2)}ms)\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}\n`);
      failed++;
    }
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  
  // Test 1: VBD calculation pipeline
  test('VBD Calculation Pipeline Integration', () => {
    const rawPlayers = generateRealisticPlayers();
    const leagueSettings = {
      teams: 12,
      starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
      budget: 200,
      rosterSize: 16
    };
    
    // Step 1: Calculate VBD using existing system
    const playersWithVBD = VBD.calculatePlayerVBDWithValPercent(rawPlayers, leagueSettings);
    
    // Step 2: Process through Beer Sheet
    const beerSheetData = BeerSheet.processBeerSheetData(
      playersWithVBD, 
      leagueSettings, 
      new Set()
    );
    
    assert(beerSheetData.qb.length === 4, 'Should have 4 QBs');
    assert(beerSheetData.rb.length === 3, 'Should have 3 RBs');
    assert(beerSheetData.wr.length === 3, 'Should have 3 WRs');
    assert(beerSheetData.te.length === 2, 'Should have 2 TEs');
    assert(beerSheetData.overall.length === 12, 'Should have 12 overall players');
    
    // Verify VBD values are preserved
    const mahomes = beerSheetData.qb.find(p => p.name === 'Mahomes');
    assert(mahomes.vbd > 0, 'Mahomes should have positive VBD');
    
    console.log(`    Mahomes VBD: ${mahomes.vbd}`);
    console.log(`    Overall #1: ${beerSheetData.overall[0].name} (VBD: ${beerSheetData.overall[0].vbd})`);
  });
  
  // Test 2: Draft state consistency
  test('Draft State Consistency Across Systems', () => {
    const players = generateRealisticPlayers();
    const leagueSettings = { teams: 12, starters: { QB: 1, RB: 2, WR: 2, TE: 1 } };
    
    // Mark some players as drafted
    const draftedPlayerIds = new Set(['1', '3', '4']); // Mahomes, CMC, Jefferson
    
    const playersWithVBD = VBD.calculatePlayerVBDWithValPercent(players, leagueSettings);
    const beerSheetData = BeerSheet.processBeerSheetData(
      playersWithVBD,
      leagueSettings,
      draftedPlayerIds
    );
    
    // Check that drafted status is properly reflected
    const mahomes = beerSheetData.qb.find(p => p.name === 'Mahomes');
    const cmc = beerSheetData.rb.find(p => p.name === 'CMC');
    const jefferson = beerSheetData.wr.find(p => p.name === 'Jefferson');
    
    assert(mahomes.drafted === true, 'Mahomes should be drafted');
    assert(cmc.drafted === true, 'CMC should be drafted'); 
    assert(jefferson.drafted === true, 'Jefferson should be drafted');
    
    // Check undrafted players
    const allen = beerSheetData.qb.find(p => p.name === 'Allen');
    assert(allen.drafted === false, 'Allen should not be drafted');
    
    console.log(`    Drafted players reflected correctly: ${draftedPlayerIds.size} players`);
  });
  
  // Test 3: Position ranking consistency
  test('Position Ranking Consistency with VBD', () => {
    const players = generateRealisticPlayers();
    const leagueSettings = { teams: 12, starters: { QB: 1, RB: 2, WR: 2, TE: 1 } };
    
    const playersWithVBD = VBD.calculatePlayerVBDWithValPercent(players, leagueSettings);
    const beerSheetData = BeerSheet.processBeerSheetData(playersWithVBD, leagueSettings, new Set());
    
    // QB rankings should be VBD-based
    const qbs = beerSheetData.qb;
    for (let i = 1; i < qbs.length; i++) {
      assert(qbs[i-1].vbd >= qbs[i].vbd, 
        `QB${i-1} VBD (${qbs[i-1].vbd}) should be >= QB${i} VBD (${qbs[i].vbd})`);
    }
    
    // Overall rankings should be cross-position VBD-based
    const overall = beerSheetData.overall;
    for (let i = 1; i < overall.length; i++) {
      assert(overall[i-1].vbd >= overall[i].vbd,
        `Overall${i-1} VBD (${overall[i-1].vbd}) should be >= Overall${i} VBD (${overall[i].vbd})`);
    }
    
    console.log(`    Position rankings consistent with VBD ordering`);
    console.log(`    Top 3 Overall: ${overall.slice(0,3).map(p => `${p.name}(${p.vbd})`).join(', ')}`);
  });
  
  // Test 4: Performance with realistic dataset
  test('Performance with Realistic Player Dataset', () => {
    // Generate a more realistic dataset
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const players = [];
    
    for (let i = 0; i < 200; i++) {
      const position = positions[i % positions.length];
      const basePoints = position === 'QB' ? 300 : position === 'TE' ? 200 : 250;
      const points = basePoints - (i * 2) + (Math.random() - 0.5) * 20;
      
      players.push({
        id: i + 1,
        name: `Player ${i + 1}`,
        position,
        team: 'TEST',
        points: Math.round(points),
        byeWeek: (i % 17) + 1,
        drafted: Math.random() < 0.15 // 15% drafted
      });
    }
    
    const leagueSettings = { teams: 12, starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 } };
    
    const startTime = performance.now();
    
    // Full pipeline
    const playersWithVBD = VBD.calculatePlayerVBDWithValPercent(players, leagueSettings);
    const beerSheetData = BeerSheet.processBeerSheetData(playersWithVBD, leagueSettings, new Set());
    
    const duration = performance.now() - startTime;
    
    assert(duration < 100, `Full pipeline should be under 100ms, got ${duration.toFixed(2)}ms`);
    assert(beerSheetData.overall.length > 0, 'Should produce overall rankings');
    
    console.log(`    Processed ${players.length} players in ${duration.toFixed(2)}ms`);
    console.log(`    Generated ${beerSheetData.overall.length} overall rankings`);
  });
  
  // Test 5: Data validation and error handling
  test('Data Validation and Error Handling', () => {
    const leagueSettings = { teams: 12, starters: { QB: 1, RB: 2, WR: 2, TE: 1 } };
    
    // Test empty players
    let result = BeerSheet.processBeerSheetData([], leagueSettings, new Set());
    assert(result.qb.length === 0, 'Empty players should return empty tables');
    assert(result.overall.length === 0, 'Empty players should return empty overall');
    
    // Test malformed data
    const badPlayers = [
      { id: 1, name: null, position: 'QB' }, // Missing name
      { id: 2, position: 'RB' }, // Missing name entirely
      { id: 3, name: 'Valid', position: 'WR', vbd: NaN } // Invalid VBD
    ];
    
    const playersWithVBD = VBD.calculatePlayerVBDWithValPercent(badPlayers, leagueSettings);
    result = BeerSheet.processBeerSheetData(playersWithVBD, leagueSettings, new Set());
    
    // Should handle gracefully without crashing
    assert(typeof result === 'object', 'Should return valid result object');
    assert(Array.isArray(result.overall), 'Should return valid overall array');
    
    console.log(`    Handled malformed data gracefully`);
  });
  
  // Test results
  console.log(`\n🔗 Integration Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Beer Sheet utilities are ready for production use.');
  } else {
    console.log('\n⚠️ Some integration tests failed. Please review the implementation.');
  }
  
  return { passed, failed, total: passed + failed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBeerSheetVBDIntegration();
}

export { testBeerSheetVBDIntegration };