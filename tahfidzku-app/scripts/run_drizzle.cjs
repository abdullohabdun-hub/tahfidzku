require('dotenv/config');
const fs = require('fs');

Object.defineProperty(process.stdin, 'isTTY', { value: true });
Object.defineProperty(process.stdout, 'isTTY', { value: true });
process.stdout.columns = 80;
process.stdout.rows = 24;

const originalWrite = process.stdout.write;
process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk.toString();
  originalWrite.call(process.stdout, chunk, encoding, callback);
  if (str.includes('?')) {
    console.log('[PROMPT DETECTED]');
    // Send enter
    process.stdin.emit('data', Buffer.from('\n'));
  }
  return true;
};

process.argv = ['node', 'drizzle-kit', 'generate', '--name', 'tracking_iqra'];

const code = fs.readFileSync('node_modules/drizzle-kit/bin.cjs', 'utf-8');
eval(code);
