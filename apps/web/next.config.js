/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dutch/shared'],
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'supabase.co'],
  },
}

module.exports = nextConfig 