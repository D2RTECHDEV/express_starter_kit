import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
