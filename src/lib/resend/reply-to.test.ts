import { describe, expect, it } from "vitest";
import { resolveReplyTo } from "./reply-to";

describe("resolveReplyTo", () => {
  it("prefers the per-message override", () => {
    expect(
      resolveReplyTo({
        message: "reply@a.com",
        domain: "reply@b.com",
        global: "reply@c.com",
      }),
    ).toBe("reply@a.com");
  });

  it("falls back to the domain default, then the global default", () => {
    expect(resolveReplyTo({ domain: "reply@b.com", global: "reply@c.com" })).toBe(
      "reply@b.com",
    );
    expect(resolveReplyTo({ global: "reply@c.com" })).toBe("reply@c.com");
  });

  it("returns undefined when nothing is configured", () => {
    expect(resolveReplyTo({})).toBeUndefined();
  });
});
