/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', 'bcryptjs', 'pdfkit'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
