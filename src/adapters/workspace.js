/**
 * Workspace adapter for .ffdraft file format (T-006a)
 * Provides save/load functionality with SHA-256 integrity checking
 */

import { createStorageAdapter } from './storage.js';

const WORKSPACE_VERSION = '1.0.0';

/**
 * Create a new workspace adapter
 * @returns {Object} Workspace adapter interface
 */
export function createWorkspaceAdapter() {
  const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });
  
  /**
   * Gather all workspace data from localStorage
   * @returns {Object} Complete workspace data
   */
  function gatherWorkspaceData() {
    const now = Date.now();
    
    // Gather all workspace components
    const workspace = {
      version: WORKSPACE_VERSION,
      metadata: {
        created: now,
        modified: now,
        name: 'FFB Draft Workspace',
        checksum: '' // Will be computed before save
      },
      league: storage.get('leagueSettings') || {},
      players: storage.get('players') || [],
      draftState: storage.get('state') || { draft: { picks: [] } },
      ui: {
        starredPlayers: storage.get('starredPlayers') || [],
        playerNotes: storage.get('playerNotes') || {},
        columnSettings: storage.get('columnSettings') || {},
        dashboardLayout: storage.get('dashboardLayout') || null
      },
      history: storage.get('history') || []
    };
    
    return workspace;
  }
  
  /**
   * Calculate SHA-256 checksum for workspace data
   * @param {Object} data - Workspace data (without checksum field)
   * @returns {Promise<string>} Hex string checksum
   */
  async function calculateChecksum(data) {
    // Clone and remove checksum field for calculation
    const dataForChecksum = JSON.parse(JSON.stringify(data));
    if (dataForChecksum.metadata) {
      delete dataForChecksum.metadata.checksum;
    }
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(dataForChecksum));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  /**
   * Save workspace to .ffdraft file
   * @param {string} filename - Optional filename (defaults to timestamp)
   * @returns {Promise<Object>} Result with success flag and filename
   */
  async function save(filename) {
    try {
      const workspace = gatherWorkspaceData();
      
      // Calculate and add checksum
      const checksum = await calculateChecksum(workspace);
      workspace.metadata.checksum = checksum;
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(workspace, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `draft_${Date.now()}.ffdraft`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { ok: true, filename: a.download };
    } catch (error) {
      console.error('Workspace save failed:', error);
      return { ok: false, error: error.message };
    }
  }
  
  /**
   * Load workspace from .ffdraft file
   * @param {File} file - File object from input
   * @returns {Promise<Object>} Result with success flag and data
   */
  async function load(file) {
    try {
      const text = await file.text();
      const workspace = JSON.parse(text);
      
      // Validate structure
      if (!workspace.version || !workspace.metadata || !workspace.league) {
        throw new Error('Invalid workspace file structure');
      }
      
      // Verify checksum
      const storedChecksum = workspace.metadata.checksum;
      const calculatedChecksum = await calculateChecksum(workspace);
      
      if (storedChecksum !== calculatedChecksum) {
        throw new Error('Workspace file integrity check failed');
      }
      
      // Check version compatibility
      const fileVersion = workspace.version.split('.').map(Number);
      const currentVersion = WORKSPACE_VERSION.split('.').map(Number);
      
      // Major version must match, minor/patch can be higher
      if (fileVersion[0] !== currentVersion[0]) {
        throw new Error(`Incompatible workspace version: ${workspace.version}`);
      }
      
      // Migrate if needed (future versions)
      let migratedWorkspace = workspace;
      if (fileVersion[1] < currentVersion[1] || fileVersion[2] < currentVersion[2]) {
        migratedWorkspace = migrate(workspace, workspace.version, WORKSPACE_VERSION);
      }
      
      // Apply workspace data to localStorage
      applyWorkspaceData(migratedWorkspace);
      
      return { ok: true, data: migratedWorkspace };
    } catch (error) {
      console.error('Workspace load failed:', error);
      return { ok: false, error: error.message };
    }
  }
  
  /**
   * Apply loaded workspace data to localStorage
   * @param {Object} workspace - Workspace data to apply
   */
  function applyWorkspaceData(workspace) {
    // Save each component to localStorage
    if (workspace.league) storage.set('leagueSettings', workspace.league);
    if (workspace.players) storage.set('players', workspace.players);
    if (workspace.draftState) storage.set('state', workspace.draftState);
    
    // UI preferences
    if (workspace.ui) {
      if (workspace.ui.starredPlayers) storage.set('starredPlayers', workspace.ui.starredPlayers);
      if (workspace.ui.playerNotes) storage.set('playerNotes', workspace.ui.playerNotes);
      if (workspace.ui.columnSettings) storage.set('columnSettings', workspace.ui.columnSettings);
      if (workspace.ui.dashboardLayout) storage.set('dashboardLayout', workspace.ui.dashboardLayout);
    }
    
    if (workspace.history) storage.set('history', workspace.history);
    
    // Trigger UI update events
    try {
      window.dispatchEvent(new CustomEvent('workspace:loaded'));
      window.dispatchEvent(new CustomEvent('workspace:state-changed'));
      window.dispatchEvent(new CustomEvent('workspace:players-changed'));
    } catch (e) {
      console.warn('Could not dispatch workspace events:', e);
    }
  }
  
  /**
   * Migrate workspace data between versions
   * @param {Object} data - Workspace data
   * @param {string} fromVersion - Source version
   * @param {string} toVersion - Target version
   * @returns {Object} Migrated workspace data
   */
  function migrate(data, fromVersion, toVersion) {
    console.log(`Migrating workspace from ${fromVersion} to ${toVersion}`);
    
    // Clone data for migration
    const migrated = JSON.parse(JSON.stringify(data));
    
    // Example migration logic (v1.0.x to v1.1.0)
    // In future, add specific migration steps here
    
    // Update version
    migrated.version = toVersion;
    migrated.metadata.modified = Date.now();
    
    return migrated;
  }
  
  /**
   * Validate workspace file without loading
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  async function validate(file) {
    try {
      const text = await file.text();
      const workspace = JSON.parse(text);
      
      // Check required fields
      const required = ['version', 'metadata', 'league', 'players', 'draftState', 'ui', 'history'];
      const missing = required.filter(field => !(field in workspace));
      
      if (missing.length > 0) {
        return { ok: false, error: `Missing required fields: ${missing.join(', ')}` };
      }
      
      // Verify checksum
      const storedChecksum = workspace.metadata.checksum;
      const calculatedChecksum = await calculateChecksum(workspace);
      
      if (storedChecksum !== calculatedChecksum) {
        return { ok: false, error: 'Checksum validation failed' };
      }
      
      return { 
        ok: true, 
        info: {
          version: workspace.version,
          name: workspace.metadata.name,
          created: new Date(workspace.metadata.created).toLocaleString(),
          modified: new Date(workspace.metadata.modified).toLocaleString(),
          playerCount: workspace.players?.length || 0,
          pickCount: workspace.draftState?.draft?.picks?.length || 0
        }
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  
  // Public API
  return {
    save,
    load,
    validate,
    gatherWorkspaceData,
    calculateChecksum,
    version: WORKSPACE_VERSION
  };
}