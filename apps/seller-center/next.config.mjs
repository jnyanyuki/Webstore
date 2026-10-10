/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@webstore/ui",
    "@webstore/types",
    "@webstore/dynamic-attributes",
    "@webstore/api-client",
  ],
};

export default nextConfig;
