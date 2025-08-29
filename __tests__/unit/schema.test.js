/* Minimal schema tests (Node). No external deps. */
import {
  INJURY_STATUS,
  POSITION_CODE,
  createPackedPlayer,
  estimatePackedPlayerSizeBytes,
  isPackedPlayerUnderSize,
  normalizeInjuryStatus,
  encodePosition
} from '../../src/core/schema.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// Sample compact player for size verification
const packed = createPackedPlayer({
  id: 1,
  name: 'P.1',
  position: 'QB',
  team: 'KC',
  byeWeek: 10,
  injuryStatus: 'HEALTHY',
  points: 250.1
});

const sizeBytes = estimatePackedPlayerSizeBytes(packed);
assertOkay('PackedPlayer < 100 bytes', isPackedPlayerUnderSize(packed, 100), { sizeBytes, packed });

// Injury enum validation
const validStatuses = ['HEALTHY', 'Q', 'D', 'O', 'IR', 'PUP', 'NA'];
for (const s of validStatuses) {
  const code = normalizeInjuryStatus(s);
  assertOkay(`Injury status encodes: ${s}`, Number.isInteger(code) && code >= 0 && code <= 6, { s, code });
}

// Position encoding check
assertOkay('encodePosition(QB) == 0', encodePosition('QB') === POSITION_CODE.QB);
assertOkay('encodePosition(RB) == 1', encodePosition('RB') === POSITION_CODE.RB);


