/**
 * VBD Scatter Plot Visualization Widget
 * Interactive scatter plots showing VBD vs Position Rank for QB, RB, WR, TE
 * Uses Canvas API for performance with 300+ players
 */

import { createStorageAdapter } from '../adapters/storage.js';
import { calculatePlayerVBD } from '../core/vbd.js';
import { calculateDraftableThresholds, getTopDraftablePlayers } from '../core/draftable.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

// Position colors (consistent across all widgets)
const POSITION_COLORS = {
  QB: '#8B5CF6',  // Purple
  RB: '#10B981',  // Green
  WR: '#3B82F6',  // Blue
  TE: '#F97316',  // Orange
  DST: '#9CA3AF', // Gray
  K: '#D1D5DB'    // Light gray
};

// Chart configuration
const CHART_CONFIG = {
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  dotRadius: 4,
  selectedDotRadius: 7,
  hoveredDotRadius: 5,
  gridColor: '#E5E7EB',
  axisColor: '#6B7280',
  textColor: '#374151',
  selectedColor: '#10B981', // Bright green for selected players
  hoveredAlpha: 0.8,
  animationDuration: 300
};

class VBDScatterChart {
  constructor(canvas, position, data = []) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.position = position;
    this.data = data;
    this.selectedPlayerId = null;
    this.hoveredPlayerId = null;
    
    // Set up canvas
    this.setupCanvas();
    this.setupEventListeners();
    
    // Calculate scales
    this.updateScales();
  }
  
  setupCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Ensure minimum size for visibility
    const minWidth = 200;
    const minHeight = 80;
    const width = Math.max(minWidth, rect.width);
    const height = Math.max(minHeight, rect.height);
    
    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;
    
    // Chart dimensions with tighter padding for small charts
    const padding = {
      top: Math.min(CHART_CONFIG.padding.top, height * 0.1),
      right: Math.min(CHART_CONFIG.padding.right, width * 0.05), 
      bottom: Math.min(CHART_CONFIG.padding.bottom, height * 0.2),
      left: Math.min(CHART_CONFIG.padding.left, width * 0.1)
    };
    
    this.chartWidth = this.width - padding.left - padding.right;
    this.chartHeight = this.height - padding.top - padding.bottom;
    this.chartX = padding.left;
    this.chartY = padding.top;
  }
  
  setupEventListeners() {
    let isMouseDown = false;
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (isMouseDown) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const playerId = this.getPlayerAtPoint(x, y);
      
      // Update hover state if changed
      if (playerId !== this.hoveredPlayerId) {
        this.hoveredPlayerId = playerId;
        this.render();
      }
      
      // Always show/hide tooltip based on current hover state
      if (playerId) {
        const player = this.data.find(p => p.id === playerId);
        this.showHoverTooltip(e, player);
      } else {
        this.hideHoverTooltip();
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredPlayerId = null;
      this.hideHoverTooltip();
      this.render();
    });
    
    this.canvas.addEventListener('mousedown', () => {
      isMouseDown = true;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const playerId = this.getPlayerAtPoint(x, y);
      if (playerId) {
        this.selectPlayer(playerId);
        
        // Emit selection event for cross-widget sync
        const player = this.data.find(p => p.id === playerId);
        if (player) {
          window.dispatchEvent(new CustomEvent('player:selected', {
            detail: { player, source: 'vbdScatter' }
          }));
        }
      }
    });
  }
  
  updateScales() {
    if (!this.data.length) return;
    
    // X scale: Position rank (1 to data.length)
    this.xMin = 1;
    this.xMax = Math.max(this.data.length, 1);
    
    // Y scale: VBD values with padding
    const vbdValues = this.data.map(p => p.vbd || 0);
    const minVBD = Math.min(...vbdValues);
    const maxVBD = Math.max(...vbdValues);
    const vbdRange = maxVBD - minVBD;
    const padding = vbdRange * 0.1; // 10% padding
    
    this.yMin = minVBD - padding;
    this.yMax = maxVBD + padding;
  }
  
  getPlayerAtPoint(x, y) {
    const threshold = CHART_CONFIG.dotRadius + 2; // Click tolerance
    
    for (const player of this.data) {
      const px = this.getXPixel(player.positionRank);
      const py = this.getYPixel(player.vbd || 0);
      
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance <= threshold) {
        return player.id;
      }
    }
    
    return null;
  }
  
  getXPixel(rank) {
    const ratio = (rank - this.xMin) / (this.xMax - this.xMin);
    return this.chartX + ratio * this.chartWidth;
  }
  
  getYPixel(vbd) {
    const ratio = (vbd - this.yMin) / (this.yMax - this.yMin);
    return this.chartY + this.chartHeight - ratio * this.chartHeight;
  }
  
  selectPlayer(playerId) {
    // Update global selected player
    globalSelectedPlayerId = playerId;
    this.selectedPlayerId = playerId;
    this.render();
    this.updateSelectedPlayerPanel();
    
    // Update all other charts
    const allCanvases = document.querySelectorAll('canvas[id^="vbd-chart-"]');
    allCanvases.forEach(canvas => {
      const chart = canvas._chart;
      if (chart && chart !== this) {
        chart.updateFromGlobalSelection();
      }
    });
  }
  
  // Method to update from global state
  updateFromGlobalSelection() {
    this.selectedPlayerId = globalSelectedPlayerId;
    this.render();
  }
  
  // Hover tooltip that follows cursor
  showHoverTooltip(event, player) {
    if (!player) return;
    
    let tooltip = document.getElementById('vbd-hover-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'vbd-hover-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.backgroundColor = '#1f2937';
      tooltip.style.color = 'white';
      tooltip.style.fontSize = '12px';
      tooltip.style.borderRadius = '8px';
      tooltip.style.padding = '8px 12px';
      tooltip.style.zIndex = '1000';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      tooltip.style.border = '1px solid #374151';
      tooltip.style.maxWidth = '180px';
      tooltip.style.whiteSpace = 'nowrap';
      document.body.appendChild(tooltip);
    }
    
    const vbd = (player.vbd || 0).toFixed(1);
    const points = (player.points || 0).toFixed(1);
    
    // Minimal hover tooltip - Robinhood style with inline styles
    tooltip.innerHTML = `
      <div style="font-weight: 500; color: white; line-height: 1.2;">${player.name}</div>
      <div style="color: #d1d5db; font-size: 11px; margin-top: 2px;">${player.team} · ${player.position}</div>
      <div style="color: #d1d5db; font-size: 11px; margin-top: 4px;">VBD ${vbd}</div>
    `;
    
    // Position near cursor with offset, accounting for page scroll
    const rect = this.canvas.getBoundingClientRect();
    tooltip.style.left = (rect.left + event.offsetX + 15) + 'px';
    tooltip.style.top = (rect.top + event.offsetY - 10) + 'px';
    tooltip.style.display = 'block';
  }
  
  hideHoverTooltip() {
    const tooltip = document.getElementById('vbd-hover-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
  
  // Remove fixed selected player panel (causes display issues in dashboard)
  updateSelectedPlayerPanel() {
    // Hide any existing panel
    const panel = document.getElementById('vbd-selected-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
  
  updateData(newData) {
    this.data = newData;
    this.updateScales();
    this.render();
  }
  
  render() {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.width, this.height);
    
    if (!this.data.length) {
      this.renderEmptyState();
      return;
    }
    
    // Draw grid
    this.drawGrid();
    
    // Draw axes
    this.drawAxes();
    
    // Draw trend line
    this.drawTrendLine();
    
    // Draw data points
    this.drawDataPoints();
    
    // Draw title
    this.drawTitle();
  }
  
  renderEmptyState() {
    const ctx = this.ctx;
    ctx.fillStyle = CHART_CONFIG.textColor;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `No ${this.position} players available`,
      this.width / 2,
      this.height / 2
    );
  }
  
  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = CHART_CONFIG.gridColor;
    ctx.lineWidth = 1;
    
    // Vertical grid lines (rank)
    const xTicks = Math.min(10, this.xMax);
    for (let i = 1; i <= xTicks; i++) {
      const x = this.getXPixel(i);
      ctx.beginPath();
      ctx.moveTo(x, this.chartY);
      ctx.lineTo(x, this.chartY + this.chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines (VBD)
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const vbd = this.yMin + (this.yMax - this.yMin) * (i / yTicks);
      const y = this.getYPixel(vbd);
      ctx.beginPath();
      ctx.moveTo(this.chartX, y);
      ctx.lineTo(this.chartX + this.chartWidth, y);
      ctx.stroke();
    }
  }
  
  drawAxes() {
    const ctx = this.ctx;
    ctx.strokeStyle = CHART_CONFIG.axisColor;
    ctx.fillStyle = CHART_CONFIG.textColor;
    ctx.lineWidth = 2;
    ctx.font = '12px sans-serif';
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(this.chartX, this.chartY + this.chartHeight);
    ctx.lineTo(this.chartX + this.chartWidth, this.chartY + this.chartHeight);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(this.chartX, this.chartY);
    ctx.lineTo(this.chartX, this.chartY + this.chartHeight);
    ctx.stroke();
    
    // X-axis labels (ranks)
    ctx.textAlign = 'center';
    const labelCount = Math.min(5, this.xMax);
    for (let i = 1; i <= labelCount; i++) {
      const rank = Math.ceil((this.xMax / labelCount) * i);
      const x = this.getXPixel(rank);
      ctx.fillText(rank.toString(), x, this.chartY + this.chartHeight + 15);
    }
    
    // Y-axis labels (VBD)
    ctx.textAlign = 'right';
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const vbd = this.yMin + (this.yMax - this.yMin) * (i / yTicks);
      const y = this.getYPixel(vbd);
      ctx.fillText(vbd.toFixed(0), this.chartX - 5, y + 3);
    }
    
    // Axis labels
    ctx.textAlign = 'center';
    ctx.fillText('Position Rank', this.chartX + this.chartWidth / 2, this.height - 5);
    
    ctx.save();
    ctx.translate(15, this.chartY + this.chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('VBD', 0, 0);
    ctx.restore();
  }
  
  drawTrendLine() {
    if (this.data.length < 2) return;
    
    const ctx = this.ctx;
    ctx.strokeStyle = POSITION_COLORS[this.position] + '40'; // 25% opacity
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    this.data.forEach((player, index) => {
      const x = this.getXPixel(player.positionRank);
      const y = this.getYPixel(player.vbd || 0);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }
  
  drawDataPoints() {
    const ctx = this.ctx;
    
    this.data.forEach(player => {
      const x = this.getXPixel(player.positionRank);
      const y = this.getYPixel(player.vbd || 0);
      
      // Determine dot appearance
      let radius = CHART_CONFIG.dotRadius;
      let fillColor = POSITION_COLORS[this.position];
      let strokeColor = fillColor;
      let strokeWidth = 1;
      
      if (player.id === this.selectedPlayerId) {
        radius = CHART_CONFIG.selectedDotRadius;
        fillColor = CHART_CONFIG.selectedColor; // Green fill for selected
        strokeColor = CHART_CONFIG.selectedColor;
        strokeWidth = 2;
      } else if (player.id === this.hoveredPlayerId) {
        radius = CHART_CONFIG.hoveredDotRadius;
        ctx.globalAlpha = CHART_CONFIG.hoveredAlpha;
      }
      
      // Draw dot
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    });
  }
  
  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = CHART_CONFIG.textColor;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    
    const title = `${this.position} (${this.data.length})`;
    ctx.fillText(title, this.chartX + this.chartWidth / 2, 15);
  }
}

// Global state for selected player across all charts
let globalSelectedPlayerId = null;

/**
 * VBD Scatter Plot Widget
 */
export function initVBDScatterWidget(container) {
  if (!container) return;
  
  let charts = new Map();
  let currentData = null;
  let showStartersOnly = false;
  
  function loadData() {
    const settings = storage.get('leagueSettings') || { 
      teams: 12, 
      roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 } 
    };
    const players = storage.get('players') || [];
    const state = storage.get('state') || { draft: { picks: [] } };
    
    return { settings, players, state };
  }
  
  function calculateVBDData() {
    const { settings, players, state } = loadData();
    
    // Calculate draftable thresholds
    const draftableThresholds = calculateDraftableThresholds(settings, state.draft.picks);
    
    // Calculate VBD for all players
    const league = { teams: Number(settings.teams) || 12, starters: settings.roster || {} };
    const playersWithVBD = calculatePlayerVBD(players, league);
    
    // Get top draftable players for each position
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const positionData = {};
    
    positions.forEach(position => {
      const threshold = draftableThresholds[position];
      if (threshold && threshold.count > 0) {
        let targetCount = threshold.count;
        
        // If starters-only mode, calculate starter count only
        if (showStartersOnly) {
          const starters = settings.roster[position] || 0;
          const drafted = state.draft.picks.filter(pick => {
            const player = playersWithVBD.find(p => p.id === pick.playerId);
            return player && player.position === position;
          }).length;
          targetCount = Math.max(0, (settings.teams * starters) - drafted);
        }
        
        positionData[position] = getTopDraftablePlayers(
          playersWithVBD, 
          position, 
          targetCount
        );
      } else {
        positionData[position] = [];
      }
    });
    
    return positionData;
  }
  
  function render() {
    const data = calculateVBDData();
    currentData = data;
    
    // Update each chart
    charts.forEach((chart, position) => {
      chart.updateData(data[position] || []);
    });
  }
  
  function setup() {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col relative">
        <!-- Overlaid Toggle Control -->
        <div class="absolute top-2 right-2 z-10">
          <label class="flex items-center gap-2 text-xs bg-white bg-opacity-90 rounded px-2 py-1 shadow-sm border">
            <input 
              id="vbd-starters-only" 
              type="checkbox" 
              class="rounded border-gray-300"
              style="width: 12px; height: 12px;"
              ${showStartersOnly ? 'checked' : ''}
            />
            <span class="text-gray-700">Starters Only</span>
          </label>
        </div>
        
        <!-- Charts Rows -->
        <div class="flex-1 flex flex-col gap-1 p-2" style="min-height: 400px;">
          <div class="flex-1 border border-gray-200 rounded bg-white relative" style="min-height: 90px;">
            <div class="absolute inset-0 flex items-center justify-center">
              <canvas id="vbd-chart-QB" class="w-full h-full" style="max-height: 100%;"></canvas>
            </div>
          </div>
          <div class="flex-1 border border-gray-200 rounded bg-white relative" style="min-height: 90px;">
            <div class="absolute inset-0 flex items-center justify-center">
              <canvas id="vbd-chart-RB" class="w-full h-full" style="max-height: 100%;"></canvas>
            </div>
          </div>
          <div class="flex-1 border border-gray-200 rounded bg-white relative" style="min-height: 90px;">
            <div class="absolute inset-0 flex items-center justify-center">
              <canvas id="vbd-chart-WR" class="w-full h-full" style="max-height: 100%;"></canvas>
            </div>
          </div>
          <div class="flex-1 border border-gray-200 rounded bg-white relative" style="min-height: 90px;">
            <div class="absolute inset-0 flex items-center justify-center">
              <canvas id="vbd-chart-TE" class="w-full h-full" style="max-height: 100%;"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize charts
    ['QB', 'RB', 'WR', 'TE'].forEach(position => {
      const canvas = document.getElementById(`vbd-chart-${position}`);
      if (canvas) {
        const chart = new VBDScatterChart(canvas, position);
        charts.set(position, chart);
        // Store reference for global selection updates
        canvas._chart = chart;
        
        // Add resize observer to redraw on size changes
        if (window.ResizeObserver) {
          const observer = new ResizeObserver(() => {
            setTimeout(() => {
              chart.setupCanvas();
              chart.updateScales();
              chart.render();
            }, 10);
          });
          observer.observe(canvas.parentElement);
        }
      }
    });
    
    // Set up toggle event listener
    const startersToggle = document.getElementById('vbd-starters-only');
    if (startersToggle) {
      startersToggle.addEventListener('change', (e) => {
        showStartersOnly = e.target.checked;
        render();
      });
    }
    
    // Initial render
    render();
  }
  
  // Handle cross-widget synchronization
  function handlePlayerSelection(event) {
    if (event.detail.source === 'vbdScatter') return; // Ignore our own events
    
    const playerId = event.detail.player?.id;
    globalSelectedPlayerId = playerId;
    
    charts.forEach(chart => {
      chart.updateFromGlobalSelection();
    });
    
    // Update selected player panel for any chart (they share the same panel)
    if (charts.size > 0) {
      const firstChart = charts.values().next().value;
      firstChart.updateSelectedPlayerPanel();
    }
  }
  
  // Event listeners
  window.addEventListener('player:selected', handlePlayerSelection);
  window.addEventListener('workspace:players-changed', render);
  window.addEventListener('workspace:state-changed', render);
  
  // Cleanup function
  function destroy() {
    window.removeEventListener('player:selected', handlePlayerSelection);
    window.removeEventListener('workspace:players-changed', render);
    window.removeEventListener('workspace:state-changed', render);
    
    // Remove tooltips and panels if they exist
    const hoverTooltip = document.getElementById('vbd-hover-tooltip');
    if (hoverTooltip) {
      hoverTooltip.remove();
    }
    
    const selectedPanel = document.getElementById('vbd-selected-panel');
    if (selectedPanel) {
      selectedPanel.remove();
    }
    
    charts.clear();
  }
  
  // Window resize handler
  function handleResize() {
    setTimeout(() => {
      charts.forEach(chart => {
        chart.setupCanvas();
        chart.updateScales();
        chart.render();
      });
    }, 100);
  }
  
  window.addEventListener('resize', handleResize);
  
  // Initialize
  setup();
  
  return { destroy, render, getCurrentData: () => currentData };
}