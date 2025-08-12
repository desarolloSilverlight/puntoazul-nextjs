/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: true, // true = redirección permanente (301)
      },
    ];
  },
};

module.exports = nextConfig;
