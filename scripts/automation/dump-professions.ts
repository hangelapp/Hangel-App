import { PROFESSIONS } from '../../src/lib/volunteer/professions';
import { writeFileSync } from 'fs';
writeFileSync('/tmp/professions.json', JSON.stringify(PROFESSIONS, null, 2));
console.log('count:', PROFESSIONS.length);
