import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@lww/shared', '@lww/engine'],
}

export default nextConfig
