/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.scdn.co', // Spotify images
      'e-cdns-images.dzcdn.net', // Deezer images
      'i.ytimg.com', // YouTube thumbnails
      'lh3.googleusercontent.com', // Google images
      'via.placeholder.com' // Placeholder images
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Configuration pour les modules audio
    config.module.rules.push({
      test: /\.(mp3|wav|flac|aac)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;
