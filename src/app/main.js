export function validateEnvironment() {
  const canUseLocalStorage = (() => {
    try {
      const probeKey = '__ffb_env_check__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return true;
    } catch (err) {
      return false;
    }
  })();

  if (!canUseLocalStorage) {
    const message = 'localStorage required. This app cannot run in this browser.';
    console.error(message);
    const app = document.getElementById('app');
    if (app) app.textContent = message;
    throw new Error('Environment check failed');
  }
}

import { logStructured } from './logger.js';
import { attachRecalcListeners, recalcAll } from '../ui/recalc.js';
import { showToast } from '../ui/toast.js';
import { getStore } from '../ui/storeBridge.js';

function bootstrap() {
  validateEnvironment();
  // Keep initial bootstrap minimal per KISS/YAGNI
  console.log('FFB app bootstrapped');
  
  // Initialize store bridge early for consistent state management
  try {
    getStore(); // Initialize singleton
    logStructured('info', 'bootstrap:store_initialized');
  } catch (err) {
    logStructured('error', 'bootstrap:store_init_failed', { error: String(err && err.message || err) });
  }
  
  try {
    attachRecalcListeners();
    setTimeout(() => { recalcAll(); }, 0);
  } catch (err) {
    logStructured('error', 'bootstrap:recalc_attach_failed', { error: String(err && err.message || err) });
    try { showToast('Recalc initialization failed', 'warn'); } catch {}
  }
}

bootstrap();


