import { describe, it, expect } from "vitest";
import { generateFakeResponse } from "../src/services/fakeGenerator.js";

describe("Fake Generator", () => {
  it("generates 30 ordered events", () => {
    const events = generateFakeResponse();

    expect(events).toHaveLength(30);
    expect(events[0]).toBe("Generated response event 1");
    expect(events[29]).toBe("Generated response event 30");
  });
});
