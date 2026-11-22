import { describe, expect, it } from "vitest";
import { classifyDeliveryError } from "./classification";

describe("classifyDeliveryError", () => {
  it("classifies missing/invalid domain configuration as permanent", () => {
    expect(classifyDeliveryError("No API key configured for domain")).toBe(
      "permanent",
    );
    expect(classifyDeliveryError("Sending domain not found")).toBe("permanent");
    expect(
      classifyDeliveryError("Recipient is not on the staging allow-list"),
    ).toBe("permanent");
  });

  it("classifies transient provider errors as retryable", () => {
    expect(classifyDeliveryError("Request timeout")).toBe("retryable");
    expect(classifyDeliveryError("429: rate limit exceeded")).toBe("retryable");
    expect(classifyDeliveryError("Network error ETIMEDOUT")).toBe("retryable");
  });

  it("defaults unknown errors to retryable", () => {
    expect(classifyDeliveryError("Something unexpected")).toBe("retryable");
  });
});
