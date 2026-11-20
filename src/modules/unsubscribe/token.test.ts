import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./token";

const SECRET = "test-secret-that-is-long-enough";

describe("unsubscribe tokens", () => {
  it("round-trips a valid token", () => {
    const token = createUnsubscribeToken(
      SECRET,
      "recipient-id",
      "ada@example.com",
    );
    expect(verifyUnsubscribeToken(SECRET, token)).toEqual({
      recipientId: "recipient-id",
      email: "ada@example.com",
    });
  });

  it("rejects a tampered token", () => {
    const token = createUnsubscribeToken(
      SECRET,
      "recipient-id",
      "ada@example.com",
    );
    const tampered = token.slice(0, -2) + "xx";
    expect(verifyUnsubscribeToken(SECRET, tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createUnsubscribeToken(
      SECRET,
      "recipient-id",
      "ada@example.com",
    );
    expect(verifyUnsubscribeToken("another-secret", token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyUnsubscribeToken(SECRET, "not-a-token")).toBeNull();
  });
});
