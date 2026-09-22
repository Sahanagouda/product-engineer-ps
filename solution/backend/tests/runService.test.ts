import { describe, it, expect } from "vitest";
import {
  createRun,
  getRun,
  updateRunStatus,
} from "../src/services/runService.js";

describe("Run Service", () => {
  it("creates and updates run status", () => {
    const runId = "test-run-" + Date.now();
    const conversationId = "test-run-conversation";

    const createdRun = createRun(runId, conversationId);

    expect(createdRun.status).toBe("running");

    const completedRun = updateRunStatus(runId, "completed");

    expect(completedRun.status).toBe("completed");

    const retrievedRun = getRun(runId);

    expect(retrievedRun.status).toBe("completed");
  });
});
