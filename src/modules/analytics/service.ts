import "server-only";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import type { EngagementPoint } from "@/types/analytics";

export async function getEngagementSeries(
  days = 14,
): Promise<EngagementPoint[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const [sent, opened, clicked] = await Promise.all([
    aggregateByDay(
      { sentAt: { $gte: start } },
      "$sentAt",
    ),
    aggregateByDay(
      { events: "opened", openedAt: { $gte: start } },
      "$openedAt",
    ),
    aggregateByDay(
      { events: "clicked", clickedAt: { $gte: start } },
      "$clickedAt",
    ),
  ]);

  const series = new Map<string, EngagementPoint>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    series.set(key, { date: key, sent: 0, opened: 0, clicked: 0 });
  }

  const bump = (
    rows: Array<{ _id: string; count: number }>,
    field: "sent" | "opened" | "clicked",
  ) => {
    for (const row of rows) {
      const point = series.get(row._id);
      if (point) point[field] = row.count;
    }
  };

  bump(sent, "sent");
  bump(opened, "opened");
  bump(clicked, "clicked");

  return [...series.values()];
}

async function aggregateByDay(
  match: Record<string, unknown>,
  dateField: string,
): Promise<Array<{ _id: string; count: number }>> {
  return CampaignRecipient.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: dateField, timezone: "UTC" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
}
