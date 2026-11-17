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

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'success' | 'blocked' | 'error' | 'info';
  message: string;
  details?: string;
}

const ATTACK_TYPES = [
  { value: 'get_flood', label: 'HTTP GET Flood', icon: '🌊', description: 'Floods the /api/data endpoint with rapid GET requests', color: 'blue' },
  { value: 'post_flood', label: 'HTTP POST Flood', icon: '📤', description: 'Floods the /login endpoint with POST requests', color: 'amber' },
  { value: 'slowloris', label: 'Slowloris', icon: '🐢', description: 'Opens slow connections to the /heavy endpoint', color: 'purple' },
] as const;

const TARGET_OPTIONS = [
  { value: 'waf', label: 'Via WAF (Protected)', icon: '🛡️', description: 'Traffic goes through the WAF filter. Attack should be blocked.', color: 'green' },
  { value: 'direct', label: 'Direct to Target (Unprotected)', icon: '⚠️', description: 'Traffic bypasses WAF. Server will be directly attacked.', color: 'red' },
] as const;

export default function Simulator() {
  const [attackType, setAttackType] = useState<'get_flood' | 'post_flood' | 'slowloris'>('get_flood');
  const [intensity, setIntensity] = useState(100);
  const [duration, setDuration] = useState(30);
  const [targetEndpoint, setTargetEndpoint] = useState<'waf' | 'direct'>('waf');
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimStats>({
    totalSent: 0, successCount: 0, errorCount: 0, blockedCount: 0, avgLatency: 0, rps: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const statsRef = useRef(stats);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logIdRef = useRef(0);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const addLog = useCallback((type: LogEntry['type'], message: string, details?: string) => {
    const entry: LogEntry = {
      id: ++logIdRef.current,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setLogs(prev => [entry, ...prev].slice(0, 200));
  }, []);

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
        addLog('blocked', `Request blocked (429)`, `${attackType} • ${Math.round(latency)}ms`);
      } else if (!res.ok) {
        addLog('error', `Error ${res.status}`, `${attackType} • ${Math.round(latency)}ms`);
      } else {
        addLog('success', `Request successful (200)`, `${attackType} • ${Math.round(latency)}ms`);
      }
    } catch (err: any) {
      setStats(prev => ({
        ...prev, totalSent: prev.totalSent + 1, errorCount: prev.errorCount + 1,
      }));
      addLog('error', `${err.name || 'Error'}`, attackType);
    }
  }, [attackType, targetEndpoint, addLog]);

  const startSimulation = () => {
    setIsRunning(true);
    setStats({ totalSent: 0, successCount: 0, errorCount: 0, blockedCount: 0, avgLatency: 0, rps: 0 });
    setLogs([]);
    logIdRef.current = 0;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    addLog('info', 'Simulation started', `${ATTACK_TYPES.find(t => t.value === attackType)?.label} • ${intensity} req/s • ${duration}s`);

    const batchSize = Math.max(1, Math.floor(intensity / 10));
    intervalRef.current = setInterval(() => {
      for (let i = 0; i < batchSize; i++) {
        sendRequest();
      }
    }, 100);

    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    setTimeout(() => stopSimulation(), duration * 1000);
  };

  const stopSimulation = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    const totalElapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
    addLog('info', 'Simulation completed', `Duration: ${totalElapsed}s • Total: ${statsRef.current.totalSent} • Blocked: ${statsRef.current.blockedCount}`);
  };

  useEffect(() => {
    return () => { 
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const mitigationRate = stats.totalSent > 0 ? ((stats.blockedCount / stats.totalSent) * 100).toFixed(1) : '0.0';
  const availability = stats.totalSent > 0 ? ((stats.successCount / stats.totalSent) * 100).toFixed(1) : '0.0';
  const progress = isRunning ? Math.min(100, (elapsedTime / duration) * 100) : 0;

  const currentAttack = ATTACK_TYPES.find(t => t.value === attackType)!;
  const currentTarget = TARGET_OPTIONS.find(t => t.value === targetEndpoint)!;

  return (
    <div className="min-h-screen grid-pattern" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🚀 Traffic Simulator
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '15px' }}>
              Generate legitimate and attack traffic to test WAF protection mechanisms
            </p>
          </div>
          <Link href="/" className="btn btn-ghost" style={{ fontSize: '13px', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div className="card card-glow-blue">
            <div className="section-title blue">Attack Configuration</div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Attack Type</label>
              <div style={{ display: 'grid', gap: '8px' }}>
                {ATTACK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAttackType(type.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: attackType === type.value ? `rgba(56, 189, 248, 0.1)` : 'var(--bg-tertiary)',
                      border: `1px solid ${attackType === type.value ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: attackType === type.value ? 'var(--accent-blue)' : 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = attackType === type.value ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-tertiary)'}
                  >
                    <span style={{ fontSize: '20px' }}>{type.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{type.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{type.description}</div>
                    </div>
                    {attackType === type.value && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Intensity</label>
                <span style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '14px' }}>{intensity} req/s</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                value={intensity}
                onChange={e => setIntensity(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>10 req/s</span><span>1000 req/s</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Duration</label>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '14px' }}>{duration}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-green)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>5s</span><span>300s</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Target</label>
              <div style={{ display: 'grid', gap: '8px' }}>
                {TARGET_OPTIONS.map((target) => (
                  <button
                    key={target.value}
                    onClick={() => setTargetEndpoint(target.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: targetEndpoint === target.value 
                        ? (target.value === 'waf' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                        : 'var(--bg-tertiary)',
                      border: `1px solid ${targetEndpoint === target.value 
                        ? (target.value === 'waf' ? 'var(--accent-green)' : 'var(--accent-red)')
                        : 'var(--border-primary)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: targetEndpoint === target.value 
                        ? (target.value === 'waf' ? 'var(--accent-green)' : 'var(--accent-red)')
                        : 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = targetEndpoint === target.value 
                      ? (target.value === 'waf' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                      : 'var(--bg-tertiary)'}
                  >
                    <span style={{ fontSize: '20px' }}>{target.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{target.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{target.description}</div>
                    </div>
                    {targetEndpoint === target.value && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={isRunning ? stopSimulation : startSimulation}
              disabled={isRunning && false}
              className={isRunning ? 'btn btn-danger' : 'btn btn-primary'}
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            >
              {isRunning ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  Stop Simulation
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Start Simulation
                </>
              )}
            </button>
          </div>

          <div className="card card-glow-green">
            <div className="section-title green">Real-time Statistics</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-box">
                <div className="stat-label">Total Sent</div>
                <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{stats.totalSent.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Success (200)</div>
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.successCount.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Blocked (429)</div>
                <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{stats.blockedCount.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Errors</div>
                <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.errorCount.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Latency</div>
                <div className="stat-value stat-value-small" style={{ color: 'var(--accent-blue)' }}>{Math.round(stats.avgLatency)}ms</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Current RPS</div>
                <div className="stat-value stat-value-small" style={{ color: 'var(--accent-purple)' }}>{stats.rps.toFixed(1)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mitigation Rate</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-amber)' }}>{mitigationRate}%</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Availability</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-green)' }}>{availability}%</div>
              </div>
            </div>

            {isRunning && (
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Progress</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '14px' }}>
                    {elapsedTime.toFixed(1)}s / {duration}s
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {!isRunning && stats.totalSent > 0 && (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(74, 222, 128, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-accent)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', marginBottom: '8px' }}>Simulation Complete</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Total: </span><span style={{ fontWeight: '600' }}>{stats.totalSent}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Blocked: </span><span style={{ fontWeight: '600', color: 'var(--accent-amber)' }}>{stats.blockedCount}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Mitigation: </span><span style={{ fontWeight: '600', color: 'var(--accent-green)' }}>{mitigationRate}%</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title amber" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>📝 Live Logs</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setLogs([])}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Clear
              </button>
              <span className="badge badge-info" style={{ fontSize: '11px' }}>{logs.length} entries</span>
            </div>
          </div>
          <div 
            className="scrollbar-thin" 
            style={{ 
              height: '400px', 
              overflow: 'auto', 
              background: 'var(--bg-primary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              padding: '8px',
              fontFamily: 'monospace',
            }}
          >
            {logs.length === 0 && (
              <div style={{ 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                padding: '60px 20px',
                fontSize: '14px'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <div style={{ fontWeight: '500', marginBottom: 4 }}>No logs yet</div>
                <div style={{ fontSize: '13px' }}>Start a simulation to see traffic logs...</div>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-type">{log.type.toUpperCase()}</span>
                <span style={{ fontWeight: '500' }}>{log.message}</span>
                {log.details && <span className="log-details"> • {log.details}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}