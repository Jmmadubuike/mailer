import "server-only";
import mongoose from "mongoose";
import { Campaign, type ICampaign } from "@/models/Campaign";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import { AppError } from "@/lib/errors";

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  complaints: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  failed: number;
  totalOpens: number;
  totalClicks: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export async function getCampaignReport(campaignId: string): Promise<{
  campaign: ICampaign;
  stats: CampaignStats;
}> {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new AppError("Campaign not found", 404);
  }
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) throw new AppError("Campaign not found", 404);

  const [result] = await CampaignRecipient.aggregate<{
    total: Array<{ count: number }>;
    accepted: Array<{ count: number }>;
    delivered: Array<{ count: number }>;
    bounced: Array<{ count: number }>;
    complained: Array<{ count: number }>;
    opened: Array<{ count: number }>;
    clicked: Array<{ count: number }>;
    unsubscribed: Array<{ count: number }>;
    failed: Array<{ count: number }>;
    totalOpens: Array<{ count: number }>;
    totalClicks: Array<{ count: number }>;
  }>([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $facet: {
        total: [{ $count: "count" }],
        accepted: [
          { $match: { providerMessageId: { $type: "string" } } },
          { $count: "count" },
        ],
        delivered: [{ $match: { events: "delivered" } }, { $count: "count" }],
        bounced: [{ $match: { events: "bounced" } }, { $count: "count" }],
        complained: [
          { $match: { events: "complained" } },
          { $count: "count" },
        ],
        opened: [{ $match: { events: "opened" } }, { $count: "count" }],
        clicked: [{ $match: { events: "clicked" } }, { $count: "count" }],
        unsubscribed: [
          { $match: { events: "unsubscribed" } },
          { $count: "count" },
        ],
        failed: [{ $match: { events: "failed" } }, { $count: "count" }],
        totalOpens: [
          { $group: { _id: null, count: { $sum: "$openCount" } } },
        ],
        totalClicks: [
          { $group: { _id: null, count: { $sum: "$clickCount" } } },
        ],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;
  const sent = result?.accepted[0]?.count ?? 0;
  const delivered = result?.delivered[0]?.count ?? 0;
  const bounced = result?.bounced[0]?.count ?? 0;
  const complaints = result?.complained[0]?.count ?? 0;
  const opens = result?.opened[0]?.count ?? 0;
  const clicks = result?.clicked[0]?.count ?? 0;
  const unsubscribes = result?.unsubscribed[0]?.count ?? 0;
  const failed = result?.failed[0]?.count ?? 0;
  const totalOpens = result?.totalOpens[0]?.count ?? 0;
  const totalClicks = result?.totalClicks[0]?.count ?? 0;

  const rate = (numerator: number, denominator: number) =>
    denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;

  return {
    campaign,
    stats: {
      total,
      sent,
      delivered,
      bounced,
      complaints,
      opens,
      clicks,
      unsubscribes,
      failed,
      totalOpens,
      totalClicks,
      deliveryRate: rate(delivered, sent),
      openRate: rate(opens, delivered),
      clickRate: rate(clicks, delivered),
    },
  };
}

export async function listCampaignRecipients(campaignId: string) {
  return CampaignRecipient.find({ campaignId })
    .sort({ email: 1 })
    .select("email status providerMessageId error events openedAt clickedAt")
    .lean();
}
