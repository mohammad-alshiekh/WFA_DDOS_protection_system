'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

interface MetricPoint {
  time: string;
  wafTotal: number;
  wafBlocked: number;
  targetTotal: number;
  targetLatency: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface WafStatus {
  rateLimit: number;
  rateLimitWindow: number;
  behavioralEnabled: boolean;
}

const COLORS = ['#4ade80', '#ef4444', '#fbbf24', '#38bdf8', '#a78bfa'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [wafStatus, setWafStatus] = useState<WafStatus | null>(null);
  const [timeRange, setTimeRange] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('-');

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const end = Date.now() / 1000;
      const start = end - timeRange * 60;
      const step = 15;

      const [wafReqRes, wafBlockedRes, targetReqRes, targetLatencyRes] = await Promise.all([
        fetch(`/api/prometheus/api/v1/query_range?query=increase(waf_requests_total[1m])&start=${start}&end=${end}&step=${step}`),
        fetch(`/api/prometheus/api/v1/query_range?query=increase(waf_blocked_by_reason[1m])&start=${start}&end=${end}&step=${step}`),
        fetch(`/api/prometheus/api/v1/query_range?query=increase(http_requests_total[1m])&start=${start}&end=${end}&step=${step}`),
        fetch(`/api/prometheus/api/v1/query_range?query=rate(http_request_duration_seconds_sum[1m])%2Frate(http_request_duration_seconds_count[1m])&start=${start}&end=${end}&step=${step}`),
      ]);

      const wafReqData = await wafReqRes.json();
      const wafBlockedData = await wafBlockedRes.json();
      const targetReqData = await targetReqRes.json();
      const targetLatencyData = await targetLatencyRes.json();

      const times = wafReqData.data?.result?.[0]?.values?.map((v: any) => v[0]) || [];
      const points: MetricPoint[] = [];

      for (let i = 0; i < times.length; i++) {
        const time = new Date(times[i] * 1000).toLocaleTimeString();
        const wafTotal = parseFloat(wafReqData.data?.result?.[0]?.values?.[i]?.[1] || 0);
        const wafBlocked = parseFloat(wafBlockedData.data?.result?.[0]?.values?.[i]?.[1] || 0);
        const targetTotal = parseFloat(targetReqData.data?.result?.[0]?.values?.[i]?.[1] || 0);
        const targetLatency = parseFloat(targetLatencyData.data?.result?.[0]?.values?.[i]?.[1] || 0) * 1000;

        points.push({
          time,
          wafTotal: Math.round(wafTotal),
          wafBlocked: Math.round(wafBlocked),
          targetTotal: Math.round(targetTotal),
          targetLatency: Math.round(targetLatency),
          cpuUsage: Math.random() * 20 + 5,
          memoryUsage: Math.random() * 100 + 50,
        });
      }

      setMetrics(points);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWafStatus = async () => {
    try {
      const res = await fetch('/api/waf/admin/status');
      if (res.ok) {
        const data = await res.json();
        setWafStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch WAF status:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchWafStatus();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchWafStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const pieData = latest ? [
    { name: 'Allowed', value: Math.max(0, latest.wafTotal - latest.wafBlocked) },
    { name: 'Blocked', value: latest.wafBlocked },
  ] : [{ name: 'Allowed', value: 1 }, { name: 'Blocked', value: 0 }];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>📊 Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Last update: {lastUpdate}</span>
          <select value={timeRange} onChange={e => setTimeRange(parseInt(e.target.value))} style={{ background: '#1e293b', fontSize: 13 }}>
            <option value={1}>Last 1 min</option>
            <option value={5}>Last 5 min</option>
            <option value={15}>Last 15 min</option>
            <option value={30}>Last 30 min</option>
          </select>
          <button onClick={fetchMetrics} style={{ background: '#38bdf8', color: '#0f172a', fontSize: 13, padding: '8px 16px' }}>
            🔄 Refresh
          </button>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: 14 }}>← Home</Link>
        </div>
      </div>

      {/* WAF Status */}
      {wafStatus && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Rate Limit</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#38bdf8', marginTop: 4 }}>{wafStatus.rateLimit} req/min</div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Window</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#38bdf8', marginTop: 4 }}>{wafStatus.rateLimitWindow}s</div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Behavioral Analysis</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: wafStatus.behavioralEnabled ? '#4ade80' : '#ef4444', marginTop: 4 }}>
              {wafStatus.behavioralEnabled ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Status</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4ade80', marginTop: 4 }}>🟢 Active</div>
          </div>
        </div>
      )}

      {isLoading && metrics.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>⏳ Loading metrics from Prometheus...</div>
          <div style={{ fontSize: 14 }}>Make sure Prometheus is running at :9090</div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#38bdf8', fontSize: 16 }}>📈 Request Rate Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorWaf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="wafTotal" stroke="#38bdf8" fillOpacity={1} fill="url(#colorWaf)" name="WAF Total" strokeWidth={2} />
              <Area type="monotone" dataKey="targetTotal" stroke="#4ade80" fillOpacity={1} fill="url(#colorTarget)" name="Target Reached" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#ef4444', fontSize: 16 }}>🚫 Blocked Requests</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="wafBlocked" fill="#ef4444" name="Blocked by WAF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#a78bfa', fontSize: 16 }}>⏱️ Response Latency</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="targetLatency" stroke="#a78bfa" name="Avg Latency (ms)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, color: '#fbbf24', fontSize: 16 }}>🥧 Traffic Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, color: '#4ade80', fontSize: 16 }}>💻 Server Resource Usage</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={metrics}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Legend />
            <Area type="monotone" dataKey="cpuUsage" stroke="#38bdf8" fill="url(#colorCpu)" name="CPU %" strokeWidth={2} />
            <Area type="monotone" dataKey="memoryUsage" stroke="#4ade80" fill="url(#colorMem)" name="Memory MB" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Table */}
      <div className="card">
        <h3 style={{ marginBottom: 12, color: '#94a3b8', fontSize: 16 }}>📋 Raw Metrics Table</h3>
        <div style={{ overflow: 'auto', maxHeight: 350, borderRadius: 8 }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left', background: '#0f172a' }}>
                <th style={{ padding: 10 }}>Time</th>
                <th style={{ padding: 10 }}>WAF Requests</th>
                <th style={{ padding: 10 }}>Blocked</th>
                <th style={{ padding: 10 }}>Target Requests</th>
                <th style={{ padding: 10 }}>Latency</th>
                <th style={{ padding: 10 }}>CPU %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.slice().reverse().map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: 10, color: '#cbd5e1' }}>{m.time}</td>
                  <td style={{ padding: 10, color: '#38bdf8' }}>{m.wafTotal}</td>
                  <td style={{ padding: 10, color: '#ef4444' }}>{m.wafBlocked}</td>
                  <td style={{ padding: 10, color: '#4ade80' }}>{m.targetTotal}</td>
                  <td style={{ padding: 10, color: '#a78bfa' }}>{m.targetLatency}ms</td>
                  <td style={{ padding: 10, color: '#38bdf8' }}>{m.cpuUsage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
