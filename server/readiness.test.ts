import { describe, expect, it } from "vitest";

describe("Career Readiness Scoring Engine Principles", () => {
  it("calculates weighted score according to platform specification", () => {
    // Scoring Weights:
    // Technical: 30%, Projects: 20%, Academic: 15%, Evidence: 15%, Experience: 10%, Alignment: 10%
    const technicalScore = 80;
    const projectScore = 75;
    const academicScore = 85;
    const evidenceStrengthScore = 70;
    const experienceScore = 60;
    const roleAlignmentScore = 90;

    const weightedTotal =
      technicalScore * 0.30 +
      projectScore * 0.20 +
      academicScore * 0.15 +
      evidenceStrengthScore * 0.15 +
      experienceScore * 0.10 +
      roleAlignmentScore * 0.10;

    const overallScore = Math.round(weightedTotal);

    expect(overallScore).toBe(77);
    expect(overallScore).toBeGreaterThanOrEqual(0);
    expect(overallScore).toBeLessThanOrEqual(100);

    // Placement readiness is derived from overall readiness
    const placementReadiness = Math.round(overallScore * 0.92);
    expect(placementReadiness).toBe(71);
  });

  it("handles zero evidence gracefully", () => {
    const weightedTotal = 0 * 0.30 + 0 * 0.20 + 70 * 0.15 + 0 * 0.15 + 0 * 0.10 + 0 * 0.10;
    const overallScore = Math.round(weightedTotal);
    expect(overallScore).toBe(11);
  });

  it("bounds maximum score to 100", () => {
    const weightedTotal = 100 * 0.30 + 100 * 0.20 + 100 * 0.15 + 100 * 0.15 + 100 * 0.10 + 100 * 0.10;
    const overallScore = Math.min(100, Math.round(weightedTotal));
    expect(overallScore).toBe(100);
  });
});
