/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['image.pollinations.ai', 'pollinations.ai', 'replicate.delivery'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pollinations.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pollinations.ai',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig 