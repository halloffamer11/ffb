/**
 * 🚨 LEGACY STORE - DEPRECATED AND DANGEROUS
 * 
 * ❌ THIS FILE HAS BEEN REPLACED BY unified-store.ts
 * ❌ DO NOT USE THIS CODE
 * ❌ DO NOT IMPORT FROM THIS FILE
 * ❌ DO NOT EXTEND THIS STORE
 * 
 * 🔥 THIS FILE EXISTS ONLY AS A TOMBSTONE
 * 🔥 ALL FUNCTIONALITY HAS MOVED TO src/stores/unified-store.ts
 * 🔥 USING THIS WILL CAUSE DATA SYNC ISSUES
 * 
 * If you see imports from this file, REMOVE THEM IMMEDIATELY
 * and use useUnifiedStore() from '../stores/unified-store.ts'
 * 
 * The dual store system has been ELIMINATED.
 * There is only ONE store now.
 */

// TOMBSTONE: Legacy imports preserved to avoid breaking imports
import { 
  calculateRemainingBudget, 
  countSpotsRemaining, 
  calculateMaxBid 
} from '../core/budget.js';

/**
 * 🚨 LEGACY STORE CLASS - REPLACED WITH ERROR
 * 
 * This class has been DESTROYED and replaced with an error function.
 * DO NOT ATTEMPT TO USE THIS CLASS.
 */
export class DraftStore {
  constructor(options = {}) {
    const errorMessage = `
🚨🚨🚨 LEGACY STORE ACCESS DETECTED 🚨🚨🚨

❌ DraftStore class has been ELIMINATED
❌ This is part of the dual store system that caused data sync issues
❌ ALL functionality has moved to unified-store.ts

✅ SOLUTION: Use useUnifiedStore() instead:

import { useUnifiedStore } from '../stores/unified-store.ts';
const store = useUnifiedStore();

🔥 The dual store nightmare is OVER.
🔥 There is only ONE store now.
🔥 Data sync issues have been ELIMINATED.
    `;
    
    console.error(errorMessage);
    throw new Error('Legacy DraftStore class has been eliminated. Use useUnifiedStore() instead.');
  }
}

// Legacy helper functions preserved to avoid breaking imports (but they're tombstones too)
function createInitialState() {
  throw new Error('createInitialState() is legacy - use unified-store.ts createInitialState()');
}

function validateAction(action) {
  throw new Error('validateAction() is legacy - use unified-store.ts validation');
}

function deepClone(obj) {
  throw new Error('deepClone() is legacy - use unified-store.ts or native structuredClone()');
}

function performanceNow() {
  throw new Error('performanceNow() is legacy - use unified-store.ts performance utilities');
}


