export const metadata = {
  title: 'WAF DDoS Protection Dashboard',
  description: 'Traffic simulator and analytics dashboard for WAF project',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#0f172a',
        color: '#e2e8f0',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  );
}
