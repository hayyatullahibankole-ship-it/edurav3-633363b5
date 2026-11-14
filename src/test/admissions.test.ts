import { describe, it, expect } from "vitest";
import { COURSES } from "@/data/admissionsData";
import { isEligible, matchCourses, scoreVerdict, consultantLink } from "@/lib/admissions";

const c = (id: string) => COURSES.find((x) => x.id === id)!;

describe("admissions finder", () => {
  it("medicine needs Physics, Chemistry, Biology", () => {
    expect(isEligible(c("medicine"), ["Physics", "Chemistry", "Biology"])).toBe(true);
    expect(isEligible(c("medicine"), ["Mathematics", "Chemistry", "Biology"])).toBe(false);
  });
  it("PCB matches medicine but not law", () => {
    const ids = matchCourses(["Physics", "Chemistry", "Biology"]).map((x) => x.id);
    expect(ids).toContain("medicine");
    expect(ids).not.toContain("law");
  });
  it("law needs Literature", () => {
    expect(isEligible(c("law"), ["Literature in English", "Government", "CRS"])).toBe(true);
    expect(isEligible(c("law"), ["Government", "CRS", "Economics"])).toBe(false);
  });
  it("score verdict", () => {
    expect(scoreVerdict(330, [250, 320])).toBe("strong");
    expect(scoreVerdict(260, [250, 320])).toBe("borderline");
    expect(scoreVerdict(200, [250, 320])).toBe("low");
  });
  it("consultant goes to Akboy WhatsApp", () => {
    expect(consultantLink("x")).toContain("wa.me/2348101466977");
  });
});
