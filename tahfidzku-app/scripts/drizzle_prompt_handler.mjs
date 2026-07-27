import { spawn } from 'child_process';

const child = spawn('npx.cmd', ['drizzle-kit', 'generate', '--name', 'iqra'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  
  // If it prompts, let's see what it is
  if (str.includes('?')) {
    console.log('[PROMPT DETECTED] answering empty string to see default or just waiting');
    // We'll answer 'n' (No) if it asks about rename.
    if (str.toLowerCase().includes('rename')) {
      child.stdin.write('n\n');
    } else {
      child.stdin.write('\n');
    }
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
