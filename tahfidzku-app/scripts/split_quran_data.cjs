const fs = require('fs');
const path = require('path');

const mapperPath = path.join(process.cwd(), 'src', 'lib', 'quranMapper.ts');
const dataPath = path.join(process.cwd(), 'src', 'lib', 'quranData.ts');

const mapperContent = fs.readFileSync(mapperPath, 'utf8');

const pagesIndex = mapperContent.indexOf('export const PAGES_DATA =');
if (pagesIndex === -1) {
  console.error('Could not find PAGES_DATA in quranMapper.ts');
  process.exit(1);
}

// Extract from export const PAGES_DATA = [...] up to line 806 (where comment begins)
const commentIndex = mapperContent.indexOf('/**\n * Sifat juz:', pagesIndex);
const pagesDataStr = mapperContent.slice(pagesIndex, commentIndex).trim();

let currentDataContent = fs.readFileSync(dataPath, 'utf8');
currentDataContent += '\n\n// Data inti: per-halaman (1-604), juz, dan daftar surah+rentang ayat yang muncul di halaman itu\n' + pagesDataStr + '\n';

fs.writeFileSync(dataPath, currentDataContent, 'utf8');
console.log('✅ Successfully extracted PAGES_DATA to src/lib/quranData.ts!');
