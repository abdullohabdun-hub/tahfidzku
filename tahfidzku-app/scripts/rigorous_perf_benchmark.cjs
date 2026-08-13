const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const label = process.argv[2] || 'PRE_INDEX';
const BASE_URL = process.argv[3] || 'http://localhost:3000';

const ARTIFACT_DIR = 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\5d69760b-815b-4911-b265-78afad074861';
const SCRATCH_DIR = path.join(ARTIFACT_DIR, 'scratch');

const targetPages = [
  { name: 'Dashboard Admin', path: '/admin', targetFn: 'getAdminDashboardStats' },
  { name: 'Data Santri', path: '/admin/santri', targetFn: 'getSantriList' },
  { name: 'Riwayat Ujian', path: '/admin/ujian', targetFn: 'getDaftarUjianPending' },
  { name: 'Cetak Rapor', path: '/admin/rapor', targetFn: 'getSantriList' },
];

async function runBenchmarkPass(page) {
  const passResults = [];

  for (const p of targetPages) {
    const serverFns = [];

    const onRequest = (req) => { req._startTime = Date.now(); };
    const onResponse = (res) => {
      const req = res.request();
      const duration = req._startTime ? Date.now() - req._startTime : 0;
      const url = req.url();
      if (req.method() === 'POST' && url.includes('_serverFn')) {
        serverFns.push({
          url,
          durationMs: duration
        });
      }
    };

    page.on('request', onRequest);
    page.on('response', onResponse);

    const startPage = Date.now();
    await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle' });
    const totalPageLoadMs = Date.now() - startPage;

    page.off('request', onRequest);
    page.off('response', onResponse);

    // Pick the main data loading server function (the longest POST server function)
    const mainServerFn = serverFns.sort((a, b) => b.durationMs - a.durationMs)[0] || null;

    passResults.push({
      page: p.name,
      path: p.path,
      targetFn: p.targetFn,
      totalPageLoadMs,
      mainServerFnDurationMs: mainServerFn ? mainServerFn.durationMs : null,
      allServerFnsCount: serverFns.length,
      serverFnsDetail: serverFns
    });
  }

  return passResults;
}

async function main() {
  console.log(`\n========================================`);
  console.log(` RIGOROUS BENCHMARK RUN: [ ${label} ]`);
  console.log(` TARGET URL: ${BASE_URL}`);
  console.log(`========================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('#identifier', 'admin@demo.com');
  await page.fill('#pin', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/*', { timeout: 15000 });

  console.log('2. Warming up server & client routes (2 iterations)...');
  for (let w = 1; w <= 2; w++) {
    for (const p of targetPages) {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle' });
    }
  }
  console.log('✅ Warm-up completed.');

  console.log('3. Running Benchmark RUN 1...');
  const run1 = await runBenchmarkPass(page);

  console.log('4. Running Benchmark RUN 2...');
  const run2 = await runBenchmarkPass(page);

  await browser.close();

  const finalOutput = {
    state: label,
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    run1,
    run2
  };

  const outFile = path.join(SCRATCH_DIR, `benchmark_${label.toLowerCase()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(finalOutput, null, 2));

  console.log(`\n=== BENCHMARK COMPLETE [${label}] ===`);
  console.log(JSON.stringify(finalOutput, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
