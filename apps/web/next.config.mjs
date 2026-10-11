/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  async rewrites() {
    return [
      {
        source: "/seller-center",
        destination: "/seller",
      },
    ];
  },
};

export default nextConfig;
