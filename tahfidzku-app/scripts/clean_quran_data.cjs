const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src', 'lib', 'quranData.ts');

const content = fs.readFileSync(dataPath, 'utf8');

// Find end of PAGES_DATA array
const pagesIndex = content.indexOf('export const PAGES_DATA =');
if (pagesIndex === -1) {
  console.error('PAGES_DATA missing');
  process.exit(1);
}

// Find ending bracket of PAGES_DATA
const closingBracketIndex = content.indexOf('];', pagesIndex);

const cleanContent = content.slice(0, closingBracketIndex + 2) + '\n';
fs.writeFileSync(dataPath, cleanContent, 'utf8');
console.log('✅ Successfully cleaned src/lib/quranData.ts!');
