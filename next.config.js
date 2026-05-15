/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // 让访问 https://neshama.site/ 时直接吐出 public/neshama.html
      { source: '/', destination: '/neshama.html' },
    ];
  },
};

module.exports = nextConfig;
