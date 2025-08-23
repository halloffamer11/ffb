/**
 * T-025: Draft Recovery System
 * Detect and recover from corrupted state or browser crashes
 */

import { createStorageAdapter } from '../adapters/storage.js';
import { storeBridge } from './storeBridge.js';
import { createWorkspaceAdapter } from '../adapters/workspace.js';
import { showToast } from './toast.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

export class DraftRecoveryManager {
  constructor() {
    this.backupKey = 'workspace::backup';
    this.crashKey = 'workspace::crash_detection';
    this.sessionKey = 'workspace::session';
  }
  
  /**
   * Initialize recovery system
   */
  init() {
    // Check for crash on startup
    this.detectCrash();
    
    // Set up crash detection
    this.setupCrashDetection();
    
    // Auto-save periodically
    this.setupAutoSave();
    
    // Listen for state changes
    storeBridge.subscribe('change', () => this.createBackup());
  }
  
  /**
   * Detect if previous session crashed
   */
  detectCrash() {
    try {
      const crashMarker = localStorage.getItem(this.crashKey);
      if (crashMarker === 'active') {
        // Previous session didn't close properly
        console.warn('Crash detected from previous session');
        this.showRecoveryUI();
      }
    } catch (err) {
      console.error('Error detecting crash:', err);
    }
  }
  
  /**
   * Set up crash detection marker
   */
  setupCrashDetection() {
    // Mark session as active
    localStorage.setItem(this.crashKey, 'active');
    
    // Clear marker on normal exit
    window.addEventListener('beforeunload', () => {
      localStorage.setItem(this.crashKey, 'closed');
    });
    
    // Heartbeat to detect frozen tabs
    this.heartbeat();
  }
  
  /**
   * Heartbeat to detect frozen tabs
   */
  heartbeat() {
    const beat = () => {
      localStorage.setItem(this.sessionKey, Date.now().toString());
    };
    
    beat();
    setInterval(beat, 5000); // Every 5 seconds
  }
  
  /**
   * Set up auto-save
   */
  setupAutoSave() {
    // Save every 30 seconds if there are changes
    setInterval(() => {
      this.createBackup();
    }, 30000);
  }
  
  /**
   * Create backup of current state
   */
  createBackup() {
    try {
      const state = storeBridge.getState();
      const backup = {
        timestamp: Date.now(),
        state,
        players: storage.get('players'),
        settings: storage.get('leagueSettings')
      };
      
      // Keep last 3 backups
      const backups = this.getBackups();
      backups.push(backup);
      if (backups.length > 3) {
        backups.shift();
      }
      
      localStorage.setItem(this.backupKey, JSON.stringify(backups));
    } catch (err) {
      console.error('Failed to create backup:', err);
    }
  }
  
  /**
   * Get all backups
   */
  getBackups() {
    try {
      const data = localStorage.getItem(this.backupKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Show recovery UI
   */
  showRecoveryUI() {
    const backups = this.getBackups();
    if (backups.length === 0) {
      console.log('No backups available for recovery');
      return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <h2 class="text-xl font-bold mb-4 text-red-600">⚠️ Draft Recovery</h2>
        <p class="mb-4">It looks like your previous session didn't close properly. Would you like to recover your draft?</p>
        
        <div class="space-y-2 mb-4 max-h-48 overflow-auto">
          ${backups.map((backup, idx) => `
            <div class="border rounded p-3 hover:bg-gray-50 cursor-pointer recovery-option" data-idx="${idx}">
              <div class="font-medium">Backup ${idx + 1}</div>
              <div class="text-sm text-gray-600">
                ${new Date(backup.timestamp).toLocaleString()}
              </div>
              <div class="text-xs text-gray-500">
                ${backup.state?.draft?.picks?.length || 0} picks
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="flex gap-2">
          <button id="recoverBtn" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Recover Selected
          </button>
          <button id="skipBtn" class="px-4 py-2 border rounded hover:bg-gray-50">
            Skip Recovery
          </button>
        </div>
        
        <div class="mt-4 text-sm text-gray-600">
          <p>You can also recover from a workspace file:</p>
          <input type="file" id="workspaceFile" accept=".ffdraft" class="mt-2" />
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    let selectedBackup = backups.length - 1; // Default to most recent
    
    // Highlight selected
    const updateSelection = () => {
      modal.querySelectorAll('.recovery-option').forEach((el, idx) => {
        el.classList.toggle('bg-blue-50', idx === selectedBackup);
        el.classList.toggle('border-blue-500', idx === selectedBackup);
      });
    };
    
    updateSelection();
    
    // Selection handlers
    modal.querySelectorAll('.recovery-option').forEach(el => {
      el.addEventListener('click', () => {
        selectedBackup = parseInt(el.dataset.idx);
        updateSelection();
      });
    });
    
    // Recovery button
    modal.querySelector('#recoverBtn').addEventListener('click', () => {
      this.recoverFromBackup(backups[selectedBackup]);
      document.body.removeChild(modal);
    });
    
    // Skip button
    modal.querySelector('#skipBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      localStorage.setItem(this.crashKey, 'closed');
    });
    
    // File recovery
    modal.querySelector('#workspaceFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.recoverFromFile(file);
        document.body.removeChild(modal);
      }
    });
  }
  
  /**
   * Recover from backup
   */
  recoverFromBackup(backup) {
    try {
      // Restore state
      storage.set('state', backup.state);
      storage.set('players', backup.players);
      storage.set('leagueSettings', backup.settings);
      
      // Clear crash marker
      localStorage.setItem(this.crashKey, 'closed');
      
      showToast('Draft recovered successfully!', 'success');
      
      // Reload to apply changes
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      console.error('Recovery failed:', err);
      showToast('Recovery failed. Please try loading a workspace file.', 'error');
    }
  }
  
  /**
   * Recover from workspace file
   */
  async recoverFromFile(file) {
    try {
      // Validate workspace file
      const workspaceAdapter = createWorkspaceAdapter();
      const validation = await workspaceAdapter.validate(file);
      
      if (!validation.ok) {
        throw new Error(validation.error || 'Invalid workspace file');
      }
      
      // Load workspace data
      const loadResult = await workspaceAdapter.load(file);
      if (!loadResult.ok) {
        throw new Error(loadResult.error || 'Failed to load workspace data');
      }
      
      // Apply workspace data to storage
      Object.entries(loadResult.data).forEach(([key, value]) => {
        storage.set(key, value);
      });
      
      localStorage.setItem(this.crashKey, 'closed');
      showToast('Workspace loaded successfully!', 'success');
      
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      console.error('File recovery failed:', err);
      showToast('Failed to load workspace file', 'error');
    }
  }
  
  /**
   * Manual backup trigger
   */
  triggerManualBackup() {
    this.createBackup();
    showToast('Backup created', 'info');
  }
  
  /**
   * Export current state as workspace
   */
  async exportWorkspace() {
    try {
      const workspaceAdapter = createWorkspaceAdapter();
      await workspaceAdapter.save();
      showToast('Workspace exported successfully', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed', 'error');
    }
  }
  
  /**
   * Check state integrity
   */
  checkIntegrity() {
    try {
      const state = storeBridge.getState();
      const issues = [];
      
      // Check for duplicate picks
      const picks = state?.draft?.picks || [];
      const playerIds = new Set();
      picks.forEach(p => {
        if (playerIds.has(p.playerId)) {
          issues.push(`Duplicate pick: ${p.playerName}`);
        }
        playerIds.add(p.playerId);
      });
      
      // Check for invalid team IDs
      const settings = storage.get('leagueSettings') || {};
      const validTeams = new Set((settings.owners || []).map(o => o.id));
      picks.forEach(p => {
        if (!validTeams.has(p.teamId)) {
          issues.push(`Invalid team ID: ${p.teamId}`);
        }
      });
      
      // Check for negative prices
      picks.forEach(p => {
        if (p.price < 0) {
          issues.push(`Invalid price for ${p.playerName}: ${p.price}`);
        }
      });
      
      return {
        ok: issues.length === 0,
        issues
      };
    } catch (err) {
      return {
        ok: false,
        issues: ['Failed to check integrity: ' + err.message]
      };
    }
  }
}

// Export singleton instance
export const recoveryManager = new DraftRecoveryManager();