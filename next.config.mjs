/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de segurança
  poweredByHeader: false, // Remove o header X-Powered-By
  compress: true, // Compressão gzip
  
  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ],
      },
    ];
  },
  
  // Configurações de redirecionamento
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
    ];
  },
  
  // Configurações de imagens
  images: {
    domains: ['images.unsplash.com'], // Adicione domínios permitidos
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configurações de experimental features (apenas features seguras)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Configurações de webpack para segurança
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Minificação em produção
      config.optimization.minimize = true;
    }
    return config;
  },
};

export default nextConfig;
