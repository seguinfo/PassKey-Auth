/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'publickey-credentials-create=*, publickey-credentials-get=*'
          },
          {
            key: 'Feature-Policy',
            value: 'publickey-credentials-create *; publickey-credentials-get *'
          }
        ],
      },
    ]
  },
}

export default nextConfig
