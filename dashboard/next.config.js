/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 120,
  async rewrites() {
    return [
      {
        source: '/api/prometheus/:path*',
        destination: 'http://prometheus:9090/:path*',
      },
      {
        source: '/api/waf/:path*',
        destination: 'http://waf:3000/:path*',
      },
      {
        source: '/api/target/:path*',
        destination: 'http://target:3001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;