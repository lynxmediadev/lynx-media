/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@lynx/brand-ui", "@lynx/brand-tokens"],
};

export default nextConfig;
