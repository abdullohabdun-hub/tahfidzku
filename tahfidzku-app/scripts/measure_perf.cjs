const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\5d69760b-815b-4911-b265-78afad074861';
const SCRATCH_DIR = path.join(ARTIFACT_DIR, 'scratch');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function testEnvironment(envName, baseUrl) {
  console.log(`\n========================================`);
  console.log(` TESTING ENVIRONMENT: ${envName} (${baseUrl})`);
  console.log(`========================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log(`Logging in on ${envName}...`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('#identifier', 'admin@demo.com');
    await page.fill('#pin', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/*', { timeout: 15000 });
    console.log(`Current URL after login: ${page.url()}`);

    const pagesToTest = [
      { name: 'Dashboard Admin', path: '/admin' },
      { name: 'Data Santri', path: '/admin/santri' },
      { name: 'Riwayat Ujian', path: '/admin/ujian' },
      { name: 'Cetak Rapor', path: '/admin/rapor' }
    ];

    const results = [];

    for (const p of pagesToTest) {
      console.log(`Measuring ${p.name} (${p.path})...`);
      const networkLog = [];

      const onRequest = (request) => {
        request._startTime = Date.now();
      };

      const onResponse = (response) => {
        const req = response.request();
        const endTime = Date.now();
        const duration = req._startTime ? endTime - req._startTime : 0;

        const url = req.url();
        if (!url.includes('/@vite') && !url.includes('/@fs') && !url.includes('.svg') && !url.includes('.png') && !url.includes('/node_modules/')) {
          networkLog.push({
            url: url.replace(baseUrl, ''),
            method: req.method(),
            status: response.status(),
            durationMs: duration
          });
        }
      };

      page.on('request', onRequest);
      page.on('response', onResponse);

      const startTime = Date.now();
      await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'networkidle' });
      const loadDuration = Date.now() - startTime;

      const shotName = `${envName.toLowerCase()}_${p.name.replace(/\s+/g, '_').toLowerCase()}.png`;
      const shotPath = path.join(SCRATCH_DIR, shotName);
      await page.screenshot({ path: shotPath, fullPage: false });

      page.off('request', onRequest);
      page.off('response', onResponse);

      // Extract slowest API / Server function call
      const slowRequests = networkLog
        .filter(r => r.method === 'POST' || r.durationMs > 50)
        .sort((a, b) => b.durationMs - a.durationMs);

      results.push({
        page: p.name,
        path: p.path,
        totalLoadMs: loadDuration,
        screenshot: shotPath,
        slowestRequests: slowRequests.slice(0, 5),
        totalRequestsCount: networkLog.length
      });
    }

    await browser.close();
    return results;

  } catch (err) {
    console.error(`Error testing ${envName}:`, err.message);
    await browser.close();
    return { error: err.message };
  }
}

async function main() {
  const localResults = await testEnvironment('LOCAL', 'http://localhost:3000');
  const prodResults = await testEnvironment('PRODUCTION', 'https://tahfidzku.my.id');

  const summary = {
    local: localResults,
    production: prodResults
  };

  fs.writeFileSync(path.join(SCRATCH_DIR, 'perf_summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== COMPLETE PERF SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main();
