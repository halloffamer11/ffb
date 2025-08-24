/**
 * T-019: Keeper Entry Mode
 * Pre-draft keeper selection with budget adjustments
 */

import { createStorageAdapter } from '../adapters/storage.js';
import { storeBridge } from './storeBridge.js';
import { showToast } from './toast.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

export function initKeeperWidget(container) {
  if (!container) return;
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full h-full p-4';
  
  const settings = storage.get('leagueSettings') || {};
  const players = storage.get('players') || [];
  const state = storeBridge.getState();
  const keepers = state?.draft?.keepers || [];
  
  wrapper.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Keeper Entry Mode</h2>
        <button id="startDraftBtn" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Start Draft
        </button>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <p class="font-medium mb-1">Instructions:</p>
        <ul class="list-disc list-inside space-y-1 text-blue-800">
          <li>Search and select players to keep</li>
          <li>Set keeper cost (deducted from budget)</li>
          <li>Keepers won't appear in draft pool</li>
          <li>Click "Start Draft" when ready</li>
        </ul>
      </div>
      
      <div class="border rounded">
        <div class="bg-gray-50 px-4 py-2 border-b">
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium">Search:</span>
            <input id="keeperSearch" type="text" placeholder="Type player name..." 
              class="flex-1 px-2 py-1 border rounded text-sm" />
            <button id="addKeeperBtn" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">
              Add Keeper
            </button>
          </div>
        </div>
        
        <div id="searchResults" class="max-h-32 overflow-auto hidden"></div>
      </div>
      
      <div class="border rounded">
        <div class="bg-gray-50 px-4 py-2 border-b">
          <h3 class="font-medium">Current Keepers</h3>
        </div>
        <div id="keepersList" class="divide-y max-h-64 overflow-auto">
          ${keepers.length === 0 ? '<div class="p-4 text-gray-500 text-center">No keepers selected</div>' : ''}
        </div>
      </div>
      
      <div class="bg-gray-50 border rounded p-3">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>Total Keepers: <span id="keeperCount" class="font-medium">${keepers.length}</span></div>
          <div>Total Cost: $<span id="totalCost" class="font-medium">0</span></div>
          <div>Starting Budget: $<span class="font-medium">${settings.budget || 200}</span></div>
          <div>Remaining: $<span id="remainingBudget" class="font-medium">${settings.budget || 200}</span></div>
        </div>
      </div>
    </div>
  `;
  
  const searchInput = wrapper.querySelector('#keeperSearch');
  const searchResults = wrapper.querySelector('#searchResults');
  const keepersList = wrapper.querySelector('#keepersList');
  const addBtn = wrapper.querySelector('#addKeeperBtn');
  const startBtn = wrapper.querySelector('#startDraftBtn');
  
  let selectedPlayer = null;
  let searchTimeout = null;
  
  function updateDisplay() {
    const state = storeBridge.getState();
    const keepers = state?.draft?.keepers || [];
    const totalCost = keepers.reduce((sum, k) => sum + (k.cost || 0), 0);
    const remaining = (settings.budget || 200) - totalCost;
    
    wrapper.querySelector('#keeperCount').textContent = keepers.length;
    wrapper.querySelector('#totalCost').textContent = totalCost;
    wrapper.querySelector('#remainingBudget').textContent = remaining;
    
    // Update keepers list
    if (keepers.length === 0) {
      keepersList.innerHTML = '<div class="p-4 text-gray-500 text-center">No keepers selected</div>';
    } else {
      keepersList.innerHTML = keepers.map((k, idx) => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50">
          <div class="flex-1">
            <div class="font-medium">${k.playerName}</div>
            <div class="text-sm text-gray-600">${k.team} · ${k.position}</div>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" min="1" value="${k.cost}" 
              class="w-20 px-2 py-1 border rounded text-sm keeper-cost" 
              data-idx="${idx}" />
            <button class="px-2 py-1 text-red-600 hover:bg-red-50 rounded remove-keeper" 
              data-idx="${idx}">Remove</button>
          </div>
        </div>
      `).join('');
      
      // Attach event listeners for cost updates
      keepersList.querySelectorAll('.keeper-cost').forEach(input => {
        input.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          const newCost = parseInt(e.target.value) || 1;
          updateKeeperCost(idx, newCost);
        });
      });
      
      // Attach remove listeners
      keepersList.querySelectorAll('.remove-keeper').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          removeKeeper(idx);
        });
      });
    }
  }
  
  function searchPlayers(query) {
    if (!query || query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.classList.add('hidden');
      return;
    }
    
    const q = query.toLowerCase();
    const matches = players.filter(p => 
      p.name.toLowerCase().includes(q) && !p.drafted
    ).slice(0, 5);
    
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="p-2 text-gray-500">No matches found</div>';
    } else {
      searchResults.innerHTML = matches.map(p => `
        <div class="px-3 py-2 hover:bg-blue-50 cursor-pointer search-result" 
          data-id="${p.id}" data-name="${p.name}" data-team="${p.team}" 
          data-position="${p.position}">
          <div class="font-medium">${p.name}</div>
          <div class="text-xs text-gray-600">${p.team} · ${p.position}</div>
        </div>
      `).join('');
      
      searchResults.querySelectorAll('.search-result').forEach(el => {
        el.addEventListener('click', () => {
          selectedPlayer = {
            id: el.dataset.id,
            name: el.dataset.name,
            team: el.dataset.team,
            position: el.dataset.position
          };
          searchInput.value = el.dataset.name;
          searchResults.classList.add('hidden');
        });
      });
    }
    
    searchResults.classList.remove('hidden');
  }
  
  function addKeeper() {
    if (!selectedPlayer) {
      showToast('Please select a player first', 'error');
      return;
    }
    
    const state = storeBridge.getState();
    const keepers = state?.draft?.keepers || [];
    
    // Check if already a keeper
    if (keepers.some(k => k.playerId === selectedPlayer.id)) {
      showToast('Player is already a keeper', 'error');
      return;
    }
    
    const keeper = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      team: selectedPlayer.team,
      position: selectedPlayer.position,
      cost: 1,
      teamId: settings.userTeamId || 1
    };
    
    storeBridge.dispatch({
      type: 'KEEPER_ADD',
      payload: keeper
    });
    
    showToast(`Added ${selectedPlayer.name} as keeper`, 'success');
    searchInput.value = '';
    selectedPlayer = null;
    searchResults.classList.add('hidden');
    updateDisplay();
  }
  
  function updateKeeperCost(index, cost) {
    storeBridge.dispatch({
      type: 'KEEPER_UPDATE_COST',
      payload: { index, cost }
    });
    updateDisplay();
  }
  
  function removeKeeper(index) {
    storeBridge.dispatch({
      type: 'KEEPER_REMOVE',
      payload: index
    });
    showToast('Keeper removed', 'info');
    updateDisplay();
  }
  
  function startDraft() {
    const state = storeBridge.getState();
    const keepers = state?.draft?.keepers || [];
    
    if (keepers.length === 0) {
      if (!confirm('No keepers selected. Start draft anyway?')) return;
    }
    
    // Mark keepers as drafted and adjust budgets
    keepers.forEach(k => {
      // Add as a draft pick with keeper flag
      storeBridge.dispatch({
        type: 'DRAFT_PICK_ADD',
        payload: {
          ...k,
          isKeeper: true,
          price: k.cost
        }
      });
      
      // Mark player as drafted
      const playerIdx = players.findIndex(p => p.id === k.playerId);
      if (playerIdx >= 0) {
        players[playerIdx].drafted = true;
      }
    });
    
    // Save updated players
    storage.set('players', players);
    
    // Clear keeper mode
    storeBridge.dispatch({ type: 'KEEPER_CLEAR' });
    
    showToast(`Draft started with ${keepers.length} keepers`, 'success');
    
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('keeper:draft-started'));
  }
  
  // Event listeners
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchPlayers(e.target.value), 150);
  });
  
  addBtn.addEventListener('click', addKeeper);
  startBtn.addEventListener('click', startDraft);
  
  // Subscribe to store changes
  storeBridge.subscribe('change', updateDisplay);
  
  // Initial display
  updateDisplay();
}