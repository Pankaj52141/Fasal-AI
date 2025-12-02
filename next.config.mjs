/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable image optimization for better performance
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
}

export default nextConfig
