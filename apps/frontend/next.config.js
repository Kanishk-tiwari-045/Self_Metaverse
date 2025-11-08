/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
  },
}

export default nextConfig