import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Turbopack config for Next.js 16
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // Set to true in development if needed
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
