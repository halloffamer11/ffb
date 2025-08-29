import React from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './components/ui/Toast';
import TopAppBar from './components/layout/TopAppBar';
import DashboardPage from './pages/DashboardPage';
import LeagueSettingsPage from './pages/LeagueSettingsPage';
import DataManagementPage from './pages/DataManagementPage';
import DeveloperPage from './pages/DeveloperPage';

const AppContainer = styled.div`
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text1);
  display: flex;
  flex-direction: column;
  font-family: var(--fontFamily-base);
  overflow: hidden;
  position: relative;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
`;

function App() {
  
  // Performance monitoring
  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          console.warn(`Slow render detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    
    if ('observe' in observer) {
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
    
    return () => observer.disconnect();
  }, []);

  // Initialize real-time recalculation system
  React.useEffect(() => {
    async function initRecalc() {
      try {
        const { attachRecalcListeners } = await import('./core/recalculation');
        attachRecalcListeners();
        console.log('Real-time recalculation system initialized');
      } catch (error) {
        console.warn('Failed to initialize recalculation system:', error);
      }
    }
    
    initRecalc();
  }, []);

  return (
    <QueryProvider>
      <ToastProvider>
        <Router>
          <AppContainer>
            <Routes>
              <Route path="/settings" element={<LeagueSettingsPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="/developer" element={<DeveloperPage />} />
              <Route path="/" element={
                <>
                  <TopAppBar />
                  <ContentContainer>
                    <DashboardPage />
                  </ContentContainer>
                </>
              } />
            </Routes>
          </AppContainer>
        </Router>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;