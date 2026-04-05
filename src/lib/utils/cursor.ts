export function makeOpaqueCursor(input: Record<string, string>) {
  return Buffer.from(JSON.stringify(input), "utf8").toString("base64");
}
