import { describe, expect, it } from "vitest";
import {
  isStagingEnv,
  parseAllowlist,
  recipientApproved,
} from "./allowlist";

describe("isStagingEnv", () => {
  it("is true only for staging", () => {
    expect(isStagingEnv("staging")).toBe(true);
    expect(isStagingEnv("production")).toBe(false);
    expect(isStagingEnv("development")).toBe(false);
  });
});

describe("parseAllowlist", () => {
  it("normalizes and trims a comma-separated list", () => {
    expect(parseAllowlist(" A@x.com , b@x.com ,, ")).toEqual(
      new Set(["a@x.com", "b@x.com"]),
    );
  });
  it("returns an empty set for empty input", () => {
    expect(parseAllowlist("")).toEqual(new Set());
  });
});

describe("recipientApproved", () => {
  const allowlist = new Set(["a@x.com", "b@x.com"]);
  it("approves case-insensitively", () => {
    expect(recipientApproved("A@X.com", allowlist)).toBe(true);
  });
  it("rejects unknown addresses", () => {
    expect(recipientApproved("c@x.com", allowlist)).toBe(false);
  });
});
