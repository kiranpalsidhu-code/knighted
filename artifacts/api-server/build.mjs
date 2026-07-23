// Reconstructed esbuild bundler for @workspace/api-server.
//
// Produces a self-contained ESM bundle at dist/index.mjs (see package.json
// "start": `node --enable-source-maps ./dist/index.mjs`).
//
// Strategy: bundle the app source, the internal @workspace/* packages (which
// ship TypeScript source only), and third-party deps into one file. A short
// external list stays out of the bundle because they must load as separate
// files at runtime:
//   - pino / pino-pretty / thread-stream: pino spawns worker threads that
//     resolve these from node_modules; bundling breaks the worker.
//   - pg-native: optional native addon; may be absent, so never bundle it.

import { build } from "esbuild";

await build({
  entryPoints: { index: "src/index.ts" },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: true,
  minify: false,
  loader: { ".json": "json" },
  external: ["pino", "pino-pretty", "thread-stream", "pg-native"],
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
});

console.log("✓ api-server bundled → dist/index.mjs");
