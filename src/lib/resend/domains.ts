import "server-only";
import { getManagementClient } from "@/lib/resend/client";

export interface ProviderDomainRecord {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl: string;
  status: string;
}

export interface ProviderDomain {
  id: string;
  name: string;
  status: string;
  records?: ProviderDomainRecord[];
}

export async function createProviderDomain(
  name: string,
): Promise<ProviderDomain> {
  const { data, error } = await getManagementClient().domains.create({
    name,
  });

  if (error || !data) {
    throw new Error(
      error?.message ?? `Failed to register domain "${name}" with Resend`,
    );
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    records: data.records as ProviderDomainRecord[] | undefined,
  };
}

export async function getOrCreateProviderDomain(
  name: string,
): Promise<ProviderDomain> {
  const normalized = name.trim().toLowerCase();

  // Link an already-registered domain first instead of creating a duplicate.
  const list = await getManagementClient().domains.list();
  if (list.error) {
    throw new Error(list.error.message ?? "Failed to list Resend domains");
  }
  const existing = list.data?.data.find(
    (domain) => domain.name.toLowerCase() === normalized,
  );
  if (existing) {
    return { id: existing.id, name: existing.name, status: existing.status };
  }

  const created = await getManagementClient().domains.create({ name: normalized });
  if (!created.error && created.data) {
    return {
      id: created.data.id,
      name: created.data.name,
      status: created.data.status,
      records: created.data.records as ProviderDomainRecord[] | undefined,
    };
  }

  throw new Error(
    created.error?.message ?? `Failed to register domain "${name}" with Resend`,
  );
}

export async function getProviderDomain(id: string): Promise<ProviderDomain> {
  const { data, error } = await getManagementClient().domains.get(id);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch domain from Resend");
  }
  return { id: data.id, name: data.name, status: data.status };
}

export async function verifyProviderDomain(id: string): Promise<void> {
  const { error } = await getManagementClient().domains.verify(id);
  if (error) {
    throw new Error(error.message ?? "Failed to trigger domain verification");
  }
}
