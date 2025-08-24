import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";
import WidgetContainer from './WidgetContainer';
import { useDraftStore, useSelectedPlayer } from '../../stores/draftStore';
import { calculatePlayerVBD, calculateBaselines } from '../../core/vbd';
import { calculateDraftableThresholds, getTopDraftablePlayers } from '../../core/draftable';
import { useCanvas } from '../../hooks/useCanvas';
import { useMemoizedCalculation, usePerformanceMonitor } from '../../hooks';
import { WidgetErrorBoundary } from '../../components/ui';
import { Button } from '../../components/ui/Button';

const ChartContainer = styled.div`
  height: 100%;
  padding: ${props => theme('spacing.lg')};
  display: flex;
  flex-direction: column;
  background: ${props => theme('gradients.subtle')};
  position: relative;
`;

const Controls = styled.div`
  display: flex;
  gap: ${props => theme('spacing.sm')};
  margin-bottom: ${props => theme('spacing.lg')};
  align-items: center;
  flex-wrap: wrap;
  background: ${props => theme('gradients.widget')};
  padding: ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.lg')};
  border: 1px solid ${props => theme('colors.border1')};
  
  /* Professional control panel styling */
  box-shadow: ${props => theme('shadows.widgetInset')};
`;

const PositionFilter = styled.button<{ active: boolean }>`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  border: 1px solid ${props => props.active ? theme('colors.accent') : theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.base')};
  background: ${props => props.active ? theme('gradients.accent') : theme('colors.surface2')};
  color: ${props => props.active ? theme('colors.bg') : theme('colors.text2')};
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('animations.buttonHover')};
  position: relative;
  
  /* Professional toggle styling */
  &:hover {
    background: ${props => props.active ? theme('gradients.accentHover') : theme('colors.surface1')};
    color: ${props => props.active ? theme('colors.bg') : theme('colors.text1')};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
    transition: transform ${props => theme('transitions.micro')};
  }
  
  /* Active state indicator */
  ${props => props.active && `
    box-shadow: 0 0 8px ${theme('colors.accent')}40;
    
    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: ${theme('borderRadius.base')};
      background: ${theme('colors.accent')};
      opacity: 0.1;
      pointer-events: none;
    }
  `}
`;

const ChartWrapper = styled.div`
  flex: 1;
  height: calc(100% - 80px);
  position: relative;
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  overflow: hidden;
  
  /* Professional chart container */
  box-shadow: ${props => theme('shadows.widgetInset')};
  
  canvas {
    cursor: crosshair;
    background: ${props => theme('colors.surface1')};
    transition: ${props => theme('transitions.fast')};
    
    &:hover {
      filter: brightness(1.02);
    }
  }
`;

// Position colors (consistent with vanilla JS implementation)
const POSITION_COLORS = {
  QB: '#8B5CF6',  // Purple
  RB: '#10B981',  // Green
  WR: '#3B82F6',  // Blue
  TE: '#F97316',  // Orange
};

// Professional Chart Configuration
const CHART_CONFIG = {
  padding: { top: 32, right: 32, bottom: 60, left: 80 },
  dotRadius: 5,
  selectedDotRadius: 8,
  hoveredDotRadius: 6,
  gridColor: 'rgba(255, 255, 255, 0.08)',
  gridSecondaryColor: 'rgba(255, 255, 255, 0.04)',
  axisColor: 'rgba(255, 255, 255, 0.4)',
  textColor: 'rgba(255, 255, 255, 0.7)',
  labelColor: 'rgba(255, 255, 255, 0.9)',
  selectedColor: '#ccff00',
  hoveredAlpha: 0.8,
  backgroundOverlay: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, transparent 100%)',
  
  // Professional typography
  fonts: {
    axis: '11px system-ui, sans-serif',
    label: '12px system-ui, sans-serif',
    title: '14px system-ui, sans-serif'
  },
  
  // Animation timing
  animationDuration: 300
};

interface PlayerData {
  id: string;
  name: string;
  position: string;
  team?: string;
  points?: number;
  vbd: number;
  positionRank: number;
  injuryStatus?: number;
  drafted?: boolean;
  adp?: number;
}


// Memoized VBDScatterWidget with Canvas optimization
interface VBDScatterWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const VBDScatterWidget = React.memo(({ editMode = false, onRemove }: VBDScatterWidgetProps) => {
  const { players, picks, settings, setSelectedPlayer } = useDraftStore();
  const selectedPlayer = useSelectedPlayer();
  const [selectedPositions, setSelectedPositions] = React.useState(['QB', 'RB', 'WR', 'TE']);
  const [hoveredPlayer, setHoveredPlayer] = React.useState<PlayerData | null>(null);
  const hoveredPlayerRef = useRef<PlayerData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring
  const renderCount = usePerformanceMonitor('VBDScatterWidget');
  
  // ULTRA-STABLE VBD calculations with aggressive memoization
  const vbdData = useMemoizedCalculation(() => {
    if (!players.length || !settings) return {};
    
    console.debug('[VBD] Recalculating VBD data - this should be RARE');
    
    const leagueConfig = {
      teams: Number(settings.teams) || 12,
      starters: settings.roster || { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 }
    };
    
    // Calculate VBD for all players
    const playersWithVBD = calculatePlayerVBD(players, leagueConfig);
    
    // Get draftable thresholds
    const draftableThresholds = calculateDraftableThresholds(settings, picks);
    
    const positionData: { [key: string]: PlayerData[] } = {};
    
    ['QB', 'RB', 'WR', 'TE'].forEach(position => {
      const threshold = draftableThresholds[position];
      if (threshold && threshold.count > 0) {
        const topPlayers = getTopDraftablePlayers(playersWithVBD, position, threshold.count);
        positionData[position] = topPlayers.map(player => ({
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          points: player.points,
          vbd: player.vbd,
          positionRank: player.positionRank,
          injuryStatus: player.injuryStatus,
          drafted: player.drafted,
          adp: player.adp
        }));
      } else {
        positionData[position] = [];
      }
    });
    
    return positionData;
  }, [
    players.length,
    picks.length,
    JSON.stringify(settings),
    // Create stable hash of player data to prevent recalculation on selection
    players.map(p => `${p.id}-${p.drafted}-${p.points}`).join(',')
  ], 'ULTRA-STABLE VBD data calculation');
  
  const togglePosition = (position: string) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter(p => p !== position));
    } else {
      setSelectedPositions([...selectedPositions, position]);
    }
  };
  
  // Get all data for selected positions
  const chartData = useMemo(() => {
    const data: PlayerData[] = [];
    selectedPositions.forEach(position => {
      if (vbdData[position]) {
        data.push(...vbdData[position]);
      }
    });
    return data;
  }, [vbdData, selectedPositions]);
  
  // Calculate chart scales - ULTRA-STABLE scales that resist recalculation
  const scales = useMemo(() => {
    if (!chartData.length) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    
    const xMax = Math.max(...chartData.map(p => p.positionRank), 1);
    const vbdValues = chartData.map(p => p.vbd);
    const yMin = Math.min(...vbdValues);
    const yMax = Math.max(...vbdValues);
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.1;
    
    // ULTRA-STABLE: Create a stable hash of the data to prevent recalculation on same values
    const dataHash = `${chartData.length}-${xMax}-${yMin.toFixed(2)}-${yMax.toFixed(2)}`;
    
    const stableScales = {
      xMin: 1,
      xMax,
      yMin: yMin - yPadding,
      yMax: yMax + yPadding,
      _hash: dataHash // Internal hash for debugging
    };
    
    console.debug(`[VBD] Scales calculated: Y[${stableScales.yMin.toFixed(1)} to ${stableScales.yMax.toFixed(1)}] hash:${dataHash}`);
    return stableScales;
  }, [
    chartData.length,
    // Only depend on the actual data values, not array references
    chartData.map(p => `${p.id}-${p.vbd}-${p.positionRank}`).join(',')
  ]);
  
  // Canvas drawing function
  const drawChart = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    const chartWidth = width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
    const chartHeight = height - CHART_CONFIG.padding.top - CHART_CONFIG.padding.bottom;
    const chartX = CHART_CONFIG.padding.left;
    const chartY = CHART_CONFIG.padding.top;
    
    // Professional dark background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#121214');
    gradient.addColorStop(1, '#0f0f10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle overlay pattern
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(255,255,255,0.01)');
    overlayGradient.addColorStop(0.5, 'transparent');
    overlayGradient.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);
    
    if (!chartData.length) {
      // Professional empty state
      ctx.fillStyle = CHART_CONFIG.textColor;
      ctx.font = CHART_CONFIG.fonts.title;
      ctx.textAlign = 'center';
      ctx.fillText('No VBD data available', width / 2, height / 2 - 10);
      
      ctx.font = CHART_CONFIG.fonts.label;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Select positions above to view analysis', width / 2, height / 2 + 15);
      return;
    }
    
    // Helper functions for pixel conversion
    const getXPixel = (rank: number) => {
      const ratio = (rank - scales.xMin) / (scales.xMax - scales.xMin);
      return chartX + ratio * chartWidth;
    };
    
    const getYPixel = (vbd: number) => {
      const ratio = (vbd - scales.yMin) / (scales.yMax - scales.yMin);
      return chartY + chartHeight - ratio * chartHeight;
    };
    
    // Professional grid system with primary and secondary lines
    ctx.lineWidth = 0.5;
    
    // Secondary grid (finer)
    ctx.strokeStyle = CHART_CONFIG.gridSecondaryColor;
    
    // Vertical grid lines (secondary)
    const xTicks = Math.min(15, scales.xMax);
    for (let i = 1; i <= xTicks; i++) {
      const x = getXPixel(i);
      ctx.beginPath();
      ctx.moveTo(x, chartY);
      ctx.lineTo(x, chartY + chartHeight);
      ctx.stroke();
    }
    
    // Primary vertical grid lines (every 5th)
    ctx.strokeStyle = CHART_CONFIG.gridColor;
    ctx.lineWidth = 1;
    for (let i = 5; i <= xTicks; i += 5) {
      const x = getXPixel(i);
      ctx.beginPath();
      ctx.moveTo(x, chartY);
      ctx.lineTo(x, chartY + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines (secondary)
    ctx.strokeStyle = CHART_CONFIG.gridSecondaryColor;
    ctx.lineWidth = 0.5;
    const yTicks = 8;
    for (let i = 0; i <= yTicks; i++) {
      const vbd = scales.yMin + (scales.yMax - scales.yMin) * (i / yTicks);
      const y = getYPixel(vbd);
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }
    
    // Primary horizontal grid lines
    ctx.strokeStyle = CHART_CONFIG.gridColor;
    ctx.lineWidth = 1;
    const primaryYTicks = 4;
    for (let i = 0; i <= primaryYTicks; i++) {
      const vbd = scales.yMin + (scales.yMax - scales.yMin) * (i / primaryYTicks);
      const y = getYPixel(vbd);
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }
    
    // Professional axes with enhanced styling
    ctx.strokeStyle = CHART_CONFIG.axisColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.stroke();
    
    // Professional VBD = 0 reference line
    const zeroY = getYPixel(0);
    if (zeroY >= chartY && zeroY <= chartY + chartHeight) {
      ctx.strokeStyle = CHART_CONFIG.selectedColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(chartX, zeroY);
      ctx.lineTo(chartX + chartWidth, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
      
      // VBD = 0 label
      ctx.fillStyle = CHART_CONFIG.selectedColor;
      ctx.font = CHART_CONFIG.fonts.label;
      ctx.textAlign = 'left';
      ctx.fillText('VBD = 0', chartX + 10, zeroY - 5);
    }
    
    // Draw data points
    chartData.forEach(player => {
      const x = getXPixel(player.positionRank);
      const y = getYPixel(player.vbd);
      
      let radius = CHART_CONFIG.dotRadius;
      let fillColor = POSITION_COLORS[player.position as keyof typeof POSITION_COLORS] || '#666';
      let strokeColor = fillColor;
      let strokeWidth = 1.5;
      let glowRadius = 0;
      
      // Professional selection and hover states
      if (selectedPlayer && selectedPlayer.id === player.id) {
        radius = CHART_CONFIG.selectedDotRadius;
        fillColor = CHART_CONFIG.selectedColor;
        strokeColor = CHART_CONFIG.selectedColor;
        strokeWidth = 3;
        glowRadius = 12;
        
        // Glow effect for selected point
        ctx.shadowColor = CHART_CONFIG.selectedColor;
        ctx.shadowBlur = glowRadius;
      } else if (hoveredPlayerRef.current && hoveredPlayerRef.current.id === player.id) {
        radius = CHART_CONFIG.hoveredDotRadius;
        strokeWidth = 2;
        glowRadius = 6;
        
        // Subtle glow for hovered point
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = glowRadius;
      }
      
      // Drafted player styling
      if (player.drafted) {
        ctx.globalAlpha = 0.3;
        strokeWidth = 1;
        radius = CHART_CONFIG.dotRadius - 1;
      }
      
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      // Professional dot rendering with enhanced visuals
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Reset shadow and alpha
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      
      // Add subtle inner highlight for non-drafted players
      if (!player.drafted) {
        ctx.beginPath();
        ctx.arc(x, y - 1, Math.max(1, radius - 2), 0, Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    
    // Professional axis labels with better typography
    ctx.fillStyle = CHART_CONFIG.labelColor;
    ctx.font = CHART_CONFIG.fonts.label;
    ctx.textAlign = 'center';
    
    // Professional X-axis labels
    const labelCount = Math.min(8, Math.floor(scales.xMax / 5));
    for (let i = 1; i <= labelCount; i++) {
      const rank = Math.ceil((scales.xMax / labelCount) * i);
      const x = getXPixel(rank);
      ctx.fillText(rank.toString(), x, chartY + chartHeight + 20);
    }
    
    // X-axis minor ticks
    ctx.strokeStyle = CHART_CONFIG.axisColor;
    ctx.lineWidth = 1;
    for (let i = 1; i <= labelCount; i++) {
      const rank = Math.ceil((scales.xMax / labelCount) * i);
      const x = getXPixel(rank);
      ctx.beginPath();
      ctx.moveTo(x, chartY + chartHeight);
      ctx.lineTo(x, chartY + chartHeight + 5);
      ctx.stroke();
    }
    
    // Professional Y-axis labels
    ctx.textAlign = 'right';
    ctx.font = CHART_CONFIG.fonts.axis;
    const yAxisTicks = 6;
    for (let i = 0; i <= yAxisTicks; i++) {
      const vbd = scales.yMin + (scales.yMax - scales.yMin) * (i / yAxisTicks);
      const y = getYPixel(vbd);
      const label = vbd >= 0 ? `+${vbd.toFixed(0)}` : vbd.toFixed(0);
      ctx.fillText(label, chartX - 10, y + 4);
      
      // Y-axis minor ticks
      ctx.strokeStyle = CHART_CONFIG.axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX - 5, y);
      ctx.lineTo(chartX, y);
      ctx.stroke();
    }
    
    // Professional axis titles
    ctx.fillStyle = CHART_CONFIG.labelColor;
    ctx.font = CHART_CONFIG.fonts.title;
    ctx.textAlign = 'center';
    ctx.fillText('Position Rank', chartX + chartWidth / 2, height - 15);
    
    // Y-axis title with professional rotation
    ctx.save();
    ctx.translate(25, chartY + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = CHART_CONFIG.fonts.title;
    ctx.fillText('Value Based Drafting (VBD)', 0, 0);
    ctx.restore();
    
    // Performance indicator
    const performanceText = `${chartData.length} players • Updated ${new Date().toLocaleTimeString()}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = CHART_CONFIG.fonts.axis;
    ctx.textAlign = 'right';
    ctx.fillText(performanceText, width - 10, 15);
  }, [chartData, scales, selectedPlayer]);
  
  // Mouse event handlers
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked player
    const threshold = CHART_CONFIG.dotRadius + 2;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const chartWidth = width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
    const chartHeight = height - CHART_CONFIG.padding.top - CHART_CONFIG.padding.bottom;
    const chartX = CHART_CONFIG.padding.left;
    const chartY = CHART_CONFIG.padding.top;
    
    const getXPixel = (rank: number) => {
      const ratio = (rank - scales.xMin) / (scales.xMax - scales.xMin);
      return chartX + ratio * chartWidth;
    };
    
    const getYPixel = (vbd: number) => {
      const ratio = (vbd - scales.yMin) / (scales.yMax - scales.yMin);
      return chartY + chartHeight - ratio * chartHeight;
    };
    
    for (const player of chartData) {
      const px = getXPixel(player.positionRank);
      const py = getYPixel(player.vbd);
      
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance <= threshold) {
        console.debug(`[VBD] Player selected: ${player.name} (${player.position}) - VBD: ${player.vbd}`);
        setSelectedPlayer(player);
        
        // Emit event for legacy widget compatibility
        window.dispatchEvent(new CustomEvent('player:selected', {
          detail: { player, source: 'vbdScatter' }
        }));
        break;
      }
    }
  }, [chartData, scales, setSelectedPlayer]);
  
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip || !chartData.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find hovered player
    const threshold = CHART_CONFIG.dotRadius + 2;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const chartWidth = width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
    const chartHeight = height - CHART_CONFIG.padding.top - CHART_CONFIG.padding.bottom;
    const chartX = CHART_CONFIG.padding.left;
    const chartY = CHART_CONFIG.padding.top;
    
    const getXPixel = (rank: number) => {
      const ratio = (rank - scales.xMin) / (scales.xMax - scales.xMin);
      return chartX + ratio * chartWidth;
    };
    
    const getYPixel = (vbd: number) => {
      const ratio = (vbd - scales.yMin) / (scales.yMax - scales.yMin);
      return chartY + chartHeight - ratio * chartHeight;
    };
    
    let foundPlayer: PlayerData | null = null;
    
    for (const player of chartData) {
      const px = getXPixel(player.positionRank);
      const py = getYPixel(player.vbd);
      
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance <= threshold) {
        foundPlayer = player;
        break;
      }
    }
    
    // Only update hover state if it actually changed
    if (foundPlayer?.id !== hoveredPlayerRef.current?.id) {
      setHoveredPlayer(foundPlayer);
      hoveredPlayerRef.current = foundPlayer;
      
      // OPTIMIZED: Only redraw when hover state actually changes
      const hoverCanvas = canvasRef.current;
      if (hoverCanvas) {
        const ctx = hoverCanvas.getContext('2d');
        if (ctx) {
          drawChart(ctx, hoverCanvas);
        }
      }
    }
    
    if (foundPlayer) {
      // Show tooltip
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 15}px`;
      tooltip.style.top = `${event.clientY - 10}px`;
      
      const vbd = foundPlayer.vbd.toFixed(1);
      const points = (foundPlayer.points || 0).toFixed(1);
      const positionColor = POSITION_COLORS[foundPlayer.position as keyof typeof POSITION_COLORS];
      const vbdColor = foundPlayer.vbd > 0 ? '#3ddc84' : foundPlayer.vbd < 0 ? '#ff5a5f' : '#b3b3b8';
      
      tooltip.innerHTML = `
        <div style="
          font-weight: 600; 
          color: white; 
          line-height: 1.2;
          font-size: 13px;
          margin-bottom: 4px;
        ">${foundPlayer.name}</div>
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        ">
          <span style="
            color: ${positionColor}; 
            font-weight: 600;
            font-size: 11px;
            background: ${positionColor}20;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid ${positionColor}40;
          ">${foundPlayer.position}</span>
          <span style="color: #9ca3af; font-size: 11px;">${foundPlayer.team}</span>
        </div>
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 11px;
          border-top: 1px solid #374151;
          padding-top: 6px;
        ">
          <div>
            <div style="color: #6b7280; margin-bottom: 1px;">Points</div>
            <div style="color: white; font-weight: 600; font-variant-numeric: tabular-nums;">${points}</div>
          </div>
          <div>
            <div style="color: #6b7280; margin-bottom: 1px;">VBD</div>
            <div style="
              color: ${vbdColor}; 
              font-weight: 600; 
              font-variant-numeric: tabular-nums;
            ">${vbd > 0 ? '+' : ''}${vbd}</div>
          </div>
        </div>
        <div style="
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid #374151;
          font-size: 10px;
          color: #6b7280;
        ">Rank: #${foundPlayer.positionRank} ${foundPlayer.position}</div>
      `;
    } else {
      // Hide tooltip
      tooltip.style.display = 'none';
    }
  }, [chartData, scales, drawChart]);
  
  const handleCanvasMouseLeave = useCallback(() => {
    // Only redraw if we actually had a hovered player
    const hadHoveredPlayer = hoveredPlayerRef.current !== null;
    
    setHoveredPlayer(null);
    hoveredPlayerRef.current = null;
    
    // OPTIMIZED: Only redraw when clearing actual hover state
    if (hadHoveredPlayer) {
      const leaveCanvas = canvasRef.current;
      if (leaveCanvas) {
        const ctx = leaveCanvas.getContext('2d');
        if (ctx) {
          drawChart(ctx, leaveCanvas);
        }
      }
    }
    
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }, [drawChart]);
  
  // Canvas hook for efficient rendering
  const { canvasRef: hookCanvasRef, redraw } = useCanvas({ draw: drawChart });
  
  // Sync refs
  useEffect(() => {
    if (hookCanvasRef.current) {
      (canvasRef as any).current = hookCanvasRef.current;
    }
  }, [hookCanvasRef]);
  
  // Redraw only when chart data changes, not when selection changes (selection is handled in drawChart)
  useEffect(() => {
    redraw();
  }, [redraw, chartData]); // FIXED: Remove selectedPlayer dependency to prevent axis recalculation
  
  // Handle selection changes without triggering scale recalculation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Just redraw the existing chart with new selection state
        drawChart(ctx, canvas);
      }
    }
  }, [selectedPlayer, drawChart]); // Separate effect for selection updates

  return (
    <WidgetErrorBoundary widgetName="VBD Analysis">
      <WidgetContainer title="VBD Analysis" widgetId="vbd-scatter" editMode={editMode} onRemove={onRemove}>
        <ChartContainer>
        <Controls role="group" aria-labelledby="position-filters-title">
          <h4 id="position-filters-title" className="sr-only">Position Filters</h4>
          {Object.keys(POSITION_COLORS).map(position => (
            <Button
              key={position}
              variant={selectedPositions.includes(position) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => togglePosition(position)}
              aria-pressed={selectedPositions.includes(position)}
              aria-describedby={`${position.toLowerCase()}-filter-help`}
            >
              {position}
              <span id={`${position.toLowerCase()}-filter-help`} className="sr-only">
                {selectedPositions.includes(position) ? 'Currently shown' : 'Currently hidden'} - Click to toggle
              </span>
            </Button>
          ))}
        </Controls>
        
        <ChartWrapper role="img" aria-labelledby="vbd-chart-title" aria-describedby="vbd-chart-desc">
          <h4 id="vbd-chart-title" className="sr-only">VBD Scatter Plot</h4>
          <div id="vbd-chart-desc" className="sr-only">
            Interactive scatter plot showing Value Based Drafting analysis. 
            X-axis shows position rank, Y-axis shows VBD score. 
            {chartData.length} players displayed across {selectedPositions.join(', ')} positions.
            Click on data points to select players. Use Tab to navigate position filters.
          </div>
          <canvas
            ref={hookCanvasRef}
            style={{ width: '100%', height: '100%' }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            role="button"
            aria-label="Interactive VBD scatter plot - click to select players"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // Could implement keyboard navigation of data points here
                e.preventDefault();
              }
            }}
          />
          
          {/* Hover tooltip */}
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-live="polite"
            style={{
              position: 'fixed',
              background: 'linear-gradient(135deg, #1a1a1e 0%, #0f0f12 100%)',
              color: 'white',
              fontSize: '12px',
              borderRadius: '12px',
              padding: '12px 16px',
              zIndex: 1000,
              pointerEvents: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxWidth: '240px',
              minWidth: '180px',
              display: 'none',
              backdropFilter: 'blur(8px)',
              fontFamily: 'system-ui, sans-serif'
            }}
          />
        </ChartWrapper>
        </ChartContainer>
      </WidgetContainer>
    </WidgetErrorBoundary>
  );
});

VBDScatterWidget.displayName = 'VBDScatterWidget';

export default VBDScatterWidget;