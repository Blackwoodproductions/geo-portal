/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['socket.io'],
  async redirects() {
    return [
      { source: '/portals/create', destination: '/portals/map?create=true', permanent: true },
      { source: '/portals/:id((?!map)[^/]+)', destination: '/portals/map?portal=:id', permanent: false },
    ];
  },
};

module.exports = nextConfig;
