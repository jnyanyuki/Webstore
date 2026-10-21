const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:9000";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      "@webstore/ui",
      "@webstore/types",
      "@webstore/api-client",
      "@webstore/dynamic-attributes",
    ],
  },
  transpilePackages: [
    "@webstore/ui",
    "@webstore/types",
    "@webstore/api-client",
    "@webstore/dynamic-attributes",
  ],
  images: {
    loader: "custom",
    loaderFile: "./src/lib/imagekitLoader.ts",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/seller-center",
        destination: "/seller",
      },
      {
        source: "/api/logistics/:path*",
        destination: `${backendUrl}/api/logistics/:path*`,
      },
      {
        source: "/api/payments/:path*",
        destination: `${backendUrl}/api/payments/:path*`,
      },
      {
        source: "/api/orders/:path*",
        destination: `${backendUrl}/api/orders/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/products/:path*",
        destination: `${backendUrl}/api/products/:path*`,
      },
    ];
  },
};

export default nextConfig;
