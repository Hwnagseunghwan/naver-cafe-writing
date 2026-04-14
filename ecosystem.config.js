module.exports = {
  apps: [
    {
      name: "web",
      script: "node",
      args: "node_modules/next/dist/bin/next start",
      cwd: "C:\\naver-cafe-writing",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "poster",
      script: "node",
      args: "node_modules/ts-node/dist/bin.js --project tsconfig.poster.json poster/index.ts",
      cwd: "C:\\naver-cafe-writing",
    },
  ],
};
