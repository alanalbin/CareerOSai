import { describe, expect, it } from "vitest";
import { Qwen3Provider } from "./services/ai/qwen3";

describe("Qwen3 Provider Architecture", () => {
  it("initializes with configuration inspection", () => {
    const provider = new Qwen3Provider();
    const status = provider.getStatus();
    expect(status.model).toBeDefined();
    expect(status.baseUrl).toBeDefined();
    expect(typeof status.configured).toBe("boolean");
  });

  it("handles unconfigured AI gracefully without inventing fake answers", async () => {
    const unconfigured = new Qwen3Provider();
    const result = await unconfigured.analyzeResume("Sample student resume text", 1);
    // If not configured, should return clean failure flag and message, NOT fake data
    if (!unconfigured.getStatus().configured) {
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain("Qwen3");
    }
  });

  it("handles skill extraction offline fallback safely", async () => {
    const provider = new Qwen3Provider();
    const res = await provider.extractSkills("React and Python developer");
    if (!provider.getStatus().configured) {
      expect(res.success).toBe(false);
      expect(res.data).toBeNull();
    }
  });
});
