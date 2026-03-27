/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // sharp + supabase: webpack vendor-chunks (özellikle Windows’ta) bazen
    // diske yazılmadan runtime manifest güncellenir → MODULE_NOT_FOUND @supabase.js
    serverComponentsExternalPackages: [
      "sharp",
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  /**
   * Windows’ta diske yazılan webpack pack önbelleği sık bozulabiliyor (MODULE_NOT_FOUND).
   * Dev’de bellek önbelleği: biraz daha yavaş, tutarlı derleme.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
