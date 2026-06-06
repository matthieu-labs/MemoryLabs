// Build step (Netlify): write config.js from environment variables so the
// deployed site gets its Supabase URL + anon key without committing them.
// Locally you keep your own gitignored config.js — this only runs on deploy.
const fs = require("fs");

const url = process.env.SUPABASE_URL || "";
const anonKey = process.env.SUPABASE_ANON_KEY || "";

const contents =
  `// Generated at build time from Netlify environment variables. Do not edit.\n` +
  `window.MEMOIR_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey }, null, 2)};\n`;

fs.writeFileSync("config.js", contents);
console.log(`gen-config: wrote config.js (${url ? "Supabase URL set" : "NO Supabase URL — set SUPABASE_URL env var"})`);
