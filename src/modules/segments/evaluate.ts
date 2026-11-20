export const SEGMENT_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
  "before",
  "after",
] as const;

export type SegmentOperator = (typeof SEGMENT_OPERATORS)[number];

export interface SegmentCondition {
  field: string;
  operator: SegmentOperator;
  value?: unknown;
}

export interface SegmentGroup {
  combinator: "and" | "or";
  children: SegmentNode[];
}

export type SegmentNode = SegmentCondition | SegmentGroup;

export type ContactRecord = Record<string, unknown> & {
  tags?: string[];
  custom_fields?: Record<string, unknown>;
};

export interface EvaluationContext {
  listIds: string[];
}

export function isGroup(node: SegmentNode): node is SegmentGroup {
  return typeof node === "object" && "children" in node;
}

export function evaluateSegment(
  root: SegmentGroup,
  contact: ContactRecord,
  context: EvaluationContext,
): boolean {
  return evaluateGroup(root, contact, context);
}

function evaluateGroup(
  group: SegmentGroup,
  contact: ContactRecord,
  context: EvaluationContext,
): boolean {
  if (group.combinator === "and") {
    return group.children.every((child) =>
      isGroup(child)
        ? evaluateGroup(child, contact, context)
        : evaluateCondition(child, contact, context),
    );
  }
  return group.children.some((child) =>
    isGroup(child)
      ? evaluateGroup(child, contact, context)
      : evaluateCondition(child, contact, context),
  );
}

function evaluateCondition(
  condition: SegmentCondition,
  contact: ContactRecord,
  context: EvaluationContext,
): boolean {
  const actual = resolveField(condition.field, contact, context);

  switch (condition.operator) {
    case "is_empty":
      return isEmpty(actual);
    case "is_not_empty":
      return !isEmpty(actual);
    case "equals":
      return isEqual(actual, condition.value);
    case "not_equals":
      return !isEqual(actual, condition.value);
    case "contains":
      return contains(actual, condition.value);
    case "not_contains":
      return !contains(actual, condition.value);
    case "starts_with":
      return (
        isString(actual) &&
        isString(condition.value) &&
        normalize(actual).startsWith(normalize(condition.value))
      );
    case "ends_with":
      return (
        isString(actual) &&
        isString(condition.value) &&
        normalize(actual).endsWith(normalize(condition.value))
      );
    case "greater_than":
      return compare(actual, condition.value) > 0;
    case "less_than":
      return compare(actual, condition.value) < 0;
    case "before":
      return compareDates(actual, condition.value) < 0;
    case "after":
      return compareDates(actual, condition.value) > 0;
    default:
      return false;
  }
}

function resolveField(
  field: string,
  contact: ContactRecord,
  context: EvaluationContext,
): unknown {
  if (field.startsWith("custom_fields.")) {
    const key = field.slice("custom_fields.".length);
    return contact.custom_fields?.[key];
  }
  if (field === "lists") {
    return context.listIds;
  }
  return contact[field];
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalize(value: unknown): string {
  return String(value).trim().toLowerCase();
}

function isEqual(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual)) {
    return actual.some((item) => normalize(item) === normalize(expected));
  }
  return normalize(actual) === normalize(expected);
}

function contains(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual)) {
    return actual.some((item) => normalize(item) === normalize(expected));
  }
  if (typeof actual === "string") {
    return normalize(actual).includes(normalize(expected));
  }
  return false;
}

function compare(actual: unknown, expected: unknown): number {
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  if (!Number.isNaN(actualNumber) && !Number.isNaN(expectedNumber)) {
    return actualNumber - expectedNumber;
  }
  return normalize(actual).localeCompare(normalize(expected));
}

function compareDates(actual: unknown, expected: unknown): number {
  const actualTime = new Date(String(actual)).getTime();
  const expectedTime = new Date(String(expected)).getTime();
  if (Number.isNaN(actualTime) || Number.isNaN(expectedTime)) return 0;
  return actualTime - expectedTime;
}
