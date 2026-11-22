import { describe, expect, it } from "vitest";
import { decideSuppressionOutcome } from "./suppression";

describe("decideSuppressionOutcome", () => {
  it("skips when the contact is no longer subscribed", () => {
    const outcome = decideSuppressionOutcome({ contactStatus: "unsubscribed" });
    expect(outcome.skip).toBe(true);
    expect(outcome.recipientStatus).toBe("suppressed");
  });

  it("skips when a global suppression exists", () => {
    expect(
      decideSuppressionOutcome({
        contactStatus: "subscribed",
        suppressionType: "bounce",
      }).skip,
    ).toBe(true);
    expect(
      decideSuppressionOutcome({
        contactStatus: "subscribed",
        suppressionType: "unsubscribe",
      }).recipientStatus,
    ).toBe("unsubscribed");
  });

  it("allows when subscribed and not suppressed", () => {
    expect(
      decideSuppressionOutcome({
        contactStatus: "subscribed",
        suppressionType: null,
      }).skip,
    ).toBe(false);
  });
});
