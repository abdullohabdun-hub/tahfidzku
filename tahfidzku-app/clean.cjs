const fs = require('fs'); 
let c = fs.readFileSync('src/components/SetoranForm.tsx', 'utf-8'); 
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$'); 
fs.writeFileSync('src/components/SetoranForm.tsx', c);
