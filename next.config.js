/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Para deployments
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: true, // true = redirección permanente (301)
      },
    ];
  },
  // Reescribir requests del API para evitar Mixed Content
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://18.190.126.143:3000/:path*',
      },
    ];
  },
  // Configuración para permitir conexiones inseguras (fallback)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
