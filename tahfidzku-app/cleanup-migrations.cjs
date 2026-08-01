const fs = require('fs');
const path = require('path');

const journalPath = path.join(__dirname, 'src/db/migrations/meta/_journal.json');
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

// Filter out 0020_skinny_kylun and 0021_overrated_mastermind
journal.entries = journal.entries.filter(e => e.tag !== '0020_skinny_kylun' && e.tag !== '0021_overrated_mastermind');

fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));

// Delete the SQL files
try { fs.unlinkSync(path.join(__dirname, 'src/db/migrations/0020_skinny_kylun.sql')); } catch(e){}
try { fs.unlinkSync(path.join(__dirname, 'src/db/migrations/0021_overrated_mastermind.sql')); } catch(e){}

console.log('Cleanup done');
