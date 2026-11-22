export type SuppressionType = "unsubscribe" | "complaint" | "bounce";

export function decideSuppressionOutcome(input: {
  contactStatus?: string;
  suppressionType?: SuppressionType | null;
}): {
  skip: boolean;
  recipientStatus?: "unsubscribed" | "suppressed";
  reason?: string;
} {
  if (input.contactStatus && input.contactStatus !== "subscribed") {
    return {
      skip: true,
      recipientStatus: "suppressed",
      reason: "Contact is not subscribed",
    };
  }
  if (input.suppressionType) {
    return {
      skip: true,
      recipientStatus:
        input.suppressionType === "unsubscribe" ? "unsubscribed" : "suppressed",
      reason: `Suppressed after dispatch (${input.suppressionType})`,
    };
  }
  return { skip: false };
}
