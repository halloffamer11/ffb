import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import LeftRail from '../components/layout/LeftRail';
import MainCanvas from '../components/layout/MainCanvas';
import { PresetProvider, usePreset } from '../stores/PresetContext';

const DashboardContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 1;
  background: transparent;
`;

function DashboardContent() {
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const { registerNavigationToggle } = usePreset();

  const toggleNavigation = useCallback(() => {
    setLeftRailCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    registerNavigationToggle(toggleNavigation);
  }, [registerNavigationToggle, toggleNavigation]);

  return (
    <>
      <LeftRail 
        collapsed={leftRailCollapsed}
        onToggleCollapsed={() => setLeftRailCollapsed(!leftRailCollapsed)}
      />
      <MainCanvas />
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardContainer>
      <PresetProvider>
        <DashboardContent />
      </PresetProvider>
    </DashboardContainer>
  );
}