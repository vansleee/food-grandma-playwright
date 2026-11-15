---
name: playwright-spec-tests
description: Coordinate Playwright Planner, Generator and Healer for merged specs and verified test PRs.
tools: [read, search, edit, execute, agent, "playwright-test/*"]
mcp-servers:
  playwright-test:
    type: stdio
    command: node
    args:
      - tests/e2e/ai-agent/food-grandma-fastapi/node_modules/playwright/cli.js
      - run-test-mcp-server
      - --headless
      - --config
      - tests/e2e/ai-agent/food-grandma-fastapi/playwright.agents.config.ts
    tools:
      - "*"
---
Read `.github/prompts/spec-tests.md` and the selected specs from the assigned issue.
Use the named Playwright Test Agents in sequence, giving each the selected spec,
output directory, seed path, case IDs and repository constraints:
1. playwright-test-planner: explore the running management site; produce plan.md
   under each selected generated directory, covering API, E2E and Acceptance.
2. playwright-test-generator: replay the browser scenarios and generate E2E and
   UI acceptance tests from the plan. Implement API contracts and API acceptance
   with Playwright APIRequestContext using the actual backend source and responses.
   Do not assume the browser generator automatically covers API contracts.
3. Run all three projects. For test defects invoke playwright-test-healer,
   at most three rounds; keep real product failures and blocked requirements.
4. Write coverage.json and README with evidence. Run select, inventory, all three
   projects with JSON reports, then reports using scripts/spec-ci.mjs as in
   `.github/workflows/spec-tests.yml`. Seed tests do not count toward coverage.
Commit only allowed generated files. Keep PR draft unless every gate passes.
If custom agents or Playwright Test MCP tools are unavailable, stop with an
explicit setup error; do not silently substitute an unverified generation run.
