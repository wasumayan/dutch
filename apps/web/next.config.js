/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dutch/shared'],
  images: {
    domains: ['localhost', 'supabase.co'],
  },
}

module.exports = nextConfig 