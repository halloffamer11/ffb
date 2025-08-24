import React, { useState } from 'react';
import styled from 'styled-components';
import LeftRail from '../components/layout/LeftRail';
import MainCanvas from '../components/layout/MainCanvas';

const DashboardContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 1;
  
  /* Professional content container with subtle depth */
  background: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%);
`;

export default function DashboardPage() {
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);

  return (
    <DashboardContainer>
      <LeftRail 
        collapsed={leftRailCollapsed}
        onToggleCollapsed={() => setLeftRailCollapsed(!leftRailCollapsed)}
      />
      <MainCanvas />
    </DashboardContainer>
  );
}