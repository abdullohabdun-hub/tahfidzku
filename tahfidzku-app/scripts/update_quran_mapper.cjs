const fs = require('fs');
const path = require('path');

const mapperPath = path.join(process.cwd(), 'src', 'lib', 'quranMapper.ts');
const mapperContent = fs.readFileSync(mapperPath, 'utf8');

const targetIndex = mapperContent.indexOf('export function isPecahanHalamanValid');

if (targetIndex === -1) {
  console.error('Could not find target index in quranMapper.ts');
  process.exit(1);
}

const newHeader = `// @ts-nocheck
// quranMapper.ts - Helper utilities untuk Al-Qur'an
// Data statis dipisahkan ke quranData.ts untuk efisiensi code splitting bundle client.

import { JUZ_TABLE, SURAH_LIST, PAGES_DATA } from './quranData'
export { JUZ_TABLE, SURAH_LIST, PAGES_DATA }

`;

const updatedMapper = newHeader + mapperContent.slice(targetIndex);
fs.writeFileSync(mapperPath, updatedMapper, 'utf8');
console.log('✅ Updated src/lib/quranMapper.ts to import data from quranData.ts!');
