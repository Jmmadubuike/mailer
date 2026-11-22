export function isLastActiveOwner(
  activeOwnerCount: number,
  targetIsOwner: boolean,
): boolean {
  return targetIsOwner && activeOwnerCount <= 1;
}
