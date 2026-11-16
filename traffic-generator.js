const http = require('http');
const { URL } = require('url');

const CONFIG = {
  target: process.env.TARGET || 'http://localhost:3000',
  type: process.env.TYPE || 'get_flood',
  intensity: parseInt(process.env.INTENSITY) || 100,
  duration: parseInt(process.env.DURATION) || 30,
};

let stats = { sent: 0, success: 0, blocked: 0, error: 0, totalLatency: 0 };
const startTime = Date.now();
let active = 0;

function makeRequest() {
  active++;
  const reqStart = Date.now();

  return new Promise((resolve) => {
    const baseUrl = new URL(CONFIG.target);
    let path = '/';
    let method = 'GET';
    let headers = {};
    let body = null;

    if (CONFIG.type === 'get_flood') {
      path = `/api/data?delay=0&r=${Math.random()}`;
    } else if (CONFIG.type === 'post_flood') {
      path = '/login';
      method = 'POST';
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify({ username: 'user', password: 'pass', random: Math.random() });
    } else if (CONFIG.type === 'slowloris') {
      path = `/heavy?r=${Math.random()}`;
    }

    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
      path: path,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        stats.sent++;
        stats.totalLatency += Date.now() - reqStart;
        if (res.statusCode === 200) stats.success++;
        else if (res.statusCode === 429) stats.blocked++;
        else stats.error++;
        active--;
        resolve();
      });
    });

    req.on('error', (err) => {
      stats.sent++;
      stats.error++;
      stats.totalLatency += Date.now() - reqStart;
      active--;
      resolve();
    });

    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║      DDoS Traffic Generator - WAF Project            ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Target:   ${CONFIG.target.padEnd(40)} ║`);
  console.log(`║  Type:     ${CONFIG.type.padEnd(40)} ║`);
  console.log(`║  Intensity: ${(CONFIG.intensity + ' req/s').padEnd(39)} ║`);
  console.log(`║  Duration:  ${(CONFIG.duration + ' seconds').padEnd(39)} ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  const intervalMs = 100;
  const batchSize = Math.max(1, Math.floor(CONFIG.intensity / (1000 / intervalMs)));

  const interval = setInterval(() => {
    for (let i = 0; i < batchSize; i++) {
      makeRequest();
    }
  }, intervalMs);

  // Progress reporter
  const reportInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = elapsed > 0 ? (stats.sent / elapsed).toFixed(1) : '0.0';
    process.stdout.write(`\r  Elapsed: ${elapsed.toFixed(1)}s | Sent: ${stats.sent} | OK: ${stats.success} | Blocked: ${stats.blocked} | Err: ${stats.error} | RPS: ${rps} | Active: ${active}   `);
  }, 500);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(reportInterval);

    // Wait for pending requests
    const waitInterval = setInterval(() => {
      if (active === 0) {
        clearInterval(waitInterval);
        printResults();
      }
    }, 100);

    // Force exit after 5s
    setTimeout(() => {
      clearInterval(waitInterval);
      printResults();
    }, 5000);
  }, CONFIG.duration * 1000);
}

function printResults() {
  const elapsed = (Date.now() - startTime) / 1000;
  const avgLatency = stats.sent > 0 ? (stats.totalLatency / stats.sent).toFixed(1) : 0;

  console.log(`\n\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║                 RESULTS SUMMARY                      ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Duration:       ${(elapsed.toFixed(1) + 's').padEnd(37)} ║`);
  console.log(`║  Total Sent:     ${(stats.sent + '').padEnd(37)} ║`);
  console.log(`║  Success (200):  ${(stats.success + '').padEnd(37)} ║`);
  console.log(`║  Blocked (429):  ${(stats.blocked + '').padEnd(37)} ║`);
  console.log(`║  Errors:         ${(stats.error + '').padEnd(37)} ║`);
  console.log(`║  Avg Latency:    ${(avgLatency + 'ms').padEnd(37)} ║`);
  console.log(`║  Actual RPS:     ${((stats.sent / elapsed).toFixed(1) + '').padEnd(37)} ║`);
  console.log(`║  Mitigation:     ${((stats.sent > 0 ? ((stats.blocked / stats.sent) * 100).toFixed(1) : 0) + '%').padEnd(37)} ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);
  process.exit(0);
}

run();
