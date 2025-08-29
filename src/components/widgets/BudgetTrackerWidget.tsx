import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, Tooltip } from 'recharts';
import WidgetContainer from './WidgetContainer';
import { useUnifiedStore } from '../../stores/unified-store';
import { useMemoizedCalculation, usePerformanceMonitor } from '../../hooks';
import { WidgetErrorBoundary } from '../../components/ui';
import { 
  calculateRemainingBudget,
  calculateMaxBid,
  calculateAveragePerSpot,
  countSpotsRemaining,
  getSpendFromPicks,
  budgetAlerts,
  computeRosterTotalPerTeam
} from '../../core/budget';

const BudgetContainer = styled.div`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(135deg, var(--surface-1) 0%, var(--surface-2) 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const BudgetSummary = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  background-color: var(--surface-2);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-1);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--positive));
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.color || 'var(--text-1)'};
  margin-bottom: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChartSection = styled.div`
  flex: 1;
  display: flex;
  gap: 16px;
`;

const ChartContainer = styled.div`
  flex: 1;
  background-color: var(--surface-2);
  border-radius: 8px;
  border: 1px solid var(--border-1);
  padding: 12px;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ChartTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  position: relative;
  padding-bottom: 4px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 20px;
    height: 1px;
    background: var(--accent);
  }
`;

// Position colors for consistency
const POSITION_COLORS = {
  QB: '#8b5cf6',
  RB: '#10b981', 
  WR: '#3b82f6',
  TE: '#f59e0b',
  K: '#6b7280',
  DST: '#ef4444',
  FLEX: '#8b5cf6'
};

// Helper to get current team ID (assuming team 1 for now)
const getCurrentTeamId = () => 1;

// Memoized BudgetTrackerWidget with performance optimizations
interface BudgetTrackerWidgetProps {
  editMode?: boolean;
  onRemove?: () => void;
}

const BudgetTrackerWidget = React.memo(({ editMode = false, onRemove }: BudgetTrackerWidgetProps) => {
  const store = useUnifiedStore();
  const { picks, settings, players } = store;
  
  // Performance monitoring
  const renderCount = usePerformanceMonitor('BudgetTrackerWidget');
  
  // Optimized budget calculations with memoization
  const budgetData = useMemoizedCalculation(() => {
    const teamId = getCurrentTeamId();
    const totalBudget = settings?.budget || 200;
    const minBid = settings?.minBid || 1;
    const spent = getSpendFromPicks(picks, teamId);
    const remaining = calculateRemainingBudget(teamId, settings, picks);
    const spotsRemaining = countSpotsRemaining(teamId, settings, picks);
    const rosterTotal = computeRosterTotalPerTeam(settings);
    const maxBid = calculateMaxBid(remaining, spotsRemaining, minBid);
    const avgPerSlot = calculateAveragePerSpot(remaining, spotsRemaining);
    const alerts = budgetAlerts({ remaining, spotsRemaining, maxBid, avgPerSlot }, minBid);
    
    return {
      total: totalBudget,
      spent,
      remaining,
      maxBid,
      avgPerSlot,
      spotsRemaining,
      rosterTotal,
      filledSpots: rosterTotal - spotsRemaining,
      alerts,
      efficiency: spent > 0 ? (picks.filter(p => p.teamId === teamId).length / spent * 100) : 0
    };
  }, [picks, settings], 'Budget calculations');
  
  // Calculate position spending breakdown
  const spendingByPosition = useMemo(() => {
    const teamId = getCurrentTeamId();
    const teamPicks = picks.filter(p => p.teamId === teamId);
    const positionTotals = {};
    
    teamPicks.forEach(pick => {
      // Get position from pick or find player in players array
      let position = pick.position;
      if (!position && pick.playerId) {
        const player = players.find(p => p.id === pick.playerId);
        position = player?.position;
      }
      position = position || 'UNKNOWN';
      positionTotals[position] = (positionTotals[position] || 0) + (pick.price || 0);
    });
    
    return Object.entries(positionTotals).map(([position, amount]) => ({
      position,
      amount,
      color: POSITION_COLORS[position] || '#6b7280'
    })).sort((a, b) => b.amount - a.amount);
  }, [picks, players]);
  
  // Budget split chart data
  const remainingBudgetData = useMemo(() => [
    { name: 'Spent', value: budgetData.spent, fill: 'var(--negative)' },
    { name: 'Remaining', value: budgetData.remaining, fill: 'var(--accent)' }
  ], [budgetData.spent, budgetData.remaining]);
  
  // Budget efficiency over time (spending pace)
  const spendingTrend = useMemo(() => {
    const teamId = getCurrentTeamId();
    const teamPicks = picks.filter(p => p.teamId === teamId).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    let runningTotal = 0;
    
    return teamPicks.map((pick, index) => {
      runningTotal += pick.price || 0;
      return {
        pick: index + 1,
        spent: runningTotal,
        remaining: budgetData.total - runningTotal,
        avgRemaining: (budgetData.total - runningTotal) / Math.max(1, budgetData.spotsRemaining - index)
      };
    });
  }, [picks, budgetData.total, budgetData.spotsRemaining]);
  
  // Warning thresholds
  const warningThreshold = budgetData.total * 0.15; // 15% remaining triggers warning
  const criticalThreshold = budgetData.total * 0.05; // 5% remaining critical
  const isLowBudget = budgetData.remaining <= warningThreshold;
  const isCriticalBudget = budgetData.remaining <= criticalThreshold;
  const hasAlerts = budgetData.alerts.length > 0;
  
  // Custom tooltip for charts
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border-1)',
        borderRadius: '4px',
        padding: '8px',
        fontSize: '12px',
        color: 'var(--text-1)'
      }}>
        <p>{`${label}: $${payload[0].value}`}</p>
      </div>
    );
  }, []);

  return (
    <WidgetErrorBoundary widgetName="Budget Tracker">
      <WidgetContainer title="Budget Tracker" widgetId="budget" editMode={editMode} onRemove={onRemove}>
        <BudgetContainer>
        <BudgetSummary role="group" aria-labelledby="budget-summary-title">
          <h4 id="budget-summary-title" className="sr-only">Budget Summary Statistics</h4>
          <StatCard>
            <StatValue color={isCriticalBudget ? 'var(--negative)' : isLowBudget ? 'var(--warning)' : 'var(--text-1)'}>
              ${budgetData.remaining}
            </StatValue>
            <StatLabel>Remaining Budget</StatLabel>
            {budgetData.remaining > 0 && (
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginTop: '2px'
              }}>
                {((budgetData.remaining / budgetData.total) * 100).toFixed(1)}% of total
              </div>
            )}
          </StatCard>
          
          <StatCard>
            <StatValue color={budgetData.maxBid >= (settings?.minBid || 1) ? 'var(--accent)' : 'var(--negative)'}>
              ${budgetData.maxBid}
            </StatValue>
            <StatLabel>Max Bid</StatLabel>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              Min: ${settings?.minBid || 1}
            </div>
          </StatCard>
          
          <StatCard>
            <StatValue color={budgetData.avgPerSlot >= (settings?.minBid || 1) ? 'var(--text-1)' : 'var(--warning)'}>
              ${budgetData.avgPerSlot.toFixed(1)}
            </StatValue>
            <StatLabel>Avg per Remaining Slot</StatLabel>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              {budgetData.spotsRemaining} spots left
            </div>
          </StatCard>
          
          <StatCard>
            <StatValue>
              {budgetData.filledSpots}/{budgetData.rosterTotal}
            </StatValue>
            <StatLabel>Roster Progress</StatLabel>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              {((budgetData.filledSpots / budgetData.rosterTotal) * 100).toFixed(0)}% complete
            </div>
          </StatCard>
        </BudgetSummary>

        <ChartSection role="group" aria-labelledby="budget-charts-title">
          <h4 id="budget-charts-title" className="sr-only">Budget Analysis Charts</h4>
          <ChartContainer>
            <ChartTitle>Budget Split</ChartTitle>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={remainingBudgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {remainingBudgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Efficiency: {budgetData.efficiency.toFixed(1)}%
            </div>
          </ChartContainer>
          
          <ChartContainer>
            <ChartTitle>Spending by Position</ChartTitle>
            <ResponsiveContainer width="100%" height={120}>
              {spendingByPosition.length > 0 ? (
                <BarChart data={spendingByPosition} layout="horizontal">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="position" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={2}>
                    {spendingByPosition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}>
                  No spending yet
                </div>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </ChartSection>
        
        {spendingTrend.length > 1 && (
          <ChartContainer style={{ marginTop: '16px' }}>
            <ChartTitle>Spending Trend</ChartTitle>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={spendingTrend}>
                <XAxis 
                  dataKey="pick" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="var(--negative)" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="remaining" 
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {(hasAlerts || isLowBudget || isCriticalBudget) && (
          <div>
            {isCriticalBudget && (
              <div style={{
                backgroundColor: 'var(--negative)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: hasAlerts ? '8px' : '0'
              }}>
                🚨 Critical budget: Only minimum bids possible
              </div>
            )}
            {isLowBudget && !isCriticalBudget && (
              <div style={{
                backgroundColor: 'var(--warning)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: hasAlerts ? '8px' : '0'
              }}>
                ⚠️ Low budget warning: Consider value picks only
              </div>
            )}
            {hasAlerts && (
              <div style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '11px',
                color: 'var(--text-1)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Budget Constraints:</div>
                {budgetData.alerts.map((alert, index) => (
                  <div key={index} style={{ marginBottom: index < budgetData.alerts.length - 1 ? '2px' : '0' }}>
                    • {alert}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </BudgetContainer>
      </WidgetContainer>
    </WidgetErrorBoundary>
  );
});

BudgetTrackerWidget.displayName = 'BudgetTrackerWidget';

export default BudgetTrackerWidget;