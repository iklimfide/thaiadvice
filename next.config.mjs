/** @type {import('next').NextConfig} */
const nextConfig = {
  /** App Router rotaları slashsız (`/tr`, `/tr/...`); `true` olsaydı her istekte ek yönlendirme riski. */
  trailingSlash: false,
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
        permanent: true,
      },
      /** Eski / yanlış URL: guides ayrı route değil; bölge slug'ı sanılıp 404 oluyordu. */
      {
        source: "/tr/guides/:path*",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/en/guides/:path*",
        destination: "/en",
        permanent: true,
      },
      /** Tekil mekân sayfası ana sayfaya taşındı / kaldırıldı. */
      {
        source: "/en/pattaya/walking-street/ocean-beats-club",
        destination: "/en",
        permanent: true,
      },
      /**
       * Hub yalnızca tam path (301 → dil ana sayfası).
       * `/tr/tayland/:path*` veya `/en/tayland/:path*` EKLEME: `tayland` bölge slug’ı ile
       * `/tr/tayland/kategori/makale` ve `/en/tayland/...` gerçek makale URL’leri vardır.
       */
      {
        source: "/tr/tayland",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/thailand",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/en/thailand",
        destination: "/en",
        permanent: true,
      },
      {
        source: "/en/tayland",
        destination: "/en",
        permanent: true,
      },
      /** TR `genel` slug’ı EN dilinde ana sayfaya. */
      {
        source: "/en/genel",
        destination: "/en",
        permanent: true,
      },
      {
        source: "/en/genel/:path*",
        destination: "/en",
        permanent: true,
      },
    ];
  },
  /**
   * Kök `/{slug}-{timestamp}.webp` → API proxy (dil rotası `/tr` vb. ile çakışmaz: .webp zorunlu).
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:file((?:[^/]+)-[0-9]{10,}\\.webp)",
          destination: "/api/image-proxy/:file",
        },
      ],
    };
  },
};

export default nextConfig;
