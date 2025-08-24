/**
 * T-020: Enhanced Draft Event Management
 * Two-phase selection flow with validation and rapid entry
 */

import { createStorageAdapter } from '../adapters/storage.js';
import { storeBridge } from './storeBridge.js';
import { showToast } from './toast.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

export function initEnhancedDraftWidget(container) {
  if (!container) return;
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full h-full p-4';
  
  const settings = storage.get('leagueSettings') || {};
  const players = storage.get('players') || [];
  
  // Two-phase state
  let phase = 'SELECT'; // SELECT or CONFIRM
  let selectedPlayer = null;
  let draftDetails = { teamId: settings.userTeamId || 1, price: 1 };
  
  wrapper.innerHTML = `
    <div class="space-y-4">
      <!-- Phase Indicator -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div id="phase1" class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <span class="text-sm">Select Player</span>
          </div>
          <div class="w-8 border-t-2 border-gray-300"></div>
          <div class="flex items-center gap-2">
            <div id="phase2" class="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">2</div>
            <span class="text-sm text-gray-600">Confirm Details</span>
          </div>
        </div>
        <button id="resetBtn" class="px-3 py-1 text-sm border rounded hover:bg-gray-50">Reset</button>
      </div>
      
      <!-- Phase 1: Player Selection -->
      <div id="selectPhase" class="space-y-4">
        <div class="border rounded p-4">
          <h3 class="font-medium mb-3">Quick Search</h3>
          <input id="playerSearch" type="text" placeholder="Start typing player name..." 
            class="w-full px-3 py-2 border rounded" autofocus />
          <div id="searchResults" class="mt-2 max-h-48 overflow-auto border rounded hidden"></div>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm text-blue-800">
            <strong>Tip:</strong> Type player name and press Enter for quick selection, or use arrow keys to navigate results.
          </p>
        </div>
      </div>
      
      <!-- Phase 2: Confirm Details -->
      <div id="confirmPhase" class="space-y-4 hidden">
        <div class="bg-green-50 border border-green-200 rounded p-4">
          <h3 class="font-medium mb-2">Selected Player</h3>
          <div id="selectedInfo" class="text-lg font-semibold"></div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Team</label>
            <select id="teamSelect" class="w-full px-3 py-2 border rounded">
              ${settings.owners?.map(o => 
                `<option value="${o.id}" ${o.id === draftDetails.teamId ? 'selected' : ''}>
                  ${o.team} (${o.name})
                </option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Price ($)</label>
            <input id="priceInput" type="number" min="1" value="${draftDetails.price}" 
              class="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        
        <div class="flex gap-2">
          <button id="confirmBtn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Confirm Draft Pick
          </button>
          <button id="cancelBtn" class="px-4 py-2 border rounded hover:bg-gray-50">
            Cancel
          </button>
        </div>
        
        <!-- Quick Entry Mode -->
        <div class="border-t pt-4">
          <label class="flex items-center gap-2">
            <input id="quickMode" type="checkbox" />
            <span class="text-sm">Quick Mode (auto-confirm with defaults)</span>
          </label>
        </div>
      </div>
      
      <!-- Recent Picks -->
      <div class="border rounded">
        <div class="bg-gray-50 px-4 py-2 border-b">
          <h3 class="font-medium">Recent Picks</h3>
        </div>
        <div id="recentPicks" class="max-h-32 overflow-auto divide-y"></div>
      </div>
      
      <!-- Rapid Entry Section -->
      <div class="border rounded p-4 bg-yellow-50">
        <h3 class="font-medium mb-2">Rapid Entry Mode</h3>
        <div class="flex gap-2">
          <input id="rapidInput" type="text" placeholder="Format: Player Name, Team #, Price" 
            class="flex-1 px-3 py-2 border rounded text-sm" />
          <button id="rapidBtn" class="px-4 py-2 bg-yellow-600 text-white rounded text-sm">
            Quick Add
          </button>
        </div>
        <p class="text-xs text-gray-600 mt-1">Example: "Patrick Mahomes, 3, 65" or "Mahomes 3 65"</p>
      </div>
    </div>
  `;
  
  // Elements
  const searchInput = wrapper.querySelector('#playerSearch');
  const searchResults = wrapper.querySelector('#searchResults');
  const selectPhase = wrapper.querySelector('#selectPhase');
  const confirmPhase = wrapper.querySelector('#confirmPhase');
  const selectedInfo = wrapper.querySelector('#selectedInfo');
  const teamSelect = wrapper.querySelector('#teamSelect');
  const priceInput = wrapper.querySelector('#priceInput');
  const confirmBtn = wrapper.querySelector('#confirmBtn');
  const cancelBtn = wrapper.querySelector('#cancelBtn');
  const resetBtn = wrapper.querySelector('#resetBtn');
  const quickMode = wrapper.querySelector('#quickMode');
  const recentPicks = wrapper.querySelector('#recentPicks');
  const rapidInput = wrapper.querySelector('#rapidInput');
  const rapidBtn = wrapper.querySelector('#rapidBtn');
  
  let searchTimeout = null;
  let selectedIndex = -1;
  
  function setPhase(newPhase) {
    phase = newPhase;
    if (phase === 'SELECT') {
      selectPhase.classList.remove('hidden');
      confirmPhase.classList.add('hidden');
      wrapper.querySelector('#phase1').className = 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold';
      wrapper.querySelector('#phase2').className = 'w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold';
      searchInput.focus();
    } else {
      selectPhase.classList.add('hidden');
      confirmPhase.classList.remove('hidden');
      wrapper.querySelector('#phase1').className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold';
      wrapper.querySelector('#phase2').className = 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold';
      priceInput.focus();
      priceInput.select();
    }
  }
  
  function searchPlayers(query) {
    if (!query || query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.classList.add('hidden');
      selectedIndex = -1;
      return;
    }
    
    const q = query.toLowerCase();
    const matches = players.filter(p => 
      p.name.toLowerCase().includes(q) && !p.drafted
    ).slice(0, 8);
    
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="p-2 text-gray-500">No undrafted players found</div>';
    } else {
      searchResults.innerHTML = matches.map((p, idx) => `
        <div class="px-3 py-2 hover:bg-blue-50 cursor-pointer search-item ${idx === selectedIndex ? 'bg-blue-100' : ''}" 
          data-idx="${idx}" data-id="${p.id}" data-name="${p.name}" 
          data-team="${p.team}" data-position="${p.position}">
          <div class="flex justify-between">
            <div>
              <span class="font-medium">${p.name}</span>
              <span class="text-sm text-gray-600 ml-2">${p.team} · ${p.position}</span>
            </div>
            <span class="text-sm text-gray-500">${p.points ? p.points.toFixed(0) + ' pts' : ''}</span>
          </div>
        </div>
      `).join('');
      
      // Click handlers
      searchResults.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => selectPlayer(el));
      });
    }
    
    searchResults.classList.remove('hidden');
  }
  
  function selectPlayer(element) {
    selectedPlayer = {
      id: element.dataset.id,
      name: element.dataset.name,
      team: element.dataset.team,
      position: element.dataset.position
    };
    
    selectedInfo.textContent = `${selectedPlayer.name} - ${selectedPlayer.team} ${selectedPlayer.position}`;
    
    if (quickMode.checked) {
      // Quick mode - auto confirm with defaults
      confirmDraft();
    } else {
      setPhase('CONFIRM');
    }
  }
  
  function confirmDraft() {
    if (!selectedPlayer) return;
    
    const teamId = parseInt(teamSelect.value);
    const price = parseInt(priceInput.value);
    
    if (!price || price < 1) {
      showToast('Invalid price', 'error');
      return;
    }
    
    // Check if already drafted
    const state = storeBridge.getState();
    const picks = state?.draft?.picks || [];
    if (picks.some(p => p.playerId === selectedPlayer.id)) {
      showToast('Player already drafted!', 'error');
      reset();
      return;
    }
    
    // Add pick
    storeBridge.addPick({
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      teamId,
      price
    });
    
    // Mark as drafted
    const playerIdx = players.findIndex(p => p.id === selectedPlayer.id);
    if (playerIdx >= 0) {
      players[playerIdx].drafted = true;
      storage.set('players', players);
    }
    
    showToast(`Drafted ${selectedPlayer.name} for $${price}`, 'success');
    
    // Store last used values
    draftDetails = { teamId, price: Math.min(price - 1, 1) };
    
    reset();
  }
  
  function reset() {
    selectedPlayer = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
    selectedIndex = -1;
    setPhase('SELECT');
    updateRecentPicks();
  }
  
  function updateRecentPicks() {
    const state = storeBridge.getState();
    const picks = (state?.draft?.picks || []).slice(-5).reverse();
    
    if (picks.length === 0) {
      recentPicks.innerHTML = '<div class="p-2 text-gray-500 text-center">No picks yet</div>';
    } else {
      recentPicks.innerHTML = picks.map((p, idx) => {
        const owner = settings.owners?.find(o => o.id === p.teamId);
        return `
          <div class="px-3 py-2 text-sm">
            <span class="font-medium">${p.playerName}</span>
            <span class="text-gray-600 ml-2">→ ${owner?.team || 'Team ' + p.teamId}</span>
            <span class="text-green-600 ml-2">$${p.price}</span>
          </div>
        `;
      }).join('');
    }
  }
  
  function parseRapidEntry(input) {
    // Try different formats
    // "Patrick Mahomes, 3, 65" or "Mahomes 3 65" or "Mahomes,3,65"
    const parts = input.split(/[,\s]+/).filter(p => p.length > 0);
    if (parts.length < 3) return null;
    
    // Last two should be numbers
    const price = parseInt(parts[parts.length - 1]);
    const teamId = parseInt(parts[parts.length - 2]);
    const nameParts = parts.slice(0, -2);
    const playerName = nameParts.join(' ');
    
    if (!playerName || !teamId || !price) return null;
    
    // Find player
    const player = players.find(p => 
      p.name.toLowerCase().includes(playerName.toLowerCase()) && !p.drafted
    );
    
    if (!player) return null;
    
    return { player, teamId, price };
  }
  
  // Event listeners
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchPlayers(e.target.value), 150);
  });
  
  searchInput.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      items.forEach((item, idx) => {
        item.classList.toggle('bg-blue-100', idx === selectedIndex);
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      items.forEach((item, idx) => {
        item.classList.toggle('bg-blue-100', idx === selectedIndex);
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        selectPlayer(items[selectedIndex]);
      } else if (items.length === 1) {
        selectPlayer(items[0]);
      }
    }
  });
  
  confirmBtn.addEventListener('click', confirmDraft);
  cancelBtn.addEventListener('click', reset);
  resetBtn.addEventListener('click', reset);
  
  priceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmDraft();
  });
  
  // Rapid entry
  rapidBtn.addEventListener('click', () => {
    const parsed = parseRapidEntry(rapidInput.value);
    if (!parsed) {
      showToast('Invalid format or player not found', 'error');
      return;
    }
    
    selectedPlayer = parsed.player;
    teamSelect.value = parsed.teamId;
    priceInput.value = parsed.price;
    confirmDraft();
    rapidInput.value = '';
  });
  
  rapidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') rapidBtn.click();
  });
  
  // Subscribe to changes
  storeBridge.subscribe('change', updateRecentPicks);
  
  // Initialize
  setPhase('SELECT');
  updateRecentPicks();
}