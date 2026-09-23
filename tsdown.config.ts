import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"./index.ts",
		"./client/index.ts",
		"./common/index.ts",
		"./plugin/index.ts",
		"./ui/index.ts",
		"./ui/schema.ts",
		"./testing/index.ts",
	],
	outDir: "./dist",
	format: ["esm", "cjs"],
	target: "ESNEXT",
	tsconfig: "./tsconfig.json",
	clean: true,
	minify: "dce-only",
	unbundle: true,
	dts: {
		sourcemap: false,
	},
	exports: false,
});
