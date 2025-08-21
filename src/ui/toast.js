/** Simple toast notifications (T-024 UI feedback) */
let host = null;

export function showToast(text, type = 'info', timeoutMs = 2500) {
  const ok = ensureHost();
  if (!ok) {
    try { console.log('[toast]', String(text || '')); } catch {}
    return;
  }
  try {
    const item = document.createElement('div');
    item.className = `px-3 py-2 rounded shadow text-white text-sm mb-2 ${color(type)}`;
    item.textContent = String(text || '');
    host.appendChild(item);
    setTimeout(() => { try { item.remove(); } catch {}; }, timeoutMs);
  } catch {}
}

function ensureHost() {
  try {
    if (typeof document === 'undefined' || !document || !document.body || typeof document.createElement !== 'function') return false;
    if (host && document.body.contains(host)) return true;
    host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.bottom = '12px';
    host.style.right = '12px';
    host.style.zIndex = '4000';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);
    return true;
  } catch {
    return false;
  }
}

function color(type) {
  switch (String(type || 'info')) {
    case 'success': return 'bg-emerald-600';
    case 'error': return 'bg-rose-600';
    case 'warn': return 'bg-amber-600';
    default: return 'bg-slate-800';
  }
}


