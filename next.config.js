/** @type {import('next').NextConfig} */
const allowedDevOriginsFromEnv = (process.env.LANDING_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedDevOrigins = ["192.168.*.*", "10.*.*.*", "172.*.*.*"];
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  distDir: isDev ? ".next-dev" : ".next",
  allowedDevOrigins:
    allowedDevOriginsFromEnv.length > 0
      ? allowedDevOriginsFromEnv
      : defaultAllowedDevOrigins,
};

export default nextConfig;
