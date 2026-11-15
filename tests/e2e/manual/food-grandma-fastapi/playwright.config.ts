import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // The target app backs onto a single shared SQLite DB with no per-worker
  // isolation — each spec resets/reseeds it via /api/test/reset+seed, so
  // running workers in parallel lets one spec's reset stomp another's
  // in-flight session. Run serially until the backend supports isolated
  // test databases per worker.
  fullyParallel: false,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:8082",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
