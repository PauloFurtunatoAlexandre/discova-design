// Factory functions for creating test data.
// Built out as each feature prompt is implemented.

export function createTestUser(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    ...overrides,
  };
}

export function createTestWorkspace(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Test Workspace",
    slug: `test-workspace-${Date.now()}`,
    ...overrides,
  };
}
