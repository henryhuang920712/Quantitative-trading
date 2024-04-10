/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        return [
        {
            source: '/api/:path',
            destination: 'http://localhost:3000/api/:path'

        },
        ]
  },
  webpack: (config, {isServer}) => {
    config.resolve.fallback = {
        "mongodb-client-encryption": false ,
        "aws4": false
      };
      if (isServer) {
        config.externals.push('node-fetch');
      }  
      return config;
  },
}

module.exports = nextConfig
