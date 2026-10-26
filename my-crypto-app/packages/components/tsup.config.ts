import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "viem",
    "wagmi",
    "@my-crypto-app/core",
    "@my-crypto-app/hooks",
    "@my-crypto-app/burner-connector",
  ],
  // Preserve 'use client' directives for Next.js
  banner: {
    js: '"use client";',
  },
});
