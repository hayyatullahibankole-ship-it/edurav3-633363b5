import { describe, it, expect } from "vitest";
import { quoteForDate } from "@/lib/dailyQuotes";
describe("daily quote", () => {
  it("stays the same through a Lagos day and changes the next day", () => {
    const a = quoteForDate(new Date("2026-11-12T00:30:00Z"));
    expect(quoteForDate(new Date("2026-11-12T22:00:00Z"))).toBe(a);
    expect(quoteForDate(new Date("2026-11-13T00:30:00Z"))).not.toBe(a);
  });
});
