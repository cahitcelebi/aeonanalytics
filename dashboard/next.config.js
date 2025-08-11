/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Eski i18n yapılandırmasını kaldırdık
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: true,
  },
  transpilePackages: ['@radix-ui/react-icons'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://aeonanalytic.com/:path*',
      },
    ];
  },
  // Disable static optimization for all pages
  images: {
    unoptimized: true,
  },
  // Enable dynamic rendering for all pages
  staticPageGenerationTimeout: 0,
  // Disable static exports
  output: 'standalone',
}

module.exports = nextConfig 
