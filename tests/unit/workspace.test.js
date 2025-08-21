/**
 * Unit tests for workspace adapter (T-006a)
 */

import { createWorkspaceAdapter } from '../../src/adapters/workspace.js';
import { createStorageAdapter } from '../../src/adapters/storage.js';
import crypto from 'crypto';

// Polyfill for Node.js crypto.subtle
if (!globalThis.crypto?.subtle) {
  globalThis.crypto = {
    subtle: {
      digest: async (algorithm, data) => {
        const hash = crypto.createHash('sha256');
        hash.update(Buffer.from(data));
        return hash.digest();
      }
    }
  };
}

// Mock localStorage for Node.js
const mockStorage = new Map();
const localStorageMock = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, value) => mockStorage.set(key, value),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (index) => Array.from(mockStorage.keys())[index] || null
};

// Set both global and window.localStorage for compatibility
global.localStorage = localStorageMock;
global.window = { localStorage: localStorageMock };

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function runTests() {
  // Setup
  localStorage.clear();
  const workspace = createWorkspaceAdapter();
  const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });
  
  // Test 1: Gather workspace data
  {
    // Set up test data directly in localStorage with namespace
    localStorage.setItem('workspace::leagueSettings', JSON.stringify({ teams: 12, budget: 200 }));
    localStorage.setItem('workspace::players', JSON.stringify([
      { id: 1, name: 'Player 1', position: 'QB' },
      { id: 2, name: 'Player 2', position: 'RB' }
    ]));
    localStorage.setItem('workspace::state', JSON.stringify({ draft: { picks: [{ playerId: 1, teamId: 1, price: 25 }] } }));
    
    const data = workspace.gatherWorkspaceData();
    
    assert(data.version === '1.0.0', 'workspace has version');
    assert(data.metadata.created > 0, 'workspace has created timestamp');
    
    // Debug what we got
    if (!data.league?.teams) {
      console.log('Debug - league data:', JSON.stringify(data.league));
      console.log('Debug - localStorage keys:', Array.from(mockStorage.keys()));
    }
    
    assert(data.league && data.league.teams === 12, 'workspace includes league settings');
    assert(data.players && data.players.length === 2, 'workspace includes players');
    assert(data.draftState && data.draftState.draft.picks.length === 1, 'workspace includes draft state');
  }
  
  // Test 2: Calculate checksum
  {
    const data = {
      version: '1.0.0',
      metadata: { created: 123, modified: 456, name: 'Test' },
      league: { teams: 12 },
      players: [],
      draftState: {},
      ui: {},
      history: []
    };
    
    const checksum1 = await workspace.calculateChecksum(data);
    assert(typeof checksum1 === 'string', 'checksum is string');
    assert(checksum1.length === 64, 'checksum is SHA-256 (64 hex chars)');
    
    // Same data should produce same checksum
    const checksum2 = await workspace.calculateChecksum(data);
    assert(checksum1 === checksum2, 'checksum is deterministic');
    
    // Different data should produce different checksum
    data.league.teams = 10;
    const checksum3 = await workspace.calculateChecksum(data);
    assert(checksum1 !== checksum3, 'checksum changes with data');
  }
  
  // Test 3: Validate workspace structure
  {
    // Create a mock File object
    const validWorkspace = {
      version: '1.0.0',
      metadata: { 
        created: Date.now(), 
        modified: Date.now(), 
        name: 'Test Workspace',
        checksum: ''
      },
      league: { teams: 12 },
      players: [{ id: 1, name: 'Test Player' }],
      draftState: { draft: { picks: [] } },
      ui: {},
      history: []
    };
    
    // Calculate and set checksum
    validWorkspace.metadata.checksum = await workspace.calculateChecksum(validWorkspace);
    
    const file = {
      text: async () => JSON.stringify(validWorkspace)
    };
    
    const result = await workspace.validate(file);
    assert(result.ok === true, 'valid workspace passes validation');
    assert(result.info.playerCount === 1, 'validation returns player count');
  }
  
  // Test 4: Detect invalid checksum
  {
    const invalidWorkspace = {
      version: '1.0.0',
      metadata: { 
        created: Date.now(), 
        modified: Date.now(), 
        name: 'Test Workspace',
        checksum: 'invalid_checksum_12345'
      },
      league: { teams: 12 },
      players: [],
      draftState: { draft: { picks: [] } },
      ui: {},
      history: []
    };
    
    const file = {
      text: async () => JSON.stringify(invalidWorkspace)
    };
    
    const result = await workspace.validate(file);
    assert(result.ok === false, 'invalid checksum fails validation');
    assert(result.error.includes('Checksum'), 'error mentions checksum');
  }
  
  // Test 5: Version compatibility check
  {
    const workspace11 = {
      version: '1.1.0',
      metadata: { 
        created: Date.now(), 
        modified: Date.now(), 
        name: 'Future Version',
        checksum: ''
      },
      league: { teams: 12 },
      players: [],
      draftState: { draft: { picks: [] } },
      ui: {},
      history: []
    };
    
    workspace11.metadata.checksum = await workspace.calculateChecksum(workspace11);
    
    const file = {
      text: async () => JSON.stringify(workspace11)
    };
    
    // Validation should pass (minor version difference OK)
    const result = await workspace.validate(file);
    assert(result.ok === true, 'minor version difference passes validation');
  }
  
  // Test 6: Round-trip data integrity
  {
    localStorage.clear();
    
    // Set initial data with namespace
    const initialData = {
      league: { teams: 10, budget: 250 },
      players: [
        { id: 1, name: 'QB1', position: 'QB', points: 300 },
        { id: 2, name: 'RB1', position: 'RB', points: 250 }
      ],
      state: { 
        draft: { 
          picks: [
            { playerId: 1, teamId: 1, price: 35 }
          ] 
        } 
      }
    };
    
    localStorage.setItem('workspace::leagueSettings', JSON.stringify(initialData.league));
    localStorage.setItem('workspace::players', JSON.stringify(initialData.players));
    localStorage.setItem('workspace::state', JSON.stringify(initialData.state));
    
    // Gather and create workspace
    const gathered = workspace.gatherWorkspaceData();
    
    assert(gathered.league.teams === 10, 'gathered league data correct');
    assert(gathered.players.length === 2, 'gathered players correct');
    assert(gathered.draftState.draft.picks.length === 1, 'gathered picks correct');
  }
  
  console.log('\n✅ All workspace tests passed!');
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});