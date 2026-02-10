import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Externalize problematic modules to avoid ESM/CommonJS conflicts
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark jsdom and related modules as external to avoid bundling issues
      config.externals = config.externals || []
      config.externals.push({
        'jsdom': 'commonjs jsdom',
        'html-encoding-sniffer': 'commonjs html-encoding-sniffer',
      })
    }
    return config
  },
};

export default nextConfig;
