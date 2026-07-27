import 'dotenv/config';

// Mock TTY
Object.defineProperty(process.stdin, 'isTTY', { value: true });
Object.defineProperty(process.stdout, 'isTTY', { value: true });

// Mock columns so it doesn't crash on size
process.stdout.columns = 80;
process.stdout.rows = 24;

const originalWrite = process.stdout.write;
process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk.toString();
  originalWrite.call(process.stdout, chunk, encoding, callback);
  
  if (str.includes('?')) {
    console.log('[PROMPT DETECTED] answering empty string to see default or just waiting');
    if (str.toLowerCase().includes('rename')) {
      process.stdin.emit('data', Buffer.from('n\n'));
    } else {
      process.stdin.emit('data', Buffer.from('\n'));
    }
  }
  return true;
};

// Import drizzle-kit
import('drizzle-kit/bin.cjs').then(() => {
  console.log('Drizzle kit finished?');
}).catch(console.error);
