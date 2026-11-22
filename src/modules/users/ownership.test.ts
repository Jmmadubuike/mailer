import { describe, expect, it } from "vitest";
import { isLastActiveOwner } from "./ownership";

describe("isLastActiveOwner", () => {
  it("is true when the target is the only owner", () => {
    expect(isLastActiveOwner(1, true)).toBe(true);
  });

  it("is false when another owner remains", () => {
    expect(isLastActiveOwner(2, true)).toBe(false);
  });

  it("is false when the target is not an owner", () => {
    expect(isLastActiveOwner(1, false)).toBe(false);
  });
});
