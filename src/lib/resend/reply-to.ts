export function resolveReplyTo(input: {
  message?: string;
  domain?: string;
  global?: string;
}): string | undefined {
  return input.message ?? input.domain ?? input.global;
}
