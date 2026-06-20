import { PROFESSIONS } from '../../src/lib/volunteer/professions.ts';
import fs from 'fs';
fs.writeFileSync('/tmp/professions.json', JSON.stringify(PROFESSIONS, null, 2));
console.log('count:', PROFESSIONS.length);
