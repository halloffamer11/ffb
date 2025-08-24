import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { designTokens } from './theme/tokens';
import App from './App.tsx';
import './index.css';
import './theme/globalTheme.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ThemeProvider theme={designTokens}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);