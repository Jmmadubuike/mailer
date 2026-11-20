import { describe, expect, it } from "vitest";
import { csvEscape, toCsv } from "./csv";

describe("csvEscape", () => {
  it("prefixes formula-injection characters", () => {
    expect(csvEscape("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(csvEscape("+1")).toBe('"\'+1"');
    expect(csvEscape("@cmd")).toBe('"\'@cmd"');
    expect(csvEscape("-1")).toBe(`"'-1"`);
  });

  it("escapes embedded quotes", () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe('"a","b"\r\n"c","d"');
  });
});
