import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, marginBottom: 12, background: 'linear-gradient(90deg, #38bdf8, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🔒 WAF DDoS Protection
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
          University project for Web Application Firewall and DDoS attack mitigation research
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Link href="/simulator" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              >
            <h2 style={{ fontSize: 24, marginBottom: 12, color: '#38bdf8' }}>🚀 Traffic Simulator</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              Generate legitimate and attack traffic to test WAF protection mechanisms. 
              Supports GET flood, POST flood, and Slowloris attacks.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#38bdf8' }}>GET Flood</span>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#38bdf8' }}>POST Flood</span>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#38bdf8' }}>Slowloris</span>
            </div>
          </div>
        </Link>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                
          >
            <h2 style={{ fontSize: 24, marginBottom: 12, color: '#4ade80' }}>📊 Analytics Dashboard</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              Real-time metrics and performance comparison. Visualize before/after 
              WAF protection with request rates, latency, and resource usage.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#4ade80' }}>Prometheus</span>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#4ade80' }}>Grafana</span>
              <span style={{ background: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#4ade80' }}>Live Charts</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 20, color: '#fbbf24', fontSize: 18 }}>🏗️ System Architecture</h3>
        <pre style={{ 
          fontSize: 13, 
          overflow: 'auto', 
          color: '#cbd5e1',
          background: '#0f172a',
          padding: 20,
          borderRadius: 8,
          lineHeight: 1.6,
          fontFamily: 'monospace'
        }}>
{`┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Dashboard  │─────▶│     WAF     │─────▶│   Target    │
│  (Next.js)  │      │  (NestJS)   │      │  (NestJS)   │
│  Simulator  │      │  Reverse    │      │  Web Server │
│  Analytics  │      │   Proxy     │      │  + Metrics  │
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                    │
                            ▼                    ▼
                     ┌─────────────┐      ┌─────────────┐
                     │    Redis    │      │ Prometheus  │
                     │  (State)    │      │  (Metrics)  │
                     └─────────────┘      └──────┬──────┘
                                                  ▼
                                           ┌─────────────┐
                                           │   Grafana   │
                                           │ (Dashboard) │
                                           └─────────────┘`}
        </pre>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: 8 }}>WAF (Port 3000)</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Rate limiting, behavioral analysis, connection tracking</div>
          </div>
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
            <div style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: 8 }}>Target (Port 3001)</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Protected API with Prometheus instrumentation</div>
          </div>
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
            <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: 8 }}>Dashboard (Port 3002)</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Traffic simulator + real-time analytics</div>
          </div>
          <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
            <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: 8 }}>Grafana (Port 3003)</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Advanced visualization dashboards</div>
          </div>
        </div>
      </div>
    </div>
  );
}
