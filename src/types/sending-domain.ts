import type {
  ApiKeyPermission,
  CredentialStatus,
  DnsRecord,
  DomainVerificationStatus,
} from "@/models/SendingDomain";

export interface SendingDomainDTO {
  id: string;
  name: string;
  domain: string;
  providerDomainId?: string;
  apiKeyHint?: string;
  permission: ApiKeyPermission;
  restrictedToDomain: boolean;
  verificationStatus: DomainVerificationStatus;
  isActive: boolean;
  emergencyKillSwitch: boolean;
  defaultSenderName?: string;
  defaultSenderAddress?: string;
  defaultReplyTo?: string;
  credentialStatus: CredentialStatus;
  lastTestedAt?: string;
  lastVerifiedAt?: string;
  dnsRecords: DnsRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SendableDomainOption {
  id: string;
  name: string;
  domain: string;
  defaultSenderName?: string;
  defaultSenderAddress?: string;
  defaultReplyTo?: string;
}

export interface DomainStats {
  domainId: string | null;
  domainName: string | null;
  totalRecipients: number;
  sent: number;
  delivered: number;
  bounced: number;
  complaints: number;
  opens: number;
  clicks: number;
  totalOpens: number;
  totalClicks: number;
  unsubscribes: number;
  failed: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
  complaintRate: number;
  unsubscribeRate: number;
}
