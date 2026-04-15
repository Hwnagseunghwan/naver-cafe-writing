const path = require('path');
const fs = require('fs');

// dotenvx가 dotenv를 가로채는 문제를 우회하여 .env 파일을 직접 파싱
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envVars = loadEnv();

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
        ...envVars,
      },
    },
    {
      name: "poster",
      script: "node",
      args: "node_modules/ts-node/dist/bin.js --project tsconfig.poster.json poster/index.ts",
      cwd: "C:\\naver-cafe-writing",
      env: {
        ...envVars,
      },
    },
  ],
};
