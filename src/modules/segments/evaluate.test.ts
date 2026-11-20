import { describe, expect, it } from "vitest";
import {
  evaluateSegment,
  type SegmentGroup,
} from "./evaluate";

const CONTEXT = { listIds: ["list-1"] };

function contact(overrides: Record<string, unknown> = {}) {
  return {
    email: "ada@example.com",
    first_name: "Ada",
    last_name: "Lovelace",
    status: "subscribed",
    tags: ["vip"],
    company: "Analytical Engines",
    organization: "",
    created_at: new Date("2024-01-01T00:00:00Z"),
    custom_fields: { industry: "Software" },
    ...overrides,
  };
}

describe("evaluateSegment", () => {
  it("evaluates equals and contains conditions", () => {
    const root: SegmentGroup = {
      combinator: "and",
      children: [
        { field: "status", operator: "equals", value: "subscribed" },
        { field: "tags", operator: "contains", value: "vip" },
      ],
    };
    expect(evaluateSegment(root, contact(), CONTEXT)).toBe(true);
  });

  it("evaluates custom fields", () => {
    const root: SegmentGroup = {
      combinator: "and",
      children: [
        {
          field: "custom_fields.industry",
          operator: "equals",
          value: "Software",
        },
      ],
    };
    expect(evaluateSegment(root, contact(), CONTEXT)).toBe(true);
  });

  it("evaluates is_empty", () => {
    const root: SegmentGroup = {
      combinator: "and",
      children: [{ field: "organization", operator: "is_empty" }],
    };
    expect(evaluateSegment(root, contact(), CONTEXT)).toBe(true);
  });

  it("evaluates lists membership via contains", () => {
    const root: SegmentGroup = {
      combinator: "and",
      children: [
        { field: "lists", operator: "contains", value: "list-1" },
      ],
    };
    expect(evaluateSegment(root, contact(), CONTEXT)).toBe(true);
  });

  it("evaluates date comparisons", () => {
    const root: SegmentGroup = {
      combinator: "and",
      children: [
        { field: "created_at", operator: "after", value: "2023-12-31T00:00:00Z" },
      ],
    };
    expect(evaluateSegment(root, contact(), CONTEXT)).toBe(true);
  });
});
