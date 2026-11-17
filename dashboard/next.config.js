/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 120,
  async rewrites() {
    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';
    const wafUrl = process.env.WAF_URL || 'http://localhost:3000';
    const targetUrl = process.env.TARGET_URL || 'http://localhost:3001';

    return [
      {
        source: '/api/prometheus/:path*',
        destination: `${prometheusUrl}/:path*`,
      },
      {
        source: '/api/waf/:path*',
        destination: `${wafUrl}/:path*`,
      },
      {
        source: '/api/target/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;