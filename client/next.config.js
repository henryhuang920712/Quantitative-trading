/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        return [
        {
            source: '/api/:path',
            destination: 'http://localhost:8080/api/:path'

        },
        ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
        "mongodb-client-encryption": false ,
        "aws4": false
      };
  
      return config;
  }
}

module.exports = nextConfig
