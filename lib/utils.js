export function randomState() {
  return crypto.randomUUID().replace(/-/g, "");
}
