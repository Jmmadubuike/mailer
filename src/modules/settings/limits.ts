function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function dailyCounterKey(date: Date): string {
  return `daily_send_counter:${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function reservationAccepted(used: number, limit: number): boolean {
  return limit <= 0 || used <= limit;
}
