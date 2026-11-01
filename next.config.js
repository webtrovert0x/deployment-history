const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@x402|@metamask\/connect-evm|accounts)/,
      })
    );
    return config;
  },
};

module.exports = nextConfig;
