/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/data/questions.json',
        destination: '/api/questions'
      }
    ];
  }
};

export default nextConfig;
