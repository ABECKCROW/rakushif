const { vercel } = require('@vercel/remix');

module.exports = vercel({
  // Specify that we're using Vite as the build tool
  buildCommand: "remix vite:build",
  devCommand: "remix vite:dev",
  serverBuildPath: "build/server/index.js",
});
