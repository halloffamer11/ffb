/**
 * Player Search Component (T-015)
 * Unified search component that integrates fuzzy search with hover preview
 * and player selection for dashboard integration
 */

import { FuzzySearch } from '../core/search.js';
import { createStorageAdapter } from '../adapters/storage.js';

/**
 * Create a player search component
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Component options
 * @returns {Object} Component API
 */
export function createSearchComponent(container, options = {}) {
  const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });
  
  // Component state
  let players = [];
  let search = null;
  let selectedPlayer = null;
  let showDrafted = options.showDrafted ?? false;
  let positionFilter = options.positionFilter || 'All';
  let onSelect = options.onSelect || (() => {});
  let hoverPreviewEnabled = options.hoverPreview ?? true;
  
  // UI elements
  let searchInput, resultsContainer, hoverDiv;
  let selectedIndex = -1;
  
  // Injury status display
  const INJURY_COLORS = {
    0: '', // Healthy
    1: 'text-yellow-600', // Q
    2: 'text-orange-600', // D
    3: 'text-red-600', // O
    4: 'text-red-800', // IR
    5: 'text-red-600', // PUP
    6: 'text-gray-600' // NA
  };
  
  const INJURY_LABELS = {
    0: 'Healthy',
    1: 'Q',
    2: 'D',
    3: 'O',
    4: 'IR',
    5: 'PUP',
    6: 'NA'
  };
  
  /**
   * Initialize the component
   */
  function init() {
    loadPlayers();
    render();
    attachEventListeners();
  }
  
  /**
   * Load players from storage
   */
  function loadPlayers() {
    players = storage.get('players') || [];
    search = new FuzzySearch(players);
  }
  
  /**
   * Render the component UI
   */
  function render() {
    container.innerHTML = `
      <div class="player-search-component">
        <!-- Search Input -->
        <div class="mb-4">
          <input 
            type="text" 
            id="searchInput"
            placeholder="Search players (fuzzy matching enabled)..."
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- Filters -->
        <div class="flex gap-4 mb-4">
          <div class="flex items-center gap-2">
            <label class="text-sm">Position:</label>
            <select id="positionFilter" class="border rounded px-2 py-1 text-sm">
              <option>All</option>
              <option>QB</option>
              <option>RB</option>
              <option>WR</option>
              <option>TE</option>
              <option>K</option>
              <option>DST</option>
            </select>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" id="showDrafted" ${showDrafted ? 'checked' : ''}>
            <label for="showDrafted" class="text-sm">Show Drafted</label>
          </div>
          
          <div class="text-sm text-slate-600">
            <span id="resultCount">0</span> results
          </div>
        </div>
        
        <!-- Search Results -->
        <div id="searchResults" class="max-h-96 overflow-auto border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-slate-100 sticky top-0">
              <tr>
                <th class="text-left p-2">Name</th>
                <th class="text-left p-2">Team</th>
                <th class="text-left p-2">Pos</th>
                <th class="text-left p-2">Points</th>
                <th class="text-left p-2">VBD</th>
                <th class="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody id="resultsBody"></tbody>
          </table>
        </div>
        
        <!-- Selected Player -->
        <div id="selectedDisplay" class="mt-4 p-3 bg-blue-50 rounded-lg hidden">
          <div class="text-sm font-medium">Selected:</div>
          <div id="selectedInfo" class="text-lg"></div>
        </div>
      </div>
    `;
    
    // Get references to elements
    searchInput = container.querySelector('#searchInput');
    resultsContainer = container.querySelector('#resultsBody');
  }
  
  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Search input with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => performSearch(e.target.value), 150);
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeyboard);
    
    // Position filter
    container.querySelector('#positionFilter').addEventListener('change', (e) => {
      positionFilter = e.target.value;
      performSearch(searchInput.value);
    });
    
    // Show drafted toggle
    container.querySelector('#showDrafted').addEventListener('change', (e) => {
      showDrafted = e.target.checked;
      performSearch(searchInput.value);
    });
    
    // Listen for workspace changes
    window.addEventListener('workspace:players-changed', () => {
      loadPlayers();
      performSearch(searchInput.value);
    });
  }
  
  /**
   * Perform search
   */
  function performSearch(query) {
    const startTime = performance.now();
    
    // Get search results
    let results = query.trim() ? search.search(query) : players;
    
    // Apply filters
    if (positionFilter !== 'All') {
      results = results.filter(p => p.position === positionFilter);
    }
    
    if (!showDrafted) {
      results = results.filter(p => !p.drafted);
    }
    
    // Sort by VBD if available, else by points
    results.sort((a, b) => {
      if (a.vbd !== undefined && b.vbd !== undefined) {
        return b.vbd - a.vbd;
      }
      return (b.points || 0) - (a.points || 0);
    });
    
    // Limit results for performance
    const displayResults = results.slice(0, 50);
    
    // Update UI
    renderResults(displayResults, query);
    
    // Update count
    container.querySelector('#resultCount').textContent = results.length;
    
    // Log performance
    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`Search took ${duration.toFixed(1)}ms`);
    }
  }
  
  /**
   * Render search results
   */
  function renderResults(results, query) {
    resultsContainer.innerHTML = '';
    selectedIndex = -1;
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <tr><td colspan="6" class="p-4 text-center text-slate-500">No results found</td></tr>
      `;
      return;
    }
    
    results.forEach((player, index) => {
      const row = document.createElement('tr');
      row.className = `border-b hover:bg-slate-50 cursor-pointer ${player.drafted ? 'opacity-50' : ''}`;
      
      row.innerHTML = `
        <td class="p-2 font-medium">${highlightMatch(player.name, query)}</td>
        <td class="p-2">${player.team || '-'}</td>
        <td class="p-2">${player.position || '-'}</td>
        <td class="p-2">${player.points?.toFixed(1) || '-'}</td>
        <td class="p-2 ${getVBDColor(player.vbd)}">${player.vbd?.toFixed(1) || '-'}</td>
        <td class="p-2 ${INJURY_COLORS[player.injuryStatus || 0]}">${INJURY_LABELS[player.injuryStatus || 0]}</td>
      `;
      
      // Click to select
      row.addEventListener('click', () => selectPlayer(player, index));
      
      // Hover preview
      if (hoverPreviewEnabled) {
        row.addEventListener('mouseenter', () => showHoverPreview(player, row));
        row.addEventListener('mouseleave', hideHoverPreview);
      }
      
      resultsContainer.appendChild(row);
    });
  }
  
  /**
   * Highlight search match in name
   */
  function highlightMatch(name, query) {
    if (!query) return name;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return name.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }
  
  /**
   * Get VBD color class
   */
  function getVBDColor(vbd) {
    if (vbd === undefined) return '';
    if (vbd > 50) return 'text-green-600 font-medium';
    if (vbd > 20) return 'text-green-500';
    if (vbd > 0) return '';
    return 'text-red-500';
  }
  
  /**
   * Handle keyboard navigation
   */
  function handleKeyboard(e) {
    const rows = resultsContainer.querySelectorAll('tr');
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedIndex < rows.length - 1) {
          selectedIndex++;
          highlightRow(rows[selectedIndex]);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (selectedIndex > 0) {
          selectedIndex--;
          highlightRow(rows[selectedIndex]);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && rows[selectedIndex]) {
          rows[selectedIndex].click();
        }
        break;
    }
  }
  
  /**
   * Highlight selected row
   */
  function highlightRow(row) {
    // Remove previous highlight
    resultsContainer.querySelectorAll('tr').forEach(r => {
      r.classList.remove('bg-blue-100');
    });
    
    // Add highlight to current row
    row.classList.add('bg-blue-100');
    row.scrollIntoView({ block: 'nearest' });
  }
  
  /**
   * Select a player
   */
  function selectPlayer(player, index) {
    selectedPlayer = player;
    selectedIndex = index;
    
    // Update selected display
    const selectedDisplay = container.querySelector('#selectedDisplay');
    const selectedInfo = container.querySelector('#selectedInfo');
    
    selectedDisplay.classList.remove('hidden');
    selectedInfo.innerHTML = `
      <span class="font-medium">${player.name}</span>
      <span class="text-slate-600 ml-2">${player.team} - ${player.position}</span>
      <span class="ml-2">Points: ${player.points?.toFixed(1) || '-'}</span>
      <span class="ml-2">VBD: ${player.vbd?.toFixed(1) || '-'}</span>
    `;
    
    // Highlight row
    const rows = resultsContainer.querySelectorAll('tr');
    if (rows[index]) {
      highlightRow(rows[index]);
    }
    
    // Call callback
    onSelect(player);
    
    // Emit event
    window.dispatchEvent(new CustomEvent('player:selected', { 
      detail: player 
    }));
  }
  
  /**
   * Show hover preview
   */
  function showHoverPreview(player, element) {
    if (!hoverDiv) {
      hoverDiv = document.createElement('div');
      hoverDiv.className = 'fixed z-50 bg-slate-800 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none';
      document.body.appendChild(hoverDiv);
    }
    
    const info = [
      player.name,
      `${player.team} - ${player.position}`,
      `Points: ${player.points?.toFixed(1) || '-'}`,
      `VBD: ${player.vbd?.toFixed(1) || '-'}`,
      player.injuryStatus > 0 ? `Status: ${INJURY_LABELS[player.injuryStatus]}` : ''
    ].filter(Boolean).join(' • ');
    
    hoverDiv.textContent = info;
    hoverDiv.style.display = 'block';
    
    // Position near element
    const rect = element.getBoundingClientRect();
    hoverDiv.style.left = `${rect.left}px`;
    hoverDiv.style.top = `${rect.bottom + 5}px`;
  }
  
  /**
   * Hide hover preview
   */
  function hideHoverPreview() {
    if (hoverDiv) {
      hoverDiv.style.display = 'none';
    }
  }
  
  /**
   * Get selected player
   */
  function getSelected() {
    return selectedPlayer;
  }
  
  /**
   * Clear selection
   */
  function clearSelection() {
    selectedPlayer = null;
    selectedIndex = -1;
    
    const selectedDisplay = container.querySelector('#selectedDisplay');
    if (selectedDisplay) {
      selectedDisplay.classList.add('hidden');
    }
    
    // Remove highlights
    resultsContainer.querySelectorAll('tr').forEach(r => {
      r.classList.remove('bg-blue-100');
    });
  }
  
  /**
   * Refresh data
   */
  function refresh() {
    loadPlayers();
    performSearch(searchInput.value);
  }
  
  // Initialize component
  init();
  
  // Return public API
  return {
    getSelected,
    clearSelection,
    refresh,
    setOnSelect: (fn) => { onSelect = fn; },
    setShowDrafted: (show) => { 
      showDrafted = show;
      container.querySelector('#showDrafted').checked = show;
      performSearch(searchInput.value);
    }
  };
}