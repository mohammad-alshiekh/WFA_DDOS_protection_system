'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface SimStats {
  totalSent: number;
  successCount: number;
  errorCount: number;
  blockedCount: number;
  avgLatency: number;
  rps: number;
}

export default function Simulator() {
  const [attackType, setAttackType] = useState<'get_flood' | 'post_flood' | 'slowloris'>('get_flood');
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState(30);
  const [targetEndpoint, setTargetEndpoint] = useState<'waf' | 'direct'>('waf');
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimStats>({
    totalSent: 0, successCount: 0, errorCount: 0, blockedCount: 0, avgLatency: 0, rps: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const statsRef = useRef(stats);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 100));
  };

  const sendRequest = useCallback(async () => {
    const baseUrl = targetEndpoint === 'waf' ? '/api/waf' : '/api/target';
    const start = performance.now();

    try {
      let url = baseUrl;
      let options: RequestInit = { method: 'GET' };

      if (attackType === 'get_flood') {
        url = `${baseUrl}/api/data?delay=0&r=${Math.random()}`;
      } else if (attackType === 'post_flood') {
        url = `${baseUrl}/login`;
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user', password: 'pass', random: Math.random() }),
        };
      } else if (attackType === 'slowloris') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        options = { ...options, signal: controller.signal };
        clearTimeout(timeout);
        url = `${baseUrl}/heavy?r=${Math.random()}`;
      }

      const res = await fetch(url, options);
      const latency = performance.now() - start;

      setStats(prev => {
        const newTotal = prev.totalSent + 1;
        const isBlocked = res.status === 429;
        const isError = !res.ok && !isBlocked;
        const newSuccess = prev.successCount + (res.ok ? 1 : 0);
        const newBlocked = prev.blockedCount + (isBlocked ? 1 : 0);
        const newError = prev.errorCount + (isError ? 1 : 0);
        const newAvg = (prev.avgLatency * prev.totalSent + latency) / newTotal;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newRps = elapsed > 0 ? newTotal / elapsed : 0;

        return {
          totalSent: newTotal, successCount: newSuccess, errorCount: newError,
          blockedCount: newBlocked, avgLatency: newAvg, rps: newRps,
        };
      });

      if (res.status === 429) {
        addLog(`[BLOCKED] 429 - ${attackType} (${Math.round(latency)}ms)`);
      } else if (!res.ok) {
        addLog(`[ERROR] ${res.status} - ${attackType} (${Math.round(latency)}ms)`);
      }
    } catch (err: any) {
      setStats(prev => ({
        ...prev, totalSent: prev.totalSent + 1, errorCount: prev.errorCount + 1,
      }));
      addLog(`[FAIL] ${err.name || 'Error'}`);
    }
  }, [attackType, targetEndpoint]);

  const startSimulation = () => {
    setIsRunning(true);
    setStats({ totalSent: 0, successCount: 0, errorCount: 0, blockedCount: 0, avgLatency: 0, rps: 0 });
    setLogs([]);
    startTimeRef.current = Date.now();

    const batchSize = Math.max(1, Math.floor(intensity / 10));
    intervalRef.current = setInterval(() => {
      for (let i = 0; i < batchSize; i++) {
        sendRequest();
      }
    }, 100);

    setTimeout(() => stopSimulation(), duration * 1000);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    addLog('=== Simulation stopped ===');
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const mitigationRate = stats.totalSent > 0 ? ((stats.blockedCount / stats.totalSent) * 100).toFixed(1) : '0.0';
  const availability = stats.totalSent > 0 ? ((stats.successCount / stats.totalSent) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>🚀 Traffic Simulator</h1>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: 14 }}>← Back to Home</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 20, color: '#fbbf24', fontSize: 18, borderBottom: '1px solid #334155', paddingBottom: 12 }}>Attack Configuration</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Attack Type</label>
            <select value={attackType} onChange={e => setAttackType(e.target.value as any)} style={{ width: '100%' }}>
              <option value="get_flood">🌊 HTTP GET Flood</option>
              <option value="post_flood">📤 HTTP POST Flood</option>
              <option value="slowloris">🐢 Slowloris (Slow Connections)</option>
            </select>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              {attackType === 'get_flood' && 'Floods the /api/data endpoint with rapid GET requests'}
              {attackType === 'post_flood' && 'Floods the /login endpoint with POST requests'}
              {attackType === 'slowloris' && 'Opens slow connections to the /heavy endpoint'}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Intensity: <span style={{ color: '#38bdf8' }}>{intensity} req/s</span>
            </label>
            <input type="range" min="1" max="500" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
              <span>1 req/s</span><span>500 req/s</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Duration: <span style={{ color: '#38bdf8' }}>{duration}s</span>
            </label>
            <input type="range" min="5" max="300" value={duration} onChange={e => setDuration(parseInt(e.target.value))} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
              <span>5s</span><span>300s</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Target</label>
            <select value={targetEndpoint} onChange={e => setTargetEndpoint(e.target.value as any)} style={{ width: '100%' }}>
              <option value="waf">🛡️ Via WAF (Protected)</option>
              <option value="direct">⚠️ Direct to Target (Unprotected)</option>
            </select>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              {targetEndpoint === 'waf' 
                ? 'Traffic goes through the WAF filter. Attack should be blocked.' 
                : 'Traffic bypasses WAF. Server will be directly attacked.'}
            </p>
          </div>

          <button 
            onClick={isRunning ? stopSimulation : startSimulation}
            style={{
              width: '100%',
              background: isRunning ? '#ef4444' : '#38bdf8',
              color: '#0f172a',
              padding: 14,
              fontSize: 16,
            }}
          >
            {isRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20, color: '#4ade80', fontSize: 18, borderBottom: '1px solid #334155', paddingBottom: 12 }}>Real-time Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatBox label="Total Sent" value={stats.totalSent} color="#e2e8f0" />
            <StatBox label="Success (200)" value={stats.successCount} color="#4ade80" />
            <StatBox label="Blocked (429)" value={stats.blockedCount} color="#fbbf24" />
            <StatBox label="Errors" value={stats.errorCount} color="#ef4444" />
            <StatBox label="Avg Latency" value={`${Math.round(stats.avgLatency)}ms`} color="#38bdf8" />
            <StatBox label="Current RPS" value={stats.rps.toFixed(1)} color="#a78bfa" />
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Mitigation Rate</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#fbbf24' }}>{mitigationRate}%</div>
            </div>
            <div style={{ padding: 12, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Availability</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#4ade80' }}>{availability}%</div>
            </div>
          </div>

          {isRunning && (
            <div style={{ marginTop: 16, padding: 12, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ width: '100%', height: 4, background: '#334155', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(100, ((Date.now() - startTimeRef.current) / (duration * 1000)) * 100)}%`,
                  height: '100%',
                  background: '#38bdf8',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                Running... {((Date.now() - startTimeRef.current) / 1000).toFixed(1)}s / {duration}s
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12, color: '#94a3b8', fontSize: 16 }}>📝 Live Logs</h3>
        <div style={{ 
          height: 350, 
          overflow: 'auto', 
          background: '#0f172a', 
          borderRadius: 8, 
          padding: 12,
          fontFamily: '"SF Mono", Monaco, monospace',
          fontSize: 12,
        }}>
          {logs.length === 0 && (
            <div style={{ color: '#475569', textAlign: 'center', paddingTop: 100 }}>
              No logs yet. Start a simulation to see traffic logs...
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} style={{ 
              marginBottom: 4, 
              color: log.includes('BLOCKED') ? '#fbbf24' : log.includes('ERROR') || log.includes('FAIL') ? '#ef4444' : '#94a3b8',
              fontFamily: 'monospace',
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}
