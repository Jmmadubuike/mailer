export const RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 5,
  complained: 6,
  unsubscribed: 7,
  failed: 8,
  suppressed: 8,
};

function progressed(current: string, next: string): boolean {
  return (RANK[next] ?? -1) > (RANK[current] ?? -1);
}

export function recipientStatusAfterEvent(
  current: string,
  event: string,
): string | null {
  switch (event) {
    case "sent":
      return current === "pending" ? "sent" : null;
    case "delivered":
      return progressed(current, "delivered") ? "delivered" : null;
    case "opened":
      return progressed(current, "opened") ? "opened" : null;
    case "clicked":
      return progressed(current, "clicked") ? "clicked" : null;
    case "bounced":
      return "bounced";
    case "complained":
      return "complained";
    case "unsubscribed":
      return "unsubscribed";
    case "failed":
      return "failed";
    case "suppressed":
      return "suppressed";
    default:
      return null;
  }
}
