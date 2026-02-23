import { defineConfig } from "vite";

export default defineConfig({
  base: "/cg-1/",
  build: {
    rollupOptions: {
      input: {
        index: "./index.html",
        cubes: "./cubes.html"
      }
    }
  }
});
