import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen grid-pattern" style={{ backgroundColor: 'var(--bg-primary)', padding: '60px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '80px', 
            height: '80px', 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(74, 222, 128, 0.2))',
            border: '1px solid var(--border-accent)',
            marginBottom: '24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#homeIconGrad)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.4))' }}>
              <defs>
                <linearGradient id="homeIconGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#38bdf8"/>
                  <stop offset="100%" stopColor="#4ade80"/>
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="4" ry="4"/>
              <path d="M9 12h6M12 9v6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: '800', margin: '0 0 16px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WAF DDoS Protection
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
            University project for Web Application Firewall and DDoS attack mitigation research.
            Built with Next.js, NestJS, Redis, Prometheus & Grafana.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <Link href="/simulator" style={{ textDecoration: 'none' }}>
            <div className="card card-glow-blue home-card" style={{ 
              cursor: 'pointer', 
              transition: 'all var(--transition-normal)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  🚀
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Traffic Simulator</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                Generate legitimate and attack traffic to test WAF protection mechanisms. 
                Supports GET flood, POST flood, and Slowloris attacks with real-time visualization.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-info">GET Flood</span>
                <span className="badge badge-warning">POST Flood</span>
                <span className="badge badge-purple">Slowloris</span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span>Launch Simulator</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="card card-glow-green home-card" style={{ 
              cursor: 'pointer', 
              transition: 'all var(--transition-normal)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 197, 94, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  📊
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Analytics Dashboard</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                Real-time metrics and performance comparison. Visualize before/after 
                WAF protection with request rates, latency, and resource usage charts.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-success">Prometheus</span>
                <span className="badge badge-info">Grafana</span>
                <span className="badge badge-purple">Live Charts</span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span>View Dashboard</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="section-title amber">🏗️ System Architecture</div>
          <pre style={{ 
            fontSize: '12px', 
            overflow: 'auto', 
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            lineHeight: 1.7,
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
            border: '1px solid var(--border-primary)',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', transition: 'all var(--transition-normal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div>
                <div style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '15px' }}>WAF Service</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Rate limiting, behavioral analysis, connection tracking, IP blacklist/whitelist</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', transition: 'all var(--transition-normal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
                <div style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '15px' }}>Target Server</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Protected API with Prometheus instrumentation, health checks, CPU-intensive endpoints</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', transition: 'all var(--transition-normal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-amber)' }}></div>
                <div style={{ color: 'var(--accent-amber)', fontWeight: '700', fontSize: '15px' }}>Dashboard</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Traffic simulator + real-time analytics, Prometheus queries, interactive charts</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', transition: 'all var(--transition-normal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)' }}></div>
                <div style={{ color: 'var(--accent-purple)', fontWeight: '700', fontSize: '15px' }}>Grafana</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Advanced visualization dashboards, alerting, long-term metric storage</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px', padding: '32px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(74, 222, 128, 0.1))', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-accent)', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '12px' }}>Ready to Test?</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
            Start the traffic simulator to see the WAF in action. Launch attacks and watch the real-time blocking.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/simulator" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Simulation
            </Link>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}