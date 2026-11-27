import "server-only";
import { promises as dns } from "node:dns";
import type { DmarcStatus } from "@/models/SendingDomain";

const DNS_TIMEOUT_MS = 4000;

export interface DmarcCheckResult {
  status: DmarcStatus;
  policy?: string;
  records?: string[];
}

export async function checkDmarc(domain: string): Promise<DmarcCheckResult> {
  const normalized = domain.trim().toLowerCase().replace(/\.$/, "");

  try {
    const records = await withTimeout(
      dns.resolveTxt(`_dmarc.${normalized}`),
      DNS_TIMEOUT_MS,
    );
    const flattened = records.flat();
    const txt = flattened.join("").trim();

    if (!txt) return { status: "missing", records: flattened };

    const policy = txt.match(/\bp\s*=\s*([a-z]+)/i)?.[1]?.toLowerCase();
    if (!policy) return { status: "invalid", records: flattened };

    return { status: "present", policy, records: flattened };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return { status: "missing" };
    }
    // A DNS failure here should never block domain verification.
    return { status: "unknown" };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("DNS lookup timed out");
      (error as NodeJS.ErrnoException).code = "ETIMEDOUT";
      reject(error);
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        clearTimeout(timer);
        reject(reason);
      },
    );
  });
}
