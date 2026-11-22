export type DeliveryErrorClass = "permanent" | "retryable";

export function classifyDeliveryError(message: string): DeliveryErrorClass {
  const lower = message.toLowerCase();
  const permanentMarkers = [
    "401",
    "403",
    "404",
    "invalid api key",
    "no api key",
    "unauthorized",
    "forbidden",
    "domain not verified",
    "not verified",
    "not allowed",
    "validation",
    "invalid sender",
    "from address",
    "allow-list",
    "allowlist",
    "sending domain not found",
    "sending domain unavailable",
  ];
  const retryableMarkers = [
    "429",
    "rate limit",
    "too many",
    "timeout",
    "timed out",
    "econn",
    "etimedout",
    "network",
    "service unavailable",
    "503",
    "502",
    "500",
  ];

  if (permanentMarkers.some((marker) => lower.includes(marker))) {
    return "permanent";
  }
  if (retryableMarkers.some((marker) => lower.includes(marker))) {
    return "retryable";
  }
  return "retryable";
}
