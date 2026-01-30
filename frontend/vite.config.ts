import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: resolve(__dirname, "../custom_components/floorplan_manager/www"),
    emptyOutDir: false,
    lib: {
      entry: {
        "floorplan-manager-card": resolve(__dirname, "src/card.ts"),
        "floorplan-manager-panel": resolve(__dirname, "src/panel.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
