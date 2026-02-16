/** @type {import('next').NextConfig} */
const allowedDevOriginsFromEnv = (process.env.LANDING_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedDevOrigins = ["192.168.*.*", "10.*.*.*", "172.*.*.*"];

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins:
    allowedDevOriginsFromEnv.length > 0
      ? allowedDevOriginsFromEnv
      : defaultAllowedDevOrigins,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@lynx/brand-ui", "@lynx/brand-tokens"],
};

export default nextConfig;
