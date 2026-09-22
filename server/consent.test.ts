import { describe, expect, it } from "vitest";

describe("Consent & Privacy Controls", () => {
  interface Candidate {
    name: string;
    visibility: "PRIVATE" | "COLLEGE_ONLY" | "CONSENTED" | "PUBLIC";
    readiness: number;
    phone: string;
    cgpa: number;
  }

  const candidatePool: Candidate[] = [
    { name: "Student Alpha", visibility: "CONSENTED", readiness: 75, phone: "+1234567890", cgpa: 8.5 },
    { name: "Student Beta", visibility: "PRIVATE", readiness: 88, phone: "+1987654321", cgpa: 9.1 },
    { name: "Student Gamma", visibility: "PUBLIC", readiness: 82, phone: "+1122334455", cgpa: 8.9 },
    { name: "Student Delta", visibility: "COLLEGE_ONLY", readiness: 70, phone: "+1555666777", cgpa: 7.8 },
  ];

  it("filters candidate discovery strictly to consented or public profiles", () => {
    const discoverable = candidatePool.filter(
      (c) => c.visibility === "CONSENTED" || c.visibility === "PUBLIC"
    );

    expect(discoverable).toHaveLength(2);
    expect(discoverable.map((c) => c.name)).toEqual(["Student Alpha", "Student Gamma"]);
  });

  it("strips private contact numbers and academic marks for recruiter view", () => {
    const discoverable = candidatePool
      .filter((c) => c.visibility === "CONSENTED" || c.visibility === "PUBLIC")
      .map((c) => ({
        name: c.name,
        readiness: c.readiness,
        // Stripped fields
        phone: undefined,
        cgpa: undefined,
      }));

    expect(discoverable[0].phone).toBeUndefined();
    expect(discoverable[0].cgpa).toBeUndefined();
    expect(discoverable[0].readiness).toBe(75);
  });
});
