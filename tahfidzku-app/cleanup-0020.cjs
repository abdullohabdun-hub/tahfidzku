const fs = require('fs');
const path = require('path');

const journalPath = path.join(__dirname, 'src/db/migrations/meta/_journal.json');
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

// Filter out the last one we just generated
journal.entries = journal.entries.filter(e => e.tag !== '0020_brown_felicia_hardy');

fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));

// Delete the SQL file
try { fs.unlinkSync(path.join(__dirname, 'src/db/migrations/0020_brown_felicia_hardy.sql')); } catch(e){}
console.log('Cleanup 0020 done');
