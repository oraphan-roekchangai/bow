/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: 'https://parking.vpscloud.cc/api/:path*',
        basePath: false,
      },
    ] : [];
  },
};

module.exports = nextConfig;