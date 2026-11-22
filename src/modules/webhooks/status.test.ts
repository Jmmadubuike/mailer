import { describe, expect, it } from "vitest";
import { recipientStatusAfterEvent } from "./status";

describe("recipientStatusAfterEvent", () => {
  it("progresses through the normal lifecycle", () => {
    expect(recipientStatusAfterEvent("pending", "sent")).toBe("sent");
    expect(recipientStatusAfterEvent("sent", "delivered")).toBe("delivered");
    expect(recipientStatusAfterEvent("delivered", "opened")).toBe("opened");
    expect(recipientStatusAfterEvent("opened", "clicked")).toBe("clicked");
  });

  it("does not regress from clicked to delivered or opened", () => {
    expect(recipientStatusAfterEvent("clicked", "delivered")).toBeNull();
    expect(recipientStatusAfterEvent("clicked", "opened")).toBeNull();
  });

  it("applies terminal events regardless of current state", () => {
    expect(recipientStatusAfterEvent("clicked", "bounced")).toBe("bounced");
    expect(recipientStatusAfterEvent("delivered", "complained")).toBe(
      "complained",
    );
    expect(recipientStatusAfterEvent("sent", "unsubscribed")).toBe(
      "unsubscribed",
    );
  });

  it("ignores unknown events", () => {
    expect(recipientStatusAfterEvent("sent", "email.unknown")).toBeNull();
  });
});
