import { describe, expect, it } from "vitest";
import { dailyCounterKey, reservationAccepted } from "./limits";

describe("dailyCounterKey", () => {
  it("formats the local date as YYYY-MM-DD", () => {
    expect(dailyCounterKey(new Date(2026, 10, 22))).toBe(
      "daily_send_counter:2026-11-22",
    );
  });
});

describe("reservationAccepted", () => {
  it("accepts below and at the limit, rejects above it", () => {
    expect(reservationAccepted(99, 100)).toBe(true);
    expect(reservationAccepted(100, 100)).toBe(true);
    expect(reservationAccepted(101, 100)).toBe(false);
  });

  it("treats a non-positive limit as unlimited", () => {
    expect(reservationAccepted(1000, 0)).toBe(true);
  });
});
