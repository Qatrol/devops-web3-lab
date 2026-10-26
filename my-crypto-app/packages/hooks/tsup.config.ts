import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  external: ["react", "viem", "wagmi", "@tanstack/react-query", "@my-crypto-app/core"],
  // Preserve 'use client' directives for Next.js
  banner: {
    js: '"use client";',
  },
});
